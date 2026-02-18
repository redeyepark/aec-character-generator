/**
 * 출석 체크 순수 비즈니스 로직 유틸리티
 * 훅(useAttendance, useRewards)에서 사용하는 핵심 로직을
 * Firebase/React 의존성 없이 테스트 가능한 순수 함수로 추출한다.
 */
import type { MilestoneConfig, ItemUnlockTier, UnlockedReward } from "@/app/lib/types";
import { MILESTONES, ITEM_UNLOCK_TIERS } from "@/app/lib/types";

// ============================================
// 날짜 유틸리티
// ============================================

/**
 * Date 객체를 YYYY-MM-DD 형식 문자열로 변환한다.
 * 월과 일이 한 자릿수인 경우 0으로 패딩한다.
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Date 객체를 YYYY-MM 형식 문자열로 변환한다.
 */
export function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * 주어진 날짜의 전날(어제) Date 객체를 반환한다.
 * 월/연 경계도 올바르게 처리한다.
 */
export function getYesterday(date: Date): Date {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

// ============================================
// 스트릭 계산
// ============================================

/**
 * 출석 연속일(streak)을 계산한다.
 *
 * - 어제 날짜가 attendedDates에 포함되면: prevStreak + 1 (연속 출석)
 * - 어제 날짜가 없으면: 1 (리셋)
 *
 * @param attendedDates 기존 출석 날짜 배열 (YYYY-MM-DD)
 * @param yesterday 어제 날짜 문자열 (YYYY-MM-DD)
 * @param prevStreak 이전 연속 출석일
 * @returns 현재 연속 출석일
 */
export function calculateStreak(
  attendedDates: string[],
  yesterday: string,
  prevStreak: number
): number {
  if (attendedDates.includes(yesterday)) {
    return prevStreak + 1;
  }
  return 1;
}

/**
 * 최대 연속 출석일을 갱신한다.
 * 현재 streak이 기존 최대값보다 크면 갱신한다.
 */
export function calculateMaxStreak(
  existingMax: number,
  currentStreak: number
): number {
  return Math.max(existingMax, currentStreak);
}

// ============================================
// 마일스톤 매칭
// ============================================

/**
 * 현재 streak에 매칭되는 마일스톤 설정을 반환한다.
 * 매칭되는 마일스톤이 없으면 null을 반환한다.
 *
 * MILESTONES: [{days:3}, {days:7}, {days:14}, {days:30}]
 */
export function findMilestone(currentStreak: number): MilestoneConfig | null {
  return MILESTONES.find((m) => m.days === currentStreak) ?? null;
}

// ============================================
// 중복 체크
// ============================================

/**
 * 오늘 이미 출석했는지 확인한다.
 * attendedDates 배열에 today가 포함되어 있으면 true를 반환한다.
 */
export function isAlreadyAttended(
  attendedDates: string[],
  today: string
): boolean {
  return attendedDates.includes(today);
}

// ============================================
// 아이템 티어 매칭
// ============================================

/**
 * 현재 streak 이하인 모든 적용 가능한 아이템 해금 티어를 반환한다.
 * streak >= tier.streakDays 인 티어만 포함한다.
 */
export function getApplicableTiers(streak: number): ItemUnlockTier[] {
  return ITEM_UNLOCK_TIERS.filter((t) => streak >= t.streakDays);
}

// ============================================
// 보상 중복 확인
// ============================================

/**
 * 특정 마일스톤 + 특정 월 조합의 보상이 이미 해금되었는지 확인한다.
 * 같은 마일스톤 + 같은 월에 이미 해금되어 있으면 true를 반환한다.
 */
export function isRewardAlreadyUnlocked(
  existingRewards: Array<{ milestone: number; unlockedMonth: string }>,
  milestone: number,
  yearMonth: string
): boolean {
  return existingRewards.some(
    (r) => r.milestone === milestone && r.unlockedMonth === yearMonth
  );
}

// ============================================
// 해금 아이템 수 계산
// ============================================

/**
 * 해금된 보상 목록에서 착용 소품(body_item)과 손 아이템(hand_item)의
 * 누적 해금 개수를 계산한다.
 *
 * 각 보상의 milestone에 매칭되는 ITEM_UNLOCK_TIERS에서
 * bodyItemCount와 handItemCount의 최대값을 취한다.
 */
export function calculateUnlockedItemCounts(
  rewards: UnlockedReward[]
): { bodyItemCount: number; handItemCount: number } {
  let bodyItemCount = 0;
  let handItemCount = 0;

  for (const r of rewards) {
    if (r.rewardType === "body_item" || r.rewardType === "hand_item") {
      const tier = ITEM_UNLOCK_TIERS.find((t) => t.streakDays === r.milestone);
      if (tier) {
        bodyItemCount = Math.max(bodyItemCount, tier.bodyItemCount);
        handItemCount = Math.max(handItemCount, tier.handItemCount);
      }
    }
  }

  return { bodyItemCount, handItemCount };
}
