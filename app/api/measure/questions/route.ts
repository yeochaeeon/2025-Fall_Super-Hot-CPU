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
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
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

    // Hot Developer는 당일 점수 측정 불가 (오늘 선정된 경우만)
    if (user.role.name === "Hot Developer") {
      // 오늘 Hot Developer로 선정되었는지 확인
      const hotDevRecord = await prisma.hot_developer.findUnique({
        where: {
          dev_group_id_effective_date: {
            dev_group_id: user.dev_group_id,
            effective_date: today,
          },
        },
      });

      if (hotDevRecord && hotDevRecord.user_id === user.user_id) {
        return NextResponse.json(
          {
            error: "Hot Developer는 당일 CPU 온도를 측정할 수 없습니다.",
            isHotDeveloper: true,
          },
          { status: 403 }
        );
      }
    }

    // Developer의 답변 채택 의무 확인
    // Developer, Hot Developer, Root는 고민을 등록할 수 있고, 답변이 있으면 채택해야 함
    const rolesRequiringAcceptance = ["Developer", "Hot Developer", "Root"];
    if (rolesRequiringAcceptance.includes(user.role.name)) {
      // 사용자가 등록한 고민 중에서 답변이 있는데 채택하지 않은 고민 확인
      const concernsWithUnacceptedAnswers = await prisma.concern.findMany({
        where: {
          user_id: user.user_id,
          was_good: null, // 아직 채택/비채택 결정을 하지 않음
        },
        include: {
          answer: true, // 답변 목록 포함
        },
      });

      // 답변이 있는 고민만 필터링 (한 번만 판별)
      const unacceptedConcerns = concernsWithUnacceptedAnswers
        .filter((concern) => concern.answer.length > 0)
        .map((concern) => concern.title);

      if (unacceptedConcerns.length > 0) {
        return NextResponse.json(
          {
            error: `답변을 채택해야 CPU 온도를 측정할 수 있습니다. 채택하지 않은 고민이 ${unacceptedConcerns.length}개 있습니다.`,
            requiresAcceptance: true,
            unacceptedConcerns: unacceptedConcerns,
          },
          { status: 403 }
        );
      }
    }

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
    // 해당 직군의 Hot Developer가 선정한 질문 조회
    // 먼저 해당 직군의 질문이 있는지 확인하고, 있으면 그것만 가져오고, 없으면 기본 질문(NULL) 가져오기
    let specialQuestions = await prisma.question.findMany({
      where: {
        category: "SPECIAL",
        dev_group_id: user.dev_group_id, // 해당 직군이 선정한 질문
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

    // 해당 직군의 질문이 없거나 2개 미만이면 기본 질문(NULL) 가져오기
    if (specialQuestions.length < 2) {
      const defaultQuestions = await prisma.question.findMany({
        where: {
          category: "SPECIAL",
          dev_group_id: null, // 아직 선정되지 않은 기본 질문
          is_active: true,
        },
        include: {
          badge: true,
        },
        orderBy: {
          question_id: "asc",
        },
        take: 2 - specialQuestions.length, // 부족한 개수만큼만 가져오기
      });
      specialQuestions = [...specialQuestions, ...defaultQuestions];
    }

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
