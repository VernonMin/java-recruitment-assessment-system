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
  userFilters: {
    q: "",
    role: "",
    status: ""
  },
  campaignFilters: {
    q: "",
    status: ""
  },
  questionFilters: {
    q: "",
    type: "",
    status: ""
  },
  submissionFilters: {
    q: "",
    status: "",
    campaignId: ""
  },
  paginations: {
    users: { page: 1, pageSize: 10, total: 0 },
    questions: { page: 1, pageSize: 10, total: 0 },
    campaigns: { page: 1, pageSize: 10, total: 0 },
    submissions: { page: 1, pageSize: 10, total: 0 }
  },
  submissions: [],
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
  candidateHome: ["求职者端", "查看你被分配的招聘试题，并进入正式答题流程。"],
  enterpriseHome: ["企业端", "面试官、招聘专员、管理员在同一套企业工作台中使用各自模块。"],
  userManagement: ["用户管理", "管理员创建、批量导入、编辑、禁用账号，并给候选人分配招聘试题。"],
  campaignManagement: ["招聘试题管理", "招聘专员或管理员基于测评模板创建招聘试题。"],
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
const modalOverlay = document.getElementById("modalOverlay");
const loginPasswordInput = document.getElementById("loginPasswordInput");
const togglePasswordButton = document.getElementById("togglePasswordButton");
let feedbackTimer = null;

document.querySelectorAll(".menu-item").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

document.getElementById("loadMeButton").addEventListener("click", loadCurrentUser);
document.getElementById("logoutButton").addEventListener("click", logout);
document.getElementById("loginForm").addEventListener("submit", onLogin);
togglePasswordButton.addEventListener("click", togglePasswordVisibility);
document.getElementById("questionForm").addEventListener("submit", submitQuestion);
document.getElementById("reloadQuestionBankButton").addEventListener("click", () => loadQuestions());
document.getElementById("importPresetQuestionsButton").addEventListener("click", importPresetQuestions);
document.getElementById("loadCampaignsButton").addEventListener("click", () => loadCampaigns());
document.getElementById("loadQuestionsButton").addEventListener("click", loadCampaignQuestions);
document.getElementById("loadSubmissionButton").addEventListener("click", loadSubmissionDetail);
document.getElementById("assessmentForm").addEventListener("submit", submitAssessment);
document.getElementById("evaluationForm").addEventListener("submit", submitEvaluation);
document.getElementById("createUserForm").addEventListener("submit", createUser);
document.getElementById("userSearchForm").addEventListener("submit", searchUsers);
document.getElementById("clearUserSearchButton").addEventListener("click", clearUserSearch);
document.getElementById("batchCreateUsersForm").addEventListener("submit", batchCreateUsers);
document.getElementById("updateUserForm").addEventListener("submit", updateUser);
document.getElementById("resetPasswordForm").addEventListener("submit", resetUserPassword);
document.getElementById("deleteUserForm").addEventListener("submit", deleteUser);
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
document.getElementById("campaignSearchForm").addEventListener("submit", searchCampaigns);
document.getElementById("clearCampaignSearchButton").addEventListener("click", clearCampaignSearch);
document.getElementById("questionSearchForm").addEventListener("submit", searchQuestions);
document.getElementById("clearQuestionSearchButton").addEventListener("click", clearQuestionSearch);
document.getElementById("submissionSearchForm").addEventListener("submit", searchSubmissions);
document.getElementById("clearSubmissionSearchButton").addEventListener("click", clearSubmissionSearch);
document.getElementById("reloadSubmissionListButton").addEventListener("click", () => loadSubmissionList());
document.getElementById("updateQuestionForm").addEventListener("submit", updateQuestion);
document.getElementById("deleteQuestionForm").addEventListener("submit", deleteQuestion);
document.getElementById("updateQuestionId").addEventListener("change", syncSelectedQuestionToForm);
document.getElementById("openCreateUserModalButton").addEventListener("click", () => openUserModal("create"));
document.getElementById("openBatchCreateUsersModalButton").addEventListener("click", () => openUserModal("batchCreate"));
document.getElementById("openAssignCampaignModalButton").addEventListener("click", () => openUserModal("assignCampaign"));
document.getElementById("openBatchAssignCampaignModalButton").addEventListener("click", () => openUserModal("batchAssignCampaign"));
document.getElementById("openCreateCampaignModalButton").addEventListener("click", () => openCampaignModal("create"));
document.getElementById("openUpdateCampaignModalButton").addEventListener("click", () => openCampaignModal("update"));
document.getElementById("openCreateQuestionModalButton").addEventListener("click", () => openQuestionModal("create"));
document.getElementById("openUpdateQuestionModalButton").addEventListener("click", () => openQuestionModal("update"));
document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", closeModal);
});
modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) {
    closeModal();
  }
});

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
  if (!isAuthenticated) {
    closeModal();
  }
}

