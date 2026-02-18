import {
  isAlreadyClaimedToday,
  selectRandomItem,
  isCycleComplete,
  getNextDayNumber,
  getCycleProgress,
  buildAvailableItemPool,
  getAllClaimedItemFiles,
} from "@/app/lib/daily-reward-utils";
import type { DailyRewardClaim, ItemPoolEntry } from "@/app/lib/types";
import { DEFAULT_CYCLE_LENGTH, CYCLE_COMPLETION_BONUS } from "@/app/lib/types";

// ============================================
// 헬퍼: DailyRewardClaim 생성
// ============================================
function makeClaim(
  dayNumber: number,
  claimedDate: string,
  itemType: "body_item" | "hand_item" = "body_item",
  itemFile: string = `item_${dayNumber}.png`
): DailyRewardClaim {
  return { dayNumber, claimedDate, itemType, itemFile };
}

/** 지정 일수만큼의 수령 기록을 생성한다 */
function makeClaimsForDays(count: number): DailyRewardClaim[] {
  return Array.from({ length: count }, (_, i) =>
    makeClaim(i + 1, `2026-02-${String(i + 1).padStart(2, "0")}`)
  );
}

// ============================================
// a. isAlreadyClaimedToday - 오늘 수령 여부 확인
// ============================================
describe("isAlreadyClaimedToday - 오늘 이미 보상을 수령했는지 확인", () => {
  it("빈 배열이면 false를 반환한다", () => {
    expect(isAlreadyClaimedToday([], "2026-02-17")).toBe(false);
  });

  it("오늘 날짜가 수령 기록에 있으면 true를 반환한다", () => {
    const claims = [makeClaim(1, "2026-02-17")];
    expect(isAlreadyClaimedToday(claims, "2026-02-17")).toBe(true);
  });

  it("오늘 날짜가 수령 기록에 없으면 false를 반환한다", () => {
    const claims = [makeClaim(1, "2026-02-16")];
    expect(isAlreadyClaimedToday(claims, "2026-02-17")).toBe(false);
  });

  it("여러 기록 중 오늘 날짜가 포함되어 있으면 true를 반환한다", () => {
    const claims = [
      makeClaim(1, "2026-02-15"),
      makeClaim(2, "2026-02-16"),
      makeClaim(3, "2026-02-17"),
    ];
    expect(isAlreadyClaimedToday(claims, "2026-02-17")).toBe(true);
  });

  it("여러 기록이 있지만 오늘 날짜가 없으면 false를 반환한다", () => {
    const claims = [
      makeClaim(1, "2026-02-14"),
      makeClaim(2, "2026-02-15"),
      makeClaim(3, "2026-02-16"),
    ];
    expect(isAlreadyClaimedToday(claims, "2026-02-17")).toBe(false);
  });

  it("다른 날짜 형식과 혼동하지 않는다", () => {
    const claims = [makeClaim(1, "2026-2-17")]; // 패딩 없는 형식
    expect(isAlreadyClaimedToday(claims, "2026-02-17")).toBe(false);
  });
});

