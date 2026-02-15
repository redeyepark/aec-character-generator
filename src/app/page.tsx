"use client";

/**
 * 랜딩 페이지
 * 서비스 소개와 시작하기 CTA를 제공한다.
 * 로그인된 사용자는 캐릭터 보유 여부에 따라 자동 리다이렉트한다.
 * - 캐릭터 없음: /create/ (캐릭터 생성 위자드)
 * - 캐릭터 있음: /mood/ (일일 기분 선택 메인 화면)
 * 비로그인 사용자에게는 서비스 소개 랜딩 페이지를 표시한다.
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";

// 기능 소개 카드 데이터
const FEATURE_CARDS = [
  {
    title: "캐릭터 생성",
    description: "얼굴, 헤어, 수염, 안경을 조합하여 나만의 캐릭터를 만들어보세요.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    title: "기분 표현",
    description: "매일 오늘의 기분에 맞는 표정과 의상을 선택하여 캐릭터로 표현하세요.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
      </svg>
    ),
  },
  {
    title: "무드 다이어리",
    description: "달력으로 기분 기록을 돌아보고, 캐릭터 이미지를 다운로드하세요.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
] as const;

export default function Home() {
  const { user, loading, hasCharacter, refreshHasCharacter } = useAuth();
  const [characterChecked, setCharacterChecked] = useState(false);

  // 로그인 상태 확인 후 캐릭터 보유 여부를 확실히 확인한다.
  // AuthContext에서 loading이 false가 되는 시점에 hasCharacter 확인이
  // 아직 완료되지 않았을 수 있으므로, refreshHasCharacter를 호출하여
  // 캐릭터 확인 완료를 보장한 뒤 리다이렉트한다.
  useEffect(() => {
    if (!loading && user) {
      refreshHasCharacter().then(() => {
        setCharacterChecked(true);
      });
    }
  }, [loading, user, refreshHasCharacter]);

  // 캐릭터 확인 완료 후 리다이렉트
  useEffect(() => {
    if (characterChecked && user) {
      window.location.href = hasCharacter ? "/mood/" : "/create/";
    }
  }, [characterChecked, user, hasCharacter]);

  // 로딩 중이거나 로그인된 사용자 (리다이렉트 대기)
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"
            aria-hidden="true"
          />
          <span className="text-sm text-gray-500">
            {loading ? "로딩 중..." : "페이지 이동 중..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {/* 히어로 섹션 */}
      <section className="px-4 py-16 md:py-24 text-center bg-gradient-to-b from-blue-50 to-gray-50">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
            오늘의 나를 표현하세요
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600 leading-relaxed">
            나만의 캐릭터를 만들고, 매일 기분에 맞는 표정과 의상으로
            <br className="hidden md:block" />
            오늘 하루를 기록해보세요.
          </p>

          {/* CTA 버튼 */}
          <div className="mt-8">
            <a
              href="/login/"
              className="inline-block px-8 py-3.5 rounded-xl text-lg font-semibold
                         bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700
                         transition-all duration-150 shadow-lg shadow-blue-200
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              시작하기
            </a>
          </div>
        </div>
      </section>

      {/* 기능 소개 섹션 */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-10">
            이렇게 사용해요
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURE_CARDS.map((card, index) => (
              <div
                key={card.title}
                className="bg-white rounded-xl border border-gray-200 p-6
                           hover:shadow-lg hover:border-gray-300
                           transition-all duration-200"
              >
                {/* 스텝 번호 */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600
                                   flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <div className="text-blue-500">
                    {card.icon}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="px-4 py-8 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">
          AEC Character Generator
        </p>
      </footer>
    </main>
  );
}
