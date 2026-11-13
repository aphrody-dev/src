// Scripted model for tests: replays the given turns in order (the last one repeats) and records every request.
import type {
  ChatRequest,
  ChatResponse,
  LanguageModel,
  ToolCall,
} from "./types";

export type Turn = string | { text?: string; toolCalls?: ToolCall[] };

export type ScriptedModel = LanguageModel & { calls: ChatRequest[] };

export function scriptedModel(...turns: Turn[]): ScriptedModel {
  const calls: ChatRequest[] = [];
  return {
    id: "scripted/test",
    tools: true,
    calls,
    async chat(req): Promise<ChatResponse> {
      calls.push(structuredClone({ ...req, signal: undefined }));
      const t = turns[Math.min(calls.length - 1, turns.length - 1)] ?? "";
      const turn = typeof t === "string" ? { text: t } : t;
      const toolCalls = turn.toolCalls ?? [];
      return {
        text: turn.text ?? "",
        toolCalls,
        finishReason: toolCalls.length ? "tool_calls" : "stop",
      };
    },
  };
}

export const call = (id: string, name: string, input: unknown): ToolCall => ({
  id,
  name,
  input,
});
