drop table if exists snapshot_files;
drop table if exists proctoring_events;
drop table if exists evaluation_records;
drop table if exists submission_answers;
drop table if exists submissions;
drop table if exists campaign_candidates;
drop table if exists recruitment_campaigns;
drop table if exists assessment_questions;
drop table if exists assessments;
drop table if exists question_answers;
drop table if exists question_options;
drop table if exists questions;
drop table if exists user_roles;
drop table if exists roles;
drop table if exists users;

create table users (
  id text primary key,
  account text not null unique,
  password_hash text not null,
  full_name text not null,
  email text,
  mobile text,
  status text not null,
  last_login_at integer,
  created_at integer not null,
  updated_at integer not null
);

create table roles (
  id text primary key,
  code text not null unique,
  name text not null,
  created_at integer not null
);

create table user_roles (
  id text primary key,
  user_id text not null,
  role_id text not null,
  created_at integer not null,
  foreign key (user_id) references users(id),
  foreign key (role_id) references roles(id),
  unique(user_id, role_id)
);

create table questions (
  id text primary key,
  type text not null,
  stem text not null,
  analysis text,
  difficulty integer not null default 3,
  score integer not null default 0,
  tags text,
  status text not null,
  created_by text not null,
  created_at integer not null,
  updated_at integer not null,
  foreign key (created_by) references users(id)
);

create table question_options (
  id text primary key,
  question_id text not null,
  option_key text not null,
  option_text text not null,
  sort_order integer not null,
  foreign key (question_id) references questions(id)
);

create table question_answers (
  id text primary key,
  question_id text not null,
  answer_type text not null,
  answer_content text not null,
  case_sensitive integer not null default 0,
  created_at integer not null,
  foreign key (question_id) references questions(id)
);

create table assessments (
  id text primary key,
  title text not null,
  description text,
  total_score integer not null default 0,
  target_level text,
  status text not null,
  created_by text not null,
  created_at integer not null,
  updated_at integer not null,
  foreign key (created_by) references users(id)
);

create table assessment_questions (
  id text primary key,
  assessment_id text not null,
  question_id text not null,
  section_name text,
  sort_order integer not null,
  score integer not null,
  foreign key (assessment_id) references assessments(id),
  foreign key (question_id) references questions(id),
  unique(assessment_id, question_id)
);

create table recruitment_campaigns (
  id text primary key,
  assessment_id text not null,
  title text not null,
  description text,
  target_role text,
  start_time integer not null,
  end_time integer not null,
  duration_minutes integer,
  status text not null,
  require_camera integer not null default 0,
  require_fullscreen integer not null default 0,
  created_by text not null,
  created_at integer not null,
  updated_at integer not null,
  foreign key (assessment_id) references assessments(id),
  foreign key (created_by) references users(id)
);

create table campaign_candidates (
  id text primary key,
  campaign_id text not null,
  user_id text not null,
  attempt_limit integer not null default 1,
  invitation_status text not null,
  created_at integer not null,
  foreign key (campaign_id) references recruitment_campaigns(id),
  foreign key (user_id) references users(id),
  unique(campaign_id, user_id)
);

create table submissions (
  id text primary key,
  campaign_id text not null,
  user_id text not null,
  submit_no integer not null,
  status text not null,
  started_at integer not null,
  submitted_at integer,
  objective_score integer not null default 0,
  subjective_score integer not null default 0,
  total_score integer not null default 0,
  anti_cheat_risk_level text not null default 'low',
  recommendation text,
  created_at integer not null,
  updated_at integer not null,
  foreign key (campaign_id) references recruitment_campaigns(id),
  foreign key (user_id) references users(id),
  unique(campaign_id, user_id, submit_no)
);

create table submission_answers (
  id text primary key,
  submission_id text not null,
  question_id text not null,
  answer_content text not null,
  objective_result text not null,
  objective_score integer not null default 0,
  subjective_score integer not null default 0,
  final_score integer not null default 0,
  reviewer_comment text,
  created_at integer not null,
  updated_at integer not null,
  foreign key (submission_id) references submissions(id),
  foreign key (question_id) references questions(id),
  unique(submission_id, question_id)
);

