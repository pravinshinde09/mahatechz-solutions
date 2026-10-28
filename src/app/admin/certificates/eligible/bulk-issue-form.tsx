"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { idle } from "@/lib/forms";
import { formatDate } from "@/lib/format";
import { bulkIssueAction } from "../../completion-actions";

interface Row {
  enrollmentId: string;
  student: { id: string; fullName: string; email: string };
  course: { id: string; title: string };
  completedAt: string;
  completionOverridden: boolean;
}

/** Spec §17.1 #14: pick students who completed (all by default) and issue in one go. */
export function BulkIssueForm({ rows }: { rows: Row[] }) {
  const [state, action, pending] = useActionState(bulkIssueAction, idle);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(rows.map((r) => r.enrollmentId)));
  const all = selected.size === rows.length;
  return (
    <ActionForm action={action} pending={pending} className="grid gap-4">
      <FormMessage state={state} />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={all} onChange={() => setSelected(all ? new Set() : new Set(rows.map((r) => r.enrollmentId)))} className="size-4 accent-[var(--primary)]" />
          Select all ({rows.length})
        </label>
        <SubmitButton size="sm">
          Issue {selected.size} certificate{selected.size === 1 ? "" : "s"}
        </SubmitButton>
      </div>
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
        {rows.map((r) => (
          <li key={r.enrollmentId} className="flex items-start gap-3 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="enrollmentId"
              value={r.enrollmentId}
              checked={selected.has(r.enrollmentId)}
              onChange={() => {
                const next = new Set(selected);
                if (next.has(r.enrollmentId)) next.delete(r.enrollmentId);
                else next.add(r.enrollmentId);
                setSelected(next);
              }}
              aria-label={`Issue to ${r.student.fullName}`}
              className="mt-0.5 size-4 accent-[var(--primary)]"
            />
            <div className="min-w-0 flex-1">
              <Link href={`/admin/students/${r.student.id}`} className="font-medium hover:underline">
                {r.student.fullName}
              </Link>{" "}
              <span className="text-muted-foreground">· {r.student.email}</span>
              <p className="text-muted-foreground">{r.course.title}</p>
            </div>
            <span className="shrink-0 text-right text-xs text-muted-foreground">
              Completed {formatDate(r.completedAt)}
              {r.completionOverridden ? <span className="block text-warning">by admin override</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </ActionForm>
  );
}