// ============================================
// b. selectRandomItem - 랜덤 아이템 선택
// ============================================
describe("selectRandomItem - 아이템 풀에서 랜덤 선택", () => {
  const pool: ItemPoolEntry[] = [
    { itemType: "body_item", itemFile: "body_01.png" },
    { itemType: "body_item", itemFile: "body_02.png" },
    { itemType: "hand_item", itemFile: "hand_01.png" },
    { itemType: "hand_item", itemFile: "hand_02.png" },
  ];

  it("풀에서 아이템 1개를 반환한다", () => {
    const result = selectRandomItem(pool, []);
    expect(result).toHaveProperty("itemType");
    expect(result).toHaveProperty("itemFile");
  });

  it("반환된 아이템은 풀에 존재하는 것이다", () => {
    const result = selectRandomItem(pool, []);
    expect(pool).toContainEqual(result);
  });

  it("제외 목록에 있는 아이템은 선택되지 않는다", () => {
    // body_01, body_02, hand_01을 제외하면 hand_02만 남음
    const exclude = ["body_01.png", "body_02.png", "hand_01.png"];
    const result = selectRandomItem(pool, exclude);
    expect(result.itemFile).toBe("hand_02.png");
    expect(result.itemType).toBe("hand_item");
  });

  it("제외 후 풀이 하나만 남으면 그 아이템을 반환한다", () => {
    const exclude = ["body_01.png", "body_02.png", "hand_02.png"];
    const result = selectRandomItem(pool, exclude);
    expect(result.itemFile).toBe("hand_01.png");
  });

  it("모든 아이템이 제외되면 전체 풀에서 선택한다 (중복 허용)", () => {
    const exclude = ["body_01.png", "body_02.png", "hand_01.png", "hand_02.png"];
    const result = selectRandomItem(pool, exclude);
    // 전체 풀에서 선택하므로 풀에 포함된 아이템이어야 한다
    expect(pool).toContainEqual(result);
  });

  it("빈 풀이면 Error를 던진다", () => {
    expect(() => selectRandomItem([], [])).toThrow("아이템 풀이 비어있습니다.");
  });

  it("빈 풀에 제외 목록이 있어도 Error를 던진다", () => {
    expect(() => selectRandomItem([], ["body_01.png"])).toThrow(
      "아이템 풀이 비어있습니다."
    );
  });

  it("제외 목록이 빈 배열이면 전체 풀에서 선택한다", () => {
    const result = selectRandomItem(pool, []);
    expect(pool).toContainEqual(result);
  });

  it("단일 아이템 풀에서 해당 아이템을 반환한다", () => {
    const singlePool: ItemPoolEntry[] = [
      { itemType: "body_item", itemFile: "only_one.png" },
    ];
    const result = selectRandomItem(singlePool, []);
    expect(result.itemFile).toBe("only_one.png");
  });

  it("Math.random 고정 시 예측 가능한 결과를 반환한다", () => {
    const spy = vi.spyOn(Math, "random").mockReturnValue(0);
    const result = selectRandomItem(pool, []);
    expect(result).toEqual(pool[0]);
    spy.mockRestore();
  });

  it("Math.random이 0.999일 때 마지막 아이템을 반환한다", () => {
    const spy = vi.spyOn(Math, "random").mockReturnValue(0.999);
    const result = selectRandomItem(pool, []);
    expect(result).toEqual(pool[pool.length - 1]);
    spy.mockRestore();
  });
});

// ============================================
// c. isCycleComplete - 주기 완주 판정
// ============================================
describe("isCycleComplete - 주기 완주 여부 판정", () => {
  it("빈 배열이면 완주하지 않았다 (false)", () => {
    expect(isCycleComplete([])).toBe(false);
  });

  it("1일차만 수령했으면 완주하지 않았다 (false)", () => {
    expect(isCycleComplete(makeClaimsForDays(1))).toBe(false);
  });

  it("13일차까지 수령했으면 완주하지 않았다 (false)", () => {
    expect(isCycleComplete(makeClaimsForDays(13))).toBe(false);
  });

  it("정확히 14일차 수령 시 완주 판정 (true)", () => {
    expect(isCycleComplete(makeClaimsForDays(14))).toBe(true);
  });

  it("15일차 이상이면 완주 판정 (true)", () => {
    expect(isCycleComplete(makeClaimsForDays(15))).toBe(true);
  });

  it("cycleLength=7로 설정 시 7일차에 완주 판정", () => {
    expect(isCycleComplete(makeClaimsForDays(7), 7)).toBe(true);
  });

  it("cycleLength=7로 설정 시 6일차에 미완주", () => {
    expect(isCycleComplete(makeClaimsForDays(6), 7)).toBe(false);
  });

  it("기본 cycleLength는 DEFAULT_CYCLE_LENGTH(14)이다", () => {
    // 14개면 완주, 13개면 미완주
    expect(isCycleComplete(makeClaimsForDays(14))).toBe(true);
    expect(isCycleComplete(makeClaimsForDays(13))).toBe(false);
    expect(DEFAULT_CYCLE_LENGTH).toBe(14);
  });
});

// ============================================
// d. getNextDayNumber - 다음 일차 번호 계산
// ============================================
describe("getNextDayNumber - 다음 일차 번호 계산", () => {
  it("빈 배열이면 1을 반환한다", () => {
    expect(getNextDayNumber([])).toBe(1);
  });

  it("1개 기록이 있으면 2를 반환한다", () => {
    expect(getNextDayNumber(makeClaimsForDays(1))).toBe(2);
  });

  it("3개 기록이 있으면 4를 반환한다", () => {
    expect(getNextDayNumber(makeClaimsForDays(3))).toBe(4);
  });

  it("13개 기록이 있으면 14를 반환한다", () => {
    expect(getNextDayNumber(makeClaimsForDays(13))).toBe(14);
  });

  it("14개 기록이 있으면 15를 반환한다", () => {
    expect(getNextDayNumber(makeClaimsForDays(14))).toBe(15);
  });
});

