<template>
  <section class="max-w-md mx-auto bg-white border-2 border-ink rounded-2xl p-6 space-y-4">
    <h1 class="font-song text-3xl font-bold">注册</h1>
    <p class="text-base text-ink/60">用户名加密码就行，不用邮箱。</p>
    <div v-if="error" class="bg-alarm-100 text-alarm-700 rounded-xl p-3 text-base">{{ error }}</div>
    <label class="block space-y-1">
      <span class="text-base font-bold">用户名</span>
      <input v-model="username" class="w-full border-2 border-ink rounded-xl px-4 py-3 text-lg" placeholder="起个名字" />
    </label>
    <label class="block space-y-1">
      <span class="text-base font-bold">密码</span>
      <input v-model="password" type="password" class="w-full border-2 border-ink rounded-xl px-4 py-3 text-lg" placeholder="至少 6 位" />
    </label>
    <button @click="submit" :disabled="busy" class="big-btn w-full bg-reactor-500 text-ink rounded-xl disabled:opacity-50">{{ busy ? "注册中…" : "注册并登录" }}</button>
    <p class="text-base text-center">已有账号？<RouterLink to="/login" class="font-bold underline underline-offset-4">去登录</RouterLink></p>
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
  if (!username.value.trim() || password.value.length < 6) {
    error.value = "用户名必填，密码至少 6 位。";
    return;
  }
  busy.value = true;
  try {
    const res = await api.register(username.value.trim(), password.value);
    setToken(res.token);
    router.push("/quiz");
  } catch (e) {
    error.value = e instanceof Error ? e.message : "注册失败。";
  } finally {
    busy.value = false;
  }
}
</script>
