# 3. 기능 (Functions)

## 주요 기능 및 SQL Feature 사용 현황

| 기능명 | 대상 사용자 | 사용 SQL Feature | 주요 테이블 | 설명 |
|:---|:---|:---|:---|:---|
| **회원가입** | 신규 사용자 | `INSERT`, `UNIQUE CONSTRAINT`, `FOREIGN KEY`, `DEFAULT` | `users`, `dev_group`, `role` | 닉네임 중복 체크(`UNIQUE`), 기본 역할 자동 할당(`DEFAULT`) |
| **로그인** | 모든 사용자 | `SELECT`, `WHERE`, `JOIN` | `users`, `role`, `dev_group` | 닉네임/비밀번호 검증, 사용자 정보 조회 |
| **CPU 온도 측정** | Developer, Hot Developer(당일 제외), Root | `SELECT`, `INSERT`, `UPDATE`, `UPSERT`, `AGGREGATE` (`MAX`, `MIN`), `WHERE`, `ORDER BY`, `GROUP BY`, `UNIQUE CONSTRAINT` | `question`, `daily_answer`, `daily_score`, `user_badge`, `badge` | 질문 조회, 답변 저장(`UPSERT`), 점수 계산(집계 함수), 배지 부여 |
| **오늘의 랭킹 조회** | 모든 사용자 | `SELECT`, `VIEW`, `JOIN`, `ORDER BY`, `LIMIT`, `WHERE`, `DATE` 함수, `AGGREGATE` | `today_ranking_view`, `daily_score`, `users`, `dev_group`, `role`, `user_badge`, `daily_answer` | VIEW를 통한 랭킹 조회, 날짜별 점수 조회, 정렬, TOP 20 추출 |
| **누적 랭킹 조회** | 모든 사용자 | `SELECT`, `VIEW`, `JOIN`, `GROUP BY`, `AGGREGATE` (`AVG`), `ORDER BY`, `LIMIT`, `WHERE` | `total_ranking_view`, `daily_score`, `users`, `dev_group`, `role`, `user_badge`, `daily_answer` | VIEW를 통한 평균 점수 계산, 그룹화, 정렬 |
| **대시보드 요약** | 모든 사용자 | `SELECT`, `VIEW`, `JOIN`, `ORDER BY`, `LIMIT`, `WHERE`, `DATE` 함수, `AGGREGATE` (`MAX`, `AVG`), `GROUP BY` | `today_hot_cpu_view`, `dev_group_today_avg_view`, `popular_memes_view`, `recent_concerns_view`, `daily_score`, `users`, `dev_group`, `role`, `user_badge`, `daily_answer`, `meme`, `concern` | VIEW를 통한 오늘의 Hot CPU, Hot 직군, 인기 밈, 최신 고민 조회 |
| **밈 게시판 조회** | 모든 사용자 | `SELECT`, `VIEW`, `JOIN`, `ORDER BY`, `WHERE`, `LIMIT`, `COUNT` | `popular_memes_view`, `meme`, `users`, `meme_like` | VIEW를 통한 밈 목록 조회, 좋아요 순 정렬, 필터링 |
| **밈 등록** | Developer, Hot Developer, Root | `INSERT`, `DEFAULT`, `FOREIGN KEY` | `meme`, `users` | 밈 생성, 작성자 정보 저장 |
| **밈 좋아요** | 모든 사용자 | `INSERT`, `DELETE`, `UPDATE`, `UNIQUE CONSTRAINT`, `WHERE`, `COUNT` | `meme_like`, `meme`, `user_daily_like` | 좋아요 토글, 좋아요 수 업데이트, 일일 제한 체크 |
| **고민 게시판 조회** | 모든 사용자 | `SELECT`, `VIEW`, `JOIN`, `ORDER BY`, `WHERE`, `LIMIT`, `COUNT` | `recent_concerns_view`, `concern`, `users`, `dev_group`, `role`, `concern_answer` | VIEW를 통한 고민 목록 조회, 필터링(직군별), 답변 수 집계 |
| **고민 등록** | Developer, Hot Developer, Root | `INSERT`, `DEFAULT`, `FOREIGN KEY`, `CHECK CONSTRAINT` | `concern`, `users`, `dev_group` | 고민 생성, 작성자 정보 저장 |
| **고민 답변 등록** | Optimizer, Root | `INSERT`, `DEFAULT`, `FOREIGN KEY`, `UPDATE`, `WHERE` | `concern_answer`, `concern`, `users` | 답변 생성, 작성자 `total_answers` 증가 |
| **답변 채택/비채택** | Developer, Hot Developer, Root (고민 작성자만) | `UPDATE`, `WHERE`, `JOIN` | `concern_answer`, `concern`, `users` | 답변 채택 상태 변경, 작성자 `total_accepted` 증가 |
| **Hot Developer 특별 질문 작성** | Hot Developer (당일 선정자만) | `SELECT`, `INSERT`, `UPDATE`, `TRANSACTION`, `WHERE`, `UNIQUE CONSTRAINT` | `question`, `hot_developer` | 기존 질문 비활성화 + 새 질문 생성(트랜잭션) |
| **Hot Developer 선정** | 시스템 (Cron Job) | `SELECT`, `INSERT`, `UPDATE`, `UPSERT`, `JOIN`, `ORDER BY`, `AGGREGATE` (`MAX`), `WHERE`, `DATE` 함수, `UNIQUE CONSTRAINT` | `daily_score`, `users`, `hot_developer`, `dev_group`, `daily_answer` | 전날 직군별 1위 선정, 동점자 처리(최초 측정 시간 기준) |
| **역할 승급 (Optimizer)** | 시스템 (Cron Job) | `SELECT`, `UPDATE`, `JOIN`, `WHERE`, `COUNT` (집계), `GROUP BY` | `users`, `role`, `user_badge` | Hot Developer 10회 + 칭호 5개 조건 체크 |
| **역할 승급 (Root)** | 시스템 (Cron Job) | `SELECT`, `UPDATE`, `WHERE`, `AGGREGATE` (계산) | `users`, `role` | Optimizer + 답변 50회 이상 + 채택률 80% 이상 |
| **역할 강등 (Optimizer)** | 시스템 (Cron Job) | `SELECT`, `UPDATE`, `WHERE`, `AGGREGATE` (계산) | `users`, `role` | Optimizer + 답변 10회 이상 + 미채택률 80% 이상 |
| **배지 자동 삭제** | 시스템 (Cron Job) | `DELETE`, `WHERE`, `DATE` 함수 | `user_badge` | 어제 이전 배지 삭제(하루만 유효) |
| **질문 가중치 조정** | Root | `SELECT`, `UPDATE`, `INSERT`, `TRANSACTION`, `WHERE` | `question`, `question_weight_log` | 질문 가중치 변경 및 이력 기록(트랜잭션) |
| **이미지 업로드** | Developer, Hot Developer, Root | `INSERT`, `UPDATE` | `meme` | Supabase Storage 연동, 이미지 URL 저장 |