// ============================================
// e. getCycleProgress - 주기 진행도 계산
// ============================================
describe("getCycleProgress - 주기 진행도 계산", () => {
  it("0/14: current=0, total=14, percentage=0", () => {
    const result = getCycleProgress([]);
    expect(result).toEqual({ current: 0, total: 14, percentage: 0 });
  });

  it("1/14: current=1, total=14, percentage=7", () => {
    const result = getCycleProgress(makeClaimsForDays(1));
    expect(result.current).toBe(1);
    expect(result.total).toBe(14);
    expect(result.percentage).toBe(7); // Math.round(1/14*100) = 7
  });

  it("7/14: current=7, total=14, percentage=50", () => {
    const result = getCycleProgress(makeClaimsForDays(7));
    expect(result).toEqual({ current: 7, total: 14, percentage: 50 });
  });

  it("14/14: current=14, total=14, percentage=100", () => {
    const result = getCycleProgress(makeClaimsForDays(14));
    expect(result).toEqual({ current: 14, total: 14, percentage: 100 });
  });

  it("15/14: percentage가 100을 초과하지 않는다", () => {
    const result = getCycleProgress(makeClaimsForDays(15));
    expect(result.current).toBe(15);
    expect(result.total).toBe(14);
    expect(result.percentage).toBe(100); // Math.min(107, 100) = 100
  });

  it("cycleLength=7로 설정 시 3/7 진행도", () => {
    const result = getCycleProgress(makeClaimsForDays(3), 7);
    expect(result).toEqual({ current: 3, total: 7, percentage: 43 });
  });

  it("cycleLength=7로 설정 시 7/7 = 100%", () => {
    const result = getCycleProgress(makeClaimsForDays(7), 7);
    expect(result).toEqual({ current: 7, total: 7, percentage: 100 });
  });

  it("5/14: percentage가 올바르게 반올림된다", () => {
    const result = getCycleProgress(makeClaimsForDays(5));
    // Math.round(5/14*100) = Math.round(35.71...) = 36
    expect(result.percentage).toBe(36);
  });
});

// ============================================
// f. buildAvailableItemPool - 아이템 풀 구성
// ============================================
describe("buildAvailableItemPool - body_item + hand_item 풀 구성", () => {
  const bodyItems = ["body_01.png", "body_02.png", "body_03.png"];
  const handItems = ["hand_01.png", "hand_02.png"];

  it("body + hand 아이템을 병합한 풀을 반환한다", () => {
    const pool = buildAvailableItemPool(bodyItems, handItems, []);
    expect(pool).toHaveLength(5);
  });

  it("body_item 타입이 올바르게 설정된다", () => {
    const pool = buildAvailableItemPool(bodyItems, [], []);
    expect(pool).toHaveLength(3);
    pool.forEach((entry) => {
      expect(entry.itemType).toBe("body_item");
    });
  });

  it("hand_item 타입이 올바르게 설정된다", () => {
    const pool = buildAvailableItemPool([], handItems, []);
    expect(pool).toHaveLength(2);
    pool.forEach((entry) => {
      expect(entry.itemType).toBe("hand_item");
    });
  });

  it("제외 목록을 적용하여 필터링한다", () => {
    const pool = buildAvailableItemPool(bodyItems, handItems, ["body_01.png", "hand_02.png"]);
    expect(pool).toHaveLength(3);
    const fileNames = pool.map((p) => p.itemFile);
    expect(fileNames).not.toContain("body_01.png");
    expect(fileNames).not.toContain("hand_02.png");
    expect(fileNames).toContain("body_02.png");
    expect(fileNames).toContain("body_03.png");
    expect(fileNames).toContain("hand_01.png");
  });

  it("모든 아이템이 제외되면 빈 배열을 반환한다", () => {
    const pool = buildAvailableItemPool(
      bodyItems,
      handItems,
      ["body_01.png", "body_02.png", "body_03.png", "hand_01.png", "hand_02.png"]
    );
    expect(pool).toHaveLength(0);
  });

  it("body와 hand 모두 빈 배열이면 빈 배열을 반환한다", () => {
    const pool = buildAvailableItemPool([], [], []);
    expect(pool).toHaveLength(0);
  });

  it("제외 목록에 없는 파일명은 영향을 주지 않는다", () => {
    const pool = buildAvailableItemPool(bodyItems, handItems, ["nonexistent.png"]);
    expect(pool).toHaveLength(5);
  });

  it("body_item이 hand_item보다 앞에 위치한다", () => {
    const pool = buildAvailableItemPool(bodyItems, handItems, []);
    // body 3개 + hand 2개 순서
    expect(pool[0].itemType).toBe("body_item");
    expect(pool[1].itemType).toBe("body_item");
    expect(pool[2].itemType).toBe("body_item");
    expect(pool[3].itemType).toBe("hand_item");
    expect(pool[4].itemType).toBe("hand_item");
  });
});

