"use client";

/**
 * 클라이언트 레이아웃 래퍼
 * AuthProvider와 NavBar를 포함하는 클라이언트 컴포넌트.
 * 서버 컴포넌트인 RootLayout에서 사용한다.
 */
import type { ReactNode } from "react";
import { AuthProvider } from "@/app/contexts/AuthContext";
import NavBar from "@/app/components/NavBar";

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AuthProvider>
      <NavBar />
      {children}
    </AuthProvider>
  );
}
