import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Root가 모든 질문 목록 조회 (가중치 변경용)
 * Root만 접근 가능
 */
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

    // 사용자 정보 조회 및 Root 권한 확인
    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(userId) },
      include: {
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Root 권한 확인
    if (user.role.name !== "Root") {
      return NextResponse.json(
        { error: "Root만 접근할 수 있습니다." },
        { status: 403 }
      );
    }

    // 모든 활성 질문 조회 (Hot Developer 질문 제외)
    const questions = await prisma.question.findMany({
      where: {
        is_active: true,
        category: {
          not: "SPECIAL", // Hot Developer 질문 제외
        },
      },
      include: {
        dev_group: true,
        badge: true,
      },
      orderBy: [
        { category: "asc" },
        { dev_group_id: "asc" },
        { question_id: "asc" },
      ],
    });

    // 카테고리별로 분류
    const commonQuestions = questions.filter((q) => q.category === "COMMON");
    const roleQuestions = questions.filter((q) => q.category === "dev");

    // 직군별로 그룹화
    const roleQuestionsByGroup = roleQuestions.reduce((acc, q) => {
      const groupName = q.dev_group?.name || "기타";
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(q);
      return acc;
    }, {} as Record<string, typeof roleQuestions>);

    return NextResponse.json(
      {
        questions: {
          common: commonQuestions.map((q) => ({
            id: q.question_id,
            content: q.content,
            category: q.category,
            weightPercent: Number(q.weight_percent),
            devGroup: null,
            badge: q.badge[0]
              ? {
                  id: q.badge[0].badge_id,
                  name: q.badge[0].name,
                  description: q.badge[0].description,
                }
              : null,
          })),
          byRole: Object.entries(roleQuestionsByGroup).map(([groupName, qs]) => ({
            groupName,
            questions: qs.map((q) => ({
              id: q.question_id,
              content: q.content,
              category: q.category,
              weightPercent: Number(q.weight_percent),
              devGroup: q.dev_group?.name || null,
              badge: q.badge[0]
                ? {
                    id: q.badge[0].badge_id,
                    name: q.badge[0].name,
                    description: q.badge[0].description,
                  }
                : null,
            })),
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get questions for weight management error:", error);
    return NextResponse.json(
      { error: "질문 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

