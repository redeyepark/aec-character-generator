"use client";

/**
 * 일일 아이템 보상 주기 진행 현황 카드 컴포넌트
 * 14일 주기 내 수령 현황을 원형 아이콘 그리드, 프로그레스 바,
 * 완주 보너스 미리보기로 시각화한다.
 */
import type { EventRewardData } from "@/app/lib/types";
import { CYCLE_COMPLETION_BONUS } from "@/app/lib/types";

interface DailyRewardCardProps {
  /** 이벤트 보상 데이터 (null이면 아직 시작 전) */
  eventReward: EventRewardData | null;
  /** 로딩 상태 */
  loading?: boolean;
}

export default function DailyRewardCard({
  eventReward,
  loading = false,
}: DailyRewardCardProps) {
  // 로딩 상태: 스켈레톤 UI
  if (loading) {
    return (
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200
                   dark:border-gray-700 shadow-sm p-4"
        aria-busy="true"
        aria-label="일일 보상 현황 로딩 중"
      >
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3 animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-4 animate-pulse" />
        {/* 원형 아이콘 그리드 스켈레톤 (2행 7열) */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mx-auto"
            />
          ))}
        </div>
        {/* 프로그레스 바 스켈레톤 */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3 animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
      </div>
    );
  }

  // 데이터 없음: 첫 출석 안내 메시지
  if (!eventReward) {
    return (
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200
                   dark:border-gray-700 shadow-sm p-4"
        aria-label="일일 보상 현황"
      >
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
          일일 보상
        </h3>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          첫 출석을 기록하면 일일 보상이 시작됩니다
        </p>
      </div>
    );
  }

  const { cycleNumber, cycleLength, dailyClaims, cycleCompleted } = eventReward;

  // 수령 완료된 일차 번호 Set (빠른 조회용)
  const claimedDays = new Set(dailyClaims.map((c) => c.dayNumber));
  const currentCount = dailyClaims.length;
  const percentage = Math.round((currentCount / cycleLength) * 100);
  const remaining = cycleLength - currentCount;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200
                 dark:border-gray-700 shadow-sm p-4"
      aria-label={`일일 보상 현황 - 주기 ${cycleNumber}`}
    >
      {/* 헤더: 주기 번호 + 진행도 텍스트 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          주기 {cycleNumber}
        </h3>
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
          {currentCount}/{cycleLength}일
        </span>
      </div>

      {/* 14개 원형 아이콘 그리드 (2행 7열) */}
      <div
        className="grid grid-cols-7 gap-2 mb-4"
        role="list"
        aria-label="일일 보상 수령 현황"
      >
        {Array.from({ length: cycleLength }).map((_, idx) => {
          const dayNum = idx + 1;
          const isClaimed = claimedDays.has(dayNum);

          return (
            <div
              key={dayNum}
              role="listitem"
              aria-label={`${dayNum}일차 ${isClaimed ? "수령 완료" : "미수령"}`}
              className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto
                         text-xs font-medium transition-colors
                         ${
                           isClaimed
                             ? "bg-blue-500 text-white"
                             : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                         }`}
            >
              {isClaimed ? (
                // 체크마크 아이콘
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
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                // 숫자 표시
                dayNum
              )}
            </div>
          );
        })}
      </div>

      {/* 프로그레스 바 */}
      <div
        className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full mb-3 overflow-hidden"
        role="progressbar"
        aria-valuenow={currentCount}
        aria-valuemin={0}
        aria-valuemax={cycleLength}
        aria-label={`진행률 ${percentage}%`}
      >
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* 남은 일수 또는 완주 축하 메시지 */}
      {cycleCompleted ? (
        <div className="text-center mb-3">
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
            주기 {cycleNumber} 완주!
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            축하합니다! 모든 일일 보상을 수령했습니다
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          완주까지 {remaining}일 남음
        </p>
      )}

      {/* 완주 보너스 미리보기 */}
      <div
        className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100
                   dark:border-blue-800"
      >
        <div className="flex items-center gap-2">
          {/* 선물 아이콘 */}
          <svg
            className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v13m0-13V6a4 4 0 00-4-4 4 4 0 004 4zm0 0V6a4 4 0 014-4 4 4 0 01-4 4zm-8 4h16M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
            />
          </svg>
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
            완주 보상: 특별 아이템 {CYCLE_COMPLETION_BONUS.bonusItems.length}개
          </p>
        </div>
      </div>
    </div>
  );
}
