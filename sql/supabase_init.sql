-- ============================================================
-- Supabase SQL Editor에서 실행할 초기 스키마 생성 SQL
-- ============================================================

-- 1. ENUM 타입 생성
CREATE TYPE "QuestionCategory" AS ENUM ('COMMON', 'dev', 'SPECIAL');

-- 2. 기본 테이블 생성 (외래키 없음)
CREATE TABLE "dev_group" (
    "dev_group_id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255)
);

CREATE TABLE "role" (
    "role_id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL UNIQUE
);

-- 3. users 테이블 생성
CREATE TABLE "users" (
    "user_id" SERIAL PRIMARY KEY,
    "nickname" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "dev_group_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_answers" INTEGER NOT NULL DEFAULT 0,
    "total_accepted" INTEGER NOT NULL DEFAULT 0,
    "hot_dev_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "users_dev_group_id_fkey" FOREIGN KEY ("dev_group_id") REFERENCES "dev_group"("dev_group_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 4. question 테이블 생성
CREATE TABLE "question" (
    "question_id" SERIAL PRIMARY KEY,
    "content" VARCHAR(255) NOT NULL,
    "category" "QuestionCategory" NOT NULL,
    "dev_group_id" INTEGER,
    "weight_percent" DECIMAL(5,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "question_dev_group_id_fkey" FOREIGN KEY ("dev_group_id") REFERENCES "dev_group"("dev_group_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 5. badge 테이블 생성
CREATE TABLE "badge" (
    "badge_id" SERIAL PRIMARY KEY,
    "question_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    CONSTRAINT "badge_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("question_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 6. question_weight_log 테이블 생성
CREATE TABLE "question_weight_log" (
    "weight_log_id" SERIAL PRIMARY KEY,
    "question_id" INTEGER NOT NULL,
    "old_weight_percent" DECIMAL(5,2) NOT NULL,
    "new_weight_percent" DECIMAL(5,2) NOT NULL,
    "changed_by_root" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" VARCHAR(255),
    CONSTRAINT "question_weight_log_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("question_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "question_weight_log_changed_by_root_fkey" FOREIGN KEY ("changed_by_root") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 7. daily_answer 테이블 생성
CREATE TABLE "daily_answer" (
    "daily_answer_id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "answer_date" DATE NOT NULL,
    "answer_value" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "daily_answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "daily_answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("question_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "daily_answer_user_id_question_id_answer_date_key" UNIQUE ("user_id", "question_id", "answer_date")
);

-- 8. daily_score 테이블 생성
CREATE TABLE "daily_score" (
    "user_id" INTEGER NOT NULL,
    "score_date" DATE NOT NULL,
    "cpu_score" DECIMAL(10,2) NOT NULL,
    PRIMARY KEY ("user_id", "score_date"),
    CONSTRAINT "daily_score_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 9. hot_developer 테이블 생성
CREATE TABLE "hot_developer" (
    "dev_group_id" INTEGER NOT NULL,
    "effective_date" DATE NOT NULL,
    "user_id" INTEGER NOT NULL,
    PRIMARY KEY ("dev_group_id", "effective_date"),
    CONSTRAINT "hot_developer_dev_group_id_fkey" FOREIGN KEY ("dev_group_id") REFERENCES "dev_group"("dev_group_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "hot_developer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 10. user_badge 테이블 생성
CREATE TABLE "user_badge" (
    "user_id" INTEGER NOT NULL,
    "badge_id" INTEGER NOT NULL,
    "granted_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    PRIMARY KEY ("user_id", "badge_id", "granted_date"),
    CONSTRAINT "user_badge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_badge_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badge"("badge_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 11. meme 테이블 생성
CREATE TABLE "meme" (
    "meme_id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(255),
    "content_text" TEXT,
    "image_url" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "meme_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 12. meme_like 테이블 생성
CREATE TABLE "meme_like" (
    "meme_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "liked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("meme_id", "user_id"),
    CONSTRAINT "meme_like_meme_id_fkey" FOREIGN KEY ("meme_id") REFERENCES "meme"("meme_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "meme_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 13. user_daily_like 테이블 생성
CREATE TABLE "user_daily_like" (
    "user_id" INTEGER NOT NULL,
    "like_date" DATE NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ("user_id", "like_date"),
    CONSTRAINT "user_daily_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 14. concern 테이블 생성
CREATE TABLE "concern" (
    "concern_id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "dev_group_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "was_good" BOOLEAN,
    CONSTRAINT "concern_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "concern_dev_group_id_fkey" FOREIGN KEY ("dev_group_id") REFERENCES "dev_group"("dev_group_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 15. concern_answer 테이블 생성
CREATE TABLE "concern_answer" (
    "concern_answer_id" SERIAL PRIMARY KEY,
    "concern_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_accepted" BOOLEAN,
    CONSTRAINT "concern_answer_concern_id_fkey" FOREIGN KEY ("concern_id") REFERENCES "concern"("concern_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "concern_answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);



