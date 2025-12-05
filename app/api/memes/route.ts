import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const devGroup = searchParams.get("devGroup"); // "all", "1", "2", "3", "4"
    const sortBy = searchParams.get("sortBy") || "likes"; // "likes" or "latest"
    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("user_id")?.value;

    // 필터링 조건
    let whereClause: any = {};

    if (devGroup && devGroup !== "all") {
      whereClause.user = {
        dev_group_id: parseInt(devGroup),
      };
    }

    // 정렬 조건
    let orderBy: any = {};
    if (sortBy === "likes") {
      orderBy = { like_count: "desc" };
    } else if (sortBy === "latest") {
      orderBy = { created_at: "desc" };
    }

    // 밈 목록 조회
    const memes = await prisma.meme.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            dev_group: true,
            role: true,
          },
        },
        likes: currentUserId
          ? {
              where: {
                user_id: parseInt(currentUserId),
              },
            }
          : false,
      },
      orderBy,
      take: 50, // 최대 50개
    });

    // 현재 사용자가 좋아요한 밈 ID 목록
    const likedMemeIds = currentUserId
      ? await prisma.meme_like.findMany({
          where: {
            user_id: parseInt(currentUserId),
            meme_id: { in: memes.map((m) => m.meme_id) },
          },
          select: {
            meme_id: true,
          },
        })
      : [];

    const likedSet = new Set(likedMemeIds.map((l) => l.meme_id));

    // 직군 이름 매핑 (DB: 한글 -> 화면: 영문)
    const roleNameMap: Record<string, string> = {
      프론트엔드: "Frontend",
      백엔드: "Backend",
      AI: "AI",
      모바일: "Mobile",
    };

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

    const formattedMemes = memes.map((meme) => ({
      id: meme.meme_id,
      username: meme.user.nickname,
      devGroup: roleNameMap[meme.user.dev_group.name] || meme.user.dev_group.name,
      role: meme.user.role.name,
      title: meme.title || "",
      content: meme.content_text || "",
      imageUrl: meme.image_url,
      likes: meme.like_count,
      isLiked: likedSet.has(meme.meme_id),
      timeAgo: getTimeAgo(meme.created_at),
      createdAt: meme.created_at.toISOString(),
    }));

    return NextResponse.json(
      {
        memes: formattedMemes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get memes error:", error);
    return NextResponse.json(
      { error: "밈 목록을 불러오는 중 오류가 발생했습니다." },
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

    const body = await request.json();
    const { title, content, imageUrl } = body;

    // 입력 검증
    if (!title || !content) {
      return NextResponse.json(
        { error: "제목과 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    if (title.length > 255) {
      return NextResponse.json(
        { error: "제목은 255자 이하여야 합니다." },
        { status: 400 }
      );
    }

    // 이미지 URL 검증 및 저장
    let finalImageUrl: string | null = null;
    if (imageUrl) {
      // Supabase Storage URL인 경우 저장
      if (imageUrl.startsWith("http")) {
        // URL 길이 제한 확인 (255자)
        if (imageUrl.length <= 500) {
          finalImageUrl = imageUrl;
        } else {
          console.warn("Image URL too long, skipping");
        }
      }
    }

    // 밈 생성
    const meme = await prisma.meme.create({
      data: {
        user_id: parseInt(userId),
        title: title.trim(),
        content_text: content.trim(),
        image_url: finalImageUrl,
        like_count: 0,
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
        message: "밈이 등록되었습니다.",
        meme: {
          id: meme.meme_id,
          title: meme.title,
          content: meme.content_text,
          imageUrl: meme.image_url,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create meme error:", error);
    return NextResponse.json(
      { error: "밈 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

