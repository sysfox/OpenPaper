import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { DbService } from "../db/db.service";
import { ListQuestionsQuery } from "./dto";

const PUBLIC_FIELDS =
  "id, chapter_id AS chapterId, no, type, stem, options, version, status";

const FULL_FIELDS =
  "id, chapter_id AS chapterId, no, type, stem, options, answer, answer AS correctAnswer, analysis, version, status";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseExcludeIds(raw?: string) {
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => UUID_RE.test(item));
}

@Controller("questions")
export class QuestionsController {
  constructor(private db: DbService) {}

  @Get()
  async list(@Query() query: ListQuestionsQuery) {
    const limit = query.limit ?? 20;
    const cursor = query.cursor ?? 0;
    const mode = query.mode ?? "seq";
    if (mode === "random") {
      const excludeIds = parseExcludeIds(query.excludeIds);
      if (query.chapterId) {
        const result = await this.db.query(
          `SELECT ${PUBLIC_FIELDS} FROM questions
           WHERE chapter_id = $1 AND status = 'published'
             AND ($3::uuid[] IS NULL OR id <> ALL ($3))
           ORDER BY random() LIMIT $2`,
          [query.chapterId, limit, excludeIds.length ? excludeIds : null],
        );
        return { items: result.rows, nextCursor: null };
      }
      const result = await this.db.query(
        `SELECT ${PUBLIC_FIELDS} FROM questions
         WHERE status = 'published'
           AND ($2::uuid[] IS NULL OR id <> ALL ($2))
         ORDER BY random() LIMIT $1`,
        [limit, excludeIds.length ? excludeIds : null],
      );
      return { items: result.rows, nextCursor: null };
    }
    const whereChapter = query.chapterId ? "AND chapter_id = $3" : "";
    const params = query.chapterId
      ? [cursor, limit + 1, query.chapterId]
      : [cursor, limit + 1];
    const result = await this.db.query(
      `SELECT ${PUBLIC_FIELDS} FROM questions
       WHERE status = 'published' AND no > $1 ${whereChapter}
       ORDER BY no ASC LIMIT $2`,
      params,
    );
    const rows = result.rows;
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && items.length > 0
        ? (items[items.length - 1] as { no: number }).no
        : null;
    return { items, nextCursor };
  }

  @Get("no/:no/detail")
  @UseGuards(JwtAuthGuard)
  async byNoDetail(@Param("no") no: string) {
    const result = await this.db.query(
      `SELECT ${FULL_FIELDS}
        FROM questions WHERE no = $1 AND status = 'published'`,
      [Number(no)],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException("题目不存在");
    }
    return row;
  }

  @Get("no/:no")
  async byNo(@Param("no") no: string) {
    const result = await this.db.query(
      `SELECT ${PUBLIC_FIELDS}
        FROM questions WHERE no = $1 AND status = 'published'`,
      [Number(no)],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException("题目不存在");
    }
    return row;
  }

  @Get(":id/detail")
  @UseGuards(JwtAuthGuard)
  async detailFull(@Param("id") id: string) {
    const result = await this.db.query(
      `SELECT ${FULL_FIELDS}
        FROM questions WHERE id = $1 AND status = 'published'`,
      [id],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException("题目不存在");
    }
    return row;
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    const result = await this.db.query(
      `SELECT ${PUBLIC_FIELDS}
        FROM questions WHERE id = $1 AND status = 'published'`,
      [id],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException("题目不存在");
    }
    return row;
  }
}
