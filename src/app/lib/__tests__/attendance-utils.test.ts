import {
  formatDateString,
  formatYearMonth,
  getYesterday,
  calculateStreak,
  calculateMaxStreak,
  findMilestone,
  isAlreadyAttended,
  getApplicableTiers,
  isRewardAlreadyUnlocked,
  calculateUnlockedItemCounts,
} from "@/app/lib/attendance-utils";
import type { UnlockedReward } from "@/app/lib/types";
import { MILESTONES, ITEM_UNLOCK_TIERS } from "@/app/lib/types";

// ============================================
// a. 날짜 포매팅 테스트
// ============================================
describe("formatDateString - 날짜를 YYYY-MM-DD 형식으로 변환", () => {
  it("기본 날짜를 YYYY-MM-DD 형식으로 반환한다", () => {
    const date = new Date(2026, 1, 17); // 2026-02-17 (month는 0-indexed)
    expect(formatDateString(date)).toBe("2026-02-17");
  });

  it("한 자릿수 월을 0으로 패딩한다", () => {
    const date = new Date(2026, 0, 15); // 2026-01-15
    expect(formatDateString(date)).toBe("2026-01-15");
  });

  it("한 자릿수 일을 0으로 패딩한다", () => {
    const date = new Date(2026, 2, 5); // 2026-03-05
    expect(formatDateString(date)).toBe("2026-03-05");
  });

  it("월과 일 모두 한 자릿수인 경우 패딩한다", () => {
    const date = new Date(2026, 0, 3); // 2026-01-03
    expect(formatDateString(date)).toBe("2026-01-03");
  });

  it("12월 31일을 올바르게 포매팅한다", () => {
    const date = new Date(2025, 11, 31); // 2025-12-31
    expect(formatDateString(date)).toBe("2025-12-31");
  });

  it("두 자릿수 월/일을 패딩 없이 올바르게 포매팅한다", () => {
    const date = new Date(2026, 10, 25); // 2026-11-25
    expect(formatDateString(date)).toBe("2026-11-25");
  });
});

describe("formatYearMonth - 날짜를 YYYY-MM 형식으로 변환", () => {
  it("기본 날짜를 YYYY-MM 형식으로 반환한다", () => {
    const date = new Date(2026, 1, 17);
    expect(formatYearMonth(date)).toBe("2026-02");
  });

  it("한 자릿수 월을 0으로 패딩한다", () => {
    const date = new Date(2026, 0, 1);
    expect(formatYearMonth(date)).toBe("2026-01");
  });

  it("12월을 올바르게 반환한다", () => {
    const date = new Date(2025, 11, 15);
    expect(formatYearMonth(date)).toBe("2025-12");
  });
});

describe("getYesterday - 어제 날짜 계산", () => {
  it("일반적인 경우 전날을 반환한다", () => {
    const today = new Date(2026, 1, 17); // 2026-02-17
    const yesterday = getYesterday(today);
    expect(formatDateString(yesterday)).toBe("2026-02-16");
  });

  it("월 경계를 올바르게 처리한다 (3월 1일 -> 2월 28일, 평년)", () => {
    const marchFirst = new Date(2027, 2, 1); // 2027-03-01 (2027년은 평년)
    const yesterday = getYesterday(marchFirst);
    expect(formatDateString(yesterday)).toBe("2027-02-28");
  });

  it("윤년 월 경계를 올바르게 처리한다 (3월 1일 -> 2월 29일)", () => {
    const marchFirst = new Date(2028, 2, 1); // 2028-03-01 (2028년은 윤년)
    const yesterday = getYesterday(marchFirst);
    expect(formatDateString(yesterday)).toBe("2028-02-29");
  });

  it("연 경계를 올바르게 처리한다 (1월 1일 -> 12월 31일)", () => {
    const janFirst = new Date(2026, 0, 1); // 2026-01-01
    const yesterday = getYesterday(janFirst);
    expect(formatDateString(yesterday)).toBe("2025-12-31");
  });

  it("원본 Date 객체를 변경하지 않는다", () => {
    const today = new Date(2026, 1, 17);
    const todayString = formatDateString(today);
    getYesterday(today);
    expect(formatDateString(today)).toBe(todayString);
  });

  it("1일에서 이전 월 마지막 날로 이동한다 (5월 1일 -> 4월 30일)", () => {
    const mayFirst = new Date(2026, 4, 1); // 2026-05-01
    const yesterday = getYesterday(mayFirst);
    expect(formatDateString(yesterday)).toBe("2026-04-30");
  });
});

