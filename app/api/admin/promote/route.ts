import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 승급 로직 실행 API
 * 매일 자정에 실행되어 다음을 수행:
 * 1. 전날 직군별 CPU 온도 1위를 Hot Developer로 선정
 * 2. Optimizer 승급 체크 (Hot Developer 10회 + 칭호 5개)
 * 3. Root 승급 체크 (답변 50회 이상 & 채택률 80%↑)
 * 4. Optimizer 강등 체크 (답변 10회 이상 & 미채택률 80%↑)
 */
export async function POST(request: Request) {
  try {
    // 보안: API 키 확인 (선택사항, 실제 운영시 환경변수로 관리)
    const authHeader = request.headers.get("authorization");
    const apiKey = process.env.PROMOTE_API_KEY;
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 한국 시간(KST, UTC+9) 기준으로 어제와 오늘 계산
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // UTC+9 (밀리초)
    const kstNow = new Date(now.getTime() + kstOffset);
    const yesterday = new Date(Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate() - 1
    ));
    const today = new Date(Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate()
    ));

    // 디버깅: 날짜 확인
    console.log("=== Promotion API 실행 ===");
    console.log("현재 시간 (UTC):", now.toISOString());
    console.log("현재 시간 (KST):", kstNow.toISOString().replace("T", " ").substring(0, 19) + " KST");
    console.log("어제 날짜 (yesterday):", yesterday.toISOString().split("T")[0]);
    console.log("오늘 날짜 (today):", today.toISOString().split("T")[0]);

    const results = {
      hotDevelopers: [] as Array<{ userId: number; nickname: string; devGroup: string }>,
      promotedToOptimizer: [] as Array<{ userId: number; nickname: string }>,
      promotedToRoot: [] as Array<{ userId: number; nickname: string }>,
      demotedFromOptimizer: [] as Array<{ userId: number; nickname: string }>,
    };

    // 1. 전날 직군별 CPU 온도 1위를 Hot Developer로 선정
    const devGroups = await prisma.dev_group.findMany();
    console.log(`Found ${devGroups.length} dev groups`);
    
    for (const devGroup of devGroups) {
      console.log(`Checking dev group: ${devGroup.name} (id: ${devGroup.dev_group_id})`);
      
      // 전날 해당 직군의 최고 점수 조회 (UTC 기준)
      const yesterdayDateOnly = yesterday;
      
      // 먼저 해당 직군의 모든 점수 확인
      // 디버깅: 해당 직군의 모든 사용자 확인
      const usersInGroup = await prisma.users.findMany({
        where: {
          dev_group_id: devGroup.dev_group_id,
        },
        select: {
          user_id: true,
          nickname: true,
        },
      });
      console.log(`  Users in ${devGroup.name}:`, usersInGroup.map(u => `${u.nickname}(id:${u.user_id})`));
      
      const allScores = await prisma.daily_score.findMany({
        where: {
          score_date: yesterdayDateOnly,
          user: {
            dev_group_id: devGroup.dev_group_id,
          },
        },
        include: {
          user: {
            include: {
              dev_group: true,
              role: true,
            },
          },
        },
        orderBy: {
          cpu_score: "desc",
        },
      });
      
      console.log(`Found ${allScores.length} scores for dev group ${devGroup.name} on ${yesterdayDateOnly.toISOString().split("T")[0]}`);
      console.log(`  Query date: ${yesterdayDateOnly.toISOString()}`);
      if (allScores.length > 0) {
        console.log(`Top scores:`, allScores.slice(0, 3).map(s => ({
          userId: s.user_id,
          nickname: s.user.nickname,
          score: s.cpu_score,
          scoreDate: s.score_date?.toISOString().split("T")[0]
        })));
      } else {
        // 점수가 없어도 로그 출력
        console.log(`⚠️ No scores found for dev group ${devGroup.name} on ${yesterdayDateOnly.toISOString().split("T")[0]}`);
        console.log(`   This means no one in ${devGroup.name} measured their CPU temperature yesterday.`);
        console.log(`   Checking if there are any scores in the database for this dev group...`);
        // 디버깅: 해당 직군의 모든 최근 점수 확인
        const recentScores = await prisma.daily_score.findMany({
          where: {
            user: {
              dev_group_id: devGroup.dev_group_id,
            },
          },
          orderBy: {
            score_date: "desc",
          },
          take: 5,
          select: {
            score_date: true,
            cpu_score: true,
            user: {
              select: {
                nickname: true,
              },
            },
          },
        });
        console.log(`   Recent scores for ${devGroup.name}:`, recentScores.map(s => ({
          date: s.score_date?.toISOString().split("T")[0],
          score: s.cpu_score,
          user: s.user.nickname
        })));
        continue;
      }
      
      const topScore = allScores[0];

      console.log(`Top score found: ${topScore.cpu_score} by user ${topScore.user.nickname} (id: ${topScore.user_id})`);
      const topUser = topScore.user;
      const topScoreValue = Number(topScore.cpu_score);
      console.log(`  Top score value (number): ${topScoreValue}, type: ${typeof topScoreValue}`);

      // 동점자 모두 찾기 (Decimal 타입 비교를 위해 정확한 값 사용)
      const allTopUsers = await prisma.daily_score.findMany({
        where: {
          score_date: yesterdayDateOnly,
          cpu_score: topScore.cpu_score, // Decimal 타입 그대로 사용
          user: {
            dev_group_id: devGroup.dev_group_id,
          },
        },
        include: {
          user: {
            include: {
              dev_group: true,
              role: true,
              // 전날 가장 먼저 답변을 제출한 시간을 찾기 위해 daily_answer 포함
              daily_answer: {
                where: {
                  answer_date: yesterdayDateOnly,
                },
                orderBy: {
                  created_at: "asc",
                },
                take: 1,
              },
            },
          },
        },
      });
      
      console.log(`  Found ${allTopUsers.length} users with top score ${topScore.cpu_score} in ${devGroup.name}`);

      // 동점자가 있으면 전날 CPU 온도를 먼저 측정한 사용자 우선 선정
      // (daily_answer의 created_at 기준으로 정렬)
      allTopUsers.sort((a, b) => {
        const aFirstAnswer = a.user.daily_answer[0]?.created_at;
        const bFirstAnswer = b.user.daily_answer[0]?.created_at;
        
        if (!aFirstAnswer && !bFirstAnswer) return 0;
        if (!aFirstAnswer) return 1; // a가 답변이 없으면 뒤로
        if (!bFirstAnswer) return -1; // b가 답변이 없으면 뒤로
        
        return aFirstAnswer.getTime() - bFirstAnswer.getTime();
      });

      // 동점자가 있으면 첫 번째 사용자만 Hot Developer로 선정
      // (hot_developer 테이블의 unique 제약으로 인해 직군당 1명만 가능)
      if (allTopUsers.length > 0) {
        console.log(`  Selecting top user from ${allTopUsers.length} candidates`);
        const topUser = allTopUsers[0].user;
        console.log(`Selecting Hot Developer: ${topUser.nickname} (id: ${topUser.user_id}) for ${devGroup.name}`);

        // Hot Developer로 선정 (upsert)
        const todayDateOnly = today;
        console.log(`Upserting Hot Developer for ${devGroup.name}: user_id=${topUser.user_id}, effective_date=${todayDateOnly.toISOString().split("T")[0]}`);
        
        const hotDevRecord = await prisma.hot_developer.upsert({
          where: {
            dev_group_id_effective_date: {
              dev_group_id: devGroup.dev_group_id,
              effective_date: todayDateOnly,
            },
          },
          update: {
            user_id: topUser.user_id,
          },
          create: {
            dev_group_id: devGroup.dev_group_id,
            effective_date: todayDateOnly,
            user_id: topUser.user_id,
          },
        });
        
        console.log(`✅ Hot Developer record created/updated:`, {
          dev_group_id: hotDevRecord.dev_group_id,
          effective_date: hotDevRecord.effective_date.toISOString().split("T")[0],
          user_id: hotDevRecord.user_id,
        });

        // 기존 Hot Developer 역할 조회
        const hotDeveloperRole = await prisma.role.findUnique({
          where: { name: "Hot Developer" },
        });
        const developerRole = await prisma.role.findUnique({
          where: { name: "Developer" },
        });

        if (!hotDeveloperRole || !developerRole) {
          console.error("Hot Developer or Developer role not found in database!");
          continue;
        }

        // 기존 Hot Developer 찾기 (어제 선정된 사용자)
        const previousHotDev = await prisma.hot_developer.findUnique({
          where: {
            dev_group_id_effective_date: {
              dev_group_id: devGroup.dev_group_id,
              effective_date: yesterday,
            },
          },
          include: {
            user: {
              include: {
                role: true,
                user_badge: true,
              },
            },
          },
        });

        // 기존 Hot Developer가 있으면 역할 처리
        if (previousHotDev && previousHotDev.user_id !== topUser.user_id) {
          const previousUser = previousHotDev.user;
          console.log(`Processing previous Hot Developer: ${previousUser.nickname} (id: ${previousUser.user_id})`);

          // 승급 조건 체크
          let shouldPromote = false;
          let newRoleId = developerRole.role_id;

          // Optimizer 승급 체크 (Hot Developer 10회 + 칭호 5개)
          const uniqueBadgeCount = new Set(
            previousUser.user_badge.map((ub) => ub.badge_id)
          ).size;

          if (previousUser.hot_dev_count >= 10 && uniqueBadgeCount >= 5) {
            const optimizerRole = await prisma.role.findUnique({
              where: { name: "Optimizer" },
            });
            if (optimizerRole) {
              shouldPromote = true;
              newRoleId = optimizerRole.role_id;
              console.log(`  → Promoting ${previousUser.nickname} to Optimizer`);
            }
          }

          // 역할 변경
          await prisma.users.update({
            where: { user_id: previousUser.user_id },
            data: {
              role_id: newRoleId,
            },
          });

          console.log(`  → Updated ${previousUser.nickname} role from Hot Developer to ${shouldPromote ? "Optimizer" : "Developer"}`);
        }

        // 새로운 Hot Developer 역할로 변경
        await prisma.users.update({
          where: { user_id: topUser.user_id },
          data: {
            role_id: hotDeveloperRole.role_id,
            hot_dev_count: {
              increment: 1,
            },
          },
        });

        console.log(`Updated user ${topUser.nickname} to Hot Developer role`);
        results.hotDevelopers.push({
          userId: topUser.user_id,
          nickname: topUser.nickname,
          devGroup: devGroup.name,
        });
      }
    }

    // 2. Optimizer 승급 체크 (Hot Developer 10회 + 칭호 5개)
    const developerRole = await prisma.role.findUnique({
      where: { name: "Developer" },
    });
    const hotDeveloperRole = await prisma.role.findUnique({
      where: { name: "Hot Developer" },
    });
    const optimizerRole = await prisma.role.findUnique({
      where: { name: "Optimizer" },
    });

    if (developerRole && hotDeveloperRole && optimizerRole) {
      // Developer 또는 Hot Developer 중에서 Optimizer 승급 대상 찾기
      const candidates = await prisma.users.findMany({
        where: {
          role_id: {
            in: [developerRole.role_id, hotDeveloperRole.role_id],
          },
          hot_dev_count: {
            gte: 10,
          },
        },
        include: {
          user_badge: true,
        },
      });

      for (const candidate of candidates) {
        // 고유한 칭호 개수 계산 (같은 칭호를 여러 번 받아도 1개로 카운트)
        const uniqueBadgeCount = new Set(
          candidate.user_badge.map((ub) => ub.badge_id)
        ).size;

        if (uniqueBadgeCount >= 5) {
          // Optimizer로 승급
          await prisma.users.update({
            where: { user_id: candidate.user_id },
            data: {
              role_id: optimizerRole.role_id,
            },
          });

          results.promotedToOptimizer.push({
            userId: candidate.user_id,
            nickname: candidate.nickname,
          });
        }
      }
    }

    // 3. Root 승급 체크 (답변 50회 이상 & 채택률 80%↑)
    if (optimizerRole) {
      const rootRole = await prisma.role.findUnique({
        where: { name: "Root" },
      });

      if (rootRole) {
        const optimizerCandidates = await prisma.users.findMany({
          where: {
            role_id: optimizerRole.role_id,
            total_answers: {
              gte: 50,
            },
          },
        });

        for (const candidate of optimizerCandidates) {
          const acceptanceRate =
            candidate.total_answers > 0
              ? (candidate.total_accepted / candidate.total_answers) * 100
              : 0;

          if (acceptanceRate >= 80) {
            // Root로 승급
            await prisma.users.update({
              where: { user_id: candidate.user_id },
              data: {
                role_id: rootRole.role_id,
              },
            });

            results.promotedToRoot.push({
              userId: candidate.user_id,
              nickname: candidate.nickname,
            });
          }
        }
      }
    }

    // 4. Optimizer 강등 체크 (답변 10회 이상 & 미채택률 80%↑)
    if (optimizerRole && developerRole) {
      const optimizerUsers = await prisma.users.findMany({
        where: {
          role_id: optimizerRole.role_id,
          total_answers: {
            gte: 10,
          },
        },
      });

      for (const user of optimizerUsers) {
        const rejectionRate =
          user.total_answers > 0
            ? ((user.total_answers - user.total_accepted) / user.total_answers) * 100
            : 0;

        if (rejectionRate >= 80) {
          // Developer로 강등 및 Hot Dev 횟수 초기화
          await prisma.users.update({
            where: { user_id: user.user_id },
            data: {
              role_id: developerRole.role_id,
              hot_dev_count: 0,
            },
          });

          results.demotedFromOptimizer.push({
            userId: user.user_id,
            nickname: user.nickname,
          });
        }
      }
    }

    // 5. 어제 받은 배지 자동 삭제 (선택사항: 데이터베이스 정리)
    // 배지는 하루만 유효하므로, 어제 배지를 삭제하여 데이터베이스 정리
    const yesterdayDateOnly = yesterday;
    const deletedBadgesCount = await prisma.user_badge.deleteMany({
      where: {
        granted_date: {
          lt: today, // 오늘 이전의 모든 배지 삭제
        },
      },
    });

    if (deletedBadgesCount.count > 0) {
      console.log(`🗑️ Deleted ${deletedBadgesCount.count} expired badges from ${yesterdayDateOnly.toISOString().split("T")[0]}`);
    }

    return NextResponse.json(
      {
        message: "승급 로직 실행 완료",
        date: today.toISOString().split("T")[0],
        results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Promote logic error:", error);
    return NextResponse.json(
      {
        error: "승급 로직 실행 중 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

