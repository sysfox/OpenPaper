# scripts

链路：Markdown 读题，写 questions 表，推 Algolia 索引。
命令：根目录执行 pnpm import:seed，pnpm reindex。
可重跑：同一数据多次执行结果一致。
幂等：按 course slug + no 做 upsert。
种子：放 seed 目录，Algolia 失败进 sync_queue 重试。
