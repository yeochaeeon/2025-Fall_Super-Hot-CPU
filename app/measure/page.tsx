"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CPUGauge } from "@/components/CPUGauge";
import {
  Thermometer,
  Calculator,
  Loader2,
  Info,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { FormEvent, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface Question {
  questionId: number;
  content: string;
  category: string;
  weightPercent: number;
  badge: {
    id: number;
    name: string;
    description: string;
  } | null;
  answerValue: number | null;
}

export default function MeasurePage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [cpuScore, setCpuScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // 중복 호출 방지
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/measure/questions");
      
      // 응답이 JSON인지 확인
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        const text = await response.text();
        console.error("Response text:", text);
        toast({
          title: "오류",
          description: "서버 응답을 처리할 수 없습니다.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        console.log("Response not OK:", response.status, data);
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
          console.log("403 error data:", data);
          if (data.isHotDeveloper) {
            toast({
              title: "측정 불가",
              description:
                data.error ||
                "Hot Developer는 당일 CPU 온도를 측정할 수 없습니다.",
              variant: "destructive",
            });
            router.push("/");
            return;
          }
          if (data.requiresAcceptance) {
            console.log("requiresAcceptance:", data.requiresAcceptance);
            const errorMessage = data.error || "답변을 채택해야 CPU 온도를 측정할 수 있습니다.";
            toast({
              title: "답변 채택 필요",
              description: errorMessage,
              variant: "destructive",
            });
            // alert로 사용자에게 명확히 알리고 확인 후 이동
            alert(errorMessage);
            router.push("/questions");
            return;
          }
          // 403 에러인데 위 조건에 해당하지 않는 경우
          toast({
            title: "접근 불가",
            description: data.error || "CPU 온도를 측정할 수 없습니다.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.error || "질문을 불러올 수 없습니다.");
      }

      setQuestions(data.questions);
      setHasAnswered(data.hasAnswered);

      // 이미 답변한 값이 있으면 answers에 설정
      const existingAnswers: Record<number, number> = {};
      data.questions.forEach((q: Question) => {
        if (q.answerValue !== null) {
          existingAnswers[q.questionId] = q.answerValue;
        }
      });
      setAnswers(existingAnswers);

      // 이미 답변했다면 점수도 가져오기
      if (data.hasAnswered) {
        loadScore();
      }
    } catch (error) {
      console.error("Load questions error:", error);
      toast({
        title: "오류",
        description: "질문을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadScore = async () => {
    try {
      const response = await fetch("/api/measure/score");
      const data = await response.json();

      if (response.ok && data.hasScore) {
        setCpuScore(data.cpuScore);
      }
    } catch (error) {
      console.error("Load score error:", error);
    }
  };

  const handleAnswerChange = (questionId: number, value: string, questionContent?: string) => {
    // 빈 값이면 undefined로 설정 (답변 안 한 상태)
    if (value === "" || value === null || value === undefined) {
      setAnswers((prev) => {
        const newAnswers = { ...prev };
        delete newAnswers[questionId];
        return newAnswers;
      });
      return;
    }

    // 배포 여부 질문인 경우 0 또는 1로 제한
    if (questionContent?.includes("배포 여부")) {
      const numValue = Math.floor(parseFloat(value) || 0);
      if (numValue < 0 || numValue > 1) {
        toast({
          title: "입력 오류",
          description: "배포 여부는 0 또는 1만 입력 가능합니다.",
          variant: "destructive",
        });
        return;
      }
      setAnswers((prev) => ({
        ...prev,
        [questionId]: numValue,
      }));
      return;
    }

    // 숫자로 변환 (0도 유효한 답변)
    const numValue = Math.max(0, Math.floor(parseFloat(value) || 0));
    setAnswers((prev) => ({
      ...prev,
      [questionId]: numValue,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // 모든 질문에 답변이 입력되었는지 확인 (0도 유효한 답변)
    const unansweredQuestions = questions.filter(
      (q) =>
        answers[q.questionId] === undefined || answers[q.questionId] === null
    );

    if (unansweredQuestions.length > 0 && !hasAnswered) {
      toast({
        title: "답변 필요",
        description: "모든 질문에 답변해주세요. (0도 입력 가능합니다)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const answerArray = questions.map((q) => ({
        questionId: q.questionId,
        value: answers[q.questionId] !== undefined ? answers[q.questionId] : 0,
      }));

      const response = await fetch("/api/measure/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers: answerArray }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          if (data.isHotDeveloper) {
            toast({
              title: "측정 불가",
              description:
                data.error ||
                "Hot Developer는 당일 CPU 온도를 측정할 수 없습니다.",
              variant: "destructive",
            });
            router.push("/");
            return;
          }
          if (data.requiresAcceptance) {
            const errorMessage = data.error || "답변을 채택해야 CPU 온도를 측정할 수 있습니다.";
            toast({
              title: "답변 채택 필요",
              description: errorMessage,
              variant: "destructive",
            });
            // alert로 사용자에게 명확히 알리고 확인 후 이동
            alert(errorMessage);
            router.push("/questions");
            return;
          }
        }
        throw new Error(data.error || "답변 제출 중 오류가 발생했습니다.");
      }

      setCpuScore(data.cpuScore);
      setHasAnswered(true);

      // 성공 메시지 표시
      toast({
        title: "✅ CPU 온도 측정 완료!",
        description: `오늘의 CPU 온도: ${(
          Math.round(data.cpuScore * 10) / 10
        ).toFixed(1)}°C${
          data.badgesGranted > 0
            ? ` 🎉 ${data.badgesGranted}개의 칭호를 획득했습니다!`
            : ""
        }`,
      });

      // 뱃지 정보도 다시 로드
      loadScore();

      // 성공 후 페이지 상단으로 스크롤
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "오류",
        description: error.message || "답변 제출 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 질문을 카테고리별로 분류
  const commonQuestions = questions.filter((q) => q.category === "COMMON");
  const roleQuestions = questions.filter((q) => q.category === "dev");
  const specialQuestions = questions.filter((q) => q.category === "SPECIAL");

  // 수면시간 질문인지 확인하는 헬퍼 함수
  const isSleepTimeQuestion = (content: string) => content === "수면시간";

  // 질문별 힌트 텍스트
  const getQuestionHint = (content: string) => {
    if (content === "수면시간") {
      return "💡 수면시간이 적을수록 높은 CPU 온도가 기록됩니다";
    } else if (content === "커밋 수") {
      return "💡 오늘 커밋한 총 개수를 입력하세요";
    } else if (content === "마신 커피 몇잔인지") {
      return "💡 오늘 마신 커피 잔 수를 입력하세요";
    } else if (content === "개발 시간") {
      return "💡 오늘 개발에 투자한 시간(시간 단위)을 입력하세요";
    }
    return null;
  };

  // 뱃지 description에서 이모지 추출
  const extractEmoji = (description: string | null): string => {
    if (!description || description.trim().length === 0) {
      return "🏆";
    }
    const desc = description.trim();
    // codePointAt을 사용하여 서로게이트 페어 처리
    const firstCodePoint = desc.codePointAt(0);
    if (firstCodePoint) {
      // 이모티콘 범위 체크
      if (
        (firstCodePoint >= 0x1f300 && firstCodePoint <= 0x1f9ff) || // Miscellaneous Symbols and Pictographs
        (firstCodePoint >= 0x2600 && firstCodePoint <= 0x26ff) || // Miscellaneous Symbols
        (firstCodePoint >= 0x2700 && firstCodePoint <= 0x27bf) || // Dingbats
        (firstCodePoint >= 0x1f600 && firstCodePoint <= 0x1f64f) || // Emoticons
        (firstCodePoint >= 0x1f680 && firstCodePoint <= 0x1f6ff) || // Transport and Map Symbols
        (firstCodePoint >= 0x1f900 && firstCodePoint <= 0x1f9ff) || // Supplemental Symbols and Pictographs
        (firstCodePoint >= 0x1fa00 && firstCodePoint <= 0x1faff) // Symbols and Pictographs Extended-A
      ) {
        // 서로게이트 페어인 경우 2자, 아니면 1자
        return firstCodePoint > 0xffff
          ? String.fromCodePoint(firstCodePoint)
          : desc[0];
      }
    }
    return "🏆";
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Thermometer className="h-8 w-8 text-primary animate-glow" />
          <div>
            <h1 className="text-3xl font-bold">CPU 온도 측정</h1>
            <p className="text-muted-foreground">
              오늘의 개발 활동을 기록하세요
            </p>
          </div>
        </div>

        {hasAnswered && cpuScore !== null && (
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30 shadow-neon">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <h3 className="text-lg font-semibold">✅ 측정 완료</h3>
              </div>
              <CPUGauge
                temperature={Math.round(cpuScore * 10) / 10}
                size="lg"
              />
              <p className="text-sm text-muted-foreground text-center">
                오늘의 CPU 온도가 기록되었습니다.
                <br />
                <span className="text-xs">답변을 수정할 수 있습니다.</span>
              </p>
            </div>
          </Card>
        )}

        <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {commonQuestions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span>공통 질문</span>
                  <span className="text-xs text-muted-foreground">(50%)</span>
                </h3>
                <div className="space-y-6">
                  {commonQuestions.map((question) => {
                    const isSleepTime = isSleepTimeQuestion(question.content);
                    const hint = getQuestionHint(question.content);
                    return (
                      <div
                        key={question.questionId}
                        className="space-y-3 p-4 rounded-lg bg-muted/20 border border-primary/10"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Label
                            htmlFor={`q-${question.questionId}`}
                            className="flex items-center gap-2 flex-1"
                          >
                            <span className="font-semibold">
                              {question.content}
                            </span>
                            {isSleepTime && (
                              <TrendingDown className="h-4 w-4 text-orange-400" />
                            )}
                            {!isSleepTime && (
                              <TrendingUp className="h-4 w-4 text-primary" />
                            )}
                            {question.badge && (
                              <span className="text-xs text-muted-foreground ml-auto px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                                {extractEmoji(question.badge.description)}{" "}
                                {question.badge.name}
                              </span>
                            )}
                          </Label>
                        </div>
                        {hint && (
                          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 p-2 rounded border border-primary/10">
                            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{hint}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Input
                            id={`q-${question.questionId}`}
                            type="number"
                            min="0"
                            step={isSleepTime ? "0.5" : "1"}
                            value={
                              answers[question.questionId] !== undefined
                                ? answers[question.questionId]
                                : ""
                            }
                            onChange={(e) =>
                              handleAnswerChange(
                                question.questionId,
                                e.target.value
                              )
                            }
                            placeholder={isSleepTime ? "예: 4.5" : "0"}
                            className={`flex-1 bg-background border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 text-lg font-medium ${
                              isSleepTime ? "text-orange-400" : ""
                            }`}
                          />
                          {isSleepTime && (
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              시간
                            </span>
                          )}
                          {question.content === "커밋 수" && (
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              개
                            </span>
                          )}
                          {question.content === "마신 커피 몇잔인지" && (
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              잔
                            </span>
                          )}
                          {question.content === "개발 시간" && (
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              시간
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {roleQuestions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span>직군별 질문</span>
                  <span className="text-xs text-muted-foreground">(30%)</span>
                </h3>
                <div className="space-y-6">
                  {roleQuestions.map((question) => (
                    <div
                      key={question.questionId}
                      className="space-y-3 p-4 rounded-lg bg-muted/20 border border-primary/10"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Label
                          htmlFor={`q-${question.questionId}`}
                          className="flex items-center gap-2 flex-1"
                        >
                          <span className="font-semibold">
                            {question.content}
                          </span>
                          <TrendingUp className="h-4 w-4 text-primary" />
                          {question.badge && (
                            <span className="text-xs text-muted-foreground ml-auto px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                              {extractEmoji(question.badge.description)}{" "}
                              {question.badge.name}
                            </span>
                          )}
                        </Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input
                          id={`q-${question.questionId}`}
                          type="number"
                          min={question.content.includes("배포 여부") ? "0" : "0"}
                          max={question.content.includes("배포 여부") ? "1" : undefined}
                          step="1"
                          value={
                            answers[question.questionId] !== undefined
                              ? answers[question.questionId]
                              : ""
                          }
                          onChange={(e) =>
                            handleAnswerChange(
                              question.questionId,
                              e.target.value,
                              question.content
                            )
                          }
                          placeholder={question.content.includes("배포 여부") ? "0 또는 1" : "0"}
                          className="flex-1 bg-background border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 text-lg font-medium"
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {question.content.includes("개수") ||
                          question.content.includes("건")
                            ? "개"
                            : question.content.includes("횟수")
                            ? "회"
                            : question.content.includes("크기")
                            ? "GB"
                            : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {specialQuestions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span>Hot Developer 질문</span>
                  <span className="text-xs text-muted-foreground">(20%)</span>
                </h3>
                <div className="space-y-6">
                  {specialQuestions.map((question) => (
                    <div
                      key={question.questionId}
                      className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Label
                          htmlFor={`q-${question.questionId}`}
                          className="flex items-center gap-2 flex-1"
                        >
                          <span className="font-semibold">
                            {question.content}
                          </span>
                          <TrendingUp className="h-4 w-4 text-orange-400" />
                        </Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input
                          id={`q-${question.questionId}`}
                          type="number"
                          min="0"
                          step="1"
                          value={
                            answers[question.questionId] !== undefined
                              ? answers[question.questionId]
                              : ""
                          }
                          onChange={(e) =>
                            handleAnswerChange(
                              question.questionId,
                              e.target.value
                            )
                          }
                          placeholder="0"
                          className="flex-1 bg-background border-orange-500/30 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-lg font-medium"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/")}
                className="flex-1 border-primary/30 hover:bg-muted"
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || questions.length === 0}
                className="flex-1 bg-primary hover:bg-primary/90 text-black shadow-neon disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    측정 중...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    온도 측정하기
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-4 bg-muted/30 border-primary/10">
          <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            CPU 온도 측정 안내
          </h3>
          <ul className="text-xs text-muted-foreground space-y-2">
            <li>• 매일 한 번만 측정할 수 있습니다 (답변은 수정 가능)</li>
            <li>
              • <span className="font-semibold text-foreground">수면시간</span>
              은 적을수록 높은 CPU 온도가 기록됩니다
            </li>
            <li>• 다른 질문들은 값이 클수록 높은 점수를 받습니다</li>
            <li>
              • 각 질문에서{" "}
              <span className="font-semibold text-foreground">
                최고값(또는 최저값)
              </span>
              을 기록한 사람이 해당 칭호를 획득합니다
            </li>
            <li>
              • 공통 질문은 50%, 직군별 질문은 30%, Hot Developer 질문은 20%의
              가중치를 가집니다
            </li>
            <li>
              • 수면시간은 소수점 입력 가능 (예: 4.5시간), 나머지는 정수로
              입력해주세요
            </li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
}
