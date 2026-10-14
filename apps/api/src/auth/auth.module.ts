import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { getJwtSecret } from "./jwt-secret";
import { JwtStrategy } from "./jwt.strategy";
import { MeController } from "./me.controller";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      global: true,
      secret: getJwtSecret(),
      // 项目暂无刷新令牌轮换机制，先把有效期缩至2小时，后续加上刷新令牌轮换后再缩至15分钟
      signOptions: { expiresIn: "2h" },
    }),
  ],
  controllers: [AuthController, MeController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
