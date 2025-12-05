# 승급 시스템 가이드

## 개요

승급 시스템은 매일 자정에 자동으로 실행되어 사용자의 역할을 업데이트합니다.

## API 엔드포인트

### POST `/api/admin/promote`

승급 로직을 수동으로 실행합니다.

**인증 (선택사항):**

- 환경변수 `PROMOTE_API_KEY`가 설정되어 있으면 Bearer 토큰 인증 필요
- 설정하지 않으면 인증 없이 실행 가능 (개발 환경용)

**요청 예시:**

```bash
# 인증 없이 실행
curl -X POST http://localhost:3000/api/admin/promote

# 인증과 함께 실행
curl -X POST http://localhost:3000/api/admin/promote \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**응답 예시:**

```json
{
  "message": "승급 로직 실행 완료",
  "date": "2025-01-15",
  "results": {
    "hotDevelopers": [
      {
        "userId": 1,
        "nickname": "user1",
        "devGroup": "프론트엔드"
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

## 승급 로직

### 1. Hot Developer 선정

**조건:**

- 전날 직군별 CPU 온도 1위
- 동점자가 있으면 전날 CPU 온도를 먼저 측정한 사용자 우선

**처리:**

- `hot_developer` 테이블에 기록
- 사용자의 `role_id`를 "Hot Developer"로 변경
- `hot_dev_count` 1 증가

**참고:**

- `hot_developer` 테이블의 unique 제약으로 인해 직군당 하루에 1명만 선정 가능
- 동점자가 있어도 첫 번째 사용자만 선정됨

### 2. Optimizer 승급

**조건:**

- Hot Developer 10회 이상 (`hot_dev_count >= 10`)
- 고유 칭호 5개 이상 (같은 칭호를 여러 번 받아도 1개로 카운트)

**처리:**

- 사용자의 `role_id`를 "Optimizer"로 변경

### 3. Root 승급

**조건:**

- 현재 역할이 "Optimizer"
- 답변 50회 이상 (`total_answers >= 50`)
- 채택률 80% 이상 (`total_accepted / total_answers >= 0.8`)

**처리:**

- 사용자의 `role_id`를 "Root"로 변경

### 4. Optimizer 강등

**조건:**

- 현재 역할이 "Optimizer"
- 답변 10회 이상 (`total_answers >= 10`)
- 미채택률 80% 이상 (`(total_answers - total_accepted) / total_answers >= 0.8`)

**처리:**

- 사용자의 `role_id`를 "Developer"로 변경
- `hot_dev_count`를 0으로 초기화

## 자동 실행 설정

### Vercel Cron Jobs (권장)

`vercel.json` 파일이 생성되어 있습니다.

**설정 방법:**

1. Vercel에 프로젝트를 배포하면 자동으로 cron job이 활성화됩니다.
2. Vercel 대시보드의 **Settings** → **Cron Jobs**에서 확인 가능합니다.
3. 매일 한국 시간 자정(UTC 15시)에 자동 실행됩니다.

**주의사항:**

- Vercel의 무료 플랜에서는 cron job이 제한될 수 있습니다.
- Pro 플랜 이상에서 완전한 cron job 기능을 사용할 수 있습니다.

### 외부 Cron 서비스 (대안)

GitHub Actions를 사용할 수 없는 경우:

- **[cron-job.org](https://cron-job.org)** (무료 플랜 제공)

  1. 회원가입 후 새 cron job 생성
  2. URL: `https://your-app-domain.com/api/admin/promote`
  3. Method: `POST`
  4. Schedule: `0 15 * * *` (한국 시간 자정 = UTC 15시)
  5. Headers (선택사항): `Authorization: Bearer YOUR_API_KEY`

- **[EasyCron](https://www.easycron.com)** (무료 플랜 제공)
- **[Uptime Robot](https://uptimerobot.com)** (무료 플랜 제공)

**주의:** 외부 서비스는 API URL을 공개적으로 노출하므로 `PROMOTE_API_KEY` 설정을 강력히 권장합니다.

## 통계 업데이트

다음 API에서 자동으로 통계가 업데이트됩니다:

- **답변 작성**: `POST /api/questions/[id]/answers`

  - `total_answers` 증가

- **답변 채택**: `PATCH /api/questions/[id]/answers/[answerId]/accept`
  - `total_accepted` 증가/감소

## 환경변수

`.env` 파일에 추가 (선택사항):

```env
PROMOTE_API_KEY=your-secret-api-key-here
```

## 주의사항

1. **시간대**: 모든 날짜는 UTC 기준입니다. 한국 시간(UTC+9) 자정에 실행하려면 `0 15 * * *` (UTC 15시 = 한국 자정)로 설정하세요.

2. **동시 실행 방지**: 여러 인스턴스에서 동시에 실행되지 않도록 주의하세요. 필요시 락(lock) 메커니즘을 추가하세요.

3. **에러 처리**: 승급 로직 실행 중 에러가 발생해도 다른 승급 로직은 계속 실행됩니다.

4. **Hot Developer 임기**: Hot Developer는 하루 동안만 유지되며, 다음 날 자정에 새로운 Hot Developer가 선정됩니다.
