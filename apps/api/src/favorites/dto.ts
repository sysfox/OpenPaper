import { Type } from "class-transformer";
import { IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

export class ListFavoritesQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "分页参数不对" })
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "分页参数不对" })
  @Min(0)
  offset?: number = 0;
}

export class CreateFavoriteDto {
  @IsUUID("4", { message: "题目参数不对" })
  questionId!: string;
}
