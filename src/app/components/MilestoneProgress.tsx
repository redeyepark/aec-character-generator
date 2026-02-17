"use client";

/**
 * 마일스톤 진행률 컴포넌트
 * 출석 연속일에 따른 마일스톤 달성 진행 상황을 시각적으로 표시한다.
 * 가로형 프로그레스 바 위에 4개 마일스톤 마커를 배치한다.
 */
import { useMemo } from "react";
import { MILESTONES } from "@/app/lib/types";

interface MilestoneProgressProps {
  /** 현재 연속 출석일 */
  currentStreak: number;
  /** 해금된 마일스톤 일수 배열 */
  unlockedMilestones: number[];
}

export default function MilestoneProgress({
  currentStreak,
  unlockedMilestones,
}: MilestoneProgressProps) {
  // 프로그레스 바의 최대값 (30일 마일스톤 기준)
  const maxDays = MILESTONES[MILESTONES.length - 1].days;

  // 현재 진행률 (퍼센트, 최대 100%)
  const progressPercent = useMemo(() => {
    return Math.min((currentStreak / maxDays) * 100, 100);
  }, [currentStreak, maxDays]);

  // 다음 달성해야 할 마일스톤 찾기
  const nextMilestone = useMemo(() => {
    return MILESTONES.find((m) => m.days > currentStreak) ?? null;
  }, [currentStreak]);

  // 다음 마일스톤까지 남은 일수
  const daysRemaining = nextMilestone
    ? nextMilestone.days - currentStreak
    : 0;

  return (
    <div className="mt-4" aria-label="마일스톤 진행 상황">
      {/* 다음 마일스톤 안내 */}
      {nextMilestone && (
        <p className="text-xs text-gray-500 mb-2">
          다음 마일스톤:{" "}
          <span className="font-semibold text-[#3D8A5A]">
            {nextMilestone.label}
          </span>{" "}
          ({daysRemaining}일 남음)
        </p>
      )}
      {!nextMilestone && currentStreak > 0 && (
        <p className="text-xs text-[#3D8A5A] font-semibold mb-2">
          모든 마일스톤을 달성했습니다!
        </p>
      )}

      {/* 프로그레스 바 */}
      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-visible">
        {/* 채워진 영역 */}
        <div
          className="absolute top-0 left-0 h-full bg-[#3D8A5A] rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={currentStreak}
          aria-valuemin={0}
          aria-valuemax={maxDays}
          aria-label={`연속 출석 ${currentStreak}일 / ${maxDays}일`}
        />

        {/* 마일스톤 마커 */}
        {MILESTONES.map((milestone) => {
          const isAchieved = unlockedMilestones.includes(milestone.days);
          const positionPercent = (milestone.days / maxDays) * 100;

          return (
            <div
              key={milestone.days}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${positionPercent}%` }}
              aria-label={
                isAchieved
                  ? `${milestone.label} 달성 완료`
                  : `${milestone.label} 미달성`
              }
            >
              {/* 마커 원 */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold
                            ${
                              isAchieved
                                ? "bg-[#3D8A5A] border-[#3D8A5A] text-white"
                                : "bg-white border-gray-300 text-gray-400"
                            }`}
              >
                {isAchieved ? "\u2713" : milestone.days}
              </div>
              {/* 마커 라벨 */}
              <span
                className={`absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px]
                            ${
                              isAchieved
                                ? "text-[#3D8A5A] font-semibold"
                                : "text-gray-400"
                            }`}
              >
                {milestone.days}일
              </span>
            </div>
          );
        })}
      </div>

      {/* 마커 라벨 영역 확보 */}
      <div className="h-5" />
    </div>
  );
}