function togglePasswordVisibility() {
  const nextType = loginPasswordInput.type === "password" ? "text" : "password";
  const isVisible = nextType === "text";
  loginPasswordInput.type = nextType;
  togglePasswordButton.setAttribute("aria-label", isVisible ? "隐藏密码" : "显示密码");
  togglePasswordButton.setAttribute("aria-pressed", String(isVisible));
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
  state.submissions = [];
  state.activeView = null;
  state.campaignFilters = { q: "", status: "" };
  state.submissionFilters = { q: "", status: "", campaignId: "" };
  state.paginations = {
    users: { page: 1, pageSize: 10, total: 0 },
    questions: { page: 1, pageSize: 10, total: 0 },
    campaigns: { page: 1, pageSize: 10, total: 0 },
    submissions: { page: 1, pageSize: 10, total: 0 }
  };
  setAuthenticated(false);
  refreshSessionBadge();
  applyNavigation();
  renderCandidateWorkspace();
  renderEnterpriseWorkspace();
  renderQuestionBankList();
  renderUserManagement();
  renderCampaignManagement();
  clearDynamicPanels();
  closeModal();
}

function clearDynamicPanels() {
  document.getElementById("submissionMeta").innerHTML = "";
  document.getElementById("submissionAnswers").innerHTML = "";
  document.getElementById("submissionList").innerHTML = "";
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
  if (hasAnyRole(["candidate", "interviewer", "recruiter", "admin"])) {
    jobs.push(loadSubmissionList({ silent: true }));
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
  renderSubmissionList();
  return true;
}

async function loadQuestions(options = {}) {
  const search = new URLSearchParams();
  if (state.questionFilters.q) {
    search.set("q", state.questionFilters.q);
  }
  if (state.questionFilters.type) {
    search.set("type", state.questionFilters.type);
  }
  if (state.questionFilters.status) {
    search.set("status", state.questionFilters.status);
  }
  search.set("page", String(options.page || state.paginations.questions.page));
  search.set("pageSize", String(state.paginations.questions.pageSize));
  const query = search.toString();
  const result = await api(`/api/questions${query ? `?${query}` : ""}`);
  if (!result.ok) {
    if (!options.silent) {
      showFeedback(result.message, true);
    }
    return false;
  }

  state.questions = result.data.items;
  state.paginations.questions = normalizePaginationState(result.data.pagination, state.paginations.questions);
  renderQuestionBankList();
  renderEnterpriseWorkspace();
  return true;
}

async function loadUsers(options = {}) {
  const search = new URLSearchParams();
  if (state.userFilters.q) {
    search.set("q", state.userFilters.q);
  }
  if (state.userFilters.role) {
    search.set("role", state.userFilters.role);
  }
  if (state.userFilters.status) {
    search.set("status", state.userFilters.status);
  }
  search.set("page", String(options.page || state.paginations.users.page));
  search.set("pageSize", String(state.paginations.users.pageSize));
  const query = search.toString();
  const result = await api(`/api/admin/users${query ? `?${query}` : ""}`);
  if (!result.ok) {
    if (!options.silent) {
      showFeedback(result.message, true);
    }
    return false;
  }

  state.users = result.data.items;
  state.paginations.users = normalizePaginationState(result.data.pagination, state.paginations.users);
  renderUserManagement();
  renderEnterpriseWorkspace();
  return true;
}

async function loadAdminCampaigns(options = {}) {
  const search = new URLSearchParams();
  if (state.campaignFilters.q) {
    search.set("q", state.campaignFilters.q);
  }
  if (state.campaignFilters.status) {
    search.set("status", state.campaignFilters.status);
  }
  search.set("page", String(options.page || state.paginations.campaigns.page));
  search.set("pageSize", String(state.paginations.campaigns.pageSize));
  const result = await api(`/api/admin/campaigns?${search.toString()}`);
  if (!result.ok) {
    if (!options.silent) {
      showFeedback(result.message, true);
    }
    return false;
  }

  state.adminCampaigns = result.data.items;
  state.paginations.campaigns = normalizePaginationState(result.data.pagination, state.paginations.campaigns);
  renderUserManagement();
  renderCampaignManagement();
  renderSubmissionList();
  renderEnterpriseWorkspace();
  return true;
}

async function loadSubmissionList(options = {}) {
  const search = new URLSearchParams();
  if (state.submissionFilters.q) {
    search.set("q", state.submissionFilters.q);
  }
  if (state.submissionFilters.status) {
    search.set("status", state.submissionFilters.status);
  }
  if (state.submissionFilters.campaignId) {
    search.set("campaignId", state.submissionFilters.campaignId);
  }
  search.set("page", String(options.page || state.paginations.submissions.page));
  search.set("pageSize", String(state.paginations.submissions.pageSize));
  const result = await api(`/api/submissions?${search.toString()}`);
  if (!result.ok) {
    if (!options.silent) {
      showFeedback(result.message, true);
    }
    return false;
  }

  state.submissions = result.data.items;
  state.paginations.submissions = normalizePaginationState(result.data.pagination, state.paginations.submissions);
  renderSubmissionList();
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
    ["我的招聘试题", state.campaigns.length],
    ["最近提交", state.currentSubmission?.submission?.id || state.currentSubmission?.id || "暂无"]
  ]);

  if (state.campaigns.length === 0) {
    list.innerHTML = `<article class="card"><h3>暂无测评</h3><p>当前没有分配给你的招聘试题。</p></article>`;
    return;
  }

  list.innerHTML = state.campaigns.map((item) => `
    <article class="card">
      <h3>${escapeHtml(item.title)}</h3>
      <p>试题 ID：${escapeHtml(item.id)}</p>
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
        <p>管理员创建、批量导入、编辑、禁用账号，并给候选人分配试题。</p>
        <div class="button-row">
          <button class="ghost-button" data-nav-view="userManagement">进入用户管理</button>
        </div>
      </article>
    `);
  }

  if (hasAnyRole(["recruiter", "admin"])) {
    cards.push(`
      <article class="card">
        <h3>招聘试题管理</h3>
        <p>基于测评模板创建招聘试题，并查看当前可管理试题列表。</p>
        <div class="button-row">
          <button class="ghost-button" data-nav-view="campaignManagement">进入试题管理</button>
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
  const pagination = document.getElementById("userPagination") || null;
  const assignCampaignSelect = document.getElementById("assignCampaignSelect");
  const batchAssignCampaignSelect = document.getElementById("batchAssignCampaignSelect");
  const updateUserSelect = document.getElementById("updateUserId");
  const resetPasswordUserSelect = document.getElementById("resetPasswordUserId");
  const deleteUserSelect = document.getElementById("deleteUserId");

  const userOptions = state.users.map((item) => `
    <option value="${escapeHtml(item.id)}">${escapeHtml(item.fullName)} (${escapeHtml(item.account)})</option>
  `).join("");

  const campaignOptions = state.adminCampaigns.length === 0
    ? `<option value="">当前没有可分配试题</option>`
    : state.adminCampaigns.map((item) => `
      <option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} (${escapeHtml(item.id)})</option>
    `).join("");

  updateUserSelect.innerHTML = userOptions || `<option value="">当前没有用户</option>`;
  resetPasswordUserSelect.innerHTML = userOptions || `<option value="">当前没有用户</option>`;
  deleteUserSelect.innerHTML = userOptions || `<option value="">当前没有用户</option>`;
  assignCampaignSelect.innerHTML = campaignOptions;
  batchAssignCampaignSelect.innerHTML = campaignOptions;
  syncSelectedUserToForm();

  summary.innerHTML = renderMetaItems([
    ["当前页用户数", state.users.length],
    ["用户总数", state.paginations.users.total],
    ["可分配试题数", state.adminCampaigns.length],
    ["候选人账号数", state.users.filter((item) => item.roles.includes("candidate")).length]
  ]);

  if (state.users.length === 0) {
    list.innerHTML = `<div class="question-card"><p>当前还没有用户数据。</p></div>`;
    if (pagination) {
      pagination.innerHTML = "";
    }
    return;
  }

  list.innerHTML = state.users.map((item) => `
    <article class="question-card">
      <h3>${escapeHtml(item.fullName)} · ${escapeHtml(item.account)}</h3>
      <p>角色：${escapeHtml(formatRoleNames(item.roles))}</p>
      <p>状态：${escapeHtml(item.status)}</p>
      <p>邮箱：${escapeHtml(item.email || "-")}</p>
      <p>手机号：${escapeHtml(item.mobile || "-")}</p>
      <div class="button-row">
        <button class="ghost-button" data-edit-user-id="${escapeHtml(item.id)}">编辑</button>
        <button class="ghost-button" data-reset-user-id="${escapeHtml(item.id)}">重置密码</button>
        <button class="danger-button" data-delete-user-id="${escapeHtml(item.id)}">删除</button>
      </div>
    </article>
  `).join("");

  list.querySelectorAll("[data-edit-user-id]").forEach((button) => {
    button.addEventListener("click", () => {
      updateUserSelect.value = button.dataset.editUserId;
      syncSelectedUserToForm();
      openUserModal("update");
    });
  });
  list.querySelectorAll("[data-reset-user-id]").forEach((button) => {
    button.addEventListener("click", () => {
      resetPasswordUserSelect.value = button.dataset.resetUserId;
      openUserModal("resetPassword");
    });
  });
  list.querySelectorAll("[data-delete-user-id]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteUserSelect.value = button.dataset.deleteUserId;
      openUserModal("delete");
    });
  });

  if (pagination) {
    pagination.innerHTML = renderPagination("users", state.paginations.users);
    bindPagination("users", loadUsers);
  }
}

function renderCampaignManagement() {
  const summary = document.getElementById("campaignManagementSummary");
  const list = document.getElementById("campaignManagementList");
  const pagination = document.getElementById("campaignPagination");
  const createAssessmentSelect = document.getElementById("createCampaignAssessmentId");
  const updateAssessmentSelect = document.getElementById("updateCampaignAssessmentId");
  const updateCampaignSelect = document.getElementById("updateCampaignId");

  const assessmentOptions = state.assessments.length === 0
    ? `<option value="">当前没有可用测评模板</option>`
    : state.assessments.map((item) => `
      <option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} (${escapeHtml(item.status)})</option>
    `).join("");
  const campaignOptions = state.adminCampaigns.length === 0
    ? `<option value="">当前没有招聘试题</option>`
    : state.adminCampaigns.map((item) => `
      <option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} (${escapeHtml(item.status)})</option>
    `).join("");

  createAssessmentSelect.innerHTML = assessmentOptions;
  updateAssessmentSelect.innerHTML = assessmentOptions;
  updateCampaignSelect.innerHTML = campaignOptions;
  syncSelectedCampaignToForm();

  summary.innerHTML = renderMetaItems([
    ["测评模板数", state.assessments.length],
    ["当前页试题数", state.adminCampaigns.length],
    ["试题总数", state.paginations.campaigns.total],
    ["已发布试题", state.adminCampaigns.filter((item) => item.status === "published").length]
  ]);

  if (state.adminCampaigns.length === 0) {
    list.innerHTML = `<div class="question-card"><p>当前还没有招聘试题。</p></div>`;
    pagination.innerHTML = "";
    return;
  }

  list.innerHTML = state.adminCampaigns.map((item) => `
    <article class="question-card">
      <h3>${escapeHtml(item.title)}</h3>
      <p>试题 ID：${escapeHtml(item.id)}</p>
      <p>模板：${escapeHtml(item.assessment_title || "-")}</p>
      <p>状态：${escapeHtml(item.status)}</p>
      <p>目标岗位：${escapeHtml(item.target_role || "-")}</p>
      <p>时长：${escapeHtml(String(item.duration_minutes || "-"))} 分钟</p>
      <p>开始：${escapeHtml(formatDateTime(item.start_time))}</p>
      <p>结束：${escapeHtml(formatDateTime(item.end_time))}</p>
      <div class="button-row">
        <button class="ghost-button" data-edit-campaign-id="${escapeHtml(item.id)}">编辑试题</button>
      </div>
    </article>
  `).join("");

  list.querySelectorAll("[data-edit-campaign-id]").forEach((button) => {
    button.addEventListener("click", () => {
      updateCampaignSelect.value = button.dataset.editCampaignId;
      syncSelectedCampaignToForm();
      openCampaignModal("update");
    });
  });

  pagination.innerHTML = renderPagination("campaigns", state.paginations.campaigns);
  bindPagination("campaigns", loadAdminCampaigns);
}

function renderQuestionBankList() {
  const container = document.getElementById("questionBankList");
  const pagination = document.getElementById("questionPagination");
  const updateQuestionSelect = document.getElementById("updateQuestionId");
  const deleteQuestionSelect = document.getElementById("deleteQuestionId");
  const questionOptions = state.questions.map((item) => `
    <option value="${escapeHtml(item.id)}">${escapeHtml(item.stem.slice(0, 36))}</option>
  `).join("");
  updateQuestionSelect.innerHTML = questionOptions || `<option value="">当前没有题目</option>`;
  deleteQuestionSelect.innerHTML = questionOptions || `<option value="">当前没有题目</option>`;
  syncSelectedQuestionToForm();

  if (state.questions.length === 0) {
    container.innerHTML = `<div class="question-card"><p>当前还没有题目。</p></div>`;
    pagination.innerHTML = "";
    return;
  }

  container.innerHTML = state.questions.map((item) => `
    <article class="question-card">
      <h3>${escapeHtml(item.stem)}</h3>
      <p>题型：${escapeHtml(item.type)}</p>
      <p>分值：${escapeHtml(String(item.score))} 分</p>
      <p>难度：${escapeHtml(String(item.difficulty))}</p>
      <p>状态：${escapeHtml(item.status)}</p>
      <div class="button-row">
        <button class="ghost-button" data-edit-question-id="${escapeHtml(item.id)}">编辑</button>
        <button class="danger-button" data-delete-question-id="${escapeHtml(item.id)}">删除</button>
      </div>
    </article>
  `).join("");

  container.querySelectorAll("[data-edit-question-id]").forEach((button) => {
    button.addEventListener("click", () => {
      updateQuestionSelect.value = button.dataset.editQuestionId;
      syncSelectedQuestionToForm();
      openQuestionModal("update");
    });
  });
  container.querySelectorAll("[data-delete-question-id]").forEach((button) => {
    button.addEventListener("click", () => {
      updateQuestionSelect.value = button.dataset.deleteQuestionId;
      syncSelectedQuestionToForm();
      deleteQuestionSelect.value = button.dataset.deleteQuestionId;
      openQuestionModal("update");
    });
  });

  pagination.innerHTML = renderPagination("questions", state.paginations.questions);
  bindPagination("questions", loadQuestions);
}

async function searchUsers(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  state.userFilters = {
    q: String(formData.get("q") || "").trim(),
    role: String(formData.get("role") || "").trim(),
    status: String(formData.get("status") || "").trim()
  };
  state.paginations.users.page = 1;
  await loadUsers();
}

async function clearUserSearch() {
  document.getElementById("userSearchForm").reset();
  state.userFilters = { q: "", role: "", status: "" };
  state.paginations.users.page = 1;
  await loadUsers();
}

async function searchCampaigns(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  state.campaignFilters = {
    q: String(formData.get("q") || "").trim(),
    status: String(formData.get("status") || "").trim()
  };
  state.paginations.campaigns.page = 1;
  await loadAdminCampaigns();
}

async function clearCampaignSearch() {
  document.getElementById("campaignSearchForm").reset();
  state.campaignFilters = { q: "", status: "" };
  state.paginations.campaigns.page = 1;
  await loadAdminCampaigns();
}

async function createUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearFormFeedback(form);
  setFormLoading(form, true, "创建中...");
  const formData = new FormData(form);
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
    setFormFeedback(form, result.message, true);
    showFeedback(result.message, true);
    setFormLoading(form, false);
    return;
  }

  form.reset();
  closeModal();
  showFeedback(`用户 ${payload.account} 创建成功。`);
  await loadUsers({ silent: true });
  setFormLoading(form, false);
}

async function batchCreateUsers(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearFormFeedback(form);
  setFormLoading(form, true, "导入中...");
  const formData = new FormData(form);
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
    setFormFeedback(form, result.message, true);
    showFeedback(result.message, true);
    setFormLoading(form, false);
    return;
  }

  form.reset();
  closeModal();
  showFeedback(result.message);
  await loadUsers({ silent: true });
  setFormLoading(form, false);
}

async function updateUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearFormFeedback(form);
  setFormLoading(form, true, "保存中...");
  const formData = new FormData(form);
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
    setFormFeedback(form, result.message, true);
    showFeedback(result.message, true);
    setFormLoading(form, false);
    return;
  }

  closeModal();
  showFeedback("用户信息更新成功。");
  await loadUsers({ silent: true });
  setFormLoading(form, false);
}

async function resetUserPassword(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearFormFeedback(form);
  setFormLoading(form, true, "重置中...");
  const formData = new FormData(form);
  const userId = String(formData.get("userId") || "").trim();
  const password = String(formData.get("password") || "");

  const result = await api(`/api/admin/users/${userId}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password })
  });

  if (!result.ok) {
    setFormFeedback(form, result.message, true);
    showFeedback(result.message, true);
    setFormLoading(form, false);
    return;
  }

  form.reset();
  closeModal();
  showFeedback("密码重置成功。");
  setFormLoading(form, false);
}

