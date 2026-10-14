import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { AttemptsModule } from "./attempts/attempts.module";
import { CoursesModule } from "./courses/courses.module";
import { FavoritesModule } from "./favorites/favorites.module";
import { FeedbacksModule } from "./feedbacks/feedbacks.module";
import { MistakesModule } from "./mistakes/mistakes.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProgressModule } from "./progress/progress.module";
import { QuestionsModule } from "./questions/questions.module";
import { SearchModule } from "./search/search.module";
import { StatsModule } from "./stats/stats.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{ name: "default", ttl: 60_000, limit: 60 }],
    }),
    PrismaModule,
    AuthModule,
    CoursesModule,
    QuestionsModule,
    AttemptsModule,
    ProgressModule,
    MistakesModule,
    FavoritesModule,
    FeedbacksModule,
    StatsModule,
    SearchModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
