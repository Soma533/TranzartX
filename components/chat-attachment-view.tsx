"use client";
import type { Msg } from "@/components/chat-thread";
import { sizeLabel, secondsLabel } from "@/components/chat-attachments";

/** Renders the picture / voice note / file carried by a message. */
export function AttachmentView({ m }: { m: Msg }) {
  if (!m.attachment_url) return null;

  if (m.attachment_type === "image") {
    return (
      <a href={m.attachment_url} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={m.attachment_url}
          alt={m.attachment_name ?? "Shared photo"}
          className="mb-1 max-h-72 w-full rounded-xl object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  if (m.attachment_type === "audio") {
    return (
      <div className="mb-1">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio controls preload="metadata" src={m.attachment_url} className="w-full" />
        {m.attachment_duration_ms ? (
          <p className="mt-0.5 text-[10px] opacity-70">Voice note · {secondsLabel(m.attachment_duration_ms)}</p>
        ) : null}
      </div>
    );
  }

  return (
    <a
      href={m.attachment_url}
      target="_blank"
      rel="noreferrer"
      className="mb-1 flex items-center gap-2 rounded-xl bg-black/10 px-3 py-2 hover:bg-black/15"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
      </svg>
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium">{m.attachment_name ?? "File"}</span>
        <span className="block text-[10px] opacity-70">{sizeLabel(m.attachment_size)}</span>
      </span>
    </a>
  );
}