import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const devGroup = searchParams.get("devGroup"); // "all", "1", "2", "3", "4"

    // 필터링 조건
    let whereClause: any = {};

    if (devGroup && devGroup !== "all") {
      whereClause.dev_group_id = parseInt(devGroup);
    }

    // 고민 목록 조회
    const concerns = await prisma.concern.findMany({
      where: whereClause,
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
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: 50,
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

    // 직군 이름 매핑 (DB: 한글 -> 화면: 영문)
    const roleNameMap: Record<string, string> = {
      프론트엔드: "Frontend",
      백엔드: "Backend",
      AI: "AI",
      모바일: "Mobile",
    };

    const formattedConcerns = concerns.map((concern) => {
      const hasAcceptedAnswer = concern.answer.some(
        (answer) => answer.is_accepted === true
      );

      return {
        id: concern.concern_id,
        author: concern.user.nickname,
        devGroup: roleNameMap[concern.user.dev_group.name] || concern.user.dev_group.name,
        role: concern.user.role.name,
        title: concern.title,
        content: concern.content,
        answers: concern.answer.length,
        timeAgo: getTimeAgo(concern.created_at),
        createdAt: concern.created_at.toISOString(),
        status: hasAcceptedAnswer ? "답변 완료" : "답변 대기중",
        wasGood: concern.was_good,
      };
    });

    return NextResponse.json(
      {
        concerns: formattedConcerns,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get concerns error:", error);
    return NextResponse.json(
      { error: "고민 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

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

    // 사용자 정보 조회 (권한 확인)
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

    // 권한 확인: Developer, Hot Developer, Root만 등록 가능
    const allowedRoles = ["Developer", "Hot Developer", "Root"];
    if (!allowedRoles.includes(user.role.name)) {
      return NextResponse.json(
        { error: "고민 등록 권한이 없습니다. (Developer, Hot Developer, Root만 가능)" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, devGroupId } = body;

    // 입력 검증
    if (!title || !content || !devGroupId) {
      return NextResponse.json(
        { error: "제목, 내용, 직군을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    if (title.length > 255) {
      return NextResponse.json(
        { error: "제목은 255자 이하여야 합니다." },
        { status: 400 }
      );
    }

    // 고민 등록
    const concern = await prisma.concern.create({
      data: {
        user_id: parseInt(userId),
        dev_group_id: parseInt(devGroupId),
        title: title.trim(),
        content: content.trim(),
        was_good: null,
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

    return NextResponse.json(
      {
        message: "고민이 등록되었습니다.",
        concern: {
          id: concern.concern_id,
          title: concern.title,
          content: concern.content,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create concern error:", error);
    return NextResponse.json(
      { error: "고민 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

