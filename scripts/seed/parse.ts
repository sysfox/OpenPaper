export type SeedQuestionType = "single" | "multi" | "judge";

export interface SeedQuestion {
  no: number;
  type: SeedQuestionType;
  chapterCode: string;
  chapterTitle: string;
  stem: string;
  options: string[];
  answer: number[];
  analysis: string;
}

export interface SeedDoc {
  courseTitle: string;
  questions: SeedQuestion[];
}

const TYPE_NAMES: Record<string, SeedQuestionType> = {
  单选: "single",
  多选: "multi",
  判断: "judge",
};

const EMPTY_ANALYSIS = "暂无解析，欢迎纠错补充";

function splitField(line: string): [string, string] | null {
  const text = line.replace(/^[-*]\s*/, "");
  const idx = text.search(/[:：]/);
  if (idx < 0) return null;
  return [text.slice(0, idx).trim(), text.slice(idx + 1).trim()];
}

function parseAnswerToken(token: string): number | null {
  const upper = token.trim().toUpperCase();
  if (/^[A-Z]$/.test(upper)) return upper.charCodeAt(0) - 65;
  if (/^\d+$/.test(upper)) return Number(upper) - 1;
  if (token.trim() === "对") return 0;
  if (token.trim() === "错") return 1;
  return null;
}

function parseAnswer(raw: string): number[] {
  const out: number[] = [];
  for (const token of raw.split(/[,，、\s]+/)) {
    if (!token) continue;
    const idx = parseAnswerToken(token);
    if (idx !== null && idx >= 0 && !out.includes(idx)) out.push(idx);
  }
  return out.sort((a, b) => a - b);
}

function parseLetterOption(line: string): string | null {
  const m = line.match(/^[-*]\s*([A-Z])[.、\s]\s*(.*)$/);
  if (!m) return null;
  return m[2].trim();
}

function cleanAnalysis(raw: string): string {
  const text = raw.trim().replace(/^\[推导\]\s*/, "");
  return text || EMPTY_ANALYSIS;
}

export function parseSeed(markdown: string): SeedDoc {
  const doc: SeedDoc = { courseTitle: "", questions: [] };
  let chapterCode = "";
  let chapterTitle = "";
  let current: SeedQuestion | null = null;
  let inOptions = false;
  let analysisLines: string[] = [];

  const flush = () => {
    if (!current) return;
    if (current.type === "judge" && current.options.length === 0) {
      current.options = ["对", "错"];
    }
    current.analysis = cleanAnalysis(analysisLines.join("\n"));
    doc.questions.push(current);
    current = null;
  };

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("### ")) {
      flush();
      const no = Number(line.slice(4).trim().split(/\s+/)[0]);
      if (!Number.isInteger(no)) continue;
      current = {
        no,
        type: "single",
        chapterCode,
        chapterTitle,
        stem: "",
        options: [],
        answer: [],
        analysis: "",
      };
      analysisLines = [];
      inOptions = false;
      continue;
    }
    if (line.startsWith("## ")) {
      const parts = line.slice(3).trim().split(/\s+/);
      chapterCode = parts[0] || "";
      chapterTitle = parts.slice(1).join(" ") || chapterCode;
      continue;
    }
    if (line.startsWith("# ")) {
      doc.courseTitle = line
        .slice(2)
        .trim()
        .replace(/^课程[:：]\s*/, "");
      continue;
    }
    if (!current) continue;
    if (inOptions && /^[-*]\s/.test(line)) {
      const letter = parseLetterOption(line);
      if (letter !== null) {
        current.options.push(letter);
        continue;
      }
      if (!splitField(line)) {
        current.options.push(line.replace(/^[-*]\s*/, ""));
        continue;
      }
      inOptions = false;
    } else {
      inOptions = false;
    }
    const field = splitField(line);
    if (!field) {
      analysisLines.push(line);
      continue;
    }
    const [key, value] = field;
    if (key === "类型") {
      current.type = TYPE_NAMES[value] || "single";
    } else if (key === "章节") {
      const parts = value.split(/\s+/);
      current.chapterCode = parts[0] || current.chapterCode;
      current.chapterTitle =
        parts.slice(1).join(" ") || current.chapterTitle || current.chapterCode;
    } else if (key === "题干") {
      current.stem = value;
    } else if (key === "选项") {
      inOptions = true;
      const inline = parseLetterOption(`- ${value}`);
      if (inline) current.options.push(inline);
      else if (value) current.options.push(value);
    } else if (key === "答案") {
      current.answer = parseAnswer(value);
    } else if (key === "解析") {
      analysisLines = value ? [value] : [];
    } else {
      analysisLines.push(line);
    }
  }
  flush();
  return doc;
}
