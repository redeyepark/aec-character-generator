"use client";

/**
 * 인증 가드 컴포넌트
 * 로그인되지 않은 사용자를 /login/ 페이지로 리다이렉트한다.
 * 로딩 중에는 스피너를 표시한다.
 */
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/app/hooks/useAuth";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, authError } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login/";
    }
  }, [user, loading]);

  // 로딩 중 스피너 표시
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"
            aria-hidden="true"
          />
          <span className="text-sm text-gray-500">로딩 중...</span>
        </div>
      </div>
    );
  }

  // 인증 오류 발생 시 에러 메시지와 재시도 버튼 표시
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md mx-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <h2 className="text-lg font-semibold text-red-700 mb-2">
              인증 오류
            </h2>
            <p className="text-sm text-red-600 mb-4">
              {authError}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-block px-6 py-2.5 rounded-lg text-sm font-semibold
                         bg-red-600 text-white hover:bg-red-700 active:bg-red-800
                         transition-colors duration-150
                         focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 미인증 상태에서는 아무것도 렌더링하지 않음 (리다이렉트 대기)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
