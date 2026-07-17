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
    const sessionUser = await getSessionUser(request, env);

    if (request.method === "GET" && url.pathname === "/") {
      return json({
        name: env.APP_NAME,
        status: "ok",
        message: "Java 招聘测评系统后端已启动"
      });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({
        status: "ok",
        now: new Date().toISOString()
      });
    }

    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      return handleLogin(request, env);
    }

    if (request.method === "GET" && url.pathname === "/api/auth/me") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401);
      }
      return json({ user: sessionUser });
    }

    if (request.method === "GET" && url.pathname === "/api/questions") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401);
      }
      const result = await findQuestions(env);
      return json({ items: result.results ?? [] });
    }

    if (request.method === "GET" && url.pathname === "/api/campaigns") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401);
      }
      const result = await findOpenCampaignsByUser(env, sessionUser.sub);
      return json({ items: result.results ?? [] });
    }

    const campaignQuestionsMatch = url.pathname.match(/^\/api\/campaigns\/([^/]+)\/questions$/);
    if (request.method === "GET" && campaignQuestionsMatch) {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401);
      }
      return handleGetCampaignQuestions(env, sessionUser, campaignQuestionsMatch[1]);
    }

    if (request.method === "POST" && url.pathname === "/api/submissions") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401);
      }
      return handleSubmission(request, env, sessionUser);
    }

    const submissionMatch = url.pathname.match(/^\/api\/submissions\/([^/]+)$/);
    if (request.method === "GET" && submissionMatch) {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401);
      }
      return handleGetSubmission(env, sessionUser, submissionMatch[1]);
    }

    if (request.method === "POST" && url.pathname === "/api/evaluations") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401);
      }
      return handleEvaluation(request, env, sessionUser);
    }

    if (request.method === "POST" && url.pathname === "/api/proctoring/events") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401);
      }
      return handleProctoringEvent(request, env, sessionUser);
    }

    if (request.method === "POST" && url.pathname === "/api/proctoring/snapshots") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401);
      }
      return handleProctoringSnapshot(request, env, sessionUser);
    }

    return json({ message: "接口不存在" }, 404);
  }
};

/**
 * @param {Request} request
 * @param {AppBindings} env
 */
async function handleLogin(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.account !== "string" || typeof body.password !== "string") {
    return json({ message: "请求参数不合法" }, 400);
  }

  const user = await findUserByAccount(env, body.account.trim());
  if (!user || typeof user.password_hash !== "string") {
    return json({ message: "账号或密码错误" }, 401);
  }

  if (user.status !== "active") {
    return json({ message: "账号不可用" }, 403);
  }

  const valid = await verifyPassword(body.password, user.password_hash);
  if (!valid) {
    return json({ message: "账号或密码错误" }, 401);
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
        sameSite: "Lax",
        path: "/",
        maxAge: 60 * 60 * 8
      })
    }
  );
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 */
async function handleSubmission(request, env, sessionUser) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.campaignId !== "string" || !Array.isArray(body.answers)) {
    return json({ message: "请求参数不合法" }, 400);
  }

  const campaign = await findCampaignAssignment(env, body.campaignId, sessionUser.sub);
  if (!campaign) {
    return json({ message: "未找到可提交的招聘场次" }, 404);
  }

  if (campaign.status !== "published" && campaign.status !== "in_progress") {
    return json({ message: "当前招聘场次不可提交" }, 400);
  }

  const now = Date.now();
  if (typeof campaign.start_time === "number" && now < campaign.start_time) {
    return json({ message: "测评尚未开始" }, 400);
  }
  if (typeof campaign.end_time === "number" && now > campaign.end_time) {
    return json({ message: "测评已结束" }, 400);
  }

  const submissionCount = await countUserSubmissions(env, body.campaignId, sessionUser.sub);
  const submittedTotal = Number(submissionCount?.total ?? 0);
  const attemptLimit = Number(campaign.attempt_limit ?? 1);
  if (submittedTotal >= attemptLimit) {
    return json({ message: "已超过允许提交次数" }, 400);
  }

  const questionSet = await findAssessmentQuestionSet(env, campaign.assessment_id);
  const questions = questionSet.results ?? [];
  if (questions.length === 0) {
    return json({ message: "该测评模板没有题目" }, 400);
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
  });
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 */
async function handleProctoringEvent(request, env, sessionUser) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.campaignId !== "string" || typeof body.eventType !== "string") {
    return json({ message: "请求参数不合法" }, 400);
  }

  const campaign = await findCampaignAssignment(env, body.campaignId, sessionUser.sub);
  if (!campaign) {
    return json({ message: "未找到对应招聘场次" }, 404);
  }

  if (typeof body.submissionId === "string") {
    const submission = await findSubmissionById(env, body.submissionId);
    if (!submission || submission.user_id !== sessionUser.sub || submission.campaign_id !== body.campaignId) {
      return json({ message: "提交记录与当前用户或场次不匹配" }, 400);
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
  });
}

