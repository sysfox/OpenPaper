import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { ListQuestionsQuery } from "./dto";

const PUBLIC_FIELDS =
  "id, chapter_id AS chapterId, no, type, stem, options, version, status";

const publicSelect = {
  id: true,
  chapterId: true,
  no: true,
  type: true,
  stem: true,
  options: true,
  version: true,
  status: true,
} as const;

const fullSelect = {
  id: true,
  chapterId: true,
  no: true,
  type: true,
  stem: true,
  options: true,
  answer: true,
  analysis: true,
  version: true,
  status: true,
} as const;

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

function toFull(
  row: {
    answer: unknown;
  } & Record<string, unknown>,
) {
  return { ...row, correctAnswer: row.answer };
}

@Controller("questions")
export class QuestionsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@Query() query: ListQuestionsQuery) {
    const limit = query.limit ?? 20;
    const cursor = query.cursor ?? 0;
    const mode = query.mode ?? "seq";
    if (mode === "random") {
      const excludeIds = parseExcludeIds(query.excludeIds);
      const excluded = excludeIds.length ? excludeIds : null;
      if (query.chapterId) {
        const items = await this.prisma.$queryRaw<
          Record<string, unknown>[]
        >`SELECT ${Prisma.raw(PUBLIC_FIELDS)} FROM questions
           WHERE chapter_id = ${query.chapterId}::uuid AND status = 'published'
             AND (${excluded}::uuid[] IS NULL OR id <> ALL (${excluded}))
           ORDER BY random() LIMIT ${limit}`;
        return { items, nextCursor: null };
      }
      const items = await this.prisma.$queryRaw<
        Record<string, unknown>[]
      >`SELECT ${Prisma.raw(PUBLIC_FIELDS)} FROM questions
         WHERE status = 'published'
           AND (${excluded}::uuid[] IS NULL OR id <> ALL (${excluded}))
         ORDER BY random() LIMIT ${limit}`;
      return { items, nextCursor: null };
    }
    const rows = await this.prisma.question.findMany({
      select: publicSelect,
      where: {
        status: "published",
        no: { gt: cursor },
        ...(query.chapterId ? { chapterId: query.chapterId } : {}),
      },
      orderBy: { no: "asc" },
      take: limit + 1,
    });
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
    const row = await this.prisma.question.findFirst({
      select: fullSelect,
      where: { no: Number(no), status: "published" },
    });
    if (!row) {
      throw new NotFoundException("题目不存在");
    }
    return toFull(row);
  }

  @Get("no/:no")
  async byNo(@Param("no") no: string) {
    const row = await this.prisma.question.findFirst({
      select: publicSelect,
      where: { no: Number(no), status: "published" },
    });
    if (!row) {
      throw new NotFoundException("题目不存在");
    }
    return row;
  }

  @Get(":id/detail")
  @UseGuards(JwtAuthGuard)
  async detailFull(@Param("id") id: string) {
    const row = await this.prisma.question.findFirst({
      select: fullSelect,
      where: { id, status: "published" },
    });
    if (!row) {
      throw new NotFoundException("题目不存在");
    }
    return toFull(row);
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    const row = await this.prisma.question.findFirst({
      select: publicSelect,
      where: { id, status: "published" },
    });
    if (!row) {
      throw new NotFoundException("题目不存在");
    }
    return row;
  }
}
