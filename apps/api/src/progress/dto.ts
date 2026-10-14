import { Transform } from "class-transformer";
import { IsOptional, IsUUID } from "class-validator";

export class ProgressQuery {
  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsUUID("4", { message: "章节参数不对" })
  chapterId?: string;
}
