"use client";

/**
 * 관리자 계정 초기 설정 페이지
 * 최초 1회 관리자 계정을 생성하기 위한 임시 페이지이다.
 * 사용 후 삭제할 것.
 */
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase";

/** 관리자 계정 기본 정보 */
const ADMIN_EMAIL = "aec@aec.com";
const ADMIN_PASSWORD = "123456";

type SetupStatus = "idle" | "loading" | "success" | "error";

export default function AdminSetupPage() {
  const [status, setStatus] = useState<SetupStatus>("idle");
  const [message, setMessage] = useState("");

  /** 관리자 계정 생성 처리 */
  const handleCreateAdmin = async () => {
    setStatus("loading");
    setMessage("");

    try {
      // 1. Firebase Auth에 사용자 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        ADMIN_EMAIL,
        ADMIN_PASSWORD
      );
      const newUser = userCredential.user;

      // 2. Firestore profiles 컬렉션에 관리자 프로필 문서 생성
      await setDoc(doc(db, "profiles", newUser.uid), {
        userId: newUser.uid,
        displayName: "관리자",
        role: "admin",
        createdAt: serverTimestamp(),
      });

      setStatus("success");
      setMessage(
        `관리자 계정이 생성되었습니다.\n이메일: ${ADMIN_EMAIL}\nUID: ${newUser.uid}`
      );
    } catch (err) {
      setStatus("error");

      // 이미 등록된 이메일인 경우 처리
      const firebaseCode = (err as { code?: string }).code;
      if (firebaseCode === "auth/email-already-in-use") {
        setMessage(
          `이미 등록된 이메일입니다: ${ADMIN_EMAIL}\n기존 계정으로 로그인해 주세요.`
        );
      } else if (firebaseCode === "auth/weak-password") {
        setMessage("비밀번호가 너무 짧습니다. Firebase에서 최소 6자를 요구합니다.");
      } else {
        setMessage(
          err instanceof Error
            ? err.message
            : "관리자 계정 생성 중 오류가 발생했습니다."
        );
      }
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            관리자 계정 초기 설정
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            최초 1회 실행 후 이 페이지를 삭제하세요
          </p>
        </div>

        {/* 설정 카드 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* 계정 정보 표시 */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">이메일:</span> {ADMIN_EMAIL}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">비밀번호:</span> {ADMIN_PASSWORD}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">역할:</span> admin
            </p>
          </div>

          {/* 생성 버튼 */}
          <button
            onClick={handleCreateAdmin}
            disabled={status === "loading" || status === "success"}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
              status === "success"
                ? "bg-green-500 cursor-not-allowed"
                : status === "loading"
                  ? "bg-blue-300 cursor-wait"
                  : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
            }`}
          >
            {status === "loading"
              ? "생성 중..."
              : status === "success"
                ? "생성 완료"
                : "관리자 계정 생성"}
          </button>

          {/* 결과 메시지 */}
          {message && (
            <div
              className={`mt-4 p-4 rounded-lg text-sm whitespace-pre-line ${
                status === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          {/* 안내 문구 */}
          {status === "success" && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700 font-medium mb-1">
                다음 단계
              </p>
              <ol className="text-sm text-yellow-600 list-decimal list-inside space-y-1">
                <li>이 페이지의 소스 파일을 삭제하세요</li>
                <li>
                  경로: <code className="text-xs bg-yellow-100 px-1 rounded">src/app/admin-setup/</code>
                </li>
                <li>위 이메일과 비밀번호로 로그인하세요</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