create table evaluation_records (
  id text primary key,
  submission_id text not null,
  submission_answer_id text,
  evaluation_type text not null,
  score_before integer,
  score_after integer,
  comment text,
  evaluated_by text,
  evaluated_at integer not null,
  foreign key (submission_id) references submissions(id),
  foreign key (submission_answer_id) references submission_answers(id),
  foreign key (evaluated_by) references users(id)
);

create table proctoring_events (
  id text primary key,
  campaign_id text not null,
  submission_id text,
  user_id text not null,
  event_type text not null,
  event_value text,
  risk_score integer not null default 0,
  created_at integer not null,
  foreign key (campaign_id) references recruitment_campaigns(id),
  foreign key (submission_id) references submissions(id),
  foreign key (user_id) references users(id)
);

create table snapshot_files (
  id text primary key,
  submission_id text not null,
  user_id text not null,
  r2_key text not null,
  content_type text not null,
  file_size integer not null,
  captured_at integer not null,
  created_at integer not null,
  foreign key (submission_id) references submissions(id),
  foreign key (user_id) references users(id)
);

create index idx_users_status on users(status);
create index idx_questions_type on questions(type);
create index idx_questions_status on questions(status);
create index idx_assessment_questions_order on assessment_questions(assessment_id, sort_order);
create index idx_campaigns_status on recruitment_campaigns(status);
create index idx_campaigns_time on recruitment_campaigns(start_time, end_time);
create index idx_submissions_status on submissions(status);
create index idx_submissions_campaign_user on submissions(campaign_id, user_id);
create index idx_submission_answers_question on submission_answers(question_id);
create index idx_evaluation_records_submission on evaluation_records(submission_id);
create index idx_proctoring_events_campaign_user on proctoring_events(campaign_id, user_id);
create index idx_proctoring_events_type on proctoring_events(event_type);
create index idx_snapshot_files_submission on snapshot_files(submission_id);

insert into roles (id, code, name, created_at) values
  ('role_candidate', 'candidate', '候选人', 1752796800000),
  ('role_interviewer', 'interviewer', '面试官', 1752796800000),
  ('role_recruiter', 'recruiter', '招聘专员', 1752796800000),
  ('role_admin', 'admin', '管理员', 1752796800000);

insert into users (
  id,
  account,
  password_hash,
  full_name,
  email,
  mobile,
  status,
  last_login_at,
  created_at,
  updated_at
) values (
  'user_admin',
  'admin',
  'pbkdf2$100000$a9f8be99b29916296baea6aeb43829ae$46d26f091a460748bf1650f50b5c949a1d47235120e167a98e8b15b6d5d27f8c',
  '系统管理员',
  'admin@example.com',
  null,
  'active',
  null,
  1752796800000,
  1752796800000
);

insert into users (
  id,
  account,
  password_hash,
  full_name,
  email,
  mobile,
  status,
  last_login_at,
  created_at,
  updated_at
) values
  (
    'user_candidate_demo',
    'candidate_demo',
    'pbkdf2$100000$11111111111111111111111111111111$bb54568ce1e7f660de3900ae004fe83d544004dbd59f896f698cdcacf2d42b1d',
    '求职者演示账号',
    'candidate_demo@example.com',
    null,
    'active',
    null,
    1752796800000,
    1752796800000
  ),
  (
    'user_interviewer_demo',
    'interviewer_demo',
    'pbkdf2$100000$22222222222222222222222222222222$b6271d9c5c4b390764b1519fdabb177fba0d71fdcfc3fa4cb377fe210fd5c7af',
    '面试官演示账号',
    'interviewer_demo@example.com',
    null,
    'active',
    null,
    1752796800000,
    1752796800000
  ),
  (
    'user_recruiter_demo',
    'recruiter_demo',
    'pbkdf2$100000$33333333333333333333333333333333$d7048d67319568a9b5530165d435a18bc9c555e0f5aac8cb2bb7a82b56df580f',
    '招聘专员演示账号',
    'recruiter_demo@example.com',
    null,
    'active',
    null,
    1752796800000,
    1752796800000
  );

insert into user_roles (id, user_id, role_id, created_at) values
  ('user_role_admin', 'user_admin', 'role_admin', 1752796800000),
  ('user_role_candidate_demo', 'user_candidate_demo', 'role_candidate', 1752796800000),
  ('user_role_interviewer_demo', 'user_interviewer_demo', 'role_interviewer', 1752796800000),
  ('user_role_recruiter_demo', 'user_recruiter_demo', 'role_recruiter', 1752796800000);

