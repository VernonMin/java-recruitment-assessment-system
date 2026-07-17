const state = {
  user: null,
  questions: [],
  campaigns: [],
  currentCampaign: null,
  currentQuestions: [],
  currentSubmission: null,
  activeView: "login",
  apiBaseUrl: loadApiBaseUrl()
};

const VIEW_ROLES = {
  login: [],
  candidateHome: ["candidate"],
  enterpriseHome: ["interviewer", "recruiter", "admin"],
  questionBank: ["interviewer", "admin"],
  assessment: ["candidate"],
  submission: ["candidate", "interviewer", "recruiter", "admin"],
  review: ["interviewer", "recruiter", "admin"]
};

const viewMeta = {
  login: ["登录", "使用账号密码登录，并进入求职者端或企业端。"],
  candidateHome: ["求职者端", "查看你被分配的测评场次，并进入正式答题流程。"],
  enterpriseHome: ["企业端", "面试官、招聘专员、管理员在同一套企业工作台中使用各自模块。"],
  questionBank: ["题库管理", "企业端中的题库能力，供面试官和管理员维护 Java 招聘题库。"],
  assessment: ["答题页", "求职者加载题目、填写答案并提交本次测评。"],
  submission: ["提交详情", "查看提交记录、逐题作答、评分结果与评估意见。"],
  review: ["人工评估", "企业端查看主观题答案并录入人工评分。"]
};

const ROLE_NAME_MAP = {
  candidate: "求职者",
  interviewer: "面试官",
  recruiter: "招聘专员",
  admin: "管理员"
};

document.querySelectorAll(".menu-item").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

document.getElementById("loadMeButton").addEventListener("click", loadCurrentUser);
document.getElementById("loginForm").addEventListener("submit", onLogin);
document.getElementById("questionForm").addEventListener("submit", submitQuestion);
document.getElementById("reloadQuestionBankButton").addEventListener("click", () => loadQuestions());
document.getElementById("importPresetQuestionsButton").addEventListener("click", importPresetQuestions);
document.getElementById("loadCampaignsButton").addEventListener("click", () => loadCampaigns());
document.getElementById("loadQuestionsButton").addEventListener("click", loadCampaignQuestions);
document.getElementById("loadSubmissionButton").addEventListener("click", loadSubmissionDetail);
document.getElementById("assessmentForm").addEventListener("submit", submitAssessment);
document.getElementById("evaluationForm").addEventListener("submit", submitEvaluation);

applyNavigation();
renderCandidateWorkspace();
renderEnterpriseWorkspace();
switchView("login", { force: true });
loadCurrentUser();

function switchView(view, options = {}) {
  if (!options.force && !canAccessView(view)) {
    showFeedback("当前账号不能访问这个页面。", true);
    return;
  }

  state.activeView = view;
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach((item) => {
    item.classList.toggle("active", item.id === `${view}View`);
  });

  const [title, desc] = viewMeta[view] || ["工作台", ""];
  document.getElementById("pageTitle").textContent = title;
  document.getElementById("pageDesc").textContent = desc;
}

function applyNavigation() {
  document.querySelectorAll(".menu-item").forEach((item) => {
    const view = item.dataset.view;
    item.hidden = !(view === "login" || canAccessView(view));
  });
}

function canAccessView(view) {
  const roles = VIEW_ROLES[view];
  if (!roles || roles.length === 0) {
    return true;
  }
  if (!state.user || !Array.isArray(state.user.roles)) {
    return false;
  }
  return roles.some((role) => state.user.roles.includes(role));
}

function getLandingView() {
  if (hasAnyRole(["candidate"])) {
    return "candidateHome";
  }
  return "enterpriseHome";
}

async function onLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payload = {
    account: String(formData.get("account") || "").trim(),
    password: String(formData.get("password") || "")
  };

  const result = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (!result.ok) {
    return showFeedback(result.message, true);
  }

  state.user = result.data.user;
  refreshSessionBadge();
  applyNavigation();
  await warmupWorkspaceData();
  showFeedback("登录成功，已进入对应端。");
  switchView(getLandingView(), { force: true });
}

