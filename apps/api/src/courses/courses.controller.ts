import { Controller, Get, Param } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("courses")
export class CoursesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    const items = await this.prisma.course.findMany({
      orderBy: { title: "asc" },
    });
    return { items };
  }

  @Get(":slug/chapters")
  async chapters(@Param("slug") slug: string) {
    const course = await this.prisma.course.findFirst({
      where: { slug },
    });
    if (!course) {
      return { items: [] };
    }
    const items = await this.prisma.chapter.findMany({
      where: { courseId: course.id },
      orderBy: [{ sort: "asc" }, { code: "asc" }],
    });
    return { items };
  }
}
