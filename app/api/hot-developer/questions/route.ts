import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Hot Developer 특별 질문 목록 조회
 * Hot Developer만 접근 가능
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

    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(userId) },
      include: {
        role: true,
        dev_group: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Hot Developer만 접근 가능
    if (user.role.name !== "Hot Developer") {
      return NextResponse.json(
        { error: "Hot Developer만 접근할 수 있습니다." },
        { status: 403 }
      );
    }

    // 한국 시간(KST, UTC+9) 기준으로 오늘 날짜 확인 (Hot Developer는 당일 선정)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // UTC+9 (밀리초)
    const kstNow = new Date(now.getTime() + kstOffset);
    const today = new Date(Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate()
    ));

    // 오늘 Hot Developer로 선정되었는지 확인
    const hotDevRecord = await prisma.hot_developer.findUnique({
      where: {
        dev_group_id_effective_date: {
          dev_group_id: user.dev_group_id,
          effective_date: today,
        },
      },
    });

    if (!hotDevRecord || hotDevRecord.user_id !== user.user_id) {
      return NextResponse.json(
        { error: "오늘 Hot Developer로 선정되지 않았습니다." },
        { status: 403 }
      );
    }

    // 현재 해당 직군이 작성한 특별 질문 확인
    const existingQuestions = await prisma.question.findMany({
      where: {
        category: "SPECIAL",
        dev_group_id: user.dev_group_id,
        is_active: true,
      },
      orderBy: {
        question_id: "asc",
      },
      take: 2, // 특별 질문은 2개
    });

    return NextResponse.json(
      {
        devGroup: user.dev_group.name,
        existingQuestions: existingQuestions.map((q) => ({
          questionId: q.question_id,
          content: q.content,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get Hot Developer questions error:", error);
    return NextResponse.json(
      { error: "질문 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * Hot Developer 특별 질문 선정
 * Hot Developer만 접근 가능
 */
export async function POST(request: NextRequest) {
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
        role: true,
        dev_group: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Hot Developer만 접근 가능
    if (user.role.name !== "Hot Developer") {
      return NextResponse.json(
        { error: "Hot Developer만 접근할 수 있습니다." },
        { status: 403 }
      );
    }

    // 한국 시간(KST, UTC+9) 기준으로 오늘 날짜 확인
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // UTC+9 (밀리초)
    const kstNow = new Date(now.getTime() + kstOffset);
    const today = new Date(Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate()
    ));

    // 오늘 Hot Developer로 선정되었는지 확인
    const hotDevRecord = await prisma.hot_developer.findUnique({
      where: {
        dev_group_id_effective_date: {
          dev_group_id: user.dev_group_id,
          effective_date: today,
        },
      },
    });

    if (!hotDevRecord || hotDevRecord.user_id !== user.user_id) {
      return NextResponse.json(
        { error: "오늘 Hot Developer로 선정되지 않았습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { questions } = body; // [{ content: string }, { content: string }] - 정확히 2개

    if (!Array.isArray(questions) || questions.length !== 2) {
      return NextResponse.json(
        { error: "질문을 정확히 2개 작성해주세요." },
        { status: 400 }
      );
    }

    // 질문 내용 검증
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content || typeof q.content !== "string" || q.content.trim().length === 0) {
        return NextResponse.json(
          { error: `${i + 1}번째 질문 내용을 입력해주세요.` },
          { status: 400 }
        );
      }
      if (q.content.trim().length > 255) {
        return NextResponse.json(
          { error: `${i + 1}번째 질문은 255자 이하여야 합니다.` },
          { status: 400 }
        );
      }
    }

    // 트랜잭션으로 처리: 기존 질문 비활성화 + 새 질문 생성
    const createdQuestions = await prisma.$transaction(async (tx) => {
      // 1. 해당 직군의 기존 특별 질문 비활성화
      await tx.question.updateMany({
        where: {
          category: "SPECIAL",
          dev_group_id: user.dev_group_id,
        },
        data: {
          is_active: false,
          dev_group_id: null, // 기존 질문은 더 이상 이 직군에 속하지 않음
        },
      });

      // 2. 새로운 특별 질문 2개 순차 생성 (시퀀스 충돌 방지)
      const created: Array<{
        question_id: number;
        content: string;
        category: string;
        dev_group_id: number | null;
        weight_percent: any;
        is_active: boolean;
      }> = [];

      for (const q of questions) {
        const newQuestion = await tx.question.create({
          data: {
            content: q.content.trim(),
            category: "SPECIAL",
            dev_group_id: user.dev_group_id,
            weight_percent: 10.0, // 각 10% (총 20%)
            is_active: true,
          },
        });
        created.push(newQuestion);
      }

      return created;
    });

    return NextResponse.json(
      {
        message: "특별 질문이 작성되었습니다.",
        questions: createdQuestions.map((q) => ({
          questionId: q.question_id,
          content: q.content,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Select Hot Developer questions error:", error);
    return NextResponse.json(
      { error: "질문 선정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

