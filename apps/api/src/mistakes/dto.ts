import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class ListMistakesQuery {
  @IsOptional()
  @IsString({ message: "参数不对" })
  ids?: string;

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

export class UpdateMistakeDto {
  @IsBoolean({ message: "参数不对" })
  mastered!: boolean;
}
