import { Pool } from "pg";
import { pushRecords, type SearchRecord } from "./search.js";

interface QueueRow {
  id: string;
  question_id: string | null;
}

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
  if (!process.env.DATABASE_URL) {
    console.error("缺少 DATABASE_URL");
    process.exit(1);
  }
  const BATCH = Number(process.env.SYNC_BATCH || 100);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const pending = await pool.query<QueueRow>(
      "SELECT id, question_id FROM sync_queue WHERE status = 'pending' ORDER BY created_at LIMIT $1",
      [BATCH],
    );
    if (!pending.rowCount) {
      console.log("sync_queue 无待重试任务");
      return;
    }
    const rowIds = pending.rows.map((row) => row.id);
    const questionIds = pending.rows
      .map((row) => row.question_id)
      .filter((id): id is string => Boolean(id));
    let records: SearchRecord[] = [];
    if (questionIds.length) {
      const questions = await pool.query<QuestionRow>(
        `SELECT q.id, q.no, q.type, q.stem, q.options,
                c.code AS "chapterCode", c.title AS chapter, co.slug AS course
         FROM questions q
         JOIN chapters c ON c.id = q.chapter_id
         JOIN courses co ON co.id = c.course_id
         WHERE q.id = ANY ($1) AND q.status = 'published'`,
        [questionIds],
      );
      records = questions.rows.map((row) => ({
        objectID: row.id,
        no: row.no,
        type: row.type,
        stem: row.stem,
        options: Array.isArray(row.options) ? (row.options as string[]) : [],
        chapterCode: row.chapterCode,
        chapter: row.chapter,
        course: row.course,
      }));
    }
    try {
      await pushRecords(records);
    } catch {
      await pool.query(
        "UPDATE sync_queue SET retries = retries + 1 WHERE id = ANY ($1)",
        [rowIds],
      );
      console.log(`重推失败，${pending.rowCount} 条保留在 sync_queue`);
      process.exit(1);
    }
    await pool.query(
      "UPDATE sync_queue SET status = 'done' WHERE id = ANY ($1)",
      [rowIds],
    );
    console.log(`重推成功 ${records.length} 条`);
  } finally {
    await pool.end();
  }
}

void main();
