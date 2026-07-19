const state = {
  user: null,
  users: [],
  candidateOptions: [],
  assignCandidateFilter: "",
  selectedAssignCandidates: [],
  questions: [],
  campaigns: [],
  adminCampaigns: [],
  assessments: [],
  assessmentOptions: [],
  assessmentQuestionPool: [],
  currentCampaign: null,
  currentQuestions: [],
  currentSubmission: null,
  activeView: null,
  assessmentDraft: {
    mode: "create",
    assessmentId: "",
    questionSearch: "",
    selectedQuestions: []
  },
  userFilters: {
    q: "",
    role: "",
    status: ""
  },
  assessmentFilters: {
    q: "",
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
    assessments: { page: 1, pageSize: 10, total: 0 },
    campaigns: { page: 1, pageSize: 10, total: 0 },
    submissions: { page: 1, pageSize: 10, total: 0 }
  },
  submissions: [],
  apiBaseUrl: loadApiBaseUrl()
};

const VIEW_ROLES = {
  candidateHome: ["candidate"],
  enterpriseHome: ["interviewer", "recruiter", "admin"],
  assessmentManagement: ["interviewer", "admin"],
  userManagement: ["admin"],
  campaignManagement: ["recruiter", "admin"],
  questionBank: ["interviewer", "admin"],
  assessment: ["candidate"],
  submission: ["candidate", "interviewer", "recruiter", "admin"],
  review: ["interviewer", "recruiter", "admin"]
};

