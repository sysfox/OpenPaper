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
  async getQuestionList(params: { chapterId?: string; mode?: string; limit?: number; cursor?: string }): Promise<Question[]> {
    const q = new URLSearchParams();
    if (params.chapterId) q.set("chapterId", params.chapterId);
    if (params.mode) q.set("mode", params.mode);
    if (params.limit) q.set("limit", String(params.limit));
    if (params.cursor) q.set("cursor", params.cursor);
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
      body: JSON.stringify({ questionId, picked, version })
    });
  },
  login(username: string, password: string): Promise<{ token: string }> {
    return request<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
  },
  register(username: string, password: string): Promise<{ token: string }> {
    return request<{ token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
  },
  logout(): void {
    setToken(null);
  }
};
