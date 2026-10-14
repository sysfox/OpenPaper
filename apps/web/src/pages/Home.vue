<template>
  <section class="space-y-5">
    <div class="bg-ink text-paper rounded-2xl p-6 overflow-hidden relative">
      <p class="text-sm tracking-widest text-reactor-500 font-bold">
        驾考宝典 FOR 网课
      </p>
      <h1 class="font-song text-3xl font-bold leading-snug mt-2">
        先看题，再懂核。<br />117 道，刷透它。
      </h1>
      <p class="mt-3 text-base text-paper/80">
        顺序刷 · 随机刷 · 错题重刷，手机上就能刷。
      </p>
      <form class="mt-5 flex gap-2" @submit.prevent="goSearch">
        <input
          v-model="keyword"
          placeholder="搜题干，如 铀-235"
          class="flex-1 min-w-0 rounded-xl px-4 py-3 text-lg text-ink bg-paper"
        />
        <button
          type="submit"
          class="big-btn bg-reactor-500 text-ink rounded-xl px-5"
        >
          搜题
        </button>
      </form>
      <div class="mt-5 flex gap-3">
        <RouterLink
          to="/course/nuclear-science"
          class="big-btn flex-1 text-center bg-reactor-500 text-ink rounded-xl px-4 py-3"
          >开始看课</RouterLink
        >
        <RouterLink
          :to="logged ? '/quiz' : '/login'"
          class="big-btn flex-1 text-center bg-paper text-ink rounded-xl px-4 py-3"
          >去刷题</RouterLink
        >
      </div>
      <div class="rod-track h-2 mt-6 rounded-full"></div>
    </div>

    <div
      v-if="error"
      class="bg-alarm-100 text-alarm-700 rounded-xl p-4 text-base"
    >
      课程加载失败，已显示本地示例课。
    </div>

    <h2 class="text-xl font-bold">课程</h2>
    <RouterLink
      v-for="c in courses"
      :key="c.id"
      :to="`/course/${c.slug}`"
      class="block bg-white rounded-2xl border-2 border-ink p-5 shadow-[4px_4px_0_#101E2C]"
    >
      <p class="text-sm font-bold text-reactor-700">
        首课 · {{ c.questionCount || 117 }} 题
      </p>
      <h3 class="text-2xl font-bold mt-1">{{ c.title }}</h3>
      <p class="text-base text-ink/60 mt-1">走进核科学技术 · 章节刷题</p>
      <span
        class="big-btn mt-4 inline-block bg-ink text-paper rounded-xl px-6 py-3"
        >进入课程</span
      >
    </RouterLink>

    <p class="text-center text-sm text-ink/50 pt-2">仅供学习交流</p>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api, isLoggedIn, type Course } from "../api";
import { mockCourses } from "../mock";

const router = useRouter();
const courses = ref<Course[]>(mockCourses);
const error = ref(false);
const logged = ref(isLoggedIn());
const keyword = ref("");

function goSearch(): void {
  if (!keyword.value.trim()) {
    router.push("/search");
    return;
  }
  router.push(`/search?q=${encodeURIComponent(keyword.value.trim())}`);
}

onMounted(async () => {
  try {
    const list = await api.getCourses();
    if (list.length) courses.value = list;
  } catch {
    error.value = true;
    courses.value = mockCourses;
  }
  logged.value = isLoggedIn();
});
</script>
