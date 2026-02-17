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
  sendEmailVerification,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithPopup,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import type { FirestoreProfile } from "@/app/lib/firestore.types";
import { auth, db } from "@/app/lib/firebase";

export interface AuthContextType {
  /** 현재 로그인된 사용자 */
  user: User | null;
  /** 인증 상태 로딩 중 여부 */
  loading: boolean;
  /** 캐릭터 보유 여부 */
  hasCharacter: boolean;
  /** 관리자 여부 */
  isAdmin: boolean;
  /** 인증 오류 메시지 */
  authError: string | null;
  /** 회원가입 */
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: string | null; emailSent?: boolean }>;
  /** 로그인 */
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  /** 로그아웃 */
  signOut: () => Promise<void>;
  /** 캐릭터 보유 상태 갱신 */
  refreshHasCharacter: () => Promise<void>;
  /** 인증 메일 재발송 */
  resendVerificationEmail: () => Promise<{ error: string | null }>;
  /** Google 로그인 */
  signInWithGoogle: () => Promise<{ error: string | null }>;
  /** Google 계정 여부 */
  isGoogleUser: boolean;
  /** 회원 탈퇴 (Firestore 데이터 삭제 + Auth 계정 삭제) */
  deleteAccount: (password?: string) => Promise<{ error: string | null }>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// Google 인증 프로바이더 인스턴스
