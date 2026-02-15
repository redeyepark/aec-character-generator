"use client";

/**
 * 생성/다시생성/다운로드 버튼 컴포넌트
 * 캐릭터 생성 흐름에 따라 적절한 버튼을 표시한다.
 */
import { useCallback, useRef } from "react";

interface GenerateButtonProps {
  /** 기분과 의상이 모두 선택되었는지 여부 */
  canGenerate: boolean;
  /** 이미지 합성 진행 중 여부 */
  isGenerating: boolean;
  /** 캐릭터가 생성된 적 있는지 여부 */
  hasGenerated: boolean;
  /** 생성 버튼 클릭 핸들러 */
  onGenerate: () => void;
  /** 다운로드 버튼 클릭 핸들러 */
  onDownload: () => void;
}

// 디바운스 간격 (ms)
const DEBOUNCE_MS = 500;

export default function GenerateButton({
  canGenerate,
  isGenerating,
  hasGenerated,
  onGenerate,
  onDownload,
}: GenerateButtonProps) {
  const lastClickRef = useRef<number>(0);

  // 디바운스 처리된 생성 핸들러
  const handleGenerate = useCallback(() => {
    const now = Date.now();
    if (now - lastClickRef.current < DEBOUNCE_MS) return;
    lastClickRef.current = now;
    onGenerate();
  }, [onGenerate]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      {/* 생성 / 다시 생성 버튼 */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canGenerate || isGenerating}
        aria-label={hasGenerated ? "캐릭터 다시 생성" : "캐릭터 생성"}
        className={`
          flex-1 px-6 py-3 rounded-lg font-medium text-white
          transition-all duration-150 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
          ${
            !canGenerate || isGenerating
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
          }
        `}
      >
        {isGenerating
          ? "생성 중..."
          : hasGenerated
            ? "다시 생성"
            : "생성"}
      </button>

      {/* 다운로드 버튼 (생성 후에만 표시) */}
      {hasGenerated && (
        <button
          type="button"
          onClick={onDownload}
          disabled={isGenerating}
          aria-label="캐릭터 이미지 다운로드"
          className={`
            flex-1 px-6 py-3 rounded-lg font-medium
            transition-all duration-150 cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
            ${
              isGenerating
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-600 active:bg-green-700"
            }
          `}
        >
          다운로드
        </button>
      )}
    </div>
  );
}
