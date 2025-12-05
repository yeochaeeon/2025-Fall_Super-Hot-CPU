import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, password, devGroup } = body;

    // 입력 검증
    if (!nickname || !password || !devGroup) {
      return NextResponse.json(
        { error: "모든 필드를 입력해주세요." },
        { status: 400 }
      );
    }

    if (nickname.length < 2) {
      return NextResponse.json(
        { error: "닉네임은 2자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "비밀번호는 4자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    // dev_group_id 매핑
    const devGroupMap: Record<string, number> = {
      Frontend: 1,
      Backend: 2,
      AI: 3,
      Mobile: 4,
    };

    const dev_group_id = devGroupMap[devGroup];
    if (!dev_group_id) {
      return NextResponse.json(
        { error: "올바른 직군을 선택해주세요." },
        { status: 400 }
      );
    }

    // 닉네임 중복 확인
    const existingUser = await prisma.users.findUnique({
      where: { nickname },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "이미 사용 중인 닉네임입니다." },
        { status: 409 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 초기 회원가입은 무조건 Developer 역할 (role_id = 1)
    const developerRole = await prisma.role.findUnique({
      where: { name: "Developer" },
    });

    if (!developerRole) {
      return NextResponse.json(
        { error: "Developer 역할이 데이터베이스에 없습니다. 관리자에게 문의하세요." },
        { status: 500 }
      );
    }

    const developerRoleId = developerRole.role_id;

    // 사용자 생성
    const user = await prisma.users.create({
      data: {
        nickname,
        password: hashedPassword,
        dev_group_id,
        role_id: developerRoleId,
      },
      select: {
        user_id: true,
        nickname: true,
        dev_group_id: true,
        role_id: true,
        joined_at: true,
      },
    });

    return NextResponse.json(
      {
        message: "회원가입이 완료되었습니다.",
        user: {
          id: user.user_id,
          nickname: user.nickname,
          devGroupId: user.dev_group_id,
          roleId: user.role_id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "회원가입 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}



