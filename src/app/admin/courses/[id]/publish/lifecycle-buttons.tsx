"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import type { AdminCourse } from "@/lib/contracts/catalog";
import { idle } from "@/lib/forms";
import { deleteCourseAction, lifecycleAction } from "../../actions";

export function LifecycleButtons({
  courseId,
  status,
  ready,
  canPublish,
  canArchive,
  canDelete,
}: {
  courseId: string;
  status: AdminCourse["status"];
  ready: boolean;
  canPublish: boolean;
  canArchive: boolean;
  canDelete: boolean;
}) {
  const [publishState, publish] = useActionState(lifecycleAction.bind(null, courseId, "publish"), idle);
  const [unpublishState, unpublish] = useActionState(lifecycleAction.bind(null, courseId, "unpublish"), idle);
  const [archiveState, archive] = useActionState(lifecycleAction.bind(null, courseId, "archive"), idle);
  const message = [publishState, unpublishState, archiveState].find((s) => s.status !== "idle") ?? idle;

  return (
    <div className="mt-4 grid gap-3">
      <FormMessage state={message} />
      {canPublish && ["DRAFT", "IN_REVIEW", "UNPUBLISHED"].includes(status) ? (
        <form action={publish}>
          <SubmitButton className="w-full">{status === "UNPUBLISHED" ? "Publish again" : "Publish course"}</SubmitButton>
          {!ready ? <p className="mt-2 text-xs text-muted-foreground">Complete the checklist to publish.</p> : null}
        </form>
      ) : null}
      {canPublish && status === "PUBLISHED" ? (
        <form
          action={unpublish}
          onSubmit={(e) => {
            if (!window.confirm("Unpublish this course? It disappears from the catalogue; enrolled students keep access.")) e.preventDefault();
          }}
        >
          <SubmitButton variant="outline" className="w-full">
            Unpublish
          </SubmitButton>
        </form>
      ) : null}
      {canArchive && status !== "ARCHIVED" ? (
        <form
          action={archive}
          onSubmit={(e) => {
            if (!window.confirm("Archive this course? It becomes read-only and closed to new enrolments.")) e.preventDefault();
          }}
        >
          <SubmitButton variant="outline" className="w-full">
            Archive
          </SubmitButton>
        </form>
      ) : null}
      {canDelete ? (
        <Button
          type="button"
          variant="ghost"
          className="text-danger"
          onClick={async () => {
            if (window.confirm("Permanently delete this draft course and its syllabus?")) await deleteCourseAction(courseId);
          }}
        >
          Delete draft
        </Button>
      ) : null}
      {status === "ARCHIVED" ? <p className="text-sm text-muted-foreground">Archived courses are read-only and closed to new enrolments.</p> : null}
    </div>
  );
}
