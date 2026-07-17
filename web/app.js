const state = {
  user: null,
  users: [],
  questions: [],
  campaigns: [],
  adminCampaigns: [],
  assessments: [],
  currentCampaign: null,
  currentQuestions: [],
  currentSubmission: null,
  activeView: null,
  apiBaseUrl: loadApiBaseUrl()
};

const VIEW_ROLES = {
  candidateHome: ["candidate"],
  enterpriseHome: ["interviewer", "recruiter", "admin"],
  userManagement: ["admin"],
  campaignManagement: ["recruiter", "admin"],
  questionBank: ["interviewer", "admin"],
  assessment: ["candidate"],
  submission: ["candidate", "interviewer", "recruiter", "admin"],
  review: ["interviewer", "recruiter", "admin"]
};

const viewMeta = {
  candidateHome: ["求职者端", "查看你被分配的测评场次，并进入正式答题流程。"],
  enterpriseHome: ["企业端", "面试官、招聘专员、管理员在同一套企业工作台中使用各自模块。"],
  userManagement: ["用户管理", "管理员创建、批量导入、编辑、禁用账号，并给候选人分配招聘场次。"],
  campaignManagement: ["场次管理", "招聘专员或管理员基于测评模板创建招聘场次。"],
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

const authShell = document.getElementById("authShell");
const appShell = document.getElementById("appShell");

document.querySelectorAll(".menu-item").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

document.getElementById("loadMeButton").addEventListener("click", loadCurrentUser);
document.getElementById("logoutButton").addEventListener("click", logout);
document.getElementById("loginForm").addEventListener("submit", onLogin);
document.getElementById("questionForm").addEventListener("submit", submitQuestion);
document.getElementById("reloadQuestionBankButton").addEventListener("click", () => loadQuestions());
document.getElementById("importPresetQuestionsButton").addEventListener("click", importPresetQuestions);
document.getElementById("loadCampaignsButton").addEventListener("click", () => loadCampaigns());
document.getElementById("loadQuestionsButton").addEventListener("click", loadCampaignQuestions);
document.getElementById("loadSubmissionButton").addEventListener("click", loadSubmissionDetail);
document.getElementById("assessmentForm").addEventListener("submit", submitAssessment);
document.getElementById("evaluationForm").addEventListener("submit", submitEvaluation);
document.getElementById("createUserForm").addEventListener("submit", createUser);
document.getElementById("batchCreateUsersForm").addEventListener("submit", batchCreateUsers);
document.getElementById("updateUserForm").addEventListener("submit", updateUser);
document.getElementById("resetPasswordForm").addEventListener("submit", resetUserPassword);
document.getElementById("assignCampaignForm").addEventListener("submit", assignCampaign);
document.getElementById("batchAssignCampaignForm").addEventListener("submit", batchAssignCampaigns);
document.getElementById("reloadUsersButton").addEventListener("click", () => loadUsers());
document.getElementById("reloadAdminCampaignsButton").addEventListener("click", () => loadAdminCampaigns());
document.getElementById("reloadAssessmentsButton").addEventListener("click", () => loadAssessments());
document.getElementById("reloadCampaignManagementButton").addEventListener("click", () => loadAdminCampaigns());
document.getElementById("createCampaignForm").addEventListener("submit", createCampaign);
document.getElementById("updateCampaignForm").addEventListener("submit", updateCampaign);
document.getElementById("updateUserId").addEventListener("change", syncSelectedUserToForm);
document.getElementById("updateCampaignId").addEventListener("change", syncSelectedCampaignToForm);

setAuthenticated(false);
renderCandidateWorkspace();
renderEnterpriseWorkspace();
renderQuestionBankList();
renderUserManagement();
renderCampaignManagement();
loadCurrentUser();

function setAuthenticated(isAuthenticated) {
  authShell.classList.toggle("hidden", isAuthenticated);
  appShell.classList.toggle("hidden", !isAuthenticated);
}

function switchView(view) {
  if (!canAccessView(view)) {
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
    item.hidden = !canAccessView(item.dataset.view);
  });
}

