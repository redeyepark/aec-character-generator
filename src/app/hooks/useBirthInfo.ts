"use client";

/**
 * 사주 정보 CRUD 훅
 * Firestore profiles/{uid} 문서에서 생년월일 정보를 조회/저장한다.
 */
import { useState, useCallback, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "./useAuth";
import type { BirthInfo } from "@/app/lib/fortune/types";

interface UseBirthInfoReturn {
  /** 사주 정보 (없으면 null) */
  birthInfo: BirthInfo | null;
  /** 로딩 상태 */
  loading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 사주 정보 저장 */
  saveBirthInfo: (info: BirthInfo) => Promise<boolean>;
  /** 사주 정보 조회 */
  fetchBirthInfo: () => Promise<BirthInfo | null>;
}

export function useBirthInfo(): UseBirthInfoReturn {
  const { user } = useAuth();
  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사주 정보 조회
  const fetchBirthInfo = useCallback(async (): Promise<BirthInfo | null> => {
    if (!user) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const profileRef = doc(db, "profiles", user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        setBirthInfo(null);
        return null;
      }

      const data = profileSnap.data();

      // 출생연도가 없으면 사주 정보가 입력되지 않은 것
      if (!data.birthYear) {
        setBirthInfo(null);
        return null;
      }

      const info: BirthInfo = {
        birthYear: data.birthYear,
        birthMonth: data.birthMonth,
        birthDay: data.birthDay,
        ...(data.birthHour !== undefined && data.birthHour !== null
          ? { birthHour: data.birthHour }
          : {}),
      };

      setBirthInfo(info);
      return info;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "사주 정보 조회 실패";
      setError(msg);
      console.error("[사주 정보 조회 예외]", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 사주 정보 저장 (setDoc + merge로 문서가 없어도 안전하게 생성/병합)
  const saveBirthInfo = useCallback(
    async (info: BirthInfo): Promise<boolean> => {
      if (!user) {
        setError("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const profileRef = doc(db, "profiles", user.uid);

        // setDoc + merge: 문서가 없으면 생성, 있으면 기존 필드를 보존하면서 병합
        await setDoc(profileRef, {
          birthYear: info.birthYear,
          birthMonth: info.birthMonth,
          birthDay: info.birthDay,
          ...(info.birthHour !== undefined
            ? { birthHour: info.birthHour }
            : {}),
        }, { merge: true });

        setBirthInfo(info);
        return true;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "사주 정보 저장 실패";
        setError(msg);
        console.error("[사주 정보 저장 예외]", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // 컴포넌트 마운트 시 자동 조회
  useEffect(() => {
    if (user) {
      fetchBirthInfo();
    }
  }, [user, fetchBirthInfo]);

  return {
    birthInfo,
    loading,
    error,
    saveBirthInfo,
    fetchBirthInfo,
  };
}