// ============================================
// b. 스트릭 계산 테스트
// ============================================
describe("calculateStreak - 연속 출석일 계산", () => {
  it("첫 출석 (어제 출석 기록 없음): streak = 1", () => {
    const result = calculateStreak([], "2026-02-16", 0);
    expect(result).toBe(1);
  });

  it("연속 출석 (어제 출석함): prevStreak + 1", () => {
    const attendedDates = ["2026-02-15", "2026-02-16"];
    const result = calculateStreak(attendedDates, "2026-02-16", 2);
    expect(result).toBe(3);
  });

  it("비연속 출석 (어제 출석 안함): streak 리셋 = 1", () => {
    const attendedDates = ["2026-02-14"]; // 어제(16일)가 아닌 14일만 있음
    const result = calculateStreak(attendedDates, "2026-02-16", 3);
    expect(result).toBe(1);
  });

  it("3일 연속 후 다음날 출석: streak = 4", () => {
    const attendedDates = ["2026-02-14", "2026-02-15", "2026-02-16"];
    const result = calculateStreak(attendedDates, "2026-02-16", 3);
    expect(result).toBe(4);
  });

  it("prevStreak이 0이고 어제 출석함: streak = 1", () => {
    // prevStreak이 0일 때 어제 출석한 경우 0 + 1 = 1
    const attendedDates = ["2026-02-16"];
    const result = calculateStreak(attendedDates, "2026-02-16", 0);
    expect(result).toBe(1);
  });

  it("긴 연속 출석 (29일 연속 후): streak = 30", () => {
    const attendedDates = ["2026-02-16"];
    const result = calculateStreak(attendedDates, "2026-02-16", 29);
    expect(result).toBe(30);
  });
});

describe("calculateMaxStreak - 최대 연속 출석일 갱신", () => {
  it("currentStreak이 existingMax보다 크면 갱신한다", () => {
    expect(calculateMaxStreak(3, 5)).toBe(5);
  });

  it("currentStreak이 existingMax보다 작으면 기존값을 유지한다", () => {
    expect(calculateMaxStreak(7, 3)).toBe(7);
  });

  it("currentStreak이 existingMax와 같으면 같은 값을 반환한다", () => {
    expect(calculateMaxStreak(5, 5)).toBe(5);
  });

  it("둘 다 0이면 0을 반환한다", () => {
    expect(calculateMaxStreak(0, 0)).toBe(0);
  });

  it("existingMax가 0이면 currentStreak을 반환한다", () => {
    expect(calculateMaxStreak(0, 1)).toBe(1);
  });
});

// ============================================
// c. 중복 방지 테스트
// ============================================
describe("isAlreadyAttended - 오늘 출석 중복 체크", () => {
  it("오늘 날짜가 attendedDates에 포함되어 있으면 true", () => {
    const attendedDates = ["2026-02-15", "2026-02-16", "2026-02-17"];
    expect(isAlreadyAttended(attendedDates, "2026-02-17")).toBe(true);
  });

  it("오늘 날짜가 attendedDates에 없으면 false", () => {
    const attendedDates = ["2026-02-15", "2026-02-16"];
    expect(isAlreadyAttended(attendedDates, "2026-02-17")).toBe(false);
  });

  it("attendedDates가 빈 배열이면 false", () => {
    expect(isAlreadyAttended([], "2026-02-17")).toBe(false);
  });

  it("첫 번째 날짜와 일치하는 경우 true", () => {
    const attendedDates = ["2026-02-17", "2026-02-18"];
    expect(isAlreadyAttended(attendedDates, "2026-02-17")).toBe(true);
  });
});

// ============================================
// d. 마일스톤 매칭 테스트
// ============================================
describe("findMilestone - 스트릭에 매칭되는 마일스톤 검색", () => {
  it("streak=3: expression 보상 마일스톤을 반환한다", () => {
    const result = findMilestone(3);
    expect(result).not.toBeNull();
    expect(result!.days).toBe(3);
    expect(result!.rewardType).toBe("expression");
    expect(result!.rewardFiles).toEqual(["special_exp_streak3.png"]);
  });

  it("streak=7: outfit 보상 마일스톤을 반환한다", () => {
    const result = findMilestone(7);
    expect(result).not.toBeNull();
    expect(result!.days).toBe(7);
    expect(result!.rewardType).toBe("outfit");
    expect(result!.rewardFiles).toEqual(["special_outfit_streak7.png"]);
  });

  it("streak=14: 파일 2개짜리 outfit 마일스톤을 반환한다", () => {
    const result = findMilestone(14);
    expect(result).not.toBeNull();
    expect(result!.days).toBe(14);
    expect(result!.rewardType).toBe("outfit");
    expect(result!.rewardFiles).toHaveLength(2);
    expect(result!.rewardFiles).toEqual([
      "special_outfit_streak14.png",
      "special_exp_streak14.png",
    ]);
  });

  it("streak=30: outfit_set 보상 마일스톤 (파일 3개)을 반환한다", () => {
    const result = findMilestone(30);
    expect(result).not.toBeNull();
    expect(result!.days).toBe(30);
    expect(result!.rewardType).toBe("outfit_set");
    expect(result!.rewardFiles).toHaveLength(3);
  });

  it("streak=5: 매칭되는 마일스톤이 없으면 null을 반환한다", () => {
    expect(findMilestone(5)).toBeNull();
  });

  it("streak=1: 매칭되는 마일스톤이 없으면 null을 반환한다", () => {
    expect(findMilestone(1)).toBeNull();
  });

  it("streak=0: 매칭되는 마일스톤이 없으면 null을 반환한다", () => {
    expect(findMilestone(0)).toBeNull();
  });

  it("streak=100: 정의되지 않은 큰 값에는 null을 반환한다", () => {
    expect(findMilestone(100)).toBeNull();
  });
});