function canAccessView(view) {
  const roles = VIEW_ROLES[view];
  if (!roles || roles.length === 0) {
    return false;
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
  setAuthenticated(true);
  refreshSessionBadge();
  applyNavigation();
  await warmupWorkspaceData();
  showFeedback("登录成功，已进入对应端。");
  switchView(getLandingView());
}

async function loadCurrentUser() {
  const result = await api("/api/auth/me");
  if (!result.ok) {
    resetSessionState();
    return;
  }

  state.user = result.data.user;
  setAuthenticated(true);
  refreshSessionBadge();
  applyNavigation();
  await warmupWorkspaceData();
  switchView(getLandingView());
}

async function logout() {
  const result = await api("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({})
  });

  resetSessionState();
  if (!result.ok) {
    return showFeedback(result.message, true);
  }
  showFeedback("已退出登录。");
}

function resetSessionState() {
  state.user = null;
  state.users = [];
  state.questions = [];
  state.campaigns = [];
  state.adminCampaigns = [];
  state.assessments = [];
  state.currentCampaign = null;
  state.currentQuestions = [];
  state.currentSubmission = null;
  state.activeView = null;
  setAuthenticated(false);
  refreshSessionBadge();
  applyNavigation();
  renderCandidateWorkspace();
  renderEnterpriseWorkspace();
  renderQuestionBankList();
  renderUserManagement();
  renderCampaignManagement();
  clearDynamicPanels();
}

function clearDynamicPanels() {
  document.getElementById("submissionMeta").innerHTML = "";
  document.getElementById("submissionAnswers").innerHTML = "";
  document.getElementById("evaluationForm").innerHTML = "";
  document.getElementById("assessmentMeta").innerHTML = "";
  document.getElementById("assessmentForm").innerHTML = "";
}

