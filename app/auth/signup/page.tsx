"use client";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  Lock,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

export default function SignupPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [devGroup, setDevGroup] = useState("");
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 닉네임 중복 확인
  const checkNickname = async (nickname: string) => {
    if (!nickname || nickname.length < 2) {
      setNicknameAvailable(null);
      return;
    }

    setIsCheckingNickname(true);
    try {
      const response = await fetch(
        `/api/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`
      );
      const data = await response.json();
      setNicknameAvailable(data.available);
    } catch (error) {
      console.error("Check nickname error:", error);
      setNicknameAvailable(null);
    } finally {
      setIsCheckingNickname(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkNickname(nickname);
    }, 500);

    return () => clearTimeout(timer);
  }, [nickname]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // 기본 유효성 검사
    if (!nickname || nickname.length < 2) {
      toast({
        title: "닉네임 입력 필요",
        description: "닉네임은 2자 이상 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    if (!devGroup) {
      toast({
        title: "직군 선택 필요",
        description: "직군을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 닉네임이 사용 불가능한 경우에만 막기 (null이거나 체크 중인 경우는 서버에서 확인)
    if (nicknameAvailable === false) {
      toast({
        title: "닉네임 사용 불가",
        description: "이미 사용 중인 닉네임입니다.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname, password, devGroup }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "회원가입 실패",
          description: data.error || "회원가입 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "회원가입 성공",
        description: "회원가입이 완료되었습니다. 로그인해주세요.",
      });

      router.push("/auth/login");
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "회원가입 실패",
        description: "회원가입 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-primary">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">회원가입</h1>
            <p className="text-muted-foreground">
              DevCPU Community에 함께하세요
            </p>
          </div>

          <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-foreground">
                  닉네임 <span className="text-accent">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="닉네임을 입력하세요 (2자 이상)"
                    className={`pl-10 pr-10 bg-muted/30 border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary ${
                      nicknameAvailable === false
                        ? "border-red-500"
                        : nicknameAvailable === true
                        ? "border-green-500"
                        : ""
                    }`}
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isCheckingNickname ? (
                      <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                    ) : nicknameAvailable === true ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : nicknameAvailable === false ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : null}
                  </div>
                </div>
                {nickname && (
                  <p
                    className={`text-xs ${
                      nicknameAvailable === true
                        ? "text-green-500"
                        : nicknameAvailable === false
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {isCheckingNickname
                      ? "확인 중..."
                      : nicknameAvailable === true
                      ? "사용 가능한 닉네임입니다"
                      : nicknameAvailable === false
                      ? "이미 사용 중인 닉네임입니다"
                      : "닉네임을 입력해주세요"}
                  </p>
                )}
              </div>

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
                <Label htmlFor="password" className="text-foreground">
                  비밀번호 <span className="text-accent">*</span>
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">
                  비밀번호 확인 <span className="text-accent">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호를 다시 입력하세요"
                    className="pl-10 bg-muted/30 border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  isCheckingNickname ||
                  nicknameAvailable === false ||
                  !nickname ||
                  nickname.length < 2
                }
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-neon disabled:opacity-50"
              >
                {isSubmitting ? "회원가입 중..." : "회원가입"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">
                이미 계정이 있으신가요?{" "}
              </span>
              <Link href="/auth/login" className="text-primary hover:underline">
                로그인
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
