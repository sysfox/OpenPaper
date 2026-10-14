import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      const status = exception.getStatus();
      if (typeof payload === "object" && payload !== null) {
        const body = payload as Record<string, unknown>;
        const message = Array.isArray(body.message)
          ? String(body.message[0])
          : String(body.message ?? exception.message);
        res.status(status).json({
          code: status,
          message,
          path: req.url,
        });
        return;
      }
      res.status(status).json({
        code: status,
        message: String(payload),
        path: req.url,
      });
      return;
    }
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: 500,
      message: "服务器开小差了",
      path: req.url,
    });
  }
}