## SQL Feature 상세 설명

### 1. 데이터 조작 언어 (DML)
- **SELECT**: 모든 조회 기능에서 사용
- **INSERT**: 회원가입, 밈/고민 등록, 답변 작성 등
- **UPDATE**: 점수 업데이트, 좋아요 수 변경, 역할 변경 등
- **DELETE**: 배지 삭제, 좋아요 취소 등
- **UPSERT**: 중복 방지 및 업데이트 (CPU 온도 측정, Hot Developer 선정)

### 2. 데이터 정의 언어 (DDL)
- **UNIQUE CONSTRAINT**: 닉네임 중복 방지, 일일 중복 답변 방지
- **FOREIGN KEY**: 테이블 간 참조 무결성 보장
- **PRIMARY KEY**: 기본키 설정 (단일/복합)
- **INDEX**: 조회 성능 최적화 (날짜, 사용자별 인덱스)
- **ENUM**: 질문 카테고리 타입 정의 (`COMMON`, `dev`, `SPECIAL`)
- **DEFAULT**: 기본값 설정 (생성일시, 역할, 카운트 등)

### 3. 집계 함수 (Aggregate Functions)
- **MAX/MIN**: CPU 온도 최고값/최저값 계산 (점수 정규화)
- **AVG**: 누적 랭킹 평균 점수 계산
- **COUNT**: 답변 수, 좋아요 수 집계

### 4. 조인 (JOIN)
- **INNER JOIN**: 사용자-역할-직군 정보 조회
- **LEFT JOIN**: 관련 데이터가 없어도 조회 (Prisma `include`)

### 9. 뷰 (VIEW)
- **today_ranking_view**: 오늘의 랭킹 조회 최적화
- **total_ranking_view**: 누적 랭킹 평균 계산
- **dev_group_today_avg_view**: 직군별 오늘의 평균 온도
- **today_hot_cpu_view**: 오늘의 Hot CPU 사용자
- **popular_memes_view**: 인기 밈 목록 (좋아요 순)
- **recent_concerns_view**: 최신 고민 목록 (답변 수 포함)

