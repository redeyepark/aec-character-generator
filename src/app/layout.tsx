import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/app/components/ClientLayout";

// 메타데이터 정의
export const metadata: Metadata = {
  title: "AEC Character Generator",
  description: "나만의 캐릭터로 오늘의 기분을 표현하는 무드 다이어리",
};

// 루트 레이아웃
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-gray-50 min-h-screen">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
