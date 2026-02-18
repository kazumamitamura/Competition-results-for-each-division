import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { mpGetCurrentProfile } from "@/features/mp_auth/server";
import { MpClubSelection } from "@/features/mp_competition_results/MpClubSelection";
import { getUniqueClubNames } from "@/features/mp_competition_results/actions/mpUserActions";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await mpGetCurrentProfile();
  const clubNames = await getUniqueClubNames();

  return (
    <MpClubSelection
      initialAssignedClub={profile?.assigned_club ?? null}
      clubNames={clubNames}
      userEmail={user.email ?? ""}
    />
  );
}
