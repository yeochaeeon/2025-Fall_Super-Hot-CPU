-- ============================================================
-- VIEW 생성 SQL
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1. 오늘의 랭킹 뷰 (today_ranking_view)
-- 오늘 날짜의 CPU 온도 랭킹을 사용자 정보와 함께 조회
CREATE OR REPLACE VIEW today_ranking_view AS
SELECT 
  ds.user_id,
  ds.score_date,
  ds.cpu_score,
  u.nickname,
  u.role_id,
  dg.dev_group_id,
  dg.name as dev_group_name,
  r.name as role_name
FROM daily_score ds
JOIN users u ON ds.user_id = u.user_id
JOIN dev_group dg ON u.dev_group_id = dg.dev_group_id
JOIN role r ON u.role_id = r.role_id
WHERE ds.score_date = CURRENT_DATE
ORDER BY ds.cpu_score DESC;

-- 2. 누적 랭킹 뷰 (total_ranking_view)
-- 사용자별 평균 CPU 온도를 계산하여 조회
CREATE OR REPLACE VIEW total_ranking_view AS
SELECT 
  u.user_id,
  u.nickname,
  u.role_id,
  dg.dev_group_id,
  dg.name as dev_group_name,
  r.name as role_name,
  COALESCE(AVG(ds.cpu_score), 0) as avg_cpu_score,
  COUNT(ds.cpu_score) as measurement_count
FROM users u
JOIN dev_group dg ON u.dev_group_id = dg.dev_group_id
JOIN role r ON u.role_id = r.role_id
LEFT JOIN daily_score ds ON u.user_id = ds.user_id
GROUP BY u.user_id, u.nickname, u.role_id, dg.dev_group_id, dg.name, r.name
ORDER BY avg_cpu_score DESC;

-- 3. 직군별 오늘의 평균 온도 뷰 (dev_group_today_avg_view)
-- 오늘 날짜 기준 직군별 평균 CPU 온도
CREATE OR REPLACE VIEW dev_group_today_avg_view AS
SELECT 
  dg.dev_group_id,
  dg.name as dev_group_name,
  COALESCE(AVG(ds.cpu_score), 0) as avg_cpu_score,
  COUNT(ds.user_id) as user_count
FROM dev_group dg
LEFT JOIN users u ON dg.dev_group_id = u.dev_group_id
LEFT JOIN daily_score ds ON u.user_id = ds.user_id 
  AND ds.score_date = CURRENT_DATE
GROUP BY dg.dev_group_id, dg.name
ORDER BY avg_cpu_score DESC;

-- 4. 오늘의 Hot CPU 사용자 뷰 (today_hot_cpu_view)
-- 오늘 날짜에서 가장 높은 CPU 온도를 가진 사용자
CREATE OR REPLACE VIEW today_hot_cpu_view AS
SELECT 
  ds.user_id,
  ds.score_date,
  ds.cpu_score,
  u.nickname,
  u.role_id,
  dg.dev_group_id,
  dg.name as dev_group_name,
  r.name as role_name
FROM daily_score ds
JOIN users u ON ds.user_id = u.user_id
JOIN dev_group dg ON u.dev_group_id = dg.dev_group_id
JOIN role r ON u.role_id = r.role_id
WHERE ds.score_date = CURRENT_DATE
  AND ds.cpu_score = (
    SELECT MAX(cpu_score) 
    FROM daily_score 
    WHERE score_date = CURRENT_DATE
  )
ORDER BY ds.cpu_score DESC
LIMIT 1;

-- 5. 인기 밈 뷰 (popular_memes_view)
-- 좋아요 순으로 정렬된 밈 목록
CREATE OR REPLACE VIEW popular_memes_view AS
SELECT 
  m.meme_id,
  m.user_id,
  m.title,
  m.content_text,
  m.image_url,
  m.created_at,
  m.like_count,
  u.nickname as author_nickname,
  dg.name as dev_group_name,
  r.name as role_name
FROM meme m
JOIN users u ON m.user_id = u.user_id
JOIN dev_group dg ON u.dev_group_id = dg.dev_group_id
JOIN role r ON u.role_id = r.role_id
ORDER BY m.like_count DESC, m.created_at DESC;

-- 6. 최신 고민 뷰 (recent_concerns_view)
-- 최신순으로 정렬된 고민 목록
CREATE OR REPLACE VIEW recent_concerns_view AS
SELECT 
  c.concern_id,
  c.user_id,
  c.dev_group_id,
  c.title,
  c.content,
  c.created_at,
  c.was_good,
  u.nickname as author_nickname,
  dg.name as dev_group_name,
  r.name as role_name,
  COUNT(ca.concern_answer_id) as answer_count
FROM concern c
JOIN users u ON c.user_id = u.user_id
JOIN dev_group dg ON c.dev_group_id = dg.dev_group_id
JOIN role r ON u.role_id = r.role_id
LEFT JOIN concern_answer ca ON c.concern_id = ca.concern_id
GROUP BY c.concern_id, c.user_id, c.dev_group_id, c.title, c.content, 
         c.created_at, c.was_good, u.nickname, dg.name, r.name
ORDER BY c.created_at DESC;

SELECT '✅ VIEW 생성 완료!' as message;

