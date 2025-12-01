"use client";

import { CPUGauge } from "./CPUGauge";
import { Badge } from "./BadgeDisplay";

interface RankCardProps {
  rank: number;
  username: string;
  role: string;
  temperature: number;
  badges?: Badge[];
}

export function RankCard({ rank, username, role, temperature, badges = [] }: RankCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-muted-foreground">#{rank}</span>
            <h4 className="text-xl font-bold">{username}</h4>
          </div>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
        <CPUGauge temperature={temperature} size="md" />
      </div>
      
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 border border-primary/20"
            >
              <span>{badge.icon}</span>
              <span className="text-xs font-medium">{badge.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

