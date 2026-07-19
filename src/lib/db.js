/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {string} account
 */
export function findUserByAccount(env, account) {
  return env.DB.prepare(
    `select
      u.id,
      u.account,
      u.password_hash,
      u.full_name,
      u.email,
      u.mobile,
      u.status,
      group_concat(r.code) as role_codes
    from users u
    left join user_roles ur on ur.user_id = u.id
    left join roles r on r.id = ur.role_id
    where u.account = ?
    group by u.id`
  ).bind(account).first();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {string} userId
 */
export function findUserById(env, userId) {
  return env.DB.prepare(
    `select
      u.id,
      u.account,
      u.password_hash,
      u.full_name,
      u.email,
      u.mobile,
      u.status,
      group_concat(r.code) as role_codes
    from users u
    left join user_roles ur on ur.user_id = u.id
    left join roles r on r.id = ur.role_id
    where u.id = ?
    group by u.id`
  ).bind(userId).first();
}

function normalizePagination(pagination = {}) {
  const page = Number(pagination.page ?? 1);
  const pageSize = Number(pagination.pageSize ?? 0);
  if (!Number.isFinite(page) || !Number.isFinite(pageSize) || pageSize <= 0) {
    return null;
  }

  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.min(100, Math.floor(pageSize)));
  return {
    page: safePage,
    pageSize: safePageSize,
    offset: (safePage - 1) * safePageSize
  };
}

