# 매일 자정 자동 실행 작업

## 실행 시간

- **스케줄**: `0 15 * * *` (UTC 15시 = 한국 시간 자정 00:00)
- **API 경로**: `/api/admin/promote`
- **실행 주기**: 매일 자정 자동 실행

---

## 수행 작업 목록

### 1. Hot Developer 선정 🔥

**목적**: 전날 각 직군별 CPU 온도 1위 사용자를 Hot Developer로 선정

**처리 과정**:

1. 모든 직군(Frontend, Backend, AI, Mobile)을 순회
2. 각 직군별로 **전날(어제)** `daily_score` 테이블에서 최고 CPU 온도 조회
3. 동점자가 있는 경우, **전날 CPU 온도를 먼저 측정한 사용자** 우선 선정
   - `daily_answer` 테이블의 `created_at` 기준으로 정렬
4. 선정된 사용자에 대해:
   - `hot_developer` 테이블에 기록 (직군별 하루 1명)
   - 사용자의 `role_id`를 "Hot Developer"로 변경
   - `hot_dev_count` 1 증가

**데이터베이스 변경**:

- `hot_developer` 테이블: INSERT/UPDATE
- `users` 테이블: `role_id`, `hot_dev_count` UPDATE

---

### 2. Optimizer 승급 ⬆️

**목적**: Hot Developer를 10회 이상 달성하고 고유 칭호를 5개 이상 받은 사용자를 Optimizer로 승급

**조건**:

- 현재 역할: Developer 또는 Hot Developer
- `hot_dev_count >= 10`
- 고유 칭호 개수 >= 5개 (같은 칭호를 여러 번 받아도 1개로 카운트)

**처리 과정**:

1. 조건을 만족하는 사용자 조회
2. 각 사용자의 고유 칭호 개수 계산 (`user_badge` 테이블의 `badge_id` 기준)
3. 조건을 만족하면 `role_id`를 "Optimizer"로 변경

**데이터베이스 변경**:

- `users` 테이블: `role_id` UPDATE

---

### 3. Root 승급 ⬆️⬆️

**목적**: Optimizer 중에서 답변 활동이 뛰어난 사용자를 Root로 승급

**조건**:

- 현재 역할: Optimizer
- `total_answers >= 50`
- 채택률 >= 80% (`total_accepted / total_answers >= 0.8`)

**처리 과정**:

1. Optimizer 역할 사용자 중 `total_answers >= 50`인 사용자 조회
2. 각 사용자의 채택률 계산
3. 채택률 80% 이상이면 `role_id`를 "Root"로 변경

**데이터베이스 변경**:

- `users` 테이블: `role_id` UPDATE

---

### 4. Optimizer 강등 ⬇️

**목적**: Optimizer 중에서 답변 품질이 낮은 사용자를 Developer로 강등

**조건**:

- 현재 역할: Optimizer
- `total_answers >= 10`
- 미채택률 >= 80% (`(total_answers - total_accepted) / total_answers >= 0.8`)

**처리 과정**:

1. Optimizer 역할 사용자 중 `total_answers >= 10`인 사용자 조회
2. 각 사용자의 미채택률 계산
3. 미채택률 80% 이상이면:
   - `role_id`를 "Developer"로 변경
   - `hot_dev_count`를 0으로 초기화

**데이터베이스 변경**:

- `users` 테이블: `role_id`, `hot_dev_count` UPDATE

---

## 실행 결과

각 작업 실행 후 다음 정보가 반환됩니다:

```json
{
  "message": "승급 로직 실행 완료",
  "date": "2025-12-05",
  "results": {
    "hotDevelopers": [
      {
        "userId": 1,
        "nickname": "user1",
        "devGroup": "Frontend"
      }
    ],
    "promotedToOptimizer": [
      {
        "userId": 2,
        "nickname": "user2"
      }
    ],
    "promotedToRoot": [],
    "demotedFromOptimizer": []
  }
}
```

---

## 주의사항

1. **시간대**: 모든 날짜 계산은 UTC 기준입니다.

   - 한국 시간 자정(00:00) = UTC 15:00
   - 전날 데이터는 UTC 기준으로 계산됩니다.

2. **Hot Developer 선정**:

   - 직군당 하루 1명만 선정 (데이터베이스 unique 제약)
   - 동점자는 전날 CPU 온도를 먼저 측정한 사용자 우선

3. **동시 실행 방지**:

   - Vercel Cron Job은 자동으로 중복 실행을 방지합니다.
   - 수동 실행 시에는 주의가 필요합니다.

4. **에러 처리**:
   - 각 작업은 독립적으로 실행되며, 하나가 실패해도 다른 작업은 계속 진행됩니다.
   - 에러는 서버 로그에 기록됩니다.

---

## 모니터링

Vercel 대시보드에서 다음을 확인할 수 있습니다:

- **Cron Jobs** 탭: 실행 스케줄 및 상태 확인
- **View Logs**: 각 실행의 로그 확인
- **Run**: 수동으로 즉시 실행 가능
