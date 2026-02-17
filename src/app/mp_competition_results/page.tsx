import { MpStudentSelectionProvider } from "@/features/mp_competition_results/MpStudentSelectionContext";
import { MpResultForm } from "@/features/mp_competition_results/MpResultForm";
import { MpStudentSidebar } from "@/features/mp_competition_results/MpStudentSidebar";
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
        <div className="mp-competition-results-error">
          担当部活が設定されていません。プロフィールで設定してください。
        </div>
      </div>
    );
  }

  return (
    <MpStudentSelectionProvider>
      <div className="mp-app-container mp-competition-results-page">
        <div className="mp-competition-results-layout">
          <main className="mp-competition-results-main">
            <MpResultForm />
          </main>
          <aside className="mp-competition-results-sidebar">
            <MpStudentSidebar />
          </aside>
        </div>
      </div>
    </MpStudentSelectionProvider>
  );
}
