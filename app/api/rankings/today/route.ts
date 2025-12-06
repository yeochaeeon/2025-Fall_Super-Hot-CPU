import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const devGroup = searchParams.get("devGroup"); // "all", "1", "2", "3", "4"

    // 한국 시간(KST, UTC+9) 기준으로 오늘 날짜 생성
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // UTC+9 (밀리초)
    const kstNow = new Date(now.getTime() + kstOffset);
    const today = new Date(Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate()
    ));

    // VIEW를 사용하여 오늘의 랭킹 조회
    let viewQuery = `
      SELECT * FROM today_ranking_view
    `;
    
    if (devGroup && devGroup !== "all") {
      viewQuery += ` WHERE dev_group_id = ${parseInt(devGroup)}`;
    }
    
    viewQuery += ` LIMIT 20`;

    const viewRankings = await prisma.$queryRawUnsafe<Array<{
      user_id: number;
      score_date: Date;
      cpu_score: number;
      nickname: string;
      role_id: number;
      dev_group_id: number;
      dev_group_name: string;
      role_name: string;
    }>>(viewQuery);

    // 추가 정보 조회 (뱃지, 공통 답변)
    const userIds = viewRankings.map(r => r.user_id);
    const users = await prisma.users.findMany({
      where: {
        user_id: { in: userIds },
      },
      include: {
        dev_group: true,
        // 오늘 획득한 뱃지 (Hot Developer 뱃지 제외)
        user_badge: {
          where: {
            granted_date: today,
            badge: {
              question: {
                category: {
                  not: "SPECIAL", // Hot Developer 질문 뱃지 제외
                },
              },
            },
          },
          include: {
            badge: {
              include: {
                question: true,
              },
            },
          },
          take: 5,
        },
        // 오늘의 공통 질문 답변들
        daily_answer: {
          where: {
            answer_date: today,
            question: {
              category: "COMMON",
            },
          },
          include: {
            question: true,
          },
        },
      },
    });

    const userMap = new Map(users.map(u => [u.user_id, u]));
    
    // VIEW 결과와 추가 정보 결합
    const rankings = viewRankings.map(viewRanking => {
      const user = userMap.get(viewRanking.user_id);
      return {
        ...viewRanking,
        user: user || null,
      };
    }).filter(r => r.user !== null);

    const formattedRankings = rankings.map((ranking, index) => {
      const user = ranking.user;
      const commonAnswers = user.daily_answer.reduce((acc, answer) => {
        const questionContent = answer.question.content;
        if (questionContent === "커밋 수") {
          acc.commits = Number(answer.answer_value);
        } else if (questionContent === "마신 커피 몇잔인지") {
          acc.coffee = Number(answer.answer_value);
        } else if (questionContent === "수면시간") {
          acc.sleep = Number(answer.answer_value);
        } else if (questionContent === "개발 시간") {
          acc.devTime = Number(answer.answer_value);
        }
        return acc;
      }, {
        commits: 0,
        coffee: 0,
        sleep: 0,
        devTime: 0,
      } as { commits: number; coffee: number; sleep: number; devTime: number });

      // 직군 이름 매핑 (DB: 한글 -> 화면: 영문)
      const roleNameMap: Record<string, string> = {
        프론트엔드: "Frontend",
        백엔드: "Backend",
        AI: "AI",
        모바일: "Mobile",
      };

      return {
        rank: index + 1,
        username: user.nickname,
        role: roleNameMap[user.dev_group.name] || user.dev_group.name,
        temperature: Math.round(Number(ranking.cpu_score) * 10) / 10, // 소수점 첫째자리까지
        badges: user.user_badge
          .filter((ub) => ub.badge.question.category !== "SPECIAL") // Hot Developer 뱃지 제외
          .map((ub) => {
          let icon = "🏆";
          if (ub.badge.description && ub.badge.description.trim().length > 0) {
            const desc = ub.badge.description.trim();
            // description이 "🤖 커밋 머신" 형식이므로 첫 이모티콘만 추출
            // codePointAt을 사용하여 서로게이트 페어 처리
            const firstCodePoint = desc.codePointAt(0);
            if (firstCodePoint) {
              // 이모티콘 범위 체크 (기본 이모티콘 + 서로게이트 페어)
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
                icon = firstCodePoint > 0xffff 
                  ? String.fromCodePoint(firstCodePoint)
                  : desc[0];
              }
            }
          }
          return {
            icon,
            name: ub.badge.name,
          };
        }),
        commonAnswers,
      };
    });

    return NextResponse.json(
      {
        rankings: formattedRankings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get today rankings error:", error);
    return NextResponse.json(
      { error: "랭킹을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

