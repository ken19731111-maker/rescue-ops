import type { Metadata, Viewport } from "next"; // ← Viewport を追加
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RescueOps - 動物保護活動支援",
  description: "ボランティア支援・経費精算プラットフォーム",
  manifest: "/manifest.json",
  // ❌ ここにあった themeColor は削除する
};

// ✅ ここに新しい viewport エクスポートを追加
export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ja" // 日本語アプリなので "ja" に変更するのもおすすめです！
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}