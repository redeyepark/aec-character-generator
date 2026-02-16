"use client";

/**
 * 행운 의상 선택 버튼 컴포넌트
 * 운세의 행운 색상에 맞는 의상을 랜덤으로 선택하는 버튼이다.
 */
import type { DailyFortune } from "@/app/lib/fortune/types";
import { ELEMENT_INFO } from "@/app/lib/fortune/types";

// 오행별 도트 색상 (Tailwind 클래스)
const ELEMENT_DOT_COLORS: Record<string, string> = {
  wood: "bg-green-500",
  fire: "bg-red-500",
  earth: "bg-yellow-500",
  metal: "bg-gray-300",
  water: "bg-blue-500",
};

interface LuckyOutfitButtonProps {
  fortune: DailyFortune;
  onSelectLuckyOutfit: () => void;
  disabled?: boolean;
}

export default function LuckyOutfitButton({
  fortune,
  onSelectLuckyOutfit,
  disabled = false,
}: LuckyOutfitButtonProps) {
  const luckyElementInfo = ELEMENT_INFO[fortune.luckyElement];
  const dotColor = ELEMENT_DOT_COLORS[fortune.luckyElement] ?? "bg-gray-400";

  return (
    <button
      type="button"
      onClick={onSelectLuckyOutfit}
      disabled={disabled}
      title={
        disabled
          ? "현재 카테고리에 행운 색상에 맞는 의상이 없습니다"
          : `${luckyElementInfo.colors.join(", ")} 계열 의상을 랜덤으로 선택합니다`
      }
      aria-label="행운의 컬러로 입기"
      className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg
                 border transition-all duration-150 cursor-pointer
                 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1
                 ${
                   disabled
                     ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                     : "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 active:bg-amber-200"
                 }`}
    >
      {/* 행운 색상 도트 */}
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotColor}`} />
      </span>
      <span>행운의 컬러로 입기</span>
      <span className="text-xs text-amber-500" aria-hidden="true">
        ({luckyElementInfo.colors.join(", ")})
      </span>
    </button>
  );
}
