# 开卷 OpenPaper · 产品 Spec（v1.1 定稿）

## 1. 背景与目标
- 背景：尔雅《走进核科学技术》117 道课后题已整理完毕（Notion 题库页），缺少系统化刷题工具。
- 目标：做一个「驾考宝典 for 网课」的公开刷题站，首课《核科学》。
- 技术栈：Vue 3 + Tailwind + NestJS + PostgreSQL + Algolia，Docker Compose 自托管。
- 成功标准：登录用户能跑通 顺序刷 → 随机刷 → 错题重刷 闭环；多选按尔雅半分制判分；移动端可用。

## 2. 用户与范围
- 游客：**只读浏览**。可看课程、章节、题干、选项、答案、解析、搜题。不判分、不落盘。
- 登录用户：刷题、判分、错题本、收藏、统计、纠错。
- MVP 做：课程 / 章节浏览、顺序刷题、随机刷题、逐题判分 + 解析、错题本、收藏、个人统计、题目纠错入口、搜题。
- MVP 不做：模拟考试、后台管理系统（脚本导题）、评论区、排行榜、APP 壳、邮箱验证、找回密码。

## 3. 信息架构
课程 → 章节 → 题目。章节挂课程下（如 2.1 国家安全），题目挂章节下，全局题号 `no` 保留（核科学 1–117）。

## 4. 架构与部署
- 一台国内服务器，docker-compose 运行三个容器：
  - `nginx`：托管前端静态文件，反代 `/api` 到 NestJS，同域名无跨域。
  - `api`：NestJS。
  - `db`：PostgreSQL（纯 Postgres，不使用 Supabase，无 RLS）。
- 权限全部由 NestJS 校验：所有用户数据查询必须带 `user_id = 当前用户`。
- 域名：已有国内域名，**上线前必须完成备案**；备案与开发 / 内测期间用 `IP:端口` 访问。
- 外部依赖：Algolia（仅服务端访问，见 §9）。

### Monorepo 结构（pnpm workspace）
```
openpaper/
├─ apps/
│  ├─ web/            Vue 3 + Vite + Tailwind
│  └─ api/            NestJS
├─ packages/
│  └─ shared/         共享类型、判分函数、DTO schema
├─ scripts/           种子导入、reindex、纠错状态更新
├─ deploy/            docker-compose.yml、nginx.conf、.env.example
├─ docs/SPEC.md
├─ pnpm-workspace.yaml
└─ package.json
```
- 判分逻辑放 `packages/shared`，后端唯一调用；前端仅用于展示类型，不自行判分。

## 5. 数据模型（PostgreSQL）
| 表 | 关键字段 | 说明 |
|---|---|---|
| users | id, username(unique), password_hash, created_at | 用户名 + 密码，argon2/bcrypt |
| courses | id, title, slug, cover, status | slug 如 nuclear-science |
| chapters | id, course_id, code, title, sort | code 如 2.1 |
| questions | id, chapter_id, no, type, stem, options(jsonb), answer(jsonb), analysis, version, status | type=single/multi/judge；status=published/draft |
| attempts | id, user_id, question_id, version, picked(jsonb), score, is_full, created_at | 每次作答，后端判分后写入 |
| mistakes | user_id, question_id, wrong_count, mastered, updated_at | **PK(user_id, question_id)** |
| favorites | user_id, question_id, created_at | PK(user_id, question_id) |
| feedbacks | id, user_id, question_id, content, status, created_at | pending/fixed，由脚本或直接改库更新 |
| sync_queue | id, question_id, op, retries, status | Algolia 同步重试队列 |

约定：
- `options` 为有序数组；判断题固定 `["对","错"]`。
- `answer` 统一为数组（单选 / 判断也是单元素数组，元素为选项下标或 key）。
- 题目改版只升 `version`，不改 id；attempts 记录作答时客户端传入的版本号。
- 索引：attempts(user_id, question_id, created_at desc)、questions(chapter_id, no)。

## 6. 判分规则（后端唯一口径）
- 单选 / 判断：全对 100，否则 0。
- 多选：集合完全一致 = 100；用户选项为标准答案的非空真子集 = 50；含任何错误选项 = 0；空卷 = 0。
- 返回：`score`（0/50/100）+ `is_full` + `correctAnswer` + `analysis`。
- **一律按最新版题目判分**，客户端传的 `version` 只记录，不影响判分；旧 attempts 不重算。

### 错题与掌握状态
- `score < 100`（含半分）：upsert mistakes，`wrong_count + 1`，`mastered = false`。
- `score = 100` 且该题已在错题本：`mastered = true`。
- 掌握后再次答错：重置 `mastered = false`。
- 用户也可手动 `PATCH /api/mistakes/:qid {mastered}`。
- 章节掌握度：按**每题最近一次得分**折算（满分 1、半分 0.5、零分 / 未做 0），取章节平均；使用缓存，作答后失效对应章节缓存。

