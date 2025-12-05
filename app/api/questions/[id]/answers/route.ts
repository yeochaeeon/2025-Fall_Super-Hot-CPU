import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(
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
    const concernId = parseInt(resolvedParams.id);

    if (isNaN(concernId)) {
      return NextResponse.json(
        { error: "올바른 고민 ID가 아닙니다." },
        { status: 400 }
      );
    }

    // 고민 존재 확인
    const concern = await prisma.concern.findUnique({
      where: { concern_id: concernId },
      include: {
        user: {
          include: {
            dev_group: true,
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

    // 사용자 정보 조회 (권한 확인)
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

    // 권한 확인: Optimizer 또는 Root만 답변 가능
    const allowedRoles = ["Optimizer", "Root"];
    if (!allowedRoles.includes(user.role.name)) {
      return NextResponse.json(
        { error: "답변 작성 권한이 없습니다. (Optimizer, Root만 가능)" },
        { status: 403 }
      );
    }

    // Optimizer는 같은 직군의 고민에만 답변 가능 (Root는 제외)
    if (user.role.name === "Optimizer" && user.dev_group_id !== concern.dev_group_id) {
      return NextResponse.json(
        { error: "같은 직군의 고민에만 답변할 수 있습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content } = body;

    // 입력 검증
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "답변 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    // 답변 등록
    const answer = await prisma.concern_answer.create({
      data: {
        concern_id: concernId,
        user_id: parseInt(userId),
        content: content.trim(),
        is_accepted: false,
      },
      include: {
        user: {
          include: {
            dev_group: true,
            role: true,
          },
        },
      },
    });

    // 답변 작성자의 total_answers 증가
    await prisma.users.update({
      where: { user_id: parseInt(userId) },
      data: {
        total_answers: {
          increment: 1,
        },
      },
    });

    // 시간 계산 헬퍼 함수
    const getTimeAgo = (date: Date) => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}일 전`;
      if (hours > 0) return `${hours}시간 전`;
      if (minutes > 0) return `${minutes}분 전`;
      return "방금 전";
    };

    // 직군 이름 매핑
    const roleNameMap: Record<string, string> = {
      프론트엔드: "Frontend",
      백엔드: "Backend",
      AI: "AI",
      모바일: "Mobile",
    };

    const formattedAnswer = {
      id: answer.concern_answer_id,
      author: answer.user.nickname,
      authorId: answer.user_id,
      devGroup: roleNameMap[answer.user.dev_group.name] || answer.user.dev_group.name,
      role: answer.user.role.name,
      content: answer.content,
      timeAgo: getTimeAgo(answer.created_at),
      createdAt: answer.created_at.toISOString(),
      isAccepted: false,
    };

    return NextResponse.json(
      {
        message: "답변이 등록되었습니다.",
        answer: formattedAnswer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create answer error:", error);
    return NextResponse.json(
      { error: "답변 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

