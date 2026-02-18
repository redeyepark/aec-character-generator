/**
 * 일일 아이템 보상 순수 비즈니스 로직 유틸리티
 * useDailyReward 훅에서 사용하는 핵심 로직을
 * Firebase/React 의존성 없이 테스트 가능한 순수 함수로 추출한다.
 */
import type { DailyRewardClaim, ItemPoolEntry } from "@/app/lib/types";
import { DEFAULT_CYCLE_LENGTH } from "@/app/lib/types";

// ============================================
// 수령 여부 확인
// ============================================

/**
 * 오늘 이미 일일 보상을 수령했는지 확인한다.
 * dailyClaims 배열에서 claimedDate가 today와 일치하는 항목이 있으면 true를 반환한다.
 *
 * @param dailyClaims 현재 주기의 수령 기록 배열
 * @param today 오늘 날짜 문자열 (YYYY-MM-DD)
 * @returns 오늘 이미 수령했으면 true
 */
export function isAlreadyClaimedToday(
  dailyClaims: DailyRewardClaim[],
  today: string
): boolean {
  return dailyClaims.some((claim) => claim.claimedDate === today);
}

// ============================================
// 아이템 선택
// ============================================

/**
 * 아이템 풀에서 제외 목록을 빼고 랜덤 아이템 1개를 선택한다.
 *
 * - 제외 목록에 없는 아이템만 필터링
 * - 필터링된 풀이 비어있으면 전체 풀에서 무작위 선택 (중복 허용)
 * - Math.random() 사용
 *
 * @param pool 전체 아이템 풀
 * @param excludeFiles 제외할 아이템 파일명 목록
 * @returns 선택된 아이템
 * @throws 풀이 비어있으면 Error
 */
export function selectRandomItem(
  pool: ItemPoolEntry[],
  excludeFiles: string[]
): ItemPoolEntry {
  if (pool.length === 0) {
    throw new Error("아이템 풀이 비어있습니다.");
  }

  // 제외 목록 적용
  const filtered = pool.filter(
    (item) => !excludeFiles.includes(item.itemFile)
  );

  // 필터링 후 남은 아이템이 없으면 전체 풀에서 선택 (중복 허용)
  const source = filtered.length > 0 ? filtered : pool;

  const index = Math.floor(Math.random() * source.length);
  return source[index];
}

// ============================================
// 주기 완주 판정
// ============================================

/**
 * 주기 완주 여부를 판정한다.
 * dailyClaims 수가 cycleLength 이상이면 완주로 판정한다.
 *
 * @param dailyClaims 현재 주기의 수령 기록 배열
 * @param cycleLength 주기 길이 (기본 14)
 * @returns 완주 여부
 */
export function isCycleComplete(
  dailyClaims: DailyRewardClaim[],
  cycleLength: number = DEFAULT_CYCLE_LENGTH
): boolean {
  return dailyClaims.length >= cycleLength;
}

// ============================================
// 일차 계산
// ============================================

/**
 * 다음 일차 번호를 계산한다.
 * 현재 수령 기록 수 + 1을 반환한다. 빈 배열이면 1을 반환한다.
 *
 * @param dailyClaims 현재 주기의 수령 기록 배열
 * @returns 다음 일차 번호
 */
export function getNextDayNumber(dailyClaims: DailyRewardClaim[]): number {
  return dailyClaims.length + 1;
}

// ============================================
// 진행도 계산
// ============================================

/**
 * 주기 진행도를 계산한다.
 * current는 현재 수령 횟수, total은 주기 길이, percentage는 백분율이다.
 * percentage는 100%를 초과하지 않도록 Math.min으로 제한한다.
 *
 * @param dailyClaims 현재 주기의 수령 기록 배열
 * @param cycleLength 주기 길이 (기본 14)
 * @returns 진행도 객체 { current, total, percentage }
 */
export function getCycleProgress(
  dailyClaims: DailyRewardClaim[],
  cycleLength: number = DEFAULT_CYCLE_LENGTH
): { current: number; total: number; percentage: number } {
  const current = dailyClaims.length;
  const total = cycleLength;
  const percentage = Math.min(
    Math.round((current / total) * 100),
    100
  );

  return { current, total, percentage };
}

// ============================================
// 아이템 풀 구성
// ============================================

/**
 * body_item + hand_item 풀을 구성한다 (제외 목록 적용).
 * bodyItems 파일명을 body_item 타입으로, handItems 파일명을 hand_item 타입으로 변환하고
 * excludeFiles에 포함된 파일명을 제외한 풀을 반환한다.
 *
 * @param bodyItems body_item 파일명 배열
 * @param handItems hand_item 파일명 배열
 * @param excludeFiles 제외할 파일명 목록
 * @returns 사용 가능한 아이템 풀
 */
export function buildAvailableItemPool(
  bodyItems: string[],
  handItems: string[],
  excludeFiles: string[]
): ItemPoolEntry[] {
  const bodyEntries: ItemPoolEntry[] = bodyItems.map((file) => ({
    itemType: "body_item" as const,
    itemFile: file,
  }));

  const handEntries: ItemPoolEntry[] = handItems.map((file) => ({
    itemType: "hand_item" as const,
    itemFile: file,
  }));

  const allEntries = [...bodyEntries, ...handEntries];

  return allEntries.filter((entry) => !excludeFiles.includes(entry.itemFile));
}

// ============================================
// 수령 아이템 조회
// ============================================

/**
 * 영구 수령 아이템 중 특정 타입의 파일명 목록을 반환한다.
 *
 * @param allClaimedItems 모든 주기의 수령 아이템 배열
 * @param itemType 필터링할 아이템 타입
 * @returns 해당 타입의 파일명 배열
 */
export function getAllClaimedItemFiles(
  allClaimedItems: { itemType: "body_item" | "hand_item"; itemFile: string }[],
  itemType: "body_item" | "hand_item"
): string[] {
  return allClaimedItems
    .filter((item) => item.itemType === itemType)
    .map((item) => item.itemFile);
}
