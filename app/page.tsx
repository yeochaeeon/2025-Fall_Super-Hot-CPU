"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RankCard } from "@/components/RankCard";
import { CPUGauge } from "@/components/CPUGauge";
import {
  Trophy,
  TrendingUp,
  Laugh,
  MessageSquare,
  ArrowRight,
  Flame,
  Heart,
  RotateCw,
  Loader2,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TopUser {
  rank: number;
  username: string;
  role: string;
  temperature: number;
  badges: Array<{ icon: string; name: string }>;
  commonAnswers: {
    commits: number;
    coffee: number;
    sleep: number;
    devTime: number;
  };
}

interface TopRole {
  name: string;
  avgTemp: number;
  commonAnswers?: {
    commits: number;
    coffee: number;
    sleep: number;
    devTime: number;
  };
}

interface RecentMeme {
  id: number;
  author: string;
  content: string;
  imageUrl: string | null;
  likes: number;
  isLiked?: boolean;
}

interface RecentQuestion {
  id: number;
  author: string;
  role: string;
  title: string;
  answers: number;
}

export default function HomePage() {
  const router = useRouter();
  const [myCpuScore, setMyCpuScore] = useState<number | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(true);
  const [topUser, setTopUser] = useState<TopUser | null>(null);
  const [topRole, setTopRole] = useState<TopRole | null>(null);
  const [recentMemes, setRecentMemes] = useState<RecentMeme[]>([]);
  const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [likingMemeId, setLikingMemeId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isHotDeveloperToday, setIsHotDeveloperToday] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    loadUserInfo();
    loadMyScore();
    loadDashboardSummary();
  }, []);

  const loadUserInfo = async () => {
    try {
      const response = await fetch("/api/auth/check");
      const data = await response.json();
      if (data.authenticated && data.user) {
        setUserRole(data.user.role);
        setIsHotDeveloperToday(data.user.isHotDeveloperToday || false);
      }
    } catch (error) {
      console.error("Load user info error:", error);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const loadMyScore = async () => {
    try {
      setIsLoadingScore(true);
      const response = await fetch("/api/measure/score");
      const data = await response.json();

      if (response.ok && data.hasScore) {
        setMyCpuScore(data.cpuScore);
      }
    } catch (error) {
      console.error("Load score error:", error);
    } finally {
      setIsLoadingScore(false);
    }
  };

  const loadDashboardSummary = async () => {
    try {
      setIsLoadingDashboard(true);
      const response = await fetch("/api/dashboard/summary");
      const data = await response.json();

      if (response.ok) {
        setTopUser(data.topUser);
        setTopRole(data.topRole);
        setRecentMemes(data.recentMemes || []);
        setRecentQuestions(data.recentQuestions || []);
      }
    } catch (error) {
      console.error("Load dashboard summary error:", error);
    } finally {
      setIsLoadingDashboard(false);
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
        setRecentMemes((prevMemes) =>
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
      } else {
        console.error("Failed to like/unlike meme:", data.error);
      }
    } catch (error) {
      console.error("Error liking/unliking meme:", error);
    } finally {
      setLikingMemeId(null);
    }
  };

  const handleCardClick = (memeId: number) => {
    router.push(`/memes/${memeId}`);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-dark p-8 md:p-12 shadow-card">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
          <div className="relative z-10 text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold gradient-primary text-gradient animate-glow">
              Who's the SUPER HOT CPU?
            </h1>
            <p className="text-2xl text-muted-foreground max-w-2xl mx-auto">
              오늘의 개발 몰입도가 곧 레벨이 되는 공간
            </p>
            <div className="flex flex-col items-center justify-center gap-4 pt-4">
              {!isLoadingUser &&
              userRole === "Hot Developer" &&
              isHotDeveloperToday ? (
                <div className="w-full max-w-md space-y-4">
                  <Card className="p-6 bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/50">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Flame className="h-6 w-6 text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-orange-400 mb-2">
                          🔥 Hot Developer 선정!
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          축하합니다! 어제 직군 내 최고 CPU 온도를 기록하여 Hot
                          Developer로 선정되었습니다.
                        </p>
                        <p className="text-sm text-orange-300 mt-2 font-medium">
                          ⚠️ Hot Developer는 당일 CPU 온도를 측정할 수 없습니다.
                        </p>
                      </div>
                    </div>
                  </Card>
                  <Link href="/hot-developer/select">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                      <Flame className="h-4 w-4 mr-2" />
                      특별 질문 선정하기
                    </Button>
                  </Link>
                </div>
              ) : isLoadingScore ? (
                <div className="text-muted-foreground">로딩 중...</div>
              ) : myCpuScore !== null ? (
                <>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      내 오늘의 CPU 온도
                    </p>
                    <CPUGauge
                      temperature={Math.round(myCpuScore * 10) / 10}
                      size="lg"
                    />
                  </div>
                  <div className="w-full max-w-md space-y-3">
                    <Link href="/measure" className="block">
                      <Button
                        variant="outline"
                        className="w-full px-6 py-4 text-base font-medium border-2 border-primary/30 bg-background/50 backdrop-blur hover:border-primary/60 hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-[1.02]"
                      >
                        <RotateCw className="h-4 w-4 mr-2" />
                        오늘의 CPU 온도 재측정하기
                      </Button>
                    </Link>
                    {userRole === "Root" && (
                      <Link href="/admin/questions/weight" className="block">
                        <Button
                          variant="outline"
                          className="w-full border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-400"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Root: 질문 가중치 설정하기
                        </Button>
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      아직 측정하지 않았습니다
                    </p>
                    <CPUGauge temperature={0} size="lg" />
                  </div>
                  <div className="w-full max-w-md space-y-3">
                    <Link href="/measure" className="block">
                      <Button className="group relative w-full px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] text-black border-2 border-primary/50 shadow-neon hover:shadow-cpu transition-all duration-300 hover:scale-105 hover:-translate-y-1 overflow-hidden">
                        <span className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative flex items-center gap-2">
                          <Flame className="h-5 w-5 group-hover:animate-pulse" />
                          오늘의 CPU 온도 측정하기
                        </span>
                      </Button>
                    </Link>
                    {userRole === "Root" && (
                      <Link href="/admin/questions/weight" className="block">
                        <Button
                          variant="outline"
                          className="w-full border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-400"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Root: 질문 가중치 설정하기
                        </Button>
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Today's Rankings Summary */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* <Trophy className="h-6 w-6 text-primary" /> */}
              <Flame className="h-7 w-7 text-accent" />
              <h2 className="text-2xl font-bold">내일의 Hot Developer는?</h2>
            </div>
            <Link href="/rankings">
              <Button
                variant="ghost"
                className="hover:bg-primary/10 hover:text-primary"
              >
                전체 보기
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {isLoadingDashboard ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">로딩 중...</div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Top User */}
              {topUser ? (
                <Card className="p-6 bg-card/50 backdrop-blur border-primary/30 shadow-neon">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="h-5 w-5 text-accent" />
                    <h3 className="font-bold text-lg">실시간 Hot Developer</h3>
                  </div>
                  <RankCard {...topUser} />
                </Card>
              ) : (
                <Card className="p-6 bg-card/50 backdrop-blur border-primary/30 shadow-neon">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="h-5 w-5 text-accent" />
                    <h3 className="font-bold text-lg">실시간 Hot Developer</h3>
                  </div>
                  <div className="text-center py-8 text-muted-foreground">
                    아직 랭킹 데이터가 없습니다.
                  </div>
                </Card>
              )}

              {/* Top Role */}
              {topRole ? (
                <Card className="p-6 bg-card/50 backdrop-blur border-primary/30 shadow-neon flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                    <h3 className="font-bold text-lg">실시간 Hot CPU 직군</h3>
                  </div>
                  <div className="flex flex-col justify-between flex-1 min-h-0">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-primary/20">
                      <div>
                        <p className="text-2xl font-bold gradient-primary text-gradient">
                          {topRole.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          평균 CPU 온도
                        </p>
                      </div>
                      <CPUGauge
                        temperature={topRole.avgTemp}
                        size="md"
                        showLabel={false}
                      />
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 mt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🤖</span>
                            <span className="text-muted-foreground">
                              커밋 수
                            </span>
                          </div>
                          <span className="font-semibold text-foreground">
                            평균 {topRole.commonAnswers?.commits || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">☕</span>
                            <span className="text-muted-foreground">
                              마신 커피 잔 수
                            </span>
                          </div>
                          <span className="font-semibold text-foreground">
                            평균 {topRole.commonAnswers?.coffee || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">😴</span>
                            <span className="text-muted-foreground">
                              수면 시간
                            </span>
                          </div>
                          <span className="font-semibold text-foreground">
                            평균 {topRole.commonAnswers?.sleep || 0} 시간
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">⏳</span>
                            <span className="text-muted-foreground">
                              개발 시간
                            </span>
                          </div>
                          <span className="font-semibold text-foreground">
                            평균 {topRole.commonAnswers?.devTime || 0} 시간
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 bg-card/50 backdrop-blur border-primary/30 shadow-neon">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                    <h3 className="font-bold text-lg">오늘의 Hot CPU 직군</h3>
                  </div>
                  <div className="text-center py-8 text-muted-foreground">
                    아직 랭킹 데이터가 없습니다.
                  </div>
                </Card>
              )}
            </div>
          )}
        </section>

        {/* Memes Summary */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Laugh className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">TOP3 인기 밈</h2>
            </div>
            <Link href="/memes">
              <Button
                variant="ghost"
                className="hover:bg-primary/10 hover:text-primary"
              >
                더보기
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {isLoadingDashboard ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recentMemes.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {recentMemes.map((meme) => {
                const isLiked = meme.isLiked || false;
                const isLiking = likingMemeId === meme.id;
                return (
                  <Card
                    key={meme.id}
                    onClick={() => handleCardClick(meme.id)}
                    className="p-4 bg-card/50 backdrop-blur border-primary/20 hover:shadow-neon transition-all cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {meme.imageUrl ? (
                        <img
                          src={meme.imageUrl}
                          alt={meme.content || "Meme image"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Laugh className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm mb-2 flex-grow">{meme.content}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                      <span className="text-xs text-muted-foreground">
                        @{meme.author}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLiking}
                        className={`transition-all duration-200 ${
                          isLiked
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
                              isLiked ? "fill-accent scale-110" : ""
                            }`}
                          />
                        )}
                        <span className="text-xs">{meme.likes}</span>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 bg-card/50 backdrop-blur border-primary/20 text-center">
              <p className="text-muted-foreground">아직 인기 밈이 없습니다.</p>
            </Card>
          )}
        </section>

        {/* Questions Summary */}
        <section className="space-y-4 pb-20 md:pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">최근 고민</h2>
            </div>
            <Link href="/questions">
              <Button
                variant="ghost"
                className="hover:bg-primary/10 hover:text-primary"
              >
                더보기
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {recentQuestions.length > 0 ? (
              recentQuestions.map((question) => (
                <Card
                  key={question.id}
                  onClick={() => router.push(`/questions/${question.id}`)}
                  className="p-4 bg-card/50 backdrop-blur border-primary/20 hover:shadow-neon transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-lg font-bold">
                          @{question.author}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${
                            question.role === "Frontend" ||
                            question.role === "프론트엔드"
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                              : question.role === "Backend" ||
                                question.role === "백엔드"
                              ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50"
                              : question.role === "AI"
                              ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/50"
                              : "bg-pink-500/20 text-pink-400 border-pink-500/50"
                          }`}
                        >
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
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                아직 등록된 고민이 없습니다.
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
