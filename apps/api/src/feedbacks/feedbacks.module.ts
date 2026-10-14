import { Module } from "@nestjs/common";
import { DbModule } from "../db/db.module";
import { FeedbacksController } from "./feedbacks.controller";

@Module({
  imports: [DbModule],
  controllers: [FeedbacksController],
})
export class FeedbacksModule {}
