"use client";

/**
 * 인증 폼 컴포넌트
 * 로그인/회원가입 탭 전환 방식의 인증 폼을 제공한다.
 * 이메일 + 비밀번호 인증을 사용한다.
 */
import { useState, useCallback, type FormEvent } from "react";
import { useAuth } from "@/app/hooks/useAuth";

type AuthTab = "login" | "signup";

export default function AuthForm() {
  const { signIn, signUp } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  // 폼 유효성 검사
  const isFormValid = email.trim().length > 0 && password.length >= 6;

  // 탭 전환 핸들러
  const handleTabChange = useCallback((tab: AuthTab) => {
    setActiveTab(tab);
    setError(null);
    setSignUpSuccess(false);
  }, []);

  // 폼 제출 핸들러
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!isFormValid || isSubmitting) return;

      setIsSubmitting(true);
      setError(null);

      if (activeTab === "login") {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error);
          setIsSubmitting(false);
        } else {
          // 로그인 성공: 루트 페이지에서 캐릭터 확인 후 적절한 경로로 리다이렉트
          window.location.href = "/";
        }
      } else {
        const result = await signUp(email, password);
        if (result.error) {
          setError(result.error);
          setIsSubmitting(false);
        } else {
          setSignUpSuccess(true);
          setIsSubmitting(false);
        }
      }
    },
    [activeTab, email, password, isFormValid, isSubmitting, signIn, signUp]
  );

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 탭 헤더 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => handleTabChange("login")}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === "login"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("signup")}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === "signup"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          회원가입
        </button>
      </div>

      {/* 회원가입 성공 메시지 */}
      {signUpSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          {error}
        </div>
      )}

      {/* 인증 폼 */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="auth-email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            이메일
          </label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            required
            autoComplete="email"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                       text-gray-900 placeholder-gray-400"
          />
        </div>

        <div>
          <label
            htmlFor="auth-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            비밀번호
          </label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6자 이상 입력"
            required
            minLength={6}
            autoComplete={activeTab === "login" ? "current-password" : "new-password"}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                       text-gray-900 placeholder-gray-400"
          />
        </div>

        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className={`w-full py-3 rounded-lg font-medium text-white transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
            ${
              !isFormValid || isSubmitting
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 cursor-pointer"
            }`}
        >
          {isSubmitting
            ? "처리 중..."
            : activeTab === "login"
              ? "로그인"
              : "회원가입"}
        </button>
      </form>
    </div>
  );
}
