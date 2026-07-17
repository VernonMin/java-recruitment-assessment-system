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

insert into user_roles (id, user_id, role_id, created_at) values
  ('user_role_admin', 'user_admin', 'role_admin', 1752796800000);

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
    2,
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
  );

insert into question_options (id, question_id, option_key, option_text, sort_order) values
  ('option_jvm_a', 'question_java_jvm', 'A', 'JVM 只是一个 Java 编辑器插件', 1),
  ('option_jvm_b', 'question_java_jvm', 'B', 'JVM 负责将字节码运行在不同操作系统之上', 2),
  ('option_jvm_c', 'question_java_jvm', 'C', 'JVM 只能在 Windows 运行', 3),
  ('option_jvm_d', 'question_java_jvm', 'D', 'JVM 与垃圾回收无关', 4);

insert into question_answers (id, question_id, answer_type, answer_content, case_sensitive, created_at) values
  ('answer_java_jvm', 'question_java_jvm', 'exact', 'B', 0, 1752796800000),
  ('answer_scenario_cache', 'question_scenario_cache', 'manual', '', 0, 1752796800000);

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
  '用于 Java 后端开发岗位的首轮基础筛选。',
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
  'Java 后端招聘首轮测评',
  '用于 2026 年 7 月的首轮线上筛选。',
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
