import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;
    const userIdInt = userId ? parseInt(userId) : null;

    // 한국 시간(KST, UTC+9) 기준으로 오늘 날짜 생성
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // UTC+9 (밀리초)
    const kstNow = new Date(now.getTime() + kstOffset);
    const today = new Date(Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate()
    ));

    // 모든 쿼리를 병렬로 실행
    const [
      topUserScore,
      todayScores,
      recentMemes,
      recentQuestions,
    ] = await Promise.all([
      // 1. VIEW를 사용하여 오늘의 Hot CPU 사용자 조회
      prisma.$queryRawUnsafe<Array<{
        user_id: number;
        score_date: Date;
        cpu_score: number;
        nickname: string;
        role_id: number;
        dev_group_id: number;
        dev_group_name: string;
        role_name: string;
      }>>(`SELECT * FROM today_hot_cpu_view LIMIT 1`),

      // 2. VIEW를 사용하여 직군별 오늘의 평균 온도 조회
      prisma.$queryRawUnsafe<Array<{
        dev_group_id: number;
        dev_group_name: string;
        avg_cpu_score: number;
        user_count: number;
      }>>(`SELECT * FROM dev_group_today_avg_view`),

      // 3. VIEW를 사용하여 인기 밈 3개 조회
      prisma.$queryRawUnsafe<Array<{
        meme_id: number;
        user_id: number;
        title: string;
        content_text: string;
        image_url: string;
        created_at: Date;
        like_count: number;
        author_nickname: string;
        dev_group_name: string;
        role_name: string;
      }>>(`SELECT * FROM popular_memes_view LIMIT 3`),

      // 4. VIEW를 사용하여 최근 고민 3개 조회
      prisma.$queryRawUnsafe<Array<{
        concern_id: number;
        user_id: number;
        dev_group_id: number;
        title: string;
        content: string;
        created_at: Date;
        was_good: boolean | null;
        author_nickname: string;
        dev_group_name: string;
        role_name: string;
        answer_count: number;
      }>>(`SELECT * FROM recent_concerns_view LIMIT 3`),
    ]);

    // VIEW 결과 처리
    const topUserView = Array.isArray(topUserScore) ? topUserScore[0] : null;
    const devGroupAvgs = Array.isArray(todayScores) ? todayScores : [];
    const memesView = Array.isArray(recentMemes) ? recentMemes : [];
    const concernsView = Array.isArray(recentQuestions) ? recentQuestions : [];

    // BigInt를 Number로 변환하는 헬퍼 함수
    const toNumber = (value: any): number => {
      if (typeof value === 'bigint') {
        return Number(value);
      }
      if (typeof value === 'object' && value !== null && 'toNumber' in value) {
        return value.toNumber();
      }
      return Number(value);
    };

    // 직군별 평균 온도는 VIEW에서 이미 계산됨
    const topRole = devGroupAvgs.length > 0 
      ? devGroupAvgs.sort((a, b) => toNumber(b.avg_cpu_score) - toNumber(a.avg_cpu_score))[0]
      : null;

    // 공통 질문 답변 평균 계산 (직군별)
    const devGroupIds = devGroupAvgs.map(dg => toNumber(dg.dev_group_id));
    const allTodayAnswers = devGroupIds.length > 0
      ? await prisma.daily_answer.findMany({
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
      : [];

    // 직군별로 답변 그룹핑
    type AnswerType = {
      question: { content: string };
      answer_value: any;
      user: { dev_group_id: number };
    };
    const answersByDevGroup: Record<number, AnswerType[]> = {};
    for (const answer of allTodayAnswers) {
      const devGroupId = answer.user.dev_group_id;
      if (!answersByDevGroup[devGroupId]) {
        answersByDevGroup[devGroupId] = [];
      }
      answersByDevGroup[devGroupId].push(answer);
    }

    // 직군별 공통 질문 평균 계산
    const roleStats = devGroupAvgs.map((devGroupAvg) => {
      const todayAnswers = answersByDevGroup[toNumber(devGroupAvg.dev_group_id)] || [];
      
      const answerMap = new Map<string, number[]>();
      todayAnswers.forEach((answer) => {
        const questionContent = answer.question.content;
        if (!answerMap.has(questionContent)) {
          answerMap.set(questionContent, []);
        }
        // Prisma Decimal을 Number로 변환
        answerMap.get(questionContent)!.push(toNumber(answer.answer_value));
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
        devGroupId: toNumber(devGroupAvg.dev_group_id),
        name: devGroupAvg.dev_group_name,
        avgTemp: Math.round(toNumber(devGroupAvg.avg_cpu_score) * 10) / 10,
        commonAnswers,
      };
    });

    const topRoleFormatted = topRole ? roleStats.find(r => r.devGroupId === toNumber(topRole.dev_group_id)) : null;

    // 직군 이름 매핑
    const roleNameMap: Record<string, string> = {
      프론트엔드: "Frontend",
      백엔드: "Backend",
      AI: "AI",
      모바일: "Mobile",
    };

    // 오늘의 Hot Developer 포맷팅 (VIEW 결과 사용)
    let formattedTopUser = null;
    if (topUserView) {
      // 추가 정보 조회 (뱃지, 공통 답변)
      const user = await prisma.users.findUnique({
        where: { user_id: toNumber(topUserView.user_id) },
        include: {
          dev_group: true,
          role: true,
          user_badge: {
            where: {
              granted_date: today,
              badge: {
                question: {
                  category: {
                    not: "SPECIAL",
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

      if (user) {
        const commonAnswers = user.daily_answer.reduce(
          (acc, answer) => {
            const questionContent = answer.question.content;
            // Prisma Decimal을 Number로 변환
            const value = toNumber(answer.answer_value);
            
            if (questionContent === "커밋 수") {
              acc.commits = value;
            } else if (questionContent === "마신 커피 몇잔인지") {
              acc.coffee = value;
            } else if (questionContent === "수면시간") {
              acc.sleep = value;
            } else if (questionContent === "개발 시간") {
              acc.devTime = value;
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

        const badges = user.user_badge
          .filter((ub) => ub.badge.question.category !== "SPECIAL")
          .map((ub) => {
            let icon = "🏆";
            if (ub.badge.description && ub.badge.description.trim().length > 0) {
              const desc = ub.badge.description.trim();
              const firstCodePoint = desc.codePointAt(0);
              if (firstCodePoint) {
                if (
                  (firstCodePoint >= 0x1f300 && firstCodePoint <= 0x1f9ff) ||
                  (firstCodePoint >= 0x2600 && firstCodePoint <= 0x26ff) ||
                  (firstCodePoint >= 0x2700 && firstCodePoint <= 0x27bf) ||
                  (firstCodePoint >= 0x1f600 && firstCodePoint <= 0x1f64f) ||
                  (firstCodePoint >= 0x1f680 && firstCodePoint <= 0x1f6ff) ||
                  (firstCodePoint >= 0x1f900 && firstCodePoint <= 0x1f9ff) ||
                  (firstCodePoint >= 0x1fa00 && firstCodePoint <= 0x1faff)
                ) {
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
          username: topUserView.nickname,
          role: roleNameMap[topUserView.dev_group_name] || topUserView.dev_group_name,
          temperature: Math.round(toNumber(topUserView.cpu_score) * 10) / 10,
          badges,
          commonAnswers,
        };
      }
    }

    // 직군 이름 매핑 (한글 -> 영문)
    const formattedTopRole = topRoleFormatted
      ? {
          name: roleNameMap[topRoleFormatted.name] || topRoleFormatted.name,
          avgTemp: topRoleFormatted.avgTemp,
          commonAnswers: topRoleFormatted.commonAnswers,
        }
      : null;

    // 현재 사용자가 좋아요한 밈 ID 목록 조회
    const memeIds = memesView.map((m) => toNumber(m.meme_id));
    const likedMemeIds = userIdInt && memeIds.length > 0
      ? await prisma.meme_like.findMany({
          where: {
            user_id: userIdInt,
            meme_id: { in: memeIds },
          },
          select: {
            meme_id: true,
          },
        })
      : [];

    const likedMemeIdSet = new Set(likedMemeIds.map((l) => toNumber(l.meme_id)));

    // 최근 밈 포맷팅 (VIEW 결과 사용)
    const formattedMemes = memesView.map((meme) => ({
      id: toNumber(meme.meme_id),
      author: meme.author_nickname,
      content: meme.title || meme.content_text || "",
      imageUrl: meme.image_url,
      likes: toNumber(meme.like_count),
      isLiked: likedMemeIdSet.has(toNumber(meme.meme_id)),
    }));

    // 최근 고민 포맷팅 (VIEW 결과 사용)
    const formattedQuestions = concernsView.map((concern) => ({
      id: toNumber(concern.concern_id),
      author: concern.author_nickname,
      role: roleNameMap[concern.dev_group_name] || concern.dev_group_name,
      title: concern.title,
      answers: toNumber(concern.answer_count),
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

