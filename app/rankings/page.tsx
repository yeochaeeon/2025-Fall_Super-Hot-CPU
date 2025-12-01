"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Flame } from "lucide-react";
import { RankCard } from "@/components/RankCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

// 기존 Vite Rankings 페이지의 내용을 그대로 사용
const mockRankings = [
  {
    rank: 1,
    username: "최고봉",
    role: "Frontend",
    temperature: 92.5,
    badges: [
      { emoji: "🔥", name: "핫데브", description: "가장 높은 온도" },
      { emoji: "⚡", name: "빠른손", description: "커밋왕" },
      { emoji: "🎨", name: "디자이너", description: "UI 마스터" },
    ],
  },
  {
    rank: 2,
    username: "박코딩",
    role: "Backend",
    temperature: 89.3,
    badges: [
      { emoji: "🚀", name: "성능왕", description: "최적화 달인" },
      { emoji: "📚", name: "문서왕", description: "문서화 장인" },
    ],
  },
  {
    rank: 3,
    username: "김알고",
    role: "AI",
    temperature: 87.1,
    badges: [
      { emoji: "🤖", name: "AI마스터", description: "인공지능 전문가" },
      { emoji: "🧠", name: "알고왕", description: "알고리즘 신" },
    ],
  },
  {
    rank: 4,
    username: "이모바일",
    role: "Mobile",
    temperature: 84.7,
    badges: [{ emoji: "📱", name: "앱마스터", description: "모바일 전문" }],
  },
  {
    rank: 5,
    username: "정풀스택",
    role: "Frontend",
    temperature: 82.9,
    badges: [{ emoji: "⚡", name: "빠른손", description: "커밋왕" }],
  },
];

export default function RankingsPage() {
  const [selectedDevGroup, setSelectedDevGroup] = useState<string>("all");

  const filteredByDevGroup =
    selectedDevGroup === "all"
      ? mockRankings
      : mockRankings.filter((r) => r.role === selectedDevGroup);

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
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/50">
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
              <div className="space-y-4">
                {mockRankings.map((ranking) => (
                  <RankCard
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

            <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-secondary" />
                  직군별 랭킹
                </h2>
                <Select
                  value={selectedDevGroup}
                  onValueChange={setSelectedDevGroup}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="직군 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="Frontend">Frontend</SelectItem>
                    <SelectItem value="Backend">Backend</SelectItem>
                    <SelectItem value="AI">AI</SelectItem>
                    <SelectItem value="Mobile">Mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                {filteredByDevGroup.map((ranking) => (
                  <RankCard
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
              <div className="space-y-4">
                {mockRankings.map((ranking) => (
                  <RankCard
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

            <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Flame className="h-5 w-5 text-secondary" />
                  누적 직군별 랭킹
                </h2>
                <Select
                  value={selectedDevGroup}
                  onValueChange={setSelectedDevGroup}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="직군 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="Frontend">Frontend</SelectItem>
                    <SelectItem value="Backend">Backend</SelectItem>
                    <SelectItem value="AI">AI</SelectItem>
                    <SelectItem value="Mobile">Mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                {filteredByDevGroup.map((ranking) => (
                  <RankCard
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
