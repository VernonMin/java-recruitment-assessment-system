import {
  countUserSubmissions,
  countQuestionDependencies,
  countUserDependencies,
  deleteAssessmentQuestionsByAssessmentId,
  deleteQuestionAnswersByQuestionId,
  deleteQuestionById,
  deleteQuestionOptionsByQuestionId,
  aggregateSubmissionScores,
  deleteUserRolesByUserId,
  deleteUserById,
  findAssessmentById,
  findCampaignById,
  findAssessmentQuestionsWithDetails,
  findAssessmentQuestionSet,
  findAssessments,
  findCampaignAssignment,
  findCampaignsForAdmin,
  findCampaignQuestionsForCandidate,
  findActiveSubmissionByCampaignAndUser,
  findOpenCampaignsByUser,
  findProctoringEventsBySubmissionId,
  findQuestionById,
  findQuestionOptions,
  findQuestionsByIds,
  findQuestions,
  findRoleByCode,
  findSnapshotFileById,
  findSnapshotFilesBySubmissionId,
  findSubmissionAnswersBySubmissionId,
  findSubmissionById,
  findSubmissions,
  findUserByAccount,
  findUserById,
  findUsers,
  insertCampaignCandidate,
  insertCampaign,
  insertAssessment,
  insertAssessmentQuestion,
  insertQuestion,
  insertQuestionAnswer,
  insertQuestionOption,
  insertEvaluationRecord,
  insertProctoringEvent,
  insertSnapshotFile,
  insertSubmission,
  insertSubmissionAnswer,
  insertUser,
  insertUserRole,
  finalizeSubmission,
  updateAssessment,
  updateCampaign,
  updateCampaignCandidateInvitationStatus,
  updateQuestion,
  updateUserPassword,
  updateUserProfile,
  updateSubmissionAnswerEvaluation,
  updateSubmissionSummary
} from "./lib/db.js";
import { hashPassword, verifyPassword } from "./lib/password.js";
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

    if (request.method === "POST" && url.pathname === "/api/auth/logout") {
      return handleLogout(corsHeaders);
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
      return handleGetQuestions(request, env, sessionUser, corsHeaders);
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

    if (request.method === "GET" && url.pathname === "/api/submissions") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleGetSubmissions(request, env, sessionUser, corsHeaders);
    }

    if (request.method === "GET" && url.pathname === "/api/campaigns") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      const result = await findOpenCampaignsByUser(env, sessionUser.sub);
      return json({ items: result.results ?? [] }, 200, {}, corsHeaders);
    }

    if (request.method === "GET" && url.pathname === "/api/admin/users") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleGetUsers(request, env, sessionUser, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/api/admin/users") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleCreateUser(request, env, sessionUser, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/api/admin/users/batch-create") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleBatchCreateUsers(request, env, sessionUser, corsHeaders);
    }

    if (request.method === "GET" && url.pathname === "/api/admin/campaigns") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleGetAdminCampaigns(request, env, sessionUser, corsHeaders);
    }

    if (request.method === "GET" && url.pathname === "/api/admin/assessments") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleGetAssessments(request, env, sessionUser, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/api/admin/assessments") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleCreateAssessment(request, env, sessionUser, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/api/admin/campaigns") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleCreateCampaign(request, env, sessionUser, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/api/admin/campaign-assignments") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleAssignCampaign(request, env, sessionUser, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/api/admin/campaign-assignments/batch") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleBatchAssignCampaign(request, env, sessionUser, corsHeaders);
    }

    const adminCampaignMatch = url.pathname.match(/^\/api\/admin\/campaigns\/([^/]+)$/);
    if (request.method === "PUT" && adminCampaignMatch) {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleUpdateCampaign(request, env, sessionUser, adminCampaignMatch[1], corsHeaders);
    }

    const adminAssessmentMatch = url.pathname.match(/^\/api\/admin\/assessments\/([^/]+)$/);
    if (request.method === "GET" && adminAssessmentMatch) {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleGetAssessmentDetail(env, sessionUser, adminAssessmentMatch[1], corsHeaders);
    }
    if (request.method === "PUT" && adminAssessmentMatch) {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleUpdateAssessment(request, env, sessionUser, adminAssessmentMatch[1], corsHeaders);
    }

    const adminUserMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
    if (request.method === "PUT" && adminUserMatch) {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleUpdateUser(request, env, sessionUser, adminUserMatch[1], corsHeaders);
    }
    if (request.method === "DELETE" && adminUserMatch) {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleDeleteUser(env, sessionUser, adminUserMatch[1], corsHeaders);
    }

    const adminResetPasswordMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)\/reset-password$/);
    if (request.method === "POST" && adminResetPasswordMatch) {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleResetUserPassword(request, env, sessionUser, adminResetPasswordMatch[1], corsHeaders);
    }

    const campaignQuestionsMatch = url.pathname.match(/^\/api\/campaigns\/([^/]+)\/questions$/);
    if (request.method === "GET" && campaignQuestionsMatch) {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleGetCampaignQuestions(env, sessionUser, campaignQuestionsMatch[1], corsHeaders);
    }

    const questionMatch = url.pathname.match(/^\/api\/questions\/([^/]+)$/);
    if (request.method === "PUT" && questionMatch) {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleUpdateQuestion(request, env, sessionUser, questionMatch[1], corsHeaders);
    }
    if (request.method === "DELETE" && questionMatch) {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleDeleteQuestion(env, sessionUser, questionMatch[1], corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/api/submissions") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleSubmission(request, env, sessionUser, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/api/submissions/session") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleStartSubmissionSession(request, env, sessionUser, corsHeaders);
    }

    const submissionMatch = url.pathname.match(/^\/api\/submissions\/([^/]+)$/);
    if (request.method === "GET" && submissionMatch) {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleGetSubmission(env, sessionUser, submissionMatch[1], corsHeaders);
    }

    const completeSubmissionMatch = url.pathname.match(/^\/api\/submissions\/([^/]+)\/complete$/);
    if (request.method === "PUT" && completeSubmissionMatch) {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleCompleteSubmission(request, env, sessionUser, completeSubmissionMatch[1], corsHeaders);
    }

    const submissionProctoringMatch = url.pathname.match(/^\/api\/submissions\/([^/]+)\/proctoring$/);
    if (request.method === "GET" && submissionProctoringMatch) {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleGetSubmissionProctoring(env, sessionUser, submissionProctoringMatch[1], corsHeaders);
    }

    const snapshotMatch = url.pathname.match(/^\/api\/proctoring\/snapshots\/([^/]+)$/);
    if (request.method === "GET" && snapshotMatch) {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleGetProctoringSnapshot(env, sessionUser, snapshotMatch[1], corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/api/evaluations/ai-suggestions") {
      if (!sessionUser) {
        return json({ message: "未登录" }, 401, {}, corsHeaders);
      }
      return handleAiEvaluationSuggestions(request, env, sessionUser, corsHeaders);
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
 * @param {Record<string, string>} corsHeaders
 */
function handleLogout(corsHeaders) {
  return json(
    { message: "已退出登录" },
    200,
    {
      "Set-Cookie": serializeCookie("oas_session", "", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/",
        maxAge: 0
      })
    },
    corsHeaders
  );
}

/**
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {Record<string, string>} corsHeaders
 */
async function handleGetUsers(request, env, sessionUser, corsHeaders) {
  if (!hasRole(sessionUser, ["admin"])) {
    return json({ message: "无权查看用户列表" }, 403, {}, corsHeaders);
  }

  const url = new URL(request.url);
  const result = await findUsers(env, {
    q: url.searchParams.get("q") || "",
    role: url.searchParams.get("role") || "",
    status: url.searchParams.get("status") || ""
  }, {
    page: url.searchParams.get("page") || 1,
    pageSize: url.searchParams.get("pageSize") || 10
  });
  return json({
    items: (result.results ?? []).map((item) => ({
      id: item.id,
      account: item.account,
      fullName: item.full_name,
      email: item.email,
      mobile: item.mobile,
      status: item.status,
      roles: typeof item.role_codes === "string" && item.role_codes
        ? item.role_codes.split(",")
        : [],
      createdAt: item.created_at
    })),
    pagination: {
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 10),
      total: Number(result.total ?? 0)
    }
  }, 200, {}, corsHeaders);
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {Record<string, string>} corsHeaders
 */
async function handleGetQuestions(request, env, sessionUser, corsHeaders) {
  if (!hasRole(sessionUser, ["interviewer", "admin"])) {
    return json({ message: "无权查看题库" }, 403, {}, corsHeaders);
  }

  const url = new URL(request.url);
  const result = await findQuestions(env, {
    q: url.searchParams.get("q") || "",
    type: url.searchParams.get("type") || "",
    status: url.searchParams.get("status") || ""
  }, {
    page: url.searchParams.get("page") || 1,
    pageSize: url.searchParams.get("pageSize") || 10
  });

  const items = await Promise.all((result.results ?? []).map(async (item) => {
    const options = await findQuestionOptions(env, item.id);
    return {
      id: item.id,
      type: item.type,
      stem: item.stem,
      analysis: item.analysis,
      difficulty: item.difficulty,
      score: item.score,
      tags: item.tags,
      status: item.status,
      answerType: item.answer_type,
      answer: item.answer_content,
      caseSensitive: Boolean(item.case_sensitive),
      options: (options.results ?? []).map((option) => ({
        optionKey: option.option_key,
        optionText: option.option_text
      }))
    };
  }));

  return json({
    items,
    pagination: {
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 10),
      total: Number(result.total ?? items.length)
    }
  }, 200, {}, corsHeaders);
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {Record<string, string>} corsHeaders
 */
async function handleCreateUser(request, env, sessionUser, corsHeaders) {
  if (!hasRole(sessionUser, ["admin"])) {
    return json({ message: "无权创建用户" }, 403, {}, corsHeaders);
  }

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.account !== "string" ||
    typeof body.password !== "string" ||
    typeof body.fullName !== "string" ||
    typeof body.role !== "string"
  ) {
    return json({ message: "请求参数不合法" }, 400, {}, corsHeaders);
  }

  const account = body.account.trim();
  const password = body.password;
  const fullName = body.fullName.trim();
  const roleCode = body.role.trim();
  const email = typeof body.email === "string" && body.email.trim() ? body.email.trim() : null;
  const mobile = typeof body.mobile === "string" && body.mobile.trim() ? body.mobile.trim() : null;

  if (!account || !/^[a-zA-Z0-9_@.-]{4,50}$/.test(account)) {
    return json({ message: "账号格式不合法" }, 400, {}, corsHeaders);
  }

  if (password.length < 8) {
    return json({ message: "密码至少 8 位" }, 400, {}, corsHeaders);
  }

  if (!fullName) {
    return json({ message: "姓名不能为空" }, 400, {}, corsHeaders);
  }

  if (!ALLOWED_USER_ROLES.has(roleCode)) {
    return json({ message: "角色不支持" }, 400, {}, corsHeaders);
  }

  const existingUser = await findUserByAccount(env, account);
  if (existingUser) {
    return json({ message: "账号已存在" }, 409, {}, corsHeaders);
  }

  const createdUser = await createUserRecord(env, {
    account,
    password,
    fullName,
    roleCode,
    email,
    mobile
  });

  return json({
    message: "用户创建成功",
    user: {
      id: createdUser.id,
      account: createdUser.account,
      fullName: createdUser.fullName,
      role: createdUser.role,
      status: createdUser.status
    }
  }, 201, {}, corsHeaders);
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {Record<string, string>} corsHeaders
 */
async function handleBatchCreateUsers(request, env, sessionUser, corsHeaders) {
  if (!hasRole(sessionUser, ["admin"])) {
    return json({ message: "无权批量创建用户" }, 403, {}, corsHeaders);
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return json({ message: "请求参数不合法" }, 400, {}, corsHeaders);
  }

  const created = [];
  for (const item of body.items) {
    if (
      !item ||
      typeof item.account !== "string" ||
      typeof item.password !== "string" ||
      typeof item.fullName !== "string" ||
      typeof item.role !== "string"
    ) {
      return json({ message: "批量创建数据格式不合法" }, 400, {}, corsHeaders);
    }

    const account = item.account.trim();
    const fullName = item.fullName.trim();
    const password = item.password;
    const roleCode = item.role.trim();
    const email = typeof item.email === "string" && item.email.trim() ? item.email.trim() : null;
    const mobile = typeof item.mobile === "string" && item.mobile.trim() ? item.mobile.trim() : null;

    if (!account || !/^[a-zA-Z0-9_@.-]{4,50}$/.test(account)) {
      return json({ message: `账号格式不合法: ${item.account}` }, 400, {}, corsHeaders);
    }
    if (password.length < 8) {
      return json({ message: `密码至少 8 位: ${item.account}` }, 400, {}, corsHeaders);
    }
    if (!fullName) {
      return json({ message: `姓名不能为空: ${item.account}` }, 400, {}, corsHeaders);
    }
    if (!ALLOWED_USER_ROLES.has(roleCode)) {
      return json({ message: `角色不支持: ${item.account}` }, 400, {}, corsHeaders);
    }

    const existingUser = await findUserByAccount(env, account);
    if (existingUser) {
      return json({ message: `账号已存在: ${account}` }, 409, {}, corsHeaders);
    }

    const createdUser = await createUserRecord(env, {
      account,
      password,
      fullName,
      roleCode,
      email,
      mobile
    });
    created.push(createdUser);
  }

  return json({
    message: `批量创建成功，共 ${created.length} 个账号`,
    items: created
  }, 201, {}, corsHeaders);
}

/**
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {Record<string, string>} corsHeaders
 */
async function handleGetAdminCampaigns(request, env, sessionUser, corsHeaders) {
  if (!hasRole(sessionUser, ["admin", "recruiter"])) {
    return json({ message: "无权查看笔试任务" }, 403, {}, corsHeaders);
  }

  const url = new URL(request.url);
  const result = await findCampaignsForAdmin(env, {
    q: url.searchParams.get("q") || "",
    status: url.searchParams.get("status") || ""
  }, {
    page: url.searchParams.get("page") || 1,
    pageSize: url.searchParams.get("pageSize") || 10
  });
  return json({
    items: result.results ?? [],
    pagination: {
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 10),
      total: Number(result.total ?? 0)
    }
  }, 200, {}, corsHeaders);
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {Record<string, string>} corsHeaders
 */
async function handleGetSubmissions(request, env, sessionUser, corsHeaders) {
  const canReview = hasRole(sessionUser, ["interviewer", "recruiter", "admin"]);
  const url = new URL(request.url);
  const result = await findSubmissions(env, {
    q: url.searchParams.get("q") || "",
    status: url.searchParams.get("status") || "",
    campaignId: url.searchParams.get("campaignId") || "",
    userId: canReview ? "" : sessionUser.sub
  }, {
    page: url.searchParams.get("page") || 1,
    pageSize: url.searchParams.get("pageSize") || 10
  });

  return json({
    items: result.results ?? [],
    pagination: {
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 10),
      total: Number(result.total ?? 0)
    }
  }, 200, {}, corsHeaders);
}

