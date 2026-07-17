import {
  countUserSubmissions,
  aggregateSubmissionScores,
  findAssessmentQuestionSet,
  findCampaignAssignment,
  findCampaignQuestionsForCandidate,
  findOpenCampaignsByUser,
  findQuestions,
  findSubmissionAnswersBySubmissionId,
  findSubmissionById,
  findUserByAccount,
  insertQuestion,
  insertQuestionAnswer,
  insertQuestionOption,
  insertEvaluationRecord,
  insertProctoringEvent,
  insertSnapshotFile,
  insertSubmission,
  insertSubmissionAnswer,
  updateSubmissionAnswerEvaluation,
  updateSubmissionSummary
} from "./lib/db.js";
import { verifyPassword } from "./lib/password.js";
import { signSession, verifySession } from "./lib/session.js";

/**
 * @typedef {import("./types").AppBindings} AppBindings
 * @typedef {import("./types").SessionUser} SessionUser
 */

export default {
  /**
   * @param {Request} request
   * @param {AppBindings} env
   */
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = buildCorsHeaders(request);
    const sessionUser = await getSessionUser(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (request.method === "GET" && url.pathname === "/") {
      return json({
        name: env.APP_NAME,
        status: "ok",
        message: "Java 招聘测评系统后端已启动"
      }, 200, {}, corsHeaders);
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({
        status: "ok",
        now: new Date().toISOString()
      }, 200, {}, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      return handleLogin(request, env, corsHeaders);
    }

    if (request.method === "GET" && url.pathname === "/api/auth/me") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return json({ user: sessionUser }, 200, {}, corsHeaders);
    }

    if (request.method === "GET" && url.pathname === "/api/questions") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      const result = await findQuestions(env);
      return json({ items: result.results ?? [] }, 200, {}, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/api/questions") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleCreateQuestion(request, env, sessionUser, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/api/questions/import-presets") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleImportPresetQuestions(env, sessionUser, corsHeaders);
    }

    if (request.method === "GET" && url.pathname === "/api/campaigns") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      const result = await findOpenCampaignsByUser(env, sessionUser.sub);
      return json({ items: result.results ?? [] }, 200, {}, corsHeaders);
    }

    const campaignQuestionsMatch = url.pathname.match(/^\/api\/campaigns\/([^/]+)\/questions$/);
    if (request.method === "GET" && campaignQuestionsMatch) {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleGetCampaignQuestions(env, sessionUser, campaignQuestionsMatch[1], corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/api/submissions") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleSubmission(request, env, sessionUser, corsHeaders);
    }

    const submissionMatch = url.pathname.match(/^\/api\/submissions\/([^/]+)$/);
    if (request.method === "GET" && submissionMatch) {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleGetSubmission(env, sessionUser, submissionMatch[1], corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/api/evaluations") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleEvaluation(request, env, sessionUser, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/api/proctoring/events") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleProctoringEvent(request, env, sessionUser, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/api/proctoring/snapshots") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleProctoringSnapshot(request, env, sessionUser, corsHeaders);
    }

    return json({ message: "接口不存在" }, 404, {}, corsHeaders);
  }
};

/**
 * @param {Request} request
 * @param {AppBindings} env
 */
async function handleLogin(request, env, corsHeaders) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.account !== "string" || typeof body.password !== "string") {
    return json({ message: "请求参数不合法" }, 400, {}, corsHeaders);
  }

  const user = await findUserByAccount(env, body.account.trim());
  if (!user || typeof user.password_hash !== "string") {
    return json({ message: "账号或密码错误" }, 401, {}, corsHeaders);
  }

  if (user.status !== "active") {
    return json({ message: "账号不可用" }, 403, {}, corsHeaders);
  }

  const valid = await verifyPassword(body.password, user.password_hash);
  if (!valid) {
    return json({ message: "账号或密码错误" }, 401, {}, corsHeaders);
  }

  const roles = typeof user.role_codes === "string" && user.role_codes.length > 0
    ? user.role_codes.split(",")
    : [];

  const payload = {
    sub: user.id,
    account: user.account,
    roles,
    exp: Date.now() + 1000 * 60 * 60 * 8
  };

  const token = await signSession(payload, env.APP_SECRET);

  await env.DB.prepare(
    "update users set last_login_at = ?, updated_at = ? where id = ?"
  ).bind(Date.now(), Date.now(), user.id).run();

  return json(
    {
      message: "登录成功",
      user: {
        id: user.id,
        account: user.account,
        fullName: user.full_name,
        roles
      }
    },
    200,
    {
      "Set-Cookie": serializeCookie("oas_session", token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/",
        maxAge: 60 * 60 * 8
      })
    },
    corsHeaders
  );
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {Record<string, string>} corsHeaders
 */
