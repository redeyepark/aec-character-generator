"use client";

/**
 * 의상 카테고리 선택 컴포넌트
 * 6가지 의상 카테고리를 카드 형태로 표시하고 선택 상태를 관리한다.
 */
import type { OutfitCategory } from "@/app/lib/types";
import { OUTFIT_CATEGORIES } from "@/app/lib/types";

interface OutfitSelectorProps {
  selected: OutfitCategory | null;
  onSelect: (outfit: OutfitCategory) => void;
}

// 의상별 이모티콘 매핑 (시각적 구분용)
const OUTFIT_ICONS: Record<OutfitCategory, string> = {
  casual: "\u{1F455}",
  formal: "\u{1F454}",
  sporty: "\u{1F3BD}",
  outerwear: "\u{1F9E5}",
  bowtie: "\u{1F3A9}",
  all: "\u{1F5C2}",
};

export default function OutfitSelector({ selected, onSelect }: OutfitSelectorProps) {
  return (
    <section aria-label="의상 선택">
      <h2 className="text-lg font-semibold mb-3 text-gray-800">
        의상 선택
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {OUTFIT_CATEGORIES.map((outfit) => {
          const isSelected = selected === outfit.id;
          return (
            <button
              key={outfit.id}
              type="button"
              onClick={() => onSelect(outfit.id)}
              aria-label={`${outfit.nameKo} (${outfit.nameEn})`}
              aria-pressed={isSelected}
              className={`
                flex flex-col items-center justify-center p-3 rounded-lg
                border-2 transition-all duration-150 cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1
                ${
                  isSelected
                    ? "border-green-500 bg-green-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }
              `}
            >
              <span className="text-2xl mb-1" aria-hidden="true">
                {OUTFIT_ICONS[outfit.id]}
              </span>
              <span
                className={`text-sm font-medium ${
                  isSelected ? "text-green-700" : "text-gray-700"
                }`}
              >
                {outfit.nameKo}
              </span>
              <span
                className={`text-xs ${
                  isSelected ? "text-green-500" : "text-gray-400"
                }`}
              >
                {outfit.nameEn}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