/**
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {Record<string, string>} corsHeaders
 */
async function handleGetAssessments(request, env, sessionUser, corsHeaders) {
  if (!hasRole(sessionUser, ["admin", "recruiter", "interviewer"])) {
    return json({ message: "无权查看试卷模板" }, 403, {}, corsHeaders);
  }

  const url = new URL(request.url);
  const result = await findAssessments(env, {
    q: url.searchParams.get("q") || "",
    status: url.searchParams.get("status") || ""
  }, {
    page: url.searchParams.get("page") || 1,
    pageSize: url.searchParams.get("pageSize") || 10
  });

  return json({
    items: result.results ?? [],
    pagination: {
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 10),
      total: Number(result.total ?? 0)
    }
  }, 200, {}, corsHeaders);
}

async function handleGetAssessmentDetail(env, sessionUser, assessmentId, corsHeaders) {
  if (!hasRole(sessionUser, ["admin", "recruiter", "interviewer"])) {
    return json({ message: "无权查看试卷模板" }, 403, {}, corsHeaders);
  }

  const assessment = await findAssessmentById(env, assessmentId);
  if (!assessment) {
    return json({ message: "试卷模板不存在" }, 404, {}, corsHeaders);
  }

  const questions = await findAssessmentQuestionsWithDetails(env, assessmentId);
  return json({
    assessment,
    questions: questions.results ?? []
  }, 200, {}, corsHeaders);
}

