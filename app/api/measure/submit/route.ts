import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { answers } = body; // [{ questionId: number, value: number }, ...]

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "답변을 입력해주세요." },
        { status: 400 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(userId) },
      include: {
        dev_group: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 한국 시간(KST, UTC+9) 기준으로 오늘 날짜 생성
    // Prisma는 Date를 UTC로 저장하므로, 한국 시간 기준으로 날짜를 계산한 후 UTC로 변환
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // UTC+9 (밀리초)
    const kstNow = new Date(now.getTime() + kstOffset);
    const todayDateOnly = new Date(
      Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate()
      )
    );

    // Hot Developer는 당일 점수 측정 불가 (오늘 선정된 경우만)
    if (user.role.name === "Hot Developer") {
      // 오늘 Hot Developer로 선정되었는지 확인
      const hotDevRecord = await prisma.hot_developer.findUnique({
        where: {
          dev_group_id_effective_date: {
            dev_group_id: user.dev_group_id,
            effective_date: todayDateOnly,
          },
        },
      });

      if (hotDevRecord && hotDevRecord.user_id === user.user_id) {
        return NextResponse.json(
          {
            error: "Hot Developer는 당일 CPU 온도를 측정할 수 없습니다.",
            isHotDeveloper: true,
          },
          { status: 403 }
        );
      }
    }

    // Developer의 답변 채택 의무 확인
    // Developer, Hot Developer, Root는 고민을 등록할 수 있고, 답변이 있으면 채택해야 함
    const rolesRequiringAcceptance = ["Developer", "Hot Developer", "Root"];
    if (rolesRequiringAcceptance.includes(user.role.name)) {
      // 사용자가 등록한 고민 중에서 답변이 있는데 채택하지 않은 고민 확인
      const concernsWithUnacceptedAnswers = await prisma.concern.findMany({
        where: {
          user_id: user.user_id,
          was_good: null, // 아직 채택/비채택 결정을 하지 않음
        },
        include: {
          answer: true, // 답변 목록 포함
        },
      });

      // 답변이 있는 고민만 필터링 (한 번만 판별)
      const unacceptedConcerns = concernsWithUnacceptedAnswers
        .filter((concern) => concern.answer.length > 0)
        .map((concern) => concern.title);

      if (unacceptedConcerns.length > 0) {
        return NextResponse.json(
          {
            error: `답변을 채택해야 CPU 온도를 측정할 수 있습니다. 채택하지 않은 고민이 ${unacceptedConcerns.length}개 있습니다.`,
            requiresAcceptance: true,
            unacceptedConcerns: unacceptedConcerns,
          },
          { status: 403 }
        );
      }
    }

    // 트랜잭션 밖에서 먼저 질문 정보와 최대값 조회 (트랜잭션 타임아웃 방지)
    const questionIds = answers.map(
      (a: { questionId: number }) => a.questionId
    );
    const questions = await prisma.question.findMany({
      where: {
        question_id: { in: questionIds },
      },
    });

    // 각 질문별 최대값과 최소값을 병렬로 조회 (수면시간은 최소값 기준)
    const maxValuePromises = questionIds.map((questionId) =>
      prisma.daily_answer.aggregate({
        where: {
          question_id: questionId,
          answer_date: todayDateOnly,
        },
        _max: {
          answer_value: true,
        },
        _min: {
          answer_value: true,
        },
      })
    );

    const aggregateResults = await Promise.all(maxValuePromises);
    const maxValuesMap = new Map<number, number>();
    const minValuesMap = new Map<number, number>();
    questionIds.forEach((questionId, index) => {
      const maxValue = aggregateResults[index]._max.answer_value
        ? Number(aggregateResults[index]._max.answer_value)
        : 0;
      const minValue = aggregateResults[index]._min.answer_value
        ? Number(aggregateResults[index]._min.answer_value)
        : 0;
      maxValuesMap.set(questionId, maxValue);
      minValuesMap.set(questionId, minValue);
    });

    // 사용자의 답변값도 포함하여 최대값/최소값 재계산
    for (const answer of answers) {
      const question = questions.find(
        (q) => q.question_id === answer.questionId
      );
      if (!question) continue;
      const isSleepTime = question.content === "수면시간";
      const currentMax = maxValuesMap.get(answer.questionId) || 0;
      const currentMin = minValuesMap.get(answer.questionId) || Infinity;
      // 수면시간은 소수점 허용, 나머지는 정수
      const newValue = isSleepTime
        ? Math.max(0, parseFloat(answer.value.toString()) || 0)
        : Math.max(0, Math.floor(answer.value));
      if (newValue > currentMax) {
        maxValuesMap.set(answer.questionId, newValue);
      }
      if (newValue < currentMin) {
        minValuesMap.set(answer.questionId, newValue);
      }
    }

    // 점수 계산 (트랜잭션 밖에서)
    let totalScore = 0;
    const questionScores: Array<{
      questionId: number;
      score: number;
      isFirst: boolean;
    }> = [];

    for (const answer of answers) {
      const question = questions.find(
        (q) => q.question_id === answer.questionId
      );
      if (!question) continue;

      const maxValue = maxValuesMap.get(answer.questionId) || 0;
      const minValue = minValuesMap.get(answer.questionId) || 0;

      // 수면시간은 적을수록 높은 점수 (역방향 계산)
      const isSleepTime = question.content === "수면시간";

      // 수면시간은 소수점 허용, 나머지는 정수
      const answerValue = isSleepTime
        ? Math.max(0, parseFloat(answer.value.toString()) || 0)
        : Math.max(0, Math.floor(answer.value));

      let normalizedScore = 0;
      if (isSleepTime) {
        // 수면시간: 적을수록 높은 점수
        // 최소값이면 1점, 최대값이면 0점에 가까움
        if (maxValue > minValue) {
          // 역방향 정규화: (maxValue - answerValue) / (maxValue - minValue)
          normalizedScore = Math.max(
            0,
            Math.min(1, (maxValue - answerValue) / (maxValue - minValue))
          );
        } else if (maxValue === minValue && maxValue > 0) {
          // 모두 같은 값이면 1점
          normalizedScore = 1;
        } else if (answerValue === 0 && maxValue === 0) {
          // 모두 0이면 1점
          normalizedScore = 1;
        } else if (answerValue === minValue && minValue < maxValue) {
          // 최소값이면 1점
          normalizedScore = 1;
        }
      } else {
        // 일반 질문: 클수록 높은 점수
        if (maxValue > 0) {
          normalizedScore = Math.min(1, answerValue / maxValue);
        } else if (answerValue > 0) {
          // 최대값이 0인데 답변이 있으면 1등
          normalizedScore = 1;
        }
      }

      const questionScore = normalizedScore * Number(question.weight_percent);
      totalScore += questionScore;

      // 1등인지 확인
      let isFirst = false;
      if (isSleepTime) {
        // 수면시간: 최소값이면 1등
        isFirst =
          minValue < Infinity && answerValue === minValue && answerValue >= 0;
      } else {
        // 일반 질문: 최대값이면 1등
        isFirst = maxValue > 0 && answerValue >= maxValue && answerValue > 0;
      }

      questionScores.push({
        questionId: answer.questionId,
        score: questionScore,
        isFirst,
      });
    }

    // 최종 점수는 100점을 넘지 않도록
    totalScore = Math.min(100, totalScore);

    // 1. 답변 저장/업데이트
    const saveAnswerPromises = answers.map(
      (answer: { questionId: number; value: number }) => {
        const question = questions.find(
          (q) => q.question_id === answer.questionId
        );
        const isSleepTime = question?.content === "수면시간";
        // 수면시간은 소수점 허용, 나머지는 정수
        const value = isSleepTime
          ? Math.max(0, parseFloat(answer.value.toString()) || 0)
          : Math.max(0, Math.floor(answer.value));

        return prisma.daily_answer.upsert({
          where: {
            user_id_question_id_answer_date: {
              user_id: user.user_id,
              question_id: answer.questionId,
              answer_date: todayDateOnly,
            },
          },
          update: {
            answer_value: value,
          },
          create: {
            user_id: user.user_id,
            question_id: answer.questionId,
            answer_date: todayDateOnly,
            answer_value: value,
          },
        });
      }
    );

    await Promise.all(saveAnswerPromises);

    // 2. daily_score 저장/업데이트
    await prisma.daily_score.upsert({
      where: {
        user_id_score_date: {
          user_id: user.user_id,
          score_date: todayDateOnly,
        },
      },
      update: {
        cpu_score: totalScore,
      },
      create: {
        user_id: user.user_id,
        score_date: todayDateOnly,
        cpu_score: totalScore,
      },
    });

    // 3. 1등인 질문에 대해 뱃지 부여 (Hot Developer 질문 제외)
    const badgesToGrant: Array<{ questionId: number }> = [];
    for (const qScore of questionScores) {
      if (!qScore.isFirst) continue;

      // 해당 질문 정보 확인
      const question = questions.find(
        (q) => q.question_id === qScore.questionId
      );

      // Hot Developer 질문(SPECIAL 카테고리)은 뱃지 부여 안 함
      if (question?.category === "SPECIAL") {
        continue;
      }

      // 해당 질문의 뱃지 찾기
      const badge = await prisma.badge.findFirst({
        where: {
          question_id: qScore.questionId,
        },
      });

      if (!badge) continue;

      // 이미 오늘 뱃지를 받았는지 확인 후 없으면 생성
      await prisma.user_badge.upsert({
        where: {
          user_id_badge_id_granted_date: {
            user_id: user.user_id,
            badge_id: badge.badge_id,
            granted_date: todayDateOnly,
          },
        },
        update: {},
        create: {
          user_id: user.user_id,
          badge_id: badge.badge_id,
          granted_date: todayDateOnly,
        },
      });

      badgesToGrant.push({ questionId: qScore.questionId });
    }

    return NextResponse.json(
      {
        message: "CPU 온도 측정이 완료되었습니다.",
        cpuScore: totalScore,
        badgesGranted: badgesToGrant.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Submit answers error:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      {
        error: "답변 제출 중 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
