# 역할(Role) 체계 및 권한 관리 시스템

## 개요

본 프로젝트는 단순한 '직군 분류(FE/BE/AI/Mobile)'를 넘어서, **DB의 Role 테이블을 기반으로 권한과 제약 사항이 명확히 정의된 4단계 역할(Role) 체계**를 운영합니다. 이 역할들은 서비스의 핵심 게이미피케이션 메커니즘이자, 데이터베이스의 **접근 제어(Authorization)** 및 **데이터 무결성**을 보장하는 핵심축입니다.

각 사용자는 **4가지 직군(FE/BE/AI/Mobile)** 중 하나에 속하며, 해당 직군 내에서의 활동을 기반으로 아래 역할에 따라 권한을 부여받습니다.

---

## 1. Developer (일반 유저)

| **구분** | **내용** | **DB 설계적 특징** |
|:---|:---|:---|
| **정의** | 서비스에 가입한 모든 **기본 사용자**. 자신의 개발 스트레스 지표를 측정하고 랭킹 경쟁에 참여한다. | `users.role_id = 1` (기본값), `role` 테이블의 `name = 'Developer'`를 통해 기본 기능 접근 권한 부여 |
| **주요 활동** | 1. 매일 CPU 온도 측정 설문 참여<br>2. 고민 게시판에 질문 등록<br>3. 밈 게시판에 밈 등록<br>4. 밈 게시판 좋아요 누르기 (하루 3개 제한)<br>5. **의무**: 등록한 고민에 답변이 있으면 반드시 채택/비채택 결정 필수 (미채택 시 CPU 온도 측정 불가) | 밈 좋아요 제한은 `meme_like` 테이블의 `liked_at` 필드를 기준으로 일일 집계하여 관리됨. `user_daily_like` 테이블은 참고용 집계 데이터로 사용됨. |
| **승급 조건** | - (기본 역할) | - |

---

## 2. Hot Developer (일일 챔피언)

| **구분** | **내용** | **DB 설계적 특징** |
|:---|:---|:---|
| **정의** | 전날 기준, 자신이 속한 직군에서 CPU 온도 랭킹 1위를 기록한 사용자. | 매일 자정 Cron Job(`/api/admin/promote`)을 통해 `daily_score` 테이블 집계 및 `users.role_id` 자동 변경. `hot_developer` 테이블에 기록 저장 (복합 기본키: `dev_group_id`, `effective_date`) |
| **승급/임기** | **승급**: 전날 직군별 CPU 온도 1위<br>**임기**: 24시간 (자정~자정)<br>**동점자 처리**: 전날 CPU 온도 측정을 가장 먼저 시작한 사용자 우선 | `users.hot_dev_count` 필드에 누적 기록. `hot_developer` 테이블의 `effective_date`를 통해 일일 유효성 관리. 동점 시 `daily_answer.created_at` 기준으로 최초 측정 시간 비교 |
| **주요 권한** | **[특권]** 익일 직군 특화 질문 2개를 **직접 작성**할 수 있음.<br>→ `question` 테이블에 `category = 'SPECIAL'`, `dev_group_id = 자신의 직군`으로 새 질문 생성 | 트랜잭션으로 기존 SPECIAL 질문 비활성화(`is_active = false`, `dev_group_id = NULL`) 후 새 질문 2개 생성. 각 질문의 `weight_percent = 10.0` (총 20%) |
| **제약** | **당일은 CPU 온도 측정 불가** (질문 작성 역할 수행) | `hot_developer` 테이블의 `effective_date = 오늘` 조건으로 측정 API 접근 차단 (403 에러) |
| **역할 변경** | 다음 날 자정에 자동으로 Developer로 복귀 또는 Optimizer 승급 조건 충족 시 Optimizer로 승급 | Cron Job에서 `hot_developer` 테이블 조회 후 `users.role_id` 업데이트 |

---

## 3. Optimizer (고민 해결사)

