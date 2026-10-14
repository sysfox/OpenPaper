import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { parseSeed } from "./parse.js";
import { algoliaEnabled, pushRecords, type SearchRecord } from "./search.js";

const seedDir = dirname(fileURLToPath(import.meta.url));
const seedFile = join(seedDir, "questions.md");
const courseSlug = process.env.COURSE_SLUG || "nuclear-science";

async function ensureCourse(
  prisma: PrismaClient,
  title: string,
): Promise<string> {
  const found = await prisma.course.findFirst({
    where: { slug: courseSlug },
  });
  if (found) return found.id;
  const created = await prisma.course.create({
    data: {
      title: title || "走进核科学技术",
      slug: courseSlug,
      status: "published",
    },
  });
  return created.id;
}

async function ensureChapter(
  prisma: PrismaClient,
  courseId: string,
  code: string,
  title: string,
): Promise<string> {
  const found = await prisma.chapter.findFirst({
    where: { courseId, code },
  });
  if (found) return found.id;
  const created = await prisma.chapter.create({
    data: {
      courseId,
      code,
      title: title || code,
      sort: Number.parseFloat(code) || 0,
    },
  });
  return created.id;
}

async function main(): Promise<void> {
  if (!existsSync(seedFile)) {
    console.log("未找到 seed/questions.md，先复制 questions.md.example 再导入");
    return;
  }
  if (!process.env.DATABASE_URL) {
    console.error("缺少 DATABASE_URL");
    process.exit(1);
  }
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });
  try {
    const doc = parseSeed(readFileSync(seedFile, "utf8"));
    const courseId = await ensureCourse(prisma, doc.courseTitle);
    const records: SearchRecord[] = [];
    const chapterCache = new Map<string, string>();
    let upserted = 0;
    for (const q of doc.questions) {
      const code = q.chapterCode || "0";
      const title = q.chapterTitle || code;
      let chapterId = chapterCache.get(code);
      if (!chapterId) {
        chapterId = await ensureChapter(prisma, courseId, code, title);
        chapterCache.set(code, chapterId);
      }
      const options = q.type === "judge" ? ["对", "错"] : q.options;
      const saved = await prisma.question.upsert({
        where: { no: q.no },
        update: {
          chapterId,
          type: q.type,
          stem: q.stem,
          options,
          answer: q.answer,
          analysis: q.analysis,
          status: "published",
          version: { increment: 1 },
        },
        create: {
          chapterId,
          no: q.no,
          type: q.type,
          stem: q.stem,
          options,
          answer: q.answer,
          analysis: q.analysis,
          status: "published",
        },
      });
      upserted += 1;
      records.push({
        objectID: saved.id,
        no: q.no,
        type: q.type,
        stem: q.stem,
        options,
        chapterCode: code,
        chapter: title,
        course: courseSlug,
      });
    }
    if (!algoliaEnabled()) {
      console.log(`导入 ${upserted} 题，未配置 Algolia，跳过索引推送`);
      return;
    }
    try {
      const result = await pushRecords(records);
      console.log(`导入 ${upserted} 题，推送索引 ${result.pushed} 条`);
    } catch {
      for (const record of records) {
        await prisma.syncQueue.create({
          data: {
            questionId: record.objectID,
            op: "upsert",
            status: "pending",
          },
        });
      }
      console.log(`导入 ${upserted} 题，索引推送失败，已写入 sync_queue`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main();
