"use client";

/**
 * 인증 훅
 * AuthContext를 소비하여 인증 상태와 메서드를 반환한다.
 */
import { useContext } from "react";
import { AuthContext, type AuthContextType } from "@/app/contexts/AuthContext";

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth는 AuthProvider 내부에서만 사용 가능합니다.");
  }
  return context;
}
