-- ============================================================
-- 성능 최적화를 위한 인덱스 추가
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1. daily_answer 테이블 인덱스
CREATE INDEX IF NOT EXISTS "daily_answer_answer_date_idx" ON "daily_answer"("answer_date");
CREATE INDEX IF NOT EXISTS "daily_answer_user_id_answer_date_idx" ON "daily_answer"("user_id", "answer_date");
CREATE INDEX IF NOT EXISTS "daily_answer_question_id_answer_date_idx" ON "daily_answer"("question_id", "answer_date");

-- 2. daily_score 테이블 인덱스
CREATE INDEX IF NOT EXISTS "daily_score_score_date_idx" ON "daily_score"("score_date");
CREATE INDEX IF NOT EXISTS "daily_score_score_date_cpu_score_idx" ON "daily_score"("score_date", "cpu_score" DESC);

-- 3. user_badge 테이블 인덱스
CREATE INDEX IF NOT EXISTS "user_badge_user_id_granted_date_idx" ON "user_badge"("user_id", "granted_date");
CREATE INDEX IF NOT EXISTS "user_badge_granted_date_idx" ON "user_badge"("granted_date");

-- 4. question 테이블 인덱스
CREATE INDEX IF NOT EXISTS "question_category_idx" ON "question"("category");
CREATE INDEX IF NOT EXISTS "question_category_dev_group_id_idx" ON "question"("category", "dev_group_id");

-- 5. meme 테이블 인덱스 (최근 밈 조회 최적화)
CREATE INDEX IF NOT EXISTS "meme_created_at_idx" ON "meme"("created_at" DESC);

-- 6. concern 테이블 인덱스 (최근 고민 조회 최적화)
CREATE INDEX IF NOT EXISTS "concern_created_at_idx" ON "concern"("created_at" DESC);

SELECT '✅ 인덱스 추가 완료!' as message;

