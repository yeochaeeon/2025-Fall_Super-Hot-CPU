-- CreateEnum
CREATE TYPE "QuestionCategory" AS ENUM ('COMMON', 'dev', 'SPECIAL');

-- CreateTable
CREATE TABLE "dev_group" (
    "dev_group_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "dev_group_pkey" PRIMARY KEY ("dev_group_id")
);

-- CreateTable
CREATE TABLE "role" (
    "role_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "nickname" TEXT NOT NULL,
    "dev_group_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_answers" INTEGER NOT NULL DEFAULT 0,
    "total_accepted" INTEGER NOT NULL DEFAULT 0,
    "hot_dev_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "question" (
    "question_id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "category" "QuestionCategory" NOT NULL,
    "dev_group_id" INTEGER,
    "weight_percent" DECIMAL(5,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "question_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "question_weight_log" (
    "weight_log_id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "old_weight_percent" DECIMAL(5,2) NOT NULL,
    "new_weight_percent" DECIMAL(5,2) NOT NULL,
    "changed_by_root" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "question_weight_log_pkey" PRIMARY KEY ("weight_log_id")
);

-- CreateTable
CREATE TABLE "daily_answer" (
    "daily_answer_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "answer_date" DATE NOT NULL,
    "answer_value" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_answer_pkey" PRIMARY KEY ("daily_answer_id")
);

-- CreateTable
CREATE TABLE "daily_score" (
    "user_id" INTEGER NOT NULL,
    "score_date" DATE NOT NULL,
    "cpu_score" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "daily_score_pkey" PRIMARY KEY ("user_id","score_date")
);

-- CreateTable
CREATE TABLE "hot_developer" (
    "dev_group_id" INTEGER NOT NULL,
    "effective_date" DATE NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "hot_developer_pkey" PRIMARY KEY ("dev_group_id","effective_date")
);

-- CreateTable
CREATE TABLE "badge" (
    "badge_id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "badge_pkey" PRIMARY KEY ("badge_id")
);

-- CreateTable
CREATE TABLE "user_badge" (
    "user_id" INTEGER NOT NULL,
    "badge_id" INTEGER NOT NULL,
    "granted_date" DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT "user_badge_pkey" PRIMARY KEY ("user_id","badge_id","granted_date")
);

-- CreateTable
CREATE TABLE "meme" (
    "meme_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT,
    "content_text" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "like_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "meme_pkey" PRIMARY KEY ("meme_id")
);

-- CreateTable
CREATE TABLE "meme_like" (
    "meme_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "liked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meme_like_pkey" PRIMARY KEY ("meme_id","user_id")
);

-- CreateTable
CREATE TABLE "user_daily_like" (
    "user_id" INTEGER NOT NULL,
    "like_date" DATE NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_daily_like_pkey" PRIMARY KEY ("user_id","like_date")
);

-- CreateTable
CREATE TABLE "concern" (
    "concern_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "dev_group_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "was_good" BOOLEAN,

    CONSTRAINT "concern_pkey" PRIMARY KEY ("concern_id")
);

-- CreateTable
CREATE TABLE "concern_answer" (
    "concern_answer_id" SERIAL NOT NULL,
    "concern_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_accepted" BOOLEAN,

    CONSTRAINT "concern_answer_pkey" PRIMARY KEY ("concern_answer_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "daily_answer_user_id_question_id_answer_date_key" ON "daily_answer"("user_id", "question_id", "answer_date");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_dev_group_id_fkey" FOREIGN KEY ("dev_group_id") REFERENCES "dev_group"("dev_group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_dev_group_id_fkey" FOREIGN KEY ("dev_group_id") REFERENCES "dev_group"("dev_group_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_weight_log" ADD CONSTRAINT "question_weight_log_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_weight_log" ADD CONSTRAINT "question_weight_log_changed_by_root_fkey" FOREIGN KEY ("changed_by_root") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_answer" ADD CONSTRAINT "daily_answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_answer" ADD CONSTRAINT "daily_answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_score" ADD CONSTRAINT "daily_score_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hot_developer" ADD CONSTRAINT "hot_developer_dev_group_id_fkey" FOREIGN KEY ("dev_group_id") REFERENCES "dev_group"("dev_group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hot_developer" ADD CONSTRAINT "hot_developer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge" ADD CONSTRAINT "badge_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badge" ADD CONSTRAINT "user_badge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badge" ADD CONSTRAINT "user_badge_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badge"("badge_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meme" ADD CONSTRAINT "meme_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meme_like" ADD CONSTRAINT "meme_like_meme_id_fkey" FOREIGN KEY ("meme_id") REFERENCES "meme"("meme_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meme_like" ADD CONSTRAINT "meme_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_daily_like" ADD CONSTRAINT "user_daily_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concern" ADD CONSTRAINT "concern_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concern" ADD CONSTRAINT "concern_dev_group_id_fkey" FOREIGN KEY ("dev_group_id") REFERENCES "dev_group"("dev_group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concern_answer" ADD CONSTRAINT "concern_answer_concern_id_fkey" FOREIGN KEY ("concern_id") REFERENCES "concern"("concern_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concern_answer" ADD CONSTRAINT "concern_answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
