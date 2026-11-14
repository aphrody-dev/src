export type FinishReason =
  | "stop"
  | "length"
  | "content-filter"
  | "tool-calls"
  | "error"
  | "interrupted"
  | "other";

export type UIMessageChunk =
  | { type: "start"; messageId?: string; messageMetadata?: unknown }
  | { type: "start-step" }
  | { type: "text-start"; id: string }
  | { type: "text-delta"; id: string; delta: string }
  | { type: "text-end"; id: string }
  | { type: "reasoning-start"; id: string }
  | { type: "reasoning-delta"; id: string; delta: string }
  | { type: "reasoning-end"; id: string }
  | {
      type: "tool-input-start";
      toolCallId: string;
      toolName: string;
      inputEncoding?: "json" | "text";
      dynamic?: boolean;
      title?: string;
    }
  | { type: "tool-input-delta"; toolCallId: string; inputTextDelta: string }
  | {
      type: "tool-input-available";
      toolCallId: string;
      toolName: string;
      input: unknown;
    }
  | {
      type: "tool-output-available";
      toolCallId: string;
      output: unknown;
      preliminary?: boolean;
    }
  | { type: "tool-output-error"; toolCallId: string; errorText: string }
  | { type: "finish-step" }
  | { type: "finish"; finishReason?: FinishReason; messageMetadata?: unknown }
  | { type: "error"; errorText: string };

export const VERCEL_AI_UI_STREAM_HEADERS: Readonly<Record<string, string>> = {
  "content-type": "text/event-stream",
  "cache-control": "no-cache",
  connection: "keep-alive",
  "x-vercel-ai-ui-message-stream": "v1",
  "x-accel-buffering": "no",
};

export interface AiStreamBenchmarkResult {
  framesCount: number;
  totalPayloadBytes: number;
  sovereignEmitAndParseMs: number;
  sovereignFramesPerSec: number;
  sovereignMegabytesPerSec: number;
  baselineTransformChainMs: number;
  baselineFramesPerSec: number;
  baselineMegabytesPerSec: number;
  speedupFactor: number;
}

const SHARED_ENCODER = new TextEncoder();
const SHARED_DECODER = new TextDecoder();
const DONE_BYTES = SHARED_ENCODER.encode("data: [DONE]\n\n");

export function isValidUIMessageChunk(value: unknown): value is UIMessageChunk {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.type !== "string") return false;

  switch (obj.type) {
    case "start":
    case "start-step":
    case "finish-step":
      return true;
    case "text-start":
    case "text-end":
    case "reasoning-start":
    case "reasoning-end":
      return typeof obj.id === "string";
    case "text-delta":
    case "reasoning-delta":
      return typeof obj.id === "string" && typeof obj.delta === "string";
    case "tool-input-start":
      return (
        typeof obj.toolCallId === "string" && typeof obj.toolName === "string"
      );
    case "tool-input-delta":
      return (
        typeof obj.toolCallId === "string" &&
        typeof obj.inputTextDelta === "string"
      );
    case "tool-input-available":
      return (
        typeof obj.toolCallId === "string" &&
        typeof obj.toolName === "string" &&
        "input" in obj
      );
    case "tool-output-available":
      return typeof obj.toolCallId === "string" && "output" in obj;
    case "tool-output-error":
      return (
        typeof obj.toolCallId === "string" && typeof obj.errorText === "string"
      );
    case "finish":
      return (
        obj.finishReason === undefined || typeof obj.finishReason === "string"
      );
    case "error":
      return typeof obj.errorText === "string";
    default:
      return false;
  }
}

/**
 * Sovereign Bun v1.4.4 direct byte-batched `ReadableStream` emitter for `vercel/ai` UIMessageStream v1.
 * Avoids chained `TransformStream` object->string->Uint8Array microtask allocations per frame.
 */
export function createSovereignUIMessageByteStream(
  chunks: readonly UIMessageChunk[],
  batchSize = 64,
): ReadableStream<Uint8Array> {
  let offset = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= chunks.length) {
        controller.enqueue(DONE_BYTES);
        controller.close();
        return;
      }
      const end = Math.min(chunks.length, offset + batchSize);
      let block = "";
      for (let i = offset; i < end; i++) {
        block += `data: ${JSON.stringify(chunks[i])}\n\n`;
      }
      offset = end;
      controller.enqueue(SHARED_ENCODER.encode(block));
    },
  });
}

export function createSovereignUIMessageResponse(
  chunks: readonly UIMessageChunk[],
  batchSize = 64,
): Response {
  return new Response(createSovereignUIMessageByteStream(chunks, batchSize), {
    status: 200,
    headers: VERCEL_AI_UI_STREAM_HEADERS,
  });
}

/**
 * Sovereign streaming SSE parser for `vercel/ai` UIMessageStream v1 (`data: <json>\n\n` + `data: [DONE]\n\n`).
 */
export async function parseSovereignUIMessageStream(
  stream: ReadableStream<Uint8Array>,
): Promise<{ chunks: UIMessageChunk[]; totalBytes: number; sawDone: boolean }> {
  const reader = stream.getReader();
  const chunks: UIMessageChunk[] = [];
  let carry = "";
  let totalBytes = 0;
  let sawDone = false;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    totalBytes += value.byteLength;
    carry += SHARED_DECODER.decode(value, { stream: true });

    let sepIdx = carry.indexOf("\n\n");
    while (sepIdx !== -1) {
      const frame = carry.slice(0, sepIdx);
      carry = carry.slice(sepIdx + 2);
      if (frame.startsWith("data: ")) {
        const payload = frame.slice(6);
        if (payload === "[DONE]") {
          sawDone = true;
        } else {
          chunks.push(JSON.parse(payload) as UIMessageChunk);
        }
      }
      sepIdx = carry.indexOf("\n\n");
    }
  }

  carry += SHARED_DECODER.decode();
  if (carry.startsWith("data: ")) {
    const payload = carry.slice(6).trim();
    if (payload === "[DONE]") sawDone = true;
    else if (payload) chunks.push(JSON.parse(payload) as UIMessageChunk);
  }

  return { chunks, totalBytes, sawDone };
}

