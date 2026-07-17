# 接口设计

## 目标

定义当前后端骨架已提供的基础接口，以及后续扩展方向。

## 已实现接口

### `GET /`

用途：

- 服务启动探活
- 返回系统名称和基础状态

### `GET /health`

用途：

- 健康检查
- 返回当前服务时间

### `POST /api/auth/login`

用途：

- 账号密码登录
- 登录成功后写入 `oas_session` Cookie

请求体：

```json
{
  "account": "admin",
  "password": "Admin123456!"
}
```

成功响应示例：

```json
{
  "message": "登录成功",
  "user": {
    "id": "user_admin",
    "account": "admin",
    "fullName": "系统管理员",
    "roles": ["admin"]
  }
}
```

### `GET /api/auth/me`

用途：

- 获取当前登录用户信息

### `GET /api/questions`

用途：

- 获取题库列表
- 当前返回最近 50 条题目

### `POST /api/questions`

用途：

- 面试官或管理员创建题目
- 同时写入题目定义、选项和标准答案

请求体示例：

```json
{
  "type": "single_choice",
  "stem": "Java 中负责跨平台执行字节码的核心组件是什么？",
  "score": 10,
  "difficulty": 2,
  "status": "published",
  "options": [
    { "optionKey": "A", "optionText": "JVM" },
    { "optionKey": "B", "optionText": "JDBC" }
  ],
  "answer": "A",
  "analysis": "考察候选人对 Java 运行时概念的掌握。"
}
```

### `POST /api/questions/import-presets`

用途：

- 面试官或管理员一键导入内置的 Java 招聘示例题库
- 当前会导入一组可直接用于系统演示和初始测评配置的题目

说明：

- 当前预置题覆盖 Java 基础、集合、并发、线程池、Spring 事务、系统设计
- 题目内容依据官方资料整理，不是随意生成的占位文案
- 每次调用都会新增一批题目，当前版本不做去重

成功响应示例：

```json
{
  "message": "已导入 10 道 Java 招聘示例题",
  "importedCount": 10,
  "items": [
    {
      "id": "question-id-1",
      "type": "single_choice",
      "stem": "在 Java 中，负责加载并执行字节码的核心运行时组件是什么？",
      "score": 10,
      "difficulty": 1,
      "status": "published"
    }
  ]
}
```

成功响应示例：

```json
{
  "message": "题目创建成功",
  "question": {
    "id": "question-id",
    "type": "single_choice",
    "stem": "Java 中负责跨平台执行字节码的核心组件是什么？",
    "score": 10,
    "difficulty": 2,
    "status": "published"
  }
}
```

### `GET /api/campaigns`

用途：

- 获取当前用户可见的招聘场次列表
- 当前版本主要针对候选人已分配场次查询

### `GET /api/campaigns/:id/questions`

用途：

- 获取某个招聘场次对应的题目列表
- 给候选人答题页提供数据

成功响应结构：

- `campaign`：场次基础信息
- `questions`：题目列表

### `POST /api/submissions`

用途：

- 候选人提交整份测评答案
- 系统自动完成客观题评分
- 主观题自动进入待人工评估状态

请求体示例：

```json
{
  "campaignId": "campaign_java_backend_20260717",
  "startedAt": 1784293200000,
  "answers": [
    {
      "questionId": "question_java_jvm",
      "answer": "B"
    },
    {
      "questionId": "question_scenario_cache",
      "answer": "我会先定位慢查询、热点接口和缓存命中率，再设计多级缓存。"
    }
  ]
}
```

成功响应示例：

```json
{
  "message": "提交成功",
  "submission": {
    "id": "submission-id",
    "campaignId": "campaign_java_backend_20260717",
    "submitNo": 1,
    "status": "grading",
    "objectiveScore": 10,
    "subjectiveScore": 0,
    "totalScore": 10,
    "pendingManualCount": 1
  }
}
```

说明：

- 客观题按标准答案即时评分
- 简答题、场景分析题默认进入人工评估
- 超过场次允许次数后不允许继续提交

### `POST /api/proctoring/events`

用途：

- 上报基础监控事件
- 为后续风险等级判断保留事件数据

请求体示例：

```json
{
  "campaignId": "campaign_java_backend_20260717",
  "submissionId": "submission-id",
  "eventType": "page_blur",
  "eventValue": {
    "reason": "window_hidden"
  }
}
```

成功响应示例：

```json
{
  "message": "监控事件已记录",
  "event": {
    "campaignId": "campaign_java_backend_20260717",
    "eventType": "page_blur",
    "riskScore": 15,
    "createdAt": 1784296800000
  }
}
```

当前内置风险分规则：

- `camera_denied`：40
- `fullscreen_exit`：20
- `page_blur`：15
- `network_offline`：10
- `snapshot_uploaded`：0
- 其他事件：5

### `GET /api/submissions/:id`

用途：

- 获取某次提交的详情
- 返回提交主记录与逐题作答明细

访问规则：

- 候选人只能查看自己的提交
- 面试官、招聘专员、管理员可以查看任意提交

成功响应结构：

- `submission`：提交主记录
- `answers`：逐题作答、客观题结果、主观题分数、评语

### `POST /api/evaluations`

用途：

- 面试官、招聘专员或管理员对主观题进行人工评估
- 自动回写提交总分与状态

请求体示例：

```json
{
  "submissionId": "submission-id",
  "recommendation": "hold",
  "answers": [
    {
      "submissionAnswerId": "answer-id-1",
      "subjectiveScore": 16,
      "comment": "思路完整，但缺少缓存一致性方案。"
    }
  ]
}
```

成功响应示例：

```json
{
  "message": "人工评估已完成",
  "submission": {
    "id": "submission-id",
    "status": "graded",
    "objectiveScore": 10,
    "subjectiveScore": 16,
    "totalScore": 26,
    "recommendation": "hold"
  }
}
```

### `POST /api/proctoring/snapshots`

用途：

- 上传候选人抓拍图片
- 图片写入 `R2`
- 元数据写入 `snapshot_files`
- 同时补一条 `snapshot_uploaded` 监控事件

请求体示例：

```json
{
  "campaignId": "campaign_java_backend_20260717",
  "submissionId": "submission-id",
  "contentType": "image/jpeg",
  "capturedAt": 1784296800000,
  "imageBase64": "/9j/4AAQSkZJRgABAQAAAQ..."
}
```

成功响应示例：

```json
{
  "message": "抓拍上传成功",
  "snapshot": {
    "id": "snapshot-id",
    "key": "snapshots/user_admin/submission-id/1784296800000-snapshot-id.jpg",
    "contentType": "image/jpeg",
    "fileSize": 20480,
    "capturedAt": 1784296800000
  }
}
```

## 待扩展接口

- `POST /api/questions`
- `PUT /api/questions/:id`
- `POST /api/assessments`
- `POST /api/campaigns`
- `GET /api/campaigns/:id/questions`
- `GET /api/proctoring/events`
- `GET /api/snapshots/:id`

## 初始账号

初始化 SQL 已内置一个管理员账号：

- 账号：`admin`
- 密码：`Admin123456!`

首次部署后建议立即修改。

## 当前限制

- 暂未实现细粒度角色权限拦截
- 暂未实现提交事务回滚保护
- 暂未实现基于累计事件的最终风险等级回写
- 暂未实现抓拍文件访问签名 URL
- 暂未实现题目编辑与删除接口
- 预置题库导入当前不做幂等去重控制

## 文档维护规则

只要接口入参、出参、认证方式或 URL 发生相关变更，就必须同步更新本文件。
