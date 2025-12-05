"use client";

import { CPUGauge } from "./CPUGauge";

interface RankCardProps {
  rank: number;
  username: string;
  role: string;
  temperature: number;
  badges?: Array<{ icon: string; name: string }>; // 질문에서 얻은 칭호들
  commonAnswers?: {
    commits: number;
    coffee: number;
    sleep: number;
    devTime: number;
  };
  size?: "md" | "lg";
}

export function RankCard({
  rank,
  username,
  role,
  temperature,
  badges = [],
  commonAnswers,
  size = "md",
}: RankCardProps) {
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
      icon: "⏳",
      value: commonAnswers?.devTime,
      unit: "시간",
    },
  ];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-2xl font-bold text-muted-foreground">
              #{rank}
            </span>
            <h4 className="text-xl font-bold">{username}</h4>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium border ${getRoleColor(
                role
              )}`}
            >
              {role}
            </span>
          </div>
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, index) => (
                <div
                  key={`${badge.name}-${index}`}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 border border-primary/20"
                >
                  <span>{badge.icon}</span>
                  <span className="text-xs font-medium">{badge.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <CPUGauge temperature={temperature} size="md" />
      </div>

      {commonAnswers && (
        <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
          <div className="space-y-2">
            {commonQuestions.map((q) => (
              <div
                key={q.key}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{q.icon}</span>
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
  );
}
