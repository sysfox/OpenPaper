import { IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateFeedbackDto {
  @IsUUID("4", { message: "题目参数不对" })
  questionId!: string;

  @IsString({ message: "内容不能为空" })
  @IsNotEmpty({ message: "内容不能为空" })
  @MaxLength(2000, { message: "内容太长了" })
  content!: string;
}
