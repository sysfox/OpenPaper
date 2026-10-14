<template>
  <section class="space-y-4">
    <div>
      <p class="text-sm font-bold text-reactor-700 tracking-widest">查漏补缺</p>
      <h1 class="font-song text-3xl font-bold mt-1">错题本</h1>
    </div>

    <div v-if="!logged" class="bg-white border-2 border-ink rounded-2xl p-6 text-center space-y-4">
      <h2 class="text-2xl font-bold">登录后看错题</h2>
      <p class="text-lg text-ink/70">错题只存在你的账号里。</p>
      <RouterLink to="/login" class="big-btn block bg-reactor-500 text-ink rounded-xl px-4 py-3">去登录</RouterLink>
    </div>

    <div v-else class="space-y-4">
      <div v-if="loading" class="bg-white rounded-2xl border-2 border-ink p-6 text-lg">错题加载中…</div>
      <div v-else-if="error" class="bg-alarm-100 text-alarm-700 rounded-xl p-4 text-base">{{ error }}</div>
      <template v-else>
        <p class="text-base text-ink/60">未掌握 {{ openCount }} 道 · 已掌握 {{ doneCount }} 道</p>
        <div v-if="!items.length" class="bg-white rounded-2xl border-2 border-ink p-6 text-lg text-center">暂时没错题，继续保持。</div>
        <article
          v-for="m in items"
          :key="m.questionId"
          class="bg-white rounded-2xl border-2 border-ink p-4 space-y-3"
        >
          <p class="text-sm font-bold text-ink/50">
            第 {{ m.question.no }} 题 · 错 {{ m.wrongCount }} 次 · {{ m.mastered ? "已掌握" : "未掌握" }}
          </p>
          <h2 class="text-lg font-bold leading-relaxed">{{ m.question.stem }}</h2>
          <div class="flex gap-2">
            <RouterLink
              v-if="m.question.no > 0"
              :to="`/q/${m.question.no}`"
              class="big-btn flex-1 text-center border-2 border-ink rounded-xl py-2 text-base"
            >看解析</RouterLink>
            <button
              @click="toggle(m)"
              :disabled="busyId === m.questionId"
              class="big-btn flex-1 bg-ink text-paper rounded-xl disabled:opacity-50"
            >{{ m.mastered ? "取消掌握" : "标为掌握" }}</button>
          </div>
        </article>
        <RouterLink
          v-if="redoLink"
          :to="redoLink"
          class="big-btn block text-center bg-reactor-500 text-ink rounded-xl px-4 py-3"
        >去重刷 {{ openCount }} 道错题</RouterLink>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, isLoggedIn, type Mistake } from "../api";

const logged = ref(isLoggedIn());
const loading = ref(false);
const error = ref("");
const items = ref<Mistake[]>([]);
const busyId = ref("");

const openCount = computed(() => items.value.filter((m) => !m.mastered).length);
const doneCount = computed(() => items.value.filter((m) => m.mastered).length);
const redoLink = computed(() => {
  const ids = items.value.filter((m) => !m.mastered).map((m) => m.questionId);
  return ids.length ? `/quiz?ids=${encodeURIComponent(ids.join(","))}` : "";
});

async function toggle(m: Mistake): Promise<void> {
  busyId.value = m.questionId;
  try {
    await api.setMastered(m.questionId, !m.mastered);
    m.mastered = !m.mastered;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "更新失败。";
  } finally {
    busyId.value = "";
  }
}

onMounted(async () => {
  logged.value = isLoggedIn();
  if (!logged.value) return;
  loading.value = true;
  try {
    items.value = await api.getMistakes();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "错题加载失败。";
  } finally {
    loading.value = false;
  }
});
</script>
