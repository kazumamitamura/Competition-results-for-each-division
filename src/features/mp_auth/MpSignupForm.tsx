"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mpSignupSchema, type MpSignupInput } from "./schemas";
import { mpSignUp } from "./actions";
import Link from "next/link";
import { useState } from "react";

const ROLE_LABELS: Record<MpSignupInput["role"], string> = {
  admin: "管理者",
  teacher: "教員",
  student: "生徒",
};

export function MpSignupForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MpSignupInput>({
    resolver: zodResolver(mpSignupSchema),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      role: "student",
    },
  });

  async function onSubmit(data: MpSignupInput) {
    setSubmitError(null);
    const result = await mpSignUp(data);
    if (result.error) {
      setSubmitError(result.error);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-900">登録完了</h1>
        <p className="mt-2 text-sm text-neutral-600">
          アカウントが作成されました。メールアドレス確認が必要な場合は、メールのリンクから確認してください。ログイン画面からログインできます。
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          ログインへ
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-neutral-900">新規登録</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Master-Portfolio-DB のアカウントを作成
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {submitError && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {submitError}
          </div>
        )}
        <div>
          <label
            htmlFor="mp-signup-email"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            メールアドレス
          </label>
          <input
            id="mp-signup-email"
            type="email"
            autoComplete="email"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="mp-signup-password"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            パスワード
          </label>
          <input
            id="mp-signup-password"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="mp-signup-full_name"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            氏名
          </label>
          <input
            id="mp-signup-full_name"
            type="text"
            autoComplete="name"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...register("full_name")}
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600">
              {errors.full_name.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="mp-signup-role"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            権限
          </label>
          <select
            id="mp-signup-role"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...register("role")}
          >
            {(Object.keys(ROLE_LABELS) as Array<MpSignupInput["role"]>).map(
              (role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              )
            )}
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? "登録中…" : "登録する"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-neutral-600">
        すでにアカウントをお持ちの方は{" "}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          ログイン
        </Link>
      </p>
    </div>
  );
}
