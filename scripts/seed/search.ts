import { algoliasearch } from "algoliasearch";

export interface SearchRecord extends Record<string, unknown> {
  objectID: string;
  no: number;
  type: string;
  stem: string;
  options: string[];
  chapterCode: string;
  chapter: string;
  course: string;
}

export function algoliaEnabled(): boolean {
  return Boolean(process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_API_KEY);
}

export function algoliaIndexName(): string {
  return process.env.ALGOLIA_INDEX || "questions";
}

export async function pushRecords(
  records: SearchRecord[],
): Promise<{ pushed: number; failed: boolean }> {
  if (records.length === 0) return { pushed: 0, failed: false };
  if (!algoliaEnabled()) return { pushed: 0, failed: false };
  const client = algoliasearch(
    process.env.ALGOLIA_APP_ID as string,
    process.env.ALGOLIA_API_KEY as string,
  );
  await client.saveObjects({
    indexName: algoliaIndexName(),
    objects: records,
  });
  return { pushed: records.length, failed: false };
}

export async function replaceIndex(records: SearchRecord[]): Promise<number> {
  if (records.length === 0) return 0;
  const client = algoliasearch(
    process.env.ALGOLIA_APP_ID as string,
    process.env.ALGOLIA_API_KEY as string,
  );
  await client.replaceAllObjects({
    indexName: algoliaIndexName(),
    objects: records,
  });
  return records.length;
}
