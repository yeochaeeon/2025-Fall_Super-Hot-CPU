"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Laugh, Heart, ArrowLeft, Clock, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Meme {
  id: number;
  username: string;
  devGroup: string;
  role: string;
  title: string;
  content: string;
  imageUrl: string | null;
  likes: number;
  isLiked: boolean;
  timeAgo: string;
  createdAt: string;
}

export default function MemeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const memeId = Number(params.id);
  const [meme, setMeme] = useState<Meme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    const loadMeme = async () => {
      if (!memeId || isNaN(memeId)) {
        console.error("Invalid memeId:", memeId, "params:", params);
        setMeme(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log("Loading meme with ID:", memeId);
        const response = await fetch(`/api/memes/${memeId}`);
        const data = await response.json();

        console.log("API response:", {
          status: response.status,
          ok: response.ok,
          hasMeme: !!data.meme,
          error: data.error,
        });

        if (response.ok && data.meme) {
          console.log("Meme loaded successfully:", data.meme.title);
          setMeme(data.meme);
        } else {
          console.error("Failed to load meme:", data.error || "Unknown error");
          setMeme(null);
        }
      } catch (error) {
        console.error("Load meme error:", error);
        setMeme(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadMeme();
  }, [memeId, params]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!meme) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">밈을 찾을 수 없습니다</p>
          <Button
            variant="outline"
            onClick={() => router.push("/memes")}
            className="hover:bg-primary/20 hover:text-primar bg-primary/10 border-primary/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로 돌아가기
          </Button>
        </div>
      </Layout>
    );
  }

  const getDevGroupColor = (devGroup: string) => {
    switch (devGroup) {
      case "Frontend":
      case "프론트엔드":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "Backend":
      case "백엔드":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50";
      case "AI":
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/50";
      case "Mobile":
      case "모바일":
        return "bg-pink-500/20 text-pink-400 border-pink-500/50";
      default:
        return "bg-muted/50 text-foreground border-primary/20";
    }
  };

  const getRankColor = (role: string) => {
    switch (role) {
      case "Root":
        return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
      case "Optimizer":
        return "bg-purple-500/20 text-purple-300 border border-purple-500/30";
      case "Hot Developer":
        return "bg-orange-500/20 text-orange-300 border border-orange-500/30";
      default:
        return "bg-muted/50 text-foreground border-primary/20";
    }
  };

  const handleLike = async () => {
    if (isLiking) return;

    try {
      setIsLiking(true);
      const response = await fetch(`/api/memes/${memeId}/like`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        setMeme((prev) =>
          prev
            ? {
                ...prev,
                isLiked: data.isLiked,
                likes: data.likeCount,
              }
            : null
        );
      } else if (response.status === 403) {
        // 일일 좋아요 제한 초과
        alert("일일 좋아요 등록 가능 개수를 초과했습니다.");
      }
    } catch (error) {
      console.error("Like meme error:", error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/memes")}
          className="hover:bg-primary/20 hover:text-primar"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>

        <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
          <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1 ml-2">
                    <span className="font-bold text-m">{meme.username}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-s border ${getDevGroupColor(
                        meme.devGroup
                      )}`}
                    >
                      {meme.devGroup}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-s border ${getRankColor(
                        meme.role
                      )}`}
                    >
                      {meme.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                    <Clock className="h-3 w-3" />
                    {meme.timeAgo}
                  </div>
                </div>
              </div>
            </div>

            {/* 이미지 영역 */}
            {meme.imageUrl && (
              <div className="w-full rounded-lg overflow-hidden border border-primary/20">
                <img
                  src={meme.imageUrl}
                  alt={meme.title}
                  className="w-full h-auto max-h-[600px] object-contain"
                />
              </div>
            )}

            {/* 제목 */}
            <h1 className="text-2xl font-bold">{meme.title}</h1>

            {/* 내용 */}
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground whitespace-pre-wrap">
                {meme.content}
              </p>
            </div>

            {/* 좋아요 버튼 */}
            <div className="flex items-center gap-4 pt-4 border-t border-primary/10">
              <Button
                variant="ghost"
                size="sm"
                disabled={isLiking}
                className={`transition-all duration-200 ${
                  meme.isLiked
                    ? "text-accent hover:bg-accent/20 hover:scale-105"
                    : "hover:bg-accent/10 hover:text-accent hover:scale-105"
                }`}
                onClick={handleLike}
              >
                {isLiking ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Heart
                    className={`h-4 w-4 mr-1 transition-all ${
                      meme.isLiked ? "fill-accent scale-110" : ""
                    }`}
                  />
                )}
                <span className="text-xs">{meme.likes}</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
