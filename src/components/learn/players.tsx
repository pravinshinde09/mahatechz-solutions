"use client";

import { useEffect, useRef } from "react";
import type { ProgressUpdate } from "@/lib/contracts/learning";
import { fetchPlayback } from "@/lib/learn-client";
import { useHeartbeats, type PlayerSnapshot } from "./use-heartbeats";

interface TrackedProps {
  lessonId: string;
  title: string;
  url: string;
  watchSessionId: string | null;
  resumeAt: number;
  onUpdate: (u: ProgressUpdate) => void;
}

/** Hosted file (local driver) or HLS-capable browsers: native <video> with resume and heartbeats. */
export function FileVideoPlayer({ lessonId, title, url, watchSessionId, resumeAt, onUpdate }: TrackedProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const beforeSeek = useRef(0);
  const restoreAt = useRef(resumeAt);
  const read = () => {
    const v = ref.current;
    return v ? { position: v.currentTime, rate: v.playbackRate, playing: !v.paused && !v.ended } : null;
  };
  const pulse = useHeartbeats(lessonId, watchSessionId, read, onUpdate);

  return (
    <video
      ref={ref}
      src={url}
      title={title}
      controls
      controlsList="nodownload"
      preload="metadata"
      playsInline
      className="aspect-video w-full rounded-lg border border-border bg-black"
      onLoadedMetadata={(e) => {
        if (restoreAt.current > 0 && restoreAt.current < e.currentTarget.duration - 5) e.currentTarget.currentTime = restoreAt.current;
      }}
      onTimeUpdate={(e) => {
        if (!e.currentTarget.seeking) beforeSeek.current = e.currentTarget.currentTime;
      }}
      onPause={() => void pulse("pause")}
      onEnded={() => void pulse("ended")}
      // Report the position reached before the jump, then the new position after it.
      onSeeking={(e) => void pulse("seek", { position: beforeSeek.current, rate: e.currentTarget.playbackRate, playing: false })}
      onSeeked={(e) => {
        beforeSeek.current = e.currentTarget.currentTime;
      }}
      onError={async (e) => {
        // Signed URLs expire (spec §23.6): fetch a fresh one and continue where the student was.
        const video = e.currentTarget;
        const at = video.currentTime || beforeSeek.current;
        const fresh = await fetchPlayback(lessonId);
        if (fresh.ok && fresh.data.url !== video.src) {
          restoreAt.current = at;
          video.src = fresh.data.url;
        }
      }}
    >
      <track kind="captions" />
    </video>
  );
}

/**
 * Provider player in an iframe (Bunny Stream). Bunny implements the player.js postMessage
 * protocol, which gives us play/pause/timeupdate events and lets us resume. Messages are accepted
 * only from the iframe's own origin.
 */
export function EmbedVideoPlayer({ lessonId, title, url, watchSessionId, resumeAt, onUpdate }: TrackedProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const state = useRef<PlayerSnapshot>({ position: resumeAt, rate: 1, playing: false });
  const pulse = useHeartbeats(lessonId, watchSessionId, () => state.current, onUpdate);
  const pulseRef = useRef(pulse);
  useEffect(() => {
    pulseRef.current = pulse;
  });

  useEffect(() => {
    const origin = new URL(url).origin;
    const post = (method: string, value?: unknown) =>
      frame.current?.contentWindow?.postMessage(JSON.stringify({ context: "player.js", version: "0.0.11", method, ...(value !== undefined ? { value } : {}) }), origin);
    let resumed = false;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin || event.source !== frame.current?.contentWindow) return;
      let msg: { context?: string; event?: string; value?: { seconds?: number } };
      try {
        msg = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (msg?.context !== "player.js") return;
      if (msg.event === "ready") {
        for (const name of ["play", "pause", "ended", "timeupdate"]) post("addEventListener", name);
        if (!resumed && resumeAt > 0) post("setCurrentTime", resumeAt);
        resumed = true;
      } else if (msg.event === "timeupdate" && typeof msg.value?.seconds === "number") {
        state.current.position = msg.value.seconds;
      } else if (msg.event === "play") {
        state.current.playing = true;
      } else if (msg.event === "pause") {
        state.current.playing = false;
        void pulseRef.current("pause");
      } else if (msg.event === "ended") {
        state.current.playing = false;
        void pulseRef.current("ended");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [url, resumeAt]);

  return (
    <div className="aspect-video overflow-hidden rounded-lg border border-border bg-black">
      <iframe
        ref={frame}
        src={url}
        title={title}
        className="size-full"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        allow="encrypted-media; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

/** YouTube / Vimeo / Drive: no trustworthy playback events, so completion is manual (spec §15.2). */
export function ExternalPlayer({ title, url }: { title: string; url: string }) {
  return (
    <div className="aspect-video overflow-hidden rounded-lg border border-border bg-black">
      <iframe
        src={url}
        title={title}
        className="size-full"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        allow="encrypted-media; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
