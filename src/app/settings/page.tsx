"use client";

/**
 * 설정 페이지
 * 사주 정보 입력 및 관리, 회원 탈퇴 기능을 제공한다.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/app/components/AuthGuard";
import BirthInfoForm from "@/app/components/BirthInfoForm";
import { useBirthInfo } from "@/app/hooks/useBirthInfo";
import { useAuth } from "@/app/hooks/useAuth";

function SettingsPageContent() {
  const { birthInfo, loading, saveBirthInfo } = useBirthInfo();
  const { deleteAccount } = useAuth();
  const router = useRouter();

  // 회원 탈퇴 관련 상태
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 회원 탈퇴 처리
  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError("비밀번호를 입력해주세요.");
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    const result = await deleteAccount(deletePassword);

    if (result.error) {
      setDeleteError(result.error);
      setDeleting(false);
    } else {
      // 탈퇴 성공 시 로그인 페이지로 이동
      router.push("/login");
    }
  };

  // 탈퇴 다이얼로그 닫기 (상태 초기화)
  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeletePassword("");
    setDeleteError(null);
  };

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

        {/* 회원 탈퇴 섹션 */}
        <section className="bg-white rounded-xl border-2 border-red-300 p-5">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            회원 탈퇴
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="w-full py-2.5 text-sm font-medium rounded-xl
                       border border-red-400 text-red-600 bg-white hover:bg-red-50
                       transition-all duration-150
                       focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
          >
            회원 탈퇴
          </button>
        </section>
      </div>

      {/* 회원 탈퇴 확인 다이얼로그 */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="w-full max-w-sm bg-[#F5F4F1] rounded-xl shadow-xl p-6">
            <h3
              id="delete-dialog-title"
              className="text-lg font-semibold text-red-600 mb-3"
            >
              회원 탈퇴 확인
            </h3>

            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              정말 탈퇴하시겠습니까? 모든 캐릭터와 기분 일기 데이터가
              삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>

            {/* 비밀번호 확인 입력 */}
            <div className="mb-4">
              <label
                htmlFor="delete-password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                비밀번호 확인
              </label>
              <input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !deleting) {
                    handleDeleteAccount();
                  }
                }}
                disabled={deleting}
                placeholder="현재 비밀번호를 입력하세요"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300
                           bg-white text-gray-800 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400
                           disabled:opacity-50 disabled:cursor-not-allowed"
                autoComplete="current-password"
              />
            </div>

            {/* 오류 메시지 */}
            {deleteError && (
              <p className="text-sm text-red-600 mb-4" role="alert">
                {deleteError}
              </p>
            )}

            {/* 버튼 그룹 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl
                           border border-gray-300 text-gray-600 bg-white hover:bg-gray-50
                           transition-all duration-150
                           focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl
                           border border-red-500 text-white bg-red-500 hover:bg-red-600
                           transition-all duration-150
                           focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "탈퇴 처리 중..." : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}
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
