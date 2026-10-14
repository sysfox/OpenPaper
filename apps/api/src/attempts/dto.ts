import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from "class-validator";

export class CreateAttemptDto {
  @IsUUID("4", { message: "题目参数不对" })
  questionId!: string;

  @IsArray({ message: "选项格式不对" })
  @ArrayMaxSize(20, { message: "选项太多" })
  @IsInt({ each: true, message: "选项格式不对" })
  @Min(0, { each: true, message: "选项格式不对" })
  picked!: number[];

  @IsOptional()
  @IsInt({ message: "版本参数不对" })
  @Min(1)
  version?: number = 1;
}