### 5. 트랜잭션 (Transaction)
- **Hot Developer 질문 작성**: 기존 질문 비활성화 + 새 질문 생성 (원자성 보장)
- **질문 가중치 조정**: 가중치 변경 + 이력 로깅 (원자성 보장)

### 6. 날짜 함수
- **DATE 비교**: 오늘/어제 날짜 기준 조회
- **KST 변환**: 한국 시간 기준 날짜 계산

### 7. 정렬 및 제한
- **ORDER BY**: 랭킹 정렬, 최신순 정렬
- **LIMIT/TAKE**: TOP N 추출

### 8. 조건부 쿼리
- **WHERE**: 필터링 (직군별, 날짜별, 역할별)
- **GROUP BY**: 직군별 평균 계산

## 주요 제약 조건 (Constraints)

1. **UNIQUE 제약**
   - `users.nickname`: 닉네임 중복 방지
   - `daily_answer(user_id, question_id, answer_date)`: 일일 중복 답변 방지
   - `hot_developer(dev_group_id, effective_date)`: 직군당 일일 1명만 선정

2. **FOREIGN KEY 제약**
   - 모든 관계 테이블에서 참조 무결성 보장
   - `ON DELETE RESTRICT`: 참조 데이터 보호
   - `ON UPDATE CASCADE`: 부모 키 변경 시 자동 업데이트

3. **CHECK 제약**
   - 역할별 권한 검증 (애플리케이션 레벨)

## 성능 최적화

1. **인덱스 활용**
   - `daily_score(score_date, cpu_score)`: 랭킹 조회 최적화
   - `daily_answer(answer_date)`: 날짜별 조회 최적화
   - `user_badge(granted_date)`: 배지 조회 최적화

2. **집계 쿼리 최적화**
   - N+1 문제 해결을 위한 `include` 사용
   - 병렬 쿼리 실행 (`Promise.all`)

---

## 4. VIEW, INDEX, AUTHORIZATION 사용 현황

### 4.1 VIEW (뷰)

**사용 여부**: ✅ **사용 중**

프로젝트에서 복잡한 조회 쿼리를 최적화하고 재사용성을 높이기 위해 여러 VIEW를 생성하여 사용합니다.

#### 생성된 VIEW 목록

| VIEW명 | 용도 | 사용 위치 |
|:---|:---|:---|
| `today_ranking_view` | 오늘의 CPU 온도 랭킹 조회 | `/api/rankings/today` |
| `total_ranking_view` | 누적 평균 CPU 온도 랭킹 조회 | `/api/rankings/total` |
| `dev_group_today_avg_view` | 직군별 오늘의 평균 온도 | `/api/dashboard/summary` |
| `today_hot_cpu_view` | 오늘의 Hot CPU 사용자 | `/api/dashboard/summary` |
| `popular_memes_view` | 인기 밈 목록 (좋아요 순) | `/api/dashboard/summary` |
| `recent_concerns_view` | 최신 고민 목록 | `/api/dashboard/summary` |

#### VIEW 생성 SQL

```sql
-- 1. 오늘의 랭킹 뷰
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

-- 2. 누적 랭킹 뷰
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

-- 3. 직군별 오늘의 평균 온도 뷰
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

-- 4. 오늘의 Hot CPU 사용자 뷰
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

-- 5. 인기 밈 뷰
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

-- 6. 최신 고민 뷰
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
```

#### VIEW 사용 예시 (API 코드)

```typescript
// app/api/rankings/today/route.ts
const viewRankings = await prisma.$queryRawUnsafe<Array<{
  user_id: number;
  score_date: Date;
  cpu_score: number;
  nickname: string;
  role_id: number;
  dev_group_id: number;
  dev_group_name: string;
  role_name: string;
}>>(`SELECT * FROM today_ranking_view LIMIT 20`);
```

#### VIEW 사용의 장점

1. **쿼리 최적화**: 복잡한 JOIN과 집계를 데이터베이스 레벨에서 처리
2. **재사용성**: 동일한 쿼리 로직을 여러 API에서 재사용
3. **유지보수성**: 쿼리 로직 변경 시 VIEW만 수정하면 모든 사용처에 반영
4. **성능 향상**: 데이터베이스 엔진의 최적화 기능 활용
5. **가독성**: 복잡한 쿼리를 간단한 SELECT로 표현

---

### 4.2 INDEX (인덱스)

**사용 여부**: ✅ **사용 중**

프로젝트에서 성능 최적화를 위해 여러 인덱스를 정의하고 사용합니다.

