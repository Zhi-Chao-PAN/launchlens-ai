import { jsonrepair } from "jsonrepair";

import type { ProviderName } from "./types";

const OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const MINIMAX_BASE_URL = "https://api.minimaxi.com/v1";
const DEFAULT_MINIMAX_MODEL = "MiniMax-M3";

export type RealProviderName = Exclude<ProviderName, "mock">;

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly publicCode:
      | "provider_failed"
      | "provider_timeout"
      | "provider_misconfigured"
      | "provider_validation_failed" = "provider_failed",
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export function configuredRealProvider(): RealProviderName | null {
  if (process.env.MINIMAX_API_KEY) {
    return "minimax";
  }

  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }

  return null;
}

export function parseJsonObject(content: string): Record<string, unknown> {
  const withoutThinking = content.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const fenced = withoutThinking.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const cleaned = fenced?.[1] ?? withoutThinking.trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new ProviderError(
      "Model response did not contain JSON.",
      "provider_validation_failed",
    );
  }

  const candidate = cleaned.slice(start, end + 1);

  try {
    return JSON.parse(candidate) as Record<string, unknown>;
  } catch {
    try {
      return JSON.parse(jsonrepair(candidate)) as Record<string, unknown>;
    } catch {
      throw new ProviderError(
        "Model response JSON could not be repaired.",
        "provider_validation_failed",
      );
    }
  }
}

export function validatedBaseUrl(options: {
  rawBaseUrl: string;
  allowedHosts: string;
}) {
  const { rawBaseUrl, allowedHosts } = options;
  let url: URL;

  try {
    url = new URL(rawBaseUrl);
  } catch {
    throw new ProviderError("Invalid provider base URL.", "provider_misconfigured");
  }

  if (url.protocol !== "https:") {
    throw new ProviderError(
      "Provider base URL must use HTTPS.",
      "provider_misconfigured",
    );
  }

  const allowed = allowedHosts
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  if (!allowed.includes(url.hostname.toLowerCase())) {
    throw new ProviderError(
      "Provider base URL host is not allowlisted.",
      "provider_misconfigured",
    );
  }

  return url.toString().replace(/\/$/, "");
}

export function responsesApiText(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "";
  }

  const record = data as Record<string, unknown>;

  if (typeof record.output_text === "string") {
    return record.output_text;
  }

  if (!Array.isArray(record.output)) {
    return "";
  }

  return record.output
    .flatMap((item) => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const contentParts = (item as Record<string, unknown>).content;

      if (!Array.isArray(contentParts)) {
        return [];
      }

      return contentParts
        .map((part) => {
          if (!part || typeof part !== "object") {
            return "";
          }

          const textValue = (part as Record<string, unknown>).text;
          return typeof textValue === "string" ? textValue : "";
        })
        .filter(Boolean);
    })
    .join("\n");
}

async function parseStructuredResponse(response: Response) {
  if (!response.ok) {
    throw new ProviderError(
      `Provider returned HTTP ${response.status}.`,
      "provider_failed",
    );
  }

  let data: {
    choices?: Array<{ message?: { content?: string } }>;
    status?: "completed" | "incomplete" | "failed";
  };

  try {
    data = (await response.json()) as typeof data;
  } catch {
    throw new ProviderError(
      "Provider response was not valid JSON.",
      "provider_validation_failed",
    );
  }

  if (data.status === "incomplete") {
    throw new ProviderError(
      "Provider response was incomplete.",
      "provider_validation_failed",
    );
  }

  if (data.status === "failed") {
    throw new ProviderError("Provider response failed.", "provider_failed");
  }

  const content = data.choices?.[0]?.message?.content ?? responsesApiText(data);

  if (!content) {
    throw new ProviderError("Provider returned an empty message.", "provider_failed");
  }

  return parseJsonObject(content);
}

export async function requestStructuredJson(options: {
  provider: RealProviderName;
  system: string;
  payload: unknown;
  openAiMaxTokens: number;
  miniMaxMaxOutputTokens: number;
  openAiTimeoutMs?: number;
  miniMaxTimeoutMs?: number;
}) {
  const {
    provider,
    system,
    payload,
    openAiMaxTokens,
    miniMaxMaxOutputTokens,
    openAiTimeoutMs = 15_000,
    miniMaxTimeoutMs = 55_000,
  } = options;
  const isMiniMax = provider === "minimax";
  const apiKey = isMiniMax
    ? process.env.MINIMAX_API_KEY
    : process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new ProviderError(
      "Provider API key is not configured.",
      "provider_misconfigured",
    );
  }

  const baseUrl = isMiniMax
    ? validatedBaseUrl({
        rawBaseUrl: process.env.MINIMAX_BASE_URL ?? MINIMAX_BASE_URL,
        allowedHosts:
          process.env.MINIMAX_ALLOWED_BASE_URL_HOSTS ??
          "api.minimaxi.com,api.minimax.io",
      })
    : validatedBaseUrl({
        rawBaseUrl: process.env.OPENAI_BASE_URL ?? OPENAI_BASE_URL,
        allowedHosts:
          process.env.OPENAI_ALLOWED_BASE_URL_HOSTS ?? "api.openai.com",
      });
  const model = isMiniMax
    ? (process.env.MINIMAX_MODEL ?? DEFAULT_MINIMAX_MODEL)
    : (process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL);
  let response: Response;

  try {
    response = await fetch(
      `${baseUrl}/${isMiniMax ? "responses" : "chat/completions"}`,
      {
        method: "POST",
        signal: AbortSignal.timeout(
          isMiniMax ? miniMaxTimeoutMs : openAiTimeoutMs,
        ),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isMiniMax
            ? {
                model,
                temperature: 0.1,
                max_output_tokens: miniMaxMaxOutputTokens,
                reasoning: { effort: "none" },
                response_format: { type: "json_object" },
                instructions: system,
                input: JSON.stringify(payload),
              }
            : {
                model,
                temperature: 0.1,
                max_tokens: openAiMaxTokens,
                response_format: { type: "json_object" },
                messages: [
                  { role: "system", content: system },
                  { role: "user", content: JSON.stringify(payload) },
                ],
              },
        ),
      },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ProviderError("Provider request timed out.", "provider_timeout");
    }

    throw new ProviderError("Provider request failed.", "provider_failed");
  }

  return parseStructuredResponse(response);
}
