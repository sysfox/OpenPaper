<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-10 bg-ink text-paper">
      <div class="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2 font-song text-xl font-bold">
          <span class="inline-block h-5 w-2 bg-reactor-500 rounded-sm"></span>
          开卷 OpenPaper
        </RouterLink>
        <nav class="flex items-center gap-3 text-base">
          <RouterLink v-if="!logged" to="/login" class="underline underline-offset-4">登录</RouterLink>
          <button v-else class="underline underline-offset-4" @click="onLogout">退出</button>
        </nav>
      </div>
      <div class="rod-track h-1.5"></div>
    </header>
    <main class="flex-1 w-full mx-auto max-w-3xl px-4 pb-24 pt-4">
      <RouterView />
    </main>
    <nav class="fixed bottom-0 inset-x-0 bg-white border-t border-ink/10">
      <div class="mx-auto max-w-3xl grid grid-cols-3 text-center">
        <RouterLink to="/" class="py-3 text-lg font-bold">首页</RouterLink>
        <RouterLink to="/course/nuclear-science" class="py-3 text-lg font-bold">课程</RouterLink>
        <RouterLink :to="logged ? '/quiz' : '/login'" class="py-3 text-lg font-bold text-reactor-700">刷题</RouterLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import { api, isLoggedIn } from "./api";

const route = useRoute();
const router = useRouter();
const logged = ref(isLoggedIn());

watch(
  () => route.fullPath,
  () => {
    logged.value = isLoggedIn();
  }
);

function onLogout(): void {
  api.logout();
  logged.value = false;
  router.push("/");
}
</script>
