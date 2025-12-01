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
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const mockMemes = [
  {
    id: 1,
    username: "최고봉",
    devGroup: "Frontend",
    rank: "Hot Developer",
    title: "프론트엔드 개발자의 일상",
    content: "CSS 한 줄 바꿨는데 전체 레이아웃이...",
    likes: 42,
    timeAgo: "2시간 전",
  },
  {
    id: 2,
    username: "박코딩",
    devGroup: "Backend",
    rank: "Optimizer",
    title: "백엔드의 고통",
    content: "프론트: API 왜 안돼요? 백엔드:",
    likes: 38,
    timeAgo: "3시간 전",
  },
  {
    id: 3,
    username: "김알고",
    devGroup: "AI",
    rank: "Developer",
    title: "AI 개발자 현실",
    content: "모델 학습중... (3일째)",
    likes: 51,
    timeAgo: "5시간 전",
  },
  {
    id: 4,
    username: "이모바일",
    devGroup: "Mobile",
    rank: "Hot Developer",
    title: "앱 개발자의 하루",
    content: "iOS에서는 되는데 Android에서는...",
    likes: 29,
    timeAgo: "1일 전",
  },
  {
    id: 5,
    username: "정풀스택",
    devGroup: "Frontend",
    rank: "Developer",
    title: "풀스택의 삶",
    content: "프론트도 하고 백도 하고... 정신없어",
    likes: 35,
    timeAgo: "1일 전",
  },
  {
    id: 6,
    username: "admin_root",
    devGroup: "Backend",
    rank: "Root",
    title: "서버 점검중",
    content: "새벽 2시에 서버가 다운되는 건 왜일까",
    likes: 67,
    timeAgo: "2일 전",
  },
];

export default function MemesPage() {
  const router = useRouter();
  const [selectedDevGroup, setSelectedDevGroup] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("likes");
  const [likedMemes, setLikedMemes] = useState<Set<number>>(new Set());

  const filteredMemes =
    selectedDevGroup === "all"
      ? mockMemes
      : mockMemes.filter((meme) => meme.devGroup === selectedDevGroup);

  const sortedMemes = [...filteredMemes].sort((a, b) => {
    if (sortBy === "likes") {
      return b.likes - a.likes;
    }
    return a.timeAgo.localeCompare(b.timeAgo);
  });

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "Root":
        return "bg-accent/20 text-accent border-accent/50";
      case "Optimizer":
        return "bg-secondary/20 text-secondary-foreground border-secondary/50";
      case "Hot Developer":
        return "bg-cpu-hot/20 text-cpu-hot border-cpu-hot/50";
      default:
        return "bg-muted/50 text-foreground border-primary/20";
    }
  };

  const handleLike = (e: React.MouseEvent, memeId: number) => {
    e.stopPropagation();
    setLikedMemes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(memeId)) {
        newSet.delete(memeId);
      } else {
        newSet.add(memeId);
      }
      return newSet;
    });
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
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-neon">
              <Plus className="h-4 w-4 mr-2" />밈 등록
            </Button>
          </Link>
        </div>

        <div className="flex gap-4 flex-wrap">
          <Select value={selectedDevGroup} onValueChange={setSelectedDevGroup}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="직군 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="Frontend">Frontend</SelectItem>
              <SelectItem value="Backend">Backend</SelectItem>
              <SelectItem value="AI">AI</SelectItem>
              <SelectItem value="Mobile">Mobile</SelectItem>
            </SelectContent>
          </Select>

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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedMemes.map((meme) => {
            const isLiked = likedMemes.has(meme.id);
            return (
              <Card
                key={meme.id}
                onClick={() => handleCardClick(meme.id)}
                className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card hover:shadow-neon transition-all cursor-pointer"
              >
                <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <Laugh className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{meme.username}</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-muted/50 border border-primary/20">
                      {meme.devGroup}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs border ${getRankColor(
                        meme.rank
                      )}`}
                    >
                      {meme.rank}
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
                      className={`hover:text-accent ${isLiked ? "text-accent" : ""}`}
                      onClick={(e) => handleLike(e, meme.id)}
                    >
                      <Heart 
                        className={`h-4 w-4 mr-1 ${isLiked ? "fill-accent" : ""}`} 
                      />
                      <span className="text-xs">{meme.likes + (isLiked ? 1 : 0)}</span>
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
      </div>
    </Layout>
  );
}
