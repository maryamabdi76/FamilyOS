"use client";

import { useActionState, useEffect, useRef } from "react";
import { addPerson, type AddPersonState } from "./actions";

const initialState: AddPersonState = {};

export function AddPersonForm() {
  const [state, formAction, pending] = useActionState(addPerson, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 sm:flex-row">
      <input
        name="name"
        type="text"
        placeholder="نام"
        required
        className="flex-1 rounded-md border border-border bg-transparent px-3 py-2"
      />
      <input
        name="relationship"
        type="text"
        placeholder="نسبت (اختیاری)"
        className="flex-1 rounded-md border border-border bg-transparent px-3 py-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-3 py-2 text-white disabled:opacity-60"
      >
        {pending ? "در حال افزودن..." : "افزودن"}
      </button>
      {state.error && <p className="text-sm text-red-600 sm:col-span-3">{state.error}</p>}
    </form>
  );
}
