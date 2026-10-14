import { IsUUID } from "class-validator";

export class CreateFavoriteDto {
  @IsUUID("4", { message: "题目参数不对" })
  questionId!: string;
}
