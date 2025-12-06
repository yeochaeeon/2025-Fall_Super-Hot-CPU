-- question_id 시퀀스 재설정 SQL
-- Supabase SQL Editor에서 실행하세요

-- 현재 question 테이블의 최대 question_id 확인
SELECT MAX(question_id) FROM question;

-- 시퀀스를 현재 최대값 + 1로 재설정
SELECT setval('question_question_id_seq', (SELECT COALESCE(MAX(question_id), 0) + 1 FROM question), false);

