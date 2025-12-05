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

    // Next.js 15에서는 params가 Promise일 수 있음
    const resolvedParams = await Promise.resolve(params);
    const memeId = parseInt(resolvedParams.id);
    if (isNaN(memeId)) {
      return NextResponse.json(
        { error: "올바른 밈 ID가 아닙니다." },
        { status: 400 }
      );
    }

    // 밈 존재 확인
    const meme = await prisma.meme.findUnique({
      where: { meme_id: memeId },
    });

    if (!meme) {
      return NextResponse.json(
        { error: "밈을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const userIdInt = parseInt(userId);

    // 이미 좋아요 했는지 확인
    const existingLike = await prisma.meme_like.findFirst({
      where: {
        meme_id: memeId,
        user_id: userIdInt,
      },
    });

    let isLiked: boolean;
    let newLikeCount: number;

    if (existingLike) {
      // 좋아요 취소
      await prisma.meme_like.deleteMany({
        where: {
          meme_id: memeId,
          user_id: userIdInt,
        },
      });

      // like_count 감소
      newLikeCount = Math.max(0, meme.like_count - 1);
      await prisma.meme.update({
        where: { meme_id: memeId },
        data: { like_count: newLikeCount },
      });

      isLiked = false;
    } else {
      // 좋아요 추가
      await prisma.meme_like.create({
        data: {
          meme_id: memeId,
          user_id: userIdInt,
        },
      });

      // like_count 증가
      newLikeCount = meme.like_count + 1;
      await prisma.meme.update({
        where: { meme_id: memeId },
        data: { like_count: newLikeCount },
      });

      isLiked = true;
    }

    return NextResponse.json(
      {
        isLiked,
        likeCount: newLikeCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Toggle meme like error:", error);
    return NextResponse.json(
      { error: "좋아요 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