async function deleteUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearFormFeedback(form);
  setFormLoading(form, true, "删除中...");
  const userId = String(new FormData(form).get("userId") || "").trim();
  await deleteUserById(userId, form);
}

async function deleteUserById(userId, form = null) {
  if (!userId) {
    if (form) {
      setFormFeedback(form, "请先选择用户。", true);
      setFormLoading(form, false);
    }
    return showFeedback("请先选择用户。", true);
  }
  const result = await api(`/api/admin/users/${userId}`, {
    method: "DELETE",
    body: JSON.stringify({})
  });
  if (!result.ok) {
    if (form) {
      setFormFeedback(form, result.message, true);
      setFormLoading(form, false);
    }
    return showFeedback(result.message, true);
  }
  closeModal();
  showFeedback("用户删除成功。");
  await loadUsers({ silent: true });
  if (form) {
    setFormLoading(form, false);
  }
}

async function assignCampaign(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearFormFeedback(form);
  setFormLoading(form, true, "分配中...");
  const formData = new FormData(form);
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
    setFormFeedback(form, result.message, true);
    showFeedback(result.message, true);
    setFormLoading(form, false);
    return;
  }

  closeModal();
  showFeedback(`已将 ${payload.account} 分配到试题 ${payload.campaignId}。`);
  setFormLoading(form, false);
}

