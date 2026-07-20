# 接口设计

## 目标

定义当前后端骨架已提供的基础接口，以及后续扩展方向。

## 通用约定

- 所有接口返回 `application/json`
- 登录态通过 `HttpOnly Cookie` 保存
- 时间字段统一使用毫秒时间戳
- 跨域预检已放行 `GET`、`POST`、`PUT`、`DELETE`、`OPTIONS`，前端可直接调用增删改查接口

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

### `POST /api/auth/logout`

用途：

- 清除当前登录会话 Cookie
- 让前端回到未登录状态

成功响应示例：

```json
{
  "message": "已退出登录"
}
```

### `GET /api/admin/users`

用途：

- 管理员查看当前系统中的账号列表
- 返回账号基础信息和角色
- 支持按 `q`、`role`、`status` 查询过滤
- 支持按 `page`、`pageSize` 分页查询

### `POST /api/admin/users`

用途：

- 管理员创建求职者、面试官、招聘专员、管理员账号
- 同时写入用户表和角色表

请求体示例：

```json
{
  "account": "candidate_zhangsan",
  "password": "Candidate123!",
  "fullName": "张三",
  "role": "candidate",
  "email": "zhangsan@example.com",
  "mobile": "13800000000"
}
```

### `POST /api/admin/users/batch-create`

用途：

- 管理员按文本批量导入账号
- 适合一次性导入候选人、面试官、招聘专员

请求体示例：

```json
{
  "items": [
    {
      "account": "candidate_lihua",
      "fullName": "李华",
      "password": "Candidate123!",
      "role": "candidate",
      "email": "lihua@example.com",
      "mobile": "13800000001"
    }
  ]
}
```

### `PUT /api/admin/users/:id`

用途：

- 管理员修改用户姓名、角色、邮箱、手机号、状态
- 这里的 `status` 仅表示账号登录权限状态，可用于 `正常`、`锁定`、`禁用`
- 候选流程状态建议单独建模，不应混用在账号状态字段中

### `DELETE /api/admin/users/:id`

用途：

- 管理员删除未被试题分配、且没有提交记录的账号
- 如果账号已有笔试分配或提交记录，会返回 `409`
- 返回体会包含 `recommendedAction=disable`，用于提示前端改走禁用流程
- 当前版本推荐后续调用 `PUT /api/admin/users/:id`，把 `status` 更新为 `disabled`，以保留历史数据和审计链路
- 从长期产品设计上，更推荐把“流程结束 / 已归档”定义为候选流程状态，而不是直接修改账号登录状态

### `POST /api/admin/users/:id/reset-password`

用途：

- 管理员重置任意账号密码
- 新密码长度至少 8 位

### `GET /api/admin/campaigns`

用途：

- 管理员或招聘专员查看笔试任务列表
- 给候选人分配笔试任务时作为下拉数据源
- 支持按 `q`、`status` 检索
- 支持按 `page`、`pageSize` 分页查询

### `GET /api/admin/assessments`

用途：

- 管理员、招聘专员、面试官查看试卷模板列表
- 给新增或修改笔试任务时作为模板下拉数据源
- 支持按 `q`、`status` 检索
- 支持按 `page`、`pageSize` 分页查询

### `GET /api/admin/assessments/:id`

用途：

- 查看单个试卷模板详情
- 返回模板基本信息和模板内题目列表

### `POST /api/admin/assessments`

用途：

- 管理员或面试官创建试卷模板
- 从已发布题目中选择题目组成模板
- 支持为每题配置分组、顺序和模板内分值

### `PUT /api/admin/assessments/:id`

用途：

- 管理员或面试官修改已有试卷模板
- 支持整体替换模板题目结构

### `POST /api/admin/campaigns`

用途：

- 管理员或招聘专员创建笔试任务
- 配置时间窗口、时长、状态、摄像头和全屏要求

### `PUT /api/admin/campaigns/:id`

用途：

- 管理员或招聘专员修改已有笔试任务
- 可调整试卷模板、时间、状态和监控要求

### `POST /api/admin/campaign-assignments`

用途：

- 管理员或招聘专员把候选人账号分配到某个笔试任务

请求体示例：

