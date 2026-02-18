"use client";

/**
 * 의상 색상 선택기 컴포넌트 (SPEC-OUTFIT-001)
 * 메인 색상과 서브 색상을 각각 선택하는 2개 섹션.
 * 16색 프리셋 팔레트를 그리드 배치로 표시한다.
 */
import { OUTFIT_COLOR_PRESETS } from "@/app/lib/types";

interface OutfitColorPickerProps {
  /** 현재 선택된 메인 색상 hex */
  mainColor: string;
  /** 현재 선택된 서브 색상 hex */
  subColor: string;
  /** 메인 색상 변경 핸들러 */
  onMainColorChange: (hex: string) => void;
  /** 서브 색상 변경 핸들러 */
  onSubColorChange: (hex: string) => void;
}

/**
 * 단일 색상 선택 그리드
 */
function ColorGrid({
  label,
  selectedColor,
  onColorChange,
}: {
  label: string;
  selectedColor: string;
  onColorChange: (hex: string) => void;
}) {
  return (
    <div>
      <span className="text-xs font-medium text-gray-600 mb-1 block">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-8 gap-1.5"
      >
        {OUTFIT_COLOR_PRESETS.map((color) => {
          const isSelected = selectedColor.toUpperCase() === color.hex.toUpperCase();
          return (
            <button
              key={color.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={color.nameKo}
              onClick={() => onColorChange(color.hex)}
              className={`w-7 h-7 rounded-full border-2 transition-all duration-150 cursor-pointer
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                         ${
                           isSelected
                             ? "border-blue-500 scale-110 shadow-md"
                             : "border-gray-200 hover:border-gray-400 hover:scale-105"
                         }
                         ${color.hex === "#FFFFFF" ? "ring-1 ring-gray-200" : ""}`}
              style={{ backgroundColor: color.hex }}
            >
              {isSelected && (
                <span
                  className={`flex items-center justify-center text-xs font-bold ${
                    ["#FFFFFF", "#F1C40F", "#BDC3C7", "#FF6B6B"].includes(color.hex)
                      ? "text-gray-700"
                      : "text-white"
                  }`}
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function OutfitColorPicker({
  mainColor,
  subColor,
  onMainColorChange,
  onSubColorChange,
}: OutfitColorPickerProps) {
  return (
    <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="text-sm font-semibold text-gray-700">의상 색상</h4>
      <ColorGrid
        label="메인 색상"
        selectedColor={mainColor}
        onColorChange={onMainColorChange}
      />
      <ColorGrid
        label="서브 색상"
        selectedColor={subColor}
        onColorChange={onSubColorChange}
      />
    </div>
  );
}
