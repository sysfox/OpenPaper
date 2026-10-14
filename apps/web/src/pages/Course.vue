<template>
  <section class="space-y-4">
    <RouterLink to="/" class="text-base underline underline-offset-4">‹ 返回首页</RouterLink>
    <div>
      <p class="text-sm font-bold text-reactor-700 tracking-widest">课程 · {{ props.slug }}</p>
      <h1 class="font-song text-3xl font-bold mt-1">走进核科学技术</h1>
    </div>

    <div v-if="error" class="bg-alarm-100 text-alarm-700 rounded-xl p-4 text-base">章节加载失败，已显示本地示例。</div>

    <div class="space-y-3">
      <div
        v-for="ch in chapters"
        :key="ch.id"
        class="bg-white rounded-2xl border-2 border-ink p-4"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-bold text-ink/50">{{ ch.code }} · {{ ch.questionCount || 0 }} 题</p>
            <h2 class="text-xl font-bold">{{ ch.title }}</h2>
          </div>
          <RouterLink
            :to="`/quiz?chapterId=${ch.id}`"
            class="big-btn shrink-0 bg-ink text-paper rounded-xl px-5 py-3"
          >刷题</RouterLink>
        </div>
        <div class="mt-3">
          <div class="flex justify-between text-sm text-ink/60">
            <span>掌握度</span>
            <span>{{ Math.round((ch.mastery || 0) * 100) }}%</span>
          </div>
          <div class="h-3 mt-1 rounded-full bg-ink/10 overflow-hidden">
            <div class="h-full bg-reactor-500 rounded-full" :style="{ width: `${Math.round((ch.mastery || 0) * 100)}%` }"></div>
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <RouterLink :to="`/quiz?chapterId=${ch.id}`" class="flex-1 text-center border-2 border-ink rounded-xl py-2 text-base font-bold">顺序刷</RouterLink>
          <RouterLink :to="`/quiz?chapterId=${ch.id}&mode=random`" class="flex-1 text-center border-2 border-ink rounded-xl py-2 text-base font-bold">随机刷</RouterLink>
        </div>
      </div>
    </div>

    <div v-if="!logged" class="bg-reactor-100 border-2 border-reactor-500 rounded-2xl p-4 text-base">
      游客只能看题，刷题判分请先
      <RouterLink to="/login" class="font-bold underline underline-offset-4">登录</RouterLink>。
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, isLoggedIn, type Chapter } from "../api";
import { mockChapters } from "../mock";

const props = defineProps<{ slug: string }>();
const chapters = ref<Chapter[]>([]);
const error = ref(false);
const logged = ref(isLoggedIn());

onMounted(async () => {
  logged.value = isLoggedIn();
  try {
    chapters.value = await api.getChapters(props.slug);
  } catch {
    error.value = true;
    chapters.value = mockChapters;
    return;
  }
  if (!logged.value) return;
  const rows = await Promise.all(
    chapters.value.map(async (ch) => {
      try {
        const p = await api.getProgress(ch.id);
        return { id: ch.id, mastery: p.mastery };
      } catch {
        return { id: ch.id, mastery: ch.mastery || 0 };
      }
    })
  );
  const byId = new Map(rows.map((r) => [r.id, r.mastery]));
  chapters.value = chapters.value.map((ch) => ({ ...ch, mastery: byId.get(ch.id) ?? ch.mastery ?? 0 }));
});
</script>
