import { Module } from "@nestjs/common";
import { DbModule } from "../db/db.module";
import { FavoritesController } from "./favorites.controller";

@Module({
  imports: [DbModule],
  controllers: [FavoritesController],
})
export class FavoritesModule {}
