-- ============================================================
-- 뱃지 이모티콘 업데이트 SQL
-- Supabase SQL Editor에서 실행
-- ============================================================

-- 공통 질문 뱃지 업데이트 (개발 시간 이모티콘 변경)
UPDATE "badge" SET
  "description" = '🪑 엉덩이가 무거워'
WHERE "badge_id" = 4;

-- 직군별 질문 뱃지 확인 및 업데이트 (필요시)
-- 프론트엔드 뱃지 (badge_id: 5-8)
UPDATE "badge" SET
  "name" = '새 화면이 나를 부른다',
  "description" = '🎨 새 화면이 나를 부른다'
WHERE "badge_id" = 5;

UPDATE "badge" SET
  "name" = '백-프론트 통역사',
  "description" = '📡 백-프론트 통역사'
WHERE "badge_id" = 6;

UPDATE "badge" SET
  "name" = '"Figma 변경사항 확인해주세요" n번째 듣는 중',
  "description" = '🤯 "Figma 변경사항 확인해주세요" n번째 듣는 중'
WHERE "badge_id" = 7;

UPDATE "badge" SET
  "name" = 'CSS가 왜 그럴까',
  "description" = '🧩 CSS가 왜 그럴까'
WHERE "badge_id" = 8;

-- 백엔드 뱃지 (badge_id: 9-12)
UPDATE "badge" SET
  "name" = 'JSON 상하차 중',
  "description" = '🛠️ JSON 상하차 중'
WHERE "badge_id" = 9;

UPDATE "badge" SET
  "name" = 'Release 지옥에서 날 꺼내줘',
  "description" = '🔥 Release 지옥에서 날 꺼내줘'
WHERE "badge_id" = 10;

UPDATE "badge" SET
  "name" = '버그 담당 일진',
  "description" = '🚨 버그 담당 일진'
WHERE "badge_id" = 11;

UPDATE "badge" SET
  "name" = 'ALTER TABLE 만능 노동자',
  "description" = '🛠️ ALTER TABLE 만능 노동자'
WHERE "badge_id" = 12;

-- AI 뱃지 (badge_id: 13-16)
UPDATE "badge" SET
  "name" = 'Loss 안 내려가서 눈물 흘리는 중',
  "description" = '🥲 Loss 안 내려가서 눈물 흘리는 중'
WHERE "badge_id" = 13;

UPDATE "badge" SET
  "name" = 'Colab과 밀당 중',
  "description" = '💻 Colab과 밀당 중'
WHERE "badge_id" = 14;

UPDATE "badge" SET
  "name" = '라벨링 하다 영혼 가출',
  "description" = '💀 라벨링 하다 영혼 가출'
WHERE "badge_id" = 15;

UPDATE "badge" SET
  "name" = '파라미터 튜닝 중독',
  "description" = '💉 파라미터 튜닝 중독'
WHERE "badge_id" = 16;

-- 모바일 뱃지 (badge_id: 17-20)
UPDATE "badge" SET
  "name" = 'Gradle의 노예',
  "description" = '🔨 Gradle의 노예'
WHERE "badge_id" = 17;

UPDATE "badge" SET
  "name" = '컴포넌트 복붙 기계',
  "description" = '🔄 컴포넌트 복붙 기계'
WHERE "badge_id" = 18;

UPDATE "badge" SET
  "name" = '디펜던시 마스터',
  "description" = '🔗 디펜던시 마스터'
WHERE "badge_id" = 19;

UPDATE "badge" SET
  "name" = '앱은 죽었지만 난 살아있다',
  "description" = '💔 앱은 죽었지만 난 살아있다'
WHERE "badge_id" = 20;

-- 완료 메시지
SELECT '✅ 뱃지 이모티콘 업데이트 완료!' as message;