async function batchAssignCampaigns(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearFormFeedback(form);
  setFormLoading(form, true, "分配中...");
  const formData = new FormData(form);
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
    setFormFeedback(form, result.message, true);
    showFeedback(result.message, true);
    setFormLoading(form, false);
    return;
  }

  form.reset();
  closeModal();
  showFeedback(result.message);
  setFormLoading(form, false);
}

async function createCampaign(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearFormFeedback(form);
  setFormLoading(form, true, "创建中...");
  const formData = new FormData(form);
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
    setFormFeedback(form, result.message, true);
    showFeedback(result.message, true);
    setFormLoading(form, false);
    return;
  }

  form.reset();
  closeModal();
  showFeedback(`招聘试题 ${payload.title} 创建成功。`);
  await loadAdminCampaigns({ silent: true });
  setFormLoading(form, false);
}

async function updateCampaign(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearFormFeedback(form);
  setFormLoading(form, true, "保存中...");
  const formData = new FormData(form);
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
    setFormFeedback(form, result.message, true);
    showFeedback(result.message, true);
    setFormLoading(form, false);
    return;
  }

  closeModal();
  showFeedback(`招聘试题 ${payload.title} 更新成功。`);
  await loadAdminCampaigns({ silent: true });
  setFormLoading(form, false);
}

