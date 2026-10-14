import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/current-user.decorator";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { getMastery, setMastery } from "../common/mastery-cache";
import { PrismaService } from "../prisma/prisma.service";
import { ProgressQuery } from "./dto";

@Controller("progress")
export class ProgressController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async byChapter(
    @CurrentUser() user: { id: string },
    @Query() query: ProgressQuery,
  ) {
    const chapterId = query.chapterId;
    if (!chapterId) {
      return { total: 0, done: 0, lastNo: null, mastery: 0 };
    }
    const questions = await this.prisma.question.findMany({
      where: { chapterId, status: "published" },
      select: { id: true, no: true },
    });
    if (questions.length === 0) {
      return { total: 0, done: 0, lastNo: null, mastery: 0 };
    }
    const ids = questions.map((row) => row.id);
    const attempts = await this.prisma.attempt.findMany({
      where: { userId: user.id, questionId: { in: ids } },
      orderBy: { createdAt: "desc" },
    });
    const latest = new Map<string, (typeof attempts)[number]>();
    for (const row of attempts) {
      if (!latest.has(row.questionId)) {
        latest.set(row.questionId, row);
      }
    }
    let lastNo: number | null = null;
    let lastTime = "";
    for (const question of questions) {
      const attempt = latest.get(question.id);
      if (!attempt) {
        continue;
      }
      const createdAt =
        attempt.createdAt instanceof Date
          ? attempt.createdAt.toISOString()
          : String(attempt.createdAt);
      if (createdAt >= lastTime) {
        lastTime = createdAt;
        lastNo = question.no;
      }
    }
    const total = questions.length;
    let mastery = getMastery(user.id, chapterId);
    if (mastery === null) {
      let points = 0;
      for (const question of questions) {
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
