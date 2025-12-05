"use client";

import { Card } from "@/components/ui/card";
import { CPUGauge } from "./CPUGauge";
import { Crown } from "lucide-react";

interface RankingCardProps {
  rank: number;
  username: string;
  role: string;
  temperature: number;
  badges?: Array<{ icon: string; name: string }>;
  commonAnswers?: {
    commits: number;
    coffee: number;
    sleep: number;
    devTime: number;
  };
}

export function RankingCard({
  rank,
  username,
  role,
  temperature,
  badges = [],
  commonAnswers,
}: RankingCardProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
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

  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return (
          <Crown className="h-7 w-7 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
        );
      case 2:
        return (
          <Crown className="h-7 w-7 text-gray-300 fill-gray-300 drop-shadow-[0_0_6px_rgba(209,213,219,0.5)]" />
        );
      case 3:
        return (
          <Crown className="h-7 w-7 text-amber-600 fill-amber-600 drop-shadow-[0_0_6px_rgba(217,119,6,0.5)]" />
        );
      default:
        return (
          <span className="text-2xl font-bold text-muted-foreground">
            #{rank}
          </span>
        );
    }
  };

  const commonQuestions = [
    {
      key: "commits",
      label: "커밋 수",
      icon: "🤖",
      value: commonAnswers?.commits,
    },
    {
      key: "coffee",
      label: "마신 커피 잔 수",
      icon: "☕",
      value: commonAnswers?.coffee,
    },
    {
      key: "sleep",
      label: "수면 시간",
      icon: "😴",
      value: commonAnswers?.sleep,
      unit: "시간",
    },
    {
      key: "devTime",
      label: "개발 시간",
      icon: "💺",
      value: commonAnswers?.devTime,
      unit: "시간",
    },
  ];

  const isTopThree = rank <= 3;

  return (
    <Card
      className={`p-4 bg-card/50 backdrop-blur transition-all duration-300 ${
        isTopThree
          ? "border-primary/50 shadow-neon hover:shadow-cpu hover:scale-105 hover:-translate-y-1 animate-pulse-slow"
          : "border-primary/20 shadow-card hover:shadow-neon hover:scale-[1.02] hover:-translate-y-0.5"
      }`}
    >
      <div className="flex flex-col justify-between space-y-4 h-full">
        {/* Rank and User Info */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 flex items-start justify-center w-8">
              {getRankIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className="text-lg font-bold truncate">{username}</h4>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium border ${getRoleColor(
                    role
                  )}`}
                >
                  {role}
                </span>
              </div>
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {badges.map((badge, index) => (
                    <div
                      key={`${badge.name}-${index}`}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted/50 border border-primary/20"
                    >
                      <span className="text-xs">{badge.icon}</span>
                      <span className="text-xs font-medium">{badge.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            <CPUGauge temperature={temperature} size="sm" />
          </div>
        </div>

        {/* Common Answers Stats */}
        {commonAnswers && (
          <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
            <div className="space-y-1.5">
              {commonQuestions.map((q) => (
                <div
                  key={q.key}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{q.icon}</span>
                    <span className="text-muted-foreground">{q.label}</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {q.value ?? 0}
                    {q.unit ? ` ${q.unit}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
