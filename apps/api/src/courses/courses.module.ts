import { Module } from "@nestjs/common";
import { DbModule } from "../db/db.module";
import { CoursesController } from "./courses.controller";

@Module({
  imports: [DbModule],
  controllers: [CoursesController],
})
export class CoursesModule {}
