import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Root의 질문 가중치 조정 API
 * 한 질문의 가중치를 증가시키고 다른 질문의 가중치를 감소시켜 총합 100% 유지
 * Root만 접근 가능
 */
export async function PATCH(request: NextRequest) {
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
        { error: "Root만 가중치를 변경할 수 있습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { increaseQuestionId, decreaseQuestionId, adjustAmount, reason } = body;

    // 입력 검증
    if (!increaseQuestionId || !decreaseQuestionId) {
      return NextResponse.json(
        { error: "증가할 질문과 감소할 질문을 모두 선택해주세요." },
        { status: 400 }
      );
    }

    if (increaseQuestionId === decreaseQuestionId) {
      return NextResponse.json(
        { error: "증가할 질문과 감소할 질문은 서로 달라야 합니다." },
        { status: 400 }
      );
    }

    if (adjustAmount === undefined || adjustAmount === null) {
      return NextResponse.json(
        { error: "조정할 가중치 값을 입력해주세요." },
        { status: 400 }
      );
    }

    const adjustValue = parseFloat(adjustAmount);
    if (isNaN(adjustValue) || adjustValue <= 0) {
      return NextResponse.json(
        { error: "조정할 가중치는 0보다 큰 값이어야 합니다." },
        { status: 400 }
      );
    }

    // 두 질문 모두 존재하는지 확인
    const [increaseQuestion, decreaseQuestion] = await Promise.all([
      prisma.question.findUnique({
        where: { question_id: parseInt(increaseQuestionId) },
      }),
      prisma.question.findUnique({
        where: { question_id: parseInt(decreaseQuestionId) },
      }),
    ]);

    if (!increaseQuestion || !decreaseQuestion) {
      return NextResponse.json(
        { error: "질문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // SPECIAL 카테고리 질문은 변경 불가
    if (increaseQuestion.category === "SPECIAL" || decreaseQuestion.category === "SPECIAL") {
      return NextResponse.json(
        { error: "Hot Developer 질문(SPECIAL)은 가중치를 변경할 수 없습니다." },
        { status: 400 }
      );
    }

    const increaseOldWeight = Number(increaseQuestion.weight_percent);
    const decreaseOldWeight = Number(decreaseQuestion.weight_percent);

    // 감소할 가중치가 충분한지 확인
    if (decreaseOldWeight < adjustValue) {
      return NextResponse.json(
        { error: `감소할 질문의 가중치(${decreaseOldWeight}%)가 조정값(${adjustValue}%)보다 작습니다.` },
        { status: 400 }
      );
    }

    // 증가 후 가중치가 100을 초과하지 않는지 확인
    if (increaseOldWeight + adjustValue > 100) {
      return NextResponse.json(
        { error: `증가 후 가중치(${increaseOldWeight + adjustValue}%)가 100%를 초과합니다.` },
        { status: 400 }
      );
    }

    const increaseNewWeight = increaseOldWeight + adjustValue;
    const decreaseNewWeight = decreaseOldWeight - adjustValue;

    // 트랜잭션으로 두 질문의 가중치를 동시에 업데이트하고 로그 기록
    const result = await prisma.$transaction(async (tx) => {
      // 1. 증가할 질문 가중치 업데이트
      const updatedIncreaseQuestion = await tx.question.update({
        where: { question_id: parseInt(increaseQuestionId) },
        data: {
          weight_percent: increaseNewWeight,
        },
      });

      // 2. 감소할 질문 가중치 업데이트
      const updatedDecreaseQuestion = await tx.question.update({
        where: { question_id: parseInt(decreaseQuestionId) },
        data: {
          weight_percent: decreaseNewWeight,
        },
      });

      // 3. 변경 이력 로깅 (두 질문 모두)
      await Promise.all([
        tx.question_weight_log.create({
          data: {
            question_id: parseInt(increaseQuestionId),
            old_weight_percent: increaseOldWeight,
            new_weight_percent: increaseNewWeight,
            changed_by_root: user.user_id,
            reason: reason || `가중치 ${adjustValue}% 증가 (${decreaseQuestion.content}에서 이동)`,
          },
        }),
        tx.question_weight_log.create({
          data: {
            question_id: parseInt(decreaseQuestionId),
            old_weight_percent: decreaseOldWeight,
            new_weight_percent: decreaseNewWeight,
            changed_by_root: user.user_id,
            reason: reason || `가중치 ${adjustValue}% 감소 (${increaseQuestion.content}로 이동)`,
          },
        }),
      ]);

      return {
        increaseQuestion: updatedIncreaseQuestion,
        decreaseQuestion: updatedDecreaseQuestion,
      };
    });

    return NextResponse.json(
      {
        message: "가중치가 성공적으로 조정되었습니다.",
        adjustments: [
          {
            question: {
              id: result.increaseQuestion.question_id,
              content: result.increaseQuestion.content,
              oldWeightPercent: increaseOldWeight,
              newWeightPercent: Number(result.increaseQuestion.weight_percent),
            },
          },
          {
            question: {
              id: result.decreaseQuestion.question_id,
              content: result.decreaseQuestion.content,
              oldWeightPercent: decreaseOldWeight,
              newWeightPercent: Number(result.decreaseQuestion.weight_percent),
            },
          },
        ],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Adjust question weight error:", error);
    return NextResponse.json(
      { error: "가중치 조정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

