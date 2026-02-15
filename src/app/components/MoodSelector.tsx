"use client";

/**
 * 기분 선택 컴포넌트
 * 7가지 기분 카테고리를 카드 형태로 표시하고 선택 상태를 관리한다.
 */
import type { MoodCategory } from "@/app/lib/types";
import { MOOD_CATEGORIES } from "@/app/lib/types";

interface MoodSelectorProps {
  selected: MoodCategory | null;
  onSelect: (mood: MoodCategory) => void;
}

// 기분별 이모티콘 매핑 (시각적 구분용)
const MOOD_ICONS: Record<MoodCategory, string> = {
  happy: "\u{1F60A}",
  confident: "\u{1F60E}",
  calm: "\u{1F60C}",
  surprised: "\u{1F632}",
  thoughtful: "\u{1F914}",
  playful: "\u{1F61C}",
  determined: "\u{1F4AA}",
};

export default function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  return (
    <section aria-label="기분 선택">
      <h2 className="text-lg font-semibold mb-3 text-gray-800">
        기분 선택
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {MOOD_CATEGORIES.map((mood) => {
          const isSelected = selected === mood.id;
          return (
            <button
              key={mood.id}
              type="button"
              onClick={() => onSelect(mood.id)}
              aria-label={`${mood.nameKo} (${mood.nameEn})`}
              aria-pressed={isSelected}
              className={`
                flex flex-col items-center justify-center p-3 rounded-lg
                border-2 transition-all duration-150 cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }
              `}
            >
              <span className="text-2xl mb-1" aria-hidden="true">
                {MOOD_ICONS[mood.id]}
              </span>
              <span
                className={`text-sm font-medium ${
                  isSelected ? "text-blue-700" : "text-gray-700"
                }`}
              >
                {mood.nameKo}
              </span>
              <span
                className={`text-xs ${
                  isSelected ? "text-blue-500" : "text-gray-400"
                }`}
              >
                {mood.nameEn}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
