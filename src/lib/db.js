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

export function findUsers(env) {
  return env.DB.prepare(
    `select
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
    group by u.id
    order by u.created_at desc, u.account asc`
  ).all();
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

export function findCampaignsForAdmin(env) {
  return env.DB.prepare(
    `select
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
    order by rc.created_at desc, rc.title asc`
  ).all();
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

export function findQuestions(env) {
  return env.DB.prepare(
    `select id, type, stem, difficulty, score, status, created_by, created_at
    from questions
    order by created_at desc
    limit 50`
  ).all();
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
    where campaign_id = ? and user_id = ?`
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
 *   submittedAt: number;
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
