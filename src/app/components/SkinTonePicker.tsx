"use client";

/**
 * 피부톤 선택 컴포넌트
 * 8가지 피부톤 색상을 원형 버튼으로 표시하고 선택할 수 있다.
 * WCAG 2.1 AA 접근성 기준을 준수한다 (radiogroup/radio 역할, aria 속성).
 */
import type { SkinTone } from "@/app/lib/types";
import { SKIN_TONE_COLORS } from "@/app/lib/types";

interface SkinTonePickerProps {
  /** 현재 선택된 피부톤 */
  selected: SkinTone;
  /** 피부톤 선택 핸들러 */
  onSelect: (tone: SkinTone) => void;
}

/** 밝은 톤 목록 (흰 배경에서 구분이 어려우므로 테두리 추가) */
const LIGHT_TONES: ReadonlySet<SkinTone> = new Set(["fair", "light"]);

export default function SkinTonePicker({
  selected,
  onSelect,
}: SkinTonePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* 라벨 */}
      <h3 className="text-sm font-semibold text-gray-700">
        피부색
      </h3>

      {/* 피부톤 버튼 그룹 */}
      <div
        role="radiogroup"
        aria-label="피부색 선택"
        className="flex flex-nowrap gap-2"
      >
        {SKIN_TONE_COLORS.map((tone) => {
          const isSelected = selected === tone.id;
          const isLight = LIGHT_TONES.has(tone.id);

          return (
            <button
              key={tone.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={tone.nameKo}
              onClick={() => onSelect(tone.id)}
              style={{ backgroundColor: tone.hex }}
              className={`w-9 h-9 rounded-full shrink-0 transition-all duration-150 cursor-pointer
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                         ${
                           isSelected
                             ? "ring-2 ring-blue-500 ring-offset-2 scale-110"
                             : ""
                         }
                         ${
                           isLight && !isSelected
                             ? "border border-gray-200"
                             : ""
                         }`}
            />
          );
        })}
      </div>
    </div>
  );
}
