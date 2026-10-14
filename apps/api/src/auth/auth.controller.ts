import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto) {
    const result = await this.auth.register(dto.username, dto.password);
    if (!result.ok) {
      throw new BadRequestException(result.reason);
    }
    const token = this.auth.sign(result.user);
    return { token, user: result.user };
  }

  @Post("login")
  async login(@Body() dto: LoginDto) {
    const user = await this.auth.validate(dto.username, dto.password);
    if (!user) {
      throw new UnauthorizedException("用户名或密码不对");
    }
    const token = this.auth.sign(user);
    return { token, user };
  }
}
