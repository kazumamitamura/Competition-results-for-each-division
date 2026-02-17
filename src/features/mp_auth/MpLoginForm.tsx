"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mpLoginSchema, type MpLoginInput } from "./schemas";
import { mpSignIn } from "./actions";
import Link from "next/link";
import { useState } from "react";

export function MpLoginForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MpLoginInput>({
    resolver: zodResolver(mpLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: MpLoginInput) {
    setSubmitError(null);
    const result = await mpSignIn(data.email, data.password);
    if (result.error) {
      setSubmitError(result.error);
      return;
    }
    window.location.href = "/";
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-neutral-900">ログイン</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Master-Portfolio-DB にログイン
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
            htmlFor="mp-login-email"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            メールアドレス
          </label>
          <input
            id="mp-login-email"
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
            htmlFor="mp-login-password"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            パスワード
          </label>
          <input
            id="mp-login-password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? "ログイン中…" : "ログイン"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-neutral-600">
        アカウントをお持ちでない方は{" "}
        <Link
          href="/signup"
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          新規登録
        </Link>
      </p>
    </div>
  );
}
