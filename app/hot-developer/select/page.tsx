"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flame, Loader2, AlertCircle, Edit2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface ExistingQuestion {
  questionId: number;
  content: string;
}

export default function HotDeveloperSelectPage() {
  const router = useRouter();
  const [existingQuestions, setExistingQuestions] = useState<ExistingQuestion[]>([]);
  const [questions, setQuestions] = useState<{ content: string }[]>([
    { content: "" },
    { content: "" },
  ]);
  const [devGroup, setDevGroup] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/hot-developer/questions");
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "로그인 필요",
            description: "로그인 후 이용해주세요.",
            variant: "destructive",
          });
          router.push("/auth/login");
          return;
        }
        if (response.status === 403) {
          toast({
            title: "접근 불가",
            description: data.error || "Hot Developer만 접근할 수 있습니다.",
            variant: "destructive",
          });
          router.push("/");
          return;
        }
        throw new Error(data.error || "질문 목록을 불러올 수 없습니다.");
      }

      setExistingQuestions(data.existingQuestions || []);
      // 기존 질문이 있으면 폼에 채우기
      if (data.existingQuestions && data.existingQuestions.length > 0) {
        setQuestions(
          data.existingQuestions.map((q: ExistingQuestion) => ({
            content: q.content,
          }))
        );
        // 2개가 안 되면 빈 질문 추가
        while (questions.length < 2) {
          setQuestions((prev) => [...prev, { content: "" }]);
        }
      }
      setDevGroup(data.devGroup || "");
    } catch (error) {
      console.error("Load questions error:", error);
      toast({
        title: "오류",
        description: "질문 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionChange = (index: number, value: string) => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      newQuestions[index] = { content: value };
      return newQuestions;
    });
  };

  const handleSubmit = async () => {
    // 검증
    if (questions.some((q) => !q.content.trim())) {
      toast({
        title: "질문 작성 필요",
        description: "모든 질문을 작성해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (questions.some((q) => q.content.trim().length > 255)) {
      toast({
        title: "질문 길이 초과",
        description: "각 질문은 255자 이하여야 합니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/hot-developer/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions: questions.map((q) => ({ content: q.content.trim() })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "질문 작성 중 오류가 발생했습니다.");
      }

      toast({
        title: "✅ 질문 작성 완료!",
        description: "작성한 질문이 내일부터 해당 직군의 특별 질문으로 사용됩니다.",
      });

      // 작성된 질문 업데이트
      setExistingQuestions(data.questions || []);
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "제출 실패",
        description: error.message || "질문 작성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
              <Flame className="h-6 w-6 text-orange-400" />
            </div>
            <h1 className="text-3xl font-bold gradient-primary text-gradient">
              Hot Developer 특별 질문 작성
            </h1>
          </div>
          <p className="text-muted-foreground">
            {devGroup} 직군의 Hot Developer로 선정되신 것을 축하합니다!
          </p>
          <p className="text-sm text-muted-foreground">
            내일부터 해당 직군의 특별 질문으로 사용될 질문을 작성해주세요. (정확히 2개)
          </p>
        </div>

        {/* 현재 작성된 질문 */}
        {existingQuestions.length > 0 && (
          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30">
            <div className="flex items-start gap-3 mb-4">
              <Edit2 className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-400 mb-2">현재 작성된 질문</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  다음 날부터 사용될 특별 질문입니다. 수정하려면 아래에서 다시 작성해주세요.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {existingQuestions.map((q, index) => (
                <div
                  key={q.questionId}
                  className="p-3 rounded-lg bg-background/50 border border-green-500/20"
                >
                  <p className="text-sm font-medium">
                    {index + 1}. {q.content}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 질문 작성 폼 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">질문 작성</h2>
          <p className="text-sm text-muted-foreground mb-6">
            아래에 특별 질문 2개를 작성해주세요. 작성한 질문은 내일부터 {devGroup} 직군의 특별 질문으로 사용됩니다.
          </p>

          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`question-${index}`} className="text-base font-medium">
                  질문 {index + 1} <span className="text-primary">*</span>
                </Label>
                <Textarea
                  id={`question-${index}`}
                  value={question.content}
                  onChange={(e) => handleQuestionChange(index, e.target.value)}
                  placeholder={`예: 오늘 코드 리뷰를 몇 번 받았나요?`}
                  className="min-h-[100px] resize-none"
                  maxLength={255}
                  disabled={isSubmitting}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>각 질문은 255자 이하여야 합니다.</span>
                  <span>{question.content.length} / 255</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-end">
            <Button
              onClick={handleSubmit}
              disabled={
                questions.some((q) => !q.content.trim()) ||
                questions.length !== 2 ||
                isSubmitting
              }
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  작성 중...
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4 mr-2" />
                  질문 작성하기
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* 안내 사항 */}
        <Card className="p-6 bg-muted/50">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            안내 사항
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Hot Developer는 당일 CPU 온도를 측정할 수 없습니다.</li>
            <li>• 작성한 질문은 내일부터 해당 직군의 특별 질문으로 사용됩니다.</li>
            <li>• 정확히 2개의 질문을 작성해야 합니다.</li>
            <li>• 각 질문은 255자 이하여야 합니다.</li>
            <li>• 질문은 언제든지 수정할 수 있습니다. (기존 질문은 비활성화되고 새 질문이 생성됩니다)</li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
}
