"use client";

/**
 * 보상 관리 CRUD 훅
 * Firestore rewards/{userId} 문서에서 해금된 보상을 조회/관리한다.
 * 마일스톤 달성 시 보상을 해금하고, 해금된 파일 목록을 제공한다.
 */
import { useState, useCallback } from "react";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import type { RewardData, UnlockedReward, MilestoneConfig } from "@/app/lib/types";
import { MILESTONES } from "@/app/lib/types";
import { useAuth } from "./useAuth";

/**
 * Firestore 보상 문서의 개별 항목을 도메인 타입으로 변환
 */
function toUnlockedReward(raw: Record<string, unknown>): UnlockedReward {
  return {
    milestone: raw.milestone as number,
    rewardType: raw.rewardType as "expression" | "outfit" | "outfit_set",
    rewardFiles: (raw.rewardFiles as string[]) ?? [],
    unlockedAt:
      raw.unlockedAt && typeof (raw.unlockedAt as { toDate?: () => Date }).toDate === "function"
        ? (raw.unlockedAt as { toDate: () => Date }).toDate()
        : new Date(),
    unlockedMonth: (raw.unlockedMonth as string) ?? "",
  };
}

interface UseRewardsReturn {
  /** 로딩 상태 */
  loading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 현재 보상 데이터 */
  rewards: RewardData | null;
  /** 보상 데이터 조회 */
  fetchRewards: () => Promise<RewardData | null>;
  /** 마일스톤 달성 시 보상 해금 확인 및 처리 */
  checkAndUnlockReward: (
    streak: number,
    yearMonth: string
  ) => Promise<UnlockedReward | null>;
  /** 특정 보상 타입의 해금된 파일 목록 반환 */
  getUnlockedFiles: (
    type: "expression" | "outfit" | "outfit_set"
  ) => string[];
}

export function useRewards(): UseRewardsReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rewards, setRewards] = useState<RewardData | null>(null);

  // 보상 데이터 조회
  const fetchRewards = useCallback(async (): Promise<RewardData | null> => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, "rewards", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // 보상 기록이 없으면 빈 데이터 반환
        const emptyData: RewardData = { unlockedRewards: [] };
        setRewards(emptyData);
        return emptyData;
      }

      const data = docSnap.data();
      const rawRewards = (data.unlockedRewards as Record<string, unknown>[]) ?? [];
      const result: RewardData = {
        unlockedRewards: rawRewards.map(toUnlockedReward),
      };

      setRewards(result);
      return result;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "보상 데이터 조회 실패";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 마일스톤 달성 시 보상 해금 확인 및 처리
  const checkAndUnlockReward = useCallback(
    async (
      streak: number,
      yearMonth: string
    ): Promise<UnlockedReward | null> => {
      if (!user) return null;

      // 해당 streak에 매칭되는 마일스톤 찾기
      const milestone: MilestoneConfig | undefined = MILESTONES.find(
        (m) => m.days === streak
      );
      if (!milestone) return null;

      setLoading(true);
      setError(null);

      try {
        const docRef = doc(db, "rewards", user.uid);
        const docSnap = await getDoc(docRef);

        let existingRewards: Record<string, unknown>[] = [];

        if (docSnap.exists()) {
          const data = docSnap.data();
          existingRewards =
            (data.unlockedRewards as Record<string, unknown>[]) ?? [];

          // 이미 해금된 보상인지 확인 (같은 마일스톤 + 같은 월)
          const alreadyUnlocked = existingRewards.some(
            (r) =>
              (r.milestone as number) === milestone.days &&
              (r.unlockedMonth as string) === yearMonth
          );

          if (alreadyUnlocked) {
            return null;
          }
        }

        // 새 보상 해금
        const newReward = {
          milestone: milestone.days,
          rewardType: milestone.rewardType,
          rewardFiles: milestone.rewardFiles,
          unlockedAt: serverTimestamp(),
          unlockedMonth: yearMonth,
        };

        const updatedRewards = [...existingRewards, newReward];

        await setDoc(
          docRef,
          {
            userId: user.uid,
            unlockedRewards: updatedRewards,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // 로컬 상태 업데이트를 위한 도메인 타입 변환
        const unlockedReward: UnlockedReward = {
          milestone: milestone.days,
          rewardType: milestone.rewardType,
          rewardFiles: milestone.rewardFiles,
          unlockedAt: new Date(),
          unlockedMonth: yearMonth,
        };

        // 로컬 상태 갱신
        setRewards((prev) => ({
          unlockedRewards: [
            ...(prev?.unlockedRewards ?? []),
            unlockedReward,
          ],
        }));

        return unlockedReward;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "보상 해금 처리 실패";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // 특정 보상 타입의 해금된 파일 목록 반환
  const getUnlockedFiles = useCallback(
    (type: "expression" | "outfit" | "outfit_set"): string[] => {
      if (!rewards) return [];

      return rewards.unlockedRewards
        .filter((r) => r.rewardType === type)
        .flatMap((r) => r.rewardFiles);
    },
    [rewards]
  );

  return {
    loading,
    error,
    rewards,
    fetchRewards,
    checkAndUnlockReward,
    getUnlockedFiles,
  };
}
