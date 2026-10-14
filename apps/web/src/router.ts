import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import Home from "./pages/Home.vue";
import Course from "./pages/Course.vue";
import Quiz from "./pages/Quiz.vue";
import QuestionDetail from "./pages/QuestionDetail.vue";
import Login from "./pages/Login.vue";
import Register from "./pages/Register.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", name: "home", component: Home },
  { path: "/course/:slug", name: "course", component: Course, props: true },
  { path: "/quiz", name: "quiz", component: Quiz },
  { path: "/q/:no", name: "question", component: QuestionDetail, props: true, alias: "/Q/:no" },
  { path: "/login", name: "login", component: Login },
  { path: "/register", name: "register", component: Register }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

export default router;
