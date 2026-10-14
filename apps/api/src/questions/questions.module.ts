import { Module } from "@nestjs/common";
import { DbModule } from "../db/db.module";
import { QuestionsController } from "./questions.controller";

@Module({
  imports: [DbModule],
  controllers: [QuestionsController],
})
export class QuestionsModule {}