async function submitQuestion(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearFormFeedback(form);
  setFormLoading(form, true, "创建中...");
  const formData = new FormData(form);
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
    setFormFeedback(form, result.message, true);
    showFeedback(result.message, true);
    setFormLoading(form, false);
    return;
  }

  form.reset();
  form.elements.score.value = "10";
  form.elements.difficulty.value = "3";
  closeModal();
  showFeedback("题目创建成功。");
  await loadQuestions({ silent: true });
  setFormLoading(form, false);
}

async function searchQuestions(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  state.questionFilters = {
    q: String(formData.get("q") || "").trim(),
    type: String(formData.get("type") || "").trim(),
    status: String(formData.get("status") || "").trim()
  };
  state.paginations.questions.page = 1;
  await loadQuestions();
}

async function clearQuestionSearch() {
  document.getElementById("questionSearchForm").reset();
  state.questionFilters = { q: "", type: "", status: "" };
  state.paginations.questions.page = 1;
  await loadQuestions();
}

async function searchSubmissions(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  state.submissionFilters = {
    q: String(formData.get("q") || "").trim(),
    status: String(formData.get("status") || "").trim(),
    campaignId: String(formData.get("campaignId") || "").trim()
  };
  state.paginations.submissions.page = 1;
  await loadSubmissionList();
}

