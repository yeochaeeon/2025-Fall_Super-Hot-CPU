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

    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(userId) },
      include: {
        dev_group: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 타임존 문제를 피하기 위해 UTC 기준으로 오늘 날짜 생성
    const now = new Date();
    const today = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));

    // 공통 질문 4개 (COMMON)
    const commonQuestions = await prisma.question.findMany({
      where: {
        category: "COMMON",
        is_active: true,
      },
      include: {
        badge: true,
      },
      orderBy: {
        question_id: "asc",
      },
    });

    // 직군별 질문 4개 (dev)
    const roleQuestions = await prisma.question.findMany({
      where: {
        category: "dev",
        dev_group_id: user.dev_group_id,
        is_active: true,
      },
      include: {
        badge: true,
      },
      orderBy: {
        question_id: "asc",
      },
    });

    // Hot Developer 질문 2개 (SPECIAL)
    const specialQuestions = await prisma.question.findMany({
      where: {
        category: "SPECIAL",
        is_active: true,
      },
      include: {
        badge: true,
      },
      orderBy: {
        question_id: "asc",
      },
      take: 2,
    });

    // 오늘 이미 답변한 질문들 확인
    const existingAnswers = await prisma.daily_answer.findMany({
      where: {
        user_id: user.user_id,
        answer_date: today,
      },
      select: {
        question_id: true,
        answer_value: true,
      },
    });

    const answeredMap = new Map(
      existingAnswers.map((a) => [a.question_id, Number(a.answer_value)])
    );

    const allQuestions = [
      ...commonQuestions.map((q) => ({
        questionId: q.question_id,
        content: q.content,
        category: q.category,
        weightPercent: Number(q.weight_percent),
        badge: q.badge[0]
          ? {
              id: q.badge[0].badge_id,
              name: q.badge[0].name,
              description: q.badge[0].description,
            }
          : null,
        answerValue: answeredMap.get(q.question_id) ?? null,
      })),
      ...roleQuestions.map((q) => ({
        questionId: q.question_id,
        content: q.content,
        category: q.category,
        weightPercent: Number(q.weight_percent),
        badge: q.badge[0]
          ? {
              id: q.badge[0].badge_id,
              name: q.badge[0].name,
              description: q.badge[0].description,
            }
          : null,
        answerValue: answeredMap.get(q.question_id) ?? null,
      })),
      ...specialQuestions.map((q) => ({
        questionId: q.question_id,
        content: q.content,
        category: q.category,
        weightPercent: Number(q.weight_percent),
        badge: q.badge[0]
          ? {
              id: q.badge[0].badge_id,
              name: q.badge[0].name,
              description: q.badge[0].description,
            }
          : null,
        answerValue: answeredMap.get(q.question_id) ?? null,
      })),
    ];

    return NextResponse.json(
      {
        questions: allQuestions,
        hasAnswered: existingAnswers.length > 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get questions error:", error);
    return NextResponse.json(
      { error: "질문을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}



