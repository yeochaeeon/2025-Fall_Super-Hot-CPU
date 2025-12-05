import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Next.js 15+에서는 params가 Promise일 수 있음
    const resolvedParams = await Promise.resolve(params);
    const memeId = parseInt(resolvedParams.id);
    
    console.log("GET /api/memes/[id] - memeId:", memeId);
    
    if (isNaN(memeId)) {
      console.error("Invalid memeId:", resolvedParams.id);
      return NextResponse.json(
        { error: "올바른 밈 ID가 아닙니다." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("user_id")?.value;

    // 밈 상세 조회
    const meme = await prisma.meme.findUnique({
      where: { meme_id: memeId },
      include: {
        user: {
          include: {
            dev_group: true,
            role: true,
          },
        },
      },
    });

    if (!meme) {
      console.log("Meme not found for ID:", memeId);
      return NextResponse.json(
        { error: "밈을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    console.log("Meme found:", meme.meme_id, meme.title);

    // 현재 사용자가 좋아요 했는지 확인
    let isLiked = false;
    if (currentUserId) {
      const userLike = await prisma.meme_like.findFirst({
        where: {
          meme_id: memeId,
          user_id: parseInt(currentUserId),
        },
      });
      isLiked = !!userLike;
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

    const formattedMeme = {
      id: meme.meme_id,
      username: meme.user.nickname,
      devGroup: roleNameMap[meme.user.dev_group.name] || meme.user.dev_group.name,
      role: meme.user.role.name,
      title: meme.title || "",
      content: meme.content_text || "",
      imageUrl: meme.image_url,
      likes: meme.like_count,
      isLiked,
      timeAgo: getTimeAgo(meme.created_at),
      createdAt: meme.created_at.toISOString(),
    };

    return NextResponse.json(
      {
        meme: formattedMeme,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get meme detail error:", error);
    return NextResponse.json(
      { error: "밈 상세 정보를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

