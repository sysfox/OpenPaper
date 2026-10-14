import { PrismaClient } from "@prisma/client";
import { pushRecords, type SearchRecord } from "./search.js";

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error("缺少 DATABASE_URL");
    process.exit(1);
  }
  const BATCH = Number(process.env.SYNC_BATCH || 100);
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });
  try {
    const pending = await prisma.syncQueue.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      take: BATCH,
    });
    if (!pending.length) {
      console.log("sync_queue 无待重试任务");
      return;
    }
    const rowIds = pending.map((row) => row.id);
    const questionIds = pending
      .map((row) => row.questionId)
      .filter((id): id is string => Boolean(id));
    let records: SearchRecord[] = [];
    if (questionIds.length) {
      const questions = await prisma.question.findMany({
        where: { id: { in: questionIds }, status: "published" },
        include: { chapter: { include: { course: true } } },
      });
      records = questions.map((row) => ({
        objectID: row.id,
        no: row.no,
        type: row.type,
        stem: row.stem,
        options: Array.isArray(row.options) ? (row.options as string[]) : [],
        chapterCode: row.chapter.code,
        chapter: row.chapter.title,
        course: row.chapter.course.slug,
      }));
    }
    try {
      await pushRecords(records);
    } catch {
      await prisma.syncQueue.updateMany({
        where: { id: { in: rowIds } },
        data: { retries: { increment: 1 } },
      });
      console.log(`重推失败，${pending.length} 条保留在 sync_queue`);
      process.exit(1);
    }
    await prisma.syncQueue.updateMany({
      where: { id: { in: rowIds } },
      data: { status: "done" },
    });
    console.log(`重推成功 ${records.length} 条`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
