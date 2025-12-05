import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Connection Pooling 최적화
// Next.js Serverless 환경에서 connection pool 고갈 방지
// DATABASE_URL에 connection_limit과 connection_timeout 파라미터 추가 필요:
// postgresql://...?connection_limit=5&pool_timeout=20&connect_timeout=10
export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Prisma Client 연결 관리
// 개발 환경에서 Hot Reload 시 연결 유지
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

// 프로세스 종료 시 연결 정리
if (typeof window === "undefined") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}
