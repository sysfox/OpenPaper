import { Module } from "@nestjs/common";
import { DbModule } from "../db/db.module";
import { MistakesController } from "./mistakes.controller";

@Module({
  imports: [DbModule],
  controllers: [MistakesController],
})
export class MistakesModule {}