// ============================================
// e. 적용 가능 티어 테스트
// ============================================
describe("getApplicableTiers - streak 기준 적용 가능 아이템 티어", () => {
  it("streak=1: 적용 가능한 티어가 없다", () => {
    const tiers = getApplicableTiers(1);
    expect(tiers).toHaveLength(0);
  });

  it("streak=2: 적용 가능한 티어가 없다", () => {
    const tiers = getApplicableTiers(2);
    expect(tiers).toHaveLength(0);
  });

  it("streak=3: 1개 티어 (3일 연속)", () => {
    const tiers = getApplicableTiers(3);
    expect(tiers).toHaveLength(1);
    expect(tiers[0].streakDays).toBe(3);
  });

  it("streak=7: 2개 티어 (3일, 7일)", () => {
    const tiers = getApplicableTiers(7);
    expect(tiers).toHaveLength(2);
    expect(tiers.map((t) => t.streakDays)).toEqual([3, 7]);
  });

  it("streak=14: 3개 티어 (3일, 7일, 14일)", () => {
    const tiers = getApplicableTiers(14);
    expect(tiers).toHaveLength(3);
    expect(tiers.map((t) => t.streakDays)).toEqual([3, 7, 14]);
  });

  it("streak=30: 모든 4개 티어 적용", () => {
    const tiers = getApplicableTiers(30);
    expect(tiers).toHaveLength(4);
    expect(tiers.map((t) => t.streakDays)).toEqual([3, 7, 14, 30]);
  });

  it("streak=10: 2개 티어 (3일, 7일) - 중간값 검증", () => {
    const tiers = getApplicableTiers(10);
    expect(tiers).toHaveLength(2);
    expect(tiers.map((t) => t.streakDays)).toEqual([3, 7]);
  });
});

// ============================================
// f. 보상 중복 체크 테스트
// ============================================
describe("isRewardAlreadyUnlocked - 보상 중복 해금 확인", () => {
  it("빈 보상 목록: 해금되지 않음 (false)", () => {
    expect(isRewardAlreadyUnlocked([], 3, "2026-02")).toBe(false);
  });

  it("다른 마일스톤의 보상만 있는 경우: 해금되지 않음 (false)", () => {
    const rewards = [{ milestone: 7, unlockedMonth: "2026-02" }];
    expect(isRewardAlreadyUnlocked(rewards, 3, "2026-02")).toBe(false);
  });

  it("같은 마일스톤이지만 다른 월: 해금되지 않음 (false)", () => {
    const rewards = [{ milestone: 3, unlockedMonth: "2026-01" }];
    expect(isRewardAlreadyUnlocked(rewards, 3, "2026-02")).toBe(false);
  });

  it("같은 마일스톤 + 같은 월: 이미 해금됨 (true)", () => {
    const rewards = [{ milestone: 3, unlockedMonth: "2026-02" }];
    expect(isRewardAlreadyUnlocked(rewards, 3, "2026-02")).toBe(true);
  });

  it("여러 보상 중 일치하는 것이 있는 경우: 이미 해금됨 (true)", () => {
    const rewards = [
      { milestone: 3, unlockedMonth: "2026-01" },
      { milestone: 7, unlockedMonth: "2026-02" },
      { milestone: 3, unlockedMonth: "2026-02" },
    ];
    expect(isRewardAlreadyUnlocked(rewards, 3, "2026-02")).toBe(true);
  });
});