async function clearSubmissionSearch() {
  document.getElementById("submissionSearchForm").reset();
  state.submissionFilters = { q: "", status: "", campaignId: "" };
  state.paginations.submissions.page = 1;
  await loadSubmissionList();
}

async function updateQuestion(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearFormFeedback(form);
  setFormLoading(form, true, "保存中...");
  const formData = new FormData(form);
  const type = String(formData.get("type") || "").trim();
  const questionId = String(formData.get("questionId") || "").trim();
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

  const result = await api(`/api/questions/${questionId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

  if (!result.ok) {
    setFormFeedback(form, result.message, true);
    showFeedback(result.message, true);
    setFormLoading(form, false);
    return;
  }

  closeModal();
  showFeedback("题目更新成功。");
  await loadQuestions({ silent: true });
  setFormLoading(form, false);
}

async function deleteQuestion(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearFormFeedback(form);
  setFormLoading(form, true, "删除中...");
  const questionId = String(new FormData(form).get("questionId") || "").trim();
  await deleteQuestionById(questionId, form);
}

async function deleteQuestionById(questionId, form = null) {
  if (!questionId) {
    if (form) {
      setFormFeedback(form, "请先选择题目。", true);
      setFormLoading(form, false);
    }
    return showFeedback("请先选择题目。", true);
  }
  const result = await api(`/api/questions/${questionId}`, {
    method: "DELETE",
    body: JSON.stringify({})
  });
  if (!result.ok) {
    if (form) {
      setFormFeedback(form, result.message, true);
      setFormLoading(form, false);
    }
    return showFeedback(result.message, true);
  }
  closeModal();
  showFeedback("题目删除成功。");
  await loadQuestions({ silent: true });
  if (form) {
    setFormLoading(form, false);
  }
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
    ["招聘试题", state.currentCampaign.title],
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
    return showFeedback("请先加载招聘试题题目。", true);
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

function renderSubmissionList() {
  const select = document.getElementById("submissionCampaignId");
  const list = document.getElementById("submissionList");
  const pagination = document.getElementById("submissionPagination");
  const campaignOptions = hasAnyRole(["recruiter", "admin"])
    ? [`<option value="">全部招聘试题</option>`, ...state.adminCampaigns.map((item) => `
      <option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} (${escapeHtml(item.status)})</option>
    `)].join("")
    : [`<option value="">全部招聘试题</option>`, ...state.campaigns.map((item) => `
      <option value="${escapeHtml(item.id)}">${escapeHtml(item.title)}</option>
    `)].join("");

  select.innerHTML = campaignOptions;
  select.value = state.submissionFilters.campaignId || "";

  if (state.submissions.length === 0) {
    list.innerHTML = `<div class="question-card"><p>当前没有匹配的提交记录。</p></div>`;
    pagination.innerHTML = "";
    return;
  }

  list.innerHTML = state.submissions.map((item) => `
    <article class="question-card">
      <h3>${escapeHtml(item.candidate_name || item.candidate_account || "提交记录")} · ${escapeHtml(item.campaign_title || "-")}</h3>
      <p>提交 ID：${escapeHtml(item.id)}</p>
      <p>候选人账号：${escapeHtml(item.candidate_account || "-")}</p>
      <p>状态：${escapeHtml(item.status || "-")}</p>
      <p>提交时间：${escapeHtml(formatDateTime(item.submitted_at || item.created_at))}</p>
      <p>总分：${escapeHtml(String(item.total_score ?? 0))} 分</p>
      <div class="button-row">
        <button class="ghost-button" data-view-submission-id="${escapeHtml(item.id)}">查看详情</button>
      </div>
    </article>
  `).join("");

  list.querySelectorAll("[data-view-submission-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      document.getElementById("submissionIdInput").value = button.dataset.viewSubmissionId;
      await loadSubmissionDetail();
    });
  });

  pagination.innerHTML = renderPagination("submissions", state.paginations.submissions);
  bindPagination("submissions", loadSubmissionList);
}

function renderSubmissionMeta(submission) {
  const meta = document.getElementById("submissionMeta");
  meta.innerHTML = renderMetaItems([
    ["提交 ID", submission.id],
    ["试题", submission.campaign_title || submission.campaignId],
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
      <p>题目满分：${escapeHtml(String(item.configured_score ?? "-"))} 分</p>
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
    `<div class="question-card">
      <div class="button-row">
        <button id="aiSuggestButton" type="button" class="ghost-button">AI 建议判分</button>
      </div>
      <p class="hint">如果后端已配置 DeepSeek 兼容接口，系统会自动填充建议分数和评语，最终仍需人工确认后提交。</p>
      <div id="aiSuggestionSummary" class="ai-suggestion-summary hidden"></div>
    </div>`,
    ...subjectiveAnswers.map((item) => `
      <article class="question-card">
        <h3>${escapeHtml(item.stem)}</h3>
        <p>候选人答案：${escapeHtml(item.answer_content)}</p>
        <p>题目满分：${escapeHtml(String(item.configured_score ?? "-"))} 分</p>
        <label>
          <span>主观题分数</span>
          <input name="score:${escapeHtml(item.id)}" type="number" min="0" max="${escapeHtml(String(item.configured_score ?? 100))}" value="${escapeHtml(String(item.subjective_score || 0))}" />
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

  const aiSuggestButton = document.getElementById("aiSuggestButton");
  if (aiSuggestButton) {
    aiSuggestButton.addEventListener("click", () => requestAiSuggestions(submission.id));
  }
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

async function requestAiSuggestions(submissionId) {
  const button = document.getElementById("aiSuggestButton");
  if (button) {
    button.disabled = true;
    button.textContent = "AI 生成中...";
  }

  const result = await api("/api/evaluations/ai-suggestions", {
    method: "POST",
    body: JSON.stringify({ submissionId })
  });

  if (button) {
    button.disabled = false;
    button.textContent = "AI 建议判分";
  }

  if (!result.ok) {
    return showFeedback(result.message, true);
  }

  applyAiSuggestions(result.data.suggestion);
  showFeedback("AI 建议分数已填入表单，请人工复核后再提交。");
}

function applyAiSuggestions(suggestion) {
  if (!suggestion || !Array.isArray(suggestion.answers)) {
    return;
  }

  for (const item of suggestion.answers) {
    const scoreField = document.getElementsByName(`score:${item.submissionAnswerId}`)[0];
    const commentField = document.getElementsByName(`comment:${item.submissionAnswerId}`)[0];
    if (scoreField) {
      scoreField.value = String(item.suggestedScore ?? 0);
    }
    if (commentField) {
      const details = [];
      if (Array.isArray(item.strengths) && item.strengths.length > 0) {
        details.push(`优点：${item.strengths.join("；")}`);
      }
      if (Array.isArray(item.risks) && item.risks.length > 0) {
        details.push(`不足：${item.risks.join("；")}`);
      }
      commentField.value = [item.comment, ...details].filter(Boolean).join("\n");
    }
  }

  const summaryPanel = document.getElementById("aiSuggestionSummary");
  if (summaryPanel) {
    summaryPanel.classList.remove("hidden");
    summaryPanel.innerHTML = [
      suggestion.summary ? `<p><strong>AI 总结：</strong>${escapeHtml(suggestion.summary)}</p>` : "",
      suggestion.recommendation ? `<p><strong>AI 推荐：</strong>${escapeHtml(suggestion.recommendation)}</p>` : ""
    ].filter(Boolean).join("");
  }
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
  if (feedbackTimer) {
    clearTimeout(feedbackTimer);
  }
  if (!isError) {
    feedbackTimer = window.setTimeout(() => {
      feedback.classList.add("hidden");
      feedbackTimer = null;
    }, 3600);
  }
}

function ensureFormFeedback(form) {
  let node = form.querySelector(".form-feedback");
  if (!node) {
    node = document.createElement("div");
    node.className = "form-feedback hidden";
    form.prepend(node);
  }
  return node;
}

function setFormFeedback(form, message, isError = false) {
  if (!form) {
    return;
  }
  const node = ensureFormFeedback(form);
  node.textContent = message;
  node.classList.remove("hidden");
  node.classList.toggle("error", isError);
}

function clearFormFeedback(form) {
  const node = form?.querySelector(".form-feedback");
  if (!node) {
    return;
  }
  node.textContent = "";
  node.classList.add("hidden");
  node.classList.remove("error");
}

function setFormLoading(form, isLoading, pendingText = "提交中...") {
  if (!form) {
    return;
  }
  form.querySelectorAll('button[type="submit"]').forEach((button) => {
    if (isLoading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent || "";
      }
      button.disabled = true;
      button.classList.add("button-loading");
      button.textContent = pendingText;
      return;
    }
    button.disabled = false;
    button.classList.remove("button-loading");
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
    }
  });
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

