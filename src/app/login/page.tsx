"use client";

/**
 * 로그인 페이지
 * 이미 로그인된 사용자는 /mood/ 또는 /create/로 리다이렉트한다.
 */
import { useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import AuthForm from "@/app/components/AuthForm";

export default function LoginPage() {
  const { user, loading, hasCharacter, authError } = useAuth();

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (!loading && user) {
      window.location.href = hasCharacter ? "/mood/" : "/create/";
    }
  }, [user, loading, hasCharacter]);

  // 로딩 중이거나 이미 로그인된 경우
  // 인증 오류 시에는 로그인 폼을 표시하여 사용자가 직접 로그인 시도 가능하게 한다.
  if (loading || (user && !authError)) {
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        {/* 인증 오류 경고 배너 */}
        {authError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">
              {authError}
            </p>
          </div>
        )}

        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            AEC Character Generator
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            나만의 캐릭터로 오늘의 기분을 표현하세요
          </p>
        </div>

        {/* 인증 폼 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <AuthForm />
        </div>
      </div>
    </main>
  );
}
