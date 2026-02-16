"use client";

/**
 * 내비게이션 바 컴포넌트
 * 인증된 사용자에게만 표시된다.
 * 모바일에서는 햄버거 메뉴로 토글된다.
 */
import { useState, useCallback } from "react";
import { useAuth } from "@/app/hooks/useAuth";

// 네비게이션 링크 목록
const NAV_LINKS = [
  { href: "/mood/", label: "오늘의 기분" },
  { href: "/diary/", label: "다이어리" },
] as const;

export default function NavBar() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 로그아웃 핸들러
  const handleSignOut = useCallback(async () => {
    await signOut();
    window.location.href = "/";
  }, [signOut]);

  // 메뉴 토글
  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  // 미인증 상태에서는 렌더링하지 않음
  if (!user) return null;

  // 현재 경로 확인 (활성 링크 하이라이트용)
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* 로고 */}
          <span
            onClick={() => { window.location.href = "/"; }}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") window.location.href = "/"; }}
            className="text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors cursor-pointer"
          >
            AEC
          </span>

          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = currentPath === link.href || currentPath === link.href.slice(0, -1);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
            <button
              type="button"
              onClick={handleSignOut}
              className="ml-3 px-3 py-2 rounded-md text-sm font-medium
                         text-gray-500 hover:bg-gray-100 hover:text-gray-700
                         transition-colors cursor-pointer"
            >
              로그아웃
            </button>
          </div>

          {/* 모바일 햄버거 버튼 */}
          <button
            type="button"
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
            aria-label="메뉴 열기"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              // X 아이콘
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // 햄버거 아이콘
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-2">
            {NAV_LINKS.map((link) => {
              const isActive = currentPath === link.href || currentPath === link.href.slice(0, -1);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-medium
                         text-gray-500 hover:bg-gray-100 hover:text-gray-700
                         transition-colors cursor-pointer"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
