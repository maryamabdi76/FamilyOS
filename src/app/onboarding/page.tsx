"use client";

import { useActionState } from "react";
import { createHousehold, type CreateHouseholdState } from "@/features/household/actions";

const initialState: CreateHouseholdState = {};

export default function OnboardingPage() {
  const [state, formAction, pending] = useActionState(createHousehold, initialState);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-xl font-semibold">ساخت خانواده</h1>
        <p className="mt-1 text-sm text-muted">یک نام برای خانواده خود انتخاب کنید.</p>
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        <input
          name="name"
          type="text"
          placeholder="مثلاً خانواده احمدی"
          required
          className="rounded-md border border-border bg-transparent px-3 py-2"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-3 py-2 text-white disabled:opacity-60"
        >
          {pending ? "در حال ساخت..." : "ادامه"}
        </button>
      </form>
    </main>
  );
}
