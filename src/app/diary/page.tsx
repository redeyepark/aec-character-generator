"use client";

/**
 * 무드 다이어리 페이지
 * 월별 달력에서 기분 기록을 확인하고, 날짜를 선택하면 상세 정보를 표시한다.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import AuthGuard from "@/app/components/AuthGuard";
import DiaryCalendar from "@/app/components/DiaryCalendar";
import DiaryEntryCard from "@/app/components/DiaryEntryCard";
import AttendanceCard from "@/app/components/AttendanceCard";
import { useCharacter } from "@/app/hooks/useCharacter";
import { useMoodEntries } from "@/app/hooks/useMoodEntries";
import { useAttendance } from "@/app/hooks/useAttendance";
import { useRewards } from "@/app/hooks/useRewards";
import type { MoodEntry } from "@/app/lib/types";

function DiaryPageContent() {
  const { character, fetchCharacter } = useCharacter();
  const { fetchEntriesByMonth, loading, error } = useMoodEntries();
  const { attendance, fetchAttendance, loading: attendanceLoading } = useAttendance();
  const { rewards, fetchRewards } = useRewards();

  // 현재 표시 중인 연/월
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  // 월별 무드 항목
  const [entries, setEntries] = useState<MoodEntry[]>([]);

  // 선택된 날짜
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 초기 로딩 상태
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 초기 로드
  useEffect(() => {
    async function init() {
      setIsInitialLoading(true);
      const char = await fetchCharacter();
      if (!char) {
        window.location.href = "/create/";
        return;
      }
      // 출석 및 보상 데이터 병렬 조회
      await Promise.all([fetchAttendance(), fetchRewards()]);
      setIsInitialLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 월별 항목 로드
  useEffect(() => {
    if (!character) return;

    fetchEntriesByMonth(viewYear, viewMonth).then((result) => {
      setEntries(result);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, viewYear, viewMonth]);

  // 이전 월 이동
  const handlePrevMonth = useCallback(() => {
    setSelectedDate(null);
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  // 다음 월 이동
  const handleNextMonth = useCallback(() => {
    setSelectedDate(null);
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  // 해금된 마일스톤 일수 목록
  const unlockedMilestones = useMemo(() => {
    if (!rewards) return [];
    return rewards.unlockedRewards.map((r) => r.milestone);
  }, [rewards]);

  // 선택된 날짜의 무드 항목
  const selectedEntry = useMemo(() => {
    if (!selectedDate) return null;
    return entries.find((e) => e.date === selectedDate) ?? null;
  }, [selectedDate, entries]);

  // 초기 로딩 중
  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"
            aria-hidden="true"
          />
          <span className="text-sm text-gray-500">로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* 헤더 */}
      <header className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          무드 다이어리
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          기분 기록을 달력에서 확인하세요.
        </p>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* 왼쪽: 달력 */}
        <div>
          <DiaryCalendar
            year={viewYear}
            month={viewMonth}
            entries={entries}
            selectedDate={selectedDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onDateSelect={setSelectedDate}
          />

          {/* 로딩/에러 상태 */}
          {loading && (
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-400">항목 로딩 중...</span>
            </div>
          )}
          {error && (
            <div
              role="alert"
              className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              {error}
            </div>
          )}

          {/* 월별 통계 */}
          <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              이번 달 기록
            </h3>
            <p className="text-sm text-gray-500">
              총 <span className="font-bold text-blue-600">{entries.length}</span>일 기록됨
            </p>
          </div>

          {/* 출석 현황 카드 */}
          <div className="mt-4">
            <AttendanceCard
              attendance={attendance}
              loading={attendanceLoading}
              unlockedMilestones={unlockedMilestones}
            />
          </div>
        </div>

        {/* 오른쪽: 선택된 날짜의 상세 정보 */}
        <div>
          {selectedEntry && character ? (
            <DiaryEntryCard entry={selectedEntry} character={character} />
          ) : selectedDate ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">
                이 날짜에는 기록이 없습니다.
              </p>
              <a
                href="/mood/"
                className="inline-block mt-3 text-sm text-blue-500 hover:text-blue-700 transition-colors"
              >
                오늘의 기분 기록하기
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-400 text-sm">
                달력에서 날짜를 선택하면
              </p>
              <p className="text-gray-400 text-sm">
                기분 기록을 확인할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// AuthGuard로 래핑
export default function DiaryPage() {
  return (
    <AuthGuard>
      <DiaryPageContent />
    </AuthGuard>
  );
}