const googleProvider = new GoogleAuthProvider();

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCharacter, setHasCharacter] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  // 사용자의 관리자 역할 확인 (profiles/{uid} 문서에서 role 필드 조회)
  const checkIsAdmin = useCallback(async (userId: string) => {
    try {
      const profileRef = doc(db, "profiles", userId);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const data = profileSnap.data() as FirestoreProfile;
        setIsAdmin(data.role === "admin");
      } else {
        // 프로필 문서가 없으면 일반 사용자로 처리
        setIsAdmin(false);
      }
    } catch (err) {
      console.error("[관리자 확인 예외]", err);
      setIsAdmin(false);
    }
  }, []);

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
          // Google 계정 여부 감지
          const isGoogle = firebaseUser.providerData.some(
            (p) => p.providerId === "google.com"
          );
          setIsGoogleUser(isGoogle);

          // 캐릭터 확인 + 관리자 확인을 병렬 실행 후 로딩 종료 (race condition 방지)
          Promise.all([
            checkHasCharacter(firebaseUser.uid),
            checkIsAdmin(firebaseUser.uid),
          ]).then(() => {
            setLoading(false);
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
          });
        } else {
          setHasCharacter(false);
          setIsAdmin(false);
          setIsGoogleUser(false);
          setLoading(false);
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
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
  }, [checkHasCharacter, checkIsAdmin]);

  // 회원가입
  const signUp = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error: string | null; emailSent?: boolean }> => {
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

        // 인증 메일 발송 (실패해도 회원가입은 정상 진행)
        let emailSent = false;
        try {
          await sendEmailVerification(newUser);
          emailSent = true;
        } catch (emailError) {
          console.error("인증 메일 발송 오류:", emailError);
        }

        return { error: null, emailSent };
      } catch (err) {
        return {
          error:
            err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다.",
        };
      }
    },
    []
  );

  // 인증 메일 재발송
  const resendVerificationEmail = useCallback(async (): Promise<{
    error: string | null;
  }> => {
    if (!user) {
      return { error: "로그인된 사용자가 없습니다." };
    }
    try {
      await sendEmailVerification(user);
      return { error: null };
    } catch (err) {
      // rate limit 에러 처리
      const firebaseCode = (err as { code?: string }).code;
      if (firebaseCode === "auth/too-many-requests") {
        return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };
      }
      return {
        error:
          err instanceof Error
            ? err.message
            : "인증 메일 발송 중 오류가 발생했습니다.",
      };
    }
  }, [user]);

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

  // Google 로그인
  const signInWithGoogle = useCallback(async (): Promise<{
    error: string | null;
  }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      // 프로필이 없으면 생성 (첫 Google 로그인 사용자)
      const profileRef = doc(db, "profiles", googleUser.uid);
      const profileSnap = await getDoc(profileRef);
      if (!profileSnap.exists()) {
        await setDoc(profileRef, {
          userId: googleUser.uid,
          displayName: googleUser.displayName || null,
          createdAt: serverTimestamp(),
        });
      }

      return { error: null };
    } catch (err) {
      const firebaseCode = (err as { code?: string }).code;
      // 사용자가 팝업을 닫은 경우 — 오류가 아님
      if (firebaseCode === "auth/popup-closed-by-user") {
        return { error: null };
      }
      if (firebaseCode === "auth/popup-blocked") {
        return { error: "팝업이 차단되었습니다. 팝업 차단을 해제해주세요." };
      }
      return {
        error:
          err instanceof Error
            ? err.message
            : "Google 로그인 중 오류가 발생했습니다.",
      };
    }
  }, []);

  // 로그아웃
  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setHasCharacter(false);
    setIsAdmin(false);
    setIsGoogleUser(false);
  }, []);

  // 회원 탈퇴: 재인증 → Firestore 데이터 삭제 → Auth 계정 삭제
  const deleteAccount = useCallback(
    async (password?: string): Promise<{ error: string | null }> => {
      if (!user) {
        return { error: "로그인된 사용자가 없습니다." };
      }

      try {
        // 1. 재인증: Google 사용자는 팝업, 이메일 사용자는 비밀번호
        const isGoogle = user.providerData.some(
          (p) => p.providerId === "google.com"
        );

        if (isGoogle) {
          await reauthenticateWithPopup(user, googleProvider);
        } else {
          if (!password || !user.email) {
            return { error: "비밀번호를 입력해주세요." };
          }
          const credential = EmailAuthProvider.credential(
            user.email,
            password
          );
          await reauthenticateWithCredential(user, credential);
        }

        // 2. mood_entries 컬렉션에서 본인 문서 전체 삭제
        const moodQuery = query(
          collection(db, "mood_entries"),
          where("userId", "==", user.uid)
        );
        const moodSnapshot = await getDocs(moodQuery);
        const moodDeletes = moodSnapshot.docs.map((docSnap) =>
          deleteDoc(docSnap.ref)
        );
        await Promise.all(moodDeletes);

        // 3. characters 컬렉션에서 본인 문서 전체 삭제
        const charQuery = query(
          collection(db, "characters"),
          where("userId", "==", user.uid)
        );
        const charSnapshot = await getDocs(charQuery);
        const charDeletes = charSnapshot.docs.map((docSnap) =>
          deleteDoc(docSnap.ref)
        );
        await Promise.all(charDeletes);

        // 4. profiles/{uid} 문서 삭제
        await deleteDoc(doc(db, "profiles", user.uid));

        // 5. Firebase Auth 계정 삭제
        await deleteUser(user);

        // 6. 로컬 상태 초기화 (onAuthStateChanged가 자동으로 발생하지만 명시적 초기화)
        setUser(null);
        setHasCharacter(false);
        setIsAdmin(false);
        setIsGoogleUser(false);

        return { error: null };
      } catch (err) {
        const firebaseCode = (err as { code?: string }).code;

        // 잘못된 비밀번호
        if (
          firebaseCode === "auth/wrong-password" ||
          firebaseCode === "auth/invalid-credential"
        ) {
          return { error: "비밀번호가 올바르지 않습니다." };
        }

        // 너무 많은 요청
        if (firebaseCode === "auth/too-many-requests") {
          return { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };
        }

        return {
          error:
            err instanceof Error
              ? err.message
              : "회원 탈퇴 중 오류가 발생했습니다.",
        };
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasCharacter,
        isAdmin,
        authError,
        signUp,
        signIn,
        signInWithGoogle,
        isGoogleUser,
        signOut,
        refreshHasCharacter,
        resendVerificationEmail,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
