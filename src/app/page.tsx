import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MpSignOutButton } from "@/features/mp_auth";
import { mpGetCurrentProfile } from "@/features/mp_auth/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await mpGetCurrentProfile();
  const assignedClub = profile?.assigned_club ?? "未設定";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="text-center space-y-1">
        <p className="text-neutral-600">
          ログイン中: <strong className="text-neutral-900">{user.email}</strong>
        </p>
        <p className="text-neutral-600">
          担当部活: <strong className="text-neutral-900">{assignedClub}</strong>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/mp_competition_results"
          className="rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          大会成績入力システムを開く
        </Link>
        <MpSignOutButton />
        <Link
          href="/login"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
        >
          別アカウントでログイン
        </Link>
      </div>
    </main>
  );
}
