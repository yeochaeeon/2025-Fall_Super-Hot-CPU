import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;
    const userIdInt = userId ? parseInt(userId) : null;

    // 타임존 문제를 피하기 위해 UTC 기준으로 오늘 날짜 생성
    const now = new Date();
    const today = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));

    // 모든 쿼리를 병렬로 실행
    const [
      topUserScore,
      todayScores,
      recentMemes,
      recentQuestions,
    ] = await Promise.all([
      // 1. 오늘 날짜에서 가장 높은 온도를 가진 사용자
      prisma.daily_score.findFirst({
        where: {
          score_date: today,
        },
        include: {
          user: {
            include: {
              dev_group: true,
              role: true,
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
              // 오늘의 공통 질문 답변
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
          },
        },
        orderBy: {
          cpu_score: "desc",
        },
      }),

      // 2. 오늘 날짜에서 직군별 평균 온도 계산
      prisma.daily_score.findMany({
        where: {
          score_date: today,
        },
        select: {
          cpu_score: true,
          user: {
            select: {
              dev_group_id: true,
            },
          },
        },
      }),

      // 3. 최근 밈 3개
      prisma.meme.findMany({
        orderBy: {
          created_at: "desc",
        },
        take: 3,
        select: {
          meme_id: true,
          title: true,
          content_text: true,
          image_url: true,
          like_count: true,
          user: {
            select: {
              nickname: true,
            },
          },
        },
      }),

      // 4. 최근 고민 3개
      prisma.concern.findMany({
        orderBy: {
          created_at: "desc",
        },
        take: 3,
        select: {
          concern_id: true,
          title: true,
          user: {
            select: {
              nickname: true,
              dev_group: {
                select: {
                  name: true,
                },
              },
            },
          },
          answer: {
            select: {
              concern_answer_id: true,
            },
          },
        },
      }),
    ]);

    // 직군별 평균 온도 계산
    const roleAverages: Record<number, { sum: number; count: number }> = {};
    
    for (const score of todayScores) {
      const devGroupId = score.user.dev_group_id;
      if (!roleAverages[devGroupId]) {
        roleAverages[devGroupId] = { sum: 0, count: 0 };
      }
      roleAverages[devGroupId].sum += Number(score.cpu_score);
      roleAverages[devGroupId].count += 1;
    }

    // 모든 직군 정보와 오늘의 공통 질문 답변을 병렬로 조회
    const devGroupIds = Object.keys(roleAverages).map(Number);
    
    const [devGroups, allTodayAnswers] = await Promise.all([
      // 모든 직군 정보를 한 번에 조회 (N+1 문제 해결)
      prisma.dev_group.findMany({
        where: {
          dev_group_id: { in: devGroupIds },
        },
        select: {
          dev_group_id: true,
          name: true,
        },
      }),
      // 모든 오늘의 공통 질문 답변을 한 번에 조회 (N+1 문제 해결)
      devGroupIds.length > 0
        ? prisma.daily_answer.findMany({
            where: {
              answer_date: today,
              question: {
                category: "COMMON",
              },
              user: {
                dev_group_id: { in: devGroupIds },
              },
            },
            select: {
              answer_value: true,
              user: {
                select: {
                  dev_group_id: true,
                },
              },
              question: {
                select: {
                  content: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);
    
    const devGroupMap = new Map(devGroups.map(dg => [dg.dev_group_id, dg]));

    // 직군별로 답변 그룹핑
    const answersByDevGroup: Record<number, typeof allTodayAnswers> = {};
    for (const answer of allTodayAnswers) {
      const devGroupId = answer.user.dev_group_id;
      if (!answersByDevGroup[devGroupId]) {
        answersByDevGroup[devGroupId] = [];
      }
      answersByDevGroup[devGroupId].push(answer);
    }

    // 직군별 평균 온도 및 공통 질문 평균 계산
    const roleStats = devGroupIds.map((devGroupId) => {
      const stats = roleAverages[devGroupId];
      const devGroup = devGroupMap.get(devGroupId);
      const todayAnswers = answersByDevGroup[devGroupId] || [];

      // 공통 질문별 평균 계산
      const answerMap = new Map<string, number[]>();
      todayAnswers.forEach((answer) => {
        const questionContent = answer.question.content;
        if (!answerMap.has(questionContent)) {
          answerMap.set(questionContent, []);
        }
        answerMap.get(questionContent)!.push(Number(answer.answer_value));
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

      return {
        devGroupId,
        name: devGroup?.name || "",
        avgTemp: stats.count > 0 ? Math.round((stats.sum / stats.count) * 10) / 10 : 0, // 소수점 첫째자리까지
        commonAnswers,
      };
    });

    const topRole = roleStats.sort((a, b) => b.avgTemp - a.avgTemp)[0] || null;

    // 직군 이름 매핑
    const roleNameMap: Record<string, string> = {
      프론트엔드: "Frontend",
      백엔드: "Backend",
      AI: "AI",
      모바일: "Mobile",
    };

    // 오늘의 Hot Developer 포맷팅
    let formattedTopUser = null;
    if (topUserScore) {
      const user = topUserScore.user;
      const commonAnswers = user.daily_answer.reduce(
        (acc, answer) => {
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
        },
        {
          commits: 0,
          coffee: 0,
          sleep: 0,
          devTime: 0,
        } as { commits: number; coffee: number; sleep: number; devTime: number }
      );

      // 뱃지 이모티콘 추출
      const badges = user.user_badge
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
      });

      formattedTopUser = {
        rank: 1,
        username: user.nickname,
        role: roleNameMap[user.dev_group.name] || user.dev_group.name,
        temperature: Math.round(Number(topUserScore.cpu_score) * 10) / 10, // 소수점 첫째자리까지
        badges,
        commonAnswers,
      };
    }

    // 직군 이름 매핑 (한글 -> 영문)
    const formattedTopRole = topRole
      ? {
          name: roleNameMap[topRole.name] || topRole.name,
          avgTemp: topRole.avgTemp,
          commonAnswers: topRole.commonAnswers,
        }
      : null;

    // 현재 사용자가 좋아요한 밈 ID 목록 조회
    const likedMemeIds = userIdInt
      ? await prisma.meme_like.findMany({
          where: {
            user_id: userIdInt,
            meme_id: { in: recentMemes.map((m) => m.meme_id) },
          },
          select: {
            meme_id: true,
          },
        })
      : [];

    const likedMemeIdSet = new Set(likedMemeIds.map((l) => l.meme_id));

    // 최근 밈 포맷팅
    const formattedMemes = recentMemes.map((meme) => ({
      id: meme.meme_id,
      author: meme.user.nickname,
      content: meme.title || meme.content_text || "",
      imageUrl: meme.image_url,
      likes: meme.like_count,
      isLiked: likedMemeIdSet.has(meme.meme_id),
    }));

    // 최근 고민 포맷팅
    const formattedQuestions = recentQuestions.map((question) => ({
      id: question.concern_id,
      author: question.user.nickname,
      role: roleNameMap[question.user.dev_group.name] || question.user.dev_group.name,
      title: question.title,
      answers: question.answer.length,
    }));

    return NextResponse.json(
      {
        topUser: formattedTopUser,
        topRole: formattedTopRole,
        recentMemes: formattedMemes,
        recentQuestions: formattedQuestions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get dashboard summary error:", error);
    return NextResponse.json(
      { error: "대시보드 요약 정보를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

