import { PrismaClient } from "@prisma/client";
import {
  algoliaEnabled,
  algoliaIndexName,
  replaceIndex,
  type SearchRecord,
} from "./search.js";

async function main(): Promise<void> {
  if (!algoliaEnabled()) {
    console.log("未配置 ALGOLIA_APP_ID / ALGOLIA_ADMIN_KEY（兼容 ALGOLIA_API_KEY），跳过重建索引");
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
    const questions = await prisma.question.findMany({
      where: { status: "published" },
      include: { chapter: { include: { course: true } } },
      orderBy: { no: "asc" },
    });
    const records: SearchRecord[] = questions.map((row) => ({
      objectID: row.id,
      no: row.no,
      type: row.type,
      stem: row.stem,
      options: Array.isArray(row.options) ? (row.options as string[]) : [],
      chapterCode: row.chapter.code,
      chapter: row.chapter.title,
      course: row.chapter.course.slug,
    }));
    const count = await replaceIndex(records);
    console.log(`重建索引 ${algoliaIndexName()}，共 ${count} 条`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
