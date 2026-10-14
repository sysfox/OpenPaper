import { Controller, Get, Param } from "@nestjs/common";
import { DbService } from "../db/db.service";

@Controller("courses")
export class CoursesController {
  constructor(private db: DbService) {}

  @Get()
  async list() {
    const result = await this.db.query(
      "SELECT id, title, slug, cover, status FROM courses ORDER BY title",
    );
    return { items: result.rows };
  }

  @Get(":slug/chapters")
  async chapters(@Param("slug") slug: string) {
    const course = await this.db.query<{ id: string }>(
      "SELECT id FROM courses WHERE slug = $1",
      [slug],
    );
    if (course.rowCount === 0) {
      return { items: [] };
    }
    const result = await this.db.query(
      "SELECT id, course_id AS courseId, code, title, sort FROM chapters WHERE course_id = $1 ORDER BY sort, code",
      [course.rows[0].id],
    );
    return { items: result.rows };
  }
}