async function handleCreateQuestion(request, env, sessionUser, corsHeaders) {
  if (!hasRole(sessionUser, ["interviewer", "admin"])) {
    return json({ message: "无权创建题目" }, 403, {}, corsHeaders);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.type !== "string" || typeof body.stem !== "string") {
    return json({ message: "请求参数不合法" }, 400, {}, corsHeaders);
  }

  const type = body.type.trim();
  const stem = body.stem.trim();
  const score = Number(body.score ?? 0);
  const difficulty = Number(body.difficulty ?? 3);
  const status = typeof body.status === "string" ? body.status : "draft";
  const now = Date.now();

  if (!stem) {
    return json({ message: "题干不能为空" }, 400, {}, corsHeaders);
  }

  if (!QUESTION_TYPES.has(type)) {
    return json({ message: "题型不支持" }, 400, {}, corsHeaders);
  }

  if (!Number.isFinite(score) || score < 0) {
    return json({ message: "分值不合法" }, 400, {}, corsHeaders);
  }

  if (!Number.isFinite(difficulty) || difficulty < 1 || difficulty > 5) {
    return json({ message: "难度必须在 1 到 5 之间" }, 400, {}, corsHeaders);
  }

  const createdQuestion = await createQuestionRecord(env, sessionUser.sub, {
    type,
    stem,
    score,
    difficulty,
    status,
    options: body.options,
    answer: body.answer,
    analysis: typeof body.analysis === "string" ? body.analysis : "",
    tags: Array.isArray(body.tags) ? body.tags : [],
    caseSensitive: Boolean(body.caseSensitive)
  });

  return json({
    message: "题目创建成功",
    question: {
      id: createdQuestion.id,
      type: createdQuestion.type,
      stem: createdQuestion.stem,
      score: createdQuestion.score,
      difficulty: createdQuestion.difficulty,
      status: createdQuestion.status
    }
  }, 201, {}, corsHeaders);
}

/**
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {Record<string, string>} corsHeaders
 */
