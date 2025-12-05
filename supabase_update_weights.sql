-- ============================================================
-- Supabase SQL Editor에서 실행할 가중치 업데이트 SQL
-- 기존 데이터를 업데이트합니다
-- ============================================================

-- 1. 직군별 질문 가중치 업데이트 (1.875% → 7.5%)
UPDATE "question"
SET "weight_percent" = 7.5
WHERE "category" = 'dev' AND "weight_percent" = 1.875;

-- 2. Hot Developer 질문 2개 추가 (question_id: 21-22)
INSERT INTO "question" ("question_id", "content", "category", "dev_group_id", "weight_percent", "is_active") VALUES
(21, '오늘의 Hot Developer 질문 1', 'SPECIAL', NULL, 10.0, true),
(22, '오늘의 Hot Developer 질문 2', 'SPECIAL', NULL, 10.0, true)
ON CONFLICT ("question_id") DO UPDATE SET
  "content" = EXCLUDED."content",
  "weight_percent" = EXCLUDED."weight_percent",
  "category" = EXCLUDED."category";

-- 3. Hot Developer 질문 뱃지 2개 추가 (badge_id: 21-22)
INSERT INTO "badge" ("badge_id", "question_id", "name", "description") VALUES
(21, 21, 'Hot Developer 뱃지 1', '🔥 Hot Developer가 선정한 질문 1'),
(22, 22, 'Hot Developer 뱃지 2', '🔥 Hot Developer가 선정한 질문 2')
ON CONFLICT ("badge_id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "question_id" = EXCLUDED."question_id";

-- 완료 메시지
SELECT '✅ 가중치 업데이트 완료!' as message;



