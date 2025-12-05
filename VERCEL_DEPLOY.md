# Vercel 배포 가이드

## 배포 전 체크리스트

### 1. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정해야 합니다:

**필수 환경 변수:**
- `DATABASE_URL`: Supabase 데이터베이스 연결 문자열
  - 형식: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?connection_limit=10&pool_timeout=20&connect_timeout=10`
  - Supabase Dashboard → Settings → Database → Connection string (Session mode, Port 5432)

**Supabase Storage (이미지 업로드용):**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key

**선택사항 (보안):**
- `PROMOTE_API_KEY`: 승급 API 보안 키 (설정 시 cron job에서도 인증 필요)

### 2. Vercel 배포 설정

1. **프로젝트 연결**
   - Vercel 대시보드 → **Add New Project**
   - GitHub 저장소 선택

2. **프로젝트 설정**
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (자동 감지됨)
   - **Output Directory**: `.next` (자동 감지됨)
   - **Install Command**: `npm install`

3. **환경 변수 추가**
   - **Settings** → **Environment Variables**
   - 위의 환경 변수들을 모두 추가
   - **Production**, **Preview**, **Development** 모두에 적용

4. **배포**
   - **Deploy** 버튼 클릭
   - 빌드가 완료될 때까지 대기

### 3. Cron Job 확인

배포 후:
1. **Settings** → **Cron Jobs** 탭 확인
2. `/api/admin/promote` cron job이 활성화되어 있는지 확인
3. 다음 실행 시간 확인

### 4. 데이터베이스 초기화

배포 후 데이터베이스가 비어있다면:

1. **Supabase SQL Editor**에서 실행:
   - `supabase_init.sql` - 테이블 생성
   - `supabase_seed.sql` - 초기 데이터 삽입
   - `add_indexes.sql` - 인덱스 추가

### 5. 문제 해결

**빌드 실패 시:**
- Vercel 빌드 로그 확인
- Prisma Client 생성 실패 시: `DATABASE_URL` 확인
- 환경 변수가 제대로 설정되었는지 확인

**Cron Job이 실행되지 않을 때:**
- Vercel Pro 플랜 이상인지 확인 (무료 플랜 제한)
- `vercel.json` 파일이 루트에 있는지 확인
- Cron Job 설정에서 경로가 올바른지 확인

**데이터베이스 연결 실패:**
- `DATABASE_URL` 형식 확인 (프로토콜: `postgresql://`)
- Supabase 프로젝트가 활성화되어 있는지 확인
- Connection pooling 파라미터 확인

## 배포 후 확인 사항

1. ✅ 홈페이지 로드 확인
2. ✅ 로그인/회원가입 기능 확인
3. ✅ CPU 온도 측정 기능 확인
4. ✅ 랭킹 페이지 확인
5. ✅ 밈 게시판 확인
6. ✅ 고민 게시판 확인
7. ✅ Cron Job 실행 로그 확인

