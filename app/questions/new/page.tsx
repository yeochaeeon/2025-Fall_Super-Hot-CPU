"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function QuestionNewPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [role, setRole] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: Backend integration
    console.log({ title, content, role });
    router.push("/questions");
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-primary animate-glow" />
          <div>
            <h1 className="text-3xl font-bold">고민 등록</h1>
            <p className="text-muted-foreground">개발 고민을 나눠보세요</p>
          </div>
        </div>

        <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-foreground">
                직군 <span className="text-accent">*</span>
              </Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger
                  id="role"
                  className="bg-muted/30 border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <SelectValue placeholder="직군을 선택하세요" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20">
                  <SelectItem value="frontend">프론트엔드</SelectItem>
                  <SelectItem value="backend">백엔드</SelectItem>
                  <SelectItem value="ai">AI</SelectItem>
                  <SelectItem value="mobile">모바일</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground">
                제목 <span className="text-accent">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="고민의 제목을 입력하세요"
                className="bg-muted/30 border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-foreground">
                내용 <span className="text-accent">*</span>
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="고민의 내용을 자세히 작성해주세요&#10;&#10;예시:&#10;- 문제 상황&#10;- 시도해본 방법&#10;- 원하는 결과"
                className="bg-muted/30 border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary min-h-[300px] resize-y"
                required
              />
              <p className="text-xs text-muted-foreground">
                Optimizer들이 답변을 작성할 수 있습니다. 답변을 채택해주세요!
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/questions")}
                className="flex-1 border-primary/30 hover:bg-muted"
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-neon"
              >
                <Send className="h-4 w-4 mr-2" />
                등록하기
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-4 bg-muted/30 border-primary/10">
          <h3 className="font-semibold mb-2 text-sm">📌 고민 게시판 이용 안내</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>
              • <strong>Developer & Hot Developer</strong>: 고민 등록만 가능합니다
            </li>
            <li>
              • <strong>Optimizer</strong>: 답변 작성만 가능합니다
            </li>
            <li>
              • <strong>Root</strong>: 고민 등록과 답변 모두 가능합니다
            </li>
            <li>• 답변을 채택해야 다음 CPU 온도를 측정할 수 있습니다</li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
}


