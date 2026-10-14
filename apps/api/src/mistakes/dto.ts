import { IsBoolean, IsOptional, IsString } from "class-validator";

export class ListMistakesQuery {
  @IsOptional()
  @IsString({ message: "参数不对" })
  ids?: string;
}

export class UpdateMistakeDto {
  @IsBoolean({ message: "参数不对" })
  mastered!: boolean;
}
