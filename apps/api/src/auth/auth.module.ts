import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthRateLimitMiddleware } from "../common/auth-rate-limit.middleware";
import { DbModule } from "../db/db.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { MeController } from "./me.controller";

@Module({
  imports: [
    DbModule,
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? "please-change-me",
      signOptions: { expiresIn: "30d" },
    }),
  ],
  controllers: [AuthController, MeController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthRateLimitMiddleware)
      .forRoutes(
        { path: "api/auth/register", method: RequestMethod.POST },
        { path: "api/auth/login", method: RequestMethod.POST },
      );
  }
}
