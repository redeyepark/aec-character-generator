"use client";

/**
 * 일일 아이템 보상 관리 CRUD 훅
 * Firestore event_rewards/{userId} 문서에서 이벤트 보상 진행 상태를 관리한다.
 * 매일 출석 시 랜덤 아이템을 지급하고, 주기 완주 시 보너스를 처리한다.
 */

import { useState, useCallback } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import type {
  EventRewardData,
  DailyRewardClaim,
  DailyClaimResult,
  ItemPoolEntry,
} from "@/app/lib/types";
import { DEFAULT_CYCLE_LENGTH, CYCLE_COMPLETION_BONUS } from "@/app/lib/types";
import { useAuth } from "./useAuth";
import {
  isAlreadyClaimedToday,
  selectRandomItem,
  isCycleComplete,
  getNextDayNumber,
  getCycleProgress as calcCycleProgress,
  buildAvailableItemPool,
  getAllClaimedItemFiles,
} from "@/app/lib/daily-reward-utils";
import { getBodyItemAssets, getHandItemAssets } from "@/app/lib/assetManager";

interface UseDailyRewardReturn {
  /** 로딩 상태 */
  loading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 이벤트 보상 데이터 */
  eventReward: EventRewardData | null;
  /** 일일 보상 수령 (출석 기록 후 호출) */
  claimDailyReward: () => Promise<DailyClaimResult | null>;
  /** 이벤트 보상 데이터 조회 */
  fetchEventReward: () => Promise<EventRewardData | null>;
  /** 일일 보상으로 수령한 아이템 파일 목록 (영구) */
  getDailyRewardItems: (itemType: "body_item" | "hand_item") => string[];
  /** 주기 진행 현황 */
  getCycleProgress: () => { current: number; total: number; percentage: number };
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환한다 (브라우저 로컬 타임존 기준).
 */
function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Firestore 문서의 dailyClaims 배열을 도메인 타입으로 변환한다.
 * Firestore의 claimedAt (Timestamp) 필드를 제거한다.
 */
function toDailyRewardClaim(raw: Record<string, unknown>): DailyRewardClaim {
  return {
    dayNumber: raw.dayNumber as number,
    claimedDate: raw.claimedDate as string,
    itemType: raw.itemType as "body_item" | "hand_item",
    itemFile: raw.itemFile as string,
  };
}

export function useDailyReward(): UseDailyRewardReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventReward, setEventReward] = useState<EventRewardData | null>(null);

  // 이벤트 보상 데이터 조회
  const fetchEventReward = useCallback(async (): Promise<EventRewardData | null> => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, "event_rewards", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // 문서가 없으면 null 반환
        setEventReward(null);
        return null;
      }

      const data = docSnap.data();

      // Firestore 문서를 도메인 타입으로 변환
      const rawClaims = (data.dailyClaims as Record<string, unknown>[]) ?? [];
      const rawAllClaimed = (data.allClaimedItems as Record<string, unknown>[]) ?? [];

      const result: EventRewardData = {
        cycleLength: (data.cycleLength as number) ?? DEFAULT_CYCLE_LENGTH,
        cycleNumber: (data.cycleNumber as number) ?? 1,
        cycleStartDate: (data.cycleStartDate as string) ?? "",
        dailyClaims: rawClaims.map(toDailyRewardClaim),
        cycleCompleted: (data.cycleCompleted as boolean) ?? false,
        completionBonusClaimed: (data.completionBonusClaimed as boolean) ?? false,
        completedCycles: (data.completedCycles as number) ?? 0,
        allClaimedItems: rawAllClaimed.map((item) => ({
          itemType: item.itemType as "body_item" | "hand_item",
          itemFile: item.itemFile as string,
        })),
      };

      setEventReward(result);
      return result;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "이벤트 보상 데이터 조회 실패";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 일일 보상 수령
  const claimDailyReward = useCallback(async (): Promise<DailyClaimResult | null> => {
    // 1. user 없으면 null 반환
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      // 2. 현재 상태 조회
      const docRef = doc(db, "event_rewards", user.uid);
      const docSnap = await getDoc(docRef);

      // 3. 오늘 날짜 계산 (브라우저 로컬 타임존)
      const today = getTodayString();

      // 현재 데이터 초기값
      let cycleNumber = 1;
      let cycleStartDate = today;
      let dailyClaims: DailyRewardClaim[] = [];
      let cycleCompleted = false;
      let completionBonusClaimed = false;
      let completedCycles = 0;
      let allClaimedItems: { itemType: "body_item" | "hand_item"; itemFile: string }[] = [];
      let cycleLength = DEFAULT_CYCLE_LENGTH;

      if (docSnap.exists()) {
        const data = docSnap.data();
        cycleNumber = (data.cycleNumber as number) ?? 1;
        cycleStartDate = (data.cycleStartDate as string) ?? today;
        const rawClaims = (data.dailyClaims as Record<string, unknown>[]) ?? [];
        dailyClaims = rawClaims.map(toDailyRewardClaim);
        cycleCompleted = (data.cycleCompleted as boolean) ?? false;
        completionBonusClaimed = (data.completionBonusClaimed as boolean) ?? false;
        completedCycles = (data.completedCycles as number) ?? 0;
        const rawAllClaimed = (data.allClaimedItems as Record<string, unknown>[]) ?? [];
        allClaimedItems = rawAllClaimed.map((item) => ({
          itemType: item.itemType as "body_item" | "hand_item",
          itemFile: item.itemFile as string,
        }));
        cycleLength = (data.cycleLength as number) ?? DEFAULT_CYCLE_LENGTH;
      }

      // 4. 오늘 이미 수령했는지 확인 (멱등성)
      if (isAlreadyClaimedToday(dailyClaims, today)) {
        return null;
      }

      // 5. 현재 주기가 완주 상태이면 새 주기 시작
      if (cycleCompleted) {
        cycleNumber += 1;
        cycleStartDate = today;
        dailyClaims = [];
        cycleCompleted = false;
        completionBonusClaimed = false;
      }

      // 6. 문서가 없으면 첫 주기 생성 (초기값 그대로 사용)
      // - 위에서 초기값으로 이미 설정됨

      // 7. 아이템 풀 구성
      const bodyItems = getBodyItemAssets();
      const handItems = getHandItemAssets();
      // 현재 주기에서 이미 지급된 파일명 목록
      const excludeFiles = dailyClaims.map((claim) => claim.itemFile);
      const pool = buildAvailableItemPool(bodyItems, handItems, excludeFiles);

      // 8. 랜덤 아이템 선택
      const selectedItem = selectRandomItem(pool, excludeFiles);

      // 9. 다음 일차 번호 계산
      const dayNumber = getNextDayNumber(dailyClaims);

      // 10. 새 수령 기록 생성
      const newClaim: DailyRewardClaim = {
        dayNumber,
        claimedDate: today,
        itemType: selectedItem.itemType,
        itemFile: selectedItem.itemFile,
      };

      // 11. dailyClaims에 추가
      const updatedDailyClaims = [...dailyClaims, newClaim];

      // 12. allClaimedItems에 추가
      const updatedAllClaimedItems = [
        ...allClaimedItems,
        { itemType: selectedItem.itemType, itemFile: selectedItem.itemFile },
      ];

      // 13. 주기 완주 확인
      const cycleComplete = isCycleComplete(updatedDailyClaims, cycleLength);

      // 14. 완주 처리
      let bonusItems: ItemPoolEntry[] | null = null;
      let updatedCycleCompleted: boolean = cycleCompleted;
      let updatedCompletionBonusClaimed: boolean = completionBonusClaimed;
      let updatedCompletedCycles = completedCycles;
      let finalAllClaimedItems = updatedAllClaimedItems;

      if (cycleComplete) {
        updatedCycleCompleted = true;

        if (completedCycles === 0) {
          // 1회 완주 보너스
          updatedCompletionBonusClaimed = true;
          bonusItems = CYCLE_COMPLETION_BONUS.bonusItems;
          finalAllClaimedItems = [
            ...updatedAllClaimedItems,
            ...CYCLE_COMPLETION_BONUS.bonusItems.map((b) => ({
              itemType: b.itemType,
              itemFile: b.itemFile,
            })),
          ];
        } else {
          // 재완주: 보너스 중복 미지급
          updatedCompletionBonusClaimed = false;
        }

        updatedCompletedCycles += 1;
      }

      // 15. Firestore 업데이트 (merge: true)
      // Firestore에 저장할 dailyClaims에 claimedAt Timestamp 추가
      const firestoreDailyClaims = updatedDailyClaims.map((claim) => ({
        dayNumber: claim.dayNumber,
        claimedDate: claim.claimedDate,
        itemType: claim.itemType,
        itemFile: claim.itemFile,
        claimedAt: serverTimestamp(),
      }));

      await setDoc(
        docRef,
        {
          userId: user.uid,
          cycleLength,
          cycleNumber,
          cycleStartDate,
          dailyClaims: firestoreDailyClaims,
          cycleCompleted: updatedCycleCompleted,
          completionBonusClaimed: updatedCompletionBonusClaimed,
          completedCycles: updatedCompletedCycles,
          allClaimedItems: finalAllClaimedItems,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 16. 로컬 state 업데이트
      setEventReward({
        cycleLength,
        cycleNumber,
        cycleStartDate,
        dailyClaims: updatedDailyClaims,
        cycleCompleted: updatedCycleCompleted,
        completionBonusClaimed: updatedCompletionBonusClaimed,
        completedCycles: updatedCompletedCycles,
        allClaimedItems: finalAllClaimedItems,
      });

      // 17. DailyClaimResult 반환
      return {
        claimed: true,
        dayNumber,
        itemType: selectedItem.itemType,
        itemFile: selectedItem.itemFile,
        isCycleComplete: cycleComplete,
        bonusItems: bonusItems,
      };
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "일일 보상 수령 실패";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 일일 보상으로 수령한 아이템 파일 목록 (영구)
  const getDailyRewardItems = useCallback(
    (itemType: "body_item" | "hand_item"): string[] => {
      if (!eventReward) return [];
      return getAllClaimedItemFiles(eventReward.allClaimedItems, itemType);
    },
    [eventReward]
  );

  // 주기 진행 현황
  const getCycleProgress = useCallback((): {
    current: number;
    total: number;
    percentage: number;
  } => {
    if (!eventReward) {
      return { current: 0, total: DEFAULT_CYCLE_LENGTH, percentage: 0 };
    }
    return calcCycleProgress(eventReward.dailyClaims, eventReward.cycleLength);
  }, [eventReward]);

  return {
    loading,
    error,
    eventReward,
    claimDailyReward,
    fetchEventReward,
    getDailyRewardItems,
    getCycleProgress,
  };
}
