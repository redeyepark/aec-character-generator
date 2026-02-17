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
  /** 현재 보고 있는 연도 (선택적) */
  viewYear?: number;
  /** 현재 보고 있는 월 (선택적) */
  viewMonth?: number;
  /** 에러 메시지 (선택적) */
  error?: string | null;
}

export default function AttendanceCard({
  attendance,
  loading,
  unlockedMilestones = [],
  viewYear,
  viewMonth,
  error,
}: AttendanceCardProps) {
  // 카드 제목: viewYear/viewMonth가 있으면 해당 월 표시, 없으면 기본값
  const cardTitle =
    viewYear && viewMonth
      ? `${viewYear}년 ${viewMonth}월 출석 현황`
      : "이번 달 출석 현황";

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

  // 에러 상태: 출석 데이터 조회 실패
  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          {cardTitle}
        </h3>
        <div
          role="alert"
          className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          <p>{error}</p>
          <p className="mt-1 text-xs text-red-500">
            페이지를 새로고침하거나 다시 시도해 주세요.
          </p>
        </div>
      </div>
    );
  }

  // 빈 상태: 출석 기록 없음
  if (!attendance || attendance.totalDays === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          {cardTitle}
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
      aria-label={cardTitle}
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        {cardTitle}
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
