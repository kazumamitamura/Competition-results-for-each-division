import Link from "next/link";
import { mpGetCurrentProfile } from "@/features/mp_auth/server";
import { redirect } from "next/navigation";
import { getUniqueClubNames } from "@/features/mp_competition_results/actions/mpUserActions";
import { MpDashboardClient } from "@/features/mp_competition_results/MpDashboardClient";

export default async function MpDashboardPage() {
  const profile = await mpGetCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const clubOptions = await getUniqueClubNames();

  return (
    <div className="mp-app-container mp-dashboard-page">
      <header className="mp-dashboard-header">
        <Link href="/" className="mp-dashboard-back">
          &lt; ホームに戻る
        </Link>
        <h1 className="mp-dashboard-title">大会成績管理ダッシュボード</h1>
      </header>
      <MpDashboardClient clubOptions={clubOptions} />
    </div>
  );
}