async function loadCurrentUser() {
  const result = await api("/api/auth/me");
  if (!result.ok) {
    state.user = null;
    refreshSessionBadge();
    applyNavigation();
    if (state.activeView !== "login") {
      switchView("login", { force: true });
    }
    return;
  }

  state.user = result.data.user;
  refreshSessionBadge();
  applyNavigation();
  await warmupWorkspaceData();
  if (state.activeView === "login" || !canAccessView(state.activeView)) {
    switchView(getLandingView(), { force: true });
  }
}

async function warmupWorkspaceData() {
  const jobs = [];
  if (hasAnyRole(["candidate", "recruiter", "admin"])) {
    jobs.push(loadCampaigns({ silent: true }));
  }
  if (hasAnyRole(["interviewer", "admin"])) {
    jobs.push(loadQuestions({ silent: true }));
  }
  await Promise.all(jobs);
  renderCandidateWorkspace();
  renderEnterpriseWorkspace();
}

async function loadCampaigns(options = {}) {
  const result = await api("/api/campaigns");
  if (!result.ok) {
    if (!options.silent) {
      showFeedback(result.message, true);
    }
    return false;
  }

  state.campaigns = result.data.items;
  renderCandidateWorkspace();
  renderEnterpriseWorkspace();
  return true;
}

async function loadQuestions(options = {}) {
  const result = await api("/api/questions");
  if (!result.ok) {
    if (!options.silent) {
      showFeedback(result.message, true);
    }
    return false;
  }

  state.questions = result.data.items;
  renderQuestionBankList();
  renderEnterpriseWorkspace();
  return true;
}

function renderCandidateWorkspace() {
  const summary = document.getElementById("candidateSummary");
  const list = document.getElementById("candidateCampaignList");
  if (!summary || !list) {
    return;
  }

  summary.innerHTML = renderMetaItems([
    ["当前端", "求职者端"],
    ["我的测评场次", state.campaigns.length],
    ["最近提交", state.currentSubmission?.submission?.id || state.currentSubmission?.id || "暂无"]
  ]);

  if (state.campaigns.length === 0) {
    list.innerHTML = `<article class="card"><h3>暂无测评</h3><p>当前没有分配给你的招聘测评场次。</p></article>`;
    return;
  }

  list.innerHTML = state.campaigns.map((item) => `
    <article class="card">
      <h3>${escapeHtml(item.title)}</h3>
      <p>场次 ID：${escapeHtml(item.id)}</p>
      <p>目标岗位：${escapeHtml(item.target_role || "-")}</p>
      <p>邀请状态：${escapeHtml(item.invitation_status || "-")}</p>
      <p>时长：${escapeHtml(String(item.duration_minutes || "-"))} 分钟</p>
      <div class="button-row">
        <button class="ghost-button" data-campaign-id="${escapeHtml(item.id)}">进入答题</button>
      </div>
    </article>
  `).join("");

  list.querySelectorAll("[data-campaign-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      document.getElementById("campaignIdInput").value = button.dataset.campaignId;
      switchView("assessment");
      await loadCampaignQuestions();
    });
  });
}

