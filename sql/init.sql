//////////////////////////////////////////////////////////
// 1. dev_group / role / users
//////////////////////////////////////////////////////////

Table dev_group {
  dev_group_id int [pk, increment]
  name varchar(50) [not null]
  description varchar(255)
}

Table role {
  role_id int [pk, increment]
  name varchar(50) [not null, unique]
}

Table users {
  user_id int [pk, increment]
  nickname varchar(50) [not null, unique]
  dev_group_id int [not null]
  role_id int [not null]
  joined_at datetime [not null, default: `CURRENT_TIMESTAMP`]

  total_answers int [not null, default: 0]
  total_accepted int [not null, default: 0]
  hot_dev_count int [not null, default: 0]
}

Ref: users.dev_group_id > dev_group.dev_group_id
Ref: users.role_id > role.role_id


//////////////////////////////////////////////////////////
// 2. question / weight logs / badge
//////////////////////////////////////////////////////////

Table question {
  question_id int [pk, increment]
  content varchar(255) [not null]
  category enum('COMMON', 'dev', 'SPECIAL') [not null]
  dev_group_id int
  weight_percent decimal(5,2) [not null]
  is_active boolean [not null, default: true]
}

Ref: question.dev_group_id > dev_group.dev_group_id

Table question_weight_log {
  weight_log_id int [pk, increment]
  question_id int [not null]
  old_weight_percent decimal(5,2) [not null]
  new_weight_percent decimal(5,2) [not null]
  changed_by_root int [not null]
  changed_at datetime [not null, default: `CURRENT_TIMESTAMP`]
  reason varchar(255)
}

Ref: question_weight_log.question_id > question.question_id
Ref: question_weight_log.changed_by_root > users.user_id


//////////////////////////////////////////////////////////
// 3. daily_answer / daily_score / hot_developer
//////////////////////////////////////////////////////////

Table daily_answer {
  daily_answer_id int [pk, increment]
  user_id int [not null]
  question_id int [not null]
  answer_date date [not null]
  answer_value decimal(10,2) [not null]
  created_at datetime [not null, default: `CURRENT_TIMESTAMP`]

  // Prevent duplicate answers per day
  indexes {
    (user_id, question_id, answer_date) [unique]
  }
}

Ref: daily_answer.user_id > users.user_id
Ref: daily_answer.question_id > question.question_id

Table daily_score {
  user_id int [not null]
  score_date date [not null]
  cpu_score decimal(10,2) [not null]

  primary key (user_id, score_date)
}

Ref: daily_score.user_id > users.user_id

Table hot_developer {
  dev_group_id int [not null]
  effective_date date [not null]
  user_id int [not null]

  primary key (dev_group_id, effective_date)
}

Ref: hot_developer.dev_group_id > dev_group.dev_group_id
Ref: hot_developer.user_id > users.user_id


//////////////////////////////////////////////////////////
// 4. badge / user_badge
//////////////////////////////////////////////////////////

Table badge {
  badge_id int [pk, increment]
  question_id int [not null]
  name varchar(100) [not null]
  description varchar(255)
}

Ref: badge.question_id > question.question_id

Table user_badge {
  user_id int [not null]
  badge_id int [not null]
  granted_date date [not null, default: `CURRENT_DATE`]

  primary key (user_id, badge_id, granted_date)
}

Ref: user_badge.user_id > users.user_id
Ref: user_badge.badge_id > badge.badge_id


//////////////////////////////////////////////////////////
// 5. meme / meme_like / user_daily_like
//////////////////////////////////////////////////////////

Table meme {
  meme_id int [pk, increment]
  user_id int [not null]
  title varchar(100)
  content_text text
  image_url varchar(255)
  created_at datetime [not null, default: `CURRENT_TIMESTAMP`]
  like_count int [not null, default: 0]
}

Ref: meme.user_id > users.user_id

Table meme_like {
  meme_id int [not null]
  user_id int [not null]
  liked_at datetime [not null, default: `CURRENT_TIMESTAMP`]

  primary key (meme_id, user_id)
}

Ref: meme_like.meme_id > meme.meme_id
Ref: meme_like.user_id > users.user_id

Table user_daily_like {
  user_id int [not null]
  like_date date [not null]
  like_count int [not null, default: 0]

  primary key (user_id, like_date)
}

Ref: user_daily_like.user_id > users.user_id


//////////////////////////////////////////////////////////
// 6. concern (고민게시판) / concern_answer
//////////////////////////////////////////////////////////

Table concern {
  concern_id int [pk, increment]
  user_id int [not null] // 질문자
  dev_group_id int [not null]
  title varchar(100) [not null]
  content text [not null]
  created_at datetime [not null, default: `CURRENT_TIMESTAMP`]
  was_good boolean // NULL: 아직 채택 안 함
}

Ref: concern.user_id > users.user_id
Ref: concern.dev_group_id > dev_group.dev_group_id

Table concern_answer {
  concern_answer_id int [pk, increment]
  concern_id int [not null]
  user_id int [not null] // 답변자
  content text [not null]
  created_at datetime [not null, default: `CURRENT_TIMESTAMP`]
  is_accepted boolean
}

Ref: concern_answer.concern_id > concern.concern_id
Ref: concern_answer.user_id > users.user_id
