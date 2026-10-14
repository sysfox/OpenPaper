<template>
  <section class="space-y-4">
    <RouterLink to="/" class="text-base underline underline-offset-4">‹ 返回首页</RouterLink>
    <div>
      <p class="text-sm font-bold text-reactor-700 tracking-widest">搜题干找题号</p>
      <h1 class="font-song text-3xl font-bold mt-1">搜索</h1>
    </div>
    <form @submit.prevent="run" class="flex gap-2">
      <input
        v-model="q"
        placeholder="输入关键词，如 铀-235"
        class="flex-1 min-w-0 border-2 border-ink rounded-xl px-4 py-3 text-lg bg-white"
      />
      <button type="submit" :disabled="busy" class="big-btn bg-ink text-paper rounded-xl px-6 disabled:opacity-50">
        {{ busy ? "搜…" : "搜" }}
      </button>
    </form>
    <div v-if="error" class="bg-alarm-100 text-alarm-700 rounded-xl p-4 text-base">{{ error }}</div>
    <div v-if="done && !results.length && !error" class="bg-white rounded-2xl border-2 border-ink p-6 text-lg text-center">没搜到，换个词试试。</div>
    <RouterLink
      v-for="r in results"
      :key="r.id"
      :to="`/q/${r.no}`"
      class="block bg-white rounded-2xl border-2 border-ink p-4 space-y-1"
    >
      <p class="text-sm font-bold text-ink/50">第 {{ r.no }} 题{{ r.chapterTitle ? ` · ${r.chapterTitle}` : "" }}</p>
      <h2 class="text-lg font-bold leading-relaxed">{{ r.stem }}</h2>
    </RouterLink>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { api, type SearchResult } from "../api";

const route = useRoute();
const q = ref("");
const results = ref<SearchResult[]>([]);
const busy = ref(false);
const error = ref("");
const done = ref(false);

async function run(): Promise<void> {
  error.value = "";
  results.value = [];
  done.value = false;
  if (!q.value.trim()) return;
  busy.value = true;
  try {
    results.value = await api.search(q.value.trim());
    done.value = true;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "搜索失败。";
  } finally {
    busy.value = false;
  }
}

onMounted(() => {
  const init = route.query.q as string | undefined;
  if (init) {
    q.value = init;
    void run();
  }
});
</script>
