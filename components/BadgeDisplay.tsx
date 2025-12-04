export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const BADGE_DATA: Record<string, Badge> = {
  commits: {
    id: "commits",
    name: "커밋 마스터",
    description: "하루 10개 이상 커밋",
    icon: "💻",
    color: "text-green-500",
  },
  coffee: {
    id: "coffee",
    name: "커피 중독자",
    description: "하루 커피 5잔 이상",
    icon: "☕",
    color: "text-amber-500",
  },
  pages: {
    id: "pages",
    name: "페이지 마스터",
    description: "하루 5페이지 이상 구현",
    icon: "📄",
    color: "text-blue-500",
  },
  debug: {
    id: "debug",
    name: "디버깅 전문가",
    description: "하루 버그 10개 이상 해결",
    icon: "🐛",
    color: "text-red-500",
  },
  hot: {
    id: "hot",
    name: "Hot Developer",
    description: "오늘의 Hot Developer",
    icon: "🔥",
    color: "text-orange-500",
  },
  apiDev: {
    id: "apiDev",
    name: "API 마스터",
    description: "API 개발 전문가",
    icon: "🔌",
    color: "text-purple-500",
  },
  deploy: {
    id: "deploy",
    name: "배포 전문가",
    description: "배포 마스터",
    icon: "🚀",
    color: "text-indigo-500",
  },
  css: {
    id: "css",
    name: "CSS 마스터",
    description: "CSS 전문가",
    icon: "🎨",
    color: "text-pink-500",
  },
  epoch: {
    id: "epoch",
    name: "에포크 마스터",
    description: "에포크 전문가",
    icon: "📊",
    color: "text-cyan-500",
  },
  colab: {
    id: "colab",
    name: "Colab 마스터",
    description: "Colab 전문가",
    icon: "💻",
    color: "text-blue-500",
  },
  dataset: {
    id: "dataset",
    name: "데이터셋 마스터",
    description: "데이터셋 전문가",
    icon: "📦",
    color: "text-teal-500",
  },
  experiment: {
    id: "experiment",
    name: "실험 마스터",
    description: "실험 전문가",
    icon: "🧪",
    color: "text-yellow-500",
  },
  schema: {
    id: "schema",
    name: "스키마 마스터",
    description: "스키마 전문가",
    icon: "🗄️",
    color: "text-slate-500",
  },
};

interface BadgeDisplayProps {
  badges: Badge[];
  maxDisplay?: number;
}

export function BadgeDisplay({ badges, maxDisplay = 5 }: BadgeDisplayProps) {
  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {displayBadges.map((badge) => (
        <div
          key={badge.id}
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 border border-primary/20"
          title={badge.description}
        >
          <span>{badge.icon}</span>
          <span className={`text-xs font-medium ${badge.color}`}>{badge.name}</span>
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 border border-primary/20">
          <span className="text-xs font-medium text-muted-foreground">
            +{remainingCount}
          </span>
        </div>
      )}
    </div>
  );
}