export async function findUsers(env, filters = {}, pagination = null) {
  const clauses = [];
  const bindings = [];

  if (typeof filters.q === "string" && filters.q.trim()) {
    const q = `%${filters.q.trim()}%`;
    clauses.push("(u.account like ? or u.full_name like ? or coalesce(u.email, '') like ? or coalesce(u.mobile, '') like ?)");
    bindings.push(q, q, q, q);
  }

  if (typeof filters.role === "string" && filters.role.trim()) {
    clauses.push("exists (select 1 from user_roles ur2 inner join roles r2 on r2.id = ur2.role_id where ur2.user_id = u.id and r2.code = ?)");
    bindings.push(filters.role.trim());
  }

  if (typeof filters.status === "string" && filters.status.trim()) {
    clauses.push("u.status = ?");
    bindings.push(filters.status.trim());
  }

  const whereSql = clauses.length > 0 ? `where ${clauses.join(" and ")}` : "";
  const pager = normalizePagination(pagination);
  const countSql = `select count(*) as total from users u ${whereSql}`;
  const listSql = `select
      u.id,
      u.account,
      u.full_name,
      u.email,
      u.mobile,
      u.status,
      u.created_at,
      group_concat(r.code) as role_codes
    from users u
    left join user_roles ur on ur.user_id = u.id
    left join roles r on r.id = ur.role_id
    ${whereSql}
    group by u.id
    order by u.created_at desc, u.account asc`;

  if (!pager) {
    return env.DB.prepare(listSql).bind(...bindings).all();
  }

  const [countResult, listResult] = await Promise.all([
    env.DB.prepare(countSql).bind(...bindings).first(),
    env.DB.prepare(`${listSql} limit ? offset ?`).bind(...bindings, pager.pageSize, pager.offset).all()
  ]);
  return {
    results: listResult.results ?? [],
    total: Number(countResult?.total ?? 0),
    page: pager.page,
    pageSize: pager.pageSize
  };
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {string} code
 */
export function findRoleByCode(env, code) {
  return env.DB.prepare(
    "select id, code, name from roles where code = ?"
  ).bind(code).first();
}

export async function findCampaignsForAdmin(env, filters = {}, pagination = null) {
  const clauses = [];
  const bindings = [];

  if (typeof filters.q === "string" && filters.q.trim()) {
    const q = `%${filters.q.trim()}%`;
    clauses.push("(rc.title like ? or coalesce(rc.description, '') like ? or coalesce(rc.target_role, '') like ? or coalesce(a.title, '') like ?)");
    bindings.push(q, q, q, q);
  }

  if (typeof filters.status === "string" && filters.status.trim()) {
    clauses.push("rc.status = ?");
    bindings.push(filters.status.trim());
  }

  const whereSql = clauses.length > 0 ? `where ${clauses.join(" and ")}` : "";
  const pager = normalizePagination(pagination);
  const countSql = `select count(*) as total
    from recruitment_campaigns rc
    left join assessments a on a.id = rc.assessment_id
    ${whereSql}`;
  const listSql = `select
      rc.id,
      rc.assessment_id,
      rc.title,
      rc.description,
      rc.target_role,
      rc.start_time,
      rc.end_time,
      rc.duration_minutes,
      rc.status,
      rc.require_camera,
      rc.require_fullscreen,
      a.title as assessment_title
    from recruitment_campaigns rc
    left join assessments a on a.id = rc.assessment_id
    ${whereSql}
    order by rc.created_at desc, rc.title asc`
  ;

  if (!pager) {
    return env.DB.prepare(listSql).bind(...bindings).all();
  }

  const [countResult, listResult] = await Promise.all([
    env.DB.prepare(countSql).bind(...bindings).first(),
    env.DB.prepare(`${listSql} limit ? offset ?`).bind(...bindings, pager.pageSize, pager.offset).all()
  ]);
  return {
    results: listResult.results ?? [],
    total: Number(countResult?.total ?? 0),
    page: pager.page,
    pageSize: pager.pageSize
  };
}

export function findAssessmentsForAdmin(env) {
  return env.DB.prepare(
    `select
      id,
      title,
      description,
      total_score,
      target_level,
      status
    from assessments
    order by created_at desc, title asc`
  ).all();
}

export async function findAssessments(env, filters = {}, pagination = null) {
  const clauses = [];
  const bindings = [];

  if (typeof filters.q === "string" && filters.q.trim()) {
    const q = `%${filters.q.trim()}%`;
    clauses.push("(a.title like ? or coalesce(a.description, '') like ? or coalesce(a.target_level, '') like ?)");
    bindings.push(q, q, q);
  }

  if (typeof filters.status === "string" && filters.status.trim()) {
    clauses.push("a.status = ?");
    bindings.push(filters.status.trim());
  }

  const whereSql = clauses.length > 0 ? `where ${clauses.join(" and ")}` : "";
  const pager = normalizePagination(pagination);
  const countSql = `select count(*) as total from assessments a ${whereSql}`;
  const listSql = `select
      a.id,
      a.title,
      a.description,
      a.total_score,
      a.target_level,
      a.status,
      a.created_by,
      a.created_at,
      a.updated_at,
      (
        select count(*)
        from assessment_questions aq
        where aq.assessment_id = a.id
      ) as question_count
    from assessments a
    ${whereSql}
    order by a.created_at desc, a.title asc`;

  if (!pager) {
    return env.DB.prepare(listSql).bind(...bindings).all();
  }

  const [countResult, listResult] = await Promise.all([
    env.DB.prepare(countSql).bind(...bindings).first(),
    env.DB.prepare(`${listSql} limit ? offset ?`).bind(...bindings, pager.pageSize, pager.offset).all()
  ]);

  return {
    results: listResult.results ?? [],
    total: Number(countResult?.total ?? 0),
    page: pager.page,
    pageSize: pager.pageSize
  };
}

export function findAssessmentById(env, assessmentId) {
  return env.DB.prepare(
    `select
      id,
      title,
      description,
      total_score,
      target_level,
      status,
      created_by,
      created_at,
      updated_at
    from assessments
    where id = ?`
  ).bind(assessmentId).first();
}

export function findAssessmentQuestionsWithDetails(env, assessmentId) {
  return env.DB.prepare(
    `select
      aq.id,
      aq.assessment_id,
      aq.question_id,
      aq.section_name,
      aq.sort_order,
      aq.score,
      q.type,
      q.stem,
      q.status as question_status,
      q.difficulty
    from assessment_questions aq
    inner join questions q on q.id = aq.question_id
    where aq.assessment_id = ?
    order by aq.sort_order asc, aq.question_id asc`
  ).bind(assessmentId).all();
}

export function insertAssessment(env, assessment) {
  return env.DB.prepare(
    `insert into assessments (
      id, title, description, total_score, target_level, status, created_by, created_at, updated_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    assessment.id,
    assessment.title,
    assessment.description,
    assessment.totalScore,
    assessment.targetLevel,
    assessment.status,
    assessment.createdBy,
    assessment.createdAt,
    assessment.updatedAt
  ).run();
}

export function updateAssessment(env, assessment) {
  return env.DB.prepare(
    `update assessments
    set title = ?, description = ?, total_score = ?, target_level = ?, status = ?, updated_at = ?
    where id = ?`
  ).bind(
    assessment.title,
    assessment.description,
    assessment.totalScore,
    assessment.targetLevel,
    assessment.status,
    assessment.updatedAt,
    assessment.id
  ).run();
}

export function deleteAssessmentQuestionsByAssessmentId(env, assessmentId) {
  return env.DB.prepare(
    "delete from assessment_questions where assessment_id = ?"
  ).bind(assessmentId).run();
}

export function insertAssessmentQuestion(env, item) {
  return env.DB.prepare(
    `insert into assessment_questions (
      id, assessment_id, question_id, section_name, sort_order, score
    ) values (?, ?, ?, ?, ?, ?)`
  ).bind(
    item.id,
    item.assessmentId,
    item.questionId,
    item.sectionName,
    item.sortOrder,
    item.score
  ).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {string} campaignId
 */
export function findCampaignById(env, campaignId) {
  return env.DB.prepare(
    `select
      rc.id,
      rc.assessment_id,
      rc.description,
      rc.title,
      rc.target_role,
      rc.start_time,
      rc.end_time,
      rc.duration_minutes,
      rc.status
    from recruitment_campaigns rc
    where rc.id = ?`
  ).bind(campaignId).first();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {string} userId
 */
export function findOpenCampaignsByUser(env, userId) {
  return env.DB.prepare(
    `select
      rc.id,
      rc.title,
      rc.target_role,
      rc.start_time,
      rc.end_time,
      rc.duration_minutes,
      cc.invitation_status
    from campaign_candidates cc
    inner join recruitment_campaigns rc on rc.id = cc.campaign_id
    where cc.user_id = ?
    order by rc.start_time desc`
  ).bind(userId).all();
}

export async function findQuestions(env, filters = {}, pagination = null) {
  const clauses = [];
  const bindings = [];

  if (typeof filters.q === "string" && filters.q.trim()) {
    const q = `%${filters.q.trim()}%`;
    clauses.push("(q.stem like ? or coalesce(q.analysis, '') like ? or coalesce(q.tags, '') like ?)");
    bindings.push(q, q, q);
  }

  if (typeof filters.type === "string" && filters.type.trim()) {
    clauses.push("q.type = ?");
    bindings.push(filters.type.trim());
  }

  if (typeof filters.status === "string" && filters.status.trim()) {
    clauses.push("q.status = ?");
    bindings.push(filters.status.trim());
  }

  const whereSql = clauses.length > 0 ? `where ${clauses.join(" and ")}` : "";
  const pager = normalizePagination(pagination);
  const countSql = `select count(*) as total from questions q ${whereSql}`;
  const listSql = `select
      q.id,
      q.type,
      q.stem,
      q.analysis,
      q.difficulty,
      q.score,
      q.tags,
      q.status,
      q.created_by,
      q.created_at,
      qa.answer_type,
      qa.answer_content,
      qa.case_sensitive
    from questions q
    left join question_answers qa on qa.question_id = q.id
    ${whereSql}
    order by q.created_at desc
    `;

  if (!pager) {
    return env.DB.prepare(`${listSql} limit 100`).bind(...bindings).all();
  }

  const [countResult, listResult] = await Promise.all([
    env.DB.prepare(countSql).bind(...bindings).first(),
    env.DB.prepare(`${listSql} limit ? offset ?`).bind(...bindings, pager.pageSize, pager.offset).all()
  ]);
  return {
    results: listResult.results ?? [],
    total: Number(countResult?.total ?? 0),
    page: pager.page,
    pageSize: pager.pageSize
  };
}

export function findQuestionById(env, questionId) {
  return env.DB.prepare(
    `select
      q.id,
      q.type,
      q.stem,
      q.analysis,
      q.difficulty,
      q.score,
      q.tags,
      q.status,
      qa.answer_type,
      qa.answer_content,
      qa.case_sensitive
    from questions q
    left join question_answers qa on qa.question_id = q.id
    where q.id = ?`
  ).bind(questionId).first();
}

export function findQuestionsByIds(env, questionIds) {
  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    return Promise.resolve({ results: [] });
  }

  const placeholders = questionIds.map(() => "?").join(", ");
  return env.DB.prepare(
    `select
      id,
      type,
      stem,
      difficulty,
      score,
      status
    from questions
    where id in (${placeholders})`
  ).bind(...questionIds).all();
}

export function findQuestionOptions(env, questionId) {
  return env.DB.prepare(
    `select id, option_key, option_text, sort_order
    from question_options
    where question_id = ?
    order by sort_order asc`
  ).bind(questionId).all();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {{
 *   id: string;
 *   type: string;
 *   stem: string;
 *   analysis: string | null;
 *   difficulty: number;
 *   score: number;
 *   tags: string | null;
 *   status: string;
 *   createdBy: string;
 *   createdAt: number;
 *   updatedAt: number;
 * }} question
 */
export function insertQuestion(env, question) {
  return env.DB.prepare(
    `insert into questions (
      id, type, stem, analysis, difficulty, score, tags, status, created_by, created_at, updated_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    question.id,
    question.type,
    question.stem,
    question.analysis,
    question.difficulty,
    question.score,
    question.tags,
    question.status,
    question.createdBy,
    question.createdAt,
    question.updatedAt
  ).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {{
 *   id: string;
 *   account: string;
 *   passwordHash: string;
 *   fullName: string;
 *   email: string | null;
 *   mobile: string | null;
 *   status: string;
 *   lastLoginAt: number | null;
 *   createdAt: number;
 *   updatedAt: number;
 * }} user
 */
export function insertUser(env, user) {
  return env.DB.prepare(
    `insert into users (
      id, account, password_hash, full_name, email, mobile, status, last_login_at, created_at, updated_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    user.id,
    user.account,
    user.passwordHash,
    user.fullName,
    user.email,
    user.mobile,
    user.status,
    user.lastLoginAt,
    user.createdAt,
    user.updatedAt
  ).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {{
 *   id: string;
 *   userId: string;
 *   roleId: string;
 *   createdAt: number;
 * }} userRole
 */
export function insertUserRole(env, userRole) {
  return env.DB.prepare(
    `insert into user_roles (
      id, user_id, role_id, created_at
    ) values (?, ?, ?, ?)`
  ).bind(
    userRole.id,
    userRole.userId,
    userRole.roleId,
    userRole.createdAt
  ).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {string} userId
 */
export function deleteUserRolesByUserId(env, userId) {
  return env.DB.prepare(
    "delete from user_roles where user_id = ?"
  ).bind(userId).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {{
 *   userId: string;
 *   fullName: string;
 *   email: string | null;
 *   mobile: string | null;
 *   status: string;
 *   updatedAt: number;
 * }} params
 */
export function updateUserProfile(env, params) {
  return env.DB.prepare(
    `update users
    set full_name = ?, email = ?, mobile = ?, status = ?, updated_at = ?
    where id = ?`
  ).bind(
    params.fullName,
    params.email,
    params.mobile,
    params.status,
    params.updatedAt,
    params.userId
  ).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {{
 *   userId: string;
 *   passwordHash: string;
 *   updatedAt: number;
 * }} params
 */
export function updateUserPassword(env, params) {
  return env.DB.prepare(
    `update users
    set password_hash = ?, updated_at = ?
    where id = ?`
  ).bind(
    params.passwordHash,
    params.updatedAt,
    params.userId
  ).run();
}

export function countUserDependencies(env, userId) {
  return env.DB.prepare(
    `select
      (select count(*) from campaign_candidates where user_id = ?) as campaign_count,
      (select count(*) from submissions where user_id = ?) as submission_count`
  ).bind(userId, userId).first();
}

export function deleteUserById(env, userId) {
  return env.DB.prepare(
    "delete from users where id = ?"
  ).bind(userId).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {{
 *   id: string;
 *   campaignId: string;
 *   userId: string;
 *   attemptLimit: number;
 *   invitationStatus: string;
 *   createdAt: number;
 * }} assignment
 */
export function insertCampaignCandidate(env, assignment) {
  return env.DB.prepare(
    `insert into campaign_candidates (
      id, campaign_id, user_id, attempt_limit, invitation_status, created_at
    ) values (?, ?, ?, ?, ?, ?)`
  ).bind(
    assignment.id,
    assignment.campaignId,
    assignment.userId,
    assignment.attemptLimit,
    assignment.invitationStatus,
    assignment.createdAt
  ).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {{
 *   id: string;
 *   assessmentId: string;
 *   title: string;
 *   description: string | null;
 *   targetRole: string | null;
 *   startTime: number;
 *   endTime: number;
 *   durationMinutes: number | null;
 *   status: string;
 *   requireCamera: number;
 *   requireFullscreen: number;
 *   createdBy: string;
 *   createdAt: number;
 *   updatedAt: number;
 * }} campaign
 */
export function insertCampaign(env, campaign) {
  return env.DB.prepare(
    `insert into recruitment_campaigns (
      id, assessment_id, title, description, target_role, start_time, end_time,
      duration_minutes, status, require_camera, require_fullscreen, created_by, created_at, updated_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    campaign.id,
    campaign.assessmentId,
    campaign.title,
    campaign.description,
    campaign.targetRole,
    campaign.startTime,
    campaign.endTime,
    campaign.durationMinutes,
    campaign.status,
    campaign.requireCamera,
    campaign.requireFullscreen,
    campaign.createdBy,
    campaign.createdAt,
    campaign.updatedAt
  ).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {{
 *   campaignId: string;
 *   assessmentId: string;
 *   title: string;
 *   description: string | null;
 *   targetRole: string | null;
 *   startTime: number;
 *   endTime: number;
 *   durationMinutes: number | null;
 *   status: string;
 *   requireCamera: number;
 *   requireFullscreen: number;
 *   updatedAt: number;
 * }} campaign
 */
export function updateCampaign(env, campaign) {
  return env.DB.prepare(
    `update recruitment_campaigns
    set assessment_id = ?, title = ?, description = ?, target_role = ?, start_time = ?, end_time = ?,
      duration_minutes = ?, status = ?, require_camera = ?, require_fullscreen = ?, updated_at = ?
    where id = ?`
  ).bind(
    campaign.assessmentId,
    campaign.title,
    campaign.description,
    campaign.targetRole,
    campaign.startTime,
    campaign.endTime,
    campaign.durationMinutes,
    campaign.status,
    campaign.requireCamera,
    campaign.requireFullscreen,
    campaign.updatedAt,
    campaign.campaignId
  ).run();
}

export function updateQuestion(env, question) {
  return env.DB.prepare(
    `update questions
    set type = ?, stem = ?, analysis = ?, difficulty = ?, score = ?, tags = ?, status = ?, updated_at = ?
    where id = ?`
  ).bind(
    question.type,
    question.stem,
    question.analysis,
    question.difficulty,
    question.score,
    question.tags,
    question.status,
    question.updatedAt,
    question.questionId
  ).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {{
 *   id: string;
 *   questionId: string;
 *   optionKey: string;
 *   optionText: string;
 *   sortOrder: number;
 * }} option
 */
export function insertQuestionOption(env, option) {
  return env.DB.prepare(
    `insert into question_options (
      id, question_id, option_key, option_text, sort_order
    ) values (?, ?, ?, ?, ?)`
  ).bind(
    option.id,
    option.questionId,
    option.optionKey,
    option.optionText,
    option.sortOrder
  ).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {{
 *   id: string;
 *   questionId: string;
 *   answerType: string;
 *   answerContent: string;
 *   caseSensitive: number;
 *   createdAt: number;
 * }} answer
 */
export function insertQuestionAnswer(env, answer) {
  return env.DB.prepare(
    `insert into question_answers (
      id, question_id, answer_type, answer_content, case_sensitive, created_at
    ) values (?, ?, ?, ?, ?, ?)`
  ).bind(
    answer.id,
    answer.questionId,
    answer.answerType,
    answer.answerContent,
    answer.caseSensitive,
    answer.createdAt
  ).run();
}

export function deleteQuestionOptionsByQuestionId(env, questionId) {
  return env.DB.prepare(
    "delete from question_options where question_id = ?"
  ).bind(questionId).run();
}

export function deleteQuestionAnswersByQuestionId(env, questionId) {
  return env.DB.prepare(
    "delete from question_answers where question_id = ?"
  ).bind(questionId).run();
}

export function countQuestionDependencies(env, questionId) {
  return env.DB.prepare(
    `select
      (select count(*) from assessment_questions where question_id = ?) as assessment_count,
      (select count(*) from submission_answers where question_id = ?) as submission_count`
  ).bind(questionId, questionId).first();
}

export function deleteQuestionById(env, questionId) {
  return env.DB.prepare(
    "delete from questions where id = ?"
  ).bind(questionId).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {string} campaignId
 * @param {string} userId
 */
export function findCampaignQuestionsForCandidate(env, campaignId, userId) {
  return env.DB.prepare(
    `select
      rc.id as campaign_id,
      rc.title as campaign_title,
      rc.duration_minutes,
      rc.require_camera,
      rc.require_fullscreen,
      a.id as assessment_id,
      a.title as assessment_title,
      aq.question_id,
      aq.section_name,
      aq.sort_order,
      aq.score,
      q.type,
      q.stem
    from recruitment_campaigns rc
    inner join campaign_candidates cc on cc.campaign_id = rc.id
    inner join assessments a on a.id = rc.assessment_id
    inner join assessment_questions aq on aq.assessment_id = a.id
    inner join questions q on q.id = aq.question_id
    where rc.id = ? and cc.user_id = ?
    order by aq.sort_order asc`
  ).bind(campaignId, userId).all();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {string} campaignId
 * @param {string} userId
 */
export function findCampaignAssignment(env, campaignId, userId) {
  return env.DB.prepare(
    `select
      rc.id,
      rc.assessment_id,
      rc.title,
      rc.start_time,
      rc.end_time,
      rc.duration_minutes,
      rc.status,
      rc.require_camera,
      rc.require_fullscreen,
      cc.user_id,
      cc.attempt_limit,
      cc.invitation_status
    from recruitment_campaigns rc
    inner join campaign_candidates cc on cc.campaign_id = rc.id
    where rc.id = ? and cc.user_id = ?`
  ).bind(campaignId, userId).first();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {string} campaignId
 * @param {string} userId
 */
export function countUserSubmissions(env, campaignId, userId) {
  return env.DB.prepare(
    `select count(*) as total
    from submissions
    where campaign_id = ? and user_id = ? and status != 'in_progress'`
  ).bind(campaignId, userId).first();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {string} campaignId
 * @param {string} userId
 */
export function findActiveSubmissionByCampaignAndUser(env, campaignId, userId) {
  return env.DB.prepare(
    `select
      id,
      campaign_id,
      user_id,
      submit_no,
      status,
      started_at,
      submitted_at,
      objective_score,
      subjective_score,
      total_score,
      anti_cheat_risk_level,
      recommendation,
      created_at,
      updated_at
    from submissions
    where campaign_id = ? and user_id = ? and status = 'in_progress'
    order by created_at desc
    limit 1`
  ).bind(campaignId, userId).first();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {string} assessmentId
 */
export function findAssessmentQuestionSet(env, assessmentId) {
  return env.DB.prepare(
    `select
      aq.question_id,
      aq.score as configured_score,
      aq.sort_order,
      q.type,
      q.stem,
      qa.answer_type,
      qa.answer_content,
      qa.case_sensitive
    from assessment_questions aq
    inner join questions q on q.id = aq.question_id
    left join question_answers qa on qa.question_id = q.id
    where aq.assessment_id = ?
    order by aq.sort_order asc`
  ).bind(assessmentId).all();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {{
 *   id: string;
 *   campaignId: string;
 *   userId: string;
 *   submitNo: number;
 *   status: string;
 *   startedAt: number;
 *   submittedAt: number | null;
 *   objectiveScore: number;
 *   subjectiveScore: number;
 *   totalScore: number;
 *   antiCheatRiskLevel: string;
 *   recommendation: string | null;
 *   createdAt: number;
 *   updatedAt: number;
 * }} submission
 */
export function insertSubmission(env, submission) {
  return env.DB.prepare(
    `insert into submissions (
      id, campaign_id, user_id, submit_no, status, started_at, submitted_at,
      objective_score, subjective_score, total_score, anti_cheat_risk_level,
      recommendation, created_at, updated_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    submission.id,
    submission.campaignId,
    submission.userId,
    submission.submitNo,
    submission.status,
    submission.startedAt,
    submission.submittedAt,
    submission.objectiveScore,
    submission.subjectiveScore,
    submission.totalScore,
    submission.antiCheatRiskLevel,
    submission.recommendation,
    submission.createdAt,
    submission.updatedAt
  ).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {{
 *   id: string;
 *   submissionId: string;
 *   questionId: string;
 *   answerContent: string;
 *   objectiveResult: string;
 *   objectiveScore: number;
 *   subjectiveScore: number;
 *   finalScore: number;
 *   reviewerComment: string | null;
 *   createdAt: number;
 *   updatedAt: number;
 * }} answer
 */
export function insertSubmissionAnswer(env, answer) {
  return env.DB.prepare(
    `insert into submission_answers (
      id, submission_id, question_id, answer_content, objective_result,
      objective_score, subjective_score, final_score, reviewer_comment,
      created_at, updated_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    answer.id,
    answer.submissionId,
    answer.questionId,
    answer.answerContent,
    answer.objectiveResult,
    answer.objectiveScore,
    answer.subjectiveScore,
    answer.finalScore,
    answer.reviewerComment,
    answer.createdAt,
    answer.updatedAt
  ).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {{
 *   id: string;
 *   submissionId: string;
 *   submissionAnswerId: string | null;
 *   evaluationType: string;
 *   scoreBefore: number | null;
 *   scoreAfter: number | null;
 *   comment: string | null;
 *   evaluatedBy: string | null;
 *   evaluatedAt: number;
 * }} record
 */
export function insertEvaluationRecord(env, record) {
  return env.DB.prepare(
    `insert into evaluation_records (
      id, submission_id, submission_answer_id, evaluation_type,
      score_before, score_after, comment, evaluated_by, evaluated_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    record.id,
    record.submissionId,
    record.submissionAnswerId,
    record.evaluationType,
    record.scoreBefore,
    record.scoreAfter,
    record.comment,
    record.evaluatedBy,
    record.evaluatedAt
  ).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {{
 *   id: string;
 *   campaignId: string;
 *   submissionId: string | null;
 *   userId: string;
 *   eventType: string;
 *   eventValue: string | null;
 *   riskScore: number;
 *   createdAt: number;
 * }} event
 */
export function insertProctoringEvent(env, event) {
  return env.DB.prepare(
    `insert into proctoring_events (
      id, campaign_id, submission_id, user_id, event_type, event_value, risk_score, created_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    event.id,
    event.campaignId,
    event.submissionId,
    event.userId,
    event.eventType,
    event.eventValue,
    event.riskScore,
    event.createdAt
  ).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {string} submissionId
 */
export function findSubmissionById(env, submissionId) {
  return env.DB.prepare(
    `select
      s.id,
      s.campaign_id,
      s.user_id,
      s.submit_no,
      s.status,
      s.started_at,
      s.submitted_at,
      s.objective_score,
      s.subjective_score,
      s.total_score,
      s.anti_cheat_risk_level,
      s.recommendation,
      rc.title as campaign_title,
      rc.target_role,
      u.full_name as candidate_name,
      u.account as candidate_account
    from submissions s
    inner join recruitment_campaigns rc on rc.id = s.campaign_id
    inner join users u on u.id = s.user_id
    where s.id = ?`
  ).bind(submissionId).first();
}

export async function findSubmissions(env, filters = {}, pagination = null) {
  const clauses = [];
  const bindings = [];

  if (typeof filters.userId === "string" && filters.userId.trim()) {
    clauses.push("s.user_id = ?");
    bindings.push(filters.userId.trim());
  }

  if (typeof filters.q === "string" && filters.q.trim()) {
    const q = `%${filters.q.trim()}%`;
    clauses.push("(s.id like ? or rc.title like ? or coalesce(u.account, '') like ? or coalesce(u.full_name, '') like ?)");
    bindings.push(q, q, q, q);
  }

  if (typeof filters.status === "string" && filters.status.trim()) {
    clauses.push("s.status = ?");
    bindings.push(filters.status.trim());
  }

  if (typeof filters.campaignId === "string" && filters.campaignId.trim()) {
    clauses.push("s.campaign_id = ?");
    bindings.push(filters.campaignId.trim());
  }

  const whereSql = clauses.length > 0 ? `where ${clauses.join(" and ")}` : "";
  const pager = normalizePagination(pagination);
  const countSql = `select count(*) as total
    from submissions s
    inner join recruitment_campaigns rc on rc.id = s.campaign_id
    inner join users u on u.id = s.user_id
    ${whereSql}`;
  const listSql = `select
      s.id,
      s.campaign_id,
      s.user_id,
      s.submit_no,
      s.status,
      s.started_at,
      s.submitted_at,
      s.objective_score,
      s.subjective_score,
      s.total_score,
      s.anti_cheat_risk_level,
      s.recommendation,
      s.created_at,
      s.updated_at,
      rc.title as campaign_title,
      rc.target_role,
      u.account as candidate_account,
      u.full_name as candidate_name
    from submissions s
    inner join recruitment_campaigns rc on rc.id = s.campaign_id
    inner join users u on u.id = s.user_id
    ${whereSql}
    order by coalesce(s.submitted_at, s.created_at) desc, s.id desc`;

  if (!pager) {
    return env.DB.prepare(listSql).bind(...bindings).all();
  }

  const [countResult, listResult] = await Promise.all([
    env.DB.prepare(countSql).bind(...bindings).first(),
    env.DB.prepare(`${listSql} limit ? offset ?`).bind(...bindings, pager.pageSize, pager.offset).all()
  ]);
  return {
    results: listResult.results ?? [],
    total: Number(countResult?.total ?? 0),
    page: pager.page,
    pageSize: pager.pageSize
  };
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {string} submissionId
 */
export function findSubmissionAnswersBySubmissionId(env, submissionId) {
  return env.DB.prepare(
    `select
      sa.id,
      sa.submission_id,
      sa.question_id,
      sa.answer_content,
      sa.objective_result,
      sa.objective_score,
      sa.subjective_score,
      sa.final_score,
      sa.reviewer_comment,
      q.type,
      q.stem,
      q.score as configured_score
    from submission_answers sa
    inner join questions q on q.id = sa.question_id
    where sa.submission_id = ?
    order by sa.created_at asc`
  ).bind(submissionId).all();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {string} submissionId
 */
export function aggregateSubmissionScores(env, submissionId) {
  return env.DB.prepare(
    `select
      coalesce(sum(objective_score), 0) as objective_score,
      coalesce(sum(subjective_score), 0) as subjective_score,
      coalesce(sum(final_score), 0) as total_score,
      sum(case when objective_result = 'pending' then 1 else 0 end) as pending_count
    from submission_answers
    where submission_id = ?`
  ).bind(submissionId).first();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {{
 *   submissionAnswerId: string;
 *   subjectiveScore: number;
 *   finalScore: number;
 *   reviewerComment: string | null;
 * }} params
 */
export function updateSubmissionAnswerEvaluation(env, params) {
  return env.DB.prepare(
    `update submission_answers
    set
      objective_result = case
        when objective_result = 'pending' then 'reviewed'
        else objective_result
      end,
      subjective_score = ?,
      final_score = ?,
      reviewer_comment = ?,
      updated_at = ?
    where id = ?`
  ).bind(
    params.subjectiveScore,
    params.finalScore,
    params.reviewerComment,
    Date.now(),
    params.submissionAnswerId
  ).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {{
 *   submissionId: string;
 *   status: string;
 *   objectiveScore: number;
 *   subjectiveScore: number;
 *   totalScore: number;
 *   recommendation: string | null;
 * }} params
 */
export function updateSubmissionSummary(env, params) {
  return env.DB.prepare(
    `update submissions
    set status = ?, objective_score = ?, subjective_score = ?, total_score = ?, recommendation = ?, updated_at = ?
    where id = ?`
  ).bind(
    params.status,
    params.objectiveScore,
    params.subjectiveScore,
    params.totalScore,
    params.recommendation,
    Date.now(),
    params.submissionId
  ).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {{
 *   submissionId: string;
 *   status: string;
 *   submittedAt: number;
 *   objectiveScore: number;
 *   subjectiveScore: number;
 *   totalScore: number;
 *   recommendation: string | null;
 * }} params
 */
export function finalizeSubmission(env, params) {
  return env.DB.prepare(
    `update submissions
    set
      status = ?,
      submitted_at = ?,
      objective_score = ?,
      subjective_score = ?,
      total_score = ?,
      recommendation = ?,
      updated_at = ?
    where id = ?`
  ).bind(
    params.status,
    params.submittedAt,
    params.objectiveScore,
    params.subjectiveScore,
    params.totalScore,
    params.recommendation,
    Date.now(),
    params.submissionId
  ).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {string} submissionId
 */
export function findProctoringEventsBySubmissionId(env, submissionId) {
  return env.DB.prepare(
    `select
      id,
      campaign_id,
      submission_id,
      user_id,
      event_type,
      event_value,
      risk_score,
      created_at
    from proctoring_events
    where submission_id = ?
    order by created_at asc`
  ).bind(submissionId).all();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {string} submissionId
 */
export function findSnapshotFilesBySubmissionId(env, submissionId) {
  return env.DB.prepare(
    `select
      id,
      submission_id,
      user_id,
      r2_key,
      content_type,
      file_size,
      captured_at,
      created_at
    from snapshot_files
    where submission_id = ?
    order by captured_at desc, created_at desc`
  ).bind(submissionId).all();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {string} snapshotId
 */
export function findSnapshotFileById(env, snapshotId) {
  return env.DB.prepare(
    `select
      sf.id,
      sf.submission_id,
      sf.user_id,
      sf.r2_key,
      sf.content_type,
      sf.file_size,
      sf.captured_at,
      sf.created_at,
      s.campaign_id
    from snapshot_files sf
    inner join submissions s on s.id = sf.submission_id
    where sf.id = ?`
  ).bind(snapshotId).first();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {string} campaignId
 * @param {string} userId
 * @param {string} invitationStatus
 */
export function updateCampaignCandidateInvitationStatus(env, campaignId, userId, invitationStatus) {
  return env.DB.prepare(
    `update campaign_candidates
    set invitation_status = ?
    where campaign_id = ? and user_id = ?`
  ).bind(invitationStatus, campaignId, userId).run();
}

/**
 * @param {import("../types").AppContext["Bindings"]} env
 * @param {{
 *   id: string;
 *   submissionId: string;
 *   userId: string;
 *   r2Key: string;
 *   contentType: string;
 *   fileSize: number;
 *   capturedAt: number;
 *   createdAt: number;
 * }} snapshot
 */
export function insertSnapshotFile(env, snapshot) {
  return env.DB.prepare(
    `insert into snapshot_files (
      id, submission_id, user_id, r2_key, content_type, file_size, captured_at, created_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    snapshot.id,
    snapshot.submissionId,
    snapshot.userId,
    snapshot.r2Key,
    snapshot.contentType,
    snapshot.fileSize,
    snapshot.capturedAt,
    snapshot.createdAt
  ).run();
}
