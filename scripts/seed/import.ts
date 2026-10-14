import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { parseSeed } from "./parse.js";
import { algoliaEnabled, pushRecords, type SearchRecord } from "./search.js";

const seedDir = dirname(fileURLToPath(import.meta.url));
const seedFile = join(seedDir, "questions.md");
const courseSlug = process.env.COURSE_SLUG || "nuclear-science";

async function ensureCourse(pool: Pool, title: string): Promise<string> {
  const found = await pool.query<{ id: string }>(
    "SELECT id FROM courses WHERE slug = $1",
    [courseSlug],
  );
  if (found.rowCount && found.rows[0]) return found.rows[0].id;
  const created = await pool.query<{ id: string }>(
    "INSERT INTO courses (title, slug, status) VALUES ($1, $2, 'published') RETURNING id",
    [title || "走进核科学技术", courseSlug],
  );
  return created.rows[0].id;
}

async function ensureChapter(
  pool: Pool,
  courseId: string,
  code: string,
  title: string,
): Promise<string> {
  const found = await pool.query<{ id: string }>(
    "SELECT id FROM chapters WHERE course_id = $1 AND code = $2",
    [courseId, code],
  );
  if (found.rowCount && found.rows[0]) return found.rows[0].id;
  const created = await pool.query<{ id: string }>(
    "INSERT INTO chapters (course_id, code, title, sort) VALUES ($1, $2, $3, $4) RETURNING id",
    [courseId, code, title || code, Number.parseFloat(code) || 0],
  );
  return created.rows[0].id;
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
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const doc = parseSeed(readFileSync(seedFile, "utf8"));
    const courseId = await ensureCourse(pool, doc.courseTitle);
    const records: SearchRecord[] = [];
    const chapterCache = new Map<string, string>();
    let upserted = 0;
    for (const q of doc.questions) {
      const code = q.chapterCode || "0";
      const title = q.chapterTitle || code;
      let chapterId = chapterCache.get(code);
      if (!chapterId) {
        chapterId = await ensureChapter(pool, courseId, code, title);
        chapterCache.set(code, chapterId);
      }
      const options = q.type === "judge" ? ["对", "错"] : q.options;
      const saved = await pool.query<{ id: string }>(
        `INSERT INTO questions (chapter_id, no, type, stem, options, answer, analysis, status)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, 'published')
         ON CONFLICT (no) DO UPDATE SET
           chapter_id = EXCLUDED.chapter_id,
           type = EXCLUDED.type,
           stem = EXCLUDED.stem,
           options = EXCLUDED.options,
           answer = EXCLUDED.answer,
           analysis = EXCLUDED.analysis,
           status = 'published',
           version = questions.version + 1
         RETURNING id`,
        [
          chapterId,
          q.no,
          q.type,
          q.stem,
          JSON.stringify(options),
          JSON.stringify(q.answer),
          q.analysis,
        ],
      );
      upserted += 1;
      records.push({
        objectID: saved.rows[0].id,
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
        await pool.query(
          "INSERT INTO sync_queue (question_id, op, status) VALUES ($1, 'upsert', 'pending')",
          [record.objectID],
        );
      }
      console.log(`导入 ${upserted} 题，索引推送失败，已写入 sync_queue`);
    }
  } finally {
    await pool.end();
  }
}

void main();
