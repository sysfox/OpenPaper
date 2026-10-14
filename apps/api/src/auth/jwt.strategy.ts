import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "./auth.service";
import { getJwtSecret } from "./jwt-secret";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private auth: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: { sub: string; username: string }) {
    const user = await this.auth.findById(payload.sub);
    // 令牌中的用户已不存在时直接拒绝，不再放行幽灵票据
    if (!user) {
      throw new UnauthorizedException("登录已失效");
    }
    return user;
  }
}
