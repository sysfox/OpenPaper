import { IsArray, IsInt, IsOptional, IsUUID, Min } from "class-validator";

export class CreateAttemptDto {
  @IsUUID("4", { message: "题目参数不对" })
  questionId!: string;

  @IsArray({ message: "选项格式不对" })
  picked!: Array<string | number>;

  @IsOptional()
  @IsInt({ message: "版本参数不对" })
  @Min(1)
  version?: number = 1;
}
