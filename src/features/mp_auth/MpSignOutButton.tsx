"use client";

import { mpSignOut } from "./actions";

export function MpSignOutButton() {
  async function handleSignOut() {
    await mpSignOut();
    window.location.href = "/login";
  }
  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
    >
      ログアウト
    </button>
  );
}
