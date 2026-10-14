import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class SearchQuery {
  @IsOptional()
  @IsString({ message: "关键词不对" })
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "数量参数不对" })
  @Min(1)
  @Max(20)
  limit?: number = 10;
}
