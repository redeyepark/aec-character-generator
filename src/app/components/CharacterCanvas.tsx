"use client";

/**
 * 캐릭터 캔버스 컴포넌트
 * 합성된 캐릭터 이미지를 표시하거나, 생성 전 플레이스홀더를 보여준다.
 */
import { useEffect, useRef } from "react";

interface CharacterCanvasProps {
  /** 합성 완료된 Canvas (null이면 플레이스홀더 표시) */
  composited: HTMLCanvasElement | null;
  /** 이미지 합성 진행 중 여부 */
  isLoading: boolean;
}

export default function CharacterCanvas({
  composited,
  isLoading,
}: CharacterCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 합성된 캔버스가 변경되면 컨테이너에 삽입
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 기존 캔버스 제거
    const existingCanvas = container.querySelector("canvas");
    if (existingCanvas) {
      container.removeChild(existingCanvas);
    }

    // 새 캔버스 삽입
    if (composited) {
      composited.style.width = "100%";
      composited.style.height = "100%";
      composited.style.objectFit = "contain";
      composited.setAttribute("role", "img");
      composited.setAttribute("aria-label", "생성된 AEC 캐릭터");
      container.appendChild(composited);
    }
  }, [composited]);

  return (
    <div
      ref={containerRef}
      className="
        relative w-full aspect-square max-w-md mx-auto
        bg-white rounded-xl border-2 border-gray-200
        flex items-center justify-center overflow-hidden
      "
      aria-live="polite"
    >
      {/* 로딩 중 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <LoadingSpinner />
        </div>
      )}

      {/* 합성 결과가 없을 때 플레이스홀더 */}
      {!composited && !isLoading && (
        <div className="flex flex-col items-center text-gray-400">
          <svg
            className="w-16 h-16 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
          <p className="text-sm">기분과 의상을 선택한 후</p>
          <p className="text-sm">생성 버튼을 눌러주세요</p>
        </div>
      )}
    </div>
  );
}

/**
 * 로딩 스피너 컴포넌트
 */
function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-3" role="status">
      <div
        className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"
        aria-hidden="true"
      />
      <span className="text-sm text-gray-500">캐릭터 생성 중...</span>
    </div>
  );
}
