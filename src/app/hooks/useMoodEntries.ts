"use client";

/**
 * 무드 다이어리 항목 CRUD 훅
 * Supabase mood_entries 테이블에 대한 조회/생성/수정 기능을 제공한다.
 */
import { useState, useCallback } from "react";
import { supabase } from "@/app/lib/supabase";
import type { MoodEntry } from "@/app/lib/types";
import { useAuth } from "./useAuth";

interface UseMoodEntriesReturn {
  /** 로딩 상태 */
  loading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 오늘의 무드 항목 조회 */
  fetchTodayEntry: () => Promise<MoodEntry | null>;
  /** 월별 무드 항목 목록 조회 */
  fetchEntriesByMonth: (year: number, month: number) => Promise<MoodEntry[]>;
  /** 오늘의 무드 항목 생성 또는 수정 (upsert) */
  upsertEntry: (data: {
    characterId: string;
    date: string;
    moodCategory: string;
    outfitFile: string;
    expressionFile: string;
  }) => Promise<MoodEntry | null>;
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useMoodEntries(): UseMoodEntriesReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 오늘의 무드 항목 조회
  const fetchTodayEntry = useCallback(async (): Promise<MoodEntry | null> => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      const today = getTodayDateString();
      const { data, error: fetchError } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
        return null;
      }

      return (data as MoodEntry) ?? null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "무드 항목 조회 실패";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 월별 무드 항목 조회
  const fetchEntriesByMonth = useCallback(
    async (year: number, month: number): Promise<MoodEntry[]> => {
      if (!user) return [];

      setLoading(true);
      setError(null);

      try {
        // 해당 월의 시작일과 마지막일
        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

        const { data, error: fetchError } = await supabase
          .from("mood_entries")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: true });

        if (fetchError) {
          setError(fetchError.message);
          return [];
        }

        return (data as MoodEntry[]) ?? [];
      } catch (err) {
        const msg = err instanceof Error ? err.message : "월별 항목 조회 실패";
        setError(msg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // 무드 항목 생성/수정 (upsert)
  const upsertEntry = useCallback(
    async (data: {
      characterId: string;
      date: string;
      moodCategory: string;
      outfitFile: string;
      expressionFile: string;
    }): Promise<MoodEntry | null> => {
      if (!user) return null;

      setLoading(true);
      setError(null);

      try {
        // 기존 항목 확인
        const { data: existing } = await supabase
          .from("mood_entries")
          .select("id")
          .eq("user_id", user.id)
          .eq("date", data.date)
          .maybeSingle();

        if (existing) {
          // 기존 항목 수정
          const { data: updated, error: updateError } = await supabase
            .from("mood_entries")
            .update({
              mood_category: data.moodCategory,
              outfit_file: data.outfitFile,
              expression_file: data.expressionFile,
              character_id: data.characterId,
            })
            .eq("id", existing.id)
            .select()
            .single();

          if (updateError) {
            setError(updateError.message);
            return null;
          }

          return updated as MoodEntry;
        } else {
          // 새 항목 생성
          const { data: created, error: createError } = await supabase
            .from("mood_entries")
            .insert({
              user_id: user.id,
              character_id: data.characterId,
              date: data.date,
              mood_category: data.moodCategory,
              outfit_file: data.outfitFile,
              expression_file: data.expressionFile,
            })
            .select()
            .single();

          if (createError) {
            setError(createError.message);
            return null;
          }

          return created as MoodEntry;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "무드 항목 저장 실패";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return {
    loading,
    error,
    fetchTodayEntry,
    fetchEntriesByMonth,
    upsertEntry,
  };
}
