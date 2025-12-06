import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
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

    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(userId) },
      select: {
        user_id: true,
        nickname: true,
        dev_group_id: true,
        role_id: true,
        dev_group: {
          select: {
            name: true,
          },
        },
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      // 쿠키는 있지만 사용자가 없는 경우 쿠키 삭제
      cookieStore.delete("user_id");
      cookieStore.delete("nickname");
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    // Hot Developer인 경우, 오늘 선정되었는지 확인
    let isHotDeveloperToday = false;
    if (user.role.name === "Hot Developer") {
      const hotDevRecord = await prisma.hot_developer.findUnique({
        where: {
          dev_group_id_effective_date: {
            dev_group_id: user.dev_group_id,
            effective_date: today,
          },
        },
      });
      isHotDeveloperToday =
        !!hotDevRecord && hotDevRecord.user_id === user.user_id;
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.user_id,
          nickname: user.nickname,
          devGroup: user.dev_group.name,
          devGroupId: user.dev_group_id,
          role: user.role.name,
          roleId: user.role_id,
          isHotDeveloperToday, // 오늘 Hot Developer로 선정되었는지 여부
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
