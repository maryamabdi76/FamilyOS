"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthActionState } from "@/features/auth/actions";

const initialState: AuthActionState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-xl font-semibold">ورود</h1>
      <form action={formAction} className="flex flex-col gap-4">
        <input
          name="email"
          type="email"
          placeholder="ایمیل"
          required
          className="rounded-md border border-border bg-transparent px-3 py-2"
        />
        <input
          name="password"
          type="password"
          placeholder="رمز عبور"
          required
          className="rounded-md border border-border bg-transparent px-3 py-2"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-3 py-2 text-white disabled:opacity-60"
        >
          {pending ? "در حال ورود..." : "ورود"}
        </button>
      </form>
      <div className="flex justify-between text-sm text-muted">
        <Link href="/forgot-password">رمز عبور را فراموش کرده‌اید؟</Link>
        <Link href="/signup">ساخت حساب جدید</Link>
      </div>
    </main>
  );
}
