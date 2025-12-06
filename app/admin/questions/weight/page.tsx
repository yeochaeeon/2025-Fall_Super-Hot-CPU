"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Settings, ArrowLeft, ArrowRightLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface Question {
  id: number;
  content: string;
  category: string;
  weightPercent: number;
  devGroup: string | null;
  badge: {
    id: number;
    name: string;
    description: string;
  } | null;
}

interface QuestionsData {
  common: Question[];
  byRole: Array<{
    groupName: string;
    questions: Question[];
  }>;
}

export default function QuestionWeightPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionsData | null>(null);
  const [weights, setWeights] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAdjusting, setIsAdjusting] = useState(false);
  
  // 가중치 조정 상태
  const [increaseQuestionId, setIncreaseQuestionId] = useState<string>("");
  const [decreaseQuestionId, setDecreaseQuestionId] = useState<string>("");
  const [adjustAmount, setAdjustAmount] = useState<number[]>([0]);
  const [showAdjustSlider, setShowAdjustSlider] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/questions");
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: "접근 불가",
            description: data.error || "Root만 접근할 수 있습니다.",
            variant: "destructive",
          });
          router.push("/measure");
          return;
        }
        throw new Error(data.error || "질문을 불러올 수 없습니다.");
      }

      setQuestions(data.questions);
      
      // 초기 가중치 설정
      const initialWeights: Record<number, number> = {};
      data.questions.common.forEach((q: Question) => {
        initialWeights[q.id] = q.weightPercent;
      });
      data.questions.byRole.forEach((group: { questions: Question[] }) => {
        group.questions.forEach((q: Question) => {
          initialWeights[q.id] = q.weightPercent;
        });
      });
      setWeights(initialWeights);
    } catch (error: any) {
      console.error("Load questions error:", error);
      toast({
        title: "오류",
        description: error.message || "질문을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  // 모든 질문 목록 가져오기 (가중치 조정용)
  const getAllQuestions = (): Question[] => {
    if (!questions) return [];
    const all: Question[] = [];
    questions.common.forEach((q) => all.push(q));
    questions.byRole.forEach((group) => {
      group.questions.forEach((q) => all.push(q));
    });
    return all;
  };

  const handleAdjustWeight = async () => {
    if (!increaseQuestionId || !decreaseQuestionId || !adjustAmount[0] || adjustAmount[0] <= 0) {
      toast({
        title: "입력 오류",
        description: "증가할 질문, 감소할 질문, 조정값을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const amount = adjustAmount[0];
    if (amount <= 0) {
      toast({
        title: "입력 오류",
        description: "조정값은 0보다 큰 숫자여야 합니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAdjusting(true);
      const response = await fetch("/api/admin/questions/adjust-weight", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          increaseQuestionId: parseInt(increaseQuestionId),
          decreaseQuestionId: parseInt(decreaseQuestionId),
          adjustAmount: amount,
          reason: "Root가 가중치 조정",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "가중치 조정에 실패했습니다.");
      }

      toast({
        title: "✅ 가중치 조정 완료",
        description: `"${data.adjustments[0].question.content}"의 가중치가 ${data.adjustments[0].question.oldWeightPercent}%에서 ${data.adjustments[0].question.newWeightPercent}%로 증가하고, "${data.adjustments[1].question.content}"의 가중치가 ${data.adjustments[1].question.oldWeightPercent}%에서 ${data.adjustments[1].question.newWeightPercent}%로 감소했습니다.`,
      });

      // 질문 목록 다시 로드
      await loadQuestions();
      
      // 입력 필드 초기화
      setIncreaseQuestionId("");
      setDecreaseQuestionId("");
      setAdjustAmount([0]);
      setShowAdjustSlider(false);
    } catch (error: any) {
      console.error("Adjust weight error:", error);
      toast({
        title: "오류",
        description: error.message || "가중치 조정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleAdjustButtonClick = () => {
    if (!increaseQuestionId || !decreaseQuestionId) {
      toast({
        title: "입력 오류",
        description: "증가할 질문과 감소할 질문을 먼저 선택해주세요.",
        variant: "destructive",
      });
      return;
    }
    setShowAdjustSlider(true);
    // 초기값을 0.1로 설정
    setAdjustAmount([0.1]);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">질문을 불러오는 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!questions) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <Card className="p-6">
            <p className="text-muted-foreground">질문을 불러올 수 없습니다.</p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary animate-glow" />
          <div>
            <h1 className="text-3xl font-bold">질문 가중치 설정</h1>
            <p className="text-muted-foreground">
              Root 전용: CPU 온도 측정 질문의 가중치를 변경합니다
            </p>
          </div>
        </div>

        {/* 가중치 조정 섹션 */}
        <Card className="p-6 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-center gap-2 mb-4">
            <ArrowRightLeft className="h-5 w-5 text-blue-400" />
            <h2 className="text-xl font-semibold">가중치 조정 (총합 100% 유지)</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            한 질문의 가중치를 증가시키고 다른 질문의 가중치를 감소시켜 총합을 100%로 유지합니다.
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="increaseQuestion">증가할 질문</Label>
                <Select
                  value={increaseQuestionId}
                  onValueChange={setIncreaseQuestionId}
                >
                  <SelectTrigger id="increaseQuestion">
                    <SelectValue placeholder="질문 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllQuestions().map((q) => (
                      <SelectItem key={q.id} value={q.id.toString()}>
                        {q.content} ({weights[q.id]?.toFixed(1) || "0.0"}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="decreaseQuestion">감소할 질문</Label>
                <Select
                  value={decreaseQuestionId}
                  onValueChange={setDecreaseQuestionId}
                >
                  <SelectTrigger id="decreaseQuestion">
                    <SelectValue placeholder="질문 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllQuestions()
                      .filter((q) => q.id.toString() !== increaseQuestionId)
                      .map((q) => (
                        <SelectItem key={q.id} value={q.id.toString()}>
                          {q.content} ({weights[q.id]?.toFixed(1) || "0.0"}%)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!showAdjustSlider ? (
              <Button
                onClick={handleAdjustButtonClick}
                disabled={!increaseQuestionId || !decreaseQuestionId}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                가중치 조정하기
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adjustAmount">
                    조정값: {adjustAmount[0]?.toFixed(1) || "0.0"}%
                  </Label>
                  <Slider
                    id="adjustAmount"
                    value={adjustAmount}
                    onValueChange={setAdjustAmount}
                    min={0.1}
                    max={
                      decreaseQuestionId
                        ? Math.min(
                            weights[parseInt(decreaseQuestionId)] || 0,
                            100 - (weights[parseInt(increaseQuestionId)] || 0)
                          )
                        : 100
                    }
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.1%</span>
                    <span>
                      {decreaseQuestionId
                        ? Math.min(
                            weights[parseInt(decreaseQuestionId)] || 0,
                            100 - (weights[parseInt(increaseQuestionId)] || 0)
                          ).toFixed(1)
                        : "100.0"}
                      %
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAdjustWeight}
                    disabled={isAdjusting || !adjustAmount[0] || adjustAmount[0] <= 0}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {isAdjusting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        조정 중...
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        적용하기
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAdjustSlider(false);
                      setAdjustAmount([0]);
                    }}
                    variant="outline"
                    disabled={isAdjusting}
                  >
                    취소
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>


        <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
          <div className="space-y-8">
            {/* 공통 질문 */}
            {questions.common.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span>공통 질문</span>
                  <span className="text-xs text-muted-foreground">
                    (현재 총 {questions.common.reduce((sum, q) => sum + weights[q.id], 0).toFixed(1)}%)
                  </span>
                </h3>
                <div className="space-y-6">
                  {questions.common.map((question) => (
                    <div
                      key={question.id}
                      className="space-y-3 p-4 rounded-lg bg-muted/20 border border-primary/10"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Label className="flex items-center gap-2 flex-1">
                          <span className="font-semibold">{question.content}</span>
                          {question.badge && (
                            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                              {question.badge.name}
                            </span>
                          )}
                        </Label>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-primary min-w-[60px] text-right">
                            {weights[question.id]?.toFixed(1) || "0.0"}%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Slider
                          value={[weights[question.id] || 0]}
                          disabled
                          min={0}
                          max={100}
                          step={0.1}
                          className="w-full opacity-60"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 직군별 질문 */}
            {questions.byRole.map((group) => (
              <div key={group.groupName}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span>{group.groupName} 질문</span>
                  <span className="text-xs text-muted-foreground">
                    (현재 총 {group.questions.reduce((sum, q) => sum + weights[q.id], 0).toFixed(1)}%)
                  </span>
                </h3>
                <div className="space-y-6">
                  {group.questions.map((question) => (
                    <div
                      key={question.id}
                      className="space-y-3 p-4 rounded-lg bg-muted/20 border border-primary/10"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Label className="flex items-center gap-2 flex-1">
                          <span className="font-semibold">{question.content}</span>
                          {question.badge && (
                            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                              {question.badge.name}
                            </span>
                          )}
                        </Label>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-primary min-w-[60px] text-right">
                            {weights[question.id]?.toFixed(1) || "0.0"}%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Slider
                          value={[weights[question.id] || 0]}
                          disabled
                          min={0}
                          max={100}
                          step={0.1}
                          className="w-full opacity-60"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/measure")}
            className="flex-1 border-primary/30 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
        </div>
      </div>
    </Layout>
  );
}

