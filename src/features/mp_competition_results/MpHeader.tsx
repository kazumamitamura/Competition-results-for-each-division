"use client";

import Link from "next/link";
import { MpSignOutButton } from "@/features/mp_auth";
import { MpNotificationBell } from "./MpNotificationBell";

interface MpHeaderProps {
  /** ログイン済みの場合 true。このときのみナビリンク・通知ベル・ログアウトを表示 */
  isLoggedIn: boolean;
  /** ログイン済み時の表示用メール（任意） */
  userEmail?: string;
}

export function MpHeader({ isLoggedIn, userEmail }: MpHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-lg font-semibold text-neutral-900 hover:text-neutral-700"
          >
            Master-Portfolio-DB
          </Link>
          {isLoggedIn && (
            <nav className="hidden sm:flex items-center gap-1" aria-label="メイン">
              <Link
                href="/mp_competition_results"
                className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
              >
                大会成績入力
              </Link>
              <Link
                href="/mp_dashboard"
                className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
              >
                ダッシュボード
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn && (
            <>
              <nav className="flex sm:hidden">
                <Link
                  href="/mp_competition_results"
                  className="rounded-md px-2 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
                >
                  成績入力
                </Link>
                <Link
                  href="/mp_dashboard"
                  className="rounded-md px-2 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
                >
                  ダッシュボード
                </Link>
              </nav>
              <MpNotificationBell />
              {userEmail && (
                <span className="hidden md:inline text-sm text-neutral-500 truncate max-w-[180px]">
                  {userEmail}
                </span>
              )}
              <MpSignOutButton />
            </>
          )}
          {!isLoggedIn && (
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
