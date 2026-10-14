import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/current-user.decorator";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { getMastery, setMastery } from "../common/mastery-cache";
import { DbService } from "../db/db.service";

@Controller("progress")
export class ProgressController {
  constructor(private db: DbService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async byChapter(
    @CurrentUser() user: { id: string },
    @Query("chapterId") chapterId: string,
  ) {
    if (!chapterId) {
      return { total: 0, done: 0, lastNo: null, mastery: 0 };
    }
    const questions = await this.db.query<{ id: string; no: number }>(
      "SELECT id, no FROM questions WHERE chapter_id = $1 AND status = 'published'",
      [chapterId],
    );
    if (questions.rowCount === 0) {
      return { total: 0, done: 0, lastNo: null, mastery: 0 };
    }
    const ids = questions.rows.map((row) => row.id);
    const attempts = await this.db.query<{
      question_id: string;
      score: number;
      created_at: string;
    }>(
      `SELECT DISTINCT ON (question_id) question_id, score, created_at
       FROM attempts WHERE user_id = $1 AND question_id = ANY ($2)
       ORDER BY question_id, created_at DESC`,
      [user.id, ids],
    );
    const latest = new Map(attempts.rows.map((row) => [row.question_id, row]));
    let lastNo: number | null = null;
    let lastTime = "";
    for (const question of questions.rows) {
      const attempt = latest.get(question.id);
      if (!attempt) {
        continue;
      }
      if (attempt.created_at >= lastTime) {
        lastTime = attempt.created_at;
        lastNo = question.no;
      }
    }
    const total = questions.rowCount ?? questions.rows.length;
    let mastery = getMastery(user.id, chapterId);
    if (mastery === null) {
      let points = 0;
      for (const question of questions.rows) {
        const attempt = latest.get(question.id);
        if (!attempt) {
          continue;
        }
        if (attempt.score >= 100) {
          points += 1;
        } else if (attempt.score >= 50) {
          points += 0.5;
        }
      }
      mastery = total ? Math.round((points / total) * 100) / 100 : 0;
      setMastery(user.id, chapterId, mastery);
    }
    return {
      total,
      done: latest.size,
      lastNo,
      mastery,
    };
  }
}
