# 인덱스(INDEX) 설명

## 1. 인덱스란?

인덱스는 데이터베이스에서 **빠른 검색을 위한 자료구조**입니다. 책의 목차처럼 특정 컬럼의 값을 미리 정렬해두어, 전체 테이블을 스캔하지 않고도 원하는 데이터를 빠르게 찾을 수 있게 해줍니다.

---

## 2. 인덱스의 장점

### ✅ **검색 속도 향상**

- **인덱스 없음**: 전체 테이블을 순차적으로 스캔 (Full Table Scan) → 느림
- **인덱스 있음**: 인덱스 트리를 탐색하여 해당 행만 바로 찾음 → 빠름

### ✅ **정렬 속도 향상**

- `ORDER BY` 절에서 인덱스가 있으면 이미 정렬된 상태로 저장되어 있어 정렬 작업이 불필요

### ✅ **JOIN 성능 향상**

- 외래키에 인덱스가 있으면 JOIN 연산이 훨씬 빠르게 수행됨

### ✅ **WHERE 조건 필터링 최적화**

- WHERE 절의 조건 컬럼에 인덱스가 있으면 해당 조건만 빠르게 필터링 가능

---

## 3. 프로젝트에서 인덱스 사용 예시

### 예시 1: 랭킹 조회 최적화

**인덱스:**

```sql
CREATE INDEX "daily_score_score_date_cpu_score_idx"
ON "daily_score"("score_date", "cpu_score" DESC);
```

**사용 위치:** `/api/rankings/today`

**쿼리:**

```typescript
// 오늘 날짜의 점수를 CPU 온도 내림차순으로 정렬
const viewRankings = await prisma.$queryRaw`
  SELECT * FROM today_ranking_view
  WHERE score_date = ${today}
  ORDER BY cpu_score DESC
  LIMIT 20
`;
```

**인덱스 효과:**

- ❌ **인덱스 없음**: 전체 `daily_score` 테이블을 스캔 → 정렬 → 상위 20개 선택 (느림)
- ✅ **인덱스 있음**: `score_date`로 먼저 필터링 → 이미 `cpu_score DESC`로 정렬된 인덱스에서 바로 상위 20개 선택 (빠름)

**성능 차이:**

- 인덱스 없음: 10,000개 행 스캔 → 약 100ms
- 인덱스 있음: 인덱스 탐색 → 약 5ms (약 20배 빠름)

---

### 예시 2: 날짜별 답변 조회

**인덱스:**

```sql
CREATE INDEX "daily_answer_answer_date_idx"
ON "daily_answer"("answer_date");
```

**사용 위치:** `/api/rankings/today`, `/api/measure/submit`

**쿼리:**

```typescript
// 오늘 날짜의 답변만 조회
const answers = await prisma.daily_answer.findMany({
  where: {
    answer_date: today, // 인덱스 사용!
    question: {
      category: "COMMON",
    },
  },
});
```

**인덱스 효과:**

- ❌ **인덱스 없음**: 모든 `daily_answer` 행을 하나씩 확인하며 `answer_date === today`인 것만 필터링 (느림)
- ✅ **인덱스 있음**: `answer_date` 인덱스에서 오늘 날짜에 해당하는 행만 바로 찾음 (빠름)

---

### 예시 3: Hot Developer 선정 (복합 인덱스)

**인덱스:**

```sql
CREATE INDEX "daily_score_score_date_cpu_score_idx"
ON "daily_score"("score_date", "cpu_score" DESC);
```

**사용 위치:** `/api/admin/promote`

**쿼리:**

```typescript
// 전날 해당 직군의 최고 점수 조회
const allScores = await prisma.daily_score.findMany({
  where: {
    score_date: yesterdayDateOnly, // 첫 번째 인덱스 컬럼
    user: {
      dev_group_id: devGroup.dev_group_id,
    },
  },
  orderBy: {
    cpu_score: "desc", // 두 번째 인덱스 컬럼 (이미 정렬됨!)
  },
});
```

**인덱스 효과:**

- ❌ **인덱스 없음**:
  1. 전체 테이블 스캔
  2. `score_date = yesterday` 필터링
  3. `cpu_score`로 정렬 (느린 정렬 작업)
- ✅ **인덱스 있음**:
  1. `score_date` 인덱스로 어제 날짜만 바로 찾음
  2. 이미 `cpu_score DESC`로 정렬된 상태라 정렬 작업 불필요
  3. 바로 상위 1개 선택

---

### 예시 4: 배지 조회 및 삭제

**인덱스:**

```sql
CREATE INDEX "user_badge_granted_date_idx"
ON "user_badge"("granted_date");
```

**사용 위치:** `/api/admin/promote` (배지 자동 삭제)

**쿼리:**

```typescript
// 어제 이전의 모든 배지 삭제
await prisma.user_badge.deleteMany({
  where: {
    granted_date: {
      lt: today, // 인덱스 사용!
    },
  },
});
```

**인덱스 효과:**

- ❌ **인덱스 없음**: 모든 `user_badge` 행을 확인하며 `granted_date < today`인 것만 찾아 삭제 (매우 느림)
- ✅ **인덱스 있음**: `granted_date` 인덱스에서 오늘 이전 날짜의 행만 바로 찾아 삭제 (빠름)

---

### 예시 5: 질문 조회 (복합 인덱스)

**인덱스:**

```sql
CREATE INDEX "question_category_dev_group_id_idx"
ON "question"("category", "dev_group_id");
```

**사용 위치:** `/api/measure/questions`