insert into questions (
  id,
  type,
  stem,
  analysis,
  difficulty,
  score,
  tags,
  status,
  created_by,
  created_at,
  updated_at
) values
  (
    'question_java_jvm',
    'single_choice',
    '下列哪一项最准确地描述了 Java 中 JVM 的作用？',
    '考察候选人对 Java 运行时基础概念的理解。',
    0,
    10,
    '["java基础","jvm"]',
    'published',
    'user_admin',
    1752796800000,
    1752796800000
  ),
  (
    'question_scenario_cache',
    'scenario_answer',
    '你在一个高并发 Java 服务中发现数据库压力过高，请描述你会如何定位问题并设计缓存方案。',
    '考察候选人的分析能力、缓存设计能力与工程思维。',
    4,
    20,
    '["缓存","高并发","系统设计"]',
    'published',
    'user_admin',
    1752796800000,
    1752796800000
  ),
  (
    'question_work_style_01',
    'work_style',
    '任务临近截止，但需求还在变化时，你通常会怎么做？',
    '观察候选人在不确定环境中的推进方式、沟通习惯与优先级意识。',
    0,
    0,
    '["职业行为倾向","执行推进","沟通协作"]',
    'published',
    'user_admin',
    1752796800000,
    1752796800000
  ),
  (
    'question_work_style_02',
    'work_style',
    '当同事提交的内容影响了你的工作进度时，你更可能怎么处理？',
    '观察候选人面对协作摩擦时的反馈方式与协同意识。',
    0,
    0,
    '["职业行为倾向","团队协作","冲突处理"]',
    'published',
    'user_admin',
    1752796800000,
    1752796800000
  ),
  (
    'question_work_style_03',
    'work_style',
    '面对不熟悉的新任务时，你通常的第一反应是什么？',
    '观察候选人在陌生任务前的学习驱动与行动策略。',
    0,
    0,
    '["职业行为倾向","学习能力","主动性"]',
    'published',
    'user_admin',
    1752796800000,
    1752796800000
  ),
  (
    'question_work_style_04',
    'work_style',
    '当你同时收到多项紧急任务时，你通常会怎么安排？',
    '观察候选人处理多任务时的优先级判断与时间管理方式。',
    0,
    0,
    '["职业行为倾向","优先级","时间管理"]',
    'published',
    'user_admin',
    1752796800000,
    1752796800000
  ),
  (
    'question_work_style_05',
    'work_style',
    '如果你的方案在评审时被质疑，你通常会如何应对？',
    '观察候选人的反馈接受度、表达方式与调整弹性。',
    0,
    2,
    '["职业行为倾向","反馈接受","沟通表达"]',
    'published',
    'user_admin',
    1752796800000,
    1752796800000
  ),
  (
    'question_work_style_06',
    'work_style',
    '在团队合作中，你通常更像下面哪一种角色？',
    '观察候选人在团队中的自然角色倾向。',
    2,
    2,
    '["职业行为倾向","团队角色","协作方式"]',
    'published',
    'user_admin',
    1752796800000,
    1752796800000
  ),
  (
    'question_work_style_07',
    'work_style',
    '遇到线上突发问题时，你通常会优先怎么做？',
    '观察候选人在压力场景下的反应顺序与稳定性。',
    3,
    2,
    '["职业行为倾向","抗压稳定性","问题处理"]',
    'published',
    'user_admin',
    1752796800000,
    1752796800000
  ),
  (
    'question_work_style_08',
    'work_style',
    '当工作流程不够明确时，你更倾向于怎么做？',
    '观察候选人在规则不明确时的自驱与协同方式。',
    2,
    2,
    '["职业行为倾向","规则意识","主动性"]',
    'published',
    'user_admin',
    1752796800000,
    1752796800000
  ),
  (
    'question_work_style_09',
    'work_style',
    '如果你发现自己之前的判断有误，你通常会怎么处理？',
    '观察候选人的复盘意识、责任感与纠错习惯。',
    2,
    2,
    '["职业行为倾向","责任心","复盘纠错"]',
    'published',
    'user_admin',
    1752796800000,
    1752796800000
  ),
  (
    'question_work_style_10',
    'work_style',
    '面对重复但重要的工作时，你通常会怎么做？',
    '观察候选人在执行稳定性与流程优化之间的取向。',
    2,
    2,
    '["职业行为倾向","执行稳定性","流程优化"]',
    'published',
    'user_admin',
    1752796800000,
    1752796800000
  );