#### 인덱스 목록

| 테이블 | 인덱스명 | 컬럼 | 용도 |
|:---|:---|:---|:---|
| `daily_answer` | `daily_answer_answer_date_idx` | `answer_date` | 날짜별 답변 조회 최적화 |
| `daily_answer` | `daily_answer_user_id_answer_date_idx` | `user_id`, `answer_date` | 사용자별 일일 답변 조회 |
| `daily_answer` | `daily_answer_question_id_answer_date_idx` | `question_id`, `answer_date` | 질문별 일일 답변 집계 |
| `daily_score` | `daily_score_score_date_idx` | `score_date` | 날짜별 점수 조회 |
| `daily_score` | `daily_score_score_date_cpu_score_idx` | `score_date`, `cpu_score DESC` | 랭킹 조회 최적화 (정렬 포함) |
| `user_badge` | `user_badge_user_id_granted_date_idx` | `user_id`, `granted_date` | 사용자별 배지 조회 |
| `user_badge` | `user_badge_granted_date_idx` | `granted_date` | 날짜별 배지 조회 |
| `question` | `question_category_idx` | `category` | 카테고리별 질문 조회 |
| `question` | `question_category_dev_group_id_idx` | `category`, `dev_group_id` | 카테고리+직군별 질문 조회 |
| `meme` | `meme_created_at_idx` | `created_at DESC` | 최신 밈 조회 최적화 |
| `concern` | `concern_created_at_idx` | `created_at DESC` | 최신 고민 조회 최적화 |

#### 인덱스 생성 SQL

```sql
-- daily_answer 테이블 인덱스
CREATE INDEX IF NOT EXISTS "daily_answer_answer_date_idx" 
  ON "daily_answer"("answer_date");
CREATE INDEX IF NOT EXISTS "daily_answer_user_id_answer_date_idx" 
  ON "daily_answer"("user_id", "answer_date");
CREATE INDEX IF NOT EXISTS "daily_answer_question_id_answer_date_idx" 
  ON "daily_answer"("question_id", "answer_date");

-- daily_score 테이블 인덱스
CREATE INDEX IF NOT EXISTS "daily_score_score_date_idx" 
  ON "daily_score"("score_date");
CREATE INDEX IF NOT EXISTS "daily_score_score_date_cpu_score_idx" 
  ON "daily_score"("score_date", "cpu_score" DESC);

-- user_badge 테이블 인덱스
CREATE INDEX IF NOT EXISTS "user_badge_user_id_granted_date_idx" 
  ON "user_badge"("user_id", "granted_date");
CREATE INDEX IF NOT EXISTS "user_badge_granted_date_idx" 
  ON "user_badge"("granted_date");

-- question 테이블 인덱스
CREATE INDEX IF NOT EXISTS "question_category_idx" 
  ON "question"("category");
CREATE INDEX IF NOT EXISTS "question_category_dev_group_id_idx" 
  ON "question"("category", "dev_group_id");

-- meme 테이블 인덱스
CREATE INDEX IF NOT EXISTS "meme_created_at_idx" 
  ON "meme"("created_at" DESC);

-- concern 테이블 인덱스
CREATE INDEX IF NOT EXISTS "concern_created_at_idx" 
  ON "concern"("created_at" DESC);
```

#### 인덱스 효과

- **랭킹 조회 성능 향상**: `daily_score(score_date, cpu_score DESC)` 인덱스로 정렬 비용 감소
- **날짜별 조회 최적화**: 날짜 기반 필터링이 빈번한 쿼리 성능 개선
- **JOIN 성능 향상**: 외래키 인덱스로 관계 조회 최적화

---

### 4.3 AUTHORIZATION (권한 관리)

**사용 여부**: ✅ **사용 중** (애플리케이션 레벨 구현)

프로젝트는 **역할 기반 접근 제어(RBAC: Role-Based Access Control)**를 구현하여 사용자 권한을 관리합니다.

#### 권한 시스템 구조

**데이터베이스 구조:**
- `role` 테이블: 역할 정의 (Developer, Hot Developer, Optimizer, Root)
- `users.role_id`: 사용자의 현재 역할 (FOREIGN KEY)
- 역할별 권한은 애플리케이션 레벨에서 검증

#### 역할별 권한 매트릭스