## 7. API（NestJS，统一 `/api` 前缀）
**认证**（注册 / 登录接口限流）
- `POST /api/auth/register {username, password}`
- `POST /api/auth/login {username, password}` → JWT
- `GET /api/me`

**公开（游客可用）**
- `GET /api/courses`
- `GET /api/courses/:slug/chapters`
- `GET /api/questions/:id`：完整题目含答案 + 解析（只读浏览用）
- `GET /api/search?q=`：服务端代理 Algolia，失败降级 `pg_trgm`

**刷题（需登录）**
- `GET /api/questions?chapterId=&mode=seq|random&limit=&cursor=`：不返回 answer / analysis。
  - `seq`：按 no 排序，游标分页，支持从上次进度继续（`GET /api/progress?chapterId=` 由最近一次 attempts 推导）。
  - `random`：服务端抽取，一轮内不重复（服务端记录本轮已抽集合，如 `roundId`），`limit` 为每批数量。
  - 章节题目列表分页 20 条/页。
- `POST /api/attempts {questionId, picked, version}` → `{score, is_full, correctAnswer, analysis}`，落库并更新 mistakes。
- `GET /api/mistakes`（含题干与选项，用于错题重刷；支持 `?ids=` 批量取题）
- `PATCH /api/mistakes/:qid {mastered}`
- `GET /api/favorites` / `POST /api/favorites {questionId}` / `DELETE /api/favorites/:qid`
- `POST /api/feedbacks {questionId, content}` / `GET /api/feedbacks`（本人）
- `GET /api/me/stats`：正确率、刷题数、章节掌握度。

**内部**
- 管理脚本调内部接口（密钥鉴权）触发 Algolia 同步；失败进 `sync_queue`，定时任务扫描重试。

## 8. 前端（Vue + Tailwind）
- 页面：首页（课程卡）→ 课程页（章节列表 + 掌握度条）→ 答题页 → 错题本 → 收藏 → 我的（统计 + 纠错记录）；另有登录 / 注册、搜索。
- 游客视图：题目详情只读（显示答案与解析），刷题入口点击后引导登录。
- 答题页（驾考宝典式）：单选 / 判断选完即判；多选点「确定」判分 → 答案高亮（绿对红错）→ 解析展开 → 下一题。章节顺序 / 整课随机两种题序。
- 多选题：题干旁显示「多选题」标签，并提示「少选得半分，错选不得分」。
- 路由：题目详情用 `/q/:no`（预留预渲染升级位）。
- 移动端优先，大按钮大字；PWA 可安装（离线刷题 v2）。
- SEO：MVP 接受 SPA 弱 SEO，不做预渲染。

## 9. 搜索
- Algolia 索引 `questions`：可搜 stem + options + 章节名。默认**不索引 answer / analysis**（后续可调整）。
- **前端不直连 Algolia**：请求走 `GET /api/search`，由 NestJS 服务端调用，key 不暴露，规避国内访问不稳。
- 降级：Algolia 超时 / 失败时回落 Postgres `pg_trgm` 检索。
- 同步：NestJS 写库后推送；全量重建 `pnpm reindex`。

## 10. 非功能
- 安全：密码哈希；JWT 鉴权；所有用户数据查询强制带 user_id；登录 / 注册 / 判分接口限流；输入校验（DTO）。
- 性能：题目列表分页；章节掌握度缓存。
- 运维：Postgres 数据卷持久化 + 定时 `pg_dump` 备份；Algolia 用量告警。
- 合规：题干基于自有整理改写，页脚「仅供学习交流」+ 纠错通道；域名备案后方可公开上线。

## 11. 种子数据
- 117 道核科学题；`[推导]` 转 analysis 初稿；无解析标「暂无解析，欢迎纠错补充」。
- 导入脚本：读 Markdown → 写 questions 表 → 推 Algolia，全链路可重跑（按 course slug + no 幂等 upsert）。

## 12. 里程碑
- M1：monorepo 脚手架 + docker-compose + 认证 + 三层数据 + 种子导入 + 顺序刷题 + 判分。
- M2：随机刷题 + 错题本 + 收藏 + 统计。
- M3：搜索（Algolia + 降级）+ 纠错 + PWA + 备案后域名上线。

## 13. 已决策事项
| 事项 | 决定 |
|---|---|
| 游客权限 | 只读浏览，含答案 |
| 数据库 | 自托管纯 Postgres，无 RLS |
| 登录 | 用户名 + 密码，无邮箱 / 找回 |
| 半分 | 计入错题 |
| 题目升版 | 按新版判分，旧记录保留 |
| 前端部署 | 与后端同机，nginx 托管 |
| 搜索 | NestJS 代理 Algolia，pg_trgm 降级 |
| 域名 | 国内域名，备案前用 IP:端口 |
| 仓库 | pnpm monorepo |

## 14. 开放问题
- 登录用户体验：无找回密码，是否后续加「管理员重置」脚本。
- 是否后续将 answer / analysis 纳入搜索索引。
