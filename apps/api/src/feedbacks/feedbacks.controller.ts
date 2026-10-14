import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../common/current-user.decorator";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { DbService } from "../db/db.service";
import { CreateFeedbackDto, ListFeedbacksQuery } from "./dto";

@Controller("feedbacks")
@UseGuards(JwtAuthGuard)
export class FeedbacksController {
  constructor(private db: DbService) {}

  @Get()
  async list(
    @CurrentUser() user: { id: string },
    @Query() query: ListFeedbacksQuery,
  ) {
    const limit = Math.min(query.limit ?? 20, 100);
    const offset = Math.max(query.offset ?? 0, 0);
    const result = await this.db.query(
      `SELECT f.id, f.question_id AS questionId, q.no AS "questionNo",
              f.content, f.status, f.created_at AS createdAt
       FROM feedbacks f LEFT JOIN questions q ON q.id = f.question_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [user.id, limit, offset],
    );
    return { items: result.rows };
  }

  @Post()
  async add(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateFeedbackDto,
  ) {
    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException("内容不能为空");
    }
    const found = await this.db.query(
      "SELECT id FROM questions WHERE id = $1 AND status = 'published'",
      [dto.questionId],
    );
    if (found.rowCount === 0) {
      throw new NotFoundException("题目不存在");
    }
    const created = await this.db.query(
      `INSERT INTO feedbacks (user_id, question_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, question_id AS questionId, content,
                 status, created_at AS createdAt`,
      [user.id, dto.questionId, content],
    );
    return created.rows[0];
  }
}
