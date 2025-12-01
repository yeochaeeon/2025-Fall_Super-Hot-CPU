"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CPUGauge } from "@/components/CPUGauge";
import { Thermometer, Calculator } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

// 공통 질문 (50%)
const commonQuestions = [
  { id: "commits", label: "커밋 수", icon: "🤖", badge: "커밋 머신" },
  { id: "coffee", label: "마신 커피 잔 수", icon: "☕", badge: "내 몸의 70%는 아메리카노" },
  { id: "sleep", label: "수면 시간 (시간)", icon: "😴", badge: "슬기로운 불면생활" },
  { id: "devTime", label: "개발 시간 (시간)", icon: "💺", badge: "엉덩이가 무거워" },
];

// 직군별 질문 (30%)
const roleQuestions: Record<string, Array<{ id: string; label: string; icon: string; badge: string }>> = {
  Frontend: [
    { id: "pages", label: "페이지 구현 수", icon: "🎨", badge: "새 화면이 나를 부른다" },
    { id: "apiConnections", label: "API 연동 개수", icon: "📡", badge: "백-프론트 통역사" },
    { id: "uiChanges", label: "UI 변경으로 인한 코드 수정 건 수", icon: "🤯", badge: '"Figma 변경사항 확인해주세요" n번째 듣는 중' },
    { id: "cssFixes", label: "CSS or 레이아웃 깨짐 수정 횟수", icon: "🧩", badge: "CSS가 왜 그럴까" },
  ],
  Backend: [
    { id: "apiDesigns", label: "API 설계나 개발 개수", icon: "🛠️", badge: "JSON 상하차 중" },
    { id: "deploy", label: "배포 여부", icon: "🔥", badge: "Release 지옥에서 날 꺼내줘" },
    { id: "errorLogs", label: "에러 로그 수집된 건 수", icon: "🚨", badge: "버그 담당 일진" },
    { id: "schemaChanges", label: "DB 스키마 변경 건 수", icon: "🛠️", badge: "ALTER TABLE 만능 노동자" },
  ],
  AI: [
    { id: "epochs", label: "에포크 돌린 횟수", icon: "🥲", badge: "Loss 안 내려가서 눈물 흘리는 중" },
    { id: "runtimeDisconnects", label: "'run time 연결이 끊어졌습니다' 발생 횟수", icon: "💻", badge: "Colab과 밀당 중" },
    { id: "datasetSize", label: "모델 학습을 위해 확보/정제한 데이터셋 크기 (GB)", icon: "💀", badge: "라벨링 하다 영혼 가출" },
    { id: "experimentChanges", label: "실험(run) 세팅 변경 횟수", icon: "💉", badge: "파라미터 튜닝 중독" },
  ],
  Mobile: [
    { id: "buildRetries", label: "빌드 재시도 횟수", icon: "🔨", badge: "Gradle의 노예" },
    { id: "pages", label: "페이지 구현 수", icon: "🔄", badge: "컴포넌트 복붙 기계" },
    { id: "sdkIssues", label: "외부 SDK or dependency 문제 해결 시도 횟수", icon: "🔗", badge: "디펜던시 마스터" },
    { id: "crashes", label: "로컬이나 실제 디바이스에서 크래시 발생 횟수", icon: "💔", badge: "앱은 죽었지만 난 살아있다" },
  ],
};

