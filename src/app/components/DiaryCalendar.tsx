"use client";

/**
 * 다이어리 달력 컴포넌트
 * 월별 달력 그리드를 표시하고, 무드 항목이 있는 날짜를 강조한다.
 * 날짜 클릭 시 해당 항목의 상세 정보를 표시한다.
 */
import { useMemo } from "react";
import type { MoodEntry } from "@/app/lib/types";

interface DiaryCalendarProps {
  /** 표시할 연도 */
  year: number;
  /** 표시할 월 (1-12) */
  month: number;
  /** 해당 월의 무드 항목 목록 */
  entries: MoodEntry[];
  /** 선택된 날짜 (YYYY-MM-DD) */
  selectedDate: string | null;
  /** 이전 월 이동 */
  onPrevMonth: () => void;
  /** 다음 월 이동 */
  onNextMonth: () => void;
  /** 날짜 선택 핸들러 */
  onDateSelect: (date: string) => void;
}

// 기분별 이모티콘
const MOOD_EMOJI: Record<string, string> = {
  happy: "\u{1F60A}",
  confident: "\u{1F60E}",
  calm: "\u{1F60C}",
  surprised: "\u{1F632}",
  thoughtful: "\u{1F914}",
  playful: "\u{1F61C}",
  determined: "\u{1F4AA}",
};

// 요일 라벨
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// 월 이름
const MONTH_NAMES = [
  "", "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

export default function DiaryCalendar({
  year,
  month,
  entries,
  selectedDate,
  onPrevMonth,
  onNextMonth,
  onDateSelect,
}: DiaryCalendarProps) {
  // 날짜별 무드 항목 맵 생성
  const entryMap = useMemo(() => {
    const map = new Map<string, MoodEntry>();
    for (const entry of entries) {
      map.set(entry.date, entry);
    }
    return map;
  }, [entries]);

  // 달력 그리드 데이터 생성
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0=일, 6=토

    const days: Array<{ day: number; dateStr: string } | null> = [];

    // 첫 주 빈 칸
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // 날짜 채우기
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ day: d, dateStr });
    }

    return days;
  }, [year, month]);

  // 오늘 날짜 문자열
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* 달력 헤더: 월 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100
                     transition-colors cursor-pointer
                     focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="이전 월"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-gray-800">
          {year}년 {MONTH_NAMES[month]}
        </h3>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100
                     transition-colors cursor-pointer
                     focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="다음 월"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`text-center text-xs font-medium py-1 ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cell, index) => {
          if (!cell) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const entry = entryMap.get(cell.dateStr);
          const isToday = cell.dateStr === todayStr;
          const isSelected = cell.dateStr === selectedDate;
          const hasEntry = !!entry;
          const dayOfWeek = (new Date(year, month - 1, cell.day)).getDay();

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => onDateSelect(cell.dateStr)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center
                         text-sm transition-all duration-150 cursor-pointer
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                         ${
                           isSelected
                             ? "bg-blue-500 text-white shadow-md"
                             : isToday
                               ? "bg-blue-50 border-2 border-blue-300 text-blue-700"
                               : hasEntry
                                 ? "bg-gray-50 hover:bg-gray-100 text-gray-700"
                                 : "hover:bg-gray-50 text-gray-500"
                         }
                         ${dayOfWeek === 0 && !isSelected ? "text-red-400" : ""}
                         ${dayOfWeek === 6 && !isSelected ? "text-blue-400" : ""}`}
            >
              <span className="text-xs font-medium">{cell.day}</span>
              {hasEntry && (
                <span className="text-xs mt-0.5" aria-label={`기분: ${entry.mood_category}`}>
                  {MOOD_EMOJI[entry.mood_category] ?? "\u{1F60A}"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
