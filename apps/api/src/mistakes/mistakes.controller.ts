import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../common/current-user.decorator";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { DbService } from "../db/db.service";
import { ListMistakesQuery, UpdateMistakeDto } from "./dto";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller("mistakes")
@UseGuards(JwtAuthGuard)
export class MistakesController {
  constructor(private db: DbService) {}

  @Get()
  async list(
    @CurrentUser() user: { id: string },
    @Query() query: ListMistakesQuery,
  ) {
    const params: unknown[] = [user.id];
    let extra = "";
    if (query.ids !== undefined) {
      const ids = query.ids
        .split(",")
        .map((item) => item.trim())
        .filter((item) => UUID_RE.test(item));
      if (ids.length === 0) {
        return { items: [] };
      }
      params.push(ids);
      extra = "AND m.question_id = ANY ($2)";
    }
    const result = await this.db.query(
      `SELECT q.id AS questionId, q.chapter_id AS chapterId, q.no,
              q.type, q.stem, q.options, m.wrong_count AS wrongCount,
              m.mastered, m.updated_at AS updatedAt
       FROM mistakes m JOIN questions q ON q.id = m.question_id
       WHERE m.user_id = $1 ${extra}
       ORDER BY m.updated_at DESC`,
      params,
    );
    return { items: result.rows };
  }

  @Patch(":qid")
  async update(
    @CurrentUser() user: { id: string },
    @Param("qid") qid: string,
    @Body() dto: UpdateMistakeDto,
  ) {
    if (!UUID_RE.test(qid)) {
      throw new BadRequestException("题目参数不对");
    }
    const result = await this.db.query(
      `UPDATE mistakes SET mastered = $3, updated_at = now()
       WHERE user_id = $1 AND question_id = $2`,
      [user.id, qid, dto.mastered],
    );
    if (result.rowCount === 0) {
      throw new NotFoundException("错题不存在");
    }
    return { ok: true, mastered: dto.mastered };
  }
}
