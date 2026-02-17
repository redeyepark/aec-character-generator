"use client";

/**
 * 출석 체크 CRUD 훅
 * Firestore attendance 컬렉션에 대한 조회/기록 기능을 제공한다.
 * 문서 ID: {userId}_{YYYY-MM} 형식으로 월별 출석 기록을 관리한다.
 */
import { useState, useCallback } from "react";
import {
  doc,
  getDoc,
  setDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import type { AttendanceData, MilestoneConfig } from "@/app/lib/types";
import { MILESTONES } from "@/app/lib/types";
import { useAuth } from "./useAuth";

/** 출석 기록 결과 */
export interface RecordAttendanceResult {
  /** 오늘 새로 출석했는지 여부 (이미 출석한 경우 false) */
  isNewAttendance: boolean;
  /** 현재 연속 출석일 */
  currentStreak: number;
  /** 달성한 마일스톤 (없으면 null) */
  milestoneReached: MilestoneConfig | null;
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환 (브라우저 로컬 타임존 기준)
 */
function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * 어제 날짜를 YYYY-MM-DD 형식으로 반환 (브라우저 로컬 타임존 기준)
 */
function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * 현재 연-월을 YYYY-MM 형식으로 반환
 */
function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

interface UseAttendanceReturn {
  /** 로딩 상태 */
  loading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 현재 출석 데이터 */
  attendance: AttendanceData | null;
  /** 출석 기록 (오늘 날짜 기준) */
  recordAttendance: () => Promise<RecordAttendanceResult | null>;
  /** 출석 데이터 조회 (yearMonth 미지정 시 이번 달) */
  fetchAttendance: (yearMonth?: string) => Promise<AttendanceData | null>;
}

export function useAttendance(): UseAttendanceReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);

  // 출석 데이터 조회
  const fetchAttendance = useCallback(
    async (yearMonth?: string): Promise<AttendanceData | null> => {
      if (!user) return null;

      setLoading(true);
      setError(null);

      try {
        const ym = yearMonth ?? getCurrentYearMonth();
        const docId = `${user.uid}_${ym}`;
        const docRef = doc(db, "attendance", docId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          // 해당 월 출석 기록이 없으면 빈 데이터 반환
          const emptyData: AttendanceData = {
            yearMonth: ym,
            attendedDates: [],
            currentStreak: 0,
            maxStreak: 0,
            totalDays: 0,
          };
          setAttendance(emptyData);
          return emptyData;
        }

        const data = docSnap.data();
        const result: AttendanceData = {
          yearMonth: data.yearMonth,
          attendedDates: data.attendedDates ?? [],
          currentStreak: data.currentStreak ?? 0,
          maxStreak: data.maxStreak ?? 0,
          totalDays: data.totalDays ?? 0,
        };

        setAttendance(result);
        return result;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "출석 데이터 조회 실패";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // 출석 기록 (오늘 날짜 기준)
  const recordAttendance =
    useCallback(async (): Promise<RecordAttendanceResult | null> => {
      if (!user) return null;

      setLoading(true);
      setError(null);

      try {
        const today = getTodayDateString();
        const yesterday = getYesterdayDateString();
        const yearMonth = getCurrentYearMonth();
        const docId = `${user.uid}_${yearMonth}`;
        const docRef = doc(db, "attendance", docId);
        const docSnap = await getDoc(docRef);

        let currentStreak: number;
        let maxStreak: number;
        let totalDays: number;
        let isNewAttendance: boolean;

        if (!docSnap.exists()) {
          // 이번 달 첫 출석: 새 문서 생성
          currentStreak = 1;
          maxStreak = 1;
          totalDays = 1;
          isNewAttendance = true;

          await setDoc(docRef, {
            userId: user.uid,
            yearMonth,
            attendedDates: [today],
            currentStreak,
            maxStreak,
            totalDays,
            updatedAt: serverTimestamp(),
          });
        } else {
          const data = docSnap.data();
          const attendedDates: string[] = data.attendedDates ?? [];

          // 이미 오늘 출석한 경우: 중복 방지 (멱등성)
          if (attendedDates.includes(today)) {
            const result: AttendanceData = {
              yearMonth: data.yearMonth,
              attendedDates,
              currentStreak: data.currentStreak ?? 0,
              maxStreak: data.maxStreak ?? 0,
              totalDays: data.totalDays ?? 0,
            };
            setAttendance(result);

            return {
              isNewAttendance: false,
              currentStreak: data.currentStreak ?? 0,
              milestoneReached: null,
            };
          }

          // 어제 출석했으면 연속 출석, 아니면 리셋
          const prevStreak: number = data.currentStreak ?? 0;
          if (attendedDates.includes(yesterday)) {
            currentStreak = prevStreak + 1;
          } else {
            currentStreak = 1;
          }

          maxStreak = Math.max(data.maxStreak ?? 0, currentStreak);
          totalDays = (data.totalDays ?? 0) + 1;
          isNewAttendance = true;

          // arrayUnion으로 중복 방지하면서 날짜 추가
          await setDoc(
            docRef,
            {
              userId: user.uid,
              yearMonth,
              attendedDates: arrayUnion(today),
              currentStreak,
              maxStreak,
              totalDays,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }

        // 로컬 상태 업데이트
        const updatedAttendance: AttendanceData = {
          yearMonth,
          attendedDates: [
            ...(attendance?.attendedDates?.filter((d) => d !== today) ?? []),
            today,
          ],
          currentStreak,
          maxStreak,
          totalDays,
        };
        setAttendance(updatedAttendance);

        // 마일스톤 달성 확인
        const milestoneReached: MilestoneConfig | null =
          MILESTONES.find((m) => m.days === currentStreak) ?? null;

        return {
          isNewAttendance,
          currentStreak,
          milestoneReached,
        };
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "출석 기록 실패";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    }, [user, attendance]);

  return {
    loading,
    error,
    attendance,
    recordAttendance,
    fetchAttendance,
  };
}