async function handleCreateAssessment(request, env, sessionUser, corsHeaders) {
  if (!hasRole(sessionUser, ["admin", "interviewer"])) {
    return json({ message: "无权创建试卷模板" }, 403, {}, corsHeaders);
  }

  const body = await request.json().catch(() => null);
  const parsed = await parseAssessmentPayload(env, body);
  if (!parsed.ok) {
    return json({ message: parsed.message }, 400, {}, corsHeaders);
  }

  const now = Date.now();
  const assessmentId = `assessment_${crypto.randomUUID().replaceAll("-", "").slice(0, 18)}`;
  await insertAssessment(env, {
    id: assessmentId,
    title: parsed.title,
    description: parsed.description,
    totalScore: parsed.totalScore,
    targetLevel: parsed.targetLevel,
    status: parsed.status,
    createdBy: sessionUser.sub,
    createdAt: now,
    updatedAt: now
  });

  for (const item of parsed.questions) {
    await insertAssessmentQuestion(env, {
      id: crypto.randomUUID(),
      assessmentId,
      questionId: item.questionId,
      sectionName: item.sectionName,
      sortOrder: item.sortOrder,
      score: item.score
    });
  }

  return json({
    message: "试卷模板创建成功",
    assessment: {
      id: assessmentId,
      title: parsed.title,
      status: parsed.status,
      totalScore: parsed.totalScore
    }
  }, 201, {}, corsHeaders);
}

async function handleUpdateAssessment(request, env, sessionUser, assessmentId, corsHeaders) {
  if (!hasRole(sessionUser, ["admin", "interviewer"])) {
    return json({ message: "无权修改试卷模板" }, 403, {}, corsHeaders);
  }

  const currentAssessment = await findAssessmentById(env, assessmentId);
  if (!currentAssessment) {
    return json({ message: "试卷模板不存在" }, 404, {}, corsHeaders);
  }

  const body = await request.json().catch(() => null);
  const parsed = await parseAssessmentPayload(env, body);
  if (!parsed.ok) {
    return json({ message: parsed.message }, 400, {}, corsHeaders);
  }

  await updateAssessment(env, {
    id: assessmentId,
    title: parsed.title,
    description: parsed.description,
    totalScore: parsed.totalScore,
    targetLevel: parsed.targetLevel,
    status: parsed.status,
    updatedAt: Date.now()
  });
  await deleteAssessmentQuestionsByAssessmentId(env, assessmentId);

  for (const item of parsed.questions) {
    await insertAssessmentQuestion(env, {
      id: crypto.randomUUID(),
      assessmentId,
      questionId: item.questionId,
      sectionName: item.sectionName,
      sortOrder: item.sortOrder,
      score: item.score
    });
  }

  return json({
    message: "试卷模板更新成功",
    assessment: {
      id: assessmentId,
      title: parsed.title,
      status: parsed.status,
      totalScore: parsed.totalScore
    }
  }, 200, {}, corsHeaders);
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {Record<string, string>} corsHeaders
 */
async function handleCreateCampaign(request, env, sessionUser, corsHeaders) {
  if (!hasRole(sessionUser, ["admin", "recruiter"])) {
    return json({ message: "无权创建笔试任务" }, 403, {}, corsHeaders);
  }

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.assessmentId !== "string" ||
    typeof body.title !== "string" ||
    typeof body.startTime !== "number" ||
    typeof body.endTime !== "number"
  ) {
    return json({ message: "请求参数不合法" }, 400, {}, corsHeaders);
  }

  const assessmentId = body.assessmentId.trim();
  const title = body.title.trim();
  const description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;
  const targetRole = typeof body.targetRole === "string" && body.targetRole.trim() ? body.targetRole.trim() : null;
  const startTime = Number(body.startTime);
  const endTime = Number(body.endTime);
  const durationMinutes = body.durationMinutes == null ? null : Number(body.durationMinutes);
  const status = typeof body.status === "string" ? body.status.trim() : "draft";
  const requireCamera = body.requireCamera ? 1 : 0;
  const requireFullscreen = body.requireFullscreen ? 1 : 0;

  if (!assessmentId || !title) {
    return json({ message: "模板和标题不能为空" }, 400, {}, corsHeaders);
  }

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
    return json({ message: "开始和结束时间不合法" }, 400, {}, corsHeaders);
  }

  if (durationMinutes != null && (!Number.isFinite(durationMinutes) || durationMinutes <= 0)) {
    return json({ message: "测评时长不合法" }, 400, {}, corsHeaders);
  }

  if (!CAMPAIGN_STATUSES.has(status)) {
    return json({ message: "笔试任务状态不支持" }, 400, {}, corsHeaders);
  }

  const assessment = await findAssessmentById(env, assessmentId);
  if (!assessment) {
    return json({ message: "试卷模板不存在" }, 404, {}, corsHeaders);
  }

  const now = Date.now();
  const campaignId = `campaign_${crypto.randomUUID().replaceAll("-", "").slice(0, 18)}`;
  await insertCampaign(env, {
    id: campaignId,
    assessmentId,
    title,
    description,
    targetRole,
    startTime,
    endTime,
    durationMinutes,
    status,
    requireCamera,
    requireFullscreen,
    createdBy: sessionUser.sub,
    createdAt: now,
    updatedAt: now
  });

  return json({
    message: "笔试任务创建成功",
    campaign: {
      id: campaignId,
      title,
      assessmentId,
      status
    }
  }, 201, {}, corsHeaders);
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {string} campaignId
 * @param {Record<string, string>} corsHeaders
 */
