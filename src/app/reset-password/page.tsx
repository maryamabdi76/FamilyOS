"use client";

import { useActionState } from "react";
import { updatePassword, type AuthActionState } from "@/features/auth/actions";

const initialState: AuthActionState = {};

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-xl font-semibold">تعیین رمز عبور جدید</h1>
      <form action={formAction} className="flex flex-col gap-4">
        <input
          name="password"
          type="password"
          placeholder="رمز عبور جدید (حداقل ۸ کاراکتر)"
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
          {pending ? "در حال ذخیره..." : "ذخیره رمز عبور"}
        </button>
      </form>
    </main>
  );
}