const viewMeta = {
  candidateHome: ["求职者端", "查看你被分配的笔试任务，并进入正式答题流程。"],
  enterpriseHome: ["企业端", "面试官、招聘专员、管理员在同一套企业工作台中使用各自模块。"],
  assessmentManagement: ["试卷模板管理", "面试官或管理员创建试卷模板、选择题目并配置试卷结构。"],
  userManagement: ["用户管理", "管理员创建、批量导入、编辑、禁用账号，并给候选人分配笔试任务。"],
  campaignManagement: ["笔试任务管理", "招聘专员或管理员基于试卷模板创建笔试任务。"],
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
let feedbackTimer = null;

document.querySelectorAll(".menu-item").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

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
document.getElementById("userSearchForm").addEventListener("submit", searchUsers);
document.getElementById("clearUserSearchButton").addEventListener("click", clearUserSearch);
document.getElementById("batchCreateUsersForm").addEventListener("submit", batchCreateUsers);
document.getElementById("updateUserForm").addEventListener("submit", updateUser);
document.getElementById("resetPasswordForm").addEventListener("submit", resetUserPassword);
document.getElementById("deleteUserForm").addEventListener("submit", deleteUser);
document.getElementById("assignCampaignForm").addEventListener("submit", assignCampaign);
document.getElementById("batchAssignCampaignForm").addEventListener("submit", batchAssignCampaigns);
document.getElementById("assignCandidateSearchInput").addEventListener("input", onAssignCandidateSearch);
document.getElementById("selectVisibleCandidatesButton").addEventListener("click", selectVisibleAssignCandidates);
document.getElementById("clearSelectedCandidatesButton").addEventListener("click", clearSelectedAssignCandidates);
document.getElementById("reloadUsersButton").addEventListener("click", () => loadUsers());
document.getElementById("reloadAdminCampaignsButton").addEventListener("click", () => loadAdminCampaigns());
document.getElementById("reloadAssessmentsButton").addEventListener("click", () => loadAssessmentOptions());
document.getElementById("reloadAssessmentManagementButton").addEventListener("click", () => loadAssessments());
document.getElementById("reloadAssessmentQuestionPoolButton").addEventListener("click", () => loadAssessmentQuestionPool());
document.getElementById("reloadCampaignManagementButton").addEventListener("click", () => loadAdminCampaigns());
document.getElementById("createCampaignForm").addEventListener("submit", createCampaign);
document.getElementById("updateCampaignForm").addEventListener("submit", updateCampaign);
document.getElementById("assessmentSearchForm").addEventListener("submit", searchAssessments);
document.getElementById("clearAssessmentSearchButton").addEventListener("click", clearAssessmentSearch);
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
document.getElementById("deleteQuestionId").addEventListener("change", syncDeleteQuestionToForm);
document.getElementById("assessmentTemplateForm").addEventListener("submit", submitAssessmentTemplate);
document.getElementById("assessmentTemplateSelect").addEventListener("change", onAssessmentTemplateSelectChange);
document.getElementById("assessmentQuestionSearchInput").addEventListener("input", onAssessmentQuestionSearch);
document.getElementById("openCreateUserModalButton").addEventListener("click", () => openUserModal("create"));
document.getElementById("openBatchCreateUsersModalButton").addEventListener("click", () => openUserModal("batchCreate"));
document.getElementById("openAssignCampaignModalButton").addEventListener("click", () => openUserModal("assignCampaign"));
document.getElementById("openBatchAssignCampaignModalButton").addEventListener("click", () => openUserModal("batchAssignCampaign"));
document.getElementById("openCreateAssessmentModalButton").addEventListener("click", () => openAssessmentTemplateModal("create"));
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
renderAssessmentManagement();
renderUserManagement();
renderCampaignManagement();
bindPasswordToggles();
loadCurrentUser();

function setAuthenticated(isAuthenticated) {
  authShell.classList.toggle("hidden", isAuthenticated);
  appShell.classList.toggle("hidden", !isAuthenticated);
  if (!isAuthenticated) {
    closeModal();
  }
}

function bindPasswordToggles(root = document) {
  root.querySelectorAll("[data-password-toggle]").forEach((button) => {
    if (button.dataset.boundPasswordToggle === "true") {
      return;
    }
    button.dataset.boundPasswordToggle = "true";
    button.addEventListener("click", () => togglePasswordVisibility(button));
  });
}

function togglePasswordVisibility(button) {
  const field = button.closest(".password-field");
  const input = field?.querySelector("input[type=\"password\"], input[type=\"text\"]");
  if (!input) {
    return;
  }
  const nextType = input.type === "password" ? "text" : "password";
  const isVisible = nextType === "text";
  input.type = nextType;
  button.setAttribute("aria-label", isVisible ? "隐藏密码" : "显示密码");
  button.setAttribute("aria-pressed", String(isVisible));
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
  state.assessmentOptions = [];
  state.assessmentQuestionPool = [];
  state.currentCampaign = null;
  state.currentQuestions = [];
  state.currentSubmission = null;
  state.submissions = [];
  state.activeView = null;
  state.assessmentDraft = {
    mode: "create",
    assessmentId: "",
    questionSearch: "",
    selectedQuestions: []
  };
  state.assessmentFilters = { q: "", status: "" };
  state.campaignFilters = { q: "", status: "" };
  state.submissionFilters = { q: "", status: "", campaignId: "" };
  state.paginations = {
    users: { page: 1, pageSize: 10, total: 0 },
    questions: { page: 1, pageSize: 10, total: 0 },
    assessments: { page: 1, pageSize: 10, total: 0 },
    campaigns: { page: 1, pageSize: 10, total: 0 },
    submissions: { page: 1, pageSize: 10, total: 0 }
  };
  setAuthenticated(false);
  refreshSessionBadge();
  applyNavigation();
  renderCandidateWorkspace();
  renderEnterpriseWorkspace();
  renderQuestionBankList();
  renderAssessmentManagement();
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
    jobs.push(loadAssessments({ silent: true }));
    jobs.push(loadAssessmentQuestionPool({ silent: true }));
  }
  if (hasAnyRole(["admin"])) {
    jobs.push(loadUsers({ silent: true }));
    jobs.push(loadCandidateOptions({ silent: true }));
  }
  if (hasAnyRole(["admin", "recruiter"])) {
    jobs.push(loadAdminCampaigns({ silent: true }));
  }
  if (hasAnyRole(["admin", "recruiter", "interviewer"])) {
    jobs.push(loadAssessmentOptions({ silent: true }));
  }
  if (hasAnyRole(["candidate", "interviewer", "recruiter", "admin"])) {
    jobs.push(loadSubmissionList({ silent: true }));
  }
  await Promise.all(jobs);
  renderCandidateWorkspace();
  renderEnterpriseWorkspace();
  renderAssessmentManagement();
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

async function loadCandidateOptions(options = {}) {
  const search = new URLSearchParams({
    role: "candidate",
    status: "active",
    page: "1",
    pageSize: "100"
  });
  const result = await api(`/api/admin/users?${search.toString()}`);
  if (!result.ok) {
    if (!options.silent) {
      showFeedback(result.message, true);
    }
    return false;
  }

  state.candidateOptions = result.data.items || [];
  renderUserManagement();
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
  const search = new URLSearchParams();
  if (state.assessmentFilters.q) {
    search.set("q", state.assessmentFilters.q);
  }
  if (state.assessmentFilters.status) {
    search.set("status", state.assessmentFilters.status);
  }
  search.set("page", String(options.page || state.paginations.assessments.page));
  search.set("pageSize", String(state.paginations.assessments.pageSize));
  const result = await api(`/api/admin/assessments?${search.toString()}`);
  if (!result.ok) {
    if (!options.silent) {
      showFeedback(result.message, true);
    }
    return false;
  }

  state.assessments = result.data.items;
  state.paginations.assessments = normalizePaginationState(result.data.pagination, state.paginations.assessments);
  renderAssessmentManagement();
  return true;
}

async function loadAssessmentOptions(options = {}) {
  const search = new URLSearchParams({
    page: "1",
    pageSize: "100"
  });
  const result = await api(`/api/admin/assessments?${search.toString()}`);
  if (!result.ok) {
    if (!options.silent) {
      showFeedback(result.message, true);
    }
    return false;
  }

  state.assessmentOptions = result.data.items;
  renderCampaignManagement();
  syncAssessmentTemplateSelect();
  return true;
}

async function loadAssessmentQuestionPool(options = {}) {
  const search = new URLSearchParams({
    status: "published",
    page: "1",
    pageSize: "100"
  });
  const result = await api(`/api/questions?${search.toString()}`);
  if (!result.ok) {
    if (!options.silent) {
      showFeedback(result.message, true);
    }
    return false;
  }

  state.assessmentQuestionPool = result.data.items;
  renderAssessmentQuestionPool();
  return true;
}

function renderCandidateWorkspace() {
  const summary = document.getElementById("candidateSummary");
  const list = document.getElementById("candidateCampaignList");

  summary.innerHTML = renderMetaItems([
    ["当前端", "求职者端"],
    ["我的笔试任务", state.campaigns.length],
    ["最近提交", state.currentSubmission?.submission?.id || state.currentSubmission?.id || "暂无"]
  ]);

  if (state.campaigns.length === 0) {
    list.innerHTML = `<article class="card"><h3>暂无测评</h3><p>当前没有分配给你的笔试任务。</p></article>`;
    return;
  }

  list.innerHTML = state.campaigns.map((item) => `
    <article class="card">
      <h3>${escapeHtml(item.title)}</h3>
      <p>任务 ID：${escapeHtml(item.id)}</p>
      <p>目标岗位：${escapeHtml(item.target_role || "-")}</p>
      <p>邀请状态：${escapeHtml(formatInvitationStatus(item.invitation_status || "-"))}</p>
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

  if (hasAnyRole(["admin"])) {
    cards.push(`
      <article class="card">
        <h3>用户管理</h3>
        <p>管理员创建、批量导入、编辑、禁用账号，并给候选人分配笔试任务。</p>
        <div class="button-row">
          <button class="ghost-button" data-nav-view="userManagement">进入用户管理</button>
        </div>
      </article>
    `);
  }

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

  if (hasAnyRole(["interviewer", "admin"])) {
    cards.push(`
      <article class="card">
        <h3>试卷模板管理</h3>
        <p>从题库中组装试卷模板，配置分组、顺序和分值，供笔试任务直接复用。</p>
        <div class="button-row">
          <button class="ghost-button" data-nav-view="assessmentManagement">进入模板管理</button>
        </div>
      </article>
    `);
  }

  if (hasAnyRole(["recruiter", "admin"])) {
    cards.push(`
      <article class="card">
        <h3>笔试任务管理</h3>
        <p>基于试卷模板创建笔试任务，并查看当前可管理任务列表。</p>
        <div class="button-row">
          <button class="ghost-button" data-nav-view="campaignManagement">进入任务管理</button>
        </div>
      </article>
    `);
  }

  if (hasAnyRole(["interviewer", "recruiter", "admin"])) {
    cards.push(`
      <article class="card">
        <h3>结果查看</h3>
        <p>通过提交详情查看候选人作答、评分结果和当前笔试状态。</p>
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
    ? `<option value="">当前没有可分配笔试任务</option>`
    : state.adminCampaigns.map((item) => `
      <option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} (${escapeHtml(item.id)})</option>
    `).join("");
  updateUserSelect.innerHTML = userOptions || `<option value="">当前没有用户</option>`;
  resetPasswordUserSelect.innerHTML = userOptions || `<option value="">当前没有用户</option>`;
  deleteUserSelect.innerHTML = userOptions || `<option value="">当前没有用户</option>`;
  assignCampaignSelect.innerHTML = campaignOptions;
  batchAssignCampaignSelect.innerHTML = campaignOptions;
  syncSelectedUserToForm();
  renderAssignCandidatePicker();

  summary.innerHTML = renderMetaItems([
    ["当前页用户数", state.users.length],
    ["用户总数", state.paginations.users.total],
    ["可分配笔试任务数", state.adminCampaigns.length],
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
      <div class="card-header-actions">
        <h3>${escapeHtml(item.fullName)} · ${escapeHtml(item.account)}</h3>
        <div class="button-row compact-actions">
          <button class="ghost-button" data-edit-user-id="${escapeHtml(item.id)}">编辑</button>
          <button class="ghost-button" data-reset-user-id="${escapeHtml(item.id)}">重置密码</button>
          <button class="danger-button" data-delete-user-id="${escapeHtml(item.id)}">删除</button>
        </div>
      </div>
      <p>角色：${escapeHtml(formatRoleNames(item.roles))}</p>
      <p>状态：${escapeHtml(formatUserStatus(item.status))}</p>
      <p>邮箱：${escapeHtml(item.email || "-")}</p>
      <p>手机号：${escapeHtml(item.mobile || "-")}</p>
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

  const assessmentOptions = state.assessmentOptions.length === 0
    ? `<option value="">当前没有可用试卷模板</option>`
    : state.assessmentOptions.map((item) => `
      <option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} (${escapeHtml(formatQuestionStatus(item.status))})</option>
    `).join("");
  const campaignOptions = state.adminCampaigns.length === 0
    ? `<option value="">当前没有笔试任务</option>`
    : state.adminCampaigns.map((item) => `
      <option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} (${escapeHtml(formatCampaignStatus(item.status))})</option>
    `).join("");

  createAssessmentSelect.innerHTML = assessmentOptions;
  updateAssessmentSelect.innerHTML = assessmentOptions;
  updateCampaignSelect.innerHTML = campaignOptions;
  syncSelectedCampaignToForm();

  summary.innerHTML = renderMetaItems([
    ["试卷模板数", state.assessmentOptions.length],
    ["当前页任务数", state.adminCampaigns.length],
    ["任务总数", state.paginations.campaigns.total],
    ["已发布任务", state.adminCampaigns.filter((item) => item.status === "published").length]
  ]);

  if (state.adminCampaigns.length === 0) {
    list.innerHTML = `<div class="question-card"><p>当前还没有笔试任务。</p></div>`;
    pagination.innerHTML = "";
    return;
  }

  list.innerHTML = state.adminCampaigns.map((item) => `
    <article class="question-card">
      <h3>${escapeHtml(item.title)}</h3>
      <p>任务 ID：${escapeHtml(item.id)}</p>
      <p>试卷模板：${escapeHtml(item.assessment_title || "-")}</p>
      <p>状态：${escapeHtml(formatCampaignStatus(item.status))}</p>
      <p>目标岗位：${escapeHtml(item.target_role || "-")}</p>
      <p>时长：${escapeHtml(String(item.duration_minutes || "-"))} 分钟</p>
      <p>开始：${escapeHtml(formatDateTime(item.start_time))}</p>
      <p>结束：${escapeHtml(formatDateTime(item.end_time))}</p>
      <div class="button-row">
        <button class="ghost-button" data-edit-campaign-id="${escapeHtml(item.id)}">编辑任务</button>
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

function renderAssessmentManagement() {
  const summary = document.getElementById("assessmentManagementSummary");
  const list = document.getElementById("assessmentManagementList");
  const pagination = document.getElementById("assessmentPagination");

  summary.innerHTML = renderMetaItems([
    ["当前页模板数", state.assessments.length],
    ["模板总数", state.paginations.assessments.total],
    ["已发布试卷模板", state.assessments.filter((item) => item.status === "published").length],
    ["可选题目数", state.assessmentQuestionPool.length]
  ]);

  if (state.assessments.length === 0) {
    list.innerHTML = `<div class="question-card"><p>当前还没有试卷模板。</p></div>`;
    pagination.innerHTML = "";
    return;
  }

  list.innerHTML = state.assessments.map((item) => `
    <article class="question-card">
      <h3>${escapeHtml(item.title)}</h3>
      <p>试卷模板 ID：${escapeHtml(item.id)}</p>
      <p>状态：${escapeHtml(formatQuestionStatus(item.status))}</p>
      <p>目标级别：${escapeHtml(formatTargetLevel(item.target_level))}</p>
      <p>题目数量：${escapeHtml(String(item.question_count || 0))} 道</p>
      <p>试卷总分：${escapeHtml(String(item.total_score || 0))} 分</p>
      <p>说明：${escapeHtml(item.description || "-")}</p>
      <div class="button-row">
        <button class="ghost-button" data-edit-assessment-id="${escapeHtml(item.id)}">编辑试卷模板</button>
      </div>
    </article>
  `).join("");

  list.querySelectorAll("[data-edit-assessment-id]").forEach((button) => {
    button.addEventListener("click", () => {
      openAssessmentTemplateModal("update", button.dataset.editAssessmentId || "");
    });
  });

  pagination.innerHTML = renderPagination("assessments", state.paginations.assessments);
  bindPagination("assessments", loadAssessments);
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
  syncDeleteQuestionToForm();

  if (state.questions.length === 0) {
    container.innerHTML = `<div class="question-card"><p>当前还没有题目。</p></div>`;
    pagination.innerHTML = "";
    return;
  }

  container.innerHTML = state.questions.map((item) => `
    <article class="question-card">
      <h3>${escapeHtml(item.stem)}</h3>
      <p>题型：${escapeHtml(formatQuestionType(item.type))}</p>
      <p>分值：${escapeHtml(String(item.score))} 分</p>
      <p>难度：${escapeHtml(String(item.difficulty))}</p>
      <p>状态：${escapeHtml(formatQuestionStatus(item.status))}</p>
      <div class="button-row">
        <button class="ghost-button" data-edit-question-id="${escapeHtml(item.id)}">编辑</button>
        <button class="danger-button" data-delete-question-id="${escapeHtml(item.id)}">删除</button>
      </div>
    </article>
  `).join("");

  container.querySelectorAll("[data-edit-question-id]").forEach((button) => {
    button.addEventListener("click", () => {
      openQuestionModal("update", button.dataset.editQuestionId || "");
    });
  });
  container.querySelectorAll("[data-delete-question-id]").forEach((button) => {
    button.addEventListener("click", () => {
      openQuestionModal("delete", button.dataset.deleteQuestionId || "");
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

async function searchAssessments(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  state.assessmentFilters = {
    q: String(formData.get("q") || "").trim(),
    status: String(formData.get("status") || "").trim()
  };
  state.paginations.assessments.page = 1;
  await loadAssessments();
}

async function clearAssessmentSearch() {
  document.getElementById("assessmentSearchForm").reset();
  state.assessmentFilters = { q: "", status: "" };
  state.paginations.assessments.page = 1;
  await loadAssessments();
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
  await Promise.all([
    loadUsers({ silent: true }),
    loadCandidateOptions({ silent: true })
  ]);
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
  await Promise.all([
    loadUsers({ silent: true }),
    loadCandidateOptions({ silent: true })
  ]);
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
  await Promise.all([
    loadUsers({ silent: true }),
    loadCandidateOptions({ silent: true })
  ]);
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
    if (result.status === 409 && result.data?.recommendedAction === "disable") {
      return disableUserWithHistory(userId, form, result.message);
    }
    if (form) {
      setFormFeedback(form, result.message, true);
      setFormLoading(form, false);
    }
    return showFeedback(result.message, true);
  }
  closeModal();
  showFeedback("用户删除成功。");
  await Promise.all([
    loadUsers({ silent: true }),
    loadCandidateOptions({ silent: true })
  ]);
  if (form) {
    setFormLoading(form, false);
  }
}

async function disableUserWithHistory(userId, form = null, fallbackMessage = "") {
  const user = state.users.find((item) => item.id === userId);
  if (!user) {
    const message = fallbackMessage || "该账号已有历史记录，建议改为禁用。";
    if (form) {
      setFormFeedback(form, message, true);
      setFormLoading(form, false);
    }
    return showFeedback(message, true);
  }

  if (user.status === "disabled") {
    const message = "禁用账号不支持删除。";
    if (form) {
      setFormFeedback(form, message);
      setFormLoading(form, false);
      return;
    }
    showFeedback(message);
    return;
  }

  const payload = {
    fullName: user.fullName || "",
    role: Array.isArray(user.roles) && user.roles[0] ? user.roles[0] : "candidate",
    status: "disabled",
    email: user.email || "",
    mobile: user.mobile || ""
  };

  const result = await api(`/api/admin/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

  if (!result.ok) {
    const message = result.message || fallbackMessage || "账号禁用失败，请稍后重试。";
    if (form) {
      setFormFeedback(form, message, true);
      setFormLoading(form, false);
    }
    return showFeedback(message, true);
  }

  closeModal();
  showFeedback("该账号已有笔试分配或提交记录，系统已自动改为禁用状态，历史数据已保留。");
  await Promise.all([
    loadUsers({ silent: true }),
    loadCandidateOptions({ silent: true })
  ]);
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
  const accounts = state.selectedAssignCandidates.slice();
  const campaignId = String(formData.get("campaignId") || "").trim();
  const attemptLimit = Number(formData.get("attemptLimit") || 1);
  const invitationStatus = String(formData.get("invitationStatus") || "invited").trim();

  if (accounts.length === 0) {
    setFormFeedback(form, "请至少选择一个候选人。", true);
    showFeedback("请至少选择一个候选人。", true);
    setFormLoading(form, false);
    return;
  }

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
  resetAssignCandidatePicker();
  closeModal();
  showFeedback(`已为 ${accounts.length} 个候选人分配笔试任务。`);
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
  showFeedback(`笔试任务 ${payload.title} 创建成功。`);
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
  showFeedback(`笔试任务 ${payload.title} 更新成功。`);
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
    return showFeedback("请先输入笔试任务 ID。", true);
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
    ["笔试任务", state.currentCampaign.title],
    ["试卷模板", state.currentCampaign.assessmentTitle],
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
    return showFeedback("请先加载笔试任务题目。", true);
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
    ? [`<option value="">全部笔试任务</option>`, ...state.adminCampaigns.map((item) => `
      <option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} (${escapeHtml(formatCampaignStatus(item.status))})</option>
    `)].join("")
    : [`<option value="">全部笔试任务</option>`, ...state.campaigns.map((item) => `
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
      <p>状态：${escapeHtml(formatSubmissionStatus(item.status || "-"))}</p>
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
    ["笔试任务", submission.campaign_title || submission.campaignId],
    ["状态", formatSubmissionStatus(submission.status)],
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
        <button id="aiSuggestButton" type="button" class="ghost-button">AI 生成建议</button>
        <button id="applyAllAiSuggestionsButton" type="button" class="ghost-button hidden">一键采纳 AI 建议</button>
      </div>
      <p class="hint">AI 只生成主观题建议分数与评语，不会直接写入最终成绩。请人工审核、修订后再提交。</p>
      <div id="aiSuggestionSummary" class="ai-suggestion-summary hidden"></div>
    </div>`,
    ...subjectiveAnswers.map((item) => `
      <article class="question-card evaluation-card">
        <h3>${escapeHtml(item.stem)}</h3>
        <p>候选人答案：${escapeHtml(item.answer_content)}</p>
        <p>题目满分：${escapeHtml(String(item.configured_score ?? "-"))} 分</p>
        <div class="evaluation-columns">
          <section class="evaluation-panel ai-panel">
            <div class="evaluation-panel-header">
              <h4>AI 建议分数</h4>
              <button type="button" class="ghost-button hidden" data-apply-ai-answer="${escapeHtml(item.id)}">采纳 AI 建议</button>
            </div>
            <div id="aiSuggestionCard:${escapeHtml(item.id)}" class="ai-suggestion-card ai-suggestion-empty">
              <p>尚未生成 AI 建议。</p>
            </div>
          </section>
          <section class="evaluation-panel final-panel">
            <h4>人工最终结果</h4>
            <label>
              <span>最终分数</span>
              <input name="score:${escapeHtml(item.id)}" type="number" min="0" max="${escapeHtml(String(item.configured_score ?? 100))}" value="${escapeHtml(String(item.subjective_score || 0))}" />
            </label>
            <label>
              <span>最终评语</span>
              <textarea name="comment:${escapeHtml(item.id)}">${escapeHtml(item.reviewer_comment || "")}</textarea>
            </label>
          </section>
        </div>
      </article>
    `),
    `<label>
      <span>推荐结论</span>
      <input name="recommendation" value="${escapeHtml(submission.recommendation || "hold")}" />
    </label>`,
    `<button type="submit" class="primary-button">确认并提交最终成绩</button>`
  ].join("");

  const aiSuggestButton = document.getElementById("aiSuggestButton");
  if (aiSuggestButton) {
    aiSuggestButton.addEventListener("click", () => requestAiSuggestions(submission.id));
  }
  const applyAllButton = document.getElementById("applyAllAiSuggestionsButton");
  if (applyAllButton) {
    applyAllButton.addEventListener("click", applyAllAiSuggestions);
  }
  form.querySelectorAll("[data-apply-ai-answer]").forEach((button) => {
    button.addEventListener("click", () => applySingleAiSuggestion(button.dataset.applyAiAnswer));
  });
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
    button.textContent = "AI 生成建议";
  }

  if (!result.ok) {
    return showFeedback(result.message, true);
  }

  applyAiSuggestions(result.data.suggestion);
  showFeedback("AI 建议已生成，请人工审核后决定是否采纳。");
}

function applyAiSuggestions(suggestion) {
  if (!suggestion || !Array.isArray(suggestion.answers)) {
    return;
  }

  for (const item of suggestion.answers) {
    const card = document.getElementById(`aiSuggestionCard:${item.submissionAnswerId}`);
    const applyButton = document.querySelector(`[data-apply-ai-answer="${CSS.escape(item.submissionAnswerId)}"]`);
    if (card) {
      const details = [];
      if (Array.isArray(item.strengths) && item.strengths.length > 0) {
        details.push(`<p><strong>优点：</strong>${escapeHtml(item.strengths.join("；"))}</p>`);
      }
      if (Array.isArray(item.risks) && item.risks.length > 0) {
        details.push(`<p><strong>不足：</strong>${escapeHtml(item.risks.join("；"))}</p>`);
      }
      card.classList.remove("ai-suggestion-empty");
      card.dataset.suggestedScore = String(item.suggestedScore ?? 0);
      card.dataset.suggestedComment = buildAiSuggestionComment(item);
      card.innerHTML = [
        `<p><strong>建议分数：</strong>${escapeHtml(String(item.suggestedScore ?? 0))} / ${escapeHtml(String(item.maxScore ?? ""))}</p>`,
        item.comment ? `<p><strong>建议评语：</strong>${escapeHtml(item.comment)}</p>` : "",
        ...details
      ].join("");
    }
    if (applyButton) {
      applyButton.classList.remove("hidden");
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
  const applyAllButton = document.getElementById("applyAllAiSuggestionsButton");
  if (applyAllButton) {
    applyAllButton.classList.remove("hidden");
  }
}

function buildAiSuggestionComment(item) {
  const details = [];
  if (Array.isArray(item.strengths) && item.strengths.length > 0) {
    details.push(`优点：${item.strengths.join("；")}`);
  }
  if (Array.isArray(item.risks) && item.risks.length > 0) {
    details.push(`不足：${item.risks.join("；")}`);
  }
  return [item.comment, ...details].filter(Boolean).join("\n");
}

function applySingleAiSuggestion(submissionAnswerId) {
  const card = document.getElementById(`aiSuggestionCard:${submissionAnswerId}`);
  if (!card) {
    return;
  }
  const scoreField = document.getElementsByName(`score:${submissionAnswerId}`)[0];
  const commentField = document.getElementsByName(`comment:${submissionAnswerId}`)[0];
  if (scoreField && typeof card.dataset.suggestedScore === "string") {
    scoreField.value = card.dataset.suggestedScore;
  }
  if (commentField && typeof card.dataset.suggestedComment === "string") {
    commentField.value = card.dataset.suggestedComment;
  }
}

function applyAllAiSuggestions() {
  document.querySelectorAll("[data-apply-ai-answer]").forEach((button) => {
    if (!button.classList.contains("hidden")) {
      applySingleAiSuggestion(button.dataset.applyAiAnswer);
    }
  });
  showFeedback("已将 AI 建议填入人工最终结果，请继续复核后提交。");
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
    status: 500,
    text: async () => JSON.stringify({ message: error.message || "网络请求失败" })
  }));

  const rawText = await response.text().catch(() => "");
  let data = {};
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { message: rawText.trim() };
    }
  }

  const fallbackMessage = rawText.trim() || `请求失败（HTTP ${response.status || 500}）`;
  return {
    ok: response.ok,
    status: response.status || 500,
    message: data.message || fallbackMessage,
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

function formatQuestionType(type) {
  return {
    single_choice: "单选题",
    multiple_choice: "多选题",
    true_false: "判断题",
    fill_blank: "填空题",
    short_answer: "简答题",
    scenario_answer: "场景分析题"
  }[type] || type;
}

function formatQuestionStatus(status) {
  return {
    draft: "草稿",
    published: "已发布",
    archived: "已归档"
  }[status] || status;
}

function formatUserStatus(status) {
  return {
    active: "正常",
    disabled: "禁用",
    locked: "锁定"
  }[status] || status;
}

function formatCampaignStatus(status) {
  return {
    draft: "草稿",
    published: "已发布",
    in_progress: "进行中",
    archived: "已归档"
  }[status] || status;
}

function formatSubmissionStatus(status) {
  return {
    submitted: "已提交",
    reviewed: "已评阅",
    grading: "评阅中",
    graded: "已评分",
    in_progress: "进行中"
  }[status] || status;
}

function formatInvitationStatus(status) {
  return {
    invited: "已邀请",
    completed: "已完成"
  }[status] || status;
}

function formatTargetLevel(level) {
  return {
    junior: "初级",
    mid: "中级",
    senior: "高级"
  }[level] || level || "不限";
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

function syncDeleteQuestionToForm() {
  const form = document.getElementById("deleteQuestionForm");
  const select = document.getElementById("deleteQuestionId");
  const summary = document.getElementById("deleteQuestionSummary");
  const question = state.questions.find((item) => item.id === select.value) || state.questions[0];
  if (!form || !summary) {
    return;
  }
  if (!question) {
    summary.innerHTML = "<p>当前没有可删除题目。</p>";
    return;
  }

  form.elements.questionId.value = question.id;
  summary.innerHTML = `
    <h4>${escapeHtml(question.stem || "未命名题目")}</h4>
    <p>题型：${escapeHtml(formatQuestionType(question.type))}</p>
    <p>分值：${escapeHtml(String(question.score || 0))} 分</p>
    <p>状态：${escapeHtml(formatQuestionStatus(question.status || "-"))}</p>
  `;
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
    delete: ["删除账号", "没有历史记录时直接删除；已有历史记录时自动改为禁用并保留数据。", "userModalDelete"],
    assignCampaign: ["分配笔试任务", "将一个或多个候选人分配到笔试任务。", "userModalAssignCampaign"],
    batchAssignCampaign: ["批量分配笔试任务", "批量给候选人分配同一笔试任务。", "userModalBatchAssignCampaign"]
  };
  const [nextTitle, nextDesc, sectionId] = mapping[mode];
  title.textContent = nextTitle;
  desc.textContent = nextDesc;
  document.getElementById(sectionId).classList.remove("hidden");
  if (mode === "assignCampaign") {
    resetAssignCandidatePicker();
  }
}

function onAssignCandidateSearch(event) {
  state.assignCandidateFilter = event.currentTarget.value.trim();
  renderAssignCandidatePicker();
}

function getFilteredAssignCandidates() {
  const keyword = state.assignCandidateFilter.trim().toLowerCase();
  if (!keyword) {
    return state.candidateOptions;
  }

  return state.candidateOptions.filter((item) => {
    const haystack = [
      item.fullName,
      item.account,
      item.email,
      item.mobile
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(keyword);
  });
}

function renderAssignCandidatePicker() {
  const selectedWrap = document.getElementById("assignCandidateSelectedList");
  const listWrap = document.getElementById("assignCandidateOptionList");
  const countNode = document.getElementById("assignCandidateSelectedCount");
  if (!selectedWrap || !listWrap || !countNode) {
    return;
  }

  const visibleCandidates = getFilteredAssignCandidates();
  const selectedCandidates = state.candidateOptions.filter((item) => state.selectedAssignCandidates.includes(item.account));
  countNode.textContent = `已选 ${selectedCandidates.length} 人`;

  if (selectedCandidates.length === 0) {
    selectedWrap.innerHTML = `<span class="picker-empty-text">暂未选择候选人</span>`;
  } else {
    selectedWrap.innerHTML = selectedCandidates.map((item) => `
      <button type="button" class="picker-chip" data-remove-assign-candidate="${escapeHtml(item.account)}">
        <span>${escapeHtml(item.fullName || item.account)}</span>
        <span class="picker-chip-meta">${escapeHtml(item.account)}</span>
      </button>
    `).join("");

    selectedWrap.querySelectorAll("[data-remove-assign-candidate]").forEach((button) => {
      button.addEventListener("click", () => toggleAssignCandidate(button.dataset.removeAssignCandidate, false));
    });
  }

  if (visibleCandidates.length === 0) {
    listWrap.innerHTML = `<div class="picker-empty">没有匹配的候选人，请更换搜索条件。</div>`;
    return;
  }

  listWrap.innerHTML = visibleCandidates.map((item) => {
    const checked = state.selectedAssignCandidates.includes(item.account);
    return `
      <label class="candidate-picker-option">
        <input type="checkbox" data-assign-candidate-account="${escapeHtml(item.account)}" ${checked ? "checked" : ""} />
        <div class="candidate-picker-body">
          <div class="candidate-picker-main">
            <strong>${escapeHtml(item.fullName || item.account)}</strong>
            <span class="candidate-picker-account">${escapeHtml(item.account)}</span>
          </div>
          <div class="candidate-picker-meta">
            <span>邮箱：${escapeHtml(item.email || "-")}</span>
            <span>手机号：${escapeHtml(item.mobile || "-")}</span>
          </div>
        </div>
      </label>
    `;
  }).join("");

  listWrap.querySelectorAll("[data-assign-candidate-account]").forEach((input) => {
    input.addEventListener("change", (event) => {
      toggleAssignCandidate(event.currentTarget.dataset.assignCandidateAccount, event.currentTarget.checked);
    });
  });
}

function toggleAssignCandidate(account, checked) {
  const nextSelected = new Set(state.selectedAssignCandidates);
  if (checked) {
    nextSelected.add(account);
  } else {
    nextSelected.delete(account);
  }
  state.selectedAssignCandidates = Array.from(nextSelected);
  renderAssignCandidatePicker();
}

function selectVisibleAssignCandidates() {
  const nextSelected = new Set(state.selectedAssignCandidates);
  getFilteredAssignCandidates().forEach((item) => nextSelected.add(item.account));
  state.selectedAssignCandidates = Array.from(nextSelected);
  renderAssignCandidatePicker();
}

function clearSelectedAssignCandidates() {
  state.selectedAssignCandidates = [];
  renderAssignCandidatePicker();
}

function resetAssignCandidatePicker() {
  state.assignCandidateFilter = "";
  state.selectedAssignCandidates = [];
  const searchInput = document.getElementById("assignCandidateSearchInput");
  if (searchInput) {
    searchInput.value = "";
  }
  renderAssignCandidatePicker();
}

function openQuestionModal(mode, questionId = "") {
  closeModalSections();
  document.getElementById("questionModal").classList.remove("hidden");
  document.getElementById("modalOverlay").classList.remove("hidden");
  const title = document.getElementById("questionModalTitle");
  const desc = document.getElementById("questionModalDesc");
  const mapping = {
    create: ["创建题目", "录入新题目并写入题库。", "questionModalCreate"],
    update: ["修改题目", "编辑当前题目内容。", "questionModalUpdate"],
    delete: ["删除题目", "确认删除当前题目。", "questionModalDelete"]
  };
  const [nextTitle, nextDesc, sectionId] = mapping[mode];
  title.textContent = nextTitle;
  desc.textContent = nextDesc;
  document.getElementById(sectionId).classList.remove("hidden");

  if (mode === "update") {
    const selectWrap = document.getElementById("updateQuestionSelectWrap");
    const select = document.getElementById("updateQuestionId");
    if (questionId) {
      select.value = questionId;
      selectWrap.classList.add("hidden");
    } else {
      selectWrap.classList.remove("hidden");
    }
    syncSelectedQuestionToForm();
  }

  if (mode === "delete") {
    const selectWrap = document.getElementById("deleteQuestionSelectWrap");
    const select = document.getElementById("deleteQuestionId");
    if (questionId) {
      select.value = questionId;
      selectWrap.classList.add("hidden");
    } else {
      selectWrap.classList.remove("hidden");
    }
    syncDeleteQuestionToForm();
  }
}

async function openAssessmentTemplateModal(mode, assessmentId = "") {
  if (state.assessmentOptions.length === 0) {
    await loadAssessmentOptions({ silent: true });
  }
  if (state.assessmentQuestionPool.length === 0) {
    await loadAssessmentQuestionPool({ silent: true });
  }

  closeModalSections();
  document.getElementById("assessmentTemplateModal").classList.remove("hidden");
  document.getElementById("modalOverlay").classList.remove("hidden");

  const title = document.getElementById("assessmentTemplateModalTitle");
  const desc = document.getElementById("assessmentTemplateModalDesc");
  const form = document.getElementById("assessmentTemplateForm");
  const selectWrap = document.getElementById("assessmentTemplateSelectWrap");
  const submitButton = document.getElementById("assessmentTemplateSubmitButton");

  state.assessmentDraft.mode = mode;
  state.assessmentDraft.assessmentId = assessmentId || "";
  state.assessmentDraft.questionSearch = "";
  state.assessmentDraft.selectedQuestions = [];
  form.reset();
  form.elements.mode.value = mode;
  form.elements.assessmentId.value = assessmentId || "";
  document.getElementById("assessmentQuestionSearchInput").value = "";

  if (mode === "create") {
    title.textContent = "新增试卷模板";
    desc.textContent = "创建新的试卷模板，并从已发布题目中选择题目。";
    submitButton.textContent = "创建试卷模板";
    selectWrap.classList.add("hidden");
    form.elements.status.value = "draft";
    updateAssessmentTotalScore();
    renderAssessmentQuestionPool();
    renderSelectedAssessmentQuestions();
    return;
  }

  title.textContent = "修改试卷模板";
  desc.textContent = "修改试卷模板信息、题目结构和每题分值。";
  submitButton.textContent = "保存模板修改";
  selectWrap.classList.remove("hidden");
  syncAssessmentTemplateSelect();

  const nextId = assessmentId || state.assessmentOptions[0]?.id || "";
  form.elements.assessmentSelect.value = nextId;
  form.elements.assessmentId.value = nextId;
  state.assessmentDraft.assessmentId = nextId;
  if (nextId) {
    await loadAssessmentTemplateDetail(nextId);
  } else {
    renderAssessmentQuestionPool();
    renderSelectedAssessmentQuestions();
  }
}

function openCampaignModal(mode) {
  closeModalSections();
  document.getElementById("campaignModal").classList.remove("hidden");
  document.getElementById("modalOverlay").classList.remove("hidden");
  const title = document.getElementById("campaignModalTitle");
  const desc = document.getElementById("campaignModalDesc");
  const mapping = {
    create: ["新增笔试任务", "创建新的笔试任务并配置监控要求。", "campaignModalCreate"],
    update: ["修改笔试任务", "编辑当前页已检索到的笔试任务。", "campaignModalUpdate"]
  };
  const [nextTitle, nextDesc, sectionId] = mapping[mode];
  title.textContent = nextTitle;
  desc.textContent = nextDesc;
  document.getElementById(sectionId).classList.remove("hidden");
}

function syncAssessmentTemplateSelect() {
  const select = document.getElementById("assessmentTemplateSelect");
  if (!select) {
    return;
  }
  select.innerHTML = state.assessmentOptions.length === 0
    ? `<option value="">当前没有可选试卷模板</option>`
    : state.assessmentOptions.map((item) => `
      <option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} (${escapeHtml(item.status)})</option>
    `).join("");
}

async function onAssessmentTemplateSelectChange(event) {
  const assessmentId = String(event.currentTarget.value || "").trim();
  if (!assessmentId) {
    return;
  }
  await loadAssessmentTemplateDetail(assessmentId);
}

function onAssessmentQuestionSearch(event) {
  state.assessmentDraft.questionSearch = String(event.currentTarget.value || "").trim().toLowerCase();
  renderAssessmentQuestionPool();
}

async function loadAssessmentTemplateDetail(assessmentId) {
  const result = await api(`/api/admin/assessments/${assessmentId}`);
  if (!result.ok) {
    showFeedback(result.message, true);
    return false;
  }

  fillAssessmentTemplateForm(result.data.assessment, result.data.questions || []);
  return true;
}

function fillAssessmentTemplateForm(assessment, questions) {
  const form = document.getElementById("assessmentTemplateForm");
  form.elements.assessmentId.value = assessment.id;
  form.elements.title.value = assessment.title || "";
  form.elements.targetLevel.value = assessment.target_level || "";
  form.elements.status.value = assessment.status || "draft";
  form.elements.description.value = assessment.description || "";
  state.assessmentDraft.assessmentId = assessment.id;
  state.assessmentDraft.selectedQuestions = questions.map((item) => ({
    questionId: item.question_id,
    stem: item.stem,
    type: item.type,
    difficulty: item.difficulty,
    sectionName: item.section_name || "",
    sortOrder: Number(item.sort_order || 0),
    score: Number(item.score || 0)
  }));
  updateAssessmentTotalScore();
  renderAssessmentQuestionPool();
  renderSelectedAssessmentQuestions();
}

function renderAssessmentQuestionPool() {
  const container = document.getElementById("assessmentQuestionPoolList");
  const selectedIds = new Set(state.assessmentDraft.selectedQuestions.map((item) => item.questionId));
  const keyword = state.assessmentDraft.questionSearch;
  const items = state.assessmentQuestionPool.filter((item) => {
    if (!keyword) {
      return true;
    }
    return `${item.stem || ""} ${item.type || ""}`.toLowerCase().includes(keyword);
  });

  if (items.length === 0) {
    container.innerHTML = `<div class="template-empty">当前没有可选题目，请先在题库中发布题目。</div>`;
    return;
  }

  container.innerHTML = items.map((item) => {
    const selected = selectedIds.has(item.id);
    return `
      <article class="template-pool-card">
        <h4>${escapeHtml(item.stem)}</h4>
        <p>题型：${escapeHtml(formatQuestionType(item.type))}</p>
        <p>建议分值：${escapeHtml(String(item.score || 0))} 分</p>
        <p>难度：${escapeHtml(String(item.difficulty || "-"))}</p>
        <div class="button-row">
          <button type="button" class="${selected ? "danger-button" : "ghost-button"}" data-pool-question-id="${escapeHtml(item.id)}" data-action="${selected ? "remove" : "add"}">
            ${selected ? "移除" : "加入试卷"}
          </button>
        </div>
      </article>
    `;
  }).join("");

  container.querySelectorAll("[data-pool-question-id]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.action === "remove") {
        removeAssessmentQuestion(button.dataset.poolQuestionId || "");
        return;
      }
      addAssessmentQuestion(button.dataset.poolQuestionId || "");
    });
  });
}

function renderSelectedAssessmentQuestions() {
  const container = document.getElementById("assessmentSelectedQuestionList");
  const items = [...state.assessmentDraft.selectedQuestions].sort((a, b) => a.sortOrder - b.sortOrder);
  if (items.length === 0) {
    container.innerHTML = `<div class="template-empty">当前还没有选择题目。</div>`;
    updateAssessmentTotalScore();
    return;
  }

  container.innerHTML = items.map((item) => `
    <article class="template-selected-card">
      <h4>${escapeHtml(item.stem)}</h4>
      <p>题型：${escapeHtml(formatQuestionType(item.type))}</p>
      <div class="template-selected-grid">
        <label>
          <span>分组</span>
          <input data-selected-field="sectionName" data-question-id="${escapeHtml(item.questionId)}" value="${escapeHtml(item.sectionName || "")}" placeholder="例如 Java 基础" />
        </label>
        <label>
          <span>排序</span>
          <input data-selected-field="sortOrder" data-question-id="${escapeHtml(item.questionId)}" type="number" min="1" value="${escapeHtml(String(item.sortOrder))}" />
        </label>
        <label>
          <span>分值</span>
          <input data-selected-field="score" data-question-id="${escapeHtml(item.questionId)}" type="number" min="1" value="${escapeHtml(String(item.score))}" />
        </label>
      </div>
      <div class="button-row">
        <button type="button" class="danger-button" data-remove-selected-question-id="${escapeHtml(item.questionId)}">移除题目</button>
      </div>
    </article>
  `).join("");

  container.querySelectorAll("[data-selected-field]").forEach((field) => {
    field.addEventListener("input", () => updateAssessmentQuestionField(
      field.dataset.questionId || "",
      field.dataset.selectedField || "",
      field.value
    ));
  });
  container.querySelectorAll("[data-remove-selected-question-id]").forEach((button) => {
    button.addEventListener("click", () => removeAssessmentQuestion(button.dataset.removeSelectedQuestionId || ""));
  });

  updateAssessmentTotalScore();
}

function addAssessmentQuestion(questionId) {
  const current = state.assessmentDraft.selectedQuestions.find((item) => item.questionId === questionId);
  if (current) {
    return;
  }
  const question = state.assessmentQuestionPool.find((item) => item.id === questionId);
  if (!question) {
    return;
  }

  state.assessmentDraft.selectedQuestions.push({
    questionId: question.id,
    stem: question.stem,
    type: question.type,
    difficulty: question.difficulty,
    sectionName: "",
    sortOrder: state.assessmentDraft.selectedQuestions.length + 1,
    score: Number(question.score || 10)
  });
  renderAssessmentQuestionPool();
  renderSelectedAssessmentQuestions();
}

function removeAssessmentQuestion(questionId) {
  state.assessmentDraft.selectedQuestions = state.assessmentDraft.selectedQuestions
    .filter((item) => item.questionId !== questionId)
    .map((item, index) => ({
      ...item,
      sortOrder: index + 1
    }));
  renderAssessmentQuestionPool();
  renderSelectedAssessmentQuestions();
}

function updateAssessmentQuestionField(questionId, field, rawValue) {
  state.assessmentDraft.selectedQuestions = state.assessmentDraft.selectedQuestions.map((item) => {
    if (item.questionId !== questionId) {
      return item;
    }
    if (field === "sortOrder") {
      return { ...item, sortOrder: Math.max(1, Number(rawValue || 1)) };
    }
    if (field === "score") {
      return { ...item, score: Math.max(1, Number(rawValue || 1)) };
    }
    if (field === "sectionName") {
      return { ...item, sectionName: rawValue };
    }
    return item;
  });

  state.assessmentDraft.selectedQuestions.sort((a, b) => a.sortOrder - b.sortOrder);
  state.assessmentDraft.selectedQuestions = state.assessmentDraft.selectedQuestions.map((item, index) => ({
    ...item,
    sortOrder: index + 1
  }));
  renderSelectedAssessmentQuestions();
}

function updateAssessmentTotalScore() {
  const total = state.assessmentDraft.selectedQuestions.reduce((sum, item) => sum + Number(item.score || 0), 0);
  const field = document.getElementById("assessmentTotalScoreInput");
  if (field) {
    field.value = String(total);
  }
}

async function submitAssessmentTemplate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearFormFeedback(form);
  setFormLoading(form, true, state.assessmentDraft.mode === "create" ? "创建中..." : "保存中...");
  const formData = new FormData(form);
  const mode = String(formData.get("mode") || "create").trim();
  const assessmentId = String(formData.get("assessmentId") || "").trim();

  const payload = {
    title: String(formData.get("title") || "").trim(),
    targetLevel: String(formData.get("targetLevel") || "").trim(),
    status: String(formData.get("status") || "draft").trim(),
    description: String(formData.get("description") || "").trim(),
    questions: state.assessmentDraft.selectedQuestions.map((item) => ({
      questionId: item.questionId,
      sectionName: item.sectionName,
      sortOrder: item.sortOrder,
      score: Number(item.score || 0)
    }))
  };

  const path = mode === "update"
    ? `/api/admin/assessments/${assessmentId}`
    : "/api/admin/assessments";
  const method = mode === "update" ? "PUT" : "POST";
  const result = await api(path, {
    method,
    body: JSON.stringify(payload)
  });

  if (!result.ok) {
    setFormFeedback(form, result.message, true);
    showFeedback(result.message, true);
    setFormLoading(form, false);
    return;
  }

  closeModal();
  showFeedback(mode === "update" ? "试卷模板更新成功。" : "试卷模板创建成功。");
  await Promise.all([
    loadAssessments({ silent: true }),
    loadAssessmentOptions({ silent: true })
  ]);
  setFormLoading(form, false);
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
      <div class="pagination-actions">
        <label class="pagination-size">
          <span>每页</span>
          <select data-pagination-size="${escapeHtml(key)}">
            ${[10, 20, 50, 100].map((size) => `
              <option value="${escapeHtml(String(size))}" ${pagination.pageSize === size ? "selected" : ""}>${escapeHtml(String(size))}</option>
            `).join("")}
          </select>
          <span>条</span>
        </label>
        <div class="button-row">
        <button class="ghost-button" data-pagination="${escapeHtml(key)}" data-page="${escapeHtml(String(Math.max(1, pagination.page - 1)))}" ${pagination.page <= 1 ? "disabled" : ""}>上一页</button>
        <button class="ghost-button" data-pagination="${escapeHtml(key)}" data-page="${escapeHtml(String(Math.min(totalPages, pagination.page + 1)))}" ${pagination.page >= totalPages ? "disabled" : ""}>下一页</button>
        </div>
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

  document.querySelectorAll(`[data-pagination-size="${key}"]`).forEach((select) => {
    select.addEventListener("change", async () => {
      const nextPageSize = Number(select.value || 10);
      if (!Number.isFinite(nextPageSize) || nextPageSize <= 0) {
        return;
      }
      state.paginations[key].page = 1;
      state.paginations[key].pageSize = nextPageSize;
      await loader({ page: 1 });
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
