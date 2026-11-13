/**
 * LLM adapter boundary. The debate engine only sees `LlmProvider`; swapping OpenAI for
 * an OpenAI-compatible endpoint (for example NEAR AI Cloud) or another vendor means adding
 * an adapter here, nothing else. Credentials are read server-side only.
 */

export interface StructuredRequest {
  system: string;
  user: string;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  maxOutputTokens: number;
  timeoutMs?: number;
  /** Structured context; ignored by real providers, used by the local test fixture. */
  context?: unknown;
}

export interface StructuredResult {
  json: unknown;
  rawText: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export interface LlmProvider {
  id: string;
  model: string;
  /** Rough USD per 1M tokens for budget enforcement, from configuration. */
  pricing: { inputPerM: number; outputPerM: number };
  generate(req: StructuredRequest): Promise<StructuredResult>;
}

export class LlmError extends Error {
  constructor(message: string, public retryable: boolean, public status?: number) {
    super(message);
  }
}

function num(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

// ---------------------------------------------------------------- OpenAI Responses API

export class OpenAIResponsesProvider implements LlmProvider {
  id = 'openai-responses';
  pricing = { inputPerM: num('LLM_PRICE_INPUT_PER_M', 2), outputPerM: num('LLM_PRICE_OUTPUT_PER_M', 10) };
  constructor(private apiKey: string, public model: string, private baseUrl = 'https://api.openai.com/v1', private reasoningEffort: string | null = null) {}

  async generate(req: StructuredRequest): Promise<StructuredResult> {
    const started = Date.now();
    const body: Record<string, unknown> = {
      model: this.model,
      instructions: req.system,
      input: [{ role: 'user', content: req.user }],
      text: { format: { type: 'json_schema', name: req.schemaName, schema: req.jsonSchema, strict: true } },
      max_output_tokens: req.maxOutputTokens,
      store: false,
    };
    if (this.reasoningEffort) body.reasoning = { effort: this.reasoningEffort };
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/responses`, {
        method: 'POST',
        headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(req.timeoutMs ?? 90_000),
      });
    } catch (e) {
      throw new LlmError(`OpenAI request failed: ${(e as Error).message}`, true);
    }
    const text = await res.text();
    if (!res.ok) {
      const retryable = res.status === 429 || res.status >= 500;
      throw new LlmError(`OpenAI HTTP ${res.status}: ${safeError(text)}`, retryable, res.status);
    }
    const j = JSON.parse(text) as {
      status?: string; incomplete_details?: { reason?: string }; model?: string;
      output?: { type: string; content?: { type: string; text?: string; refusal?: string }[] }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    if (j.status === 'incomplete') throw new LlmError(`OpenAI response incomplete: ${j.incomplete_details?.reason ?? 'unknown'}`, true);
    const parts = (j.output ?? []).filter((o) => o.type === 'message').flatMap((o) => o.content ?? []);
    const refusal = parts.find((p) => p.type === 'refusal');
    if (refusal) throw new LlmError(`Model refused: ${refusal.refusal?.slice(0, 200)}`, false);
    const out = parts.filter((p) => p.type === 'output_text').map((p) => p.text ?? '').join('');
    return {
      json: parseJson(out),
      rawText: out,
      model: j.model ?? this.model,
      inputTokens: j.usage?.input_tokens ?? 0,
      outputTokens: j.usage?.output_tokens ?? 0,
      latencyMs: Date.now() - started,
    };
  }
}

// ---------------------------------------------------------------- OpenAI-compatible Chat Completions

/** For OpenAI-compatible gateways that support `response_format: json_schema`, such as NEAR AI Cloud. */
export class ChatCompletionsProvider implements LlmProvider {
  id = 'openai-compatible-chat';
  pricing = { inputPerM: num('LLM_PRICE_INPUT_PER_M', 2), outputPerM: num('LLM_PRICE_OUTPUT_PER_M', 10) };
  constructor(private apiKey: string, public model: string, private baseUrl: string) {}

  async generate(req: StructuredRequest): Promise<StructuredResult> {
    const started = Date.now();
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'system', content: req.system }, { role: 'user', content: req.user }],
          response_format: { type: 'json_schema', json_schema: { name: req.schemaName, schema: req.jsonSchema, strict: true } },
          max_tokens: req.maxOutputTokens,
        }),
        signal: AbortSignal.timeout(req.timeoutMs ?? 90_000),
      });
    } catch (e) {
      throw new LlmError(`LLM request failed: ${(e as Error).message}`, true);
    }
    const text = await res.text();
    if (!res.ok) throw new LlmError(`LLM HTTP ${res.status}: ${safeError(text)}`, res.status === 429 || res.status >= 500, res.status);
    const j = JSON.parse(text) as { model?: string; choices?: { message?: { content?: string; refusal?: string }; finish_reason?: string }[]; usage?: { prompt_tokens?: number; completion_tokens?: number } };
    const choice = j.choices?.[0];
    if (choice?.message?.refusal) throw new LlmError(`Model refused: ${choice.message.refusal.slice(0, 200)}`, false);
    if (choice?.finish_reason === 'length') throw new LlmError('LLM output truncated (length)', true);
    const out = choice?.message?.content ?? '';
    return {
      json: parseJson(out), rawText: out, model: j.model ?? this.model,
      inputTokens: j.usage?.prompt_tokens ?? 0, outputTokens: j.usage?.completion_tokens ?? 0, latencyMs: Date.now() - started,
    };
  }
}

function parseJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    throw new LlmError('Model returned invalid JSON', true);
  }
}

/** Never echo provider error bodies wholesale: they can contain request details. */
function safeError(body: string): string {
  try {
    const j = JSON.parse(body) as { error?: { message?: string; code?: string } };
    return (j.error?.code ? `${j.error.code}: ` : '') + (j.error?.message ?? '').slice(0, 200).replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]');
  } catch {
    return body.slice(0, 120).replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]');
  }
}

export interface ProviderStatus {
  configured: boolean;
  provider: string;
  model: string;
  reason: string | null;
}

/** Resolves the configured provider. Returns null (with a reason) when none is configured. */
export function resolveLlm(): { provider: LlmProvider | null; status: ProviderStatus } {
  const openaiKey = process.env.OPENAI_API_KEY;
  const compatKey = process.env.LLM_API_KEY;
  const compatBase = process.env.LLM_BASE_URL;
  if (openaiKey) {
    const model = process.env.OPENAI_MODEL || 'gpt-6.1-sol';
    const p = new OpenAIResponsesProvider(openaiKey, model, process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1', process.env.OPENAI_REASONING_EFFORT || 'low');
    return { provider: p, status: { configured: true, provider: p.id, model, reason: null } };
  }
  if (compatKey && compatBase && process.env.LLM_MODEL) {
    const p = new ChatCompletionsProvider(compatKey, process.env.LLM_MODEL, compatBase);
    return { provider: p, status: { configured: true, provider: p.id, model: process.env.LLM_MODEL, reason: null } };
  }
  if (process.env.THESIS_FIXTURE_LLM === '1' && process.env.NODE_ENV !== 'production') {
    // Lazy import keeps the fixture out of the production code path entirely.
    return { provider: null, status: { configured: true, provider: 'fixture', model: 'synthetic-fixture', reason: 'Synthetic fixture provider (local testing only).' } };
  }
  return {
    provider: null,
    status: { configured: false, provider: 'none', model: 'none', reason: 'No LLM credential configured. Set OPENAI_API_KEY (or LLM_API_KEY, LLM_BASE_URL and LLM_MODEL).' },
  };
}
