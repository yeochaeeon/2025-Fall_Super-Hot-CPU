"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, User, Lock } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "로그인 실패",
          description: data.error || "로그인 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "로그인 성공",
        description: `${data.user.nickname}님, 환영합니다!`,
      });

    router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "로그인 실패",
        description: "로그인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-primary">
                <LogIn className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">로그인</h1>
            <p className="text-muted-foreground">DevCPU Community에 오신 것을 환영합니다</p>
          </div>

          <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-foreground">
                  닉네임
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="닉네임을 입력하세요"
                    className="pl-10 bg-muted/30 border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  비밀번호
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="pl-10 bg-muted/30 border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-neon disabled:opacity-50"
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">계정이 없으신가요? </span>
              <Link href="/auth/signup" className="text-primary hover:underline">
                회원가입
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

