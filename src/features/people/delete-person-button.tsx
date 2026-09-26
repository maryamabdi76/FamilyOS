"use client";

import { useTransition } from "react";
import { deletePerson } from "./actions";

export function DeletePersonButton({ personId }: { personId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => deletePerson(personId))}
      className="text-sm text-muted hover:text-red-600 disabled:opacity-60"
    >
      حذف
    </button>
  );
}
