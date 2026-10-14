import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { AttemptsModule } from "./attempts/attempts.module";
import { CoursesModule } from "./courses/courses.module";
import { DbModule } from "./db/db.module";
import { ProgressModule } from "./progress/progress.module";
import { QuestionsModule } from "./questions/questions.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    AuthModule,
    CoursesModule,
    QuestionsModule,
    AttemptsModule,
    ProgressModule,
  ],
})
export class AppModule {}
