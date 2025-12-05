"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Clock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Concern {
  id: number;
  author: string;
  devGroup: string;
  role: string;
  title: string;
  content: string;
  answers: number;
  timeAgo: string;
  createdAt: string;
  status: string;
  wasGood: boolean | null;
}

export default function QuestionsPage() {
  const router = useRouter();
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getDevGroupColor = (devGroup: string) => {
    switch (devGroup) {
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

  useEffect(() => {
    const loadConcerns = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/questions");
        const data = await response.json();

        if (response.ok) {
          setConcerns(data.concerns || []);
        }
      } catch (error) {
        console.error("Load concerns error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConcerns();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary animate-glow" />
            <div>
              <h1 className="text-3xl font-bold">고민 게시판</h1>
              <p className="text-muted-foreground">
                개발 고민을 나누고 해결하세요
              </p>
            </div>
          </div>

          <Button
            onClick={() => router.push("/questions/new")}
            className="group relative px-6 py-2.5 text-base font-semibold bg-primary/30 hover:bg-primary/40 text-white border border-primary/50 shadow-neon hover:shadow-cpu transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          >
            <span className="relative flex items-center gap-2">
              <Plus className="h-5 w-5" />
              고민 등록
            </span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : concerns.length > 0 ? (
          <div className="space-y-4">
            {concerns.map((concern) => (
              <Card
                key={concern.id}
                onClick={() => router.push(`/questions/${concern.id}`)}
                className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card hover:shadow-neon transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-lg font-bold">{concern.author}</p>
                      <span
                        className={`px-2 py-0.5 rounded text-xs border ${getDevGroupColor(
                          concern.devGroup
                        )}`}
                      >
                        {concern.devGroup}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs bg-muted/50 border border-primary/20">
                        {concern.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        concern.status === "답변 완료"
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {concern.status}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {concern.timeAgo}
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-2">{concern.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {concern.content}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-primary/30 hover:bg-primary/10 hover:text-primary"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    답변 {concern.answers}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              아직 등록된 고민이 없습니다.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
