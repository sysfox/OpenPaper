<template>
  <section class="space-y-4">
    <RouterLink to="/" class="text-base underline underline-offset-4"
      >‹ 返回首页</RouterLink
    >
    <div
      v-if="loading"
      class="bg-white rounded-2xl border-2 border-ink p-6 text-lg"
    >
      题目加载中…
    </div>
    <div
      v-else-if="!q"
      class="bg-white rounded-2xl border-2 border-ink p-6 text-lg"
    >
      没找到这道题。
    </div>
    <article
      v-else
      class="bg-white rounded-2xl border-2 border-ink p-5 space-y-4"
    >
      <div class="flex items-center gap-2">
        <p class="text-sm font-bold text-ink/50">
          第 {{ q.no }} 题 ·
          {{
            q.type === "single" ? "单选" : q.type === "multi" ? "多选" : "判断"
          }}
        </p>
        <span
          class="text-sm font-bold text-ink/40 border rounded-full px-2 py-0.5"
          >只读</span
        >
      </div>
      <h1 class="text-xl font-bold leading-relaxed">{{ q.stem }}</h1>
      <ol class="space-y-2">
        <li
          v-for="(opt, i) in q.options"
          :key="i"
          class="rounded-xl border-2 px-4 py-3 text-base font-bold"
          :class="
            answer.includes(i) ? 'border-moss-600 bg-moss-100' : 'border-ink/15'
          "
        >
          {{ letter(i) }}. {{ opt }}
        </li>
      </ol>
      <div
        v-if="answer.length || q.analysis"
        class="rounded-xl bg-paper border border-ink/10 p-4"
      >
        <p v-if="answer.length" class="text-base">
          <span class="font-bold">答案：</span>{{ answerText }}
        </p>
        <p v-if="q.analysis" class="mt-2 text-base leading-relaxed">
          <span class="font-bold">解析：</span>{{ q.analysis }}
        </p>
      </div>
      <p
        v-else
        class="rounded-xl bg-paper border border-ink/10 p-4 text-base text-ink/60"
      >
        游客只读看题干选项，登录后查看答案解析。
      </p>
      <div class="flex gap-2">
        <button
          :disabled="q.no <= 1"
          class="big-btn flex-1 border-2 border-ink rounded-xl disabled:opacity-30"
          @click="go(q.no - 1)"
        >
          上一题
        </button>
        <button
          class="big-btn flex-1 bg-ink text-paper rounded-xl"
          @click="go(q.no + 1)"
        >
          下一题
        </button>
      </div>
      <RouterLink
        v-if="!logged"
        to="/login"
        class="big-btn block text-center bg-reactor-500 text-ink rounded-xl px-4 py-3"
        >登录后刷题判分</RouterLink
      >
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { api, isLoggedIn, type Question } from "../api";
import { findMockQuestion } from "../mock";

const props = defineProps<{ no: string }>();
const router = useRouter();
const q = ref<Question | null>(null);
const loading = ref(true);
const logged = ref(isLoggedIn());

const answer = computed(() => q.value?.answer || []);
const answerText = computed(
  () =>
    answer.value.map((i) => String.fromCharCode(65 + i)).join("、") || "暂无",
);

function letter(i: number): string {
  return String.fromCharCode(65 + i);
}

function go(no: number): void {
  if (no < 1) return;
  router.push(`/q/${no}`);
}

async function load(): Promise<void> {
  loading.value = true;
  logged.value = isLoggedIn();
  const no = Number(props.no);
  try {
    // 登录优先取含答案解析的详情接口，失败/未登录回落公开接口
    q.value = logged.value
      ? await api.getQuestionDetailByNo(no).catch(() => api.getQuestionByNo(no))
      : await api.getQuestionByNo(no);
  } catch {
    q.value = findMockQuestion(no) || null;
  }
  loading.value = false;
}

onMounted(() => void load());
watch(
  () => props.no,
  () => void load(),
);
</script>
