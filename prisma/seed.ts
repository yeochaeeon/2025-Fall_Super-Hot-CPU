import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// 환경 변수 확인
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "설정됨" : "없음");

// Prisma Client 초기화 (Prisma 6)
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed 스크립트 실행 중...");
  console.log(
    "💡 이미 supabase_seed.sql을 실행했다면 이 스크립트는 필요 없습니다."
  );
  console.log("💡 개발 환경에서 시드 데이터를 다시 넣고 싶을 때만 사용하세요.");

  // 여기에 시드 로직을 추가할 수 있습니다
  // 하지만 이미 supabase_seed.sql로 데이터를 넣었다면 필요 없음.
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
