"use client";

import { createContext, startTransition, useContext, type ReactNode } from "react";

const PendingContext = createContext(false);
export const useActionFormPending = () => useContext(PendingContext);

/**
 * For long editor forms. React's `<form action>` resets every field once the action settles —
 * even after a validation error, which would wipe the author's edits. This submits the same
 * FormData through a transition instead, so fields keep their values; the server re-renders
 * the defaults after a successful save.
 */
export function ActionForm({
  action,
  pending,
  children,
  className,
}: {
  action: (form: FormData) => void;
  pending: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      noValidate
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(() => action(form));
      }}
    >
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
    </form>
  );
}
