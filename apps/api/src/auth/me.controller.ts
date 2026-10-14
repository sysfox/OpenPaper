import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/current-user.decorator";
import { JwtAuthGuard } from "../common/jwt-auth.guard";

@Controller("me")
export class MeController {
  @Get()
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { id: string; username: string }) {
    return user;
  }
}
