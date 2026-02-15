"use client";

/**
 * 캐릭터 CRUD 훅
 * Supabase characters 테이블에 대한 조회/생성/수정 기능을 제공한다.
 */
import { useState, useCallback } from "react";
import { supabase } from "@/app/lib/supabase";
import type { BaseCharacter } from "@/app/lib/types";
import { useAuth } from "./useAuth";

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
      console.log("[캐릭터 조회 시작]", { userId: user.id });

      const { data, error: fetchError } = await supabase
        .from("characters")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        const errorMsg = `캐릭터 조회 실패: ${fetchError.message}`;
        setError(errorMsg);
        console.error("[캐릭터 조회 에러]", fetchError);
        return null;
      }

      const result = data as BaseCharacter | null;
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
        console.log("[캐릭터 생성 시작]", { userId: user.id, data });

        const { data: created, error: createError } = await supabase
          .from("characters")
          .insert({
            user_id: user.id,
            face: data.face,
            hair: data.hair,
            mustache: data.mustache,
            glasses: data.glasses,
          })
          .select()
          .single();

        if (createError) {
          const errorMsg = `캐릭터 생성 실패: ${createError.message}`;
          setError(errorMsg);
          console.error("[캐릭터 생성 에러]", createError);
          return null;
        }

        if (!created) {
          const msg = "캐릭터 생성 후 데이터를 받을 수 없습니다.";
          setError(msg);
          console.error("[캐릭터 생성] 반환된 데이터 없음");
          return null;
        }

        console.log("[캐릭터 생성 성공]", created);
        const result = created as BaseCharacter;
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
        console.log("[캐릭터 수정 시작]", { characterId: id, userId: user.id, data });

        const { data: updated, error: updateError } = await supabase
          .from("characters")
          .update({
            face: data.face,
            hair: data.hair,
            mustache: data.mustache,
            glasses: data.glasses,
          })
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (updateError) {
          const errorMsg = `캐릭터 수정 실패: ${updateError.message}`;
          setError(errorMsg);
          console.error("[캐릭터 수정 에러]", updateError);
          return null;
        }

        if (!updated) {
          const msg = "캐릭터 수정 후 데이터를 받을 수 없습니다. 권한을 확인해주세요.";
          setError(msg);
          console.error("[캐릭터 수정] 반환된 데이터 없음");
          return null;
        }

        console.log("[캐릭터 수정 성공]", updated);
        const result = updated as BaseCharacter;
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
