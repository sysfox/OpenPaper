import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { AttemptsModule } from "./attempts/attempts.module";
import { CoursesModule } from "./courses/courses.module";
import { DbModule } from "./db/db.module";
import { FavoritesModule } from "./favorites/favorites.module";
import { FeedbacksModule } from "./feedbacks/feedbacks.module";
import { MistakesModule } from "./mistakes/mistakes.module";
import { ProgressModule } from "./progress/progress.module";
import { QuestionsModule } from "./questions/questions.module";
import { SearchModule } from "./search/search.module";
import { StatsModule } from "./stats/stats.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
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
})
export class AppModule {}
