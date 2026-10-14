import { Module } from "@nestjs/common";
import { FeedbacksController } from "./feedbacks.controller";

@Module({
  controllers: [FeedbacksController],
})
export class FeedbacksModule {}