async function handleUpdateCampaign(request, env, sessionUser, campaignId, corsHeaders) {
  if (!hasRole(sessionUser, ["admin", "recruiter"])) {
    return json({ message: "无权修改笔试任务" }, 403, {}, corsHeaders);
  }

  const currentCampaign = await findCampaignById(env, campaignId);
  if (!currentCampaign) {
    return json({ message: "笔试任务不存在" }, 404, {}, corsHeaders);
  }

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.assessmentId !== "string" ||
    typeof body.title !== "string" ||
    typeof body.startTime !== "number" ||
    typeof body.endTime !== "number"
  ) {
    return json({ message: "请求参数不合法" }, 400, {}, corsHeaders);
  }

  const assessmentId = body.assessmentId.trim();
  const title = body.title.trim();
  const description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;
  const targetRole = typeof body.targetRole === "string" && body.targetRole.trim() ? body.targetRole.trim() : null;
  const startTime = Number(body.startTime);
  const endTime = Number(body.endTime);
  const durationMinutes = body.durationMinutes == null ? null : Number(body.durationMinutes);
  const status = typeof body.status === "string" ? body.status.trim() : "draft";
  const requireCamera = body.requireCamera ? 1 : 0;
  const requireFullscreen = body.requireFullscreen ? 1 : 0;

  if (!assessmentId || !title) {
    return json({ message: "模板和标题不能为空" }, 400, {}, corsHeaders);
  }

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
    return json({ message: "开始和结束时间不合法" }, 400, {}, corsHeaders);
  }

  if (durationMinutes != null && (!Number.isFinite(durationMinutes) || durationMinutes <= 0)) {
    return json({ message: "测评时长不合法" }, 400, {}, corsHeaders);
  }

  if (!CAMPAIGN_STATUSES.has(status)) {
    return json({ message: "笔试任务状态不支持" }, 400, {}, corsHeaders);
  }

  const assessment = await findAssessmentById(env, assessmentId);
  if (!assessment) {
    return json({ message: "试卷模板不存在" }, 404, {}, corsHeaders);
  }

  await updateCampaign(env, {
    campaignId,
    assessmentId,
    title,
    description,
    targetRole,
    startTime,
    endTime,
    durationMinutes,
    status,
    requireCamera,
    requireFullscreen,
    updatedAt: Date.now()
  });

  return json({
    message: "笔试任务更新成功",
    campaign: {
      id: campaignId,
      title,
      assessmentId,
      status,
      previousStatus: currentCampaign.status
    }
  }, 200, {}, corsHeaders);
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {Record<string, string>} corsHeaders
 */
