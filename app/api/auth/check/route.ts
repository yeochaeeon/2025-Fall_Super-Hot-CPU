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
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}