function renderEnterpriseWorkspace() {
  const summary = document.getElementById("enterpriseSummary");
  const root = document.getElementById("enterpriseOverview");
  if (!summary || !root) {
    return;
  }

  const roleText = state.user ? formatRoleNames(state.user.roles) : "未登录";
  summary.innerHTML = renderMetaItems([
    ["当前端", "企业端"],
    ["当前账号", state.user?.account || "-"],
    ["企业角色", roleText],
    ["题库题目数", hasAnyRole(["interviewer", "admin"]) ? state.questions.length : "仅面试官/管理员可见"]
  ]);

  if (!state.user) {
    root.innerHTML = `
      <article class="card">
        <h3>企业端说明</h3>
        <p>企业端由面试官、招聘专员、管理员共用，登录后会按角色显示对应能力。</p>
      </article>
    `;
    return;
  }

  const cards = [];

  if (hasAnyRole(["interviewer", "admin"])) {
    cards.push(`
      <article class="card">
        <h3>题库管理</h3>
        <p>创建 Java 招聘题目、导入示例题库，并持续完善企业题库。</p>
        <div class="button-row">
          <button class="ghost-button" data-nav-view="questionBank">进入题库管理</button>
        </div>
      </article>
    `);
  }

  if (hasAnyRole(["interviewer", "recruiter", "admin"])) {
    cards.push(`
      <article class="card">
        <h3>结果查看</h3>
        <p>通过提交详情查看候选人作答、评分结果和当前测评状态。</p>
        <div class="button-row">
          <button class="ghost-button" data-nav-view="submission">查看提交详情</button>
        </div>
      </article>
    `);
  }

  if (hasAnyRole(["interviewer", "recruiter", "admin"])) {
    cards.push(`
      <article class="card">
        <h3>人工评估</h3>
        <p>对简答题和场景分析题进行人工评分，补全最终结论。</p>
        <div class="button-row">
          <button class="ghost-button" data-nav-view="review">进入人工评估</button>
        </div>
      </article>
    `);
  }

  if (hasAnyRole(["recruiter", "admin"])) {
    cards.push(`
      <article class="card">
        <h3>招聘推进</h3>
        <p>招聘专员通过企业端跟踪测评流转，后续继续补齐场次发布、候选人分配和结果汇总。</p>
      </article>
    `);
  }

  if (hasAnyRole(["admin"])) {
    cards.push(`
      <article class="card">
        <h3>系统管理</h3>
        <p>管理员统一管理企业端入口，后续继续扩展用户、角色、审计与系统配置能力。</p>
      </article>
    `);
  }

  root.innerHTML = cards.join("");
  bindViewButtons(root);
}

function bindViewButtons(root) {
  root.querySelectorAll("[data-nav-view]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.navView));
  });
}

function renderQuestionBankList() {
  const container = document.getElementById("questionBankList");
  if (!container) {
    return;
  }

  if (state.questions.length === 0) {
    container.innerHTML = `<div class="question-card"><p>当前还没有题目。</p></div>`;
    return;
  }

  container.innerHTML = state.questions.map((item) => `
    <article class="question-card">
      <h3>${escapeHtml(item.stem)}</h3>
      <p>题型：${escapeHtml(item.type)}</p>
      <p>分值：${escapeHtml(String(item.score))} 分</p>
      <p>难度：${escapeHtml(String(item.difficulty))}</p>
      <p>状态：${escapeHtml(item.status)}</p>
    </article>
  `).join("");
}

