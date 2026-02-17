"use client";

/**
 * 출석 현황 카드 컴포넌트
 * 이번 달 출석 통계(연속 출석, 총 출석, 최대 연속)를 카드 형태로 표시한다.
 * 하단에 MilestoneProgress를 포함한다.
 */
import type { AttendanceData } from "@/app/lib/types";
import MilestoneProgress from "./MilestoneProgress";

interface AttendanceCardProps {
  /** 출석 데이터 (null이면 로딩 전 상태) */
  attendance: AttendanceData | null;
  /** 로딩 상태 */
  loading: boolean;
  /** 해금된 마일스톤 일수 배열 (선택적) */
  unlockedMilestones?: number[];
}

export default function AttendanceCard({
  attendance,
  loading,
  unlockedMilestones = [],
}: AttendanceCardProps) {
  // 로딩 상태: 스켈레톤 UI
  if (loading) {
    return (
      <div
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
        aria-busy="true"
        aria-label="출석 현황 로딩 중"
      >
        <div className="h-4 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="h-6 bg-gray-200 rounded w-10 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-14 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 빈 상태: 출석 기록 없음
  if (!attendance || attendance.totalDays === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          이번 달 출석 현황
        </h3>
        <p className="text-sm text-gray-400">
          아직 출석 기록이 없습니다
        </p>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
      aria-label="이번 달 출석 현황"
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        이번 달 출석 현황
      </h3>

      {/* 통계 항목 3개 (가로 배치) */}
      <div className="grid grid-cols-3 gap-4">
        {/* 연속 출석 */}
        <div className="flex flex-col items-center" aria-label={`연속 출석 ${attendance.currentStreak}일`}>
          <span className="text-xl font-bold text-[#3D8A5A]">
            {attendance.currentStreak}
          </span>
          <span className="text-xs text-gray-500">연속 출석</span>
        </div>

        {/* 총 출석 */}
        <div className="flex flex-col items-center" aria-label={`총 출석 ${attendance.totalDays}일`}>
          <span className="text-xl font-bold text-[#4A90D9]">
            {attendance.totalDays}
          </span>
          <span className="text-xs text-gray-500">총 출석</span>
        </div>

        {/* 최대 연속 */}
        <div className="flex flex-col items-center" aria-label={`최대 연속 ${attendance.maxStreak}일`}>
          <span className="text-xl font-bold text-[#D89575]">
            {attendance.maxStreak}
          </span>
          <span className="text-xs text-gray-500">최대 연속</span>
        </div>
      </div>

      {/* 마일스톤 진행률 */}
      <MilestoneProgress
        currentStreak={attendance.currentStreak}
        unlockedMilestones={unlockedMilestones}
      />
    </div>
  );
}
