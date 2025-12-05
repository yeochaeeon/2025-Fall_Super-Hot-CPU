import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const concernId = parseInt(resolvedParams.id);
    
    if (isNaN(concernId)) {
      return NextResponse.json(
        { error: "올바른 고민 ID가 아닙니다." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("user_id")?.value;

    // 고민 상세 조회
    const concern = await prisma.concern.findUnique({
      where: { concern_id: concernId },
      include: {
        user: {
          include: {
            dev_group: true,
            role: true,
          },
        },
        answer: {
          include: {
            user: {
              include: {
                dev_group: true,
                role: true,
              },
            },
          },
          orderBy: {
            created_at: "asc",
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

    // 현재 사용자 정보 조회 (권한 확인용)
    let currentUser = null;
    if (currentUserId) {
      currentUser = await prisma.users.findUnique({
        where: { user_id: parseInt(currentUserId) },
        include: {
          role: true,
          dev_group: true,
        },
      });
    }

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

    // 직군 이름 매핑 (DB: 한글 -> 화면: 영문)
    const roleNameMap: Record<string, string> = {
      프론트엔드: "Frontend",
      백엔드: "Backend",
      AI: "AI",
      모바일: "Mobile",
    };

    const formattedConcern = {
      id: concern.concern_id,
      author: concern.user.nickname,
      authorId: concern.user_id,
      devGroup: roleNameMap[concern.user.dev_group.name] || concern.user.dev_group.name,
      role: concern.user.role.name,
      title: concern.title,
      content: concern.content,
      timeAgo: getTimeAgo(concern.created_at),
      createdAt: concern.created_at.toISOString(),
      wasGood: concern.was_good,
      answers: concern.answer.map((answer) => ({
        id: answer.concern_answer_id,
        author: answer.user.nickname,
        authorId: answer.user_id,
        devGroup: roleNameMap[answer.user.dev_group.name] || answer.user.dev_group.name,
        role: answer.user.role.name,
        content: answer.content,
        timeAgo: getTimeAgo(answer.created_at),
        createdAt: answer.created_at.toISOString(),
        isAccepted: answer.is_accepted === true,
      })),
    };

    // 권한 정보
    const canAnswer =
      currentUser &&
      (currentUser.role.name === "Optimizer" || currentUser.role.name === "Root");
    const isAuthor = currentUser && currentUser.user_id === concern.user_id;

    return NextResponse.json(
      {
        concern: formattedConcern,
        permissions: {
          canAnswer: !!canAnswer,
          isAuthor: !!isAuthor,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get concern detail error:", error);
    return NextResponse.json(
      { error: "고민 상세 정보를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

