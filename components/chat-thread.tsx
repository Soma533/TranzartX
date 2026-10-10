"use client";
import type { RefObject } from "react";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface Msg {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
}

/** Chat bubble clock: time for today, "Yesterday 14:05" for older (PRD §18). */
function stamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return time;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const prefix = d.toDateString() === yesterday.toDateString()
    ? "Yesterday "
    : `${d.toLocaleDateString([], { day: "numeric", month: "short" })} `;
  return prefix + time;
}

/** WhatsApp-style ticks: ✓ sent, ✓✓ delivered, blue ✓✓ read. */
function Ticks({ m, mine }: { m: Msg; mine: boolean }) {
  if (!mine) return null;
  if (m.read_at) return <span className="text-sky-500">✓✓</span>;
  if (m.delivered_at) return <span className="text-muted-foreground">✓✓</span>;
  return <span className="text-muted-foreground">✓</span>;
}

interface ThreadProps {
  messages: Msg[];
  myId: string | null;
  active: boolean;
  starting: boolean;
  endRef: RefObject<HTMLDivElement | null>;
}

/** Message thread. Own bubbles right, others left; bubbles carry clock + ticks. */
export function ChatThread({ messages, myId, active, starting, endRef }: ThreadProps) {
  return (
    // Phone: thread grows with the page. Desktop: independent scroll pane.
    <div className="grid gap-2 md:max-h-[55vh] md:flex-1 md:overflow-y-auto">
      {messages.map((m) => {
        const mine = myId !== null && m.sender_id === myId;
        return (
          <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <span className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] leading-none ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {stamp(m.created_at)}
                <Ticks m={m} mine={mine} />
              </span>
            </div>
          </div>
        );
      })}
      {!active && (
        <p className="text-sm text-muted-foreground">
          {starting ? "Starting conversation…" : "Select or start a conversation."}
        </p>
      )}
      <div ref={endRef} />
    </div>
  );
}

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
}

/**
 * Multi-line composer. Enter adds a paragraph break, Ctrl/Cmd+Enter sends on
 * desktop; phones have no Ctrl key, so the paper-plane button is the send path.
 */
export function Composer({ draft, setDraft, boxRef, send, disabled, starting, sending, active, hasTarget }: ComposerProps) {
  return (
    <div className="flex items-end gap-2">
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
        placeholder=""
        // 16px stops iOS Safari auto-zooming the page on focus.
        className="text-[16px] md:text-sm"
      />
      <Button
        type="button"
        onClick={() => void send()}
        disabled={disabled}
        aria-label="Send message"
        title={disabled && !draft.trim() ? "Type a message first" : !active && !hasTarget ? "Select a conversation first" : "Send message (Ctrl+Enter)"}
        className="h-10 w-10 shrink-0 px-0"
      >
        {sending || starting ? (
          /* Spinner replaces the icon only while the request is in flight. */
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
          </svg>
        ) : (
          /* Paper plane: unambiguous send target for touch. */
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M2.5 21 23 12 2.5 3 2.5 10l14 2-14 2z" />
          </svg>
        )}
      </Button>
    </div>
  );
}