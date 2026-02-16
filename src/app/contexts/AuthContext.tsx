"use client";

/**
 * 인증 컨텍스트
 * Firebase Auth 인증 상태를 관리하고 하위 컴포넌트에 제공한다.
 * onAuthStateChanged를 통해 인증 상태 변경을 실시간으로 추적한다.
 */
import {
  createContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase";

export interface AuthContextType {
  /** 현재 로그인된 사용자 */
  user: User | null;
  /** 인증 상태 로딩 중 여부 */
  loading: boolean;
  /** 캐릭터 보유 여부 */
  hasCharacter: boolean;
  /** 인증 오류 메시지 */
  authError: string | null;
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
  const [loading, setLoading] = useState(true);
  const [hasCharacter, setHasCharacter] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 사용자의 캐릭터 보유 여부 확인
  const checkHasCharacter = useCallback(async (userId: string) => {
    try {
      console.log("[캐릭터 확인]", { userId });
      const q = query(
        collection(db, "characters"),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);

      const found = !snapshot.empty;
      console.log("[캐릭터 확인 완료]", { hasCharacter: found });
      setHasCharacter(found);
    } catch (err) {
      console.error("[캐릭터 조회 예외]", err);
      setHasCharacter(false);
    }
  }, []);

  // 캐릭터 보유 상태 외부에서 갱신할 수 있는 함수
  const refreshHasCharacter = useCallback(async () => {
    if (user) {
      await checkHasCharacter(user.uid);
    }
  }, [user, checkHasCharacter]);

  // 인증 상태 변화 구독
  useEffect(() => {
    // 10초 타임아웃 안전장치 - onAuthStateChanged가 응답하지 않으면 강제로 로딩 종료
    let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
      console.warn("[AuthContext] 초기 인증 상태 로드 타임아웃");
      setLoading(false);
      setAuthError("인증 서비스 응답 시간이 초과되었습니다.");
    }, 10000);

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        console.log("[AuthContext] 인증 상태 변경", {
          hasUser: !!firebaseUser,
          userId: firebaseUser?.uid,
        });

        setUser(firebaseUser);
        setAuthError(null);

        if (firebaseUser) {
          checkHasCharacter(firebaseUser.uid);
        } else {
          setHasCharacter(false);
        }

        setLoading(false);

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      },
      (error) => {
        console.error("[AuthContext] 인증 상태 감지 오류", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "인증 서비스에 연결할 수 없습니다. 네트워크를 확인하세요.";
        setAuthError(errorMessage);
        setUser(null);
        setLoading(false);

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    );

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      unsubscribe();
    };
  }, [checkHasCharacter]);

  // 회원가입
  const signUp = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const newUser = userCredential.user;

        // 프로필 컬렉션에 문서 생성
        try {
          await setDoc(doc(db, "profiles", newUser.uid), {
            userId: newUser.uid,
            displayName: null,
            createdAt: serverTimestamp(),
          });
        } catch (profileError) {
          console.error("프로필 생성 오류:", profileError);
        }

        return { error: null };
      } catch (err) {
        return {
          error:
            err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다.",
        };
      }
    },
    []
  );

  // 로그인
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return { error: null };
      } catch (err) {
        return {
          error:
            err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다.",
        };
      }
    },
    []
  );

  // 로그아웃
  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setHasCharacter(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasCharacter,
        authError,
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