function syncSelectedQuestionToForm() {
  const form = document.getElementById("updateQuestionForm");
  const select = document.getElementById("updateQuestionId");
  const question = state.questions.find((item) => item.id === select.value) || state.questions[0];
  if (!form || !question) {
    return;
  }

  form.elements.questionId.value = question.id;
  form.elements.type.value = question.type || "single_choice";
  form.elements.status.value = question.status || "draft";
  form.elements.stem.value = question.stem || "";
  form.elements.score.value = String(question.score || 0);
  form.elements.difficulty.value = String(question.difficulty || 3);
  form.elements.options.value = Array.isArray(question.options)
    ? question.options.map((item) => `${item.optionKey}|${item.optionText}`).join("\n")
    : "";
  form.elements.answer.value = normalizeQuestionAnswerForForm(question);
  form.elements.analysis.value = question.analysis || "";
}

function openUserModal(mode) {
  closeModalSections();
  document.getElementById("userModal").classList.remove("hidden");
  document.getElementById("modalOverlay").classList.remove("hidden");
  const title = document.getElementById("userModalTitle");
  const desc = document.getElementById("userModalDesc");
  const mapping = {
    create: ["创建账号", "新建单个用户账号。", "userModalCreate"],
    batchCreate: ["批量导入", "通过文本批量导入用户账号。", "userModalBatchCreate"],
    update: ["编辑账号", "修改用户资料、角色和状态。", "userModalUpdate"],
    resetPassword: ["重置密码", "为指定用户重置登录密码。", "userModalResetPassword"],
    delete: ["删除用户", "删除未被业务数据引用的账号。", "userModalDelete"],
    assignCampaign: ["分配试题", "将单个候选人分配到招聘试题。", "userModalAssignCampaign"],
    batchAssignCampaign: ["批量分配试题", "批量给候选人分配同一招聘试题。", "userModalBatchAssignCampaign"]
  };
  const [nextTitle, nextDesc, sectionId] = mapping[mode];
  title.textContent = nextTitle;
  desc.textContent = nextDesc;
  document.getElementById(sectionId).classList.remove("hidden");
}