async function submitQuestion(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const type = String(formData.get("type") || "").trim();
  const payload = {
    type,
    stem: String(formData.get("stem") || "").trim(),
    score: Number(formData.get("score") || 0),
    difficulty: Number(formData.get("difficulty") || 3),
    status: String(formData.get("status") || "draft"),
    options: parseOptionLines(String(formData.get("options") || "")),
    answer: type === "multiple_choice"
      ? String(formData.get("answer") || "").split(",").map((item) => item.trim()).filter(Boolean)
      : String(formData.get("answer") || "").trim(),
    analysis: String(formData.get("analysis") || "").trim()
  };

  const result = await api("/api/questions", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (!result.ok) {
    return showFeedback(result.message, true);
  }

  event.currentTarget.reset();
  event.currentTarget.elements.score.value = "10";
  event.currentTarget.elements.difficulty.value = "3";
  showFeedback("题目创建成功。");
  await loadQuestions({ silent: true });
}

async function importPresetQuestions() {
  const result = await api("/api/questions/import-presets", {
    method: "POST",
    body: JSON.stringify({})
  });

  if (!result.ok) {
    return showFeedback(result.message, true);
  }

  showFeedback(result.message);
  await loadQuestions({ silent: true });
}

async function loadCampaignQuestions() {
  const campaignId = document.getElementById("campaignIdInput").value.trim();
  if (!campaignId) {
    return showFeedback("请先输入 campaignId。", true);
  }

  const result = await api(`/api/campaigns/${campaignId}/questions`);
  if (!result.ok) {
    return showFeedback(result.message, true);
  }

  state.currentCampaign = result.data.campaign;
  state.currentQuestions = result.data.questions;
  renderAssessment();
  showFeedback(`已加载 ${state.currentQuestions.length} 道题目。`);
}

function renderAssessment() {
  const meta = document.getElementById("assessmentMeta");
  meta.innerHTML = renderMetaItems([
    ["招聘场次", state.currentCampaign.title],
    ["模板", state.currentCampaign.assessmentTitle],
    ["时长", `${state.currentCampaign.durationMinutes || "-"} 分钟`],
    ["摄像头", state.currentCampaign.requireCamera ? "要求" : "不要求"]
  ]);

  const form = document.getElementById("assessmentForm");
  form.innerHTML = [
    ...state.currentQuestions.map((question) => `
      <article class="question-card">
        <h3>${escapeHtml(question.sectionName || "未分组")} · 第 ${escapeHtml(String(question.sortOrder))} 题</h3>
        <p>${escapeHtml(question.stem)}</p>
        <p class="score">${escapeHtml(String(question.score))} 分 · ${escapeHtml(question.type)}</p>
        ${renderAnswerInput(question)}
      </article>
    `),
    `<button type="submit" class="primary-button">提交本次测评</button>`
  ].join("");
}

async function submitAssessment(event) {
  event.preventDefault();
  if (!state.currentCampaign) {
    return showFeedback("请先加载招聘场次题目。", true);
  }

  const answers = state.currentQuestions.map((question) => {
    const field = document.querySelector(`[data-answer-id="${question.questionId}"]`);
    return {
      questionId: question.questionId,
      answer: field ? field.value : ""
    };
  });

  const result = await api("/api/submissions", {
    method: "POST",
    body: JSON.stringify({
      campaignId: state.currentCampaign.id,
      startedAt: Date.now(),
      answers
    })
  });

  if (!result.ok) {
    return showFeedback(result.message, true);
  }

  state.currentSubmission = result.data.submission;
  document.getElementById("submissionIdInput").value = state.currentSubmission.id;
  renderSubmissionMeta(state.currentSubmission);
  renderCandidateWorkspace();
  showFeedback("答卷提交成功，已生成提交记录。");
  switchView("submission");
}

async function loadSubmissionDetail() {
  const submissionId = document.getElementById("submissionIdInput").value.trim();
  if (!submissionId) {
    return showFeedback("请先输入 submissionId。", true);
  }

  const result = await api(`/api/submissions/${submissionId}`);
  if (!result.ok) {
    return showFeedback(result.message, true);
  }

  state.currentSubmission = result.data;
  renderSubmissionMeta(result.data.submission);
  renderSubmissionAnswers(result.data.answers);
  renderEvaluationForm(result.data.answers, result.data.submission);
  renderCandidateWorkspace();
  showFeedback("提交详情加载成功。");
}

function renderSubmissionMeta(submission) {
  const meta = document.getElementById("submissionMeta");
  meta.innerHTML = renderMetaItems([
    ["提交 ID", submission.id],
    ["场次", submission.campaign_title || submission.campaignId],
    ["状态", submission.status],
    ["客观题", `${submission.objective_score ?? submission.objectiveScore ?? 0} 分`],
    ["主观题", `${submission.subjective_score ?? submission.subjectiveScore ?? 0} 分`],
    ["总分", `${submission.total_score ?? submission.totalScore ?? 0} 分`]
  ]);
}

function renderSubmissionAnswers(answers) {
  const container = document.getElementById("submissionAnswers");
  container.innerHTML = answers.map((item) => `
    <article class="question-card">
      <h3>${escapeHtml(item.stem)}</h3>
      <p>题型：${escapeHtml(item.type)}</p>
      <p>作答：${escapeHtml(item.answer_content)}</p>
      <p><span class="answer-status">${escapeHtml(item.objective_result)}</span></p>
      <p>客观题得分：${escapeHtml(String(item.objective_score))} 分</p>
      <p>主观题得分：${escapeHtml(String(item.subjective_score))} 分</p>
      <p>评语：${escapeHtml(item.reviewer_comment || "-")}</p>
    </article>
  `).join("");
}

function renderEvaluationForm(answers, submission) {
  const form = document.getElementById("evaluationForm");
  const subjectiveAnswers = answers.filter((item) => item.type === "short_answer" || item.type === "scenario_answer");
  if (subjectiveAnswers.length === 0) {
    form.innerHTML = `<div class="question-card"><p>该提交没有需要人工评估的主观题。</p></div>`;
    return;
  }

  form.innerHTML = [
    `<input type="hidden" name="submissionId" value="${escapeHtml(submission.id)}" />`,
    ...subjectiveAnswers.map((item) => `
      <article class="question-card">
        <h3>${escapeHtml(item.stem)}</h3>
        <p>候选人答案：${escapeHtml(item.answer_content)}</p>
        <label>
          <span>主观题分数</span>
          <input name="score:${escapeHtml(item.id)}" value="${escapeHtml(String(item.subjective_score || 0))}" />
        </label>
        <label>
          <span>评语</span>
          <textarea name="comment:${escapeHtml(item.id)}">${escapeHtml(item.reviewer_comment || "")}</textarea>
        </label>
      </article>
    `),
    `<label>
      <span>推荐结论</span>
      <input name="recommendation" value="${escapeHtml(submission.recommendation || "hold")}" />
    </label>`,
    `<button type="submit" class="primary-button">提交人工评估</button>`
  ].join("");
}

async function submitEvaluation(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const submissionId = String(formData.get("submissionId") || "").trim();
  if (!submissionId) {
    return showFeedback("请先加载提交详情。", true);
  }

  const answers = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("score:")) {
      continue;
    }
    const submissionAnswerId = key.slice("score:".length);
    answers.push({
      submissionAnswerId,
      subjectiveScore: Number(value),
      comment: String(formData.get(`comment:${submissionAnswerId}`) || "")
    });
  }

  const result = await api("/api/evaluations", {
    method: "POST",
    body: JSON.stringify({
      submissionId,
      recommendation: String(formData.get("recommendation") || "").trim(),
      answers
    })
  });

  if (!result.ok) {
    return showFeedback(result.message, true);
  }

  showFeedback("人工评估已提交。");
  document.getElementById("submissionIdInput").value = submissionId;
  switchView("submission");
  await loadSubmissionDetail();
}