insert into question_options (id, question_id, option_key, option_text, sort_order) values
  ('option_jvm_a', 'question_java_jvm', 'A', 'JVM 只是一个 Java 编辑器插件', 1),
  ('option_jvm_b', 'question_java_jvm', 'B', 'JVM 负责将字节码运行在不同操作系统之上', 2),
  ('option_jvm_c', 'question_java_jvm', 'C', 'JVM 只能在 Windows 运行', 3),
  ('option_jvm_d', 'question_java_jvm', 'D', 'JVM 与垃圾回收无关', 4),
  ('option_work_style_01_a', 'question_work_style_01', 'A', '先尽快交付一个可运行版本，后续再逐步完善', 1),
  ('option_work_style_01_b', 'question_work_style_01', 'B', '等需求完全稳定后再开始，避免返工', 2),
  ('option_work_style_01_c', 'question_work_style_01', 'C', '先与相关方确认优先级，再推进关键部分', 3),
  ('option_work_style_01_d', 'question_work_style_01', 'D', '先处理自己最熟悉的部分，其他问题后面再说', 4),
  ('option_work_style_02_a', 'question_work_style_02', 'A', '直接指出问题并要求对方尽快修正', 1),
  ('option_work_style_02_b', 'question_work_style_02', 'B', '先自己兜底处理，尽量不影响整体进度', 2),
  ('option_work_style_02_c', 'question_work_style_02', 'C', '先说明影响，再和对方一起找解决办法', 3),
  ('option_work_style_02_d', 'question_work_style_02', 'D', '先不说，等影响变大了再反馈', 4),
  ('option_work_style_03_a', 'question_work_style_03', 'A', '先自己快速摸索，边做边学', 1),
  ('option_work_style_03_b', 'question_work_style_03', 'B', '先查资料建立理解，再开始推进', 2),
  ('option_work_style_03_c', 'question_work_style_03', 'C', '先向有经验的人确认关键点', 3),
  ('option_work_style_03_d', 'question_work_style_03', 'D', '等别人把任务拆得更细再行动', 4),
  ('option_work_style_04_a', 'question_work_style_04', 'A', '哪个催得最急就先做哪个', 1),
  ('option_work_style_04_b', 'question_work_style_04', 'B', '先排优先级，再逐项推进', 2),
  ('option_work_style_04_c', 'question_work_style_04', 'C', '先完成最容易做完的任务，快速清空一部分', 3),
  ('option_work_style_04_d', 'question_work_style_04', 'D', '多项任务同时推进，保持并行', 4),
  ('option_work_style_05_a', 'question_work_style_05', 'A', '坚持自己的方案，优先说服对方', 1),
  ('option_work_style_05_b', 'question_work_style_05', 'B', '先听完理由，再决定是否调整', 2),
  ('option_work_style_05_c', 'question_work_style_05', 'C', '为了避免争论，直接改成对方方案', 3),
  ('option_work_style_05_d', 'question_work_style_05', 'D', '先搁置争议，晚点再处理', 4),
  ('option_work_style_06_a', 'question_work_style_06', 'A', '推动执行、拿结果的人', 1),
  ('option_work_style_06_b', 'question_work_style_06', 'B', '协调信息、拉通协作的人', 2),
  ('option_work_style_06_c', 'question_work_style_06', 'C', '深入分析、关注细节的人', 3),
  ('option_work_style_06_d', 'question_work_style_06', 'D', '稳定支持、保证落地的人', 4),
  ('option_work_style_07_a', 'question_work_style_07', 'A', '先止血恢复服务，再定位根因', 1),
  ('option_work_style_07_b', 'question_work_style_07', 'B', '先找出是谁引起的问题', 2),
  ('option_work_style_07_c', 'question_work_style_07', 'C', '先把原因分析透，再决定如何处理', 3),
  ('option_work_style_07_d', 'question_work_style_07', 'D', '等负责人明确指令后再行动', 4),
  ('option_work_style_08_a', 'question_work_style_08', 'A', '自己先定一个做法，先把事情推进起来', 1),
  ('option_work_style_08_b', 'question_work_style_08', 'B', '先拉相关人对齐规则，再开始执行', 2),
  ('option_work_style_08_c', 'question_work_style_08', 'C', '先看看别人怎么做，再跟进', 3),
  ('option_work_style_08_d', 'question_work_style_08', 'D', '尽量回避边界不清的问题', 4),
  ('option_work_style_09_a', 'question_work_style_09', 'A', '及时承认并修正，同时同步相关方', 1),
  ('option_work_style_09_b', 'question_work_style_09', 'B', '先观察是否真的会产生影响，再决定', 2),
  ('option_work_style_09_c', 'question_work_style_09', 'C', '先私下修正，不主动说明', 3),
  ('option_work_style_09_d', 'question_work_style_09', 'D', '等别人发现问题后再解释', 4),
  ('option_work_style_10_a', 'question_work_style_10', 'A', '严格按规则稳定执行，尽量不出错', 1),
  ('option_work_style_10_b', 'question_work_style_10', 'B', '边做边想办法优化流程，减少重复劳动', 2),
  ('option_work_style_10_c', 'question_work_style_10', 'C', '如果能交给别人做，会尽量转出去', 3),
  ('option_work_style_10_d', 'question_work_style_10', 'D', '看当前压力情况，再决定投入多少精力', 4);

