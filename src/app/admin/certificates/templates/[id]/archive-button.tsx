"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { archiveTemplateAction } from "../../../completion-actions";

export function ArchiveTemplateButton({ id, inUse }: { id: string; inUse: number }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="justify-self-start"
        disabled={pending || inUse > 0}
        onClick={() => {
          if (!window.confirm("Archive this template? Certificates already issued with it keep working.")) return;
          start(async () => {
            const res = await archiveTemplateAction(id);
            if (res.status === "error") setError(res.message ?? "Couldn't archive the template.");
          });
        }}
      >
        Archive template
      </Button>
      {inUse > 0 ? <p className="text-xs text-muted-foreground">In use by {inUse} course{inUse === 1 ? "" : "s"} — choose another template for them before archiving.</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
