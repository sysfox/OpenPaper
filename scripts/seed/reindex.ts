import { Pool } from "pg";
import {
  algoliaEnabled,
  algoliaIndexName,
  replaceIndex,
  type SearchRecord,
} from "./search.js";

interface QuestionRow {
  id: string;
  no: number;
  type: string;
  stem: string;
  options: unknown;
  chapterCode: string;
  chapter: string;
  course: string;
}

async function main(): Promise<void> {
  if (!algoliaEnabled()) {
    console.log("未配置 ALGOLIA_APP_ID / ALGOLIA_API_KEY，跳过重建索引");
    return;
  }
  if (!process.env.DATABASE_URL) {
    console.error("缺少 DATABASE_URL");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const result = await pool.query<QuestionRow>(
      `SELECT q.id, q.no, q.type, q.stem, q.options,
              c.code AS "chapterCode", c.title AS chapter, co.slug AS course
       FROM questions q
       JOIN chapters c ON c.id = q.chapter_id
       JOIN courses co ON co.id = c.course_id
       WHERE q.status = 'published'
       ORDER BY q.no`,
    );
    const records: SearchRecord[] = result.rows.map((row) => ({
      objectID: row.id,
      no: row.no,
      type: row.type,
      stem: row.stem,
      options: Array.isArray(row.options) ? (row.options as string[]) : [],
      chapterCode: row.chapterCode,
      chapter: row.chapter,
      course: row.course,
    }));
    const count = await replaceIndex(records);
    console.log(`重建索引 ${algoliaIndexName()}，共 ${count} 条`);
  } finally {
    await pool.end();
  }
}

void main();
