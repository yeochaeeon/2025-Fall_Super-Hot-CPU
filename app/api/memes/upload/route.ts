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

    // 파일 크기 검증 (5MB - Supabase 제한에 맞춤)
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: `파일 크기는 5MB 이하여야 합니다. (현재: ${(file.size / 1024 / 1024).toFixed(2)}MB)` },
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
      console.error("Error details:", {
        message: error.message,
        statusCode: error.statusCode,
        error: error.error,
      });
      
      // 더 구체적인 에러 메시지 반환
      let errorMessage = "이미지 업로드에 실패했습니다.";
      if (error.statusCode === 413 || error.message?.includes("exceeded the maximum allowed size")) {
        errorMessage = "파일 크기가 너무 큽니다. 5MB 이하의 이미지를 업로드해주세요.";
      } else if (error.message?.includes("Bucket not found")) {
        errorMessage = "저장소 버킷을 찾을 수 없습니다. 관리자에게 문의하세요.";
      } else if (error.message?.includes("new row violates row-level security")) {
        errorMessage = "업로드 권한이 없습니다. 관리자에게 문의하세요.";
      } else if (error.message) {
        errorMessage = `이미지 업로드 실패: ${error.message}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: error.statusCode === 413 ? 413 : 500 }
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
  } catch (error: any) {
    console.error("Upload image error:", error);
    console.error("Error stack:", error?.stack);
    
    // 더 구체적인 에러 메시지
    let errorMessage = "이미지 업로드 중 오류가 발생했습니다.";
    if (error?.message) {
      errorMessage = `이미지 업로드 오류: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
