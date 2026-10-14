import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { type NestExpressApplication } from "@nestjs/platform-express";
import { json } from "express";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // 反向代理只信任回环网卡，避免 X-Forwarded-For 伪造影响限流取 IP
  app.set("trust proxy", "loopback");
  app.use(helmet());
  // 限制请求体大小，防大数组刷内存
  app.use(json({ limit: "100kb" }));
  const origin = process.env.FRONTEND_ORIGIN;
  app.enableCors(origin ? { origin: [origin] } : {});
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