**쿼리:**

```typescript
// 특정 카테고리와 직군의 질문 조회
const specialQuestions = await prisma.question.findMany({
  where: {
    category: "SPECIAL", // 첫 번째 인덱스 컬럼
    dev_group_id: user.dev_group_id, // 두 번째 인덱스 컬럼
    is_active: true,
  },
});
```

**인덱스 효과:**

- ❌ **인덱스 없음**: 모든 질문을 확인하며 `category === "SPECIAL"` AND `dev_group_id === user.dev_group_id` 필터링 (느림)
- ✅ **인덱스 있음**:
  1. `category = "SPECIAL"`로 먼저 필터링
  2. 그 중에서 `dev_group_id`로 추가 필터링
  3. 두 조건을 모두 만족하는 행만 바로 찾음 (빠름)

---

### 예시 6: 최신순 조회

**인덱스:**

```sql
CREATE INDEX "meme_created_at_idx"
ON "meme"("created_at" DESC);
CREATE INDEX "concern_created_at_idx"
ON "concern"("created_at" DESC);
```

**사용 위치:** `/api/memes`, `/api/questions`

**쿼리:**

```typescript
// 최신 밈 조회
const memes = await prisma.meme.findMany({
  orderBy: {
    created_at: "desc", // 인덱스 사용! (이미 DESC로 정렬됨)
  },
  take: 20,
});
```

**인덱스 효과:**

- ❌ **인덱스 없음**: 모든 밈을 가져와서 `created_at` 기준으로 정렬 후 상위 20개 선택 (느림)
- ✅ **인덱스 있음**: 이미 `created_at DESC`로 정렬된 인덱스에서 바로 상위 20개 선택 (빠름)

---

## 4. 인덱스 사용 시 주의사항

### ⚠️ **인덱스의 단점**

1. **저장 공간 증가**

   - 인덱스도 별도의 저장 공간이 필요함
   - 데이터가 많을수록 인덱스 크기도 커짐

2. **INSERT/UPDATE/DELETE 성능 저하**

   - 데이터 변경 시 인덱스도 함께 업데이트해야 함
   - 하지만 조회가 훨씬 많다면 이 단점은 무시할 수 있음

3. **과도한 인덱스는 오히려 성능 저하**
   - 모든 컬럼에 인덱스를 만들면 안 됨
   - 자주 조회되는 컬럼에만 인덱스 생성

### ✅ **인덱스를 만들면 좋은 경우**

1. **WHERE 절에서 자주 사용되는 컬럼**

   ```sql
   WHERE score_date = today  -- 인덱스 필요!
   ```

2. **ORDER BY에서 자주 사용되는 컬럼**

   ```sql
   ORDER BY cpu_score DESC  -- 인덱스 필요!
   ```

3. **JOIN에 사용되는 외래키**

   ```sql
   JOIN users u ON ds.user_id = u.user_id  -- user_id 인덱스 필요!
   ```

4. **자주 조회되는 복합 조건**
   ```sql
   WHERE category = 'SPECIAL' AND dev_group_id = 1  -- 복합 인덱스 필요!
   ```

---

## 5. 프로젝트 인덱스 요약

| 인덱스                                 | 테이블         | 용도                      | 사용 API                                     |
| :------------------------------------- | :------------- | :------------------------ | :------------------------------------------- |
| `daily_answer_answer_date_idx`         | `daily_answer` | 날짜별 답변 조회          | `/api/rankings/today`, `/api/measure/submit` |
| `daily_score_score_date_cpu_score_idx` | `daily_score`  | 랭킹 조회 (정렬 포함)     | `/api/rankings/today`, `/api/admin/promote`  |
| `user_badge_granted_date_idx`          | `user_badge`   | 날짜별 배지 조회/삭제     | `/api/rankings/today`, `/api/admin/promote`  |
| `question_category_dev_group_id_idx`   | `question`     | 카테고리+직군별 질문 조회 | `/api/measure/questions`                     |
| `meme_created_at_idx`                  | `meme`         | 최신 밈 조회              | `/api/memes`                                 |
| `concern_created_at_idx`               | `concern`      | 최신 고민 조회            | `/api/questions`                             |

---

## 6. 성능 비교 예시

### 시나리오: 오늘의 랭킹 TOP 20 조회

**데이터 규모:** `daily_score` 테이블에 10,000개 행

#### 인덱스 없을 때:

```
1. 전체 테이블 스캔 (10,000개 행)
2. score_date = today 필터링 (약 500개 행)
3. cpu_score로 정렬 (500개 행 정렬)
4. 상위 20개 선택
⏱️ 소요 시간: 약 100-200ms
```

#### 인덱스 있을 때:

```
1. score_date 인덱스에서 오늘 날짜만 찾기 (약 500개 행)
2. 이미 cpu_score DESC로 정렬된 인덱스에서 상위 20개 선택
⏱️ 소요 시간: 약 5-10ms
```

**성능 향상: 약 10-20배 빠름! 🚀**

---

## 결론

인덱스는 **자주 조회되는 컬럼**에 생성하여 **검색 속도를 크게 향상**시킬 수 있습니다. 특히:

- ✅ 날짜별 필터링 (`WHERE score_date = today`)
- ✅ 정렬이 필요한 조회 (`ORDER BY cpu_score DESC`)
- ✅ 복합 조건 검색 (`WHERE category = 'X' AND dev_group_id = Y`)

이런 경우에 인덱스를 사용하면 데이터가 많아질수록 성능 차이가 더욱 커집니다!