async function warmupWorkspaceData() {
  const jobs = [];
  if (hasAnyRole(["candidate", "recruiter", "admin"])) {
    jobs.push(loadCampaigns({ silent: true }));
  }
  if (hasAnyRole(["interviewer", "admin"])) {
    jobs.push(loadQuestions({ silent: true }));
  }
  if (hasAnyRole(["admin"])) {
    jobs.push(loadUsers({ silent: true }));
  }
  if (hasAnyRole(["admin", "recruiter"])) {
    jobs.push(loadAdminCampaigns({ silent: true }));
    jobs.push(loadAssessments({ silent: true }));
  }
  await Promise.all(jobs);
  renderCandidateWorkspace();
  renderEnterpriseWorkspace();
  renderUserManagement();
  renderCampaignManagement();
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

async function loadUsers(options = {}) {
  const result = await api("/api/admin/users");
  if (!result.ok) {
    if (!options.silent) {
      showFeedback(result.message, true);
    }
    return false;
  }

  state.users = result.data.items;
  renderUserManagement();
  renderEnterpriseWorkspace();
  return true;
}

async function loadAdminCampaigns(options = {}) {
  const result = await api("/api/admin/campaigns");
  if (!result.ok) {
    if (!options.silent) {
      showFeedback(result.message, true);
    }
    return false;
  }

  state.adminCampaigns = result.data.items;
  renderUserManagement();
  renderCampaignManagement();
  renderEnterpriseWorkspace();
  return true;
}

async function loadAssessments(options = {}) {
  const result = await api("/api/admin/assessments");
  if (!result.ok) {
    if (!options.silent) {
      showFeedback(result.message, true);
    }
    return false;
  }

  state.assessments = result.data.items;
  renderCampaignManagement();
  return true;
}

function renderCandidateWorkspace() {
  const summary = document.getElementById("candidateSummary");
  const list = document.getElementById("candidateCampaignList");

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
  const roleText = state.user ? formatRoleNames(state.user.roles) : "未登录";

  summary.innerHTML = renderMetaItems([
    ["当前端", "企业端"],
    ["当前账号", state.user?.account || "-"],
    ["企业角色", roleText],
    ["当前用户数", hasAnyRole(["admin"]) ? state.users.length : "仅管理员可见"]
  ]);

  if (!state.user) {
    root.innerHTML = "";
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

  if (hasAnyRole(["admin"])) {
    cards.push(`
      <article class="card">
        <h3>用户管理</h3>
        <p>管理员创建、批量导入、编辑、禁用账号，并给候选人分配场次。</p>
        <div class="button-row">
          <button class="ghost-button" data-nav-view="userManagement">进入用户管理</button>
        </div>
      </article>
    `);
  }

  if (hasAnyRole(["recruiter", "admin"])) {
    cards.push(`
      <article class="card">
        <h3>场次管理</h3>
        <p>基于测评模板创建招聘场次，并查看当前可管理场次列表。</p>
        <div class="button-row">
          <button class="ghost-button" data-nav-view="campaignManagement">进入场次管理</button>
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

  root.innerHTML = cards.join("");
  bindViewButtons(root);
}

function bindViewButtons(root) {
  root.querySelectorAll("[data-nav-view]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.navView));
  });
}

function renderUserManagement() {
  const summary = document.getElementById("userManagementSummary");
  const list = document.getElementById("userList");
  const assignCampaignSelect = document.getElementById("assignCampaignSelect");
  const batchAssignCampaignSelect = document.getElementById("batchAssignCampaignSelect");
  const updateUserSelect = document.getElementById("updateUserId");
  const resetPasswordUserSelect = document.getElementById("resetPasswordUserId");

  const userOptions = state.users.map((item) => `
    <option value="${escapeHtml(item.id)}">${escapeHtml(item.fullName)} (${escapeHtml(item.account)})</option>
  `).join("");

  const campaignOptions = state.adminCampaigns.length === 0
    ? `<option value="">当前没有可分配场次</option>`
    : state.adminCampaigns.map((item) => `
      <option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} (${escapeHtml(item.id)})</option>
    `).join("");

  updateUserSelect.innerHTML = userOptions || `<option value="">当前没有用户</option>`;
  resetPasswordUserSelect.innerHTML = userOptions || `<option value="">当前没有用户</option>`;
  assignCampaignSelect.innerHTML = campaignOptions;
  batchAssignCampaignSelect.innerHTML = campaignOptions;
  syncSelectedUserToForm();

  summary.innerHTML = renderMetaItems([
    ["当前用户数", state.users.length],
    ["可分配场次数", state.adminCampaigns.length],
    ["候选人账号数", state.users.filter((item) => item.roles.includes("candidate")).length]
  ]);

  if (state.users.length === 0) {
    list.innerHTML = `<div class="question-card"><p>当前还没有用户数据。</p></div>`;
    return;
  }

  list.innerHTML = state.users.map((item) => `
    <article class="question-card">
      <h3>${escapeHtml(item.fullName)} · ${escapeHtml(item.account)}</h3>
      <p>角色：${escapeHtml(formatRoleNames(item.roles))}</p>
      <p>状态：${escapeHtml(item.status)}</p>
      <p>邮箱：${escapeHtml(item.email || "-")}</p>
      <p>手机号：${escapeHtml(item.mobile || "-")}</p>
    </article>
  `).join("");
}

function renderCampaignManagement() {
  const summary = document.getElementById("campaignManagementSummary");
  const list = document.getElementById("campaignManagementList");
  const createAssessmentSelect = document.getElementById("createCampaignAssessmentId");
  const updateAssessmentSelect = document.getElementById("updateCampaignAssessmentId");
  const updateCampaignSelect = document.getElementById("updateCampaignId");

  const assessmentOptions = state.assessments.length === 0
    ? `<option value="">当前没有可用测评模板</option>`
    : state.assessments.map((item) => `
      <option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} (${escapeHtml(item.status)})</option>
    `).join("");
  const campaignOptions = state.adminCampaigns.length === 0
    ? `<option value="">当前没有招聘场次</option>`
    : state.adminCampaigns.map((item) => `
      <option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} (${escapeHtml(item.status)})</option>
    `).join("");

  createAssessmentSelect.innerHTML = assessmentOptions;
  updateAssessmentSelect.innerHTML = assessmentOptions;
  updateCampaignSelect.innerHTML = campaignOptions;
  syncSelectedCampaignToForm();

  summary.innerHTML = renderMetaItems([
    ["测评模板数", state.assessments.length],
    ["招聘场次数", state.adminCampaigns.length],
    ["已发布场次", state.adminCampaigns.filter((item) => item.status === "published").length]
  ]);

  if (state.adminCampaigns.length === 0) {
    list.innerHTML = `<div class="question-card"><p>当前还没有招聘场次。</p></div>`;
    return;
  }

  list.innerHTML = state.adminCampaigns.map((item) => `
    <article class="question-card">
      <h3>${escapeHtml(item.title)}</h3>
      <p>场次 ID：${escapeHtml(item.id)}</p>
      <p>模板：${escapeHtml(item.assessment_title || "-")}</p>
      <p>状态：${escapeHtml(item.status)}</p>
      <p>目标岗位：${escapeHtml(item.target_role || "-")}</p>
      <p>时长：${escapeHtml(String(item.duration_minutes || "-"))} 分钟</p>
      <p>开始：${escapeHtml(formatDateTime(item.start_time))}</p>
      <p>结束：${escapeHtml(formatDateTime(item.end_time))}</p>
    </article>
  `).join("");
}

function renderQuestionBankList() {
  const container = document.getElementById("questionBankList");
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

async function createUser(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payload = {
    account: String(formData.get("account") || "").trim(),
    password: String(formData.get("password") || ""),
    fullName: String(formData.get("fullName") || "").trim(),
    role: String(formData.get("role") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    mobile: String(formData.get("mobile") || "").trim()
  };

  const result = await api("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (!result.ok) {
    return showFeedback(result.message, true);
  }

  event.currentTarget.reset();
  showFeedback(`用户 ${payload.account} 创建成功。`);
  await loadUsers({ silent: true });
}

async function batchCreateUsers(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const lines = String(formData.get("items") || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const items = lines.map((line) => {
    const [account, fullName, password, role, email = "", mobile = ""] = line.split("|").map((item) => item.trim());
    return { account, fullName, password, role, email, mobile };
  });

  const result = await api("/api/admin/users/batch-create", {
    method: "POST",
    body: JSON.stringify({ items })
  });

  if (!result.ok) {
    return showFeedback(result.message, true);
  }

  event.currentTarget.reset();
  showFeedback(result.message);
  await loadUsers({ silent: true });
}

async function updateUser(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const userId = String(formData.get("userId") || "").trim();
  const payload = {
    fullName: String(formData.get("fullName") || "").trim(),
    role: String(formData.get("role") || "").trim(),
    status: String(formData.get("status") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    mobile: String(formData.get("mobile") || "").trim()
  };

  const result = await api(`/api/admin/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

  if (!result.ok) {
    return showFeedback(result.message, true);
  }

  showFeedback("用户信息更新成功。");
  await loadUsers({ silent: true });
}

async function resetUserPassword(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const userId = String(formData.get("userId") || "").trim();
  const password = String(formData.get("password") || "");

  const result = await api(`/api/admin/users/${userId}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password })
  });

  if (!result.ok) {
    return showFeedback(result.message, true);
  }

  event.currentTarget.reset();
  showFeedback("密码重置成功。");
}

async function assignCampaign(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payload = {
    account: String(formData.get("account") || "").trim(),
    campaignId: String(formData.get("campaignId") || "").trim(),
    attemptLimit: Number(formData.get("attemptLimit") || 1),
    invitationStatus: String(formData.get("invitationStatus") || "invited").trim()
  };

  const result = await api("/api/admin/campaign-assignments", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (!result.ok) {
    return showFeedback(result.message, true);
  }

  showFeedback(`已将 ${payload.account} 分配到场次 ${payload.campaignId}。`);
}

async function batchAssignCampaigns(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const campaignId = String(formData.get("campaignId") || "").trim();
  const attemptLimit = Number(formData.get("attemptLimit") || 1);
  const invitationStatus = String(formData.get("invitationStatus") || "invited").trim();
  const accounts = String(formData.get("accounts") || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const items = accounts.map((account) => ({
    account,
    campaignId,
    attemptLimit,
    invitationStatus
  }));

  const result = await api("/api/admin/campaign-assignments/batch", {
    method: "POST",
    body: JSON.stringify({ items })
  });

  if (!result.ok) {
    return showFeedback(result.message, true);
  }

  event.currentTarget.reset();
  showFeedback(result.message);
}

async function createCampaign(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const startAt = new Date(String(formData.get("startAt") || "")).getTime();
  const endAt = new Date(String(formData.get("endAt") || "")).getTime();
  const payload = {
    assessmentId: String(formData.get("assessmentId") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    targetRole: String(formData.get("targetRole") || "").trim(),
    startTime: startAt,
    endTime: endAt,
    durationMinutes: Number(formData.get("durationMinutes") || 60),
    status: String(formData.get("status") || "draft").trim(),
    requireCamera: formData.get("requireCamera") === "on",
    requireFullscreen: formData.get("requireFullscreen") === "on"
  };

  const result = await api("/api/admin/campaigns", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (!result.ok) {
    return showFeedback(result.message, true);
  }

  event.currentTarget.reset();
  showFeedback(`招聘场次 ${payload.title} 创建成功。`);
  await loadAdminCampaigns({ silent: true });
}

async function updateCampaign(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const campaignId = String(formData.get("campaignId") || "").trim();
  const startAt = new Date(String(formData.get("startAt") || "")).getTime();
  const endAt = new Date(String(formData.get("endAt") || "")).getTime();
  const payload = {
    assessmentId: String(formData.get("assessmentId") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    targetRole: String(formData.get("targetRole") || "").trim(),
    startTime: startAt,
    endTime: endAt,
    durationMinutes: Number(formData.get("durationMinutes") || 60),
    status: String(formData.get("status") || "draft").trim(),
    requireCamera: formData.get("requireCamera") === "on",
    requireFullscreen: formData.get("requireFullscreen") === "on"
  };

  const result = await api(`/api/admin/campaigns/${campaignId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

  if (!result.ok) {
    return showFeedback(result.message, true);
  }

  showFeedback(`招聘场次 ${payload.title} 更新成功。`);
  await loadAdminCampaigns({ silent: true });
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
  badge.textContent = state.user
    ? `${state.user.account} · ${formatRoleNames(state.user.roles)}`
    : "未登录";
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

function syncSelectedUserToForm() {
  const form = document.getElementById("updateUserForm");
  const select = document.getElementById("updateUserId");
  const user = state.users.find((item) => item.id === select.value) || state.users[0];
  if (!form || !user) {
    return;
  }

  form.elements.userId.value = user.id;
  form.elements.fullName.value = user.fullName || "";
  form.elements.role.value = Array.isArray(user.roles) && user.roles[0] ? user.roles[0] : "candidate";
  form.elements.status.value = user.status || "active";
  form.elements.email.value = user.email || "";
  form.elements.mobile.value = user.mobile || "";
}

function syncSelectedCampaignToForm() {
  const form = document.getElementById("updateCampaignForm");
  const select = document.getElementById("updateCampaignId");
  const campaign = state.adminCampaigns.find((item) => item.id === select.value) || state.adminCampaigns[0];
  if (!form || !campaign) {
    return;
  }

  form.elements.campaignId.value = campaign.id;
  form.elements.assessmentId.value = campaign.assessment_id || "";
  form.elements.title.value = campaign.title || "";
  form.elements.description.value = campaign.description || "";
  form.elements.targetRole.value = campaign.target_role || "";
  form.elements.startAt.value = toDatetimeLocalValue(campaign.start_time);
  form.elements.endAt.value = toDatetimeLocalValue(campaign.end_time);
  form.elements.durationMinutes.value = String(campaign.duration_minutes || 60);
  form.elements.status.value = campaign.status || "draft";
  form.elements.requireCamera.checked = Boolean(campaign.require_camera);
  form.elements.requireFullscreen.checked = Boolean(campaign.require_fullscreen);
}

function hasAnyRole(expectedRoles) {
  return Boolean(state.user && Array.isArray(state.user.roles) && expectedRoles.some((role) => state.user.roles.includes(role)));
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

function formatDateTime(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false
  });
}

function toDatetimeLocalValue(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "";
  }
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
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
