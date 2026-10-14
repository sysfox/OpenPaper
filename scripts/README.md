# scripts

链路：Markdown 读题，写 questions 表，推 Algolia 索引。

## 题库格式

文件：`seed/questions.md`，模板见 `seed/questions.md.example`。

- `#` 课程标题，`## 章节code 章节名`，`### no` 开一题。
- 每题字段：`类型`（单选/多选/判断）、`章节`、`题干`、`选项`、`答案`、`解析`。
- 选项写 `- A. 内容` 列表；判断题可省略选项，默认 `对/错`。
- 答案支持 `A` / `A,B,C` / `1` / `对` 写法，转选项下标数组。
- 解析缺省写 `暂无解析，欢迎纠错补充`；`[推导]` 前缀自动去掉。

## 命令

根目录执行：

- `pnpm import:seed`：解析导入并推送索引。
- `pnpm reindex`：全量重建索引。
- `pnpm --filter @openpaper/scripts sync:retry`：重推 `sync_queue`。

首次使用：`copy scripts\seed\questions.md.example scripts\seed\questions.md`。

## 幂等

按 `course slug + no` 做 upsert，重跑结果一致。

- 先确保 `courses` / `chapters` 存在，再写入 `questions`，`status=published`。
- 重复导入只更新字段并 `version + 1`，不新增行。

## 环境变量

- `DATABASE_URL`：必填，Postgres 连接串。
- `COURSE_SLUG`：可选，默认 `nuclear-science`。
- `ALGOLIA_APP_ID` / `ALGOLIA_API_KEY`：可选，缺省跳过推送。
- `ALGOLIA_INDEX`：可选，默认 `questions`。
- `SYNC_BATCH`：可选，重试批量，默认 `100`。

索引只含题干、选项、章节名，不含答案与解析；推送失败写入 `sync_queue`。
