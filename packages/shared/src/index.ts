export type QuestionType = "single" | "multi" | "judge";

export type GradeScore = 0 | 50 | 100;

export interface GradeResult {
  score: GradeScore;
  isFull: boolean;
}

export interface QuestionDto {
  id: string;
  chapterId: string;
  no: number;
  type: QuestionType;
  stem: string;
  options: string[];
  version: number;
}

export interface QuestionDetailDto extends QuestionDto {
  correctAnswer: Array<string | number>;
  analysis: string;
}

export interface AttemptResultDto extends GradeResult {
  correctAnswer: Array<string | number>;
  analysis: string;
}

export function grade(
  type: QuestionType,
  answer: Array<string | number>,
  picked: Array<string | number>,
): GradeResult {
  const expected = Array.from(new Set((answer ?? []).map(String)));
  const actual = Array.from(new Set((picked ?? []).map(String)));
  if (type === "single" || type === "judge") {
    const pass =
      actual.length === 1 && expected.length === 1 && actual[0] === expected[0];
    return pass ? { score: 100, isFull: true } : { score: 0, isFull: false };
  }
  const expectedSet = new Set(expected);
  if (actual.length === 0) {
    return { score: 0, isFull: false };
  }
  if (actual.some((item) => !expectedSet.has(item))) {
    return { score: 0, isFull: false };
  }
  if (actual.length === expected.length) {
    return { score: 100, isFull: true };
  }
  return { score: 50, isFull: false };
}
