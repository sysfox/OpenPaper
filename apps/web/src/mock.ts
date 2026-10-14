import type { Chapter, Course, Question } from "./api";

export const mockCourses: Course[] = [
  {
    id: "c1",
    title: "走进核科学技术",
    slug: "nuclear-science",
    questionCount: 117,
  },
];

export const mockChapters: Chapter[] = [
  {
    id: "ch1",
    code: "1.1",
    title: "原子与原子核",
    questionCount: 18,
    mastery: 0,
  },
  {
    id: "ch2",
    code: "2.1",
    title: "国家安全与核威慑",
    questionCount: 22,
    mastery: 0,
  },
  {
    id: "ch3",
    code: "3.2",
    title: "核电站工作原理",
    questionCount: 25,
    mastery: 0,
  },
  {
    id: "ch4",
    code: "4.1",
    title: "核辐射与防护",
    questionCount: 20,
    mastery: 0,
  },
  {
    id: "ch5",
    code: "5.3",
    title: "核技术应用",
    questionCount: 32,
    mastery: 0,
  },
];

export const mockQuestions: Question[] = [
  {
    id: "q1",
    no: 1,
    chapterId: "ch1",
    type: "single",
    stem: "原子核由哪两种粒子组成？",
    options: ["质子与中子", "质子与电子", "中子与电子", "光子与中子"],
    answer: [0],
    analysis: "原子核由质子与中子组成，电子在核外运动。",
    version: 1,
  },
  {
    id: "q2",
    no: 2,
    chapterId: "ch1",
    type: "judge",
    stem: "天然铀中 U-235 的丰度约为 0.7%。",
    options: ["对", "错"],
    answer: [0],
    analysis: "天然铀中 U-235 约占 0.7%，其余多为 U-238。",
    version: 1,
  },
  {
    id: "q3",
    no: 3,
    chapterId: "ch2",
    type: "multi",
    stem: "以下哪些属于核技术的民用应用？",
    options: ["核电发电", "医用同位素诊疗", "农产品辐照保鲜", "核武器试验"],
    answer: [0, 1, 2],
    analysis: "前三项为民用，核武器试验不属于民用应用。",
    version: 1,
  },
  {
    id: "q4",
    no: 4,
    chapterId: "ch3",
    type: "single",
    stem: "压水堆核电站中，承担慢化剂和冷却剂双重角色的是？",
    options: ["轻水", "重水", "石墨", "氦气"],
    answer: [0],
    analysis: "压水堆用轻水同时做慢化剂与冷却剂。",
    version: 1,
  },
];

export function findMockQuestion(no: number): Question | undefined {
  return mockQuestions.find((q) => q.no === no);
}
