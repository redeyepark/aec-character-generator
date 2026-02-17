"use client";

/**
 * 사주 정보 입력 폼
 * 음력/양력 선택과 출생 연/월/일을 입력받아 저장한다.
 */
import { useState, useCallback } from "react";
import type { BirthInfo } from "@/app/lib/fortune/types";

interface BirthInfoFormProps {
  initialBirthInfo?: BirthInfo | null;
  onSave: (info: BirthInfo) => Promise<boolean>;
  onCancel?: () => void;
}

/**
 * 날짜 유효성 검증
 * 윤년 및 월별 최대 일수를 고려한다.
 */
function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;

  // 월별 최대 일수
  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
}

export default function BirthInfoForm({
  initialBirthInfo,
  onSave,
  onCancel,
}: BirthInfoFormProps) {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState<string>(
    initialBirthInfo?.birthYear?.toString() ?? ""
  );
  const [month, setMonth] = useState<string>(
    initialBirthInfo?.birthMonth?.toString() ?? ""
  );
  const [day, setDay] = useState<string>(
    initialBirthInfo?.birthDay?.toString() ?? ""
  );
  const [isLunar, setIsLunar] = useState<boolean>(
    initialBirthInfo?.isLunar ?? false
  );

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSaveSuccess(false);

      const yearNum = parseInt(year, 10);
      const monthNum = parseInt(month, 10);
      const dayNum = parseInt(day, 10);

      // 필수 필드 검증
      if (!year || !month || !day) {
        setError("출생 연도, 월, 일을 모두 입력해주세요.");
        return;
      }

      // 범위 검증
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
        setError(`출생 연도는 1900~${currentYear} 사이여야 합니다.`);
        return;
      }

      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        setError("월은 1~12 사이여야 합니다.");
        return;
      }

      if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
        setError("일은 1~31 사이여야 합니다.");
        return;
      }

      // 날짜 유효성 검증 (예: 2월 30일 등)
      if (!isValidDate(yearNum, monthNum, dayNum)) {
        setError("유효하지 않은 날짜입니다. 확인해주세요.");
        return;
      }

      const birthInfo: BirthInfo = {
        birthYear: yearNum,
        birthMonth: monthNum,
        birthDay: dayNum,
        isLunar,
      };

      setIsSaving(true);
      try {
        const success = await onSave(birthInfo);
        if (success) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        } else {
          setError("저장에 실패했습니다. 다시 시도해주세요.");
        }
      } catch {
        setError("저장 중 오류가 발생했습니다.");
      } finally {
        setIsSaving(false);
      }
    },
    [year, month, day, isLunar, currentYear, onSave]
  );

  const inputBaseClass =
    "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white " +
    "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 " +
    "transition-colors duration-150";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* 음력/양력 선택 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          달력 종류
        </label>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsLunar(false)}
            className={`flex-1 py-2 text-sm font-medium transition-colors duration-150
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset
                       ${
                         !isLunar
                           ? "bg-blue-600 text-white"
                           : "bg-white text-gray-600 hover:bg-gray-50"
                       }`}
            aria-pressed={!isLunar}
          >
            양력
          </button>
          <button
            type="button"
            onClick={() => setIsLunar(true)}
            className={`flex-1 py-2 text-sm font-medium transition-colors duration-150
                       border-l border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset
                       ${
                         isLunar
                           ? "bg-blue-600 text-white"
                           : "bg-white text-gray-600 hover:bg-gray-50"
                       }`}
            aria-pressed={isLunar}
          >
            음력
          </button>
        </div>
      </div>

      {/* 연/월/일 입력 */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label
            htmlFor="birth-year"
            className="block text-xs font-medium text-gray-600 mb-1"
          >
            출생 연도
          </label>
          <input
            id="birth-year"
            type="number"
            min={1900}
            max={currentYear}
            placeholder="출생 연도"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={inputBaseClass}
            aria-label="출생 연도"
            required
          />
        </div>
        <div>
          <label
            htmlFor="birth-month"
            className="block text-xs font-medium text-gray-600 mb-1"
          >
            월
          </label>
          <input
            id="birth-month"
            type="number"
            min={1}
            max={12}
            placeholder="월"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className={inputBaseClass}
            aria-label="출생 월"
            required
          />
        </div>
        <div>
          <label
            htmlFor="birth-day"
            className="block text-xs font-medium text-gray-600 mb-1"
          >
            일
          </label>
          <input
            id="birth-day"
            type="number"
            min={1}
            max={31}
            placeholder="일"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className={inputBaseClass}
            aria-label="출생 일"
            required
          />
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div
          role="alert"
          className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          {error}
        </div>
      )}

      {/* 성공 메시지 */}
      {saveSuccess && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          사주 정보가 저장되었습니다!
        </div>
      )}

      {/* 버튼 영역 */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-lg
                     transition-all duration-150 cursor-pointer
                     focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                     ${
                       isSaving
                         ? "bg-gray-300 cursor-not-allowed"
                         : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                     }`}
        >
          {isSaving ? "저장 중..." : "저장"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-semibold rounded-lg
                       border border-gray-300 text-gray-600 bg-white
                       hover:bg-gray-50 active:bg-gray-100
                       transition-all duration-150 cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}
