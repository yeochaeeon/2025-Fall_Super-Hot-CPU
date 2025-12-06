import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Root의 질문 가중치 변경 API
 * Root만 접근 가능
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const questionId = parseInt(resolvedParams.id);

    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: "올바른 질문 ID가 아닙니다." },
        { status: 400 }
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
        { error: "Root만 가중치를 변경할 수 있습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { newWeightPercent, reason } = body;

    // 입력 검증
    if (newWeightPercent === undefined || newWeightPercent === null) {
      return NextResponse.json(
        { error: "새로운 가중치를 입력해주세요." },
        { status: 400 }
      );
    }

    const newWeight = parseFloat(newWeightPercent);
    if (isNaN(newWeight) || newWeight < 0 || newWeight > 100) {
      return NextResponse.json(
        { error: "가중치는 0 이상 100 이하여야 합니다." },
        { status: 400 }
      );
    }

    // 질문 존재 확인 및 현재 가중치 조회
    const question = await prisma.question.findUnique({
      where: { question_id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: "질문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const oldWeight = Number(question.weight_percent);

    // 가중치가 변경되지 않으면 에러
    if (oldWeight === newWeight) {
      return NextResponse.json(
        { error: "가중치가 변경되지 않았습니다." },
        { status: 400 }
      );
    }

    // 트랜잭션으로 가중치 변경 및 로그 기록
    const result = await prisma.$transaction(async (tx) => {
      // 1. 질문 가중치 업데이트
      const updatedQuestion = await tx.question.update({
        where: { question_id: questionId },
        data: {
          weight_percent: newWeight,
        },
      });

      // 2. 변경 이력 로깅
      await tx.question_weight_log.create({
        data: {
          question_id: questionId,
          old_weight_percent: oldWeight,
          new_weight_percent: newWeight,
          changed_by_root: user.user_id,
          reason: reason || null,
        },
      });

      return updatedQuestion;
    });

    return NextResponse.json(
      {
        message: "가중치가 성공적으로 변경되었습니다.",
        question: {
          id: result.question_id,
          content: result.content,
          category: result.category,
          oldWeightPercent: oldWeight,
          newWeightPercent: Number(result.weight_percent),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update question weight error:", error);
    return NextResponse.json(
      { error: "가중치 변경 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 질문 가중치 변경 이력 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const questionId = parseInt(resolvedParams.id);

    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: "올바른 질문 ID가 아닙니다." },
        { status: 400 }
      );
    }

    // 질문 존재 확인
    const question = await prisma.question.findUnique({
      where: { question_id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: "질문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 변경 이력 조회
    const weightLogs = await prisma.question_weight_log.findMany({
      where: { question_id: questionId },
      include: {
        changed_root: {
          select: {
            user_id: true,
            nickname: true,
          },
        },
      },
      orderBy: {
        changed_at: "desc",
      },
      take: 50, // 최근 50개
    });

    return NextResponse.json(
      {
        question: {
          id: question.question_id,
          content: question.content,
          category: question.category,
          currentWeightPercent: Number(question.weight_percent),
        },
        logs: weightLogs.map((log) => ({
          id: log.weight_log_id,
          oldWeightPercent: Number(log.old_weight_percent),
          newWeightPercent: Number(log.new_weight_percent),
          changedBy: {
            id: log.changed_root.user_id,
            nickname: log.changed_root.nickname,
          },
          changedAt: log.changed_at.toISOString(),
          reason: log.reason,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get question weight logs error:", error);
    return NextResponse.json(
      { error: "가중치 변경 이력을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

