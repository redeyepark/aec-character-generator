"use client";

/**
 * 설정 페이지
 * 사주 정보 입력 및 관리 기능을 제공한다.
 */
import AuthGuard from "@/app/components/AuthGuard";
import BirthInfoForm from "@/app/components/BirthInfoForm";
import { useBirthInfo } from "@/app/hooks/useBirthInfo";

function SettingsPageContent() {
  const { birthInfo, loading, saveBirthInfo } = useBirthInfo();

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* 헤더 */}
      <header className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          설정
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          사주 정보를 입력하면 매일 운세와 행운 색상을 확인할 수 있습니다.
        </p>
      </header>

      <div className="max-w-lg mx-auto flex flex-col gap-6">
        {/* 사주 정보 섹션 */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            사주 정보
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-500">로딩 중...</span>
              </div>
            </div>
          ) : (
            <BirthInfoForm
              initialBirthInfo={birthInfo}
              onSave={saveBirthInfo}
            />
          )}
        </section>

        {/* 기분 페이지로 이동 링크 */}
        <a
          href="/mood"
          className="block w-full py-3 text-center text-sm font-medium rounded-xl
                     border border-gray-300 text-gray-600 bg-white hover:bg-gray-50
                     transition-all duration-150
                     focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
          오늘의 기분 페이지로 돌아가기
        </a>
      </div>
    </main>
  );
}

// AuthGuard로 래핑
export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsPageContent />
    </AuthGuard>
  );
}
