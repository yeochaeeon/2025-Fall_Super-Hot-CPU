"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Laugh, Send, Upload, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function MemeNewPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [devGroup, setDevGroup] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: Backend integration
    console.log({
      title,
      content,
      devGroup,
      image: imagePreview ? "uploaded" : null,
    });
    router.push("/memes");
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Laugh className="h-8 w-8 text-primary animate-glow" />
          <div>
            <h1 className="text-3xl font-bold">밈 등록</h1>
            <p className="text-muted-foreground">개발자의 일상을 공유하세요</p>
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

            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground">
                제목 <span className="text-accent">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="밈의 제목을 입력하세요"
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
                placeholder="밈의 내용을 작성해주세요&#10;&#10;예시:&#10;CSS 한 줄 바꿨는데 전체 레이아웃이..."
                className="bg-muted/30 border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary min-h-[200px] resize-y"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">이미지 (선택)</Label>
              {!imagePreview ? (
                <div className="relative">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="image"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      클릭하여 이미지를 업로드하세요
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, GIF (최대 5MB)
                    </p>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border border-primary/20">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/questions")}
                className="flex-1 border-primary/30 hover:bg-muted hover:text-primary"
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-black shadow-neon"
              >
                <Send className="h-4 w-4 mr-2" />
                등록하기
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-4 bg-muted/30 border-primary/10">
          <h3 className="font-semibold mb-2 text-sm">📌 밈 게시판 이용 안내</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 하루에 1개의 밈만 등록할 수 있습니다</li>
            <li>• 직군별/등급별로 좋아요 투표권이 차등 지급됩니다</li>
            <li>• 부적절한 내용은 삭제될 수 있습니다</li>
            <li>• 다른 개발자들을 배려하는 밈을 공유해주세요</li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
}
