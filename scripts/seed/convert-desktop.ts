import { readFileSync, writeFileSync } from "node:fs";

interface Q {
  no: number;
  type: string;
  chapterCode: string;
  chapterTitle: string;
  stem: string;
  options: string[];
  answer: string;
  analysis: string;
}

function splitOptionsLine(line: string): string[] | null {
  if (!/^-\s+/.test(line)) return null;
  const body = line.replace(/^-\s+/, "");
  // 答案行（含加粗标记）不是选项
  if (body.includes("答案")) return null;
  const parts = body.split(/([A-D])\s*[.、．]\s*/).filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < parts.length - 1; i += 2) {
    const letter = parts[i].trim();
    const text = (parts[i + 1] ?? "").replace(/\*\*/g, "").trim();
    if (/^[A-D]$/.test(letter) && text) out.push(`${letter}. ${text}`);
  }
  return out.length ? out : null;
}

function cleanAnswer(raw: string): string {
  const letters = raw.match(/[A-D]/g);
  if (letters && letters.length) return [...new Set(letters)].join("、");
  if (raw.includes("对")) return "对";
  if (raw.includes("错")) return "错";
  return raw.trim();
}

function convertFile(
  src: string,
  course: string,
  dst: string,
  noOffset: number,
): number {
  const lines = readFileSync(src, "utf8").split(/\r?\n/);
  const out: string[] = [`# 课程：${course}`, ""];
  const questions: Q[] = [];
  let chCode = "";
  let chTitle = "";
  let cur: Q | null = null;
  let opts: string[] = [];

  const flush = () => {
    if (cur) {
      cur.options = [...opts];
      questions.push(cur);
    }
    cur = null;
    opts = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line === "---" || line.startsWith(">")) continue;
    let m = line.match(/^#{1,4}\s+(\d+(?:\.\d+)*)\s*(.*)$/);
    if (m) {
      if (line.startsWith("### ") || line.startsWith("#### ")) {
        chCode = m[1];
        chTitle = m[2] || m[1];
      }
      continue;
    }
    m = line.match(/^\*\*(\d+)\.\s*[【[]([^】\]]+)[】\]]\s*(.*)\*\*$/);
    if (m) {
      flush();
      const typeRaw = m[2];
      const type = typeRaw.includes("多")
        ? "多选"
        : typeRaw.includes("判断")
          ? "判断"
          : "单选";
      cur = {
        no: noOffset + Number(m[1]),
        type,
        chapterCode: chCode,
        chapterTitle: chTitle,
        stem: m[3].trim(),
        options: [],
        answer: "",
        analysis: "",
      };
      continue;
    }
    if (!cur) continue;
    // 选项行：兼容单行多选项（- A. xxx B. xxx C. xxx D. xxx）
    const optParts = splitOptionsLine(line);
    if (optParts) {
      for (const o of optParts) opts.push(o);
      continue;
    }
    // 答案行：先去星号再整体解析，避免懒惰匹配吞答案
    const stripped = line.replace(/\*/g, "");
    m = stripped.match(/^-\s*答案\s*[：:]\s*(.+?)\s*$/);
    if (m) {
      const body0 = m[1].trim();
      let ansPart = body0;
      let notePart = "";
      const ti = body0.indexOf("[推导]");
      if (ti >= 0) {
        ansPart = body0.slice(0, ti).trim();
        notePart = body0
          .slice(ti + 4)
          .trim()
          .replace(/^（/, "")
          .replace(/）$/, "");
      } else {
        const pm = body0.match(/^([A-D对错、，,\s]+?)\s*(（.+）)?$/);
        if (pm) {
          ansPart = pm[1].trim();
          const paren = (pm[2] ?? "").trim();
          if (paren && !/^[（(][对错][）)]$/.test(paren)) notePart = paren;
        }
      }
      cur.answer = cleanAnswer(ansPart);
      if (notePart) cur.analysis = notePart;
      continue;
    }
    if (line.startsWith("-") && cur.analysis === "" && opts.length > 0) {
      continue;
    }
  }
  flush();

  let lastCh = "";
  for (const q of questions) {
    if (q.chapterCode !== lastCh) {
      lastCh = q.chapterCode;
      out.push(`## ${q.chapterCode} ${q.chapterTitle}`, "");
    }
    out.push(`### ${q.no}`, "");
    out.push(`- 类型：${q.type}`);
    out.push(`- 章节：${q.chapterCode} ${q.chapterTitle}`);
    out.push(`- 题干：${q.stem}`);
    out.push(`- 选项：`);
    for (const o of q.options) out.push(`  - ${o}`);
    out.push(`- 答案：${q.answer}`);
    out.push(`- 解析：${q.analysis}`);
    out.push("");
  }
  writeFileSync(dst, out.join("\n"), "utf8");
  return questions.length;
}

const [src, course, dst, offsetStr] = process.argv.slice(2);
const n = convertFile(src, course, dst, Number(offsetStr ?? 0));
console.log(`转换 ${n} 题 -> ${dst}`);
