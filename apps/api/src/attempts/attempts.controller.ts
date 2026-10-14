import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/current-user.decorator";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { AttemptsService } from "./attempts.service";
import { CreateAttemptDto } from "./dto";

@Controller("attempts")
export class AttemptsController {
  constructor(private attempts: AttemptsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  submit(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateAttemptDto,
  ) {
    return this.attempts.submit(
      user.id,
      dto.questionId,
      dto.picked,
      dto.version ?? 1,
    );
  }
}