```json
{
  "account": "candidate_zhangsan",
  "campaignId": "campaign_java_backend_20260717",
  "attemptLimit": 1,
  "invitationStatus": "invited"
}
```

### `POST /api/admin/campaign-assignments/batch`

用途：

- 管理员或招聘专员批量把多个候选人账号分配到同一试题
- 适合批量邀请同一批候选人参加同一套线上笔试

### `GET /api/questions`

用途：

- 获取题库列表
- 支持按 `q`、`type`、`status` 查询过滤
- 支持按 `page`、`pageSize` 分页查询
- 返回当前页题目，并包含选项、答案等编辑所需字段

### `GET /api/submissions`

用途：

- 获取提交记录列表
- 求职者只能看到自己的提交记录
- 面试官、招聘专员、管理员可按 `q`、`status`、`reviewStatus`、`campaignId` 检索
- 支持按 `page`、`pageSize` 分页查询
- 默认按提交时间倒序返回，未提交记录排在已提交记录后面

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

### `PUT /api/questions/:id`

用途：

- 面试官或管理员修改题目内容
- 如果题目已有提交记录，会拒绝修改，避免污染历史评测数据

### `DELETE /api/questions/:id`

用途：

- 面试官或管理员删除题目
- 如果题目已被试卷模板或提交记录引用，会返回 `409`

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

- 获取当前用户可见的笔试任务列表
- 当前版本主要针对候选人已分配试题查询

### `GET /api/campaigns/:id/questions`

用途：

- 获取某个笔试任务对应的题目列表
- 给候选人答题页提供数据

成功响应结构：

- `campaign`：试题基础信息
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
- 超过试题允许次数后不允许继续提交

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

- `camera_denied`：80，直接判定为高风险，并记录“候选人拒绝开启摄像头”
- `fullscreen_exit`：80，直接判定为高风险，并记录“候选人退出全屏作答”
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
- `answers`：逐题作答、客观题结果、主观题分数、题目满分、评语

### `POST /api/evaluations/ai-suggestions`

用途：

- 面试官、招聘专员、管理员调用 AI 生成主观题建议分数和评语
- 当前按 OpenAI 兼容接口调用，可配置为 DeepSeek
- 返回结果只作为建议，不直接写入最终成绩
- 前端应先展示 AI 建议，再由人工决定是否采纳到最终评分表单

请求体示例：

```json
{
  "submissionId": "submission-id"
}
```

成功响应示例：

```json
{
  "message": "AI 判分建议已生成",
  "provider": "openai-compatible",
  "model": "deepseek-chat",
  "suggestion": {
    "summary": "整体回答基础尚可，但工程细节不够扎实。",
    "recommendation": "hold",
    "answers": [
      {
        "submissionAnswerId": "answer-id-1",
        "suggestedScore": 12,
        "comment": "主线正确，但缺少缓存一致性与降级策略。",
        "strengths": ["能说明排查顺序"],
        "risks": ["缺少容量与一致性方案"]
      }
    ]
  }
}
```

失败说明：

- 若未配置 `AI_REVIEW_ENABLED=true`、`AI_REVIEW_API_KEY` 等参数，会返回 `503`
- 若上游 AI 服务异常，会返回 `502`

### `POST /api/evaluations`

用途：

- 面试官、招聘专员或管理员对主观题进行人工评估
- 自动回写提交总分与状态
- 可以先调用 AI 建议接口，再人工审核、修订后提交最终结果

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

- `GET /api/proctoring/events`
- `GET /api/snapshots/:id`

## 初始账号

初始化 SQL 已内置以下演示账号：

- `admin / Admin123456!`
- `candidate_demo / Candidate123!`
- `interviewer_demo / Interviewer123!`
- `recruiter_demo / Recruiter123!`

首次部署后建议立即修改。

## 当前限制

- 暂未实现细粒度角色权限拦截
- 暂未实现提交事务回滚保护
- 暂未实现抓拍文件访问签名 URL
- 暂未实现题目编辑与删除接口
- 当前暂未实现试卷模板删除接口

## 文档维护规则

只要接口入参、出参、认证方式或 URL 发生相关变更，就必须同步更新本文件。
