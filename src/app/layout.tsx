import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MpHeader } from "@/features/mp_competition_results/MpHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Master-Portfolio-DB",
  description: "Master Portfolio 認証・管理",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="ja">
      <body className="antialiased min-h-screen bg-neutral-50 text-neutral-900">
        <MpHeader isLoggedIn={!!user} userEmail={user?.email ?? undefined} />
        <main>{children}</main>
      </body>
    </html>
  );
}
