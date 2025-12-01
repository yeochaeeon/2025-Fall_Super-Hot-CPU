"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeDisplay, BADGE_DATA } from "@/components/BadgeDisplay";
import { MessageSquare, Plus, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuestionsPage() {
  const router = useRouter();

  const questions = [
    {
      id: 1,
      author: "developer1",
      role: "백엔드",
      title: "API 설계 관련 질문입니다",
      content: "REST API와 GraphQL 중 어떤 것을 선택해야 할지 고민입니다...",
      answers: 3,
      time: "3시간 전",
      status: "답변 완료",
      badges: [BADGE_DATA.commits, BADGE_DATA.apiDev, BADGE_DATA.deploy],
    },
    {
      id: 2,
      author: "developer2",
      role: "프론트엔드",
      title: "상태 관리 라이브러리 추천해주세요",
      content: "Redux와 Zustand 중에서 고민중입니다. 프로젝트 규모는 중간 정도이고...",
      answers: 5,
      time: "5시간 전",
      status: "답변 대기중",
      badges: [BADGE_DATA.pages, BADGE_DATA.css, BADGE_DATA.coffee],
    },
    {
      id: 3,
      author: "developer3",
      role: "AI",
      title: "모델 학습 속도 개선 방법",
      content: "현재 학습 시간이 너무 오래 걸려서 개선 방법을 찾고 있습니다...",
      answers: 2,
      time: "1일 전",
      status: "답변 대기중",
      badges: [BADGE_DATA.epoch, BADGE_DATA.colab, BADGE_DATA.dataset, BADGE_DATA.experiment],
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary animate-glow" />
            <div>
              <h1 className="text-3xl font-bold">고민 게시판</h1>
              <p className="text-muted-foreground">개발 고민을 나누고 해결하세요</p>
            </div>
          </div>
          <Button
            onClick={() => router.push("/questions/new")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-neon"
          >
            <Plus className="h-4 w-4 mr-2" />
            고민 등록
          </Button>
        </div>

        <div className="space-y-4">
          {questions.map((question) => (
            <Card
              key={question.id}
              onClick={() => router.push(`/questions/${question.id}`)}
              className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card hover:shadow-neon transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {question.author.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-medium">{question.author}</p>
                      <span className="px-2 py-0.5 rounded text-xs bg-muted/50 border border-primary/20">
                        {question.role}
                      </span>
                    </div>
                    <BadgeDisplay badges={question.badges} maxDisplay={3} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      question.status === "답변 완료"
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {question.status}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {question.time}
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-2">{question.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{question.content}</p>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-primary/30 hover:bg-primary/10">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  답변 {question.answers}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}


