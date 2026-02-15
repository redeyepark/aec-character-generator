"use client";

/**
 * 기분 + 표정 선택 컴포넌트
 * 1단계: 기분 카테고리 선택 (7개 버튼)
 * 2단계: 선택된 기분의 표정 에셋 그리드에서 구체적인 표정 선택
 */
import { useMemo } from "react";
import type { MoodCategory } from "@/app/lib/types";
import { MOOD_CATEGORIES } from "@/app/lib/types";
import { getExpressionAssets } from "@/app/lib/assetManager";
import AssetPicker from "./AssetPicker";

interface MoodExpressionPickerProps {
  /** 선택된 기분 카테고리 */
  selectedMood: MoodCategory | null;
  /** 선택된 표정 파일명 */
  selectedExpression: string | null;
  /** 기분 선택 핸들러 */
  onMoodSelect: (mood: MoodCategory) => void;
  /** 표정 선택 핸들러 */
  onExpressionSelect: (filename: string | null) => void;
}

// 기분별 이모티콘 매핑
const MOOD_ICONS: Record<MoodCategory, string> = {
  happy: "\u{1F60A}",
  confident: "\u{1F60E}",
  calm: "\u{1F60C}",
  surprised: "\u{1F632}",
  thoughtful: "\u{1F914}",
  playful: "\u{1F61C}",
  determined: "\u{1F4AA}",
};

export default function MoodExpressionPicker({
  selectedMood,
  selectedExpression,
  onMoodSelect,
  onExpressionSelect,
}: MoodExpressionPickerProps) {
  // 선택된 기분의 표정 에셋 목록
  const expressionAssets = useMemo(() => {
    if (!selectedMood) return [];
    return getExpressionAssets(selectedMood);
  }, [selectedMood]);

  return (
    <div className="flex flex-col gap-4">
      {/* 1단계: 기분 카테고리 선택 */}
      <section aria-label="기분 선택">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          오늘의 기분
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {MOOD_CATEGORIES.map((mood) => {
            const isSelected = selectedMood === mood.id;
            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => {
                  onMoodSelect(mood.id);
                  onExpressionSelect(null); // 기분 변경 시 표정 초기화
                }}
                aria-label={`${mood.nameKo} (${mood.nameEn})`}
                aria-pressed={isSelected}
                className={`flex flex-col items-center justify-center p-2 rounded-lg
                           border-2 transition-all duration-150 cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                           ${
                             isSelected
                               ? "border-blue-500 bg-blue-50 shadow-md"
                               : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                           }`}
              >
                <span className="text-xl" aria-hidden="true">
                  {MOOD_ICONS[mood.id]}
                </span>
                <span className={`text-xs font-medium mt-1 ${
                  isSelected ? "text-blue-700" : "text-gray-600"
                }`}>
                  {mood.nameKo}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2단계: 표정 에셋 선택 */}
      {selectedMood && (
        <section aria-label="표정 선택">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            표정 선택
          </h3>
          <AssetPicker
            assets={expressionAssets}
            layerType="expression"
            selected={selectedExpression}
            onSelect={onExpressionSelect}
          />
        </section>
      )}
    </div>
  );
}
