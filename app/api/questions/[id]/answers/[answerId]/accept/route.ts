import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; answerId: string }> | { id: string; answerId: string } }
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
    const concernId = parseInt(resolvedParams.id);
    const answerId = parseInt(resolvedParams.answerId);

    if (isNaN(concernId) || isNaN(answerId)) {
      return NextResponse.json(
        { error: "올바른 ID가 아닙니다." },
        { status: 400 }
      );
    }

    // 고민 존재 확인 및 작성자 확인
    const concern = await prisma.concern.findUnique({
      where: { concern_id: concernId },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!concern) {
      return NextResponse.json(
        { error: "고민을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 작성자만 채택 가능
    if (concern.user_id !== parseInt(userId)) {
      return NextResponse.json(
        { error: "고민 작성자만 답변을 채택할 수 있습니다." },
        { status: 403 }
      );
    }

    // 권한 확인: Developer, Hot Developer, Root만 채택 가능
    const allowedRoles = ["Developer", "Hot Developer", "Root"];
    if (!allowedRoles.includes(concern.user.role.name)) {
      return NextResponse.json(
        { error: "답변 채택 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 답변 존재 확인
    const answer = await prisma.concern_answer.findUnique({
      where: { concern_answer_id: answerId },
    });

    if (!answer) {
      return NextResponse.json(
        { error: "답변을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 답변이 해당 고민의 답변인지 확인
    if (answer.concern_id !== concernId) {
      return NextResponse.json(
        { error: "해당 고민의 답변이 아닙니다." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { accept } = body; // true or false

    // 트랜잭션으로 모든 작업을 원자적으로 처리
    await prisma.$transaction(async (tx) => {
      // 기존에 채택된 답변이 있으면 모두 취소
      await tx.concern_answer.updateMany({
        where: {
          concern_id: concernId,
          is_accepted: true,
        },
        data: {
          is_accepted: false,
        },
      });

      // 선택한 답변 채택/취소
      if (accept) {
        await tx.concern_answer.update({
          where: { concern_answer_id: answerId },
          data: { is_accepted: true },
        });

        // 고민의 was_good도 업데이트 (채택 시 true)
        await tx.concern.update({
          where: { concern_id: concernId },
          data: { was_good: true },
        });

        // 답변 작성자의 total_accepted 증가
        await tx.users.update({
          where: { user_id: answer.user_id },
          data: {
            total_accepted: {
              increment: 1,
            },
          },
        });
      } else {
        // 채택 취소 시 was_good을 null로
        await tx.concern.update({
          where: { concern_id: concernId },
          data: { was_good: null },
        });

        // 답변 작성자의 total_accepted 감소 (이전에 채택되었던 경우만)
        if (answer.is_accepted) {
          await tx.users.update({
            where: { user_id: answer.user_id },
            data: {
              total_accepted: {
                decrement: 1,
              },
            },
          });
        }
      }
    });

    return NextResponse.json(
      {
        message: accept ? "답변이 채택되었습니다." : "채택이 취소되었습니다.",
        isAccepted: accept,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Accept answer error:", error);
    return NextResponse.json(
      { error: "답변 채택 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

