import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(username: string, password: string) {
    const exists = await this.prisma.user.findUnique({
      where: { username },
    });
    if (exists) {
      // 注册失败统一话术，不泄露用户名是否已存在，防止用户枚举
      return { ok: false as const, reason: "注册失败" };
    }
    const passwordHash = await argon2.hash(password);
    try {
      const user = await this.prisma.user.create({
        data: { username, passwordHash },
        select: { id: true, username: true },
      });
      return { ok: true as const, user };
    } catch (e) {
      // 并发注册触达唯一约束时同样返回统一话术，不泄露用户名是否已存在
      if ((e as { code?: string })?.code === "P2002") {
        return { ok: false as const, reason: "注册失败" };
      }
      return { ok: false as const, reason: "注册失败" };
    }
  }

  async validate(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!user) {
      return null;
    }
    const pass = await argon2.verify(user.passwordHash, password);
    if (!pass) {
      return null;
    }
    return { id: user.id, username: user.username };
  }

  sign(user: { id: string; username: string }) {
    return this.jwt.sign({ sub: user.id, username: user.username });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true },
    });
    return user ?? null;
  }
}
