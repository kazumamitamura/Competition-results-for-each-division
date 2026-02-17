"use client";

import { createClient } from "@/lib/supabase/client";
import type { MpUserRole } from "./types";

export async function mpSignIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { error: error.message };
  return { data };
}

export async function mpSignUp(payload: {
  email: string;
  password: string;
  full_name: string;
  role: MpUserRole;
}) {
  const supabase = createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: { emailRedirectTo: undefined },
  });

  if (authError) return { error: authError.message };
  const user = authData.user;
  if (!user) return { error: "サインアップに失敗しました" };

  const { error: profileError } = await supabase.from("mp_user_profiles").insert({
    id: user.id,
    email: payload.email,
    full_name: payload.full_name,
    role: payload.role,
  });

  if (profileError) {
    return {
      error: `アカウントは作成されましたが、プロフィールの保存に失敗しました: ${profileError.message}`,
    };
  }

  return { data: authData };
}

export async function mpSignOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
