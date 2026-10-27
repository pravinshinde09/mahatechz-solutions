"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteMediaAction } from "./actions";

export function DeleteMediaButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      {error ? (
        <span role="alert" className="max-w-56 text-xs text-danger">
          {error}
        </span>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${name}`}
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Delete “${name}”? This can't be undone.`)) return;
          startTransition(async () => {
            const result = await deleteMediaAction(id);
            setError(result.ok ? null : result.message);
          });
        }}
      >
        <Trash2 />
      </Button>
    </span>
  );
}
