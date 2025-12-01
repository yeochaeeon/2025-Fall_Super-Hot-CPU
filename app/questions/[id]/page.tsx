"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BadgeDisplay, BADGE_DATA } from "@/components/BadgeDisplay";
import { MessageSquare, Clock, CheckCircle2, Award } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function QuestionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [answerContent, setAnswerContent] = useState("");

  const currentUser = {
    id: 2,
    nickname: "optimizer_kim",
    role: "optimizer" as const,
    dev_group: "백엔드",
  };

  const question = {
    id: Number(params.id),
    author: "developer1",
    authorId: 1,
    role: "백엔드",
    title: "API 설계 관련 질문입니다",
    content:
      "REST API와 GraphQL 중 어떤 것을 선택해야 할지 고민입니다. 현재 프로젝트는 중간 규모의 웹 애플리케이션이고, 클라이언트는 모바일과 웹 두 가지입니다. 각각의 장단점과 어떤 상황에서 어떤 것을 선택하는 게 좋을지 조언 부탁드립니다.",
    time: "3시간 전",
    badges: [BADGE_DATA.commits, BADGE_DATA.apiDev, BADGE_DATA.deploy],
    wasGood: null as boolean | null,
  };

  const [answers, setAnswers] = useState([
    {
      id: 1,
      author: "root_park",
      authorId: 3,
      role: "root" as const,
      dev_group: "AI",
      content:
        "REST API와 GraphQL은 각각 장단점이 있습니다. REST는 캐싱이 쉽고 학습 곡선이 낮습니다. GraphQL은 유연한 쿼리가 가능하지만 복잡도가 높습니다. 중간 규모라면 REST로 시작하고 필요시 GraphQL로 마이그레이션하는 것을 추천합니다.",
      time: "2시간 전",
      badges: [BADGE_DATA.colab, BADGE_DATA.experiment],
      isAccepted: true,
    },
    {
      id: 2,
      author: "optimizer_kim",
      authorId: 2,
      role: "optimizer" as const,
      dev_group: "백엔드",
      content:
        "저도 비슷한 고민을 했었는데, REST API로 가는 것을 추천드립니다. 모바일과 웹 클라이언트 모두 지원하기 쉽고, 캐싱 전략도 명확합니다. GraphQL은 over-fetching을 방지할 수 있지만, 초기 설정 비용이 높습니다.",
      time: "1시간 전",
      badges: [BADGE_DATA.commits, BADGE_DATA.apiDev, BADGE_DATA.schema],
      isAccepted: false,
    },
  ]);

  const canAnswer = currentUser.role === "optimizer" || currentUser.role === "root";
  const isAuthor = currentUser.id === question.authorId;

  const handleSubmitAnswer = () => {
    if (!answerContent.trim()) {
      toast({
        title: "답변을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    const newAnswer = {
      id: answers.length + 1,
      author: currentUser.nickname,
      authorId: currentUser.id,
      role: currentUser.role,
      dev_group: currentUser.dev_group,
      content: answerContent,
      time: "방금 전",
      badges: [BADGE_DATA.commits],
      isAccepted: false,
    };

    setAnswers([...answers, newAnswer]);
    setAnswerContent("");
    toast({
      title: "답변이 등록되었습니다",
    });
  };

  const handleAccept = (answerId: number, accept: boolean) => {
    setAnswers(
      answers.map((answer) =>
        answer.id === answerId ? { ...answer, isAccepted: accept } : { ...answer, isAccepted: false },
      ),
    );
    toast({
      title: accept ? "답변을 채택했습니다" : "채택을 취소했습니다",
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/questions")}
            className="text-muted-foreground hover:text-foreground"
          >
            ← 목록으로
          </Button>
        </div>

        <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                {question.author.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-medium">{question.author}</p>
                  <span className="px-2 py-0.5 rounded text-xs bg-muted/50 border border-primary/20">
                    {question.role}
                  </span>
                </div>
                <BadgeDisplay badges={question.badges} maxDisplay={5} />
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {question.time}
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-4">{question.title}</h1>
          <p className="text-muted-foreground whitespace-pre-wrap mb-4">{question.content}</p>

          <div className="flex items-center gap-2 pt-4 border-t border-primary/10">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">답변 {answers.length}개</span>
          </div>
        </Card>

        {canAnswer && (
          <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-primary animate-glow" />
              <h2 className="text-lg font-semibold">답변 작성</h2>
              <span className="text-xs text-muted-foreground">
                ({currentUser.role === "root" ? "ROOT" : "OPTIMIZER"} 전용)
              </span>
            </div>
            <Textarea
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              placeholder="개발 고민에 대한 답변을 작성해주세요..."
              className="min-h-[120px] mb-4 bg-background/50 border-primary/20 focus-visible:border-primary/50"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitAnswer}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-neon"
              >
                답변 등록
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            답변 목록
          </h2>

          {answers.length === 0 ? (
            <Card className="p-8 bg-card/50 backdrop-blur border-primary/20 text-center">
              <p className="text-muted-foreground">아직 답변이 없습니다.</p>
            </Card>
          ) : (
            answers.map((answer) => (
              <Card
                key={answer.id}
                className={`p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card transition-all ${
                  answer.isAccepted ? "ring-2 ring-primary shadow-neon" : ""
                }`}
              >
                {answer.isAccepted && (
                  <div className="flex items-center gap-2 mb-4 text-primary animate-glow">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-semibold">채택된 답변</span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        answer.role === "root"
                          ? "bg-gradient-to-br from-yellow-500 to-orange-500"
                          : "bg-gradient-to-br from-purple-500 to-pink-500"
                      }`}
                    >
                      {answer.author.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium">{answer.author}</p>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            answer.role === "root"
                              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                              : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          }`}
                        >
                          {answer.role.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-muted/50 border border-primary/20">
                          {answer.dev_group}
                        </span>
                      </div>
                      <BadgeDisplay badges={answer.badges} maxDisplay={3} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {answer.time}
                  </div>
                </div>

                <p className="text-muted-foreground whitespace-pre-wrap mb-4">{answer.content}</p>

                {isAuthor && (
                  <div className="flex items-center gap-2 pt-4 border-t border-primary/10">
                    <Button
                      size="sm"
                      variant={answer.isAccepted ? "default" : "outline"}
                      onClick={() => handleAccept(answer.id, !answer.isAccepted)}
                      className={
                        answer.isAccepted
                          ? "bg-primary text-primary-foreground shadow-neon"
                          : "border-primary/30 hover:bg-primary/10"
                      }
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {answer.isAccepted ? "채택됨" : "채택하기"}
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}


