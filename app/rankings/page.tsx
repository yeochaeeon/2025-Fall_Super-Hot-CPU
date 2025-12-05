"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Flame, Loader2 } from "lucide-react";
import { RankingCard } from "@/components/RankingCard";
import { useState, useEffect } from "react";

interface Ranking {
  rank: number;
  username: string;
  role: string;
  temperature: number;
  badges: Array<{ icon: string; name: string }>;
  commonAnswers?: {
    commits: number;
    coffee: number;
    sleep: number;
    devTime: number;
  };
}

export default function RankingsPage() {
  const [selectedDevGroup, setSelectedDevGroup] = useState<string>("all");
  // 전체 랭킹용 (항상 전체 데이터)
  const [todayAllRankings, setTodayAllRankings] = useState<Ranking[]>([]);
  const [totalAllRankings, setTotalAllRankings] = useState<Ranking[]>([]);
  // 직군별 랭킹용 (선택된 직군 데이터)
  const [todayGroupRankings, setTodayGroupRankings] = useState<Ranking[]>([]);
  const [totalGroupRankings, setTotalGroupRankings] = useState<Ranking[]>([]);
  const [isLoadingTodayAll, setIsLoadingTodayAll] = useState(true);
  const [isLoadingTotalAll, setIsLoadingTotalAll] = useState(true);
  const [isLoadingTodayGroup, setIsLoadingTodayGroup] = useState(true);
  const [isLoadingTotalGroup, setIsLoadingTotalGroup] = useState(true);
  const [activeTab, setActiveTab] = useState("today");

  // devGroup 매핑 (프론트엔드=1, 백엔드=2, AI=3, 모바일=4)
  const devGroupMap: Record<string, string> = {
    all: "all",
    Frontend: "1",
    Backend: "2",
    AI: "3",
    Mobile: "4",
  };

  // 전체 랭킹 로드 (항상 "all")
  const loadTodayAllRankings = async () => {
    try {
      setIsLoadingTodayAll(true);
      const response = await fetch(`/api/rankings/today?devGroup=all`);
      const data = await response.json();

      if (response.ok) {
        setTodayAllRankings(data.rankings || []);
      }
    } catch (error) {
      console.error("Load today all rankings error:", error);
    } finally {
      setIsLoadingTodayAll(false);
    }
  };

  const loadTotalAllRankings = async () => {
    try {
      setIsLoadingTotalAll(true);
      const response = await fetch(`/api/rankings/total?devGroup=all`);
      const data = await response.json();

      if (response.ok) {
        setTotalAllRankings(data.rankings || []);
      }
    } catch (error) {
      console.error("Load total all rankings error:", error);
    } finally {
      setIsLoadingTotalAll(false);
    }
  };

  // 직군별 랭킹 로드 (선택된 직군)
  const loadTodayGroupRankings = async () => {
    try {
      setIsLoadingTodayGroup(true);
      const devGroupParam = devGroupMap[selectedDevGroup] || "all";
      const response = await fetch(
        `/api/rankings/today?devGroup=${devGroupParam}`
      );
      const data = await response.json();

      if (response.ok) {
        setTodayGroupRankings(data.rankings || []);
      }
    } catch (error) {
      console.error("Load today group rankings error:", error);
    } finally {
      setIsLoadingTodayGroup(false);
    }
  };

  const loadTotalGroupRankings = async () => {
    try {
      setIsLoadingTotalGroup(true);
      const devGroupParam = devGroupMap[selectedDevGroup] || "all";
      const response = await fetch(
        `/api/rankings/total?devGroup=${devGroupParam}`
      );
      const data = await response.json();

      if (response.ok) {
        setTotalGroupRankings(data.rankings || []);
      }
    } catch (error) {
      console.error("Load total group rankings error:", error);
    } finally {
      setIsLoadingTotalGroup(false);
    }
  };

  // 전체 랭킹은 탭 변경 시에만 로드
  useEffect(() => {
    if (activeTab === "today") {
      loadTodayAllRankings();
    } else {
      loadTotalAllRankings();
    }
  }, [activeTab]);

  // 직군별 랭킹은 탭과 선택된 직군 변경 시 로드
  useEffect(() => {
    if (activeTab === "today") {
      loadTodayGroupRankings();
    } else {
      loadTotalGroupRankings();
    }
  }, [selectedDevGroup, activeTab]);

  // 전체 랭킹 데이터
  const allRankings =
    activeTab === "today" ? todayAllRankings : totalAllRankings;
  const isLoadingAll =
    activeTab === "today" ? isLoadingTodayAll : isLoadingTotalAll;
  const top3AllRankings = allRankings.slice(0, 3);

  // 직군별 랭킹 데이터
  const groupRankings =
    activeTab === "today" ? todayGroupRankings : totalGroupRankings;
  const isLoadingGroup =
    activeTab === "today" ? isLoadingTodayGroup : isLoadingTotalGroup;

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
              {isLoadingAll ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : top3AllRankings.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {top3AllRankings.map((ranking: Ranking) => (
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
              ) : (
                <p className="text-muted-foreground text-center py-12">
                  아직 랭킹 데이터가 없습니다.
                </p>
              )}
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
              <div className="space-y-4 mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-secondary" />
                  {selectedDevGroup === "all"
                    ? "직군별 랭킹"
                    : `${selectedDevGroup} 랭킹`}
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
              {isLoadingGroup ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : groupRankings.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupRankings.map((ranking: Ranking, index: number) => (
                    <RankingCard
                      key={`${ranking.username}-${index}`}
                      rank={index + 1}
                      username={ranking.username}
                      role={ranking.role}
                      temperature={ranking.temperature}
                      badges={ranking.badges}
                      commonAnswers={ranking.commonAnswers}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-12">
                  {selectedDevGroup === "all"
                    ? "아직 랭킹 데이터가 없습니다."
                    : `${selectedDevGroup} 직군의 랭킹 데이터가 없습니다.`}
                </p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="total" className="space-y-6 mt-6">
            <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Flame className="h-5 w-5 text-accent" />
                누적 전체 랭킹
              </h2>
              {isLoadingAll ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : top3AllRankings.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {top3AllRankings.map((ranking: Ranking) => (
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
              ) : (
                <p className="text-muted-foreground text-center py-12">
                  아직 랭킹 데이터가 없습니다.
                </p>
              )}
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
              <div className="space-y-4 mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Flame className="h-5 w-5 text-secondary" />
                  {selectedDevGroup === "all"
                    ? "누적 직군별 랭킹"
                    : `누적 ${selectedDevGroup} 랭킹`}
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
              {isLoadingGroup ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : groupRankings.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupRankings.map((ranking: Ranking, index: number) => (
                    <RankingCard
                      key={`${ranking.username}-${index}`}
                      rank={index + 1}
                      username={ranking.username}
                      role={ranking.role}
                      temperature={ranking.temperature}
                      badges={ranking.badges}
                      commonAnswers={ranking.commonAnswers}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-12">
                  {selectedDevGroup === "all"
                    ? "아직 랭킹 데이터가 없습니다."
                    : `${selectedDevGroup} 직군의 랭킹 데이터가 없습니다.`}
                </p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
