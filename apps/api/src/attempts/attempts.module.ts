import { Module } from "@nestjs/common";
import { DbModule } from "../db/db.module";
import { AttemptsController } from "./attempts.controller";
import { AttemptsService } from "./attempts.service";

@Module({
  imports: [DbModule],
  controllers: [AttemptsController],
  providers: [AttemptsService],
})
export class AttemptsModule {}
