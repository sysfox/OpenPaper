<template>
  <section class="space-y-4">
    <div>
      <p class="text-sm font-bold text-reactor-700 tracking-widest">学习画像</p>
      <h1 class="font-song text-3xl font-bold mt-1">我的</h1>
    </div>

    <div
      v-if="!logged"
      class="bg-white border-2 border-ink rounded-2xl p-6 text-center space-y-4"
    >
      <h2 class="text-2xl font-bold">登录后看统计</h2>
      <p class="text-lg text-ink/70">刷题数和掌握度只记在你的账号里。</p>
      <RouterLink
        to="/login"
        class="big-btn block bg-reactor-500 text-ink rounded-xl px-4 py-3"
        >去登录</RouterLink
      >
    </div>

    <div v-else class="space-y-4">
      <div
        v-if="loading"
        class="bg-white rounded-2xl border-2 border-ink p-6 text-lg"
      >
        统计加载中…
      </div>
      <div
        v-else-if="error"
        class="bg-alarm-100 text-alarm-700 rounded-xl p-4 text-base"
      >
        {{ error }}
      </div>
      <template v-else>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-white rounded-2xl border-2 border-ink p-4 text-center">
            <p class="text-sm font-bold text-ink/50">刷题数</p>
            <p class="text-3xl font-bold mt-1">{{ stats?.answered || 0 }}</p>
          </div>
          <div class="bg-white rounded-2xl border-2 border-ink p-4 text-center">
            <p class="text-sm font-bold text-ink/50">满分率</p>
            <p class="text-3xl font-bold mt-1">
              {{ Math.round((stats?.fullRate || 0) * 100) }}%
            </p>
          </div>
        </div>

        <div class="bg-white rounded-2xl border-2 border-ink p-4 space-y-3">
          <h2 class="text-xl font-bold">章节掌握度</h2>
          <div v-if="!stats?.chapters.length" class="text-base text-ink/60">
            还没数据，先去刷几道。
          </div>
          <div
            v-for="c in stats?.chapters"
            :key="c.chapterId"
            class="space-y-1"
          >
            <div class="flex justify-between text-base">
              <span class="font-bold">{{ c.title || c.chapterId }}</span>
              <span class="text-ink/60"
                >{{ Math.round(c.mastery * 100) }}%</span
              >
            </div>
            <div class="h-3 rounded-full bg-ink/10 overflow-hidden">
              <div
                class="h-full bg-reactor-500 rounded-full"
                :style="{ width: `${Math.round(c.mastery * 100)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border-2 border-ink p-4 space-y-3">
          <h2 class="text-xl font-bold">题目纠错</h2>
          <div class="flex gap-2">
            <input
              v-model="fbNo"
              inputmode="numeric"
              placeholder="题号，如 12"
              class="w-28 border-2 border-ink rounded-xl px-3 py-3 text-lg"
            />
            <input
              v-model="fbText"
              placeholder="哪里不对？"
              class="flex-1 min-w-0 border-2 border-ink rounded-xl px-3 py-3 text-lg"
            />
          </div>
          <button
            :disabled="fbBusy"
            class="big-btn w-full bg-ink text-paper rounded-xl disabled:opacity-50"
            @click="sendFeedback"
          >
            {{ fbBusy ? "提交中…" : "提交纠错" }}
          </button>
          <p v-if="fbMsg" class="text-base text-moss-700 font-bold">
            {{ fbMsg }}
          </p>
        </div>

        <div class="bg-white rounded-2xl border-2 border-ink p-4 space-y-2">
          <h2 class="text-xl font-bold">我的纠错记录</h2>
          <div v-if="!feedbacks.length" class="text-base text-ink/60">
            暂无记录。
          </div>
          <div
            v-for="f in feedbacks"
            :key="f.id"
            class="border-t border-ink/10 pt-2 first:border-0 first:pt-0"
          >
            <p class="text-base">
              <span class="font-bold">{{
                f.questionNo ? `第 ${f.questionNo} 题` : "题目"
              }}</span>
              · {{ statusName(f.status) }}
            </p>
            <p class="text-base text-ink/70">{{ f.content }}</p>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, isLoggedIn, type Feedback, type Stats } from "../api";

const logged = ref(isLoggedIn());
const loading = ref(false);
const error = ref("");
const stats = ref<Stats | null>(null);
const feedbacks = ref<Feedback[]>([]);
const fbNo = ref("");
const fbText = ref("");
const fbBusy = ref(false);
const fbMsg = ref("");

function statusName(s: string): string {
  if (s === "fixed") return "已修复";
  if (s === "pending") return "待处理";
  return s;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function sendFeedback(): Promise<void> {
  fbMsg.value = "";
  const content = fbText.value.trim();
  const noRaw = fbNo.value.trim();
  if (!noRaw) {
    fbMsg.value = "先填题号，如 12。";
    return;
  }
  if (!content) {
    fbMsg.value = "先写一句哪里不对。";
    return;
  }
  fbBusy.value = true;
  try {
    let questionId = noRaw;
    if (!UUID_RE.test(noRaw)) {
      const no = Number(noRaw);
      if (!Number.isInteger(no) || no < 1) {
        throw new Error("题号不对，填数字如 12。");
      }
      const found = await api.getQuestionByNo(no);
      questionId = found.id;
    }
    await api.submitFeedback(questionId, content);
    fbMsg.value = "已收到，谢谢纠错。";
    fbText.value = "";
    feedbacks.value = await api.getMyFeedbacks();
  } catch (e) {
    fbMsg.value = e instanceof Error ? e.message : "提交失败。";
  } finally {
    fbBusy.value = false;
  }
}

onMounted(async () => {
  logged.value = isLoggedIn();
  if (!logged.value) return;
  loading.value = true;
  try {
    const [s, f] = await Promise.all([api.getStats(), api.getMyFeedbacks()]);
    stats.value = s;
    feedbacks.value = f;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "统计加载失败。";
  } finally {
    loading.value = false;
  }
});
</script>