async function handleImportPresetQuestions(env, sessionUser, corsHeaders) {
  if (!hasRole(sessionUser, ["interviewer", "admin"])) {
    return json({ message: "无权导入题目" }, 403, {}, corsHeaders);
  }

  const imported = [];
  for (const preset of JAVA_RECRUITMENT_PRESET_QUESTIONS) {
    const createdQuestion = await createQuestionRecord(env, sessionUser.sub, preset);
    imported.push({
      id: createdQuestion.id,
      type: createdQuestion.type,
      stem: createdQuestion.stem,
      score: createdQuestion.score,
      difficulty: createdQuestion.difficulty,
      status: createdQuestion.status
    });
  }

  return json({
    message: `已导入 ${imported.length} 道 Java 招聘示例题`,
    importedCount: imported.length,
    items: imported
  }, 201, {}, corsHeaders);
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 */
async function handleSubmission(request, env, sessionUser, corsHeaders) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.campaignId !== "string" || !Array.isArray(body.answers)) {
    return json({ message: "请求参数不合法" }, 400, {}, corsHeaders);
  }

  const campaign = await findCampaignAssignment(env, body.campaignId, sessionUser.sub);
  if (!campaign) {
    return json({ message: "未找到可提交的招聘场次" }, 404, {}, corsHeaders);
  }

  if (campaign.status !== "published" && campaign.status !== "in_progress") {
    return json({ message: "当前招聘场次不可提交" }, 400, {}, corsHeaders);
  }

  const now = Date.now();
  if (typeof campaign.start_time === "number" && now < campaign.start_time) {
    return json({ message: "测评尚未开始" }, 400, {}, corsHeaders);
  }
  if (typeof campaign.end_time === "number" && now > campaign.end_time) {
    return json({ message: "测评已结束" }, 400, {}, corsHeaders);
  }

  const submissionCount = await countUserSubmissions(env, body.campaignId, sessionUser.sub);
  const submittedTotal = Number(submissionCount?.total ?? 0);
  const attemptLimit = Number(campaign.attempt_limit ?? 1);
  if (submittedTotal >= attemptLimit) {
    return json({ message: "已超过允许提交次数" }, 400, {}, corsHeaders);
  }

  const questionSet = await findAssessmentQuestionSet(env, campaign.assessment_id);
  const questions = questionSet.results ?? [];
  if (questions.length === 0) {
    return json({ message: "该测评模板没有题目" }, 400, {}, corsHeaders);
  }

  const answerMap = normalizeAnswers(body.answers);
  const submissionId = crypto.randomUUID();
  const submitNo = submittedTotal + 1;
  let objectiveScore = 0;
  let subjectiveScore = 0;
  let pendingManualCount = 0;
  const evaluatedAnswers = [];

  for (const question of questions) {
    const answerContent = answerMap.get(question.question_id) ?? "";
    const evaluated = evaluateAnswer(question, answerContent);

    objectiveScore += evaluated.objectiveScore;
    subjectiveScore += evaluated.subjectiveScore;
    if (evaluated.objectiveResult === "pending") {
      pendingManualCount += 1;
    }
    evaluatedAnswers.push({
      id: crypto.randomUUID(),
      questionId: question.question_id,
      answerContent: typeof answerContent === "string" ? answerContent : JSON.stringify(answerContent),
      objectiveResult: evaluated.objectiveResult,
      objectiveScore: evaluated.objectiveScore,
      subjectiveScore: evaluated.subjectiveScore,
      finalScore: evaluated.objectiveScore + evaluated.subjectiveScore,
      reviewerComment: null,
      comment: evaluated.comment
    });
  }

  const totalScore = objectiveScore + subjectiveScore;
  const status = pendingManualCount > 0 ? "grading" : "graded";

  await insertSubmission(env, {
    id: submissionId,
    campaignId: body.campaignId,
    userId: sessionUser.sub,
    submitNo,
    status,
    startedAt: normalizeTimestamp(body.startedAt, now),
    submittedAt: now,
    objectiveScore,
    subjectiveScore,
    totalScore,
    antiCheatRiskLevel: "low",
    recommendation: null,
    createdAt: now,
    updatedAt: now
  });

  for (const answer of evaluatedAnswers) {
    await insertSubmissionAnswer(env, {
      id: answer.id,
      submissionId,
      questionId: answer.questionId,
      answerContent: answer.answerContent,
      objectiveResult: answer.objectiveResult,
      objectiveScore: answer.objectiveScore,
      subjectiveScore: answer.subjectiveScore,
      finalScore: answer.finalScore,
      reviewerComment: answer.reviewerComment,
      createdAt: now,
      updatedAt: now
    });

    await insertEvaluationRecord(env, {
      id: crypto.randomUUID(),
      submissionId,
      submissionAnswerId: answer.id,
      evaluationType: answer.objectiveResult === "pending" ? "manual" : "auto",
      scoreBefore: null,
      scoreAfter: answer.finalScore,
      comment: answer.comment,
      evaluatedBy: null,
      evaluatedAt: now
    });
  }

  return json({
    message: "提交成功",
    submission: {
      id: submissionId,
      campaignId: body.campaignId,
      submitNo,
      status,
      objectiveScore,
      subjectiveScore,
      totalScore,
      pendingManualCount
    }
  }, 200, {}, corsHeaders);
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 */
async function handleProctoringEvent(request, env, sessionUser, corsHeaders) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.campaignId !== "string" || typeof body.eventType !== "string") {
    return json({ message: "请求参数不合法" }, 400, {}, corsHeaders);
  }

  const campaign = await findCampaignAssignment(env, body.campaignId, sessionUser.sub);
  if (!campaign) {
    return json({ message: "未找到对应招聘场次" }, 404, {}, corsHeaders);
  }

  if (typeof body.submissionId === "string") {
    const submission = await findSubmissionById(env, body.submissionId);
    if (!submission || submission.user_id !== sessionUser.sub || submission.campaign_id !== body.campaignId) {
      return json({ message: "提交记录与当前用户或场次不匹配" }, 400, {}, corsHeaders);
    }
  }

  const riskScore = inferRiskScore(body.eventType);
  const now = Date.now();
  await insertProctoringEvent(env, {
    id: crypto.randomUUID(),
    campaignId: body.campaignId,
    submissionId: typeof body.submissionId === "string" ? body.submissionId : null,
    userId: sessionUser.sub,
    eventType: body.eventType,
    eventValue: body.eventValue ? JSON.stringify(body.eventValue) : null,
    riskScore,
    createdAt: now
  });

  return json({
    message: "监控事件已记录",
    event: {
      campaignId: body.campaignId,
      eventType: body.eventType,
      riskScore,
      createdAt: now
    }
  }, 200, {}, corsHeaders);
}

/**
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {string} submissionId
 */
async function handleGetSubmission(env, sessionUser, submissionId, corsHeaders) {
  const submission = await findSubmissionById(env, submissionId);
  if (!submission) {
    return json({ message: "提交记录不存在" }, 404, {}, corsHeaders);
  }

  const isOwner = submission.user_id === sessionUser.sub;
  const canReview = hasRole(sessionUser, ["interviewer", "recruiter", "admin"]);
  if (!isOwner && !canReview) {
    return json({ message: "无权查看该提交记录" }, 403, {}, corsHeaders);
  }

  const answers = await findSubmissionAnswersBySubmissionId(env, submissionId);
  return json({
    submission,
    answers: answers.results ?? []
  }, 200, {}, corsHeaders);
}

