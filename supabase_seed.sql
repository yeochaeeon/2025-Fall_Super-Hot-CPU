-- ============================================================
-- Supabase SQL Editor에서 실행할 시드 데이터 INSERT SQL
-- ============================================================

-- 1. dev_group 초기 데이터 (4개)
INSERT INTO "dev_group" ("dev_group_id", "name", "description") VALUES
(1, '프론트엔드', 'Frontend Developer'),
(2, '백엔드', 'Backend Developer'),
(3, 'AI', 'AI Developer'),
(4, '모바일', 'Mobile Developer')
ON CONFLICT ("dev_group_id") DO NOTHING;

-- 2. role 초기 데이터 (4개)
INSERT INTO "role" ("role_id", "name") VALUES
(1, 'Developer'),
(2, 'Root'),
(3, 'Hot Developer'),
(4, 'Optimizer')
ON CONFLICT ("name") DO NOTHING;

-- 3. 공통 질문 4개 (question_id: 1-4, 각 12.5%)
INSERT INTO "question" ("question_id", "content", "category", "dev_group_id", "weight_percent", "is_active") VALUES
(1, '커밋 수', 'COMMON', NULL, 12.5, true),
(2, '마신 커피 몇잔인지', 'COMMON', NULL, 12.5, true),
(3, '수면시간', 'COMMON', NULL, 12.5, true),
(4, '개발 시간', 'COMMON', NULL, 12.5, true)
ON CONFLICT ("question_id") DO UPDATE SET
  "content" = EXCLUDED."content",
  "weight_percent" = EXCLUDED."weight_percent";

