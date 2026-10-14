<template>
  <section class="space-y-4">
    <div v-if="!logged" class="bg-white border-2 border-ink rounded-2xl p-6 text-center space-y-4">
      <h1 class="text-2xl font-bold">刷题要先登录</h1>
      <p class="text-lg text-ink/70">游客只能看题，判分和进度要登录后才有。</p>
      <RouterLink to="/login" class="big-btn block bg-reactor-500 text-ink rounded-xl px-4 py-3">去登录</RouterLink>
      <RouterLink :to="firstReadonly" class="big-btn block border-2 border-ink rounded-xl px-4 py-3">先只看题</RouterLink>
    </div>

    <div v-else class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-base text-ink/60">第 {{ index + 1 }} / {{ total }} 题</p>
        <span v-if="current && current.type === 'multi'" class="text-sm font-bold bg-ink text-paper rounded-full px-3 py-1">多选题</span>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border-2 border-ink p-6 text-lg">题目加载中…</div>
      <div v-else-if="!current" class="bg-white rounded-2xl border-2 border-ink p-6 text-lg">暂无题目。</div>

      <article v-else class="bg-white rounded-2xl border-2 border-ink p-5 space-y-4">
        <p class="text-sm font-bold text-ink/50">第 {{ current.no }} 题 · {{ typeName(current.type) }}</p>
        <h1 class="text-xl font-bold leading-relaxed">{{ current.stem }}</h1>
        <p v-if="current.type === 'multi'" class="text-sm font-bold text-reactor-700">少选得半分，错选不得分</p>

        <div class="space-y-3">
          <button
            v-for="(opt, i) in current.options"
            :key="i"
            :disabled="judged"
            @click="toggle(i)"
            :class="optClass(i)"
            class="opt-btn w-full text-left rounded-xl border-2 px-4 py-3 font-bold"
          >
            {{ letter(i) }}. {{ opt }}
          </button>
        </div>

        <button
          v-if="current.type === 'multi' && !judged"
          @click="confirm"
          :disabled="!picked.length"
          class="big-btn w-full rounded-xl px-4 py-3 font-bold"
          :class="picked.length ? 'bg-reactor-500 text-ink' : 'bg-ink/10 text-ink/40'"
        >确定</button>

        <div v-if="judged && result" class="rounded-xl p-4 text-lg font-bold" :class="result.score === 100 ? 'bg-moss-100 text-moss-700' : result.score === 50 ? 'bg-reactor-100 text-reactor-700' : 'bg-alarm-100 text-alarm-700'">
          {{ result.score === 100 ? "答对了" : result.score === 50 ? "半对，得 50 分" : "答错了，得 0 分" }}
        </div>

        <details v-if="judged && result" open class="rounded-xl bg-paper border border-ink/10 p-4">
          <summary class="text-lg font-bold cursor-pointer">解析</summary>
          <p class="mt-2 text-base leading-relaxed">{{ result.analysis || "暂无解析，欢迎纠错补充。" }}</p>
        </details>

        <div v-if="judged" class="flex gap-2">
          <button @click="toggleFav" :disabled="favBusy" class="big-btn flex-1 border-2 border-ink rounded-xl disabled:opacity-50">
            {{ favBusy ? "收藏中…" : isFav ? "★ 已收藏" : "☆ 收藏" }}
          </button>
          <button @click="next" class="big-btn flex-1 bg-ink text-paper rounded-xl px-4 py-3">下一题</button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, normalizeQuestion, isLoggedIn, type AttemptResult, type Question } from "../api";
import { mockQuestions } from "../mock";

const route = useRoute();
const router = useRouter();
const logged = ref(isLoggedIn());
const loading = ref(true);
const list = ref<Question[]>([]);
const index = ref(0);
const picked = ref<number[]>([]);
const judged = ref(false);
const result = ref<AttemptResult | null>(null);
const doneIds = ref<string[]>([]);
const idsMode = ref(false);
const favSet = ref<Set<string>>(new Set());
const favBusy = ref(false);

const current = computed(() => list.value[index.value]);
const total = computed(() => list.value.length);
const firstReadonly = computed(() => `/q/${list.value[0]?.no || 1}`);
const isFav = computed(() => (current.value ? favSet.value.has(current.value.id) : false));

function letter(i: number): string {
  return String.fromCharCode(65 + i);
}

function typeName(t: Question["type"]): string {
  return t === "single" ? "单选" : t === "multi" ? "多选" : "判断";
}

function localGrade(q: Question, pick: number[]): AttemptResult {
  const ans = [...(q.answer || [])].sort((a, b) => a - b);
  const got = [...pick].sort((a, b) => a - b);
  if (q.type !== "multi") {
    const ok = got.length === 1 && ans.length === 1 && got[0] === ans[0];
    return { score: ok ? 100 : 0, isFull: ok, correctAnswer: ans, analysis: q.analysis || "" };
  }
  if (!got.length) return { score: 0, isFull: false, correctAnswer: ans, analysis: q.analysis || "" };
  if (got.some((v) => !ans.includes(v))) return { score: 0, isFull: false, correctAnswer: ans, analysis: q.analysis || "" };
  if (got.length === ans.length) return { score: 100, isFull: true, correctAnswer: ans, analysis: q.analysis || "" };
  return { score: 50, isFull: false, correctAnswer: ans, analysis: q.analysis || "" };
}