/**
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {string} campaignId
 */
async function handleGetCampaignQuestions(env, sessionUser, campaignId, corsHeaders) {
  const campaign = await findCampaignAssignment(env, campaignId, sessionUser.sub);
  if (!campaign && !hasRole(sessionUser, ["interviewer", "recruiter", "admin"])) {
    return json({ message: "未找到对应招聘场次" }, 404, {}, corsHeaders);
  }

  const result = await findCampaignQuestionsForCandidate(
    env,
    campaignId,
    campaign?.user_id ?? sessionUser.sub
  );
  const items = result.results ?? [];
  if (items.length === 0) {
    return json({ message: "未找到题目列表" }, 404, {}, corsHeaders);
  }

  return json({
    campaign: {
      id: items[0].campaign_id,
      title: items[0].campaign_title,
      durationMinutes: items[0].duration_minutes,
      requireCamera: items[0].require_camera,
      requireFullscreen: items[0].require_fullscreen,
      assessmentId: items[0].assessment_id,
      assessmentTitle: items[0].assessment_title
    },
    questions: items.map((item) => ({
      questionId: item.question_id,
      sectionName: item.section_name,
      sortOrder: item.sort_order,
      score: item.score,
      type: item.type,
      stem: item.stem
    }))
  }, 200, {}, corsHeaders);
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 */
async function handleEvaluation(request, env, sessionUser, corsHeaders) {
  if (!hasRole(sessionUser, ["interviewer", "recruiter", "admin"])) {
    return json({ message: "无权执行人工评估" }, 403, {}, corsHeaders);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.submissionId !== "string" || !Array.isArray(body.answers)) {
    return json({ message: "请求参数不合法" }, 400, {}, corsHeaders);
  }

  const submission = await findSubmissionById(env, body.submissionId);
  if (!submission) {
    return json({ message: "提交记录不存在" }, 404, {}, corsHeaders);
  }

  const answersResult = await findSubmissionAnswersBySubmissionId(env, body.submissionId);
  const answers = answersResult.results ?? [];
  const answerMap = new Map(answers.map((item) => [item.id, item]));

  for (const item of body.answers) {
    if (!item || typeof item !== "object" || typeof item.submissionAnswerId !== "string") {
      return json({ message: "评估项格式不合法" }, 400, {}, corsHeaders);
    }

    const current = answerMap.get(item.submissionAnswerId);
    if (!current) {
      return json({ message: `未找到作答记录: ${item.submissionAnswerId}` }, 404, {}, corsHeaders);
    }

    const subjectiveScore = Number(item.subjectiveScore);
    if (!Number.isFinite(subjectiveScore) || subjectiveScore < 0) {
      return json({ message: "主观题分数不合法" }, 400, {}, corsHeaders);
    }

    await updateSubmissionAnswerEvaluation(env, {
      submissionAnswerId: item.submissionAnswerId,
      subjectiveScore,
      finalScore: Number(current.objective_score ?? 0) + subjectiveScore,
      reviewerComment: typeof item.comment === "string" ? item.comment.trim() : null
    });

    await insertEvaluationRecord(env, {
      id: crypto.randomUUID(),
      submissionId: body.submissionId,
      submissionAnswerId: item.submissionAnswerId,
      evaluationType: "manual",
      scoreBefore: Number(current.subjective_score ?? 0),
      scoreAfter: subjectiveScore,
      comment: typeof item.comment === "string" ? item.comment.trim() : null,
      evaluatedBy: sessionUser.sub,
      evaluatedAt: Date.now()
    });
  }

  const aggregated = await aggregateSubmissionScores(env, body.submissionId);
  const pendingCount = Number(aggregated?.pending_count ?? 0);
  const objectiveScore = Number(aggregated?.objective_score ?? 0);
  const subjectiveScore = Number(aggregated?.subjective_score ?? 0);
  const totalScore = Number(aggregated?.total_score ?? 0);
  const nextStatus = pendingCount > 0 ? "grading" : "graded";
  const recommendation = typeof body.recommendation === "string" ? body.recommendation : submission.recommendation ?? null;

  await updateSubmissionSummary(env, {
    submissionId: body.submissionId,
    status: nextStatus,
    objectiveScore,
    subjectiveScore,
    totalScore,
    recommendation
  });

  return json({
    message: "人工评估已完成",
    submission: {
      id: body.submissionId,
      status: nextStatus,
      objectiveScore,
      subjectiveScore,
      totalScore,
      recommendation
    }
  }, 200, {}, corsHeaders);
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 */
async function handleProctoringSnapshot(request, env, sessionUser, corsHeaders) {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.campaignId !== "string" ||
    typeof body.submissionId !== "string" ||
    typeof body.imageBase64 !== "string"
  ) {
    return json({ message: "请求参数不合法" }, 400, {}, corsHeaders);
  }

  const campaign = await findCampaignAssignment(env, body.campaignId, sessionUser.sub);
  if (!campaign) {
    return json({ message: "未找到对应招聘场次" }, 404, {}, corsHeaders);
  }

  const submission = await findSubmissionById(env, body.submissionId);
  if (!submission || submission.user_id !== sessionUser.sub || submission.campaign_id !== body.campaignId) {
    return json({ message: "提交记录与当前用户或场次不匹配" }, 400, {}, corsHeaders);
  }

  const contentType = typeof body.contentType === "string" ? body.contentType : "image/jpeg";
  const bytes = decodeBase64Payload(body.imageBase64);
  if (!bytes || bytes.byteLength === 0) {
    return json({ message: "抓拍图片内容不合法" }, 400, {}, corsHeaders);
  }

  const snapshotId = crypto.randomUUID();
  const extension = contentTypeToExtension(contentType);
  const capturedAt = normalizeTimestamp(body.capturedAt, Date.now());
  const key = `snapshots/${sessionUser.sub}/${body.submissionId}/${capturedAt}-${snapshotId}.${extension}`;

  if (!env.PROCTORING_BUCKET) {
    return json({ message: "未配置抓拍存储桶" }, 500, {}, corsHeaders);
  }

  await env.PROCTORING_BUCKET.put(key, bytes, {
    httpMetadata: {
      contentType
    }
  });

  await insertSnapshotFile(env, {
    id: snapshotId,
    submissionId: body.submissionId,
    userId: sessionUser.sub,
    r2Key: key,
    contentType,
    fileSize: bytes.byteLength,
    capturedAt,
    createdAt: Date.now()
  });

  await insertProctoringEvent(env, {
    id: crypto.randomUUID(),
    campaignId: body.campaignId,
    submissionId: body.submissionId,
    userId: sessionUser.sub,
    eventType: "snapshot_uploaded",
    eventValue: JSON.stringify({ key, contentType, fileSize: bytes.byteLength }),
    riskScore: 0,
    createdAt: Date.now()
  });

  return json({
    message: "抓拍上传成功",
    snapshot: {
      id: snapshotId,
      key,
      contentType,
      fileSize: bytes.byteLength,
      capturedAt
    }
  }, 200, {}, corsHeaders);
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @returns {Promise<SessionUser | null>}
 */
async function getSessionUser(request, env) {
  const cookieHeader = request.headers.get("Cookie");
  const token = getCookieValue(cookieHeader, "oas_session");
  if (!token || !env.APP_SECRET) {
    return null;
  }

  const payload = await verifySession(token, env.APP_SECRET);
  if (!payload || typeof payload.sub !== "string" || !Array.isArray(payload.roles)) {
    return null;
  }

  return /** @type {SessionUser} */ (payload);
}

/**
 * @param {unknown} data
 * @param {number} [status]
 * @param {Record<string, string>} [extraHeaders]
 */
function json(data, status = 200, extraHeaders = {}, corsHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
      ...extraHeaders
    }
  });
}

