import { Injectable, NotFoundException } from "@nestjs/common";
import { grade, QuestionType } from "@openpaper/shared";
import { invalidateMastery } from "../common/mastery-cache";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AttemptsService {
  constructor(private prisma: PrismaService) {}

  async submit(
    userId: string,
    questionId: string,
    picked: Array<string | number>,
    clientVersion: number,
  ) {
    const question = await this.prisma.question.findFirst({
      where: { id: questionId, status: "published" },
    });
    if (!question) {
      throw new NotFoundException("题目不存在");
    }
    const answer = Array.isArray(question.answer)
      ? (question.answer as Array<string | number>)
      : [];
    const result = grade(question.type as QuestionType, answer, picked ?? []);
    const pickedArr = picked ?? [];
    if (result.score < 100) {
      await this.prisma.$transaction([
        this.prisma.attempt.create({
          data: {
            userId,
            questionId,
            version: clientVersion,
            picked: pickedArr,
            score: result.score,
            isFull: result.isFull,
          },
        }),
        this.prisma.mistake.upsert({
          where: { userId_questionId: { userId, questionId } },
          create: { userId, questionId, wrongCount: 1, mastered: false },
          update: { wrongCount: { increment: 1 }, mastered: false },
        }),
      ]);
    } else {
      await this.prisma.$transaction([
        this.prisma.attempt.create({
          data: {
            userId,
            questionId,
            version: clientVersion,
            picked: pickedArr,
            score: result.score,
            isFull: result.isFull,
          },
        }),
        this.prisma.mistake.updateMany({
          where: { userId, questionId },
          data: { mastered: true },
        }),
      ]);
    }
    invalidateMastery(userId, question.chapterId);
    return {
      score: result.score,
      isFull: result.isFull,
      correctAnswer: answer,
      analysis: question.analysis,
    };
  }
}