| 기능 | Developer | Hot Developer | Optimizer | Root |
|:---|:---:|:---:|:---:|:---:|
| **CPU 온도 측정** | ✅ (당일 가능) | ❌ (당일 불가) | ✅ | ✅ |
| **고민 등록** | ✅ | ✅ | ❌ | ✅ |
| **고민 답변** | ❌ | ❌ | ✅ (같은 직군만) | ✅ (모든 직군) |
| **답변 채택** | ✅ (본인 고민만) | ✅ (본인 고민만) | ❌ | ✅ (모든 고민) |
| **밈 등록** | ✅ (하루 1회) | ✅ (하루 1회) | ✅ (하루 1회) | ✅ |
| **밈 좋아요** | ✅ (하루 3회) | ✅ (하루 3회) | ✅ (하루 3회) | ✅ |
| **특별 질문 작성** | ❌ | ✅ (당일 선정자만) | ❌ | ❌ |
| **질문 가중치 조정** | ❌ | ❌ | ❌ | ✅ |

#### 권한 검증 구현 예시

**1. 고민 등록 권한 검증**
```typescript
// app/api/questions/route.ts
const allowedRoles = ["Developer", "Hot Developer", "Root"];
if (!allowedRoles.includes(user.role.name)) {
  return NextResponse.json(
    { error: "고민 등록 권한이 없습니다." },
    { status: 403 }
  );
}
```

**2. 고민 답변 권한 검증**
```typescript
// app/api/questions/[id]/answers/route.ts
const allowedRoles = ["Optimizer", "Root"];
if (!allowedRoles.includes(user.role.name)) {
  return NextResponse.json(
    { error: "답변 작성 권한이 없습니다." },
    { status: 403 }
  );
}

// Optimizer는 같은 직군의 고민에만 답변 가능
if (user.role.name === "Optimizer" && 
    user.dev_group_id !== concern.dev_group_id) {
  return NextResponse.json(
    { error: "같은 직군의 고민에만 답변할 수 있습니다." },
    { status: 403 }
  );
}
```

**3. Hot Developer 특별 질문 작성 권한 검증**
```typescript
// app/api/hot-developer/questions/route.ts
if (user.role.name !== "Hot Developer") {
  return NextResponse.json(
    { error: "Hot Developer만 접근할 수 있습니다." },
    { status: 403 }
  );
}

// 오늘 Hot Developer로 선정되었는지 확인
const hotDevRecord = await prisma.hot_developer.findUnique({
  where: {
    dev_group_id_effective_date: {
      dev_group_id: user.dev_group_id,
      effective_date: today,
    },
  },
});

if (!hotDevRecord || hotDevRecord.user_id !== user.user_id) {
  return NextResponse.json(
    { error: "오늘 Hot Developer로 선정되지 않았습니다." },
    { status: 403 }
  );
}
```

**4. Root 권한 검증 (질문 가중치 조정)**
```typescript
// app/api/admin/questions/adjust-weight/route.ts
if (user.role.name !== "Root") {
  return NextResponse.json(
    { error: "Root만 접근할 수 있습니다." },
    { status: 403 }
  );
}
```

#### 권한 검증이 적용된 주요 기능

| 기능 | 권한 검증 위치 | 검증 내용 |
|:---|:---|:---|
| 고민 등록 | `/api/questions` (POST) | Developer, Hot Developer, Root만 가능 |
| 고민 답변 | `/api/questions/[id]/answers` (POST) | Optimizer, Root만 가능 (Optimizer는 같은 직군만) |
| 답변 채택 | `/api/questions/[id]/answers/[answerId]/accept` (PATCH) | 고민 작성자만 가능 |
| CPU 온도 측정 | `/api/measure/submit` (POST) | Hot Developer는 당일 불가 |
| 특별 질문 작성 | `/api/hot-developer/questions` (POST) | 당일 선정된 Hot Developer만 |
| 질문 가중치 조정 | `/api/admin/questions/*` | Root만 가능 |
| 밈 좋아요 | `/api/memes/[id]/like` (POST) | 역할별 일일 제한 (3개) |

#### 보안 특징

1. **애플리케이션 레벨 권한 검증**: 모든 API 엔드포인트에서 역할 기반 검증 수행
2. **세션 기반 인증**: HTTP-only 쿠키를 통한 사용자 인증
3. **역할 동적 변경**: 승급/강등 시스템으로 역할 자동 업데이트
4. **세밀한 권한 제어**: 기능별, 역할별, 조건별 권한 검증

#### 데이터베이스 레벨 제약

- **FOREIGN KEY**: `users.role_id` → `role.role_id` (참조 무결성)
- **UNIQUE**: `role.name` (역할명 중복 방지)
- **애플리케이션 레벨**: 실제 권한 검증은 API에서 수행 (데이터베이스 트리거 미사용)

