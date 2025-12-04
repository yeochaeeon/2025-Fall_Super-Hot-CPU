"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Laugh, MessageSquare, Home, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "대시보드", href: "/", icon: Home },
  { name: "랭킹", href: "/rankings", icon: Trophy },
  { name: "밈 게시판", href: "/memes", icon: Laugh },
  { name: "고민 게시판", href: "/questions", icon: MessageSquare },
];

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-primary">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-primary text-gradient">
                who's the super hot CPU⁉️
              </span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">{children}</main>
    </div>
  );
}