/**
 * @param {string | null} cookieHeader
 * @param {string} name
 */
function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) {
    return null;
  }

  const pairs = cookieHeader.split(";").map((item) => item.trim());
  for (const pair of pairs) {
    if (pair.startsWith(`${name}=`)) {
      return decodeURIComponent(pair.slice(name.length + 1));
    }
  }

  return null;
}

/**
 * @param {string} name
 * @param {string} value
 * @param {{
 *   httpOnly?: boolean;
 *   secure?: boolean;
 *   sameSite?: "Strict" | "Lax" | "None";
 *   path?: string;
 *   maxAge?: number;
 * }} options
 */
function serializeCookie(name, value, options) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  if (options.path) {
    parts.push(`Path=${options.path}`);
  }
  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }
  if (options.httpOnly) {
    parts.push("HttpOnly");
  }
  if (options.secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

/**
 * @param {unknown[]} answers
 */
function normalizeAnswers(answers) {
  const answerMap = new Map();
  for (const item of answers) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const questionId = typeof item.questionId === "string" ? item.questionId : null;
    if (!questionId) {
      continue;
    }

    if (typeof item.answer === "string") {
      answerMap.set(questionId, item.answer.trim());
      continue;
    }

    if (Array.isArray(item.answer)) {
      answerMap.set(questionId, JSON.stringify(item.answer));
      continue;
    }

    if (item.answer != null) {
      answerMap.set(questionId, JSON.stringify(item.answer));
    }
  }
  return answerMap;
}