// ============================================
// g. 아이템 해금 수 계산 테스트
// ============================================
describe("calculateUnlockedItemCounts - 해금 아이템 수 계산", () => {
  // 헬퍼: UnlockedReward 생성
  function makeReward(
    milestone: number,
    rewardType: UnlockedReward["rewardType"]
  ): UnlockedReward {
    return {
      milestone,
      rewardType,
      rewardFiles: [],
      unlockedAt: new Date(),
      unlockedMonth: "2026-02",
    };
  }

  it("빈 보상 목록: bodyItemCount=0, handItemCount=0", () => {
    const result = calculateUnlockedItemCounts([]);
    expect(result.bodyItemCount).toBe(0);
    expect(result.handItemCount).toBe(0);
  });

  it("3일 body_item 보상만 있는 경우: bodyItemCount=15, handItemCount=0", () => {
    // ITEM_UNLOCK_TIERS[0] = { streakDays: 3, bodyItemCount: 15, handItemCount: 0 }
    const rewards = [makeReward(3, "body_item")];
    const result = calculateUnlockedItemCounts(rewards);
    expect(result.bodyItemCount).toBe(15);
    expect(result.handItemCount).toBe(0);
  });

  it("3일 body + 7일 hand 보상: bodyItemCount=60, handItemCount=30", () => {
    // 3일 티어: body=15, hand=0
    // 7일 티어: body=60, hand=30
    // Math.max(15, 60) = 60, Math.max(0, 30) = 30
    const rewards = [
      makeReward(3, "body_item"),
      makeReward(7, "hand_item"),
    ];
    const result = calculateUnlockedItemCounts(rewards);
    expect(result.bodyItemCount).toBe(60);
    expect(result.handItemCount).toBe(30);
  });

  it("모든 티어 해금: bodyItemCount=60, handItemCount=116", () => {
    // 3일: body=15, hand=0
    // 7일: body=60, hand=30
    // 14일: body=60, hand=86
    // 30일: body=60, hand=116
    const rewards = [
      makeReward(3, "body_item"),
      makeReward(7, "body_item"),
      makeReward(7, "hand_item"),
      makeReward(14, "body_item"),
      makeReward(14, "hand_item"),
      makeReward(30, "body_item"),
      makeReward(30, "hand_item"),
    ];
    const result = calculateUnlockedItemCounts(rewards);
    expect(result.bodyItemCount).toBe(60);
    expect(result.handItemCount).toBe(116);
  });

  it("hand_item만 있는 경우에도 해당 티어의 body 값이 반영된다", () => {
    // 7일 티어 hand_item: body=60, hand=30 (둘 다 Math.max 적용)
    const rewards = [makeReward(7, "hand_item")];
    const result = calculateUnlockedItemCounts(rewards);
    expect(result.bodyItemCount).toBe(60);
    expect(result.handItemCount).toBe(30);
  });

  it("expression/outfit 타입 보상은 아이템 수에 영향을 주지 않는다", () => {
    const rewards = [
      makeReward(3, "expression"),
      makeReward(7, "outfit"),
      makeReward(30, "outfit_set"),
    ];
    const result = calculateUnlockedItemCounts(rewards);
    expect(result.bodyItemCount).toBe(0);
    expect(result.handItemCount).toBe(0);
  });

  it("매칭되지 않는 milestone의 body_item/hand_item은 무시한다", () => {
    // milestone=5는 ITEM_UNLOCK_TIERS에 없음
    const rewards = [makeReward(5, "body_item")];
    const result = calculateUnlockedItemCounts(rewards);
    expect(result.bodyItemCount).toBe(0);
    expect(result.handItemCount).toBe(0);
  });
});

// ============================================
// 추가: MILESTONES / ITEM_UNLOCK_TIERS 상수 검증
// ============================================
describe("MILESTONES 상수 - 마일스톤 설정 무결성 검증", () => {
  it("4개의 마일스톤이 정의되어 있다", () => {
    expect(MILESTONES).toHaveLength(4);
  });

  it("마일스톤 days가 오름차순이다", () => {
    const days = MILESTONES.map((m) => m.days);
    expect(days).toEqual([3, 7, 14, 30]);
  });

  it("모든 마일스톤에 rewardFiles가 1개 이상 있다", () => {
    for (const m of MILESTONES) {
      expect(m.rewardFiles.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("ITEM_UNLOCK_TIERS 상수 - 아이템 해금 티어 무결성 검증", () => {
  it("4개의 티어가 정의되어 있다", () => {
    expect(ITEM_UNLOCK_TIERS).toHaveLength(4);
  });

  it("티어 streakDays가 오름차순이다", () => {
    const days = ITEM_UNLOCK_TIERS.map((t) => t.streakDays);
    expect(days).toEqual([3, 7, 14, 30]);
  });

  it("handItemCount가 단조 증가한다", () => {
    for (let i = 1; i < ITEM_UNLOCK_TIERS.length; i++) {
      expect(ITEM_UNLOCK_TIERS[i].handItemCount).toBeGreaterThanOrEqual(
        ITEM_UNLOCK_TIERS[i - 1].handItemCount
      );
    }
  });
});
