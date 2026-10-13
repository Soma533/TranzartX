"use client";
import type { RefObject } from "react";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AttachmentBar, type Attachment } from "@/components/chat-attachments";

interface ComposerProps {
  draft: string;
  setDraft: (v: string) => void;
  boxRef: RefObject<HTMLTextAreaElement | null>;
  send: () => Promise<void>;
  disabled: boolean;
  starting: boolean;
  sending: boolean;
  active: boolean;
  hasTarget: boolean;
  attachment: Attachment | null;
  onAttach: (a: Attachment | null) => void;
}

/**
 * Multi-line composer. Enter adds a paragraph break, Ctrl/Cmd+Enter sends on
 * desktop; phones have no Ctrl key, so the paper-plane button is the send path.
 */
export function Composer({ draft, setDraft, boxRef, send, disabled, starting, sending, active, hasTarget, attachment, onAttach }: ComposerProps) {
  return (
    <div className="grid gap-2">
      {attachment && (
        <div className="flex items-center gap-3 rounded-xl border px-3 py-2">
          {attachment.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={attachment.url} alt="" className="h-12 w-12 rounded-lg object-cover" />
          ) : attachment.type === "audio" ? (
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">🎤</span>
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-xs">📎</span>
          )}
          <span className="min-w-0 flex-1 text-xs">
            <span className="block truncate font-medium">
              {attachment.type === "image" ? "Photo" : attachment.type === "audio" ? "Voice message" : attachment.name ?? "File"}
            </span>
            <span className="block text-muted-foreground">Ready to send</span>
          </span>
          <button
            type="button"
            onClick={() => onAttach(null)}
            aria-label="Remove attachment"
            className="rounded-full p-1 hover:bg-secondary"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <AttachmentBar onAttach={(a) => onAttach(a)} disabled={disabled} />
        <Textarea
        ref={boxRef}
        rows={1}
        value={draft}
        enterKeyHint="enter"
        autoCapitalize="sentences"
        autoCorrect="on"
        onChange={(e) => {
          setDraft(e.target.value);
          // Auto-grow: 1 row up to ~8 rows, then scroll internally.
          e.target.style.height = "auto";
          e.target.style.height = `${Math.min(e.target.scrollHeight, 176)}px`;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            void send();
          }
        }}
        placeholder={active ? "Message…" : hasTarget ? "Starting conversation — type, then Send…" : "Select a conversation first…"}
        // 16px stops iOS Safari auto-zooming the page on focus.
        className="rounded-full border-0 bg-secondary text-[16px] focus:ring-1 md:text-sm"
      />
      <Button
        type="button"
        onClick={() => void send()}
        disabled={disabled}
        aria-label="Send message"
        title={disabled && !draft.trim() ? "Type a message first" : !active && !hasTarget ? "Select a conversation first" : "Send message (Ctrl+Enter)"}
        className="h-10 w-10 shrink-0 rounded-full border-0 bg-primary px-0 text-primary-foreground hover:opacity-90"
      >
        {sending || starting ? (
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
          </svg>
        ) : (
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M2.5 21 23 12 2.5 3 2.5 10l14 2-14 2z" />
          </svg>
        )}
      </Button>
      </div>
    </div>
  );
}