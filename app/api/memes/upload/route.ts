import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

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

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "파일 크기는 10MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    // 파일명 생성 (userId_timestamp_originalName)
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}_${timestamp}.${fileExt}`;
    const filePath = `meme-images/${fileName}`;

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from("meme-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json(
        { error: "이미지 업로드에 실패했습니다." },
        { status: 500 }
      );
    }

    // Public URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from("meme-images").getPublicUrl(filePath);

    return NextResponse.json(
      {
        url: publicUrl,
        path: filePath,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload image error:", error);
    return NextResponse.json(
      { error: "이미지 업로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