| **구분** | **내용** | **DB 설계적 특징** |
|:---|:---|:---|
| **정의** | 커뮤니티 활동을 통해 전문성을 인정받아 고민 게시판 답변을 전담하는 숙련된 사용자. | `users.role_id` 기반으로 고민 답변 작성 권한을 제한하여 DB의 **접근 제어(Authorization)** 기능을 극대화. `concern_answer` 테이블 INSERT 권한이 Optimizer/Root로 제한됨 |
| **승급 조건** | Hot Developer 누적 **10회** 선정 **AND** 칭호(Badge) **5개 이상** 획득 | `users.hot_dev_count >= 10` **AND** `user_badge` 테이블에서 고유한 `badge_id` 개수 >= 5 (집계 쿼리: `COUNT(DISTINCT badge_id)`) |
| **강등 조건** | 답변 **10회 이상** 기록 **AND** 미채택률 **80% 이상**일 경우 자동 강등. | `users.total_answers >= 10` **AND** `((total_answers - total_accepted) / total_answers) * 100 >= 80` 계산. 강등 시 `users.role_id`를 Developer로 변경 및 `hot_dev_count = 0`으로 초기화 |
| **주요 활동** | **[특권]** 고민 게시판에서 질문에 대한 조언 답변 제공.<br>**[제약]** **같은 직군의 고민에만 답변 가능** (Root는 제외) | `concern_answer` 테이블 INSERT 시 `concern.dev_group_id = user.dev_group_id` 조건 검증. `users.total_answers` 필드 자동 증가 (UPDATE 쿼리) |
| **제약** | 고민 게시판 질문 등록 불가 | `concern` 테이블 INSERT 권한이 Developer/Hot Developer/Root로 제한됨 |

---

## 4. Root (절대자)

| **구분** | **내용** | **DB 설계적 특징** |
|:---|:---|:---|
| **정의** | 플랫폼 운영 및 최고 의사결정 권한을 가진 사용자. | DB 내에서 가장 높은 수준의 권한(`users.role_id`)을 가짐. 모든 기능에 대한 접근 권한 보유 |
| **승급 조건** | Optimizer 역할 **AND** 답변 **50회 이상** 기록 **AND** 채택 비율 **80% 이상** | `users.role_id = Optimizer` **AND** `users.total_answers >= 50` **AND** `(total_accepted / total_answers) * 100 >= 80` 계산 |
| **주요 권한** | **[특권]** CPU 온도 가중치 로직 변경 권한.<br>**[특권]** 밈 게시판 투표권 2배(하루 6개)<br>**[특권]** 모든 직군의 고민에 답변 가능 | 가중치 변경은 **복합 트랜잭션**으로 처리되어 총합(100%) 무결성을 보장함 (`question_weight_log` 테이블에 이력 기록). 밈 투표권은 `getDailyLikeLimit()` 함수에서 역할별로 차등 적용 (Root: 6개, 기타: 3개) |
| **특징** | 모든 역할의 권한을 통합적으로 보유 | Developer/Hot Developer/Optimizer의 모든 권한 + 추가 특권 |

---

## 요약 테이블: 역할별 권한 차등

| **역할** | **CPU 측정** | **고민 질문 등록** | **고민 답변 작성** | **답변 채택** | **밈 좋아요 개수** | **특별 질문 작성** | **가중치 로직 변경** |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Developer** | ✅ | ✅ | ❌ | ✅ (본인 고민만) | 3개/일 | ❌ | ❌ |
| **Hot Developer** | ❌ (당일 불가) | ✅ | ❌ | ✅ (본인 고민만) | 3개/일 | ✅ (당일 선정자만) | ❌ |
| **Optimizer** | ✅ | ❌ | ✅ (같은 직군만) | ❌ | 3개/일 | ❌ | ❌ |
| **Root** | ✅ | ✅ | ✅ (모든 직군) | ✅ (모든 고민) | **6개/일** | ❌ | ✅ |

---

## 데이터베이스 설계 특징

### 1. 역할 기반 접근 제어 (Role-Based Access Control)

- **`role` 테이블**: 역할 정의 및 고유성 보장 (`name` UNIQUE 제약)
- **`users.role_id`**: 사용자의 현재 역할 (FOREIGN KEY → `role.role_id`)
- **애플리케이션 레벨 검증**: 모든 API 엔드포인트에서 `users.role.name` 기반 권한 검증 수행

### 2. 역할 승급/강등 자동화

- **Cron Job**: 매일 자정 `/api/admin/promote` API 자동 실행
- **조건 검증**: `users` 테이블의 집계 필드(`hot_dev_count`, `total_answers`, `total_accepted`) 기반 승급/강등 조건 체크
- **트랜잭션**: 역할 변경 시 데이터 무결성 보장

