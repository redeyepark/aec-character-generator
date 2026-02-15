"use client";

/**
 * 인증 컨텍스트
 * Supabase 인증 상태를 관리하고 하위 컴포넌트에 제공한다.
 * onAuthStateChange를 통해 세션 변경을 실시간으로 추적한다.
 */
import {
  createContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabase";

export interface AuthContextType {
  /** 현재 로그인된 사용자 */
  user: User | null;
  /** 현재 세션 */
  session: Session | null;
  /** 인증 상태 로딩 중 여부 */
  loading: boolean;
  /** 캐릭터 보유 여부 */
  hasCharacter: boolean;
  /** 회원가입 */
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  /** 로그인 */
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  /** 로그아웃 */
  signOut: () => Promise<void>;
  /** 캐릭터 보유 상태 갱신 */
  refreshHasCharacter: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCharacter, setHasCharacter] = useState(false);

  // 사용자의 캐릭터 보유 여부 확인
  const checkHasCharacter = useCallback(async (userId: string) => {
    try {
      console.log("[캐릭터 확인]", { userId });
      const { data, error } = await supabase
        .from("characters")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("[캐릭터 조회 오류]", error);
        setHasCharacter(false);
        return;
      }
      console.log("[캐릭터 확인 완료]", { hasCharacter: !!data });
      setHasCharacter(!!data);
    } catch (err) {
      console.error("[캐릭터 조회 예외]", err);
      setHasCharacter(false);
    }
  }, []);

  // 캐릭터 보유 상태 외부에서 갱신할 수 있는 함수
  const refreshHasCharacter = useCallback(async () => {
    if (user) {
      await checkHasCharacter(user.id);
    }
  }, [user, checkHasCharacter]);

  // 인증 상태 변화 구독
  useEffect(() => {
    // 초기 세션 가져오기
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("[AuthContext] 초기 세션 로드", {
        hasSession: !!currentSession,
        userId: currentSession?.user?.id,
      });
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        checkHasCharacter(currentSession.user.id);
      }
      setLoading(false);
    });

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("[AuthContext] 인증 상태 변경", {
          event,
          hasSession: !!newSession,
          userId: newSession?.user?.id,
        });
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          checkHasCharacter(newSession.user.id);
        } else {
          setHasCharacter(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [checkHasCharacter]);

  // 회원가입
  const signUp = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return { error: error.message };

        // 프로필 테이블에 레코드 생성
        if (data.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({ user_id: data.user.id });

          if (profileError) {
            console.error("프로필 생성 오류:", profileError);
          }
        }

        return { error: null };
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다.",
        };
      }
    },
    []
  );

  // 로그인
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return { error: error.message };
        return { error: null };
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다.",
        };
      }
    },
    []
  );

  // 로그아웃
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setHasCharacter(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        hasCharacter,
        signUp,
        signIn,
        signOut,
        refreshHasCharacter,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
