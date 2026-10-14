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
import { PrismaService } from "../prisma/prisma.service";
import { CreateFavoriteDto, ListFavoritesQuery } from "./dto";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller("favorites")
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(
    @CurrentUser() user: { id: string },
    @Query() query: ListFavoritesQuery,
  ) {
    const take = Math.min(query.limit ?? 20, 100);
    const skip = Math.max(query.offset ?? 0, 0);
    const rows = await this.prisma.favorite.findMany({
      where: { userId: user.id },
      include: { question: true },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
    return {
      items: rows.map((f) => ({
        questionId: f.question.id,
        chapterId: f.question.chapterId,
        no: f.question.no,
        type: f.question.type,
        stem: f.question.stem,
        options: f.question.options,
        createdAt: f.createdAt,
      })),
    };
  }

  @Post()
  async add(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateFavoriteDto,
  ) {
    const found = await this.prisma.question.findFirst({
      where: { id: dto.questionId, status: "published" },
    });
    if (!found) {
      throw new NotFoundException("题目不存在");
    }
    await this.prisma.favorite.upsert({
      where: {
        userId_questionId: { userId: user.id, questionId: dto.questionId },
      },
      create: { userId: user.id, questionId: dto.questionId },
      update: {},
    });
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
    await this.prisma.favorite.deleteMany({
      where: { userId: user.id, questionId: qid },
    });
    return { ok: true };
  }
}
