/**
 * Pluggable AI provider — PRD §8 + §21.
 * Default: Noop (AI_PROVIDER=NONE). Add OpenAI/Anthropic adapters later
 * without changing call sites. UI must always allow manual editing.
 */

export type GenerateKind = "bio" | "statement" | "short_desc" | "artwork_desc";

export interface AIProvider {
  readonly name: string;
  readonly enabled: boolean;
  generate(kind: GenerateKind, rawText: string): Promise<string>;
  assist(prompt: string, context: string): Promise<string>;
}

class NoopProvider implements AIProvider {
  readonly name = "noop";
  readonly enabled = false;
  async generate(): Promise<string> {
    throw new Error("AI_DISABLED: set AI_PROVIDER and API key to enable generation.");
  }
  async assist(): Promise<string> {
    throw new Error("AI_DISABLED: set AI_PROVIDER and API key to enable assistant.");
  }
}

class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  readonly enabled = true;
  private apiKey: string;
  private model: string;
  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.apiKey = apiKey;
    this.model = model;
  }
  private async chat(system: string, user: string): Promise<string> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });
    if (!res.ok) throw new Error(`AI_PROVIDER_ERROR: OpenAI ${res.status}`);
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("AI_PROVIDER_ERROR: empty response");
    return text;
  }
  generate(kind: GenerateKind, rawText: string): Promise<string> {
    return this.chat(SYSTEM_WRITER, `${PROMPTS[kind]}\n\nArtist notes:\n${rawText}`);
  }
  assist(prompt: string, context: string): Promise<string> {
    return this.chat(SYSTEM_COACH, `Artist context:\n${context}\n\nQuestion:\n${prompt}`);
  }
}

class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  readonly enabled = true;
  private apiKey: string;
  private model: string;
  constructor(apiKey: string, model = "claude-3-5-haiku-latest") {
    this.apiKey = apiKey;
    this.model = model;
  }
  private async chat(system: string, user: string): Promise<string> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model: this.model, max_tokens: 800, system, messages: [{ role: "user", content: user }] })
    });
    if (!res.ok) throw new Error(`AI_PROVIDER_ERROR: Anthropic ${res.status}`);
    const json = (await res.json()) as { content?: { text?: string }[] };
    const text = json.content?.map((b) => b.text ?? "").join("").trim();
    if (!text) throw new Error("AI_PROVIDER_ERROR: empty response");
    return text;
  }
  generate(kind: GenerateKind, rawText: string): Promise<string> {
    return this.chat(SYSTEM_WRITER, `${PROMPTS[kind]}\n\nArtist notes:\n${rawText}`);
  }
  assist(prompt: string, context: string): Promise<string> {
    return this.chat(SYSTEM_COACH, `Artist context:\n${context}\n\nQuestion:\n${prompt}`);
  }
}

/**
 * xAI Grok provider — OpenAI-compatible chat API (https://api.x.ai/v1).
 * Model via XAI_MODEL (see console.x.ai for current IDs); defaults to grok-4.
 */
class XAIProvider implements AIProvider {
  readonly name = "xai";
  readonly enabled = true;
  private apiKey: string;
  private model: string;
  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || "grok-4";
  }
  private async chat(system: string, user: string): Promise<string> {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });
    if (!res.ok) throw new Error(`AI_PROVIDER_ERROR: xAI ${res.status}`);
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("AI_PROVIDER_ERROR: empty response");
    return text;
  }
  generate(kind: GenerateKind, rawText: string): Promise<string> {
    return this.chat(SYSTEM_WRITER, `${PROMPTS[kind]}\n\nArtist notes:\n${rawText}`);
  }
  assist(prompt: string, context: string): Promise<string> {
    return this.chat(SYSTEM_COACH, `Artist context:\n${context}\n\nQuestion:\n${prompt}`);
  }
}

const SYSTEM_WRITER =
  "You are a professional art writer helping emerging African visual artists. Write concise, credible, gallery-ready copy. No hype, no invented exhibitions or awards.";
const SYSTEM_COACH =
  "You are a career coach for emerging African visual artists. Give concrete next steps tied to the artist's profile, goals and opportunities. Keep answers under 200 words.";

const PROMPTS: Record<GenerateKind, string> = {
  bio: "Write a third-person artist biography (120-180 words) from the notes. End with current focus.",
  statement: "Write a first-person artist statement (100-150 words): materials, themes, what the work explores.",
  short_desc: "Write a one-line profile tagline, max 140 characters.",
  artwork_desc: "Write a 60-90 word artwork description: medium, process, theme, viewing notes."
};

function resolveProvider(): AIProvider {
  const kind = (process.env.AI_PROVIDER ?? "NONE").toUpperCase();
  if (kind === "OPENAI" && process.env.OPENAI_API_KEY) return new OpenAIProvider(process.env.OPENAI_API_KEY);
  if (kind === "ANTHROPIC" && process.env.ANTHROPIC_API_KEY) return new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
  if (kind === "XAI" && process.env.XAI_API_KEY) return new XAIProvider(process.env.XAI_API_KEY, process.env.XAI_MODEL || undefined);
  return new NoopProvider();
}

export const aiProvider: AIProvider = resolveProvider();

/** Rule-based roadmap fallback used when AI is disabled (PRD §12). */
export function defaultRoadmapForGoal(goalType: string): string[] {
  switch (goalType) {
    case "FIRST_EXHIBITION":
      return [
        "Complete professional profile",
        "Upload at least 6 portfolio pieces",
        "Write artist statement",
        "Create a collection",
        "Discover 5 suitable galleries",
        "Apply to 3 open calls",
        "Track applications",
        "Record completed exhibition"
      ];
    case "FIRST_SALE":
    case "INCREASE_SALES":
      return [
        "Complete profile + avatar",
        "Price 5 artworks",
        "Publish collection",
        "Share portfolio with 3 collectors",
        "Respond to inquiries within 48h",
        "Record first sale"
      ];
    default:
      return [
        "Complete professional profile",
        "Upload portfolio",
        "Set primary career goal",
        "Discover matching opportunities",
        "Connect with 5 professionals",
        "Track progress weekly"
      ];
  }
}