### 3. Hot Developer 관리

- **`hot_developer` 테이블**: 직군별 일일 Hot Developer 기록 (복합 기본키: `dev_group_id`, `effective_date`)
- **UNIQUE 제약**: 직군당 일일 1명만 선정 가능
- **자동 역할 변경**: 다음 날 자정에 이전 Hot Developer 역할 자동 변경 (Developer 복귀 또는 Optimizer 승급)

### 4. 권한별 제약사항

#### CPU 온도 측정 제약
- **Hot Developer (당일)**: `hot_developer` 테이블 조회로 당일 선정 여부 확인 후 403 에러 반환
- **의무 채택 미이행**: `concern` 테이블에서 `was_good IS NULL`이고 `concern_answer`가 있는 고민이 있으면 측정 불가

#### 고민 답변 제약
- **Optimizer**: `concern.dev_group_id = user.dev_group_id` 조건 검증
- **Root**: 제약 없음 (모든 직군의 고민에 답변 가능)

#### 밈 좋아요 제한
- **일일 집계**: `meme_like` 테이블의 `liked_at` 필드를 기준으로 오늘 날짜 범위 내 좋아요 개수 집계
- **역할별 차등**: `getDailyLikeLimit()` 함수로 역할별 제한 수 반환 (Root: 6개, 기타: 3개)

### 5. 트랜잭션 사용 현황

| **기능** | **트랜잭션 사용** | **용도** |
|:---|:---|:---|
| **Hot Developer 질문 작성** | ✅ | 기존 질문 비활성화 + 새 질문 생성 (원자성 보장) |
| **질문 가중치 조정** | ✅ | 두 질문의 가중치 동시 변경 + 이력 로깅 (총합 100% 무결성) |
| **답변 채택** | ❌ | 순차적 UPDATE (원자성 보장 불필요) |
| **밈 좋아요** | ❌ | 단순 INSERT/DELETE (UNIQUE 제약으로 중복 방지) |

---

## 주요 API 엔드포인트별 권한 검증

| **API 경로** | **권한 요구사항** | **검증 로직** |
|:---|:---|:---|
| `POST /api/measure/submit` | Developer, Hot Developer(당일 제외), Root | `hot_developer` 테이블 조회로 당일 선정 여부 확인 |
| `POST /api/questions` | Developer, Hot Developer, Root | `users.role.name` 검증 |
| `POST /api/questions/[id]/answers` | Optimizer, Root | `users.role.name` 검증 + Optimizer는 `dev_group_id` 일치 확인 |
| `PATCH /api/questions/[id]/answers/[answerId]/accept` | Developer, Hot Developer, Root (고민 작성자만) | `concern.user_id = 현재 사용자` 검증 |
| `POST /api/hot-developer/questions` | Hot Developer (당일 선정자만) | `hot_developer` 테이블 조회로 당일 선정 여부 확인 |
| `POST /api/memes/[id]/like` | 모든 사용자 (역할별 제한) | `getDailyLikeLimit()` 함수로 일일 제한 확인 |
| `PATCH /api/admin/questions/adjust-weight` | Root만 | `users.role.name = 'Root'` 검증 |

---

## 데이터 무결성 보장 메커니즘

1. **FOREIGN KEY 제약**: 모든 관계 테이블에서 참조 무결성 보장
2. **UNIQUE 제약**: 닉네임 중복 방지, 일일 중복 답변 방지, 직군당 일일 Hot Developer 1명 제한
3. **트랜잭션**: 가중치 변경, Hot Developer 질문 작성 시 원자성 보장
4. **애플리케이션 레벨 검증**: 역할별 권한, 제약사항을 API에서 엄격히 검증

---

## 역할 체계의 게이미피케이션 효과

1. **단계적 성취감**: Developer → Hot Developer → Optimizer → Root로의 명확한 성장 경로
2. **일일 경쟁**: Hot Developer 선정을 통한 매일 새로운 목표 제공
3. **전문성 인정**: Optimizer 승급을 통한 커뮤니티 기여도 인정
4. **최고 권한**: Root 승급을 통한 플랫폼 운영 참여 기회 제공