/**
 * Reference multi-stage `TransformStream` pipeline mirroring `vercel/ai`'s
 * `ReadableStream<UIMessageChunk> -> JsonToSseTransformStream -> TextEncoderStream -> TextDecoderStream -> regex line splitter`.
 */
async function runBaselineTransformChain(
  chunks: readonly UIMessageChunk[],
): Promise<{ count: number; totalBytes: number }> {
  let idx = 0;
  const source = new ReadableStream<UIMessageChunk>({
    pull(controller) {
      if (idx >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(chunks[idx++]!);
    },
  });

  const jsonToSse = new TransformStream<UIMessageChunk, string>({
    transform(part, controller) {
      controller.enqueue(`data: ${JSON.stringify(part)}\n\n`);
    },
    flush(controller) {
      controller.enqueue("data: [DONE]\n\n");
    },
  });

  const byteStream = source
    .pipeThrough(jsonToSse)
    .pipeThrough(new TextEncoderStream());
  const reader = byteStream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let totalBytes = 0;
  let count = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    totalBytes += value.byteLength;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split(/\r?\n\r?\n/);
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const m = part.match(/^data:\s*(.+)$/m);
      if (m && m[1] && m[1] !== "[DONE]") {
        const parsed = JSON.parse(m[1]) as UIMessageChunk;
        if (isValidUIMessageChunk(parsed)) count++;
      }
    }
  }

  return { count, totalBytes };
}

export function buildAgentSessionFrames(turnCount = 2500): UIMessageChunk[] {
  const frames: UIMessageChunk[] = [
    { type: "start", messageId: "msg-sovereign-pi-opencode-01" },
    { type: "start-step" },
    { type: "text-start", id: "txt-1" },
  ];

  for (let i = 0; i < turnCount; i++) {
    frames.push({
      type: "text-delta",
      id: "txt-1",
      delta: `Analyzing sovereign Ring-3 sm_89 kernel frame #${i} with zero-copy SSE batching. `,
    });
    if (i % 10 === 0) {
      const callId = `call_${i}`;
      frames.push({
        type: "tool-input-start",
        toolCallId: callId,
        toolName: "pi_read_workspace",
        inputEncoding: "json",
      });
      frames.push({
        type: "tool-input-delta",
        toolCallId: callId,
        inputTextDelta: `{"path":"C:/src/labs/src/cli.ts","line":${i}}`,
      });
      frames.push({
        type: "tool-input-available",
        toolCallId: callId,
        toolName: "pi_read_workspace",
        input: { path: "C:/src/labs/src/cli.ts", line: i },
      });
      frames.push({
        type: "tool-output-available",
        toolCallId: callId,
        output: { ok: true, merkleHash: "a94f10e8bc72109d", bytes: 4096 },
      });
    }
  }

  frames.push(
    { type: "text-end", id: "txt-1" },
    { type: "finish-step" },
    {
      type: "finish",
      finishReason: "stop",
      messageMetadata: {
        engine: "ring3-agent+pi-opencode",
        runtime: "bun-1.4.4",
      },
    },
  );

  return frames;
}

export async function benchmarkAiStreamArena(
  turnCount = 4000,
): Promise<AiStreamBenchmarkResult> {
  const frames = buildAgentSessionFrames(turnCount);

  // Warmup
  await parseSovereignUIMessageStream(
    createSovereignUIMessageByteStream(frames.slice(0, 200), 64),
  );
  await runBaselineTransformChain(frames.slice(0, 200));

  const tSov0 = Bun.nanoseconds();
  const sovRes = await parseSovereignUIMessageStream(
    createSovereignUIMessageByteStream(frames, 128),
  );
  const sovereignEmitAndParseMs = (Bun.nanoseconds() - tSov0) / 1e6;

  const tBase0 = Bun.nanoseconds();
  const baseRes = await runBaselineTransformChain(frames);
  const baselineTransformChainMs = (Bun.nanoseconds() - tBase0) / 1e6;

  if (
    sovRes.chunks.length !== frames.length ||
    baseRes.count !== frames.length
  ) {
    throw new Error(
      `Frame count mismatch: expected ${frames.length}, got sov=${sovRes.chunks.length}, base=${baseRes.count}`,
    );
  }

  const mb = sovRes.totalBytes / (1024 * 1024);
  const sovSec = sovereignEmitAndParseMs / 1000;
  const baseSec = baselineTransformChainMs / 1000;

  return {
    framesCount: frames.length,
    totalPayloadBytes: sovRes.totalBytes,
    sovereignEmitAndParseMs: Number(sovereignEmitAndParseMs.toFixed(2)),
    sovereignFramesPerSec: Math.round(frames.length / sovSec),
    sovereignMegabytesPerSec: Number((mb / sovSec).toFixed(2)),
    baselineTransformChainMs: Number(baselineTransformChainMs.toFixed(2)),
    baselineFramesPerSec: Math.round(frames.length / baseSec),
    baselineMegabytesPerSec: Number((mb / baseSec).toFixed(2)),
    speedupFactor: Number(
      (
        baselineTransformChainMs / Math.max(0.01, sovereignEmitAndParseMs)
      ).toFixed(2),
    ),
  };
}