async function api(path, options = {}) {
  const url = toApiUrl(path);
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    ...options
  }).catch((error) => ({
    ok: false,
    json: async () => ({ message: error.message || "网络请求失败" })
  }));

  const data = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    status: response.status || 500,
    message: data.message || "请求失败",
    data
  };
}

function refreshSessionBadge() {
  const badge = document.getElementById("sessionBadge");
  if (!state.user) {
    badge.textContent = "未登录";
    return;
  }

  badge.textContent = `${state.user.account} · ${formatRoleNames(state.user.roles)}`;
}

function showFeedback(message, isError = false) {
  const feedback = document.getElementById("feedback");
  feedback.textContent = message;
  feedback.classList.remove("hidden");
  feedback.classList.toggle("error", isError);
}

function formatRoleNames(roles) {
  return (roles || []).map((role) => ROLE_NAME_MAP[role] || role).join(" / ");
}

function hasAnyRole(expectedRoles) {
  if (!state.user || !Array.isArray(state.user.roles)) {
    return false;
  }
  return expectedRoles.some((role) => state.user.roles.includes(role));
}

function renderAnswerInput(question) {
  const id = escapeHtml(question.questionId);
  if (question.type === "short_answer" || question.type === "scenario_answer") {
    return `
      <label>
        <span class="field-label">请输入答案</span>
        <textarea data-answer-id="${id}" placeholder="输入你的答案"></textarea>
      </label>
    `;
  }
  return `
    <label>
      <span class="field-label">请输入选项或文本答案</span>
      <input data-answer-id="${id}" placeholder="例如：B" />
    </label>
  `;
}

function parseOptionLines(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [optionKey, ...rest] = line.split("|");
      return {
        optionKey: (optionKey || "").trim(),
        optionText: rest.join("|").trim()
      };
    })
    .filter((item) => item.optionKey && item.optionText);
}

function renderMetaItems(items) {
  return items.map(([label, value]) => `
    <div class="meta-item">
      <span class="meta-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value ?? "-"))}</strong>
    </div>
  `).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function loadApiBaseUrl() {
  return normalizeApiBaseUrl(window.APP_CONFIG?.apiBaseUrl || "");
}

function normalizeApiBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/g, "");
}

function toApiUrl(path) {
  const base = state.apiBaseUrl || window.location.origin;
  return `${base}${path}`;
}
