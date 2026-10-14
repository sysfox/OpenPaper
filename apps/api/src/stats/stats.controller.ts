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
    }>(
      "SELECT id, code, title FROM chapters ORDER BY sort, code",
      [],
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
      const qRes = await this.db.query<{ id: string }>(
        "SELECT id FROM questions WHERE chapter_id = $1 AND status = 'published'",
        [chapter.id],
      );
      const total = qRes.rowCount ?? qRes.rows.length;
      let done = 0;
      let mastery = getMastery(user.id, chapter.id);
      if (total === 0) {
        mastery = 0;
      } else {
        const ids = qRes.rows.map((row) => row.id);
        const aRes = await this.db.query<{ score: number }>(
          `SELECT DISTINCT ON (question_id) score FROM attempts
           WHERE user_id = $1 AND question_id = ANY ($2)
           ORDER BY question_id, created_at DESC`,
          [user.id, ids],
        );
        done = aRes.rows.length;
        if (mastery === null) {
          let points = 0;
          for (const row of aRes.rows) {
            if (row.score >= 100) {
              points += 1;
            } else if (row.score >= 50) {
              points += 0.5;
            }
          }
          mastery = Math.round((points / total) * 100) / 100;
          setMastery(user.id, chapter.id, mastery);
        }
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
