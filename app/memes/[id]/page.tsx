"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Laugh, Heart, ArrowLeft, Clock } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const mockMemes: Record<number, {
  id: number;
  username: string;
  devGroup: string;
  rank: string;
  title: string;
  content: string;
  likes: number;
  timeAgo: string;
  image?: string;
}> = {
  1: {
    id: 1,
    username: "최고봉",
    devGroup: "Frontend",
    rank: "Hot Developer",
    title: "프론트엔드 개발자의 일상",
    content: "CSS 한 줄 바꿨는데 전체 레이아웃이...\n\n오늘도 하루 종일 CSS와 씨름했다. 한 줄만 바꿨는데 전체 레이아웃이 깨져서 3시간을 디버깅했다. 프론트엔드 개발자의 인생이란...",
    likes: 42,
    timeAgo: "2시간 전",
  },
  2: {
    id: 2,
    username: "박코딩",
    devGroup: "Backend",
    rank: "Optimizer",
    title: "백엔드의 고통",
    content: "프론트: API 왜 안돼요?\n백엔드: ...\n\n매일 같은 질문을 받는다. API 문서는 있는데 왜 안 읽는 걸까?",
    likes: 38,
    timeAgo: "3시간 전",
  },
  3: {
    id: 3,
    username: "김알고",
    devGroup: "AI",
    rank: "Developer",
    title: "AI 개발자 현실",
    content: "모델 학습중... (3일째)\n\nGPU가 타는 냄새가 난다. 언제 끝날까?",
    likes: 51,
    timeAgo: "5시간 전",
  },
  4: {
    id: 4,
    username: "이모바일",
    devGroup: "Mobile",
    rank: "Hot Developer",
    title: "앱 개발자의 하루",
    content: "iOS에서는 되는데 Android에서는...\n\n플랫폼별로 다른 버그를 만나면 정말 답답하다.",
    likes: 29,
    timeAgo: "1일 전",
  },
  5: {
    id: 5,
    username: "정풀스택",
    devGroup: "Frontend",
    rank: "Developer",
    title: "풀스택의 삶",
    content: "프론트도 하고 백도 하고... 정신없어\n\n풀스택 개발자는 정말 모든 걸 다 해야 한다.",
    likes: 35,
    timeAgo: "1일 전",
  },
  6: {
    id: 6,
    username: "admin_root",
    devGroup: "Backend",
    rank: "Root",
    title: "서버 점검중",
    content: "새벽 2시에 서버가 다운되는 건 왜일까\n\n항상 새벽에 문제가 생긴다. 왜 그럴까?",
    likes: 67,
    timeAgo: "2일 전",
  },
};

export default function MemeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const memeId = Number(params.id);
  const meme = mockMemes[memeId];
  const [isLiked, setIsLiked] = useState(false);

  if (!meme) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">밈을 찾을 수 없습니다</p>
          <Button
            variant="outline"
            onClick={() => router.push("/memes")}
            className="mt-4"
          >
            목록으로 돌아가기
          </Button>
        </div>
      </Layout>
    );
  }

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

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/memes")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>

        <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
          <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold">
                  {meme.username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold">{meme.username}</span>
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
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {meme.timeAgo}
                  </div>
                </div>
              </div>
            </div>

            {/* 이미지 영역 */}
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <Laugh className="h-24 w-24 text-muted-foreground" />
            </div>

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
                size="lg"
                className={`hover:text-accent ${isLiked ? "text-accent" : ""}`}
                onClick={handleLike}
              >
                <Heart 
                  className={`h-5 w-5 mr-2 ${isLiked ? "fill-accent" : ""}`} 
                />
                <span>{meme.likes + (isLiked ? 1 : 0)}</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

