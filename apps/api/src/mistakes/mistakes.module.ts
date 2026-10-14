import { Module } from "@nestjs/common";
import { MistakesController } from "./mistakes.controller";

@Module({
  controllers: [MistakesController],
})
export class MistakesModule {}
