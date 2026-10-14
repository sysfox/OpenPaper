import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../common/current-user.decorator";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { DbService } from "../db/db.service";
import { CreateFavoriteDto, ListFavoritesQuery } from "./dto";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller("favorites")
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private db: DbService) {}

  @Get()
  async list(
    @CurrentUser() user: { id: string },
    @Query() query: ListFavoritesQuery,
  ) {
    const limit = Math.min(query.limit ?? 20, 100);
    const offset = Math.max(query.offset ?? 0, 0);
    const result = await this.db.query(
      `SELECT q.id AS questionId, q.chapter_id AS chapterId, q.no,
              q.type, q.stem, q.options, f.created_at AS createdAt
       FROM favorites f JOIN questions q ON q.id = f.question_id
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
    @Body() dto: CreateFavoriteDto,
  ) {
    const found = await this.db.query(
      "SELECT id FROM questions WHERE id = $1 AND status = 'published'",
      [dto.questionId],
    );
    if (found.rowCount === 0) {
      throw new NotFoundException("题目不存在");
    }
    await this.db.query(
      `INSERT INTO favorites (user_id, question_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [user.id, dto.questionId],
    );
    return { ok: true };
  }

  @Delete(":qid")
  async remove(
    @CurrentUser() user: { id: string },
    @Param("qid") qid: string,
  ) {
    if (!UUID_RE.test(qid)) {
      throw new BadRequestException("题目参数不对");
    }
    await this.db.query(
      "DELETE FROM favorites WHERE user_id = $1 AND question_id = $2",
      [user.id, qid],
    );
    return { ok: true };
  }
}
