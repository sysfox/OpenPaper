const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const TOKEN_KEY = "openpaper_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}

export interface ApiError extends Error {
  status: number;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...headers, ...(init.headers as Record<string, string>) } });
  if (!res.ok) {
    let message = `请求失败 ${res.status}`;
    try {
      const body = await res.json();
      if (body && typeof body.message === "string") message = body.message;
    } catch {
      message = `请求失败 ${res.status}`;
    }
    const err = new Error(message) as ApiError;
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  cover?: string;
  questionCount?: number;
}

export interface Chapter {
  id: string;
  code: string;
  title: string;
  questionCount?: number;
  mastery?: number;
}

export type QuestionType = "single" | "multi" | "judge";

export interface Question {
  id: string;
  no: number;
  chapterId?: string;
  type: QuestionType;
  stem: string;
  options: string[];
  answer?: number[];
  analysis?: string;
  version?: number;
}

export interface AttemptResult {
  score: 0 | 50 | 100;
  isFull: boolean;
  is_full?: boolean;
  correctAnswer: number[];
  analysis: string;
}

export interface Mistake {
  questionId: string;
  mastered: boolean;
  wrongCount: number;
  question: Question;
}

export interface Favorite {
  questionId: string;
  createdAt?: string;
  question?: Question;
}

export interface Feedback {
  id: string;
  questionId: string;
  questionNo?: number;
  content: string;
  status: string;
  createdAt?: string;
}

export interface ChapterMastery {
  chapterId: string;
  title?: string;
  mastery: number;
}

export interface Stats {
  answered: number;
  fullRate: number;
  chapters: ChapterMastery[];
}

export interface SearchResult {
  id: string;
  no: number;
  stem: string;
  chapterTitle?: string;
}

export interface Progress {
  total: number;
  done: number;
  lastNo: number | null;
  mastery: number;
}

type Raw = Record<string, unknown>;

function rawStr(v: unknown): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return "";
  return String(v);
}

