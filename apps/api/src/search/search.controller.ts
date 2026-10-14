import { Controller, Get, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SearchQuery } from "./dto";

const PUBLIC_FIELDS =
  "q.id, q.chapter_id AS chapterId, q.no, q.type, q.stem, q.options, q.version, q.status";

interface AlgoliaHit {
  objectID?: string;
}

@Controller("search")
export class SearchController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async search(@Query() query: SearchQuery) {
    const raw = (query.q ?? "").trim();
    // DTO 已用 @MaxLength(50) 判 400，这里再截断做纵深防御
    const q = raw.slice(0, 50);
    const limit = Math.min(query.limit ?? 10, 20);
    if (!q) {
      return { items: [] };
    }
    const hits = await this.fromAlgolia(q, limit);
    if (hits) {
      return { items: hits };
    }
    const rows = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL statement_timeout = 5000`;
      return tx.$queryRaw<Record<string, unknown>[]>(
        Prisma.sql`
          SELECT ${Prisma.raw(PUBLIC_FIELDS)}, c.title AS "chapterTitle"
            FROM questions q LEFT JOIN chapters c ON c.id = q.chapter_id
            WHERE q.status = 'published'
              AND (q.stem ILIKE '%' || ${q} || '%'
                OR q.options::text ILIKE '%' || ${q} || '%'
                OR c.title ILIKE '%' || ${q} || '%'
                OR q.stem % ${q} OR q.options::text % ${q})
            ORDER BY GREATEST(similarity(q.stem, ${q}), similarity(q.options::text, ${q})) DESC, q.no ASC
            LIMIT ${limit}
         `,
      );
    });
    return { items: rows };
  }

  private async fromAlgolia(q: string, limit: number) {
    const appId = process.env.ALGOLIA_APP_ID;
    const apiKey =
      process.env.ALGOLIA_SEARCH_KEY ?? process.env.ALGOLIA_API_KEY;
    const index = process.env.ALGOLIA_INDEX ?? "questions";
    if (!appId || !apiKey) {
      return null;
    }
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch(
        `https://${appId}-dsn.algolia.net/1/indexes/${encodeURIComponent(index)}/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Algolia-API-Key": apiKey,
            "X-Algolia-Application-Id": appId,
          },
          body: JSON.stringify({
            params: new URLSearchParams({
              query: q,
              hitsPerPage: String(limit),
            }).toString(),
          }),
          signal: ctrl.signal,
        },
      );
      clearTimeout(timer);
      if (!res.ok) {
        return null;
      }
      const data = (await res.json()) as { hits?: AlgoliaHit[] };
      const ids = (data.hits ?? [])
        .map((hit) => hit.objectID)
        .filter((id): id is string => typeof id === "string" && id.length > 0);
      if (ids.length === 0) {
        return [];
      }
      const rows = await this.prisma.question.findMany({
        where: { id: { in: ids }, status: "published" },
      });
      const joined = await this.prisma.chapter.findMany({
        where: { id: { in: rows.map((r) => r.chapterId) } },
        select: { id: true, title: true },
      });
      const titleByChapter = new Map(joined.map((c) => [c.id, c.title]));
      const shaped = rows.map((r) => ({
        id: r.id,
        chapterId: r.chapterId,
        no: r.no,
        type: r.type,
        stem: r.stem,
        options: r.options,
        version: r.version,
        status: r.status,
        chapterTitle: titleByChapter.get(r.chapterId) ?? null,
      }));
      const order = new Map(ids.map((id, i) => [id, i] as const));
      shaped.sort(
        (a, b) =>
          (order.get(a.id) ?? ids.length) - (order.get(b.id) ?? ids.length),
      );
      return shaped.slice(0, limit);
    } catch {
      return null;
    }
  }
}
