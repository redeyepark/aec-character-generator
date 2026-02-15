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
  const { user, loading } = useAuth();

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

  // 미인증 상태에서는 아무것도 렌더링하지 않음 (리다이렉트 대기)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
