"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthActionState } from "@/features/auth/actions";

const initialState: AuthActionState = {};

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-xl font-semibold">ساخت حساب</h1>
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
          placeholder="رمز عبور (حداقل ۸ کاراکتر)"
          required
          minLength={8}
          className="rounded-md border border-border bg-transparent px-3 py-2"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-3 py-2 text-white disabled:opacity-60"
        >
          {pending ? "در حال ساخت حساب..." : "ساخت حساب"}
        </button>
      </form>
      <p className="text-sm text-muted">
        قبلاً حساب دارید؟ <Link href="/login">ورود</Link>
      </p>
    </main>
  );
}
