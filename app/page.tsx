"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RankCard } from "@/components/RankCard";
import { CPUGauge } from "@/components/CPUGauge";
import { BADGE_DATA } from "@/components/BadgeDisplay";
import { Trophy, TrendingUp, Laugh, MessageSquare, ArrowRight, Flame } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const topUser = {
    rank: 1,
    username: "codemaster",
    role: "프론트엔드",
    temperature: 95,
    badges: [
      { icon: "🤖", name: "커밋 머신" },
      { icon: "☕", name: "내 몸의 70%는 아메리카노" },
      { icon: "🎨", name: "새 화면이 나를 부른다" },
    ],
    commonAnswers: {
      commits: 25,
      coffee: 5,
      sleep: 4,
      devTime: 12,
    },
  };

  const topRole = {
    name: "프론트엔드",
    avgTemp: 87,
  };

  const recentMemes = [
    { id: 1, author: "dev1", content: "CSS가 왜 그럴까...", likes: 42 },
    { id: 2, author: "dev2", content: "배포 지옥에서 날 꺼내줘", likes: 38 },
    { id: 3, author: "dev3", content: "커밋 머신 가동 중", likes: 35 },
  ];

  const recentQuestions = [
    { id: 1, author: "developer1", role: "백엔드", title: "API 설계 관련 질문입니다", answers: 3 },
    { id: 2, author: "developer2", role: "프론트엔드", title: "상태 관리 라이브러리 추천", answers: 5 },
    { id: 3, author: "developer3", role: "AI", title: "모델 학습 속도 개선 방법", answers: 2 },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-dark p-8 md:p-12 shadow-card">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
          <div className="relative z-10 text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold gradient-primary text-gradient animate-glow">
              DevCPU Community
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              개발자의 열정을 CPU 온도로 측정하는 커뮤니티
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <CPUGauge temperature={72} size="lg" />
            </div>
          </div>
        </div>

        {/* Today's Rankings Summary */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">오늘의 랭킹</h2>
            </div>
            <Link href="/rankings">
              <Button variant="ghost" className="hover:text-primary">
                전체 보기
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Top User */}
            <Card className="p-6 bg-card/50 backdrop-blur border-primary/30 shadow-neon">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="h-5 w-5 text-accent" />
                <h3 className="font-bold text-lg">오늘의 Hot Developer</h3>
              </div>
              <RankCard {...topUser} />
            </Card>

            {/* Top Role */}
            <Card className="p-6 bg-card/50 backdrop-blur border-primary/30 shadow-neon">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-secondary" />
                <h3 className="font-bold text-lg">오늘의 Hot CPU 직군</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-primary/20">
                  <div>
                    <p className="text-2xl font-bold gradient-primary text-gradient">{topRole.name}</p>
                    <p className="text-sm text-muted-foreground">평균 CPU 온도</p>
                  </div>
                  <CPUGauge temperature={topRole.avgTemp} size="md" showLabel={false} />
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🤖</span>
                        <span className="text-muted-foreground">커밋 수</span>
                      </div>
                      <span className="font-semibold text-foreground">평균 23</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-base">☕</span>
                        <span className="text-muted-foreground">마신 커피 잔 수</span>
                      </div>
                      <span className="font-semibold text-foreground">평균 5</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-base">😴</span>
                        <span className="text-muted-foreground">수면 시간</span>
                      </div>
                      <span className="font-semibold text-foreground">평균 5 시간</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-base">💺</span>
                        <span className="text-muted-foreground">개발 시간</span>
                      </div>
                      <span className="font-semibold text-foreground">평균 12 시간</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Memes Summary */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Laugh className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">인기 밈</h2>
            </div>
            <Link href="/memes">
              <Button variant="ghost" className="hover:text-primary">
                더보기
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {recentMemes.map((meme) => (
              <Card
                key={meme.id}
                className="p-4 bg-card/50 backdrop-blur border-primary/20 hover:shadow-neon transition-all"
              >
                <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                  <Laugh className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm mb-2">{meme.content}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>@{meme.author}</span>
                  <span>❤️ {meme.likes}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Questions Summary */}
        <section className="space-y-4 pb-20 md:pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">최근 고민</h2>
            </div>
            <Link href="/questions">
              <Button variant="ghost" className="hover:text-primary">
                더보기
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {recentQuestions.map((question) => (
              <Card
                key={question.id}
                className="p-4 bg-card/50 backdrop-blur border-primary/20 hover:shadow-neon transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm">@{question.author}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                        question.role === "프론트엔드" ? "bg-blue-500/20 text-blue-500 border-blue-500/50" :
                        question.role === "백엔드" ? "bg-green-500/20 text-green-500 border-green-500/50" :
                        question.role === "AI" ? "bg-purple-500/20 text-purple-500 border-purple-500/50" :
                        "bg-orange-500/20 text-orange-500 border-orange-500/50"
                      }`}>
                        {question.role}
                      </span>
                    </div>
                    <p className="font-semibold truncate">{question.title}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    {question.answers}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}