function rawNum(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pick(row: Raw, ...keys: string[]): unknown {
  for (const k of keys) {
    const v = row[k];
    if (v !== null && v !== undefined) return v;
  }
  return undefined;
}

function toRate(v: unknown): number {
  const n = rawNum(v, 0);
  if (n > 1) return Math.min(1, n / 100);
  if (n < 0) return 0;
  return n;
}

export function normalizeQuestion(raw: unknown): Question {
  const r = ((raw || {}) as Raw) || {};
  const answer = pick(r, "answer", "correctAnswer");
  return {
    id: rawStr(pick(r, "id")),
    no: rawNum(pick(r, "no"), 0),
    chapterId: rawStr(pick(r, "chapterId", "chapter_id") ?? "") || undefined,
    type: (pick(r, "type") as QuestionType) || "single",
    stem: rawStr(pick(r, "stem")),
    options: Array.isArray(r.options) ? (r.options as unknown[]).map((o) => String(o)) : [],
    answer: Array.isArray(answer) ? (answer as unknown[]).map((v) => Number(v)) : [],
    analysis: rawStr(pick(r, "analysis") ?? "") || undefined,
    version: rawNum(pick(r, "version"), 1),
  };
}

function normalizeMistake(raw: unknown): Mistake {
  const r = ((raw || {}) as Raw) || {};
  const nested = r.question && typeof r.question === "object" ? normalizeQuestion(r.question) : null;
  const flat = nested || normalizeQuestion(r);
  const qid = rawStr(pick(r, "questionId", "question_id") ?? flat.id);
  return {
    questionId: qid,
    mastered: pick(r, "mastered") === true,
    wrongCount: rawNum(pick(r, "wrongCount", "wrong_count"), 0),
    question: { ...flat, id: flat.id || qid },
  };
}

function normalizeFavorite(raw: unknown): Favorite {
  const r = ((raw || {}) as Raw) || {};
  const nested = r.question && typeof r.question === "object" ? normalizeQuestion(r.question) : undefined;
  const flat = nested || normalizeQuestion(r);
  const qid = rawStr(pick(r, "questionId", "question_id") ?? flat.id);
  const created = rawStr(pick(r, "createdAt", "created_at") ?? "");
  return {
    questionId: qid,
    createdAt: created || undefined,
    question: { ...flat, id: flat.id || qid },
  };
}

function normalizeFeedback(raw: unknown): Feedback {
  const r = ((raw || {}) as Raw) || {};
  const qn = rawNum(pick(r, "questionNo", "question_no", "no"), 0);
  const created = rawStr(pick(r, "createdAt", "created_at") ?? "");
  return {
    id: rawStr(pick(r, "id")),
    questionId: rawStr(pick(r, "questionId", "question_id") ?? ""),
    questionNo: qn || undefined,
    content: rawStr(pick(r, "content")),
    status: rawStr(pick(r, "status")) || "pending",
    createdAt: created || undefined,
  };
}

function normalizeStats(raw: unknown): Stats {
  const r = ((raw || {}) as Raw) || {};
  const list = pick(r, "chapters", "chapterMastery", "mastery", "byChapter");
  const chapters = Array.isArray(list)
    ? (list as unknown[]).map((c) => {
        const cr = ((c || {}) as Raw) || {};
        const title = rawStr(pick(cr, "title", "name", "code") ?? "");
        return {
          chapterId: rawStr(pick(cr, "chapterId", "chapter_id", "id")),
          title: title || undefined,
          mastery: toRate(pick(cr, "mastery", "masteryRate", "rate")),
        };
      })
    : [];
  return {
    answered: rawNum(pick(r, "answered", "totalAttempts", "attempts", "total", "answeredCount"), 0),
    fullRate: toRate(pick(r, "fullRate", "correctRate", "accuracy", "full_ratio")),
    chapters,
  };
}

function normalizeSearch(raw: unknown): SearchResult {
  const r = ((raw || {}) as Raw) || {};
  const chapter = rawStr(pick(r, "chapterTitle", "chapter_title", "chapter") ?? "");
  return {
    id: rawStr(pick(r, "id")),
    no: rawNum(pick(r, "no"), 0),
    stem: rawStr(pick(r, "stem", "title")),
    chapterTitle: chapter || undefined,
  };
}

async function unwrapList<T>(path: string): Promise<T[]> {
  const body = await request<{ items: T[] } | T[]>(path);
  return Array.isArray(body) ? body : body.items;
}

export const api = {
  getCourses(): Promise<Course[]> {
    return unwrapList<Course>("/courses");
  },
  getChapters(slug: string): Promise<Chapter[]> {
    return unwrapList<Chapter>(`/courses/${slug}/chapters`);
  },
  async getQuestionList(params: {
    chapterId?: string;
    mode?: string;
    limit?: number;
    cursor?: string;
    excludeIds?: string[];
  }): Promise<Question[]> {
    const q = new URLSearchParams();
    if (params.chapterId) q.set("chapterId", params.chapterId);
    if (params.mode) q.set("mode", params.mode);
    if (params.limit) q.set("limit", String(params.limit));
    if (params.cursor) q.set("cursor", params.cursor);
    if (params.excludeIds && params.excludeIds.length) q.set("excludeIds", params.excludeIds.join(","));
    const suffix = q.toString() ? `?${q.toString()}` : "";
    const body = await request<{ items: Question[] } | Question[]>(`/questions${suffix}`);
    return Array.isArray(body) ? body : body.items;
  },
  getQuestionByNo(no: number): Promise<Question> {
    return request<Question>(`/questions/no/${no}`);
  },
  getQuestionById(id: string): Promise<Question> {
    return request<Question>(`/questions/${id}`);
  },
  submitAttempt(questionId: string, picked: number[], version?: number): Promise<AttemptResult> {
    return request<AttemptResult>("/attempts", {
      method: "POST",
      body: JSON.stringify({ questionId, picked, version }),
    });
  },
  getMistakes(ids?: string[]): Promise<Mistake[]> {
    const suffix = ids && ids.length ? `?ids=${encodeURIComponent(ids.join(","))}` : "";
    return unwrapList<unknown>(`/mistakes${suffix}`).then((rows) => rows.map(normalizeMistake));
  },
  setMastered(qid: string, mastered: boolean): Promise<void> {
    return request<void>(`/mistakes/${qid}`, {
      method: "PATCH",
      body: JSON.stringify({ mastered }),
    });
  },
  getFavorites(): Promise<Favorite[]> {
    return unwrapList<unknown>("/favorites").then((rows) => rows.map(normalizeFavorite));
  },
  addFavorite(questionId: string): Promise<void> {
    return request<void>("/favorites", {
      method: "POST",
      body: JSON.stringify({ questionId }),
    });
  },
  removeFavorite(qid: string): Promise<void> {
    return request<void>(`/favorites/${qid}`, { method: "DELETE" });
  },
  submitFeedback(questionId: string, content: string): Promise<void> {
    return request<void>("/feedbacks", {
      method: "POST",
      body: JSON.stringify({ questionId, content }),
    });
  },
  getMyFeedbacks(): Promise<Feedback[]> {
    return unwrapList<unknown>("/feedbacks").then((rows) => rows.map(normalizeFeedback));
  },
  getStats(): Promise<Stats> {
    return request<unknown>("/me/stats").then((body) => normalizeStats(body));
  },
  search(q: string): Promise<SearchResult[]> {
    return unwrapList<unknown>(`/search?q=${encodeURIComponent(q)}`).then((rows) =>
      rows.map(normalizeSearch),
    );
  },
  getProgress(chapterId: string): Promise<Progress> {
    return request<Progress>(`/progress?chapterId=${encodeURIComponent(chapterId)}`);
  },
  login(username: string, password: string): Promise<{ token: string }> {
    return request<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },
  register(username: string, password: string): Promise<{ token: string }> {
    return request<{ token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },
  logout(): void {
    setToken(null);
  },
};
