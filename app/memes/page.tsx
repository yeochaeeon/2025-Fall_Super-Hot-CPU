"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Laugh, Plus, Heart } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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

export default function MemesPage() {
  const router = useRouter();
  const [selectedDevGroup, setSelectedDevGroup] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("likes");
  const [memes, setMemes] = useState<Meme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likingMemeId, setLikingMemeId] = useState<number | null>(null);

  // devGroup 매핑 (프론트엔드=1, 백엔드=2, AI=3, 모바일=4)
  const devGroupMap: Record<string, string> = {
    all: "all",
    Frontend: "1",
    Backend: "2",
    AI: "3",
    Mobile: "4",
  };

  // 밈 목록 로드
  const loadMemes = async () => {
    try {
      setIsLoading(true);
      const devGroupParam = devGroupMap[selectedDevGroup] || "all";
      const response = await fetch(
        `/api/memes?devGroup=${devGroupParam}&sortBy=${sortBy}`
      );
      const data = await response.json();

      if (response.ok) {
        setMemes(data.memes || []);
      }
    } catch (error) {
      console.error("Load memes error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMemes();
  }, [selectedDevGroup, sortBy]);

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

  const getRankColor = (rank: string) => {
    switch (rank) {
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

  const handleLike = async (e: React.MouseEvent, memeId: number) => {
    e.stopPropagation();

    if (likingMemeId === memeId) return; // 이미 처리 중이면 무시

    try {
      setLikingMemeId(memeId);
      const response = await fetch(`/api/memes/${memeId}/like`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        // 로컬 상태 업데이트
        setMemes((prevMemes) =>
          prevMemes.map((meme) =>
            meme.id === memeId
              ? {
                  ...meme,
                  isLiked: data.isLiked,
                  likes: data.likeCount,
                }
              : meme
          )
        );
      }
    } catch (error) {
      console.error("Like meme error:", error);
    } finally {
      setLikingMemeId(null);
    }
  };

  const handleCardClick = (memeId: number) => {
    router.push(`/memes/${memeId}`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Laugh className="h-8 w-8 text-primary animate-glow" />
            <div>
              <h1 className="text-3xl font-bold">밈 게시판</h1>
              <p className="text-muted-foreground">
                개발자의 일상을 공유하세요
              </p>
            </div>
          </div>
          <Link href="/memes/new">
            <Button className="group relative px-6 py-2.5 text-base font-semibold bg-primary/30 hover:bg-primary/40 text-white border border-primary/50 shadow-neon hover:shadow-cpu transition-all duration-300 hover:scale-105 hover:-translate-y-1">
              <span className="relative flex items-center gap-2">
                <Plus className="h-5 w-5" />밈 등록
              </span>
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant={selectedDevGroup === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDevGroup("all")}
                className={
                  selectedDevGroup === "all"
                    ? "bg-primary/40 text-primary-foreground border-primary hover:bg-primary/50"
                    : "bg-transparent border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }
              >
                전체
              </Button>
              <Button
                variant={
                  selectedDevGroup === "Frontend" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedDevGroup("Frontend")}
                className={
                  selectedDevGroup === "Frontend"
                    ? "bg-primary/40 text-primary-foreground border-primary hover:bg-primary/50"
                    : "bg-transparent border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }
              >
                FE
              </Button>
              <Button
                variant={selectedDevGroup === "Backend" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDevGroup("Backend")}
                className={
                  selectedDevGroup === "Backend"
                    ? "bg-primary/40 text-primary-foreground border-primary hover:bg-primary/50"
                    : "bg-transparent border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }
              >
                BE
              </Button>
              <Button
                variant={selectedDevGroup === "AI" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDevGroup("AI")}
                className={
                  selectedDevGroup === "AI"
                    ? "bg-primary/40 text-primary-foreground border-primary hover:bg-primary/50"
                    : "bg-transparent border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }
              >
                AI
              </Button>
              <Button
                variant={selectedDevGroup === "Mobile" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDevGroup("Mobile")}
                className={
                  selectedDevGroup === "Mobile"
                    ? "bg-primary/40 text-primary-foreground border-primary hover:bg-primary/50"
                    : "bg-transparent border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }
              >
                Mobile
              </Button>
            </div>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="정렬 기준" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="likes">좋아요순</SelectItem>
              <SelectItem value="latest">최신순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : memes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {memes.map((meme) => {
              const isLiking = likingMemeId === meme.id;
              return (
                <Card
                  key={meme.id}
                  onClick={() => handleCardClick(meme.id)}
                  className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card hover:shadow-neon transition-all cursor-pointer"
                >
                  <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {meme.imageUrl ? (
                      <img
                        src={meme.imageUrl}
                        alt={meme.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Laugh className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {meme.username}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs border ${getDevGroupColor(
                          meme.devGroup
                        )}`}
                      >
                        {meme.devGroup}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs border ${getRankColor(
                          meme.role
                        )}`}
                      >
                        {meme.role}
                      </span>
                    </div>
                    <h3 className="font-bold text-base">{meme.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {meme.content}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLiking}
                        className={`transition-all duration-200 ${
                          meme.isLiked
                            ? "text-accent hover:bg-accent/20 hover:scale-105"
                            : "hover:bg-accent/10 hover:text-accent hover:scale-105"
                        }`}
                        onClick={(e) => handleLike(e, meme.id)}
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
                      <span className="text-xs text-muted-foreground">
                        {meme.timeAgo}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">아직 등록된 밈이 없습니다.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
