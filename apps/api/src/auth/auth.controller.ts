import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto";
import { Throttle } from "@nestjs/throttler";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("register")
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async register(@Body() dto: RegisterDto) {
    const result = await this.auth.register(dto.username, dto.password);
    if (!result.ok) {
      throw new BadRequestException(result.reason);
    }
    const token = this.auth.sign(result.user);
    return { token, user: result.user };
  }

  @Post("login")
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async login(@Body() dto: LoginDto) {
    const user = await this.auth.validate(dto.username, dto.password);
    if (!user) {
      throw new UnauthorizedException("用户名或密码不对");
    }
    const token = this.auth.sign(user);
    return { token, user };
  }
}
