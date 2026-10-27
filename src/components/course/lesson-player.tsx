/**
 * Chooses the renderer for a lesson (spec §21.6 LessonPlayer). Phase 4 adds progress heartbeats
 * and resume; this version only plays. Embeds are sandboxed (spec §11.5).
 */
export function LessonPlayer({
  title,
  video,
  externalEmbedUrl,
  articleHtml,
}: {
  title: string;
  video: { url: string; kind: "embed" | "file" } | null;
  externalEmbedUrl: string | null;
  articleHtml: string | null;
}) {
  const embed = video?.kind === "embed" ? video.url : externalEmbedUrl;
  if (embed) {
    return (
      <div className="aspect-video overflow-hidden rounded-lg border border-border bg-black">
        <iframe
          src={embed}
          title={title}
          className="size-full"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          allow="encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      </div>
    );
  }
  if (video?.kind === "file") {
    return (
      <video src={video.url} controls controlsList="nodownload" preload="metadata" className="aspect-video w-full rounded-lg border border-border bg-black">
        <track kind="captions" />
      </video>
    );
  }
  if (articleHtml) {
    // Sanitised by the API before it reaches the browser.
    return <article className="prose-content rounded-lg border border-border bg-surface p-6 md:p-8" dangerouslySetInnerHTML={{ __html: articleHtml }} />;
  }
  return <p className="rounded-lg border border-border bg-surface p-6 text-muted-foreground">This lesson isn&apos;t available to preview.</p>;
}
