import { IsString, Length, Matches } from "class-validator";

export class RegisterDto {
  @IsString({ message: "用户名格式不对" })
  @Length(2, 32, { message: "用户名2-32位" })
  @Matches(/^[A-Za-z0-9_\u4e00-\u9fa5]+$/, { message: "用户名格式不对" })
  username!: string;

  @IsString({ message: "密码至少6位" })
  @Length(6, 64, { message: "密码至少6位" })
  password!: string;
}

export class LoginDto {
  @IsString({ message: "用户名不能为空" })
  username!: string;

  @IsString({ message: "密码不能为空" })
  password!: string;
}
