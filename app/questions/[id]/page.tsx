"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Award,
  ArrowLeft,
  Send,
  Loader2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

interface Answer {
  id: number;
  author: string;
  authorId: number;
  devGroup: string;
  role: string;
  content: string;
  timeAgo: string;
  createdAt: string;
  isAccepted: boolean;
}

interface Concern {
  id: number;
  author: string;
  authorId: number;
  devGroup: string;
  role: string;
  title: string;
  content: string;
  timeAgo: string;
  createdAt: string;
  wasGood: boolean | null;
  answers: Answer[];
}

export default function QuestionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const concernId = Number(params.id);
  const [answerContent, setAnswerContent] = useState("");
  const [concern, setConcern] = useState<Concern | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptingAnswerId, setAcceptingAnswerId] = useState<number | null>(
    null
  );
  const [canAnswer, setCanAnswer] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);

  useEffect(() => {
    const loadConcern = async () => {
      if (!concernId || isNaN(concernId)) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/questions/${concernId}`);
        const data = await response.json();

        if (response.ok && data.concern) {
          setConcern(data.concern);
          setCanAnswer(data.permissions?.canAnswer || false);
          setIsAuthor(data.permissions?.isAuthor || false);
        } else {
          setConcern(null);
        }
      } catch (error) {
        console.error("Load concern error:", error);
        setConcern(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadConcern();
  }, [concernId]);

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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Root":
        return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
      case "Optimizer":
        return "bg-purple-500/20 text-purple-300 border border-purple-500/30";
      case "Hot Developer":
        return "bg-orange-500/20 text-orange-300 border border-orange-500/30";
      default:
        return "bg-muted/50 text-foreground border-primary/20";
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerContent.trim()) {
      toast({
        title: "오류",
        description: "답변을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/questions/${concernId}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: answerContent.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "성공",
          description: "답변이 등록되었습니다",
        });
        setAnswerContent("");
        // 고민 정보 다시 로드
        const concernResponse = await fetch(`/api/questions/${concernId}`);
        const concernData = await concernResponse.json();
        if (concernResponse.ok && concernData.concern) {
          setConcern(concernData.concern);
        }
      } else {
        toast({
          title: "오류",
          description: data.error || "답변 등록에 실패했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Submit answer error:", error);
      toast({
        title: "오류",
        description: "답변 등록 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = async (answerId: number, accept: boolean) => {
    if (acceptingAnswerId === answerId) return;

    try {
      setAcceptingAnswerId(answerId);
      const response = await fetch(
        `/api/questions/${concernId}/answers/${answerId}/accept`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accept }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "성공",
          description: accept ? "답변을 채택했습니다" : "채택을 취소했습니다",
        });
        // 고민 정보 다시 로드
        const concernResponse = await fetch(`/api/questions/${concernId}`);
        const concernData = await concernResponse.json();
        if (concernResponse.ok && concernData.concern) {
          setConcern(concernData.concern);
        }
      } else {
        toast({
          title: "오류",
          description: data.error || "답변 채택에 실패했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Accept answer error:", error);
      toast({
        title: "오류",
        description: "답변 채택 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setAcceptingAnswerId(null);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!concern) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">고민을 찾을 수 없습니다</p>
          <Button
            variant="outline"
            onClick={() => router.push("/questions")}
            className="hover:bg-primary/20 hover:text-primar bg-primary/10 border-primary/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로 돌아가기
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/questions")}
            className="hover:bg-primary/20 hover:text-primar"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
        </div>

        <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-lg font-bold">{concern.author}</p>
                <span
                  className={`px-2 py-0.5 rounded text-xs border ${getDevGroupColor(
                    concern.devGroup
                  )}`}
                >
                  {concern.devGroup}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs border ${getRoleColor(
                    concern.role
                  )}`}
                >
                  {concern.role}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {concern.timeAgo}
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-4">{concern.title}</h1>
          <p className="text-muted-foreground whitespace-pre-wrap mb-4">
            {concern.content}
          </p>

          <div className="flex items-center gap-2 pt-4 border-t border-primary/10">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              답변 {concern.answers.length}개
            </span>
          </div>
        </Card>

        {canAnswer && (
          <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-primary animate-glow" />
              <h2 className="text-lg font-semibold">답변 작성</h2>
              <span className="text-s text-muted-foreground">
                (Root 와 Optimizer 계급만 답변 작성이 가능합니다.)
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
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-black font-semibold shadow-neon hover:shadow-cpu transition-all px-6 py-2.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    답변 등록
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 ml-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            답변 목록
          </h2>

          {concern.answers.length === 0 ? (
            <Card className="p-8 bg-card/50 backdrop-blur border-primary/20 text-center">
              <p className="text-muted-foreground">아직 답변이 없습니다.</p>
            </Card>
          ) : (
            concern.answers.map((answer) => (
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
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-lg font-bold">{answer.author}</p>
                      <span
                        className={`px-2 py-0.5 rounded text-xs border ${getDevGroupColor(
                          answer.devGroup
                        )}`}
                      >
                        {answer.devGroup}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs border ${getRoleColor(
                          answer.role
                        )}`}
                      >
                        {answer.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {answer.timeAgo}
                  </div>
                </div>

                <p className="text-muted-foreground whitespace-pre-wrap mb-4">
                  {answer.content}
                </p>

                {isAuthor && (
                  <div className="flex items-center gap-2 pt-4 border-t border-primary/10">
                    <Button
                      size="sm"
                      variant={answer.isAccepted ? "default" : "outline"}
                      disabled={acceptingAnswerId === answer.id}
                      onClick={() =>
                        handleAccept(answer.id, !answer.isAccepted)
                      }
                      className={
                        answer.isAccepted
                          ? "bg-primary/20 hover:bg-primary/30 text-primary-foreground border-primary/30 shadow-neon"
                          : "border-primary/30 hover:bg-primary/10"
                      }
                    >
                      {acceptingAnswerId === answer.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      {answer.isAccepted ? "채택 취소" : "채택하기"}
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
