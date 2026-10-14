import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class ListFeedbacksQuery {
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

export class CreateFeedbackDto {
  @IsUUID("4", { message: "题目参数不对" })
  questionId!: string;

  @IsString({ message: "内容不能为空" })
  @IsNotEmpty({ message: "内容不能为空" })
  @MaxLength(2000, { message: "内容太长了" })
  content!: string;
}
