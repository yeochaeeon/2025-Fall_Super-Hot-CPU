# 3. 기능 (Functions)

> ※ 각 기능이 어떤 사용자를 위한 것이며, 어떤 SQL feature를 사용하는지 명시해주세요.

본 프로젝트의 기능은 CPU 온도 측정 및 랭킹, 권한 기반의 커뮤니티 상호작용을 중심으로 구성되며, **4단계 역할(Role) 체계**와 밀접하게 연동되어 있습니다.

---

## 1. CPU 온도 측정 및 랭킹 기능 (정량화 및 경쟁)

| **기능 분류**          | **대상 사용자**                                           | **설명**                                                                                                                                                                                                                                                            | **SQL Feature**                                                                                                            | **주요 테이블**                                                                  |
| :--------------------- | :-------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| **CPU 온도 측정**      | Developer, Optimizer, Root<br>(Hot Developer는 당일 제외) | 매일 직군별 질문에 답변을 등록하고, 가중치 기반으로 스트레스 지수(CPU 온도)를 계산하여 저장합니다.<br>• 공통 질문 4개 (50% 가중치)<br>• 직군별 질문 4개 (30% 가중치)<br>• Hot Developer 특별 질문 2개 (20% 가중치)<br>• 수면시간은 역방향 계산 (적을수록 높은 점수) | `INSERT`, `UPSERT`, `SELECT`, `AGGREGATE` (`MAX`, `MIN`), `WHERE`, `UNIQUE CONSTRAINT`, `JOIN`, `ORDER BY`                 | `question`, `daily_answer`, `daily_score`, `user_badge`, `badge`                 |
| **랭킹 조회 (오늘)**   | 전 사용자                                                 | 오늘 날짜의 CPU 온도 랭킹을 조회합니다.<br>• 전체 랭킹 / 직군별 랭킹 필터링<br>• TOP 20명 조회<br>• 사용자 정보, 배지, 공통 질문 답변 포함                                                                                                                          | `VIEW` (`today_ranking_view`), `SELECT`, `JOIN`, `ORDER BY`, `LIMIT`, `WHERE`, `DATE` 함수                                 | `today_ranking_view`, `users`, `dev_group`, `role`, `user_badge`, `daily_answer` |
| **랭킹 조회 (누적)**   | 전 사용자                                                 | 모든 날짜의 평균 CPU 온도를 계산하여 누적 랭킹을 조회합니다.<br>• 사용자별 평균 점수 계산<br>• 공통 질문 답변의 평균값 포함                                                                                                                                         | `VIEW` (`total_ranking_view`), `SELECT`, `JOIN`, `GROUP BY`, `AGGREGATE` (`AVG`), `ORDER BY`, `LIMIT`                      | `total_ranking_view`, `users`, `dev_group`, `role`, `user_badge`, `daily_answer` |
| **Hot Developer 선정** | 시스템 (Cron Job)                                         | 매일 자정, 전날 직군별 CPU 온도 1위 유저를 선정하고 해당 유저의 역할을 변경합니다.<br>• 동점자 처리: 전날 CPU 온도를 가장 먼저 측정한 사용자 우선<br>• `hot_developer` 테이블에 기록<br>• `users.role_id` 및 `users.hot_dev_count` 업데이트                         | `SELECT`, `INSERT`, `UPDATE`, `UPSERT`, `JOIN`, `ORDER BY`, `AGGREGATE` (`MAX`), `WHERE`, `DATE` 함수, `UNIQUE CONSTRAINT` | `daily_score`, `users`, `hot_developer`, `dev_group`, `daily_answer`             |
| **칭호(배지) 부여**    | 전 사용자                                                 | 일일 CPU 온도 측정 시, 각 질문별 1등을 기록한 사용자에게 해당 질문의 배지를 자동 부여합니다.<br>• Hot Developer 질문(SPECIAL 카테고리)은 배지 부여 제외<br>• 배지는 하루만 유효 (다음 날 자정에 자동 삭제)<br>• 수면시간은 최소값 기준, 나머지는 최대값 기준        | `SELECT`, `INSERT`, `UPSERT`, `AGGREGATE` (`MAX`, `MIN`), `WHERE`, `UNIQUE CONSTRAINT`                                     | `user_badge`, `badge`, `question`, `daily_answer`                                |

---

## 2. 권한 기반 커뮤니티 기능 (소통 및 지식 공유)

