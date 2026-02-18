"use client";

/**
 * 출석 알림 토스트 컴포넌트
 * 기분 저장 후 출석 결과를 하단 중앙에 토스트 형태로 표시한다.
 * 4초 후 자동 사라짐. 슬라이드-업 애니메이션 적용.
 */
import { useEffect, useCallback } from "react";
import type { UnlockedReward } from "@/app/lib/types";
import { MILESTONES } from "@/app/lib/types";

interface AttendanceToastProps {
  /** 토스트 표시 여부 */
  show: boolean;
  /** 현재 연속 출석일 */
  streak: number;
  /** 오늘 새로 출석했는지 여부 */
  isNewAttendance: boolean;
  /** 해금된 보상 (없으면 null) */
  unlockedReward: UnlockedReward | null;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 일일 보상으로 획득한 아이템 (없으면 null/undefined) */
  dailyRewardItem?: { itemType: "body_item" | "hand_item"; itemFile: string } | null;
  /** 주기 진행 현황 (없으면 null/undefined) */
  cycleProgress?: { current: number; total: number } | null;
  /** 주기 완주 여부 */
  isCycleComplete?: boolean;
  /** 완주 보너스 아이템 목록 (없으면 null/undefined) */
  bonusItems?: { itemType: "body_item" | "hand_item"; itemFile: string }[] | null;
}

export default function AttendanceToast({
  show,
  streak,
  isNewAttendance,
  unlockedReward,
  onClose,
  dailyRewardItem,
  cycleProgress,
  isCycleComplete = false,
  bonusItems,
}: AttendanceToastProps) {
  // 4초 후 자동 닫기
  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [show, onClose]);

  // 닫기 버튼 클릭
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!show) return null;

  // 마일스톤 라벨 찾기 (보상이 있을 때)
  const milestoneLabel = unlockedReward
    ? MILESTONES.find((m) => m.days === unlockedReward.milestone)?.label ?? ""
    : "";

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50
                  max-w-sm w-[calc(100%-2rem)] p-4 rounded-xl shadow-lg
                  border transition-all duration-300 ease-out
                  ${show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
                  ${
                    unlockedReward
                      ? "bg-[#3D8A5A] border-[#2d6b44] text-white"
                      : isNewAttendance
                        ? "bg-white border-[#3D8A5A] text-gray-800"
                        : "bg-white border-gray-200 text-gray-600"
                  }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {/* 보상 해금 메시지 */}
          {unlockedReward && (
            <>
              <p className="text-sm font-bold">
                {milestoneLabel} 마일스톤 달성!
              </p>
              <p className="text-xs mt-1 opacity-90">
                새로운 보상이 해금되었습니다
              </p>
            </>
          )}

          {/* 새 출석 메시지 (보상 없음) */}
          {isNewAttendance && !unlockedReward && (
            <>
              <p className="text-sm font-bold text-[#3D8A5A]">
                {streak}일 연속 출석!
              </p>
              <p className="text-xs text-gray-500 mt-1">
                오늘의 기분이 저장되었습니다
              </p>
            </>
          )}

          {/* 중복 출석 메시지 */}
          {!isNewAttendance && (
            <p className="text-sm">
              오늘의 기분이 수정되었습니다
            </p>
          )}

          {/* 일일 보상 아이템 획득 정보 */}
          {dailyRewardItem && (
            <p className={`text-xs mt-1.5 ${
              unlockedReward ? "opacity-90" : "text-blue-600"
            }`}>
              일일 보상: {dailyRewardItem.itemType === "body_item" ? "착용 소품" : "손 아이템"} 획득!
            </p>
          )}

          {/* 주기 진행 현황 */}
          {cycleProgress && (
            <p className={`text-xs mt-0.5 ${
              unlockedReward ? "opacity-80" : "text-gray-500"
            }`}>
              {cycleProgress.current}/{cycleProgress.total}일 완료
            </p>
          )}

          {/* 주기 완주 축하 메시지 + 보너스 아이템 */}
          {isCycleComplete && (
            <div className={`mt-1.5 pt-1.5 border-t ${
              unlockedReward ? "border-white/30" : "border-gray-200"
            }`}>
              <p className={`text-xs font-bold ${
                unlockedReward ? "text-white" : "text-blue-600"
              }`}>
                주기 완주 달성!
              </p>
              {bonusItems && bonusItems.length > 0 && (
                <p className={`text-xs mt-0.5 ${
                  unlockedReward ? "opacity-80" : "text-gray-500"
                }`}>
                  보너스 아이템 {bonusItems.length}개 획득
                </p>
              )}
            </div>
          )}
        </div>

        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="알림 닫기"
          className={`p-1 rounded-full transition-colors cursor-pointer
                      focus:outline-none focus:ring-2 focus:ring-offset-1
                      ${
                        unlockedReward
                          ? "hover:bg-white/20 focus:ring-white"
                          : "hover:bg-gray-100 focus:ring-gray-400"
                      }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
