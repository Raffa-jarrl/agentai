import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export const MODEL_SMART = "claude-sonnet-4-6";
export const MODEL_FAST = "claude-haiku-4-5-20251001";

export type CachedSystem = Array<{ type: "text"; text: string; cache_control?: { type: "ephemeral" } }>;

/** Wrap a long system prompt with ephemeral cache_control to benefit from prompt caching. */
export function cachedSystem(text: string): CachedSystem {
  return [{ type: "text", text, cache_control: { type: "ephemeral" } }];
}