/**
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {string} submissionId
 */
async function handleGetSubmission(env, sessionUser, submissionId) {
  const submission = await findSubmissionById(env, submissionId);
  if (!submission) {
    return json({ message: "提交记录不存在" }, 404);
  }

  const isOwner = submission.user_id === sessionUser.sub;
  const canReview = hasRole(sessionUser, ["interviewer", "recruiter", "admin"]);
  if (!isOwner && !canReview) {
    return json({ message: "无权查看该提交记录" }, 403);
  }

  const answers = await findSubmissionAnswersBySubmissionId(env, submissionId);
  return json({
    submission,
    answers: answers.results ?? []
  });
}

/**
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {string} campaignId
 */
async function handleGetCampaignQuestions(env, sessionUser, campaignId) {
  const campaign = await findCampaignAssignment(env, campaignId, sessionUser.sub);
  if (!campaign && !hasRole(sessionUser, ["interviewer", "recruiter", "admin"])) {
    return json({ message: "未找到对应招聘场次" }, 404);
  }

  const result = await findCampaignQuestionsForCandidate(
    env,
    campaignId,
    campaign?.user_id ?? sessionUser.sub
  );
  const items = result.results ?? [];
  if (items.length === 0) {
    return json({ message: "未找到题目列表" }, 404);
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
  });
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 */
async function handleEvaluation(request, env, sessionUser) {
  if (!hasRole(sessionUser, ["interviewer", "recruiter", "admin"])) {
    return json({ message: "无权执行人工评估" }, 403);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.submissionId !== "string" || !Array.isArray(body.answers)) {
    return json({ message: "请求参数不合法" }, 400);
  }

  const submission = await findSubmissionById(env, body.submissionId);
  if (!submission) {
    return json({ message: "提交记录不存在" }, 404);
  }

  const answersResult = await findSubmissionAnswersBySubmissionId(env, body.submissionId);
  const answers = answersResult.results ?? [];
  const answerMap = new Map(answers.map((item) => [item.id, item]));

  for (const item of body.answers) {
    if (!item || typeof item !== "object" || typeof item.submissionAnswerId !== "string") {
      return json({ message: "评估项格式不合法" }, 400);
    }

    const current = answerMap.get(item.submissionAnswerId);
    if (!current) {
      return json({ message: `未找到作答记录: ${item.submissionAnswerId}` }, 404);
    }

    const subjectiveScore = Number(item.subjectiveScore);
    if (!Number.isFinite(subjectiveScore) || subjectiveScore < 0) {
      return json({ message: "主观题分数不合法" }, 400);
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
  });
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 */
async function handleProctoringSnapshot(request, env, sessionUser) {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.campaignId !== "string" ||
    typeof body.submissionId !== "string" ||
    typeof body.imageBase64 !== "string"
  ) {
    return json({ message: "请求参数不合法" }, 400);
  }

  const campaign = await findCampaignAssignment(env, body.campaignId, sessionUser.sub);
  if (!campaign) {
    return json({ message: "未找到对应招聘场次" }, 404);
  }

  const submission = await findSubmissionById(env, body.submissionId);
  if (!submission || submission.user_id !== sessionUser.sub || submission.campaign_id !== body.campaignId) {
    return json({ message: "提交记录与当前用户或场次不匹配" }, 400);
  }

  const contentType = typeof body.contentType === "string" ? body.contentType : "image/jpeg";
  const bytes = decodeBase64Payload(body.imageBase64);
  if (!bytes || bytes.byteLength === 0) {
    return json({ message: "抓拍图片内容不合法" }, 400);
  }

  const snapshotId = crypto.randomUUID();
  const extension = contentTypeToExtension(contentType);
  const capturedAt = normalizeTimestamp(body.capturedAt, Date.now());
  const key = `snapshots/${sessionUser.sub}/${body.submissionId}/${capturedAt}-${snapshotId}.${extension}`;

  if (!env.PROCTORING_BUCKET) {
    return json({ message: "未配置抓拍存储桶" }, 500);
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
  });
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
function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
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
