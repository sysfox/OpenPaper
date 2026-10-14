import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { grade, QuestionType } from "@openpaper/shared";
import { invalidateMastery } from "../common/mastery-cache";
import { DbService } from "../db/db.service";

interface QuestionRow {
  id: string;
  chapter_id: string;
  type: QuestionType;
  answer: Array<string | number>;
  analysis: string;
  version: number;
}

@Injectable()
export class AttemptsService {
  constructor(private db: DbService) {}

  async submit(
    userId: string,
    questionId: string,
    picked: Array<string | number>,
    clientVersion: number,
  ) {
    const found = await this.db.query<QuestionRow>(
      "SELECT id, chapter_id, type, answer, analysis, version FROM questions WHERE id = $1 AND status = 'published'",
      [questionId],
    );
    const question = found.rows[0];
    if (!question) {
      throw new NotFoundException("题目不存在");
    }
    const answer = Array.isArray(question.answer) ? question.answer : [];
    const result = grade(question.type, answer, picked ?? []);
    await this.db.query(
      `INSERT INTO attempts (user_id, question_id, version, picked, score, is_full)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        questionId,
        clientVersion,
        JSON.stringify(picked ?? []),
        result.score,
        result.isFull,
      ],
    );
    if (result.score < 100) {
      await this.db.query(
        `INSERT INTO mistakes (user_id, question_id, wrong_count, mastered, updated_at)
         VALUES ($1, $2, 1, FALSE, now())
         ON CONFLICT (user_id, question_id)
         DO UPDATE SET wrong_count = mistakes.wrong_count + 1, mastered = FALSE, updated_at = now()`,
        [userId, questionId],
      );
    } else {
      await this.db.query(
        `UPDATE mistakes SET mastered = TRUE, updated_at = now()
         WHERE user_id = $1 AND question_id = $2`,
        [userId, questionId],
      );
    }
    invalidateMastery(userId, question.chapter_id);
    return {
      score: result.score,
      isFull: result.isFull,
      correctAnswer: answer,
      analysis: question.analysis,
    };
  }
}
