"use client";

/**
 * 온보딩 슬라이드 컴포넌트
 * 신규 사용자에게 앱의 주요 기능을 소개하는 3단계 슬라이드.
 * 건너뛰기, 이전/다음, 키보드 네비게이션을 지원한다.
 */
import { useState, useCallback, useEffect } from "react";

interface OnboardingSlidesProps {
  /** 온보딩 완료 시 호출되는 콜백 */
  onComplete: () => void;
}

// 슬라이드 데이터
const SLIDES = [
  {
    title: "나만의 캐릭터 만들기",
    description: "498개 에셋으로 세상에 하나뿐인 캐릭터를 만들어보세요",
    icon: "character" as const,
  },
  {
    title: "매일 기분 기록하기",
    description: "오늘의 기분을 선택하면 캐릭터가 표정과 의상을 바꿔요",
    icon: "calendar" as const,
  },
  {
    title: "감정 패턴 발견하기",
    description: "색상 달력에서 나의 감정 변화를 한눈에 확인하세요",
    icon: "chart" as const,
  },
] as const;

/** 캐릭터 아이콘 SVG */
function CharacterIcon() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      className="mx-auto"
    >
      {/* 몸체 */}
      <rect x="24" y="44" width="32" height="28" rx="8" fill="#93C5FD" />
      {/* 얼굴 */}
      <circle cx="40" cy="28" r="18" fill="#FDE68A" />
      {/* 눈 */}
      <circle cx="34" cy="26" r="2.5" fill="#1E293B" />
      <circle cx="46" cy="26" r="2.5" fill="#1E293B" />
      {/* 입 */}
      <path
        d="M34 34 Q40 40 46 34"
        stroke="#1E293B"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* 머리카락 */}
      <path
        d="M22 24 Q22 10 40 10 Q58 10 58 24"
        stroke="#92400E"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** 달력 아이콘 SVG */
function CalendarIcon() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      className="mx-auto"
    >
      {/* 달력 배경 */}
      <rect x="12" y="16" width="56" height="52" rx="6" fill="#E0E7FF" stroke="#818CF8" strokeWidth="2" />
      {/* 달력 상단 바 */}
      <rect x="12" y="16" width="56" height="14" rx="6" fill="#818CF8" />
      {/* 고리 */}
      <rect x="26" y="10" width="4" height="12" rx="2" fill="#4F46E5" />
      <rect x="50" y="10" width="4" height="12" rx="2" fill="#4F46E5" />
      {/* 날짜 점들 (기분 색상) */}
      <circle cx="28" cy="42" r="4" fill="#FDE68A" />
      <circle cx="40" cy="42" r="4" fill="#FBCFE8" />
      <circle cx="52" cy="42" r="4" fill="#BBF7D0" />
      <circle cx="28" cy="56" r="4" fill="#C4B5FD" />
      <circle cx="40" cy="56" r="4" fill="#FED7AA" />
      <circle cx="52" cy="56" r="4" fill="#BAE6FD" />
    </svg>
  );
}

/** 차트 아이콘 SVG */
function ChartIcon() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      className="mx-auto"
    >
      {/* 축 */}
      <path d="M16 64 L16 16" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 64 L68 64" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      {/* 막대 그래프 (기분 색상) */}
      <rect x="22" y="44" width="8" height="20" rx="2" fill="#FDE68A" />
      <rect x="34" y="32" width="8" height="32" rx="2" fill="#FBCFE8" />
      <rect x="46" y="24" width="8" height="40" rx="2" fill="#BBF7D0" />
      <rect x="58" y="36" width="8" height="28" rx="2" fill="#C4B5FD" />
      {/* 추세선 */}
      <path
        d="M26 42 L38 30 L50 22 L62 34"
        stroke="#3B82F6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** 아이콘 타입에 따라 해당 SVG 컴포넌트를 반환 */
function SlideIcon({ type }: { type: "character" | "calendar" | "chart" }) {
  switch (type) {
    case "character":
      return <CharacterIcon />;
    case "calendar":
      return <CalendarIcon />;
    case "chart":
      return <ChartIcon />;
  }
}

export default function OnboardingSlides({ onComplete }: OnboardingSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const isLastSlide = currentSlide === SLIDES.length - 1;

  // 다음 슬라이드 또는 완료
  const handleNext = useCallback(() => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  }, [isLastSlide, onComplete]);

  // 이전 슬라이드
  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  }, []);

  // 키보드 네비게이션
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onComplete();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, onComplete]);

  const slide = SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto overflow-hidden">
        {/* 건너뛰기 버튼 */}
        <div className="flex justify-end p-3 pb-0">
          <button
            type="button"
            onClick={onComplete}
            className="text-sm text-gray-400 hover:text-gray-600
                       transition-colors cursor-pointer px-2 py-1 rounded
                       focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            건너뛰기
          </button>
        </div>

        {/* 슬라이드 콘텐츠 */}
        <div className="px-8 pt-4 pb-6 text-center">
          {/* 아이콘 */}
          <div className="mb-6">
            <SlideIcon type={slide.icon} />
          </div>

          {/* 제목 */}
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            {slide.title}
          </h2>

          {/* 설명 */}
          <p className="text-sm text-gray-500 leading-relaxed">
            {slide.description}
          </p>
        </div>

        {/* 하단: 인디케이터 + 네비게이션 */}
        <div className="px-8 pb-6">
          {/* 인디케이터 점 */}
          <div className="flex justify-center gap-2 mb-6">
            {SLIDES.map((_, index) => (
              <span
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-blue-500 w-6"
                    : "bg-gray-300"
                }`}
                aria-hidden="true"
              />
            ))}
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex gap-3">
            {currentSlide > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex-1 py-3 rounded-xl font-medium text-gray-600
                           border border-gray-300 bg-white hover:bg-gray-50
                           transition-all duration-150 cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
              >
                이전
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl font-bold text-white
                         bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                         transition-all duration-150 cursor-pointer
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
            >
              {isLastSlide ? "시작하기" : "다음"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