function optClass(i: number): string {
  if (!judged.value || !result.value) {
    return picked.value.includes(i) ? "border-reactor-500 bg-reactor-100" : "border-ink/20 bg-white";
  }
  // 后端公开字段已剔除答案：correctAnswer 缺失时按空数组处理，不崩
  const good = (result.value.correctAnswer || []).includes(i);
  const mine = picked.value.includes(i);
  if (good) return "border-moss-600 bg-moss-100 text-moss-700";
  if (mine) return "border-alarm-600 bg-alarm-100 text-alarm-700";
  return "border-ink/20 bg-white";
}

function reset(): void {
  picked.value = [];
  judged.value = false;
  result.value = null;
}

function parseIds(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

async function refreshFavs(): Promise<void> {
  try {
    const favs = await api.getFavorites();
    favSet.value = new Set(favs.map((f) => f.questionId));
  } catch {
    favSet.value = new Set();
  }
}

async function toggleFav(): Promise<void> {
  const q = current.value;
  if (!q || favBusy.value) return;
  favBusy.value = true;
  try {
    if (isFav.value) {
      await api.removeFavorite(q.id);
      favSet.value.delete(q.id);
    } else {
      await api.addFavorite(q.id);
      favSet.value.add(q.id);
    }
    favSet.value = new Set(favSet.value);
  } catch {
    await refreshFavs();
  } finally {
    favBusy.value = false;
  }
}

async function judge(): Promise<void> {
  const q = current.value;
  if (!q || judged.value) return;
  judged.value = true;
  try {
    result.value = await api.submitAttempt(q.id, picked.value, q.version);
  } catch {
    result.value = localGrade(q, picked.value);
  }
}

function toggle(i: number): void {
  const q = current.value;
  if (!q || judged.value) return;
  if (q.type === "multi") {
    picked.value = picked.value.includes(i) ? picked.value.filter((v) => v !== i) : [...picked.value, i];
    return;
  }
  picked.value = [i];
  void judge();
}

function confirm(): void {
  if (!picked.value.length || judged.value) return;
  void judge();
}

function markDone(): void {
  const q = current.value;
  if (q && !doneIds.value.includes(q.id)) doneIds.value.push(q.id);
}

async function next(): Promise<void> {
  markDone();
  const mode = (route.query.mode as string | undefined) || "seq";
  if (index.value < list.value.length - 1) {
    index.value += 1;
    reset();
    return;
  }
  if (idsMode.value || mode !== "random") {
    router.push(idsMode.value ? "/mistakes" : "/");
    return;
  }
  try {
    const chapterId = route.query.chapterId as string | undefined;
    const more = await api.getQuestionList({ chapterId, mode: "random", limit: 20, excludeIds: doneIds.value });
    if (more.length) {
      list.value = [...list.value, ...more];
      index.value += 1;
      reset();
      return;
    }
  } catch {
    router.push("/");
    return;
  }
  router.push("/");
}

async function load(): Promise<void> {
  loading.value = true;
  reset();
  index.value = 0;
  doneIds.value = [];
  idsMode.value = false;
  const chapterId = route.query.chapterId as string | undefined;
  const mode = (route.query.mode as string | undefined) || "seq";
  const ids = parseIds(route.query.ids);
  let qs: Question[] = [];
  try {
    if (ids.length) {
      idsMode.value = true;
      const rows = await api.getMistakes(ids);
      const byId = new Map(rows.map((m) => [m.questionId, m.question]));
      const missing = ids.filter((id) => !byId.has(id));
      if (missing.length) {
        // 登录优先取含答案解析的详情接口，公开接口无答案时本地判分降级、不崩
        const fetchOne = (id: string) =>
          isLoggedIn()
            ? api.getQuestionDetailById(id).catch(() => api.getQuestionById(id).catch(() => null))
            : api.getQuestionById(id).catch(() => null);
        const fetched = await Promise.all(missing.map((id) => fetchOne(id)));
        for (const q of fetched) {
          if (q) byId.set(q.id, q);
        }
      }
      qs = ids
        .map((id) => byId.get(id))
        .filter((q): q is Question => Boolean(q))
        .map((q) => normalizeQuestion(q));
    } else {
      qs = await api.getQuestionList({ chapterId, mode, limit: 20, excludeIds: doneIds.value });
    }
  } catch {
    if (ids.length) {
      const local = ids
        .map((id) => mockQuestions.find((q) => q.id === id))
        .filter((q): q is Question => Boolean(q));
      qs = local.length ? local : mockQuestions;
    } else {
      qs = chapterId ? mockQuestions.filter((q) => q.chapterId === chapterId) : mockQuestions;
      if (!qs.length) qs = mockQuestions;
    }
  }
  list.value = qs;
  loading.value = false;
}

onMounted(() => {
  logged.value = isLoggedIn();
  void refreshFavs();
  void load();
});

watch(
  () => route.fullPath,
  () => {
    logged.value = isLoggedIn();
    void refreshFavs();
    void load();
  }
);
</script>
