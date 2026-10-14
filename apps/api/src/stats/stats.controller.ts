import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/current-user.decorator";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { getMastery, setMastery } from "../common/mastery-cache";
import { DbService } from "../db/db.service";

@Controller("me")
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private db: DbService) {}

  @Get("stats")
  async stats(@CurrentUser() user: { id: string }) {
    const totalRes = await this.db.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM attempts WHERE user_id = $1",
      [user.id],
    );
    const latestRes = await this.db.query<{ score: number }>(
      `SELECT DISTINCT ON (question_id) score FROM attempts
       WHERE user_id = $1 ORDER BY question_id, created_at DESC`,
      [user.id],
    );
    const questions = latestRes.rows.length;
    const full = latestRes.rows.filter((row) => row.score >= 100).length;
    const chaptersRes = await this.db.query<{
      id: string;
      code: string;
      title: string;
      total: number;
      done: number;
      points: number;
    }>(
      `WITH latest AS (
         SELECT DISTINCT ON (question_id) question_id, score FROM attempts
         WHERE user_id = $1 ORDER BY question_id, created_at DESC
       )
       SELECT c.id, c.code, c.title,
              COUNT(q.id)::int AS total,
              COUNT(l.question_id)::int AS done,
              COALESCE(SUM(CASE WHEN l.score >= 100 THEN 1
                                WHEN l.score >= 50 THEN 0.5
                                ELSE 0 END), 0)::float AS points
       FROM chapters c
       LEFT JOIN questions q
         ON q.chapter_id = c.id AND q.status = 'published'
       LEFT JOIN latest l ON l.question_id = q.id
       GROUP BY c.id, c.code, c.title, c.sort
       ORDER BY c.sort, c.code`,
      [user.id],
    );
    const chapters: Array<{
      chapterId: string;
      code: string;
      title: string;
      total: number;
      done: number;
      mastery: number;
    }> = [];
    for (const chapter of chaptersRes.rows) {
      const total = chapter.total;
      const done = chapter.done;
      let mastery = getMastery(user.id, chapter.id);
      if (total === 0) {
        mastery = 0;
      } else if (mastery === null) {
        mastery = Math.round((chapter.points / total) * 100) / 100;
        setMastery(user.id, chapter.id, mastery);
      }
      chapters.push({
        chapterId: chapter.id,
        code: chapter.code,
        title: chapter.title,
        total,
        done,
        mastery,
      });
    }
    return {
      attempts: Number(totalRes.rows[0]?.count ?? 0),
      questions,
      fullRate: questions ? Math.round((full / questions) * 100) / 100 : 0,
      chapters,
    };
  }
}
