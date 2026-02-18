import Link from "next/link";
import { MpStudentSelectionProvider } from "@/features/mp_competition_results/MpStudentSelectionContext";
import { MpResultForm } from "@/features/mp_competition_results/MpResultForm";
import { MpStudentSidebar } from "@/features/mp_competition_results/MpStudentSidebar";
import { getUniqueClubNames } from "@/features/mp_competition_results/actions/mpUserActions";
import { mpGetCurrentProfile } from "@/features/mp_auth/server";
import { redirect } from "next/navigation";

export default async function MpCompetitionResultsPage() {
  const profile = await mpGetCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.assigned_club) {
    return (
      <div className="mp-app-container mp-competition-results-page">
        <header className="mp-competition-results-header">
          <Link href="/" className="mp-competition-results-back">
            &lt; ホームに戻る
          </Link>
        </header>
        <div className="mp-competition-results-error">
          担当部活が設定されていません。ホームで担当する部活動を選択してください。
        </div>
      </div>
    );
  }

  const clubOptions = await getUniqueClubNames();

  return (
    <MpStudentSelectionProvider>
      <div className="mp-app-container mp-competition-results-page">
        <header className="mp-competition-results-header">
          <Link href="/" className="mp-competition-results-back">
            &lt; ホームに戻る
          </Link>
        </header>
        <div className="mp-competition-results-layout">
          <main className="mp-competition-results-main">
            <MpResultForm />
          </main>
          <aside className="mp-competition-results-sidebar">
            <MpStudentSidebar
              clubOptions={clubOptions}
              assignedClub={profile.assigned_club}
            />
          </aside>
        </div>
      </div>
    </MpStudentSelectionProvider>
  );
}
