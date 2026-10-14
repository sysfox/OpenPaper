import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { DbService } from "../db/db.service";

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
}

@Injectable()
export class AuthService {
  constructor(
    private db: DbService,
    private jwt: JwtService,
  ) {}

  async register(username: string, password: string) {
    const exists = await this.db.query<UserRow>(
      "SELECT id FROM users WHERE username = $1",
      [username],
    );
    if (exists.rowCount && exists.rowCount > 0) {
      // 注册失败统一话术，不泄露用户名是否已存在，防止用户枚举
      return { ok: false as const, reason: "注册失败" };
    }
    const passwordHash = await argon2.hash(password);
    try {
      const created = await this.db.query<UserRow>(
        "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
        [username, passwordHash],
      );
      const user = created.rows[0];
      return { ok: true as const, user };
    } catch {
      // 并发注册触达唯一约束时同样返回统一话术，不泄露用户名是否已存在
      return { ok: false as const, reason: "注册失败" };
    }
  }

  async validate(username: string, password: string) {
    const found = await this.db.query<UserRow>(
      "SELECT id, username, password_hash FROM users WHERE username = $1",
      [username],
    );
    const user = found.rows[0];
    if (!user) {
      return null;
    }
    const pass = await argon2.verify(user.password_hash, password);
    if (!pass) {
      return null;
    }
    return { id: user.id, username: user.username };
  }

  sign(user: { id: string; username: string }) {
    return this.jwt.sign({ sub: user.id, username: user.username });
  }

  async findById(id: string) {
    const found = await this.db.query<{ id: string; username: string }>(
      "SELECT id, username FROM users WHERE id = $1",
      [id],
    );
    return found.rows[0] ?? null;
  }
}