-- 4. 직군별 질문 16개 (question_id: 5-20, 각 7.5% - 직군별 4개가 총 30%)
-- 프론트엔드 (question_id: 5-8)
INSERT INTO "question" ("question_id", "content", "category", "dev_group_id", "weight_percent", "is_active") VALUES
(5, '페이지 구현 수', 'dev', 1, 7.5, true),
(6, 'API 연동 개수', 'dev', 1, 7.5, true),
(7, 'UI 변경으로 인한 코드 수정 건 수', 'dev', 1, 7.5, true),
(8, 'CSS or 레이아웃 깨짐 수정 횟수', 'dev', 1, 7.5, true),
-- 백엔드 (question_id: 9-12)
(9, 'API 설계나 개발 개수', 'dev', 2, 7.5, true),
(10, '배포 여부 (0 or 1)', 'dev', 2, 7.5, true),
(11, '에러 로그 수집된 건 수', 'dev', 2, 7.5, true),
(12, 'DB 스키마 변경 건 수', 'dev', 2, 7.5, true),
-- AI (question_id: 13-16)
(13, '에포크 돌린 횟수', 'dev', 3, 7.5, true),
(14, '''run time 연결이 끊어졌습니다'' 발생 횟수', 'dev', 3, 7.5, true),
(15, '모델 학습을 위해 확보/정제한 데이터셋 크기 (GB)', 'dev', 3, 7.5, true),
(16, '실험(run) 세팅 변경 횟수', 'dev', 3, 7.5, true),
-- 모바일 (question_id: 17-20)
(17, '빌드 재시도 횟수', 'dev', 4, 7.5, true),
(18, '페이지 구현 수', 'dev', 4, 7.5, true),
(19, '외부 SDK or dependency 문제 해결 시도 횟수', 'dev', 4, 7.5, true),
(20, '로컬이나 실제 디바이스에서 크래시 발생 횟수', 'dev', 4, 7.5, true)
ON CONFLICT ("question_id") DO UPDATE SET
  "content" = EXCLUDED."content",
  "weight_percent" = EXCLUDED."weight_percent";

-- 4-1. Hot Developer 질문 2개 (question_id: 21-22, 각 10% - 총 20%)
-- 초기에는 빈 질문으로 생성 (나중에 Hot Developer가 등록)
INSERT INTO "question" ("question_id", "content", "category", "dev_group_id", "weight_percent", "is_active") VALUES
(21, '오늘의 Hot Developer 질문 1', 'SPECIAL', NULL, 10.0, true),
(22, '오늘의 Hot Developer 질문 2', 'SPECIAL', NULL, 10.0, true)
ON CONFLICT ("question_id") DO UPDATE SET
  "content" = EXCLUDED."content",
  "weight_percent" = EXCLUDED."weight_percent";

-- 5. 공통 질문 뱃지 4개 (badge_id: 1-4)
INSERT INTO "badge" ("badge_id", "question_id", "name", "description") VALUES
(1, 1, '커밋 머신', '🤖 커밋 머신'),
(2, 2, '내 몸의 70%는 아메리카노', '☕ 내 몸의 70%는 아메리카노'),
(3, 3, '슬기로운 불면생활', '😴 슬기로운 불면생활'),
(4, 4, '엉덩이가 무거워', '🪑 엉덩이가 무거워')
ON CONFLICT ("badge_id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description";

-- 6. 직군별 질문 뱃지 16개 (badge_id: 5-20)
-- 프론트엔드 뱃지 (badge_id: 5-8)
INSERT INTO "badge" ("badge_id", "question_id", "name", "description") VALUES
(5, 5, '새 화면이 나를 부른다', '🎨 새 화면이 나를 부른다'),
(6, 6, '백-프론트 통역사', '📡 백-프론트 통역사'),
(7, 7, '"Figma 변경사항 확인해주세요" n번째 듣는 중', '🤯 "Figma 변경사항 확인해주세요" n번째 듣는 중'),
(8, 8, 'CSS가 왜 그럴까', '🧩 CSS가 왜 그럴까'),
-- 백엔드 뱃지 (badge_id: 9-12)
(9, 9, 'JSON 상하차 중', '🛠️ JSON 상하차 중'),
(10, 10, 'Release 지옥에서 날 꺼내줘', '🔥 Release 지옥에서 날 꺼내줘'),
(11, 11, '버그 담당 일진', '🚨 버그 담당 일진'),
(12, 12, 'ALTER TABLE 만능 노동자', '🛠️ ALTER TABLE 만능 노동자'),
-- AI 뱃지 (badge_id: 13-16)
(13, 13, 'Loss 안 내려가서 눈물 흘리는 중', '🥲 Loss 안 내려가서 눈물 흘리는 중'),
(14, 14, 'Colab과 밀당 중', '💻 Colab과 밀당 중'),
(15, 15, '라벨링 하다 영혼 가출', '💀 라벨링 하다 영혼 가출'),
(16, 16, '파라미터 튜닝 중독', '💉 파라미터 튜닝 중독'),
-- 모바일 뱃지 (badge_id: 17-20)
(17, 17, 'Gradle의 노예', '🔨 Gradle의 노예'),
(18, 18, '컴포넌트 복붙 기계', '🔄 컴포넌트 복붙 기계'),
(19, 19, '디펜던시 마스터', '🔗 디펜던시 마스터'),
(20, 20, '앱은 죽었지만 난 살아있다', '💔 앱은 죽었지만 난 살아있다')
ON CONFLICT ("badge_id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description";

-- 7. Hot Developer 질문 뱃지 2개 (badge_id: 21-22)
-- 초기에는 빈 뱃지로 생성 (나중에 Hot Developer가 등록한 질문에 맞게 업데이트)
INSERT INTO "badge" ("badge_id", "question_id", "name", "description") VALUES
(21, 21, 'Hot Developer 뱃지 1', '🔥 Hot Developer가 선정한 질문 1'),
(22, 22, 'Hot Developer 뱃지 2', '🔥 Hot Developer가 선정한 질문 2')
ON CONFLICT ("badge_id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description";

-- 완료 메시지
SELECT '✅ 시드 데이터 입력 완료!' as message;

