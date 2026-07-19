# 在线测评系统

一个面向企业招聘 Java 开发岗位的在线测评系统，计划主要部署在 Cloudflare 上。

## 当前范围

- 候选人登录与角色权限控制
- 招聘题库管理
- 测评模板与招聘试题创建
- 在线答题与提交
- 客观题自动评分
- 主观题人工评估
- 推荐结论与结果报表
- 页面失焦、摄像头抓拍等基础防作弊能力

## 文档

- [架构设计](./docs/architecture.md)
- [产品需求文档](./docs/prd.md)
- [数据库设计](./docs/schema.md)
- [系统使用说明](./docs/user-guide.md)

## 当前目录

- `src/`：Cloudflare Workers 后端
- `migrations/`：D1 初始化 SQL
- `web/`：静态前端页面骨架
- `docs/`：中文文档

## 前端配置

- `web/config.js`：前端运行时配置
- 当前默认通过同源 `/api` 访问后端
- `functions/api/[[path]].js`：Cloudflare Pages 同源 API 代理，会把 `/api/*` 请求转发到正式 Worker
