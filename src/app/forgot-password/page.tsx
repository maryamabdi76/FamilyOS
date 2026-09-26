"use client";

import { useActionState } from "react";
import { requestPasswordReset, type AuthActionState } from "@/features/auth/actions";

const initialState: AuthActionState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-xl font-semibold">بازیابی رمز عبور</h1>
      {state.success ? (
        <p className="text-sm text-muted">
          اگر این ایمیل ثبت‌شده باشد، لینک بازیابی رمز عبور برایتان ارسال شد.
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-4">
          <input
            name="email"
            type="email"
            placeholder="ایمیل"
            required
            className="rounded-md border border-border bg-transparent px-3 py-2"
          />
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-accent px-3 py-2 text-white disabled:opacity-60"
          >
            {pending ? "در حال ارسال..." : "ارسال لینک بازیابی"}
          </button>
        </form>
      )}
    </main>
  );
}