/**
 * @param {{
 *   question_id: string;
 *   type: string;
 *   configured_score: number;
 *   answer_type?: string | null;
 *   answer_content?: string | null;
 *   case_sensitive?: number | null;
 * }} question
 * @param {string} answerContent
 */
function evaluateAnswer(question, answerContent) {
  const fullScore = Number(question.configured_score ?? 0);
  const normalizedAnswer = answerContent.trim();
  const answerType = question.answer_type ?? "manual";

  if (answerType === "manual" || question.type === "short_answer" || question.type === "scenario_answer") {
    return {
      objectiveResult: "pending",
      objectiveScore: 0,
      subjectiveScore: 0,
      comment: "主观题待人工评估"
    };
  }

  if (answerType === "exact") {
    const expected = (question.answer_content ?? "").trim();
    const matched = question.case_sensitive
      ? normalizedAnswer === expected
      : normalizedAnswer.toLowerCase() === expected.toLowerCase();

    return {
      objectiveResult: matched ? "correct" : "wrong",
      objectiveScore: matched ? fullScore : 0,
      subjectiveScore: 0,
      comment: matched ? "自动判题正确" : "自动判题错误"
    };
  }

  if (answerType === "set_match") {
    const expectedSet = parseArrayValue(question.answer_content);
    const actualSet = parseArrayValue(answerContent);
    const matched = expectedSet.length > 0
      && expectedSet.length === actualSet.length
      && expectedSet.every((item, index) => item === actualSet[index]);

    return {
      objectiveResult: matched ? "correct" : "wrong",
      objectiveScore: matched ? fullScore : 0,
      subjectiveScore: 0,
      comment: matched ? "自动集合匹配正确" : "自动集合匹配错误"
    };
  }

  if (answerType === "keyword") {
    const expectedKeywords = parseArrayValue(question.answer_content);
    const lowered = normalizedAnswer.toLowerCase();
    const matchedCount = expectedKeywords.filter((keyword) => lowered.includes(keyword.toLowerCase())).length;
    const score = expectedKeywords.length === 0
      ? 0
      : Math.round((matchedCount / expectedKeywords.length) * fullScore);

    return {
      objectiveResult: matchedCount === expectedKeywords.length ? "correct" : matchedCount > 0 ? "partial" : "wrong",
      objectiveScore: score,
      subjectiveScore: 0,
      comment: "按关键词规则自动评分"
    };
  }

  return {
    objectiveResult: "pending",
    objectiveScore: 0,
    subjectiveScore: 0,
    comment: "题型未配置自动评分规则"
  };
}

/**
 * @param {string | null | undefined} value
 */
function parseArrayValue(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).sort();
    }
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean).sort();
  }

  return [String(value).trim()];
}

/**
 * @param {unknown} value
 * @param {number} fallback
 */
function normalizeTimestamp(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
}

/**
 * @param {string} eventType
 */
function inferRiskScore(eventType) {
  switch (eventType) {
    case "camera_denied":
      return 40;
    case "fullscreen_exit":
      return 20;
    case "page_blur":
      return 15;
    case "network_offline":
      return 10;
    case "snapshot_uploaded":
      return 0;
    default:
      return 5;
  }
}

const QUESTION_TYPES = new Set([
  "single_choice",
  "multiple_choice",
  "true_false",
  "fill_blank",
  "short_answer",
  "scenario_answer"
]);