| **기능 분류**        | **대상 사용자**                                 | **설명**                                                                                                                                                                                               | **SQL Feature**                                                                              | **주요 테이블**                                              |
| :------------------- | :---------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------- | :----------------------------------------------------------- |
| **고민 등록**        | Developer, Hot Developer, Root                  | 개발 고충을 고민 게시판에 등록합니다.<br>• Optimizer는 등록 불가                                                                                                                                       | `INSERT`, `DEFAULT`, `FOREIGN KEY`, `Authorization` (역할 기반 접근 제어)                    | `concern`, `users`, `dev_group`                              |
| **고민 답변 작성**   | Optimizer, Root                                 | 등록된 고민에 대해 조언과 답변을 작성합니다.<br>• Optimizer는 **같은 직군의 고민에만** 답변 가능<br>• Root는 모든 직군의 고민에 답변 가능<br>• 답변 작성 시 `users.total_answers` 자동 증가            | `INSERT`, `DEFAULT`, `FOREIGN KEY`, `UPDATE`, `WHERE`, `Authorization` (역할 기반 접근 제어) | `concern_answer`, `concern`, `users`                         |
| **답변 채택**        | 고민 등록자<br>(Developer, Hot Developer, Root) | 받은 답변 중 하나를 반드시 채택해야 합니다.<br>• 미채택 시 CPU 온도 측정 불가<br>• 한 고민당 하나의 답변만 채택 가능 (기존 채택 답변 자동 취소)<br>• 채택 시 `users.total_accepted` 증가, 취소 시 감소 | `UPDATE`, `WHERE`, `JOIN`                                                                    | `concern_answer`, `concern`, `users`                         |
| **밈 등록**          | Developer, Hot Developer, Root                  | 개발 관련 밈(Meme)을 게시판에 등록합니다.<br>• 하루 1회 제한<br>• 이미지 업로드 지원 (Supabase Storage)                                                                                                | `INSERT`, `DEFAULT`, `FOREIGN KEY`                                                           | `meme`, `users`                                              |
| **밈 좋아요 투표**   | 전 사용자 (역할별 차등)                         | 밈 게시물에 좋아요 투표를 합니다.<br>• Developer, Hot Developer, Optimizer: 하루 3개<br>• Root: 하루 6개<br>• 좋아요 취소 가능<br>• `meme_like` 테이블 기준으로 일일 집계                              | `INSERT`, `DELETE`, `UPDATE`, `UNIQUE CONSTRAINT`, `WHERE`, `COUNT`                          | `meme_like`, `meme`, `user_daily_like`                       |
| **밈 게시판 조회**   | 전 사용자                                       | 밈 목록을 조회합니다.<br>• 좋아요 순 정렬<br>• 직군별 필터링<br>• 최신순 정렬                                                                                                                          | `VIEW` (`popular_memes_view`), `SELECT`, `JOIN`, `ORDER BY`, `WHERE`, `LIMIT`                | `popular_memes_view`, `meme`, `users`, `meme_like`           |
| **고민 게시판 조회** | 전 사용자                                       | 고민 목록을 조회합니다.<br>• 최신순 정렬<br>• 직군별 필터링<br>• 답변 수 집계                                                                                                                          | `VIEW` (`recent_concerns_view`), `SELECT`, `JOIN`, `ORDER BY`, `WHERE`, `LIMIT`, `COUNT`     | `recent_concerns_view`, `concern`, `users`, `concern_answer` |

---

## 3. Root 특권 기능 (운영 및 정책 결정)

| **기능 분류**        | **대상 사용자** | **설명**                                                                                                                                                          | **SQL Feature**                            | **주요 테이블**                   |
| :------------------- | :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------- | :-------------------------------- |
| **가중치 로직 변경** | Root            | CPU 온도 계산에 사용되는 질문별 가중치를 조정합니다.<br>• 한 질문의 가중치 증가 시 다른 질문의 가중치 감소<br>• 총 가중치 합계 100% 유지<br>• 변경 이력 자동 기록 | `TRANSACTION`, `UPDATE`, `INSERT`, `WHERE` | `question`, `question_weight_log` |
| **질문 목록 조회**   | Root            | 모든 활성 질문의 가중치를 조회합니다.<br>• Hot Developer 질문(SPECIAL) 제외                                                                                       | `SELECT`, `JOIN`, `WHERE`, `ORDER BY`      | `question`, `dev_group`, `badge`  |

