"use client";
import { useEffect, useRef, useState } from "react";
import { uploadFile } from "@/lib/upload";
import { useToast } from "@/hooks/use-toast";

export interface Attachment {
  url: string;
  type: "image" | "audio" | "file";
  name?: string | null;
  size?: number | null;
  duration_ms?: number | null;
}

interface Props {
  onAttach: (a: Attachment) => void;
  disabled?: boolean;
}

function sizeLabel(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function secondsLabel(ms?: number | null) {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Recording formats to try, best first, across Android Chrome and iOS Safari. */
const AUDIO_MIMES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg"
];

/** Extension for the recording type the browser chose. */
const EXT_FOR: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-m4a": "m4a"
};

/**
 * Instagram-style attachment controls: photo, voice note and file.
 * Uploads immediately on pick so sending stays instant; the caller attaches
 * the resulting URL to the message.
 */
export function AttachmentBar({ onAttach, disabled }: Props) {
  const { push } = useToast();
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<null | "image" | "file">(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  // The recorder's onstop callback closes over the render that started it, so
  // the duration has to come from a ref rather than the elapsed state value.
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => {
      elapsedRef.current += 1000;
      setElapsed(elapsedRef.current);
    }, 1000);
    return () => clearInterval(t);
  }, [recording]);

  async function upload(file: File, kind: "image" | "audio" | "file", durationMs: number | null = null) {
    setBusy(kind === "audio" ? null : kind);
    try {
      const url = await uploadFile(file, "messages", { kind });
      onAttach({
        url,
        type: kind,
        name: file.name,
        size: file.size,
        duration_ms: kind === "audio" ? durationMs : null
      });
      push(kind === "image" ? "Photo attached" : kind === "audio" ? "Voice message attached" : "File attached");
    } catch (err) {
      push(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      push("Voice recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Android Chrome records webm/opus, iOS Safari records mp4. Pick whatever
      // this browser actually supports and let it fall back to its own default.
      const mimeType = AUDIO_MIMES.find((m) => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunks.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = rec.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunks.current, { type });
        if (blob.size === 0) { push("Nothing was recorded."); return; }
        const file = new File([blob], `voice-${Date.now()}.${EXT_FOR[type.split(";")[0] ?? ""] ?? "webm"}`, { type });
        await upload(file, "audio", elapsedRef.current);
      };
      recorder.current = rec;
      elapsedRef.current = 0;
      setElapsed(0);
      setRecording(true);
      rec.start();
    } catch {
      push("Microphone access was blocked — allow it to send voice notes.");
    }
  }

  function stopRecording() {
    setRecording(false);
    recorder.current?.stop();
    recorder.current = null;
  }

  const iconBtn = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50";

  return (
    <>
      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f, "image"); e.target.value = ""; }}
      />
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f, "file"); e.target.value = ""; }}
      />

      <div className="flex items-center gap-1">
        <button type="button" className={iconBtn} disabled={disabled || busy !== null || recording}
          onClick={() => imageRef.current?.click()} aria-label="Send a photo" title="Send a photo">
          {busy === "image" ? <Spinner /> : <PhotoIcon />}
        </button>

        <button type="button" className={iconBtn} disabled={disabled || busy !== null}
          onClick={() => fileRef.current?.click()} aria-label="Send a file" title="Send a file">
          {busy === "file" ? <Spinner /> : <PaperclipIcon />}
        </button>

        {recording ? (
          <button type="button" onClick={stopRecording} aria-label="Stop recording"
            className="flex h-10 items-center gap-2 rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary-foreground" />
            {secondsLabel(elapsed)} · Stop
          </button>
        ) : (
          <button type="button" className={iconBtn} disabled={disabled || busy !== null}
            onClick={() => void startRecording()} aria-label="Record a voice message" title="Record a voice message">
            <MicIcon />
          </button>
        )}
      </div>
    </>
  );
}

function Spinner() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="3">
      <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="8.5" cy="9.5" r="1.4" />
      <path d="m4 17 4.8-4.5a2 2 0 0 1 2.7 0L15 16" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 11.5 12 19.5a4.6 4.6 0 0 1-6.5-6.5l8.5-8.5a3.1 3.1 0 0 1 4.4 4.4l-8.5 8.5a1.5 1.5 0 0 1-2.2-2.2l7.8-7.8" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </svg>
  );
}

export { sizeLabel, secondsLabel };