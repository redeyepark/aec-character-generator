"use client";

/**
 * 의상 선택 컴포넌트
 * 1단계: 의상 카테고리 선택 (6개 버튼)
 * 2단계: 선택된 카테고리의 의상 에셋 그리드에서 구체적인 의상 선택
 */
import { useMemo } from "react";
import type { OutfitCategory } from "@/app/lib/types";
import { OUTFIT_CATEGORIES } from "@/app/lib/types";
import { getBodyAssets } from "@/app/lib/assetManager";
import { useRewards } from "@/app/hooks/useRewards";
import AssetPicker from "./AssetPicker";

interface OutfitPickerProps {
  /** 선택된 의상 카테고리 */
  selectedCategory: OutfitCategory | null;
  /** 선택된 의상 파일명 */
  selectedOutfit: string | null;
  /** 카테고리 선택 핸들러 */
  onCategorySelect: (category: OutfitCategory) => void;
  /** 의상 선택 핸들러 */
  onOutfitSelect: (filename: string | null) => void;
}

// 의상별 이모티콘 매핑
const OUTFIT_ICONS: Record<OutfitCategory, string> = {
  casual: "\u{1F455}",
  formal: "\u{1F454}",
  sporty: "\u{1F3BD}",
  outerwear: "\u{1F9E5}",
  bowtie: "\u{1F3A9}",
  all: "\u{1F5C2}",
};

export default function OutfitPicker({
  selectedCategory,
  selectedOutfit,
  onCategorySelect,
  onOutfitSelect,
}: OutfitPickerProps) {
  // 보상으로 해금된 의상 파일 목록 조회
  const { getUnlockedFiles } = useRewards();
  const unlockedOutfits = useMemo(() => {
    return getUnlockedFiles("outfit");
  }, [getUnlockedFiles]);
  const unlockedOutfitSets = useMemo(() => {
    return getUnlockedFiles("outfit_set");
  }, [getUnlockedFiles]);

  // 선택된 카테고리의 의상 에셋 목록 + 해금된 보상 의상 병합
  const outfitAssets = useMemo(() => {
    if (!selectedCategory) return [];
    const baseAssets = getBodyAssets(selectedCategory);
    // 해금된 의상을 앞에 추가 (중복 제거)
    const allUnlocked = [...unlockedOutfits, ...unlockedOutfitSets];
    if (allUnlocked.length === 0) return baseAssets;
    const uniqueUnlocked = allUnlocked.filter((f) => !baseAssets.includes(f));
    return [...uniqueUnlocked, ...baseAssets];
  }, [selectedCategory, unlockedOutfits, unlockedOutfitSets]);

  return (
    <div className="flex flex-col gap-4">
      {/* 1단계: 의상 카테고리 선택 */}
      <section aria-label="의상 카테고리 선택">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          의상 카테고리
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {OUTFIT_CATEGORIES.map((outfit) => {
            const isSelected = selectedCategory === outfit.id;
            return (
              <button
                key={outfit.id}
                type="button"
                onClick={() => {
                  onCategorySelect(outfit.id);
                  onOutfitSelect(null); // 카테고리 변경 시 의상 초기화
                }}
                aria-label={`${outfit.nameKo} (${outfit.nameEn})`}
                aria-pressed={isSelected}
                className={`flex flex-col items-center justify-center p-2 rounded-lg
                           border-2 transition-all duration-150 cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1
                           ${
                             isSelected
                               ? "border-green-500 bg-green-50 shadow-md"
                               : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                           }`}
              >
                <span className="text-xl" aria-hidden="true">
                  {OUTFIT_ICONS[outfit.id]}
                </span>
                <span className={`text-xs font-medium mt-1 ${
                  isSelected ? "text-green-700" : "text-gray-600"
                }`}>
                  {outfit.nameKo}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2단계: 의상 에셋 선택 */}
      {selectedCategory && (
        <section aria-label="의상 선택">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            의상 선택
          </h3>
          <AssetPicker
            assets={outfitAssets}
            layerType="body"
            selected={selectedOutfit}
            onSelect={onOutfitSelect}
          />
        </section>
      )}
    </div>
  );
}
