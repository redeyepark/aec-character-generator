"use client";

/**
 * 무드 다이어리 항목 CRUD 훅
 * Firestore mood_entries 컬렉션에 대한 조회/생성/수정 기능을 제공한다.
 */
import { useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import type { MoodEntry, MoodCategory } from "@/app/lib/types";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { useAuth } from "./useAuth";

/**
 * Firestore 문서를 MoodEntry 도메인 타입으로 변환
 */
function toMoodEntry(
  docSnap: QueryDocumentSnapshot<DocumentData>
): MoodEntry {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    user_id: data.userId,
    character_id: data.characterId,
    date: data.date,
    mood_category: data.moodCategory,
    outfit_file: data.outfitFile,
    expression_file: data.expressionFile,
    composite_image_url: data.compositeImageUrl ?? null,
    created_at:
      data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
    updated_at:
      data.updatedAt?.toDate().toISOString() ?? new Date().toISOString(),
  };
}

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
    moodCategory: MoodCategory;
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
      const q = query(
        collection(db, "mood_entries"),
        where("userId", "==", user.uid),
        where("date", "==", today)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      return toMoodEntry(snapshot.docs[0]);
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

        const q = query(
          collection(db, "mood_entries"),
          where("userId", "==", user.uid),
          where("date", ">=", startDate),
          where("date", "<=", endDate),
          orderBy("date")
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(toMoodEntry);
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
      moodCategory: MoodCategory;
      outfitFile: string;
      expressionFile: string;
    }): Promise<MoodEntry | null> => {
      if (!user) return null;

      setLoading(true);
      setError(null);

      try {
        // 기존 항목 확인 (복합 인덱스를 사용한 서버 측 쿼리)
        const existingQuery = query(
          collection(db, "mood_entries"),
          where("userId", "==", user.uid),
          where("date", "==", data.date)
        );
        const existingSnapshot = await getDocs(existingQuery);

        if (!existingSnapshot.empty) {
          const existingDoc = existingSnapshot.docs[0];
          // 기존 항목 수정
          const entryRef = doc(db, "mood_entries", existingDoc.id);
          await updateDoc(entryRef, {
            moodCategory: data.moodCategory,
            outfitFile: data.outfitFile,
            expressionFile: data.expressionFile,
            characterId: data.characterId,
            updatedAt: serverTimestamp(),
          });

          // 수정 후 로컬에서 MoodEntry 구성 (서버 타임스탬프는 아직 미반영이므로 기존 값 활용)
          const existingData = existingDoc.data();
          const updated: MoodEntry = {
            id: existingDoc.id,
            user_id: user.uid,
            character_id: data.characterId,
            date: data.date,
            mood_category: data.moodCategory,
            outfit_file: data.outfitFile,
            expression_file: data.expressionFile,
            composite_image_url: existingData.compositeImageUrl ?? null,
            created_at:
              existingData.createdAt?.toDate().toISOString() ??
              new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          return updated;
        } else {
          // 새 항목 생성
          const docRef = await addDoc(collection(db, "mood_entries"), {
            userId: user.uid,
            characterId: data.characterId,
            date: data.date,
            moodCategory: data.moodCategory,
            outfitFile: data.outfitFile,
            expressionFile: data.expressionFile,
            compositeImageUrl: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          const created: MoodEntry = {
            id: docRef.id,
            user_id: user.uid,
            character_id: data.characterId,
            date: data.date,
            mood_category: data.moodCategory,
            outfit_file: data.outfitFile,
            expression_file: data.expressionFile,
            composite_image_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          return created;
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
