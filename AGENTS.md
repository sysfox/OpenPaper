# AGENTS.md

## 沟通
- 用中文，简洁直接说结论。
- 代码注释、文档默认中文，技术术语保留英文原文。
- 无需解释过程，只报结果和关键决策。

## 代码风格
- Prettier + ESLint 默认配置，不自定义规则。
- 前端：Vue 3 + Vite + Tailwind；后端：NestJS；共享逻辑放 `packages/shared`。
- 判分逻辑只在 `packages/shared`，前后端不各写一份。
- 不主动加注释，逻辑自解释优先。

## 验证
- 改完代码只跑类型检查：前端 `vue-tsc`，后端 `tsc --noEmit`。
- 不主动跑 lint、测试、构建，有需要再说。

## Git 提交
- 尽可能经常提交，保持小步提交。
- 提交信息只客观描述做了什么，不带 milestone、规划、阶段等字眼。
- 示例：`新增 questions 顺序分页接口`、`修复多选半分判分逻辑`。
- Commit message 结尾加：`Co-authored-by: CommandCodeBot <noreply@commandcode.ai>`。

## 项目速览
- 详见 `docs/SPEC.md`（v1.1 为准）。
- 结构：`apps/web`、`apps/api`、`packages/shared`、`scripts`、`deploy`。
- 部署：单机 docker-compose（nginx + api + postgres），同域名。
