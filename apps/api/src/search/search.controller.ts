import { Controller, Get, Query } from "@nestjs/common";
import { DbService } from "../db/db.service";
import { SearchQuery } from "./dto";

const PUBLIC_FIELDS =
  "q.id, q.chapter_id AS chapterId, q.no, q.type, q.stem, q.options, q.version, q.status";

interface AlgoliaHit {
  objectID?: string;
}

@Controller("search")
export class SearchController {
  constructor(private db: DbService) {}

  @Get()
  async search(@Query() query: SearchQuery) {
    const q = (query.q ?? "").trim();
    const limit = Math.min(query.limit ?? 10, 20);
    if (!q) {
      return { items: [] };
    }
    const hits = await this.fromAlgolia(q, limit);
    if (hits) {
      return { items: hits };
    }
    const result = await this.db.query(
      `SELECT ${PUBLIC_FIELDS}, c.title AS "chapterTitle",
              GREATEST(similarity(q.stem, $1), similarity(q.options::text, $1)) AS rank
       FROM questions q LEFT JOIN chapters c ON c.id = q.chapter_id
       WHERE q.status = 'published'
         AND (q.stem ILIKE '%' || $1 || '%'
           OR q.options::text ILIKE '%' || $1 || '%'
           OR c.title ILIKE '%' || $1 || '%'
           OR q.stem % $1 OR q.options::text % $1)
       ORDER BY rank DESC, q.no ASC
       LIMIT $2`,
      [q, limit],
    );
    return {
      items: result.rows.map(({ rank, ...rest }) => rest),
    };
  }

  private async fromAlgolia(q: string, limit: number) {
    const appId = process.env.ALGOLIA_APP_ID;
    const apiKey =
      process.env.ALGOLIA_API_KEY ?? process.env.ALGOLIA_SEARCH_KEY;
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
      const rows = await this.db.query(
        `SELECT ${PUBLIC_FIELDS}, c.title AS "chapterTitle" FROM questions q
         LEFT JOIN chapters c ON c.id = q.chapter_id
          WHERE q.id = ANY ($1) AND q.status = 'published'`,
        [ids],
      );
      const order = new Map(ids.map((id, i) => [id, i] as const));
      rows.rows.sort(
        (a, b) =>
          (order.get(a.id) ?? ids.length) - (order.get(b.id) ?? ids.length),
      );
      return rows.rows.slice(0, limit);
    } catch {
      return null;
    }
  }
}
