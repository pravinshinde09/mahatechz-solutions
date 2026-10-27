"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Uploader } from "@/components/media/uploader";
import { Button } from "@/components/ui/button";
import { setThumbnailAction } from "../actions";

export function ThumbnailPicker({ courseId, currentUrl }: { courseId: string; currentUrl: string | null }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const apply = (assetId: string | null) =>
    startTransition(async () => {
      const result = await setThumbnailAction(courseId, assetId);
      setMessage(result.status === "success" ? null : (result.message ?? "Couldn't update the thumbnail."));
      router.refresh();
    });

  return (
    <div className="grid gap-4">
      {currentUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- CDN-sized thumbnail
        <img src={currentUrl} alt="Current thumbnail" width={640} height={360} className="aspect-video w-full rounded-md border border-border object-cover" />
      ) : (
        <div className="grid-backdrop grid aspect-video place-items-center rounded-md border border-dashed border-border text-sm text-muted-foreground">No thumbnail yet</div>
      )}
      <Uploader purpose="THUMBNAIL" label={currentUrl ? "Replace thumbnail" : "Upload thumbnail"} onUploaded={(asset) => apply(asset.id)} />
      {currentUrl ? (
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => apply(null)} className="justify-self-start">
          Remove thumbnail
        </Button>
      ) : null}
      {message ? (
        <p role="alert" className="text-sm text-danger">
          {message}
        </p>
      ) : null}
    </div>
  );
}
