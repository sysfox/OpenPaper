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
import { PrismaService } from "../prisma/prisma.service";
import { ListMistakesQuery, UpdateMistakeDto } from "./dto";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller("mistakes")
@UseGuards(JwtAuthGuard)
export class MistakesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(
    @CurrentUser() user: { id: string },
    @Query() query: ListMistakesQuery,
  ) {
    if (query.ids !== undefined) {
      const ids = query.ids
        .split(",")
        .map((item) => item.trim())
        .filter((item) => UUID_RE.test(item));
      if (ids.length === 0) {
        return { items: [] };
      }
      const rows = await this.prisma.mistake.findMany({
        where: { userId: user.id, questionId: { in: ids } },
        include: { question: true },
        orderBy: { updatedAt: "desc" },
      });
      return {
        items: rows.map((m) => ({
          questionId: m.question.id,
          chapterId: m.question.chapterId,
          no: m.question.no,
          type: m.question.type,
          stem: m.question.stem,
          options: m.question.options,
          wrongCount: m.wrongCount,
          mastered: m.mastered,
          updatedAt: m.updatedAt,
        })),
      };
    }
    const take = Math.min(query.limit ?? 20, 100);
    const skip = Math.max(query.offset ?? 0, 0);
    const rows = await this.prisma.mistake.findMany({
      where: { userId: user.id },
      include: { question: true },
      orderBy: { updatedAt: "desc" },
      take,
      skip,
    });
    return {
      items: rows.map((m) => ({
        questionId: m.question.id,
        chapterId: m.question.chapterId,
        no: m.question.no,
        type: m.question.type,
        stem: m.question.stem,
        options: m.question.options,
        wrongCount: m.wrongCount,
        mastered: m.mastered,
        updatedAt: m.updatedAt,
      })),
    };
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
    const result = await this.prisma.mistake.updateMany({
      where: { userId: user.id, questionId: qid },
      data: { mastered: dto.mastered },
    });
    if (result.count === 0) {
      throw new NotFoundException("错题不存在");
    }
    return { ok: true, mastered: dto.mastered };
  }
}
