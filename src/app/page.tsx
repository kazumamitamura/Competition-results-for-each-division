import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MpSignOutButton } from "@/features/mp_auth";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <p className="text-neutral-600">
        ログイン中: <strong>{user.email}</strong>
      </p>
      <div className="flex gap-2">
        <MpSignOutButton />
        <Link
          href="/login"
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
        >
          別アカウントでログイン
        </Link>
      </div>
    </main>
  );
}
