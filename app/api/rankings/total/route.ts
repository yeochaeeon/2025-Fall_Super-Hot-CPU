import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const devGroup = searchParams.get("devGroup"); // "all", "1", "2", "3", "4"

    // VIEW를 사용하여 누적 랭킹 조회
    let viewQuery = `
      SELECT * FROM total_ranking_view
    `;
    
    if (devGroup && devGroup !== "all") {
      viewQuery += ` WHERE dev_group_id = ${parseInt(devGroup)}`;
    }
    
    viewQuery += ` LIMIT 20`;

    const viewRankings = await prisma.$queryRawUnsafe<Array<{
      user_id: number;
      nickname: string;
      role_id: number;
      dev_group_id: number;
      dev_group_name: string;
      role_name: string;
      avg_cpu_score: number;
      measurement_count: number;
    }>>(viewQuery);

    // 상위 20명의 user_id 추출
    const topUserIds = viewRankings.map(r => r.user_id);

    // 모든 사용자 정보를 한 번에 조회 (N+1 문제 해결)
    const users = await prisma.users.findMany({
      where: {
        user_id: { in: topUserIds },
      },
      include: {
        dev_group: true,
        // 최근 획득한 뱃지 (최근 5개, Hot Developer 뱃지 제외)
        user_badge: {
          where: {
            badge: {
              question: {
                category: {
                  not: "SPECIAL", // Hot Developer 질문 뱃지 제외
                },
              },
            },
          },
          orderBy: {
            granted_date: "desc",
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
        // 공통 질문 답변들의 평균값
        daily_answer: {
          where: {
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

    // user_id로 매핑
    const userMap = new Map(users.map(u => [u.user_id, u]));

    // VIEW 결과와 사용자 정보 결합
    const rankings = viewRankings
      .map((viewRanking) => {
        const user = userMap.get(viewRanking.user_id);
        if (!user) return null;

          // 공통 질문 답변들의 평균 계산
          const answerMap = new Map<string, number[]>();
          user.daily_answer.forEach((answer) => {
            const questionContent = answer.question.content;
            const value = Number(answer.answer_value);
            if (!answerMap.has(questionContent)) {
              answerMap.set(questionContent, []);
            }
            answerMap.get(questionContent)!.push(value);
          });

          const commonAnswers = {
            commits: 0,
            coffee: 0,
            sleep: 0,
            devTime: 0,
          };

          answerMap.forEach((values, questionContent) => {
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            if (questionContent === "커밋 수") {
              commonAnswers.commits = Math.round(avg);
            } else if (questionContent === "마신 커피 몇잔인지") {
              commonAnswers.coffee = Math.round(avg);
            } else if (questionContent === "수면시간") {
              commonAnswers.sleep = Math.round(avg);
            } else if (questionContent === "개발 시간") {
              commonAnswers.devTime = Math.round(avg);
            }
          });

          // 직군 이름 매핑 (DB: 한글 -> 화면: 영문)
          const roleNameMap: Record<string, string> = {
            프론트엔드: "Frontend",
            백엔드: "Backend",
            AI: "AI",
            모바일: "Mobile",
          };

          return {
          user_id: user.user_id,
          username: user.nickname,
          role: roleNameMap[user.dev_group.name] || user.dev_group.name,
          temperature: Math.round(Number(viewRanking.avg_cpu_score) * 10) / 10, // 소수점 첫째자리까지
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
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    const formattedRankings = rankings.map((ranking, index) => ({
      ...ranking,
      rank: index + 1,
    }));

    return NextResponse.json(
      {
        rankings: formattedRankings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get total rankings error:", error);
    return NextResponse.json(
      { error: "랭킹을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