---

## 4. 역할 자동 변경 기능 (승급/강등)

| **기능 분류**                 | **대상 사용자**   | **설명**                                                                                                                                                                                           | **SQL Feature**                                                                                       | **주요 테이블**                                                      |
| :---------------------------- | :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------- |
| **Hot Developer 선정**        | 시스템 (Cron Job) | 매일 자정, 전날 직군별 CPU 온도 1위를 Hot Developer로 선정합니다.<br>• 동점자 처리: 전날 CPU 온도를 가장 먼저 측정한 사용자<br>• 기존 Hot Developer 역할 변경 (Developer 복귀 또는 Optimizer 승급) | `SELECT`, `INSERT`, `UPDATE`, `UPSERT`, `JOIN`, `ORDER BY`, `AGGREGATE` (`MAX`), `WHERE`, `DATE` 함수 | `daily_score`, `users`, `hot_developer`, `dev_group`, `daily_answer` |
| **Optimizer 승급**            | 시스템 (Cron Job) | Hot Developer 누적 10회 **AND** 고유 칭호 5개 이상 획득 시 Optimizer로 승급합니다.                                                                                                                 | `SELECT`, `UPDATE`, `JOIN`, `WHERE`, `COUNT` (집계), `GROUP BY`                                       | `users`, `role`, `user_badge`                                        |
| **Root 승급**                 | 시스템 (Cron Job) | Optimizer 역할 **AND** 답변 50회 이상 **AND** 채택률 80% 이상 시 Root로 승급합니다.                                                                                                                | `SELECT`, `UPDATE`, `WHERE`, `AGGREGATE` (계산)                                                       | `users`, `role`                                                      |
| **Optimizer 강등**            | 시스템 (Cron Job) | Optimizer 역할 **AND** 답변 10회 이상 **AND** 미채택률 80% 이상 시 Developer로 강등합니다.<br>• 강등 시 `hot_dev_count` 초기화                                                                     | `SELECT`, `UPDATE`, `WHERE`, `AGGREGATE` (계산)                                                       | `users`, `role`                                                      |
| **배지 자동 삭제**            | 시스템 (Cron Job) | 어제 이전의 모든 배지를 삭제합니다.<br>• 배지는 하루만 유효                                                                                                                                        | `DELETE`, `WHERE`, `DATE` 함수                                                                        | `user_badge`                                                         |
| **Hot Developer 질문 초기화** | 시스템 (Cron Job) | 모든 SPECIAL 카테고리의 질문을 비활성화하고 `dev_group_id`를 NULL로 변경합니다.<br>• 새로운 Hot Developer가 오늘 질문을 작성할 수 있도록                                                           | `UPDATE`, `WHERE`                                                                                     | `question`                                                           |

---

## 5. 대시보드 요약 기능

| **기능 분류**     | **대상 사용자** | **설명**                                                           | **SQL Feature**                                                                                                                                                                        | **주요 테이블**                                                                                                                                      |
| :---------------- | :-------------- | :----------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **대시보드 요약** | 전 사용자       | 오늘의 Hot CPU, Hot 직군, 인기 밈, 최신 고민을 한 번에 조회합니다. | `VIEW` (`today_hot_cpu_view`, `dev_group_today_avg_view`, `popular_memes_view`, `recent_concerns_view`), `SELECT`, `JOIN`, `ORDER BY`, `LIMIT`, `AGGREGATE` (`MAX`, `AVG`), `GROUP BY` | `today_hot_cpu_view`, `dev_group_today_avg_view`, `popular_memes_view`, `recent_concerns_view`, `daily_score`, `users`, `user_badge`, `daily_answer` |

---

## SQL Feature 상세 설명

### 1. VIEW (뷰) 사용

프로젝트에서 복잡한 조회 쿼리를 최적화하기 위해 6개의 VIEW를 생성하여 사용합니다:

- **`today_ranking_view`**: 오늘의 랭킹 조회
- **`total_ranking_view`**: 누적 랭킹 조회 (평균 계산)
- **`dev_group_today_avg_view`**: 직군별 오늘의 평균 온도
- **`today_hot_cpu_view`**: 오늘의 Hot CPU 사용자
- **`popular_memes_view`**: 인기 밈 목록 (좋아요 순)
- **`recent_concerns_view`**: 최신 고민 목록 (답변 수 포함)

