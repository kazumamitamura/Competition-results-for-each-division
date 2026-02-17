import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Master-Portfolio-DB",
  description: "Master Portfolio 認証・管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen bg-neutral-50 text-neutral-900">
        {children}
      </body>
    </html>
  );
}