const JAVA_RECRUITMENT_PRESET_QUESTIONS = [
  {
    type: "single_choice",
    stem: "在 Java 中，负责加载并执行字节码的核心运行时组件是什么？",
    score: 10,
    difficulty: 1,
    status: "published",
    options: [
      { optionKey: "A", optionText: "JVM" },
      { optionKey: "B", optionText: "JDBC" },
      { optionKey: "C", optionText: "JRE 插件管理器" },
      { optionKey: "D", optionText: "Java Compiler API" }
    ],
    answer: "A",
    analysis: "考察候选人是否区分 JVM、JRE、JDK 等基础概念。",
    tags: ["Java基础", "JVM", "来源:Oracle Java 文档"],
    caseSensitive: false
  },
  {
    type: "single_choice",
    stem: "关于 HashMap，下列哪项说法是正确的？",
    score: 12,
    difficulty: 2,
    status: "published",
    options: [
      { optionKey: "A", optionText: "不允许 null key，也不允许 null value" },
      { optionKey: "B", optionText: "允许一个 null key，并允许 null value" },
      { optionKey: "C", optionText: "允许多个 null key，但不允许 null value" },
      { optionKey: "D", optionText: "线程安全，可直接用于高并发写入" }
    ],
    answer: "B",
    analysis: "HashMap 允许 null key 和 null value，但不保证线程安全。",
    tags: ["集合", "HashMap", "来源:Oracle Java API"],
    caseSensitive: false
  },
  {
    type: "multiple_choice",
    stem: "关于 ArrayList 的并发与性能特征，下列哪些说法正确？",
    score: 15,
    difficulty: 3,
    status: "published",
    options: [
      { optionKey: "A", optionText: "ArrayList 默认是线程安全的" },
      { optionKey: "B", optionText: "ArrayList 的 add 操作通常是摊还常数时间" },
      { optionKey: "C", optionText: "多个线程并发修改时需要额外同步" },
      { optionKey: "D", optionText: "迭代期间发生结构性修改时可能抛出 ConcurrentModificationException" }
    ],
    answer: ["B", "C", "D"],
    analysis: "这道题覆盖 ArrayList 的基本性能特征和线程安全边界。",
    tags: ["集合", "并发", "ArrayList", "来源:Oracle Java API"],
    caseSensitive: false
  },
  {
    type: "single_choice",
    stem: "ConcurrentHashMap 最准确的定位是什么？",
    score: 12,
    difficulty: 3,
    status: "published",
    options: [
      { optionKey: "A", optionText: "只适合单线程读取的 Map" },
      { optionKey: "B", optionText: "支持线程安全访问，并针对并发检索和更新进行了优化" },
      { optionKey: "C", optionText: "用于替代所有数据库缓存方案" },
      { optionKey: "D", optionText: "必须配合 synchronized 才能读取" }
    ],
    answer: "B",
    analysis: "考察候选人是否知道 ConcurrentHashMap 的适用边界。",
    tags: ["并发", "集合", "ConcurrentHashMap", "来源:Oracle Java API"],
    caseSensitive: false
  },
  {
    type: "true_false",
    stem: "在 Java 中，CompletableFuture 同时实现了 Future 和 CompletionStage 接口。",
    score: 10,
    difficulty: 2,
    status: "published",
    options: [
      { optionKey: "T", optionText: "正确" },
      { optionKey: "F", optionText: "错误" }
    ],
    answer: "T",
    analysis: "CompletableFuture 既可表示 Future，也可编排依赖阶段。",
    tags: ["并发", "异步", "CompletableFuture", "来源:Oracle Java API"],
    caseSensitive: false
  },
  {
    type: "fill_blank",
    stem: "在线程池 ThreadPoolExecutor 中，_______ 表示即使线程空闲也要保留的核心线程数量。",
    score: 10,
    difficulty: 2,
    status: "published",
    answer: "corePoolSize",
    analysis: "用于区分核心线程数与最大线程数的职责。",
    tags: ["并发", "线程池", "来源:Oracle Java API"],
    caseSensitive: true
  },
  {
    type: "single_choice",
    stem: "当你重写一个 Java 对象的 equals 方法时，按照 Object 的通用约定，通常还应该同时重写哪个方法？",
    score: 10,
    difficulty: 2,
    status: "published",
    options: [
      { optionKey: "A", optionText: "finalize" },
      { optionKey: "B", optionText: "notifyAll" },
      { optionKey: "C", optionText: "hashCode" },
      { optionKey: "D", optionText: "clone" }
    ],
    answer: "C",
    analysis: "如果 equals 相等而 hashCode 不一致，会破坏散列表行为。",
    tags: ["Java基础", "对象模型", "来源:Oracle Java API"],
    caseSensitive: false
  },
  {
    type: "true_false",
    stem: "Spring 声明式事务的默认回滚行为通常只会对未检查异常自动回滚。",
    score: 12,
    difficulty: 3,
    status: "published",
    options: [
      { optionKey: "T", optionText: "正确" },
      { optionKey: "F", optionText: "错误" }
    ],
    answer: "T",
    analysis: "默认行为遵循对 unchecked exception 自动回滚的约定。",
    tags: ["Spring", "事务", "来源:Spring Framework 官方文档"],
    caseSensitive: false
  },
  {
    type: "short_answer",
    stem: "请说明在 Java 后端系统中，什么时候更适合使用 ConcurrentHashMap，而不是普通 HashMap 加手工同步？",
    score: 20,
    difficulty: 4,
    status: "published",
    analysis: "重点考察并发容器选型、读写比例、锁粒度与吞吐量理解。",
    tags: ["并发", "系统设计", "ConcurrentHashMap"],
    caseSensitive: false
  },
  {
    type: "scenario_answer",
    stem: "你在一个 Spring Boot Java 招聘系统中负责提交答卷接口。当前接口在保存提交记录、逐题答案、评估记录时没有事务保护。请分析可能出现的数据一致性问题，并给出你会采用的事务与幂等设计方案。",
    score: 25,
    difficulty: 5,
    status: "published",
    analysis: "重点考察事务边界、幂等键、重试、副作用隔离、提交态机设计。",
    tags: ["Spring", "事务", "系统设计", "后端架构"],
    caseSensitive: false
  }
];

/**
 * @param {string} type
 */
function requiresOptions(type) {
  return type === "single_choice" || type === "multiple_choice" || type === "true_false";
}

/**
 * @param {AppBindings} env
 * @param {string} createdBy
 * @param {{
 *   type: string;
 *   stem: string;
 *   score: number;
 *   difficulty: number;
 *   status: string;
 *   options?: unknown;
 *   answer?: unknown;
 *   analysis?: string;
 *   tags?: unknown[];
 *   caseSensitive?: boolean;
 * }} payload
 */
async function createQuestionRecord(env, createdBy, payload) {
  const type = payload.type.trim();
  const stem = payload.stem.trim();
  const score = Number(payload.score ?? 0);
  const difficulty = Number(payload.difficulty ?? 3);
  const status = typeof payload.status === "string" ? payload.status : "draft";
  const now = Date.now();

  const questionId = crypto.randomUUID();
  const normalizedOptions = normalizeQuestionOptions(payload.options);
  const normalizedAnswer = normalizeQuestionAnswer(type, payload.answer);
  const answerType = inferAnswerType(type);

  if (requiresOptions(type) && normalizedOptions.length === 0) {
    throw new Error("当前题型至少需要一个选项");
  }

  if (answerType !== "manual" && !normalizedAnswer) {
    throw new Error("当前题型必须提供标准答案");
  }

  await insertQuestion(env, {
    id: questionId,
    type,
    stem,
    analysis: typeof payload.analysis === "string" && payload.analysis.trim() ? payload.analysis.trim() : null,
    difficulty,
    score,
    tags: Array.isArray(payload.tags) ? JSON.stringify(payload.tags.map((item) => String(item).trim()).filter(Boolean)) : null,
    status,
    createdBy,
    createdAt: now,
    updatedAt: now
  });

  for (const [index, option] of normalizedOptions.entries()) {
    await insertQuestionOption(env, {
      id: crypto.randomUUID(),
      questionId,
      optionKey: option.optionKey,
      optionText: option.optionText,
      sortOrder: index + 1
    });
  }

  await insertQuestionAnswer(env, {
    id: crypto.randomUUID(),
    questionId,
    answerType,
    answerContent: normalizedAnswer,
    caseSensitive: payload.caseSensitive ? 1 : 0,
    createdAt: now
  });

  return {
    id: questionId,
    type,
    stem,
    score,
    difficulty,
    status
  };
}

/**
 * @param {string} type
 */
function inferAnswerType(type) {
  if (type === "multiple_choice") {
    return "set_match";
  }
  if (type === "short_answer" || type === "scenario_answer") {
    return "manual";
  }
  return "exact";
}

/**
 * @param {unknown} options
 */
function normalizeQuestionOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((item) => ({
      optionKey: typeof item?.optionKey === "string" ? item.optionKey.trim() : "",
      optionText: typeof item?.optionText === "string" ? item.optionText.trim() : ""
    }))
    .filter((item) => item.optionKey && item.optionText);
}

/**
 * @param {string} type
 * @param {unknown} answer
 */
function normalizeQuestionAnswer(type, answer) {
  if (type === "multiple_choice") {
    if (Array.isArray(answer)) {
      return JSON.stringify(answer.map((item) => String(item).trim()).filter(Boolean));
    }
    if (typeof answer === "string") {
      return JSON.stringify(
        answer.split(",").map((item) => item.trim()).filter(Boolean)
      );
    }
    return "";
  }

  if (type === "short_answer" || type === "scenario_answer") {
    return "";
  }

  if (typeof answer === "string") {
    return answer.trim();
  }

  return "";
}

/**
 * @param {SessionUser} sessionUser
 * @param {string[]} expectedRoles
 */
function hasRole(sessionUser, expectedRoles) {
  return expectedRoles.some((role) => sessionUser.roles.includes(role));
}

/**
 * @param {string} contentType
 */
function contentTypeToExtension(contentType) {
  switch (contentType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

/**
 * @param {string} value
 */
function decodeBase64Payload(value) {
  const normalized = value.includes(",") ? value.split(",").pop() ?? "" : value;
  try {
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

/**
 * @param {Request} request
 */
function buildCorsHeaders(request) {
  const origin = request.headers.get("Origin");
  const requestHeaders = request.headers.get("Access-Control-Request-Headers");

  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": requestHeaders ?? "Content-Type",
    "Vary": "Origin"
  };
}
