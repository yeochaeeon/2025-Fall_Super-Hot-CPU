import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nickname = searchParams.get("nickname");

    if (!nickname || nickname.length < 2) {
      return NextResponse.json(
        { available: false, message: "닉네임은 2자 이상이어야 합니다." },
        { status: 200 }
      );
    }

    const existingUser = await prisma.users.findUnique({
      where: { nickname },
    });

    return NextResponse.json(
      {
        available: !existingUser,
        message: existingUser
          ? "이미 사용 중인 닉네임입니다."
          : "사용 가능한 닉네임입니다.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Check nickname error:", error);
    return NextResponse.json(
      { available: false, message: "오류가 발생했습니다." },
      { status: 500 }
    );
  }
}