// ============================================
// g. getAllClaimedItemFiles - 수령 아이템 파일명 조회
// ============================================
describe("getAllClaimedItemFiles - 특정 타입의 수령 아이템 파일명 반환", () => {
  const allItems = [
    { itemType: "body_item" as const, itemFile: "body_01.png" },
    { itemType: "hand_item" as const, itemFile: "hand_01.png" },
    { itemType: "body_item" as const, itemFile: "body_02.png" },
    { itemType: "hand_item" as const, itemFile: "hand_02.png" },
    { itemType: "body_item" as const, itemFile: "body_03.png" },
  ];

  it("body_item 타입의 파일명만 반환한다", () => {
    const result = getAllClaimedItemFiles(allItems, "body_item");
    expect(result).toEqual(["body_01.png", "body_02.png", "body_03.png"]);
  });

  it("hand_item 타입의 파일명만 반환한다", () => {
    const result = getAllClaimedItemFiles(allItems, "hand_item");
    expect(result).toEqual(["hand_01.png", "hand_02.png"]);
  });

  it("빈 배열이면 빈 배열을 반환한다", () => {
    expect(getAllClaimedItemFiles([], "body_item")).toEqual([]);
    expect(getAllClaimedItemFiles([], "hand_item")).toEqual([]);
  });

  it("해당 타입이 없으면 빈 배열을 반환한다", () => {
    const bodyOnly = [
      { itemType: "body_item" as const, itemFile: "body_01.png" },
    ];
    expect(getAllClaimedItemFiles(bodyOnly, "hand_item")).toEqual([]);
  });

  it("모두 같은 타입이면 전체를 반환한다", () => {
    const allBody = [
      { itemType: "body_item" as const, itemFile: "body_01.png" },
      { itemType: "body_item" as const, itemFile: "body_02.png" },
    ];
    const result = getAllClaimedItemFiles(allBody, "body_item");
    expect(result).toEqual(["body_01.png", "body_02.png"]);
  });

  it("원본 배열 순서를 유지한다", () => {
    const items = [
      { itemType: "hand_item" as const, itemFile: "hand_03.png" },
      { itemType: "hand_item" as const, itemFile: "hand_01.png" },
      { itemType: "hand_item" as const, itemFile: "hand_02.png" },
    ];
    const result = getAllClaimedItemFiles(items, "hand_item");
    expect(result).toEqual(["hand_03.png", "hand_01.png", "hand_02.png"]);
  });
});

// ============================================
// 추가: SPEC-EVENT-002 상수 검증
// ============================================
describe("DEFAULT_CYCLE_LENGTH 상수 - 기본 주기 길이 검증", () => {
  it("기본 주기 길이가 14이다", () => {
    expect(DEFAULT_CYCLE_LENGTH).toBe(14);
  });
});

describe("CYCLE_COMPLETION_BONUS 상수 - 완주 보너스 설정 검증", () => {
  it("cycleLength가 14이다", () => {
    expect(CYCLE_COMPLETION_BONUS.cycleLength).toBe(14);
  });

  it("bonusItems가 3개이다", () => {
    expect(CYCLE_COMPLETION_BONUS.bonusItems).toHaveLength(3);
  });

  it("bonusItems에 body_item 1개와 hand_item 2개가 있다", () => {
    const bodyCount = CYCLE_COMPLETION_BONUS.bonusItems.filter(
      (i) => i.itemType === "body_item"
    ).length;
    const handCount = CYCLE_COMPLETION_BONUS.bonusItems.filter(
      (i) => i.itemType === "hand_item"
    ).length;
    expect(bodyCount).toBe(1);
    expect(handCount).toBe(2);
  });

  it("label이 설정되어 있다", () => {
    expect(CYCLE_COMPLETION_BONUS.label).toBe("14일 완주 보너스");
  });

  it("각 bonusItem에 itemFile이 존재한다", () => {
    for (const item of CYCLE_COMPLETION_BONUS.bonusItems) {
      expect(item.itemFile).toBeTruthy();
      expect(typeof item.itemFile).toBe("string");
    }
  });
});
