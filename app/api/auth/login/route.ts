import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, password } = body;

    // 입력 검증
    if (!nickname || !password) {
      return NextResponse.json(
        { error: "닉네임과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    // 사용자 조회
    const user = await prisma.users.findUnique({
      where: { nickname },
      include: {
        dev_group: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "닉네임 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "닉네임 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // 세션 쿠키 설정 (간단한 구현, 실제로는 JWT나 더 안전한 방법 사용 권장)
    const cookieStore = await cookies();
    cookieStore.set("user_id", user.user_id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: "/",
    });

    cookieStore.set("nickname", user.nickname, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: "/",
    });

    return NextResponse.json(
      {
        message: "로그인 성공",
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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "로그인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}



