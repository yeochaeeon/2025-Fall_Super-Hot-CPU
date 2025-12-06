import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * 역할별 일일 좋아요 제한 수
 */
const getDailyLikeLimit = (roleName: string): number => {
  switch (roleName) {
    case "Root":
      return 6;
    case "Developer":
    case "Hot Developer":
    case "Optimizer":
    default:
      return 3;
  }
};

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

    // 사용자 정보 및 역할 조회
    const user = await prisma.users.findUnique({
      where: { user_id: userIdInt },
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

    // 한국 시간(KST, UTC+9) 기준으로 오늘 날짜 생성
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // UTC+9 (밀리초)
    const kstNow = new Date(now.getTime() + kstOffset);
    const today = new Date(
      Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate()
      )
    );

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
      // 트랜잭션으로 좋아요 취소 작업을 원자적으로 처리
      await prisma.$transaction(async (tx) => {
        // 좋아요 취소
        await tx.meme_like.deleteMany({
          where: {
            meme_id: memeId,
            user_id: userIdInt,
          },
        });

        // like_count 감소
        newLikeCount = Math.max(0, meme.like_count - 1);
        await tx.meme.update({
          where: { meme_id: memeId },
          data: { like_count: newLikeCount },
        });

        // user_daily_like에서 좋아요 수 감소
        const dailyLike = await tx.user_daily_like.findUnique({
          where: {
            user_id_like_date: {
              user_id: userIdInt,
              like_date: today,
            },
          },
        });

        if (dailyLike) {
          await tx.user_daily_like.update({
            where: {
              user_id_like_date: {
                user_id: userIdInt,
                like_date: today,
              },
            },
            data: {
              like_count: Math.max(0, dailyLike.like_count - 1),
            },
          });
        }
      });

      isLiked = false;
    } else {
      // 역할별 일일 좋아요 제한 확인
      const dailyLikeLimit = getDailyLikeLimit(user.role.name);

      // 오늘 실제로 좋아요한 밈의 개수를 meme_like 테이블에서 직접 확인
      // 오늘 날짜의 시작 시간과 다음 날 시작 시간 계산
      const todayStart = new Date(today);
      const tomorrowStart = new Date(today);
      tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

      const todayLikes = await prisma.meme_like.findMany({
        where: {
          user_id: userIdInt,
          liked_at: {
            gte: todayStart,
            lt: tomorrowStart,
          },
        },
      });

      const currentLikeCount = todayLikes.length;

      if (currentLikeCount >= dailyLikeLimit) {
        return NextResponse.json(
          {
            error: `일일 좋아요 제한에 도달했습니다. (${user.role.name}: ${dailyLikeLimit}개/일)`,
            limit: dailyLikeLimit,
            current: currentLikeCount,
          },
          { status: 403 }
        );
      }

      // 트랜잭션으로 좋아요 추가 작업을 원자적으로 처리
      await prisma.$transaction(async (tx) => {
        // 좋아요 추가
        await tx.meme_like.create({
          data: {
            meme_id: memeId,
            user_id: userIdInt,
          },
        });

        // like_count 증가
        newLikeCount = meme.like_count + 1;
        await tx.meme.update({
          where: { meme_id: memeId },
          data: { like_count: newLikeCount },
        });

        // user_daily_like는 참고용으로만 업데이트 (실제 제한은 meme_like 테이블 기준)
        await tx.user_daily_like.upsert({
          where: {
            user_id_like_date: {
              user_id: userIdInt,
              like_date: today,
            },
          },
          update: {
            like_count: {
              increment: 1,
            },
          },
          create: {
            user_id: userIdInt,
            like_date: today,
            like_count: currentLikeCount + 1,
          },
        });
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