export default function MeasurePage() {
  const router = useRouter();
  const [devGroup, setDevGroup] = useState("Frontend");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [calculatedTemp, setCalculatedTemp] = useState<number | null>(null);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value === "" ? 0 : parseInt(value) || 0,
    }));
  };

  const calculateTemperature = () => {
    // 간단한 계산 로직 (실제로는 백엔드에서 계산)
    let totalScore = 0;
    
    // 공통 질문 (50%)
    const commonScore = Object.entries(answers)
      .filter(([key]) => commonQuestions.some((q) => q.id === key))
      .reduce((sum, [, value]) => sum + (value || 0), 0);
    
    // 직군별 질문 (30%)
    const roleScore = Object.entries(answers)
      .filter(([key]) => roleQuestions[devGroup]?.some((q) => q.id === key))
      .reduce((sum, [, value]) => sum + (value || 0), 0);
    
    totalScore = commonScore * 0.5 + roleScore * 0.3;
    
    // 온도 변환 (0-100 스케일)
    const temp = Math.min(100, Math.max(0, totalScore * 2));
    setCalculatedTemp(Math.round(temp));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    calculateTemperature();
    // TODO: Backend integration
    console.log({ devGroup, answers, temperature: calculatedTemp });
  };

  const allQuestions = [
    ...commonQuestions.map((q) => ({ ...q, type: "common" as const })),
    ...(roleQuestions[devGroup] || []).map((q) => ({ ...q, type: "role" as const })),
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Thermometer className="h-8 w-8 text-primary animate-glow" />
          <div>
            <h1 className="text-3xl font-bold">CPU 온도 측정</h1>
            <p className="text-muted-foreground">오늘의 개발 활동을 기록하세요</p>
          </div>
        </div>

        <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="devGroup" className="text-foreground">
                직군 <span className="text-accent">*</span>
              </Label>
              <Select value={devGroup} onValueChange={setDevGroup} required>
                <SelectTrigger
                  id="devGroup"
                  className="bg-muted/30 border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <SelectValue placeholder="직군을 선택하세요" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20">
                  <SelectItem value="Frontend">프론트엔드</SelectItem>
                  <SelectItem value="Backend">백엔드</SelectItem>
                  <SelectItem value="AI">AI</SelectItem>
                  <SelectItem value="Mobile">모바일</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span>공통 질문</span>
                  <span className="text-xs text-muted-foreground">(50%)</span>
                </h3>
                <div className="space-y-4">
                  {commonQuestions.map((question) => (
                    <div key={question.id} className="space-y-2">
                      <Label htmlFor={question.id} className="flex items-center gap-2">
                        <span className="text-lg">{question.icon}</span>
                        <span>{question.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          (칭호: {question.badge})
                        </span>
                      </Label>
                      <Input
                        id={question.id}
                        type="number"
                        min="0"
                        value={answers[question.id] || ""}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder="0"
                        className="bg-muted/30 border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span>직군별 질문</span>
                  <span className="text-xs text-muted-foreground">(30%)</span>
                </h3>
                <div className="space-y-4">
                  {(roleQuestions[devGroup] || []).map((question) => (
                    <div key={question.id} className="space-y-2">
                      <Label htmlFor={question.id} className="flex items-center gap-2">
                        <span className="text-lg">{question.icon}</span>
                        <span>{question.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          (칭호: {question.badge})
                        </span>
                      </Label>
                      <Input
                        id={question.id}
                        type="number"
                        min="0"
                        value={answers[question.id] || ""}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder="0"
                        className="bg-muted/30 border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {calculatedTemp !== null && (
              <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
                <div className="flex flex-col items-center gap-4">
                  <h3 className="text-lg font-semibold">오늘의 CPU 온도</h3>
                  <CPUGauge temperature={calculatedTemp} size="lg" />
                </div>
              </Card>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/")}
                className="flex-1 border-primary/30 hover:bg-muted"
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-neon"
              >
                <Calculator className="h-4 w-4 mr-2" />
                온도 측정하기
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-4 bg-muted/30 border-primary/10">
          <h3 className="font-semibold mb-2 text-sm">📌 CPU 온도 측정 안내</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 매일 한 번만 측정할 수 있습니다</li>
            <li>• 각 질문에 대한 답변값이 가장 높은 사람이 해당 칭호를 획득합니다</li>
            <li>• 공통 질문은 50%, 직군별 질문은 30%의 가중치를 가집니다</li>
            <li>• 나머지 20%는 Hot Developer가 선정한 특별 질문에 부여됩니다</li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
}

