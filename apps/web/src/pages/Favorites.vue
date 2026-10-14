<template>
  <section class="space-y-4">
    <div>
      <p class="text-sm font-bold text-reactor-700 tracking-widest">常看常新</p>
      <h1 class="font-song text-3xl font-bold mt-1">收藏</h1>
    </div>

    <div v-if="!logged" class="bg-white border-2 border-ink rounded-2xl p-6 text-center space-y-4">
      <h2 class="text-2xl font-bold">登录后看收藏</h2>
      <p class="text-lg text-ink/70">收藏只存在你的账号里。</p>
      <RouterLink to="/login" class="big-btn block bg-reactor-500 text-ink rounded-xl px-4 py-3">去登录</RouterLink>
    </div>

    <div v-else class="space-y-4">
      <div v-if="loading" class="bg-white rounded-2xl border-2 border-ink p-6 text-lg">收藏加载中…</div>
      <div v-else-if="error" class="bg-alarm-100 text-alarm-700 rounded-xl p-4 text-base">{{ error }}</div>
      <template v-else>
        <div v-if="!items.length" class="bg-white rounded-2xl border-2 border-ink p-6 text-lg text-center">还没收藏，刷题时点星标收藏。</div>
        <article
          v-for="f in items"
          :key="f.questionId"
          class="bg-white rounded-2xl border-2 border-ink p-4 space-y-3"
        >
          <p class="text-sm font-bold text-ink/50">第 {{ f.question?.no || "–" }} 题</p>
          <h2 class="text-lg font-bold leading-relaxed">{{ f.question?.stem || "题目" }}</h2>
          <div class="flex gap-2">
            <RouterLink
              v-if="(f.question?.no || 0) > 0"
              :to="`/q/${f.question?.no}`"
              class="big-btn flex-1 text-center border-2 border-ink rounded-xl py-2 text-base"
            >看解析</RouterLink>
            <button
              @click="remove(f.questionId)"
              :disabled="busyId === f.questionId"
              class="big-btn flex-1 bg-ink text-paper rounded-xl disabled:opacity-50"
            >取消收藏</button>
          </div>
        </article>
        <RouterLink
          v-if="redoLink"
          :to="redoLink"
          class="big-btn block text-center bg-reactor-500 text-ink rounded-xl px-4 py-3"
        >重刷全部收藏</RouterLink>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, isLoggedIn, type Favorite } from "../api";

const logged = ref(isLoggedIn());
const loading = ref(false);
const error = ref("");
const items = ref<Favorite[]>([]);
const busyId = ref("");

const redoLink = computed(() => {
  const ids = items.value.map((f) => f.questionId).filter(Boolean);
  return ids.length ? `/quiz?ids=${encodeURIComponent(ids.join(","))}` : "";
});

async function remove(qid: string): Promise<void> {
  busyId.value = qid;
  try {
    await api.removeFavorite(qid);
    items.value = items.value.filter((f) => f.questionId !== qid);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "取消失败。";
  } finally {
    busyId.value = "";
  }
}

onMounted(async () => {
  logged.value = isLoggedIn();
  if (!logged.value) return;
  loading.value = true;
  try {
    items.value = await api.getFavorites();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "收藏加载失败。";
  } finally {
    loading.value = false;
  }
});
</script>