function openQuestionModal(mode) {
  closeModalSections();
  document.getElementById("questionModal").classList.remove("hidden");
  document.getElementById("modalOverlay").classList.remove("hidden");
  const title = document.getElementById("questionModalTitle");
  const desc = document.getElementById("questionModalDesc");
  const mapping = {
    create: ["创建题目", "录入新题目并写入题库。", "questionModalCreate"],
    update: ["修改题目", "编辑或删除当前选中的题目。", "questionModalUpdate"]
  };
  const [nextTitle, nextDesc, sectionId] = mapping[mode];
  title.textContent = nextTitle;
  desc.textContent = nextDesc;
  document.getElementById(sectionId).classList.remove("hidden");
}

function openCampaignModal(mode) {
  closeModalSections();
  document.getElementById("campaignModal").classList.remove("hidden");
  document.getElementById("modalOverlay").classList.remove("hidden");
  const title = document.getElementById("campaignModalTitle");
  const desc = document.getElementById("campaignModalDesc");
  const mapping = {
    create: ["新增试题", "创建新的招聘试题并配置监控要求。", "campaignModalCreate"],
    update: ["修改试题", "编辑当前页已检索到的招聘试题。", "campaignModalUpdate"]
  };
  const [nextTitle, nextDesc, sectionId] = mapping[mode];
  title.textContent = nextTitle;
  desc.textContent = nextDesc;
  document.getElementById(sectionId).classList.remove("hidden");
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  closeModalSections();
}

function closeModalSections() {
  document.querySelectorAll("form").forEach((form) => {
    clearFormFeedback(form);
    setFormLoading(form, false);
  });
  document.querySelectorAll(".modal-card, .modal-section").forEach((item) => {
    item.classList.add("hidden");
  });
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

function normalizePaginationState(pagination, fallback) {
  return {
    page: Number(pagination?.page ?? fallback.page ?? 1),
    pageSize: Number(pagination?.pageSize ?? fallback.pageSize ?? 10),
    total: Number(pagination?.total ?? fallback.total ?? 0)
  };
}

function renderPagination(key, pagination) {
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / pagination.pageSize));
  return `
    <div class="pagination-inner">
      <span class="pagination-info">第 ${escapeHtml(String(pagination.page))} / ${escapeHtml(String(totalPages))} 页，共 ${escapeHtml(String(pagination.total))} 条</span>
      <div class="button-row">
        <button class="ghost-button" data-pagination="${escapeHtml(key)}" data-page="${escapeHtml(String(Math.max(1, pagination.page - 1)))}" ${pagination.page <= 1 ? "disabled" : ""}>上一页</button>
        <button class="ghost-button" data-pagination="${escapeHtml(key)}" data-page="${escapeHtml(String(Math.min(totalPages, pagination.page + 1)))}" ${pagination.page >= totalPages ? "disabled" : ""}>下一页</button>
      </div>
    </div>
  `;
}

function bindPagination(key, loader) {
  document.querySelectorAll(`[data-pagination="${key}"]`).forEach((button) => {
    button.addEventListener("click", async () => {
      const nextPage = Number(button.dataset.page || 1);
      if (!Number.isFinite(nextPage)) {
        return;
      }
      state.paginations[key].page = nextPage;
      await loader({ page: nextPage });
    });
  });
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

function normalizeQuestionAnswerForForm(question) {
  if (question.type === "multiple_choice") {
    try {
      const parsed = JSON.parse(question.answer || "[]");
      return Array.isArray(parsed) ? parsed.join(",") : "";
    } catch {
      return "";
    }
  }
  if (question.type === "short_answer" || question.type === "scenario_answer") {
    return "";
  }
  return question.answer || "";
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
