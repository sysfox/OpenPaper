import { Module } from "@nestjs/common";
import { DbModule } from "../db/db.module";
import { StatsController } from "./stats.controller";

@Module({
  imports: [DbModule],
  controllers: [StatsController],
})
export class StatsModule {}
