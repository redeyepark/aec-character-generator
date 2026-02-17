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
  const { signIn, signUp, signInWithGoogle, resendVerificationEmail } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  /** 회원가입 시 인증 메일 발송 성공 여부 */
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  /** 인증 메일 재발송 중 여부 */
  const [isResending, setIsResending] = useState(false);
  /** 재발송 결과 메시지 */
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // 폼 유효성 검사
  const isFormValid = email.trim().length > 0 && password.length >= 6;

  // 탭 전환 핸들러
  const handleTabChange = useCallback((tab: AuthTab) => {
    setActiveTab(tab);
    setError(null);
    setSignUpSuccess(false);
    setEmailSent(null);
    setResendMessage(null);
  }, []);

  // Google 로그인 핸들러
  const handleGoogleSignIn = useCallback(async () => {
    setIsGoogleLoading(true);
    setError(null);
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error);
    } else {
      window.location.href = "/";
    }
    setIsGoogleLoading(false);
  }, [signInWithGoogle]);

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
          setEmailSent(result.emailSent ?? null);
          setResendMessage(null);
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

      {/* Google 로그인 버튼 */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isSubmitting}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-lg
                   border border-gray-300 bg-white hover:bg-gray-50
                   text-gray-700 font-medium transition-all duration-150
                   focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {/* Google "G" 로고 SVG */}
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
          <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9.003 18z" fill="#34A853"/>
          <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
        </svg>
        {isGoogleLoading ? "Google 로그인 중..." : "Google로 계속하기"}
      </button>

      {/* 구분선 */}
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-400">또는</span>
        </div>
      </div>

      {/* 회원가입 성공 메시지 */}
      {signUpSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm">
          <p className="text-green-700">
            {emailSent === false
              ? "회원가입이 완료되었습니다. 인증 메일 발송에 실패했습니다. 아래 버튼을 눌러 재발송해주세요."
              : "회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요."}
          </p>
          {/* 재발송 결과 메시지 */}
          {resendMessage && (
            <p
              className={`mt-1 text-xs ${
                resendMessage.includes("재발송되었습니다")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {resendMessage}
            </p>
          )}
          {/* 인증 메일 재발송 버튼 */}
          <button
            type="button"
            disabled={isResending}
            onClick={async () => {
              setIsResending(true);
              setResendMessage(null);
              const result = await resendVerificationEmail();
              if (result.error) {
                setResendMessage(result.error);
              } else {
                setResendMessage("인증 메일이 재발송되었습니다.");
                setEmailSent(true);
              }
              setIsResending(false);
            }}
            className="mt-2 text-sm text-blue-600 underline hover:text-blue-800 disabled:text-gray-400 disabled:no-underline"
          >
            {isResending ? "발송 중..." : "인증 메일 재발송"}
          </button>
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
