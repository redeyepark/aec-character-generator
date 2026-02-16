"use client";

/**
 * 캐릭터 CRUD 훅
 * Firestore characters 컬렉션에 대한 조회/생성/수정 기능을 제공한다.
 */
import { useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  getDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import type { BaseCharacter } from "@/app/lib/types";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { useAuth } from "./useAuth";

/**
 * Firestore 문서를 BaseCharacter 도메인 타입으로 변환
 */
function toBaseCharacter(
  docSnap: QueryDocumentSnapshot<DocumentData>
): BaseCharacter {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    user_id: data.userId,
    face: data.face,
    hair: data.hair,
    mustache: data.mustache ?? null,
    glasses: data.glasses ?? null,
    created_at:
      data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
    updated_at:
      data.updatedAt?.toDate().toISOString() ?? new Date().toISOString(),
  };
}

interface UseCharacterReturn {
  /** 현재 사용자의 캐릭터 */
  character: BaseCharacter | null;
  /** 로딩 상태 */
  loading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 캐릭터 조회 */
  fetchCharacter: () => Promise<BaseCharacter | null>;
  /** 캐릭터 생성 */
  createCharacter: (data: {
    face: string;
    hair: string;
    mustache: string | null;
    glasses: string | null;
  }) => Promise<BaseCharacter | null>;
  /** 캐릭터 수정 */
  updateCharacter: (
    id: string,
    data: {
      face: string;
      hair: string;
      mustache: string | null;
      glasses: string | null;
    }
  ) => Promise<BaseCharacter | null>;
}

export function useCharacter(): UseCharacterReturn {
  const { user, refreshHasCharacter } = useAuth();
  const [character, setCharacter] = useState<BaseCharacter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 캐릭터 조회
  const fetchCharacter = useCallback(async (): Promise<BaseCharacter | null> => {
    if (!user) {
      console.warn("[캐릭터 조회] 사용자 정보 없음");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[캐릭터 조회 시작]", { userId: user.uid });

      const q = query(
        collection(db, "characters"),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log("[캐릭터 조회 성공] 캐릭터 없음");
        setCharacter(null);
        return null;
      }

      const result = toBaseCharacter(snapshot.docs[0]);
      console.log("[캐릭터 조회 성공]", result);
      setCharacter(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "캐릭터 조회 실패";
      setError(msg);
      console.error("[캐릭터 조회 예외]", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 캐릭터 생성
  const createCharacter = useCallback(
    async (data: {
      face: string;
      hair: string;
      mustache: string | null;
      glasses: string | null;
    }): Promise<BaseCharacter | null> => {
      if (!user) {
        const msg = "사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.";
        setError(msg);
        console.error("[캐릭터 생성] 사용자 없음", { user });
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("[캐릭터 생성 시작]", { userId: user.uid, data });

        const docRef = await addDoc(collection(db, "characters"), {
          userId: user.uid,
          face: data.face,
          hair: data.hair,
          mustache: data.mustache,
          glasses: data.glasses,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // 생성된 문서를 다시 읽어와서 서버 타임스탬프가 반영된 데이터를 가져온다
        const createdDoc = await getDoc(docRef);

        if (!createdDoc.exists()) {
          const msg = "캐릭터 생성 후 데이터를 받을 수 없습니다.";
          setError(msg);
          console.error("[캐릭터 생성] 반환된 데이터 없음");
          return null;
        }

        const result = toBaseCharacter(
          createdDoc as QueryDocumentSnapshot<DocumentData>
        );
        console.log("[캐릭터 생성 성공]", result);
        setCharacter(result);
        await refreshHasCharacter();
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "캐릭터 생성 실패";
        setError(msg);
        console.error("[캐릭터 생성 예외]", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, refreshHasCharacter]
  );

  // 캐릭터 수정
  const updateCharacter = useCallback(
    async (
      id: string,
      data: {
        face: string;
        hair: string;
        mustache: string | null;
        glasses: string | null;
      }
    ): Promise<BaseCharacter | null> => {
      if (!user) {
        const msg = "사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.";
        setError(msg);
        console.error("[캐릭터 수정] 사용자 없음", { user });
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("[캐릭터 수정 시작]", {
          characterId: id,
          userId: user.uid,
          data,
        });

        const charRef = doc(db, "characters", id);
        await updateDoc(charRef, {
          face: data.face,
          hair: data.hair,
          mustache: data.mustache,
          glasses: data.glasses,
          updatedAt: serverTimestamp(),
        });

        // 수정된 문서를 다시 읽어온다
        const updatedDoc = await getDoc(charRef);

        if (!updatedDoc.exists()) {
          const msg =
            "캐릭터 수정 후 데이터를 받을 수 없습니다. 권한을 확인해주세요.";
          setError(msg);
          console.error("[캐릭터 수정] 반환된 데이터 없음");
          return null;
        }

        const result = toBaseCharacter(
          updatedDoc as QueryDocumentSnapshot<DocumentData>
        );
        console.log("[캐릭터 수정 성공]", result);
        setCharacter(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "캐릭터 수정 실패";
        setError(msg);
        console.error("[캐릭터 수정 예외]", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return {
    character,
    loading,
    error,
    fetchCharacter,
    createCharacter,
    updateCharacter,
  };
}