async function handleAssignCampaign(request, env, sessionUser, corsHeaders) {
  if (!hasRole(sessionUser, ["admin", "recruiter"])) {
    return json({ message: "无权分配笔试任务" }, 403, {}, corsHeaders);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.account !== "string" || typeof body.campaignId !== "string") {
    return json({ message: "请求参数不合法" }, 400, {}, corsHeaders);
  }

  const account = body.account.trim();
  const campaignId = body.campaignId.trim();
  const attemptLimit = Number(body.attemptLimit ?? 1);
  const invitationStatus = typeof body.invitationStatus === "string" ? body.invitationStatus.trim() : "invited";

  if (!account || !campaignId) {
    return json({ message: "账号和笔试任务不能为空" }, 400, {}, corsHeaders);
  }

  if (!Number.isFinite(attemptLimit) || attemptLimit < 1 || attemptLimit > 10) {
    return json({ message: "允许作答次数不合法" }, 400, {}, corsHeaders);
  }

  if (!CAMPAIGN_INVITATION_STATUSES.has(invitationStatus)) {
    return json({ message: "邀请状态不支持" }, 400, {}, corsHeaders);
  }

  const user = await findUserByAccount(env, account);
  if (!user) {
    return json({ message: "账号不存在" }, 404, {}, corsHeaders);
  }

  const roles = typeof user.role_codes === "string" && user.role_codes ? user.role_codes.split(",") : [];
  if (!roles.includes("candidate")) {
    return json({ message: "该账号不是候选人角色" }, 400, {}, corsHeaders);
  }

  const campaign = await findCampaignById(env, campaignId);
  if (!campaign) {
    return json({ message: "笔试任务不存在" }, 404, {}, corsHeaders);
  }

  try {
    await insertCampaignCandidate(env, {
      id: crypto.randomUUID(),
      campaignId,
      userId: user.id,
      attemptLimit,
      invitationStatus,
      createdAt: Date.now()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("UNIQUE")) {
      return json({ message: "该候选人已分配到当前试题" }, 409, {}, corsHeaders);
    }
    throw error;
  }

  return json({
    message: "候选人分配成功",
    assignment: {
      account,
      campaignId,
      attemptLimit,
      invitationStatus
    }
  }, 201, {}, corsHeaders);
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {Record<string, string>} corsHeaders
 */
async function handleBatchAssignCampaign(request, env, sessionUser, corsHeaders) {
  if (!hasRole(sessionUser, ["admin", "recruiter"])) {
    return json({ message: "无权批量分配笔试任务" }, 403, {}, corsHeaders);
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return json({ message: "请求参数不合法" }, 400, {}, corsHeaders);
  }

  const created = [];
  for (const item of body.items) {
    const fakeRequest = new Request("https://local/api/admin/campaign-assignments", {
      method: "POST",
      body: JSON.stringify(item)
    });
    const response = await handleAssignCampaign(fakeRequest, env, sessionUser, corsHeaders);
    if (response.status >= 400) {
      return response;
    }
    const data = await response.json();
    created.push(data.assignment);
  }

  return json({
    message: `批量分配成功，共 ${created.length} 条`,
    items: created
  }, 201, {}, corsHeaders);
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {string} userId
 * @param {Record<string, string>} corsHeaders
 */
async function handleUpdateUser(request, env, sessionUser, userId, corsHeaders) {
  if (!hasRole(sessionUser, ["admin"])) {
    return json({ message: "无权编辑用户" }, 403, {}, corsHeaders);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.fullName !== "string" || typeof body.role !== "string" || typeof body.status !== "string") {
    return json({ message: "请求参数不合法" }, 400, {}, corsHeaders);
  }

  const user = await findUserById(env, userId);
  if (!user) {
    return json({ message: "用户不存在" }, 404, {}, corsHeaders);
  }

  const fullName = body.fullName.trim();
  const roleCode = body.role.trim();
  const status = body.status.trim();
  const email = typeof body.email === "string" && body.email.trim() ? body.email.trim() : null;
  const mobile = typeof body.mobile === "string" && body.mobile.trim() ? body.mobile.trim() : null;

  if (!fullName) {
    return json({ message: "姓名不能为空" }, 400, {}, corsHeaders);
  }

  if (!ALLOWED_USER_ROLES.has(roleCode)) {
    return json({ message: "角色不支持" }, 400, {}, corsHeaders);
  }

  if (!USER_STATUSES.has(status)) {
    return json({ message: "用户状态不支持" }, 400, {}, corsHeaders);
  }

  const role = await findRoleByCode(env, roleCode);
  if (!role) {
    return json({ message: "角色不存在" }, 400, {}, corsHeaders);
  }

  await updateUserProfile(env, {
    userId,
    fullName,
    email,
    mobile,
    status,
    updatedAt: Date.now()
  });

  await deleteUserRolesByUserId(env, userId);
  await insertUserRole(env, {
    id: crypto.randomUUID(),
    userId,
    roleId: role.id,
    createdAt: Date.now()
  });

  return json({
    message: "用户更新成功",
    user: {
      id: userId,
      account: user.account,
      fullName,
      role: roleCode,
      status
    }
  }, 200, {}, corsHeaders);
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {string} userId
 * @param {Record<string, string>} corsHeaders
 */
async function handleResetUserPassword(request, env, sessionUser, userId, corsHeaders) {
  if (!hasRole(sessionUser, ["admin"])) {
    return json({ message: "无权重置密码" }, 403, {}, corsHeaders);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.password !== "string" || body.password.length < 8) {
    return json({ message: "新密码至少 8 位" }, 400, {}, corsHeaders);
  }

  const user = await findUserById(env, userId);
  if (!user) {
    return json({ message: "用户不存在" }, 404, {}, corsHeaders);
  }

  const passwordHash = await hashPassword(body.password);
  await updateUserPassword(env, {
    userId,
    passwordHash,
    updatedAt: Date.now()
  });

  return json({
    message: "密码重置成功",
    user: {
      id: userId,
      account: user.account
    }
  }, 200, {}, corsHeaders);
}

/**
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {string} userId
 * @param {Record<string, string>} corsHeaders
 */
async function handleDeleteUser(env, sessionUser, userId, corsHeaders) {
  if (!hasRole(sessionUser, ["admin"])) {
    return json({ message: "无权删除用户" }, 403, {}, corsHeaders);
  }

  if (userId === sessionUser.sub) {
    return json({ message: "不能删除当前登录账号" }, 400, {}, corsHeaders);
  }

  const user = await findUserById(env, userId);
  if (!user) {
    return json({ message: "用户不存在" }, 404, {}, corsHeaders);
  }

  const dependencies = await countUserDependencies(env, userId);
  const campaignCount = Number(dependencies?.campaign_count ?? 0);
  const submissionCount = Number(dependencies?.submission_count ?? 0);
  if (campaignCount > 0 || submissionCount > 0) {
    return json({
      message: "该用户已有笔试分配或提交记录，不能直接删除",
      recommendedAction: "disable",
      dependencies: {
        campaignCount,
        submissionCount
      }
    }, 409, {}, corsHeaders);
  }

  await deleteUserRolesByUserId(env, userId);
  await deleteUserById(env, userId);

  return json({
    message: "用户删除成功",
    user: {
      id: userId,
      account: user.account
    }
  }, 200, {}, corsHeaders);
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
  if (!ASSESSMENT_STATUSES.has(status)) {
    return json({ message: "题目状态不支持" }, 400, {}, corsHeaders);
  }

  if (!Number.isFinite(score) || score < 0) {
    return json({ message: "分值不合法" }, 400, {}, corsHeaders);
  }

  if (!Number.isFinite(difficulty) || difficulty < 1 || difficulty > 5) {
    return json({ message: "难度必须在 1 到 5 之间" }, 400, {}, corsHeaders);
  }

  const normalizedOptions = normalizeQuestionOptions(body.options);
  const normalizedAnswer = normalizeQuestionAnswer(type, body.answer);
  const answerType = inferAnswerType(type);
  if (requiresOptions(type) && normalizedOptions.length === 0) {
    return json({ message: "当前题型至少需要一个选项" }, 400, {}, corsHeaders);
  }
  if (answerType !== "manual" && !normalizedAnswer) {
    return json({ message: "当前题型必须提供标准答案" }, 400, {}, corsHeaders);
  }

  let createdQuestion;
  try {
    createdQuestion = await createQuestionRecord(env, sessionUser.sub, {
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
  } catch (error) {
    return json({ message: error instanceof Error ? error.message : "题目创建失败" }, 400, {}, corsHeaders);
  }

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
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {string} questionId
 * @param {Record<string, string>} corsHeaders
 */
async function handleUpdateQuestion(request, env, sessionUser, questionId, corsHeaders) {
  if (!hasRole(sessionUser, ["interviewer", "admin"])) {
    return json({ message: "无权修改题目" }, 403, {}, corsHeaders);
  }

  const currentQuestion = await findQuestionById(env, questionId);
  if (!currentQuestion) {
    return json({ message: "题目不存在" }, 404, {}, corsHeaders);
  }

  const dependencies = await countQuestionDependencies(env, questionId);
  const submissionCount = Number(dependencies?.submission_count ?? 0);
  if (submissionCount > 0) {
    return json({ message: "该题目已有提交记录，不能直接修改" }, 409, {}, corsHeaders);
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
  const normalizedOptions = normalizeQuestionOptions(body.options);
  const normalizedAnswer = normalizeQuestionAnswer(type, body.answer);
  const answerType = inferAnswerType(type);

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
  if (requiresOptions(type) && normalizedOptions.length === 0) {
    return json({ message: "当前题型至少需要一个选项" }, 400, {}, corsHeaders);
  }
  if (answerType !== "manual" && !normalizedAnswer) {
    return json({ message: "当前题型必须提供标准答案" }, 400, {}, corsHeaders);
  }

  await updateQuestion(env, {
    questionId,
    type,
    stem,
    analysis: typeof body.analysis === "string" && body.analysis.trim() ? body.analysis.trim() : null,
    difficulty,
    score,
    tags: Array.isArray(body.tags) ? JSON.stringify(body.tags.map((item) => String(item).trim()).filter(Boolean)) : null,
    status,
    updatedAt: Date.now()
  });

  await deleteQuestionOptionsByQuestionId(env, questionId);
  for (const [index, option] of normalizedOptions.entries()) {
    await insertQuestionOption(env, {
      id: crypto.randomUUID(),
      questionId,
      optionKey: option.optionKey,
      optionText: option.optionText,
      sortOrder: index + 1
    });
  }

  await deleteQuestionAnswersByQuestionId(env, questionId);
  await insertQuestionAnswer(env, {
    id: crypto.randomUUID(),
    questionId,
    answerType,
    answerContent: normalizedAnswer,
    caseSensitive: body.caseSensitive ? 1 : 0,
    createdAt: Date.now()
  });

  return json({
    message: "题目更新成功",
    question: {
      id: questionId,
      type,
      stem,
      score,
      difficulty,
      status,
      previousType: currentQuestion.type
    }
  }, 200, {}, corsHeaders);
}

/**
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {string} questionId
 * @param {Record<string, string>} corsHeaders
 */
async function handleDeleteQuestion(env, sessionUser, questionId, corsHeaders) {
  if (!hasRole(sessionUser, ["interviewer", "admin"])) {
    return json({ message: "无权删除题目" }, 403, {}, corsHeaders);
  }

  const currentQuestion = await findQuestionById(env, questionId);
  if (!currentQuestion) {
    return json({ message: "题目不存在" }, 404, {}, corsHeaders);
  }

  const dependencies = await countQuestionDependencies(env, questionId);
  const assessmentCount = Number(dependencies?.assessment_count ?? 0);
  const submissionCount = Number(dependencies?.submission_count ?? 0);
  if (assessmentCount > 0 || submissionCount > 0) {
    return json({ message: "该题目已被试卷模板或提交记录引用，不能直接删除" }, 409, {}, corsHeaders);
  }

  await deleteQuestionOptionsByQuestionId(env, questionId);
  await deleteQuestionAnswersByQuestionId(env, questionId);
  await deleteQuestionById(env, questionId);

  return json({
    message: "题目删除成功",
    question: {
      id: questionId,
      stem: currentQuestion.stem
    }
  }, 200, {}, corsHeaders);
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
    return json({ message: "未找到可提交的笔试任务" }, 404, {}, corsHeaders);
  }

  if (campaign.status !== "published" && campaign.status !== "in_progress") {
    return json({ message: "当前笔试任务不可提交" }, 400, {}, corsHeaders);
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
    return json({ message: "该试卷模板没有题目" }, 400, {}, corsHeaders);
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
async function handleStartSubmissionSession(request, env, sessionUser, corsHeaders) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.campaignId !== "string") {
    return json({ message: "请求参数不合法" }, 400, {}, corsHeaders);
  }

  const campaign = await findCampaignAssignment(env, body.campaignId, sessionUser.sub);
  if (!campaign) {
    return json({ message: "未找到可作答的笔试任务" }, 404, {}, corsHeaders);
  }

  if (campaign.status !== "published" && campaign.status !== "in_progress") {
    return json({ message: "当前笔试任务不可开始作答" }, 400, {}, corsHeaders);
  }

  const now = Date.now();
  if (typeof campaign.start_time === "number" && now < campaign.start_time) {
    return json({ message: "测评尚未开始" }, 400, {}, corsHeaders);
  }
  if (typeof campaign.end_time === "number" && now > campaign.end_time) {
    return json({ message: "测评已结束" }, 400, {}, corsHeaders);
  }

  const activeSubmission = await findActiveSubmissionByCampaignAndUser(env, body.campaignId, sessionUser.sub);
  if (activeSubmission) {
    return json({
      message: "已恢复进行中的答题记录",
      submission: {
        id: activeSubmission.id,
        campaignId: activeSubmission.campaign_id,
        status: activeSubmission.status,
        startedAt: activeSubmission.started_at,
        durationMinutes: Number(campaign.duration_minutes ?? 0),
        expiresAt: calculateExpiresAt(activeSubmission.started_at, campaign.duration_minutes)
      }
    }, 200, {}, corsHeaders);
  }

  const submissionCount = await countUserSubmissions(env, body.campaignId, sessionUser.sub);
  const submittedTotal = Number(submissionCount?.total ?? 0);
  const attemptLimit = Number(campaign.attempt_limit ?? 1);
  if (submittedTotal >= attemptLimit) {
    return json({ message: "已超过允许提交次数" }, 400, {}, corsHeaders);
  }

  const startedAt = now;
  const submissionId = crypto.randomUUID();
  await insertSubmission(env, {
    id: submissionId,
    campaignId: body.campaignId,
    userId: sessionUser.sub,
    submitNo: submittedTotal + 1,
    status: "in_progress",
    startedAt,
    submittedAt: null,
    objectiveScore: 0,
    subjectiveScore: 0,
    totalScore: 0,
    antiCheatRiskLevel: "low",
    recommendation: null,
    createdAt: now,
    updatedAt: now
  });

  return json({
    message: "答题已开始",
    submission: {
      id: submissionId,
      campaignId: body.campaignId,
      status: "in_progress",
      startedAt,
      durationMinutes: Number(campaign.duration_minutes ?? 0),
      expiresAt: calculateExpiresAt(startedAt, campaign.duration_minutes)
    }
  }, 201, {}, corsHeaders);
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {string} submissionId
 */
async function handleCompleteSubmission(request, env, sessionUser, submissionId, corsHeaders) {
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.answers)) {
    return json({ message: "请求参数不合法" }, 400, {}, corsHeaders);
  }

  const submission = await findSubmissionById(env, submissionId);
  if (!submission || submission.user_id !== sessionUser.sub) {
    return json({ message: "提交记录不存在或无权操作" }, 404, {}, corsHeaders);
  }
  if (submission.status !== "in_progress") {
    return json({ message: "该答卷已经完成提交，不能重复交卷" }, 400, {}, corsHeaders);
  }

  const campaign = await findCampaignAssignment(env, submission.campaign_id, sessionUser.sub);
  if (!campaign) {
    return json({ message: "未找到对应笔试任务" }, 404, {}, corsHeaders);
  }

  const questionSet = await findAssessmentQuestionSet(env, campaign.assessment_id);
  const questions = questionSet.results ?? [];
  if (questions.length === 0) {
    return json({ message: "该试卷模板没有题目" }, 400, {}, corsHeaders);
  }

  const answerMap = normalizeAnswers(body.answers);
  const now = Date.now();
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

  const totalScore = objectiveScore + subjectiveScore;
  const status = pendingManualCount > 0 ? "grading" : "graded";

  await finalizeSubmission(env, {
    submissionId,
    status,
    submittedAt: now,
    objectiveScore,
    subjectiveScore,
    totalScore,
    recommendation: null
  });
  await updateCampaignCandidateInvitationStatus(env, submission.campaign_id, sessionUser.sub, "completed");

  if (body.autoSubmitted) {
    await insertProctoringEvent(env, {
      id: crypto.randomUUID(),
      campaignId: submission.campaign_id,
      submissionId,
      userId: sessionUser.sub,
      eventType: "timeout_auto_submit",
      eventValue: JSON.stringify({
        reason: typeof body.autoSubmitReason === "string" ? body.autoSubmitReason : "timer_expired"
      }),
      riskScore: inferRiskScore("timeout_auto_submit"),
      createdAt: now
    });
  }

  return json({
    message: body.autoSubmitted ? "已自动提交答卷" : "提交成功",
    submission: {
      id: submissionId,
      campaignId: submission.campaign_id,
      submitNo: submission.submit_no,
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
    return json({ message: "未找到对应笔试任务" }, 404, {}, corsHeaders);
  }

  if (typeof body.submissionId === "string") {
    const submission = await findSubmissionById(env, body.submissionId);
    if (!submission || submission.user_id !== sessionUser.sub || submission.campaign_id !== body.campaignId) {
      return json({ message: "提交记录与当前用户或试题不匹配" }, 400, {}, corsHeaders);
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
    return json({ message: "未找到对应笔试任务" }, 404, {}, corsHeaders);
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
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {string} submissionId
 * @param {Record<string, string>} corsHeaders
 */
async function handleGetSubmissionProctoring(env, sessionUser, submissionId, corsHeaders) {
  const submission = await findSubmissionById(env, submissionId);
  if (!submission) {
    return json({ message: "提交记录不存在" }, 404, {}, corsHeaders);
  }

  const isOwner = submission.user_id === sessionUser.sub;
  const canReview = hasRole(sessionUser, ["interviewer", "recruiter", "admin"]);
  if (!isOwner && !canReview) {
    return json({ message: "无权查看该提交的监控记录" }, 403, {}, corsHeaders);
  }

  const [eventsResult, snapshotsResult] = await Promise.all([
    findProctoringEventsBySubmissionId(env, submissionId),
    findSnapshotFilesBySubmissionId(env, submissionId)
  ]);
  const events = (eventsResult.results ?? []).map((item) => ({
    ...item,
    event_value: parseJsonSafely(item.event_value)
  }));
  const snapshots = (snapshotsResult.results ?? []).map((item) => ({
    ...item,
    url: `/api/proctoring/snapshots/${item.id}`
  }));
  const totalRiskScore = events.reduce((sum, item) => sum + Number(item.risk_score ?? 0), 0);

  return json({
    summary: {
      eventCount: events.length,
      snapshotCount: snapshots.length,
      totalRiskScore,
      riskLevel: inferRiskLevel(totalRiskScore)
    },
    events,
    snapshots
  }, 200, {}, corsHeaders);
}

/**
 * @param {Request} request
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 */
async function handleAiEvaluationSuggestions(request, env, sessionUser, corsHeaders) {
  if (!hasRole(sessionUser, ["interviewer", "recruiter", "admin"])) {
    return json({ message: "无权使用 AI 判分建议" }, 403, {}, corsHeaders);
  }

  if (!isAiReviewEnabled(env)) {
    return json({ message: "AI 判分建议未启用，请先配置服务参数" }, 503, {}, corsHeaders);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.submissionId !== "string") {
    return json({ message: "请求参数不合法" }, 400, {}, corsHeaders);
  }

  const submission = await findSubmissionById(env, body.submissionId);
  if (!submission) {
    return json({ message: "提交记录不存在" }, 404, {}, corsHeaders);
  }

  const answersResult = await findSubmissionAnswersBySubmissionId(env, body.submissionId);
  const answers = (answersResult.results ?? []).filter((item) => item.type === "short_answer" || item.type === "scenario_answer");
  if (answers.length === 0) {
    return json({ message: "该提交没有需要 AI 辅助判分的主观题" }, 400, {}, corsHeaders);
  }

  let aiSuggestion;
  try {
    aiSuggestion = await requestAiReviewSuggestions(env, {
      submission,
      answers
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 判分建议生成失败";
    return json({ message }, 502, {}, corsHeaders);
  }

  return json({
    message: "AI 判分建议已生成",
    provider: "openai-compatible",
    model: env.AI_REVIEW_MODEL || "deepseek-chat",
    suggestion: aiSuggestion
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
    return json({ message: "未找到对应笔试任务" }, 404, {}, corsHeaders);
  }

  const submission = await findSubmissionById(env, body.submissionId);
  if (!submission || submission.user_id !== sessionUser.sub || submission.campaign_id !== body.campaignId) {
    return json({ message: "提交记录与当前用户或试题不匹配" }, 400, {}, corsHeaders);
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
 * @param {AppBindings} env
 * @param {SessionUser} sessionUser
 * @param {string} snapshotId
 * @param {Record<string, string>} corsHeaders
 */
async function handleGetProctoringSnapshot(env, sessionUser, snapshotId, corsHeaders) {
  const snapshot = await findSnapshotFileById(env, snapshotId);
  if (!snapshot) {
    return json({ message: "抓拍记录不存在" }, 404, {}, corsHeaders);
  }

  const canReview = hasRole(sessionUser, ["interviewer", "recruiter", "admin"]);
  if (!canReview && snapshot.user_id !== sessionUser.sub) {
    return json({ message: "无权查看该抓拍" }, 403, {}, corsHeaders);
  }

  if (!env.PROCTORING_BUCKET) {
    return json({ message: "未配置抓拍存储桶" }, 500, {}, corsHeaders);
  }

  const object = await env.PROCTORING_BUCKET.get(snapshot.r2_key);
  if (!object) {
    return json({ message: "抓拍文件不存在" }, 404, {}, corsHeaders);
  }

  return new Response(object.body, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": snapshot.content_type,
      "Cache-Control": "private, max-age=60"
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
    case "timeout_auto_submit":
      return 10;
    case "snapshot_uploaded":
      return 0;
    default:
      return 5;
  }
}

/**
 * @param {number} totalRiskScore
 */
function inferRiskLevel(totalRiskScore) {
  if (totalRiskScore >= 80) {
    return "高风险";
  }
  if (totalRiskScore >= 40) {
    return "中风险";
  }
  if (totalRiskScore > 0) {
    return "低风险";
  }
  return "正常";
}

/**
 * @param {number | null | undefined} startedAt
 * @param {number | null | undefined} durationMinutes
 */
function calculateExpiresAt(startedAt, durationMinutes) {
  const normalizedStartedAt = Number(startedAt);
  const normalizedDuration = Number(durationMinutes);
  if (!Number.isFinite(normalizedStartedAt) || !Number.isFinite(normalizedDuration) || normalizedDuration <= 0) {
    return null;
  }
  return normalizedStartedAt + normalizedDuration * 60 * 1000;
}

/**
 * @param {string | null} value
 */
function parseJsonSafely(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * @param {AppBindings} env
 */
function isAiReviewEnabled(env) {
  return String(env.AI_REVIEW_ENABLED || "").toLowerCase() === "true"
    && typeof env.AI_REVIEW_API_KEY === "string"
    && env.AI_REVIEW_API_KEY.trim().length > 0
    && typeof env.AI_REVIEW_BASE_URL === "string"
    && env.AI_REVIEW_BASE_URL.trim().length > 0
    && typeof env.AI_REVIEW_MODEL === "string"
    && env.AI_REVIEW_MODEL.trim().length > 0;
}

/**
 * @param {AppBindings} env
 * @param {{
 *   submission: Record<string, unknown>;
 *   answers: Array<Record<string, unknown>>;
 * }} params
 */
async function requestAiReviewSuggestions(env, params) {
  const prompt = buildAiReviewPrompt(params.submission, params.answers);
  const baseUrl = String(env.AI_REVIEW_BASE_URL || "").replace(/\/+$/g, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.AI_REVIEW_API_KEY}`
    },
    body: JSON.stringify({
      model: env.AI_REVIEW_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "你是企业 Java 招聘测评系统的阅卷助手。你只能输出 JSON，不要输出 Markdown，不要输出额外解释。"
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`AI 评估请求失败: ${response.status} ${errorText}`.trim());
  }

  const payload = await response.json().catch(() => null);
  const content = extractAiMessageContent(payload);
  if (!content) {
    throw new Error("AI 返回内容为空");
  }

  const parsed = parseAiJson(content);
  if (!parsed || !Array.isArray(parsed.answers)) {
    throw new Error("AI 返回结果格式不正确");
  }

  const maxScoreMap = new Map(
    params.answers.map((item) => [String(item.id), Number(item.configured_score ?? 0)])
  );

  return {
    summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "",
    recommendation: normalizeRecommendation(parsed.recommendation),
    answers: parsed.answers.map((item) => ({
      submissionAnswerId: String(item.submissionAnswerId || "").trim(),
      suggestedScore: clampScore(
        Number(item.suggestedScore ?? 0),
        maxScoreMap.get(String(item.submissionAnswerId || "").trim()) ?? 0
      ),
      comment: typeof item.comment === "string" ? item.comment.trim() : "",
      strengths: Array.isArray(item.strengths) ? item.strengths.map((entry) => String(entry).trim()).filter(Boolean) : [],
      risks: Array.isArray(item.risks) ? item.risks.map((entry) => String(entry).trim()).filter(Boolean) : []
    })).filter((item) => item.submissionAnswerId)
  };
}

/**
 * @param {Record<string, unknown>} submission
 * @param {Array<Record<string, unknown>>} answers
 */
function buildAiReviewPrompt(submission, answers) {
  return JSON.stringify({
    task: "请为 Java 招聘测评中的主观题生成阅卷建议。分数必须在 0 到题目满分之间。结论只作为建议，不是最终录入结果。",
    scoringPrinciples: [
      "优先考察技术正确性",
      "其次考察分析完整性与工程实践",
      "如果答案空泛、背概念、不贴题，要明显扣分",
      "如果答案存在严重技术错误，分数不能过半",
      "评语要直接指出优点、缺点和遗漏点"
    ],
    outputSchema: {
      summary: "整体建议摘要",
      recommendation: "strong_hire|hire|hold|reject",
      answers: [
        {
          submissionAnswerId: "作答记录 ID",
          suggestedScore: "建议分数，数字",
          comment: "简短评语",
          strengths: ["优点 1"],
          risks: ["问题 1"]
        }
      ]
    },
    submission: {
      id: submission.id,
      campaignTitle: submission.campaign_title,
      targetRole: submission.target_role,
      candidateName: submission.candidate_name,
      candidateAccount: submission.candidate_account
    },
    answers: answers.map((item) => ({
      submissionAnswerId: item.id,
      questionType: item.type,
      questionStem: item.stem,
      maxScore: item.configured_score,
      answer: item.answer_content,
      currentSubjectiveScore: item.subjective_score,
      currentComment: item.reviewer_comment
    }))
  });
}

/**
 * @param {unknown} payload
 */
function extractAiMessageContent(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((item) => typeof item?.text === "string" ? item.text : "")
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

/**
 * @param {string} value
 */
function parseAiJson(value) {
  const trimmed = value.trim();
  const normalized = trimmed.startsWith("```")
    ? trimmed.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim()
    : trimmed;

  try {
    return JSON.parse(normalized);
  } catch {
    const start = normalized.indexOf("{");
    const end = normalized.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(normalized.slice(start, end + 1));
    }
    throw new Error("AI 返回的 JSON 无法解析");
  }
}

/**
 * @param {unknown} value
 */
function normalizeRecommendation(value) {
  const recommendation = typeof value === "string" ? value.trim() : "hold";
  return ["strong_hire", "hire", "hold", "reject"].includes(recommendation)
    ? recommendation
    : "hold";
}

/**
 * @param {number} value
 * @param {number} maxScore
 */
function clampScore(value, maxScore) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (!Number.isFinite(maxScore) || maxScore <= 0) {
    return Math.max(0, Math.round(value));
  }
  return Math.min(Math.max(0, Math.round(value)), Math.round(maxScore));
}

const QUESTION_TYPES = new Set([
  "single_choice",
  "multiple_choice",
  "true_false",
  "fill_blank",
  "short_answer",
  "scenario_answer"
]);

const ASSESSMENT_STATUSES = new Set(["draft", "published", "archived"]);
const ALLOWED_USER_ROLES = new Set(["candidate", "interviewer", "recruiter", "admin"]);
const CAMPAIGN_INVITATION_STATUSES = new Set(["invited", "completed"]);
const CAMPAIGN_STATUSES = new Set(["draft", "published", "in_progress", "archived"]);
const USER_STATUSES = new Set(["active", "disabled", "locked"]);

async function parseAssessmentPayload(env, body) {
  if (
    !body ||
    typeof body.title !== "string" ||
    !Array.isArray(body.questions)
  ) {
    return { ok: false, message: "请求参数不合法" };
  }

  const title = body.title.trim();
  const description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;
  const targetLevel = typeof body.targetLevel === "string" && body.targetLevel.trim() ? body.targetLevel.trim() : null;
  const status = typeof body.status === "string" && body.status.trim() ? body.status.trim() : "draft";
  if (!title) {
    return { ok: false, message: "模板标题不能为空" };
  }
  if (!ASSESSMENT_STATUSES.has(status)) {
    return { ok: false, message: "模板状态不支持" };
  }
  if (body.questions.length === 0) {
    return { ok: false, message: "请至少选择一道题目" };
  }

  const normalizedQuestions = body.questions.map((item, index) => ({
    questionId: typeof item?.questionId === "string" ? item.questionId.trim() : "",
    sectionName: typeof item?.sectionName === "string" && item.sectionName.trim() ? item.sectionName.trim() : null,
    sortOrder: Number(item?.sortOrder ?? index + 1),
    score: Number(item?.score ?? 0)
  }));

  const duplicateIds = new Set();
  const questionIds = [];
  for (const item of normalizedQuestions) {
    if (!item.questionId) {
      return { ok: false, message: "模板题目缺少 questionId" };
    }
    if (!Number.isFinite(item.sortOrder) || item.sortOrder <= 0) {
      return { ok: false, message: "题目排序必须为正整数" };
    }
    if (!Number.isFinite(item.score) || item.score <= 0) {
      return { ok: false, message: "题目分值必须大于 0" };
    }
    if (duplicateIds.has(item.questionId)) {
      return { ok: false, message: "同一模板中不能重复选择题目" };
    }
    duplicateIds.add(item.questionId);
    questionIds.push(item.questionId);
  }

  const questionResult = await findQuestionsByIds(env, questionIds);
  const questionMap = new Map((questionResult.results ?? []).map((item) => [item.id, item]));
  for (const item of normalizedQuestions) {
    const question = questionMap.get(item.questionId);
    if (!question) {
      return { ok: false, message: "存在无效题目，请刷新后重试" };
    }
    if (question.status !== "published") {
      return { ok: false, message: "模板只能选择已发布题目" };
    }
  }

  const sortedQuestions = normalizedQuestions
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({
      ...item,
      sortOrder: index + 1
    }));

  return {
    ok: true,
    title,
    description,
    targetLevel,
    status,
    totalScore: sortedQuestions.reduce((sum, item) => sum + item.score, 0),
    questions: sortedQuestions
  };
}

/**
 * @param {AppBindings} env
 * @param {{
 *   account: string;
 *   password: string;
 *   fullName: string;
 *   roleCode: string;
 *   email: string | null;
 *   mobile: string | null;
 * }} params
 */
async function createUserRecord(env, params) {
  const role = await findRoleByCode(env, params.roleCode);
  if (!role) {
    throw new Error("角色不存在");
  }

  const now = Date.now();
  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(params.password);

  await insertUser(env, {
    id: userId,
    account: params.account,
    passwordHash,
    fullName: params.fullName,
    email: params.email,
    mobile: params.mobile,
    status: "active",
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now
  });

  await insertUserRole(env, {
    id: crypto.randomUUID(),
    userId,
    roleId: role.id,
    createdAt: now
  });

  return {
    id: userId,
    account: params.account,
    fullName: params.fullName,
    role: params.roleCode,
    status: "active"
  };
}

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
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": requestHeaders ?? "Content-Type",
    "Vary": "Origin"
  };
}
