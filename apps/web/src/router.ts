import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import Home from "./pages/Home.vue";
import Course from "./pages/Course.vue";
import Quiz from "./pages/Quiz.vue";
import QuestionDetail from "./pages/QuestionDetail.vue";
import Login from "./pages/Login.vue";
import Register from "./pages/Register.vue";
import Mistakes from "./pages/Mistakes.vue";
import Favorites from "./pages/Favorites.vue";
import Me from "./pages/Me.vue";
import Search from "./pages/Search.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", name: "home", component: Home },
  { path: "/course/:slug", name: "course", component: Course, props: true },
  { path: "/quiz", name: "quiz", component: Quiz },
  {
    path: "/q/:no",
    name: "question",
    component: QuestionDetail,
    props: true,
    alias: "/Q/:no",
  },
  { path: "/mistakes", name: "mistakes", component: Mistakes },
  { path: "/favorites", name: "favorites", component: Favorites },
  { path: "/me", name: "me", component: Me },
  { path: "/search", name: "search", component: Search },
  { path: "/login", name: "login", component: Login },
  { path: "/register", name: "register", component: Register },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
