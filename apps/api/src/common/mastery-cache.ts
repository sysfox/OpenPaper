interface MasteryEntry {
  value: number;
  ts: number;
}

const TTL = 60_000;

const cache = new Map<string, MasteryEntry>();

function key(userId: string, chapterId: string) {
  return `${userId}:${chapterId}`;
}

export function getMastery(
  userId: string,
  chapterId: string,
): number | null {
  const entry = cache.get(key(userId, chapterId));
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.ts > TTL) {
    cache.delete(key(userId, chapterId));
    return null;
  }
  return entry.value;
}

export function setMastery(
  userId: string,
  chapterId: string,
  value: number,
) {
  cache.set(key(userId, chapterId), { value, ts: Date.now() });
}

export function invalidateMastery(userId: string, chapterId: string) {
  cache.delete(key(userId, chapterId));
}
