"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Trophy,
  Laugh,
  MessageSquare,
  Home,
  Flame,
  User,
  LogIn,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

interface UserInfo {
  id: number;
  nickname: string;
  devGroup: string;
  role: string;
}

const navigation = [
  { name: "대시보드", href: "/", icon: Home },
  { name: "랭킹", href: "/rankings", icon: Trophy },
  { name: "밈 게시판", href: "/memes", icon: Laugh },
  { name: "고민 게시판", href: "/questions", icon: MessageSquare },
];

const getRoleColor = (role: string) => {
  switch (role) {
    case "Frontend":
    case "프론트엔드":
      return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    case "Backend":
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50";
    case "AI":
      return "bg-indigo-500/20 text-indigo-400 border-indigo-500/50";
    case "Mobile":
      return "bg-pink-500/20 text-pink-400 border-pink-500/50";
    default:
      return "bg-muted/50 text-foreground border-primary/20";
  }
};

const getDevGroupColor = (devGroup: string) => {
  switch (devGroup) {
    case "Frontend":
      return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    case "Backend":
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50";
    case "AI":
      return "bg-indigo-500/20 text-indigo-400 border-indigo-500/50";
    case "Mobile":
      return "bg-pink-500/20 text-pink-400 border-pink-500/50";
    default:
      return "bg-muted/50 text-foreground border-primary/20";
  }
};

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch("/api/auth/check");
      const data = await response.json();
      if (data.authenticated && data.user) {
        setUserInfo(data.user);
      } else {
        setUserInfo(null);
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      setUserInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, [pathname]); // 경로가 변경될 때마다 다시 확인

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        setUserInfo(null);
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-primary">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-primary text-gradient">
                Who's the SUPER HOT CPU?
              </span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1 flex-1 justify-center">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Info / Login/Logout */}
            <div className="flex-shrink-0">
              {isLoading ? (
                <div className="flex items-center gap-2 px-3 py-1 text-xs text-primary">
                  로딩 중...
                </div>
              ) : userInfo ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap hidden sm:inline">
                      {userInfo.nickname}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border ${getDevGroupColor(
                        userInfo.devGroup
                      )} hidden md:inline-block`}
                    >
                      {userInfo.devGroup}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border hidden lg:inline-block ${
                        userInfo.role === "Optimizer"
                          ? "bg-purple-500/20 text-purple-400 border-purple-500/50"
                          : userInfo.role === "Hot Developer"
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/50"
                          : userInfo.role === "Root"
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                          : "bg-muted/50 text-foreground border-primary/20"
                      }`}
                    >
                      {userInfo.role}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-muted-foreground hover:text-accent-foreground hover:bg-accent/20"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">로그아웃</span>
                  </Button>
                </div>
              ) : (
                <Link href="/auth/login">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex items-center gap-2 bg-transparent hover:bg-primary/30 text-primary-foreground"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">로그인</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">{children}</main>
    </div>
  );
}
