"use client";

/**
 * 위자드 스텝 컴포넌트
 * 진행 표시줄, 스텝 제목, 이전/다음/건너뛰기 버튼을 제공한다.
 */
import type { ReactNode } from "react";

interface WizardStepProps {
  /** 현재 스텝 번호 (1-4) */
  currentStep: number;
  /** 전체 스텝 수 */
  totalSteps: number;
  /** 스텝 제목 */
  title: string;
  /** 스텝 설명 */
  description: string;
  /** 다음 버튼 비활성화 여부 */
  nextDisabled?: boolean;
  /** 건너뛰기 가능 여부 (선택 사항 스텝) */
  canSkip?: boolean;
  /** 마지막 스텝 여부 (저장 버튼 표시) */
  isLastStep?: boolean;
  /** 저장 중 여부 */
  isSaving?: boolean;
  /** 이전 버튼 클릭 핸들러 */
  onPrev?: () => void;
  /** 다음 버튼 클릭 핸들러 */
  onNext: () => void;
  /** 건너뛰기 버튼 클릭 핸들러 */
  onSkip?: () => void;
  /** 스텝 콘텐츠 */
  children: ReactNode;
}

// 스텝 라벨
const STEP_LABELS = ["얼굴", "헤어", "수염", "안경", "사주"];

export default function WizardStep({
  currentStep,
  totalSteps,
  title,
  description,
  nextDisabled = false,
  canSkip = false,
  isLastStep = false,
  isSaving = false,
  onPrev,
  onNext,
  onSkip,
  children,
}: WizardStepProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* 진행 표시줄 */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={stepNum} className="flex items-center flex-1">
              {/* 스텝 원 */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  flex-shrink-0 transition-colors ${
                    isCompleted
                      ? "bg-blue-500 text-white"
                      : isCurrent
                        ? "bg-blue-500 text-white ring-2 ring-blue-300 ring-offset-2"
                        : "bg-gray-200 text-gray-500"
                  }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>

              {/* 스텝 라벨 (데스크톱에서만) */}
              <span className={`hidden sm:inline ml-2 text-xs font-medium flex-shrink-0 ${
                isCurrent ? "text-blue-700" : isCompleted ? "text-blue-500" : "text-gray-400"
              }`}>
                {STEP_LABELS[i]}
              </span>

              {/* 연결선 (마지막 제외) */}
              {stepNum < totalSteps && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  isCompleted ? "bg-blue-500" : "bg-gray-200"
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* 스텝 헤더 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>

      {/* 스텝 콘텐츠 */}
      <div>{children}</div>

      {/* 네비게이션 버튼 */}
      <div className="flex items-center justify-between pt-2">
        {/* 이전 버튼 */}
        <div>
          {onPrev && (
            <button
              type="button"
              onClick={onPrev}
              className="px-4 py-2 rounded-lg text-sm font-medium
                         text-gray-600 bg-gray-100 hover:bg-gray-200
                         transition-colors cursor-pointer
                         focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              이전
            </button>
          )}
        </div>

        {/* 다음/건너뛰기/저장 버튼 */}
        <div className="flex items-center gap-2">
          {canSkip && onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="px-4 py-2 rounded-lg text-sm font-medium
                         text-gray-500 hover:text-gray-700 hover:bg-gray-100
                         transition-colors cursor-pointer
                         focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              건너뛰기
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled || isSaving}
            className={`px-6 py-2 rounded-lg text-sm font-medium text-white
                       transition-all duration-150 cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                       ${
                         nextDisabled || isSaving
                           ? "bg-gray-300 cursor-not-allowed"
                           : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
                       }`}
          >
            {isSaving ? "저장 중..." : isLastStep ? "저장" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
