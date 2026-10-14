import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/current-user.decorator";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { AttemptsService } from "./attempts.service";
import { CreateAttemptDto } from "./dto";
import { Throttle } from "@nestjs/throttler";

@Controller("attempts")
export class AttemptsController {
  constructor(private attempts: AttemptsService) {}

  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @UseGuards(JwtAuthGuard)
  submit(@CurrentUser() user: { id: string }, @Body() dto: CreateAttemptDto) {
    return this.attempts.submit(
      user.id,
      dto.questionId,
      dto.picked,
      dto.version ?? 1,
    );
  }
}
