<template>
  <section class="max-w-md mx-auto bg-white border-2 border-ink rounded-2xl p-6 space-y-4">
    <h1 class="font-song text-3xl font-bold">登录</h1>
    <p class="text-base text-ink/60">登录后刷题、判分、记进度。</p>
    <div v-if="error" class="bg-alarm-100 text-alarm-700 rounded-xl p-3 text-base">{{ error }}</div>
    <label class="block space-y-1">
      <span class="text-base font-bold">用户名</span>
      <input v-model="username" class="w-full border-2 border-ink rounded-xl px-4 py-3 text-lg" placeholder="输入用户名" />
    </label>
    <label class="block space-y-1">
      <span class="text-base font-bold">密码</span>
      <input v-model="password" type="password" class="w-full border-2 border-ink rounded-xl px-4 py-3 text-lg" placeholder="输入密码" />
    </label>
    <button @click="submit" :disabled="busy" class="big-btn w-full bg-ink text-paper rounded-xl disabled:opacity-50">{{ busy ? "登录中…" : "登录" }}</button>
    <p class="text-base text-center">没账号？<RouterLink to="/register" class="font-bold underline underline-offset-4">去注册</RouterLink></p>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api, setToken } from "../api";

const router = useRouter();
const username = ref("");
const password = ref("");
const error = ref("");
const busy = ref(false);

async function submit(): Promise<void> {
  error.value = "";
  if (!username.value.trim() || !password.value) {
    error.value = "请填写用户名和密码。";
    return;
  }
  busy.value = true;
  try {
    const res = await api.login(username.value.trim(), password.value);
    setToken(res.token);
    router.push("/quiz");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "登录失败。";
  } finally {
    busy.value = false;
  }
}
</script>
