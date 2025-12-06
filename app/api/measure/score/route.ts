import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 한국 시간(KST, UTC+9) 기준으로 오늘 날짜 생성
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // UTC+9 (밀리초)
    const kstNow = new Date(now.getTime() + kstOffset);
    const today = new Date(
      Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate()
      )
    );

    // daily_score와 daily_answer 모두 확인 (답변이 있으면 측정한 것으로 간주)
    const [score, answers] = await Promise.all([
      prisma.daily_score.findUnique({
        where: {
          user_id_score_date: {
            user_id: parseInt(userId),
            score_date: today,
          },
        },
      }),
      prisma.daily_answer.findFirst({
        where: {
          user_id: parseInt(userId),
          answer_date: today,
        },
      }),
    ]);

    // 답변이 있으면 측정한 것으로 간주
    const hasAnswered = !!answers;
    // 점수가 실제로 있는지 확인 (daily_score 테이블에 기록이 있어야 함)
    const hasScore = !!score;

    // 점수가 없으면 측정하지 않은 것으로 간주
    if (!hasScore) {
      return NextResponse.json(
        {
          hasScore: false,
          cpuScore: null,
        },
        { status: 200 }
      );
    }

    // 오늘 획득한 뱃지 조회 (Hot Developer 뱃지 제외)
    const badges = await prisma.user_badge.findMany({
      where: {
        user_id: parseInt(userId),
        granted_date: today,
        badge: {
          question: {
            category: {
              not: "SPECIAL", // Hot Developer 질문 뱃지 제외
            },
          },
        },
      },
      include: {
        badge: {
          include: {
            question: true,
          },
        },
      },
    });

    // 점수가 있으면 점수 사용
    const cpuScore = Number(score.cpu_score);

    return NextResponse.json(
      {
        hasScore: true,
        cpuScore: cpuScore,
        badges: badges.map((b) => ({
          id: b.badge.badge_id,
          name: b.badge.name,
          description: b.badge.description,
          questionId: b.badge.question_id,
          questionContent: b.badge.question.content,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get score error:", error);
    return NextResponse.json(
      { error: "점수를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
