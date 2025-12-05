import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Hot Developer 조회 API (디버깅용)
 */
export async function GET() {
  try {
    // UTC 기준으로 오늘 날짜 생성
    const now = new Date();
    const today = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));

    // 오늘의 Hot Developer 조회
    const hotDevelopers = await prisma.hot_developer.findMany({
      where: {
        effective_date: today,
      },
      include: {
        user: {
          select: {
            user_id: true,
            nickname: true,
          },
        },
        dev_group: {
          select: {
            dev_group_id: true,
            name: true,
          },
        },
      },
    });

    // 모든 Hot Developer 기록 조회 (최근 10개)
    const allHotDevelopers = await prisma.hot_developer.findMany({
      orderBy: {
        effective_date: "desc",
      },
      include: {
        user: {
          select: {
            user_id: true,
            nickname: true,
          },
        },
        dev_group: {
          select: {
            dev_group_id: true,
            name: true,
          },
        },
      },
      take: 10,
    });

    return NextResponse.json(
      {
        today: today.toISOString().split("T")[0],
        todayHotDevelopers: hotDevelopers.map((hd) => ({
          devGroupId: hd.dev_group_id,
          devGroupName: hd.dev_group.name,
          userId: hd.user_id,
          userNickname: hd.user.nickname,
          effectiveDate: hd.effective_date.toISOString().split("T")[0],
        })),
        recentHotDevelopers: allHotDevelopers.map((hd) => ({
          devGroupId: hd.dev_group_id,
          devGroupName: hd.dev_group.name,
          userId: hd.user_id,
          userNickname: hd.user.nickname,
          effectiveDate: hd.effective_date.toISOString().split("T")[0],
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get hot developers error:", error);
    return NextResponse.json(
      { error: "Hot Developer 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

