# Connection Pool Timeout 문제 해결

## 문제
```
FATAL: Unable to check out process from the pool due to timeout
```

이 에러는 connection pool이 고갈되어 발생합니다.

## 해결 방법

### 1. DATABASE_URL에 Connection Pool 파라미터 추가

`.env` 파일의 `DATABASE_URL`에 다음 파라미터를 추가하세요:

```bash
# 기존
DATABASE_URL="postgresql://user:password@host:5432/database"

# 수정 후 (Session 모드 - Port 5432 사용)
DATABASE_URL="postgresql://user:password@host:5432/database?connection_limit=10&pool_timeout=20&connect_timeout=10"
```

**파라미터 설명:**
- `connection_limit=10`: 최대 10개의 connection만 사용 (Supabase 무료 플랜 권장)
- `pool_timeout=20`: Connection을 가져올 때 최대 20초 대기
- `connect_timeout=10`: 연결 시도 시 최대 10초 대기

### 2. Supabase Connection String 확인

1. Supabase Dashboard → Settings → Database
2. **Connection string** → **Session mode** (Port 5432) 선택
3. Connection string 복사
4. 위 파라미터들을 추가

### 3. 개발 서버 재시작

```bash
# 서버 중지 후 재시작
npm run dev
```

### 4. 추가 최적화 (선택사항)

만약 여전히 문제가 발생한다면:

1. **Connection limit 감소**: `connection_limit=5`로 줄이기
2. **쿼리 최적화**: 불필요한 쿼리 제거, 인덱스 활용
3. **Supabase 플랜 업그레이드**: 더 많은 connection 허용

## 참고

- Supabase 무료 플랜: 최대 60개 connection
- Supabase Pro 플랜: 최대 200개 connection
- Next.js Serverless 환경에서는 각 요청마다 connection을 사용하므로 제한이 중요합니다

