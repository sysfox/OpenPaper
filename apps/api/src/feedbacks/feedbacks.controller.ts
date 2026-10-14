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
import { PrismaService } from "../prisma/prisma.service";
import { CreateFeedbackDto, ListFeedbacksQuery } from "./dto";

@Controller("feedbacks")
@UseGuards(JwtAuthGuard)
export class FeedbacksController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(
    @CurrentUser() user: { id: string },
    @Query() query: ListFeedbacksQuery,
  ) {
    const take = Math.min(query.limit ?? 20, 100);
    const skip = Math.max(query.offset ?? 0, 0);
    const rows = await this.prisma.feedback.findMany({
      where: { userId: user.id },
      include: { question: { select: { no: true } } },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
    return {
      items: rows.map((f) => ({
        id: f.id,
        questionId: f.questionId,
        questionNo: f.question?.no ?? null,
        content: f.content,
        status: f.status,
        createdAt: f.createdAt,
      })),
    };
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
    const found = await this.prisma.question.findFirst({
      where: { id: dto.questionId, status: "published" },
    });
    if (!found) {
      throw new NotFoundException("题目不存在");
    }
    const created = await this.prisma.feedback.create({
      data: { userId: user.id, questionId: dto.questionId, content },
    });
    return {
      id: created.id,
      questionId: created.questionId,
      content: created.content,
      status: created.status,
      createdAt: created.createdAt,
    };
  }
}