**장점**: 쿼리 최적화, 재사용성, 유지보수성 향상

### 2. 트랜잭션 (TRANSACTION) 사용

데이터 무결성을 보장하기 위해 다음 기능에서 트랜잭션을 사용합니다:

- **Hot Developer 질문 작성**: 기존 질문 비활성화 + 새 질문 생성 (원자성 보장)
- **질문 가중치 조정**: 두 질문의 가중치 동시 변경 + 이력 로깅 (총합 100% 무결성)

**트랜잭션 미사용 기능**:

- 답변 채택: 순차적 UPDATE (원자성 보장 불필요)
- 밈 좋아요: 단순 INSERT/DELETE (UNIQUE 제약으로 중복 방지)

### 3. 집계 함수 (AGGREGATE Functions)

- **MAX/MIN**: CPU 온도 최고값/최저값 계산 (점수 정규화 및 배지 부여)
- **AVG**: 누적 랭킹 평균 점수 계산
- **COUNT**: 답변 수, 좋아요 수 집계

### 4. UPSERT 사용

중복 방지 및 업데이트를 위해 UPSERT를 사용합니다:

- **CPU 온도 측정**: `daily_answer` 테이블에 일일 중복 답변 방지
- **Hot Developer 선정**: `hot_developer` 테이블에 직군당 일일 1명만 선정
- **배지 부여**: `user_badge` 테이블에 일일 중복 배지 방지

### 5. 권한 기반 접근 제어 (Authorization)

모든 기능에서 역할 기반 접근 제어를 구현합니다:

- **애플리케이션 레벨 검증**: API 엔드포인트에서 `users.role.name` 기반 권한 검증
- **조건부 접근**: 역할별로 다른 제약사항 적용 (예: Optimizer는 같은 직군의 고민에만 답변 가능)
- **동적 제한**: 역할별 일일 좋아요 제한 차등 적용

### 6. 인덱스 활용

조회 성능 최적화를 위해 여러 인덱스를 사용합니다:

- `daily_score(score_date, cpu_score DESC)`: 랭킹 조회 최적화
- `daily_answer(answer_date)`: 날짜별 답변 조회 최적화
- `user_badge(granted_date)`: 배지 조회 최적화
- `question(category, dev_group_id)`: 질문 조회 최적화

---

## 데이터 무결성 보장 메커니즘

1. **UNIQUE 제약**

   - `users.nickname`: 닉네임 중복 방지
   - `daily_answer(user_id, question_id, answer_date)`: 일일 중복 답변 방지
   - `hot_developer(dev_group_id, effective_date)`: 직군당 일일 1명만 선정

2. **FOREIGN KEY 제약**

   - 모든 관계 테이블에서 참조 무결성 보장
   - `ON DELETE RESTRICT`: 참조 데이터 보호
   - `ON UPDATE CASCADE`: 부모 키 변경 시 자동 업데이트

3. **트랜잭션**

   - 가중치 변경, Hot Developer 질문 작성 시 원자성 보장

4. **애플리케이션 레벨 검증**
   - 역할별 권한, 제약사항을 API에서 엄격히 검증

---

## 주요 기능별 데이터 흐름

### CPU 온도 측정 흐름

1. 질문 조회 (`question` 테이블)
2. 답변 저장 (`daily_answer` 테이블, UPSERT)
3. 최대값/최소값 집계 (`AGGREGATE` 함수)
4. 점수 계산 (애플리케이션 레벨)
5. 점수 저장 (`daily_score` 테이블, UPSERT)
6. 배지 부여 (`user_badge` 테이블, UPSERT)

### Hot Developer 선정 흐름

1. 전날 `daily_score` 조회 (직군별)
2. 최고 점수 사용자 선정 (`ORDER BY`, `AGGREGATE MAX`)
3. 동점자 처리 (`daily_answer.created_at` 기준 정렬)
4. `hot_developer` 테이블에 기록 (UPSERT)
5. `users.role_id` 및 `users.hot_dev_count` 업데이트
6. 기존 Hot Developer 역할 변경

### 역할 승급 흐름

1. `users` 테이블 집계 필드 조회
2. 승급 조건 계산 (애플리케이션 레벨)
3. `users.role_id` 업데이트
4. 관련 필드 초기화 (강등 시)
