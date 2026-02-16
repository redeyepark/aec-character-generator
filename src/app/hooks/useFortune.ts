"use client";

/**
 * 일일 운세 계산 훅
 * 사주 정보를 기반으로 오늘의 운세를 계산하고 행운 의상을 필터링한다.
 */
import { useMemo, useCallback } from "react";
import type { BirthInfo, DailyFortune } from "@/app/lib/fortune/types";
import type { OutfitCategory } from "@/app/lib/types";
import { calculateDailyFortune, filterLuckyOutfits } from "@/app/lib/fortune";
import { getBodyAssets } from "@/app/lib/assetManager";

interface UseFortuneReturn {
  /** 오늘의 운세 결과 (사주 정보 없으면 null) */
  fortune: DailyFortune | null;
  /** 행운 색상에 매칭되는 의상 파일명 목록 */
  luckyOutfitFiles: string[];
  /** 카테고리별 행운 의상 랜덤 선택 */
  pickLuckyOutfit: (category: Exclude<OutfitCategory, "all">) => string | null;
}

export function useFortune(birthInfo: BirthInfo | null): UseFortuneReturn {
  // 운세 계산 (birthInfo가 변경될 때만 재계산)
  const fortune = useMemo<DailyFortune | null>(() => {
    if (!birthInfo) return null;
    return calculateDailyFortune(birthInfo);
  }, [birthInfo]);

  // 전체 의상 중 행운 색상에 매칭되는 의상 목록
  const luckyOutfitFiles = useMemo<string[]>(() => {
    if (!fortune) return [];
    const allOutfits = getBodyAssets("all");
    return filterLuckyOutfits(allOutfits, fortune.luckyColors);
  }, [fortune]);

  // 카테고리별 행운 의상 랜덤 선택
  const pickLuckyOutfit = useCallback(
    (category: Exclude<OutfitCategory, "all">): string | null => {
      if (!fortune) return null;

      // 해당 카테고리의 의상에서 행운 색상 필터링
      const categoryOutfits = getBodyAssets(category);
      const luckyInCategory = filterLuckyOutfits(
        categoryOutfits,
        fortune.luckyColors
      );

      if (luckyInCategory.length > 0) {
        return luckyInCategory[Math.floor(Math.random() * luckyInCategory.length)];
      }

      // 카테고리에 없으면 전체에서 시도
      const allOutfits = getBodyAssets("all");
      const luckyInAll = filterLuckyOutfits(allOutfits, fortune.luckyColors);

      if (luckyInAll.length > 0) {
        return luckyInAll[Math.floor(Math.random() * luckyInAll.length)];
      }

      return null;
    },
    [fortune]
  );

  return {
    fortune,
    luckyOutfitFiles,
    pickLuckyOutfit,
  };
}
