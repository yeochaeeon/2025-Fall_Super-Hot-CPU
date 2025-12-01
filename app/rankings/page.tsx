"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Flame } from "lucide-react";
import { RankingCard } from "@/components/RankingCard";
import { useState } from "react";

// 기존 Vite Rankings 페이지의 내용을 그대로 사용
const mockRankings = [
  {
    rank: 1,
    username: "최고봉",
    role: "Frontend",
    temperature: 92,
    badges: [
      { icon: "🤖", name: "커밋 머신" },
      { icon: "🎨", name: "새 화면이 나를 부른다" },
      { icon: "🧩", name: "CSS가 왜 그럴까" },
    ],
    commonAnswers: {
      commits: 28,
      coffee: 6,
      sleep: 5,
      devTime: 14,
    },
  },
  {
    rank: 2,
    username: "박코딩",
    role: "Backend",
    temperature: 89,
    badges: [
      { icon: "🛠️", name: "JSON 상하차 중" },
      { icon: "🔥", name: "Release 지옥에서 날 꺼내줘" },
    ],
    commonAnswers: {
      commits: 22,
      coffee: 4,
      sleep: 6,
      devTime: 11,
    },
  },
  {
    rank: 3,
    username: "김알고",
    role: "AI",
    temperature: 87,
    badges: [
      { icon: "🥲", name: "Loss 안 내려가서 눈물 흘리는 중" },
      { icon: "💀", name: "라벨링 하다 영혼 가출" },
    ],
    commonAnswers: {
      commits: 18,
      coffee: 7,
      sleep: 3,
      devTime: 15,
    },
  },
  {
    rank: 4,
    username: "이모바일",
    role: "Mobile",
    temperature: 84.7,
    badges: [
      { icon: "🔨", name: "Gradle의 노예" },
      { icon: "🔄", name: "컴포넌트 복붙 기계" },
    ],
    commonAnswers: {
      commits: 20,
      coffee: 3,
      sleep: 7,
      devTime: 10,
    },
  },
  {
    rank: 5,
    username: "정풀스택",
    role: "Frontend",
    temperature: 82.9,
    badges: [
      { icon: "🤖", name: "커밋 머신" },
      { icon: "💺", name: "엉덩이가 무거워" },
    ],
    commonAnswers: {
      commits: 25,
      coffee: 5,
      sleep: 5,
      devTime: 12,
    },
  },
];

export default function RankingsPage() {
  const [selectedDevGroup, setSelectedDevGroup] = useState<string>("all");

  const filteredByDevGroup = (() => {
    let filtered =
      selectedDevGroup === "all"
        ? [...mockRankings]
        : mockRankings.filter((r) => r.role === selectedDevGroup);

    // 온도 순으로 정렬 (높은 순)
    filtered = filtered.sort((a, b) => b.temperature - a.temperature);

    // 1~5위로 rank 재할당하고 최대 5개만 반환
    return filtered.slice(0, 5).map((ranking, index) => ({
      ...ranking,
      rank: index + 1,
    }));
  })();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-primary animate-glow" />
          <div>
            <h1 className="text-3xl font-bold">랭킹</h1>
            <p className="text-muted-foreground">Developer CPU 온도 순위</p>
          </div>
        </div>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted">
            <TabsTrigger
              value="today"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              오늘의 랭킹
            </TabsTrigger>
            <TabsTrigger
              value="total"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <Flame className="h-4 w-4 mr-2" />
              누적 랭킹
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6 mt-6">
            <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                전체 Developer 랭킹
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockRankings.map((ranking) => (
                  <RankingCard
                    key={ranking.rank}
                    rank={ranking.rank}
                    username={ranking.username}
                    role={ranking.role}
                    temperature={ranking.temperature}
                    badges={ranking.badges}
                    commonAnswers={ranking.commonAnswers}
                  />
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
              <div className="space-y-4 mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-secondary" />
                  직군별 랭킹
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant={selectedDevGroup === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDevGroup("all")}
                    className={
                      selectedDevGroup === "all"
                        ? "bg-primary/40 text-primary-foreground border-primary hover:bg-primary/90"
                        : "border-primary/30 hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
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
                        ? "bg-primary/40 text-primary-foreground border-primary hover:bg-primary/90"
                        : "border-primary/30 hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
                    }
                  >
                    FE
                  </Button>
                  <Button
                    variant={
                      selectedDevGroup === "Backend" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedDevGroup("Backend")}
                    className={
                      selectedDevGroup === "Backend"
                        ? "bg-primary/40 text-primary-foreground border-primary hover:bg-primary/90"
                        : "border-primary/30 hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
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
                        ? "bg-primary/40 text-primary-foreground border-primary hover:bg-primary/90"
                        : "border-primary/30 hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
                    }
                  >
                    AI
                  </Button>
                  <Button
                    variant={
                      selectedDevGroup === "Mobile" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedDevGroup("Mobile")}
                    className={
                      selectedDevGroup === "Mobile"
                        ? "bg-primary/40 text-primary-foreground border-primary hover:bg-primary/90"
                        : "border-primary/30 hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
                    }
                  >
                    Mobile
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {filteredByDevGroup.map((ranking) => (
                  <RankingCard
                    key={ranking.rank}
                    rank={ranking.rank}
                    username={ranking.username}
                    role={ranking.role}
                    temperature={ranking.temperature}
                    badges={ranking.badges}
                  />
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="total" className="space-y-6 mt-6">
            <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Flame className="h-5 w-5 text-accent" />
                누적 전체 랭킹
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockRankings.map((ranking) => (
                  <RankingCard
                    key={ranking.rank}
                    rank={ranking.rank}
                    username={ranking.username}
                    role={ranking.role}
                    temperature={ranking.temperature}
                    badges={ranking.badges}
                    commonAnswers={ranking.commonAnswers}
                  />
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
              <div className="space-y-4 mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Flame className="h-5 w-5 text-secondary" />
                  누적 직군별 랭킹
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant={selectedDevGroup === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDevGroup("all")}
                    className={
                      selectedDevGroup === "all"
                        ? "bg-primary/40 text-primary-foreground border-primary hover:bg-primary/90"
                        : "border-primary/30 hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
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
                        ? "bg-primary/40 text-primary-foreground border-primary hover:bg-primary/90"
                        : "border-primary/30 hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
                    }
                  >
                    FE
                  </Button>
                  <Button
                    variant={
                      selectedDevGroup === "Backend" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedDevGroup("Backend")}
                    className={
                      selectedDevGroup === "Backend"
                        ? "bg-primary/40 text-primary-foreground border-primary hover:bg-primary/90"
                        : "border-primary/30 hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
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
                        ? "bg-primary/40 text-primary-foreground border-primary hover:bg-primary/90"
                        : "border-primary/30 hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
                    }
                  >
                    AI
                  </Button>
                  <Button
                    variant={
                      selectedDevGroup === "Mobile" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedDevGroup("Mobile")}
                    className={
                      selectedDevGroup === "Mobile"
                        ? "bg-primary/40 text-primary-foreground border-primary hover:bg-primary/90"
                        : "border-primary/30 hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
                    }
                  >
                    Mobile
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {filteredByDevGroup.map((ranking) => (
                  <RankingCard
                    key={ranking.rank}
                    rank={ranking.rank}
                    username={ranking.username}
                    role={ranking.role}
                    temperature={ranking.temperature}
                    badges={ranking.badges}
                  />
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
