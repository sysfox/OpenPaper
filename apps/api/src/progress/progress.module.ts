import { Module } from "@nestjs/common";
import { DbModule } from "../db/db.module";
import { ProgressController } from "./progress.controller";

@Module({
  imports: [DbModule],
  controllers: [ProgressController],
})
export class ProgressModule {}