insert into question_answers (id, question_id, answer_type, answer_content, case_sensitive, created_at) values
  ('answer_java_jvm', 'question_java_jvm', 'exact', 'B', 0, 1752796800000),
  ('answer_scenario_cache', 'question_scenario_cache', 'manual', '', 0, 1752796800000),
  ('answer_work_style_01', 'question_work_style_01', 'manual', '', 0, 1752796800000),
  ('answer_work_style_02', 'question_work_style_02', 'manual', '', 0, 1752796800000),
  ('answer_work_style_03', 'question_work_style_03', 'manual', '', 0, 1752796800000),
  ('answer_work_style_04', 'question_work_style_04', 'manual', '', 0, 1752796800000),
  ('answer_work_style_05', 'question_work_style_05', 'manual', '', 0, 1752796800000),
  ('answer_work_style_06', 'question_work_style_06', 'manual', '', 0, 1752796800000),
  ('answer_work_style_07', 'question_work_style_07', 'manual', '', 0, 1752796800000),
  ('answer_work_style_08', 'question_work_style_08', 'manual', '', 0, 1752796800000),
  ('answer_work_style_09', 'question_work_style_09', 'manual', '', 0, 1752796800000),
  ('answer_work_style_10', 'question_work_style_10', 'manual', '', 0, 1752796800000);

insert into assessments (
  id,
  title,
  description,
  total_score,
  target_level,
  status,
  created_by,
  created_at,
  updated_at
) values (
  'assessment_java_backend_mvp',
  'Java 后端基础测评',
  '用于 Java 后端开发岗位的线上基础笔试筛选。',
  30,
  'mid',
  'published',
  'user_admin',
  1752796800000,
  1752796800000
);

insert into assessment_questions (
  id,
  assessment_id,
  question_id,
  section_name,
  sort_order,
  score
) values
  ('aq_java_jvm', 'assessment_java_backend_mvp', 'question_java_jvm', 'Java 基础', 1, 10),
  ('aq_scenario_cache', 'assessment_java_backend_mvp', 'question_scenario_cache', '系统设计', 2, 20);

insert into recruitment_campaigns (
  id,
  assessment_id,
  title,
  description,
  target_role,
  start_time,
  end_time,
  duration_minutes,
  status,
  require_camera,
  require_fullscreen,
  created_by,
  created_at,
  updated_at
) values (
  'campaign_java_backend_20260717',
  'assessment_java_backend_mvp',
  'Java 后端招聘试题',
  '用于 2026 年 7 月的线上笔试筛选。',
  'java_backend',
  1752796800000,
  1784332800000,
  60,
  'published',
  1,
  1,
  'user_admin',
  1752796800000,
  1752796800000
);

insert into campaign_candidates (
  id,
  campaign_id,
  user_id,
  attempt_limit,
  invitation_status,
  created_at
) values (
  'campaign_candidate_demo_assignment',
  'campaign_java_backend_20260717',
  'user_candidate_demo',
  1,
  'invited',
  1752796800000
);
