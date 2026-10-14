import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class ListQuestionsQuery {
  @IsOptional()
  @IsUUID("4", { message: "章节参数不对" })
  chapterId?: string;

  @IsOptional()
  @IsString({ message: "模式参数不对" })
  mode?: string = "seq";

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "分页参数不对" })
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "游标参数不对" })
  @Min(0)
  cursor?: number = 0;

  @IsOptional()
  @IsString({ message: "去重参数不对" })
  excludeIds?: string;
}
