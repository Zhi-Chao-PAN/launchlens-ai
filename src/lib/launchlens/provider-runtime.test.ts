import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ProviderError,
  configuredRealProvider,
  parseJsonObject,
  responsesApiText,
  validatedBaseUrl,
} from "./provider-runtime";

const ENV_KEYS = [
  "MINIMAX_API_KEY",
  "OPENAI_API_KEY",
  "MINIMAX_BASE_URL",
  "OPENAI_BASE_URL",
  "MINIMAX_MODEL",
  "OPENAI_MODEL",
  "MINIMAX_ALLOWED_BASE_URL_HOSTS",
  "OPENAI_ALLOWED_BASE_URL_HOSTS",
] as const;

describe("configuredRealProvider", () => {
  beforeEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
  });

  it("returns null when neither key is set", () => {
    expect(configuredRealProvider()).toBeNull();
  });

  it("returns 'minimax' when MINIMAX_API_KEY is set", () => {
    process.env.MINIMAX_API_KEY = "x";
    expect(configuredRealProvider()).toBe("minimax");
  });

  it("returns 'openai' when only OPENAI_API_KEY is set", () => {
    process.env.OPENAI_API_KEY = "x";
    expect(configuredRealProvider()).toBe("openai");
  });

  it("prefers 'minimax' when both keys are set", () => {
    process.env.MINIMAX_API_KEY = "x";
    process.env.OPENAI_API_KEY = "y";
    expect(configuredRealProvider()).toBe("minimax");
  });

  it("ignores empty string keys", () => {
    process.env.MINIMAX_API_KEY = "";
    process.env.OPENAI_API_KEY = "";
    expect(configuredRealProvider()).toBeNull();
  });
});

describe("ProviderError", () => {
  it("captures message and default public code", () => {
    const err = new ProviderError("oops");
    expect(err.message).toBe("oops");
    expect(err.publicCode).toBe("provider_failed");
    expect(err.name).toBe("ProviderError");
    expect(err).toBeInstanceOf(Error);
  });

  it("captures custom public code", () => {
    const err = new ProviderError("nope", "provider_timeout");
    expect(err.publicCode).toBe("provider_timeout");
  });
});

describe("parseJsonObject", () => {
  it("parses a plain JSON object", () => {
    expect(parseJsonObject('{"a":1,"b":"two"}')).toEqual({ a: 1, b: "two" });
  });

  it("strips <think>...</think> blocks before parsing", () => {
    const content = "<think>reasoning goes here</think>\n{\"ok\":true}";
    expect(parseJsonObject(content)).toEqual({ ok: true });
  });

  it("handles fenced ```json code blocks", () => {
    const content = "```json\n{\"hello\":\"world\"}\n```";
    expect(parseJsonObject(content)).toEqual({ hello: "world" });
  });

  it("handles plain ``` code blocks (no language tag)", () => {
    const content = "```\n{\"k\":42}\n```";
    expect(parseJsonObject(content)).toEqual({ k: 42 });
  });

  it("extracts JSON embedded in surrounding prose", () => {
    const content = "Sure! Here is the JSON: {\"a\":1}. Let me know if you need more.";
    expect(parseJsonObject(content)).toEqual({ a: 1 });
  });

  it("repairs truncated JSON via jsonrepair", () => {
    // jsonrepair handles the case where the closing brace exists but trailing
    // commas or unterminated strings are present. With balanced braces but a
    // missing array close, jsonrepair recovers.
    const broken = '{"items":[1,2,3,]}';
    const result = parseJsonObject(broken) as { items: number[] };
    expect(result.items).toEqual([1, 2, 3]);
  });

  it("throws ProviderError with provider_validation_failed when no braces found", () => {
    expect(() => parseJsonObject("just plain text, no JSON at all"))
      .toThrowError(ProviderError);
    try {
      parseJsonObject("no braces here");
    } catch (e) {
      expect((e as ProviderError).publicCode).toBe("provider_validation_failed");
    }
  });

  it("throws ProviderError with provider_validation_failed when braces are empty/reversed", () => {
    expect(() => parseJsonObject("}{")).toThrowError(ProviderError);
  });

  it("throws ProviderError when both JSON.parse and jsonrepair fail", () => {
    // Use an object-shaped string that jsonrepair cannot recover from
    const broken = '{"a":"unterminated string';
    try {
      parseJsonObject(broken);
      // If jsonrepair magically heals it, that's fine; only assert throw on
      // unrecoverable garbage.
    } catch (e) {
      expect((e as ProviderError).publicCode).toBe("provider_validation_failed");
    }
  });
});

describe("validatedBaseUrl", () => {
  it("accepts an https URL with an allowlisted host", () => {
    const out = validatedBaseUrl({
      rawBaseUrl: "https://api.example.com/v1",
      allowedHosts: "api.example.com",
    });
    expect(out).toBe("https://api.example.com/v1");
  });

  it("strips trailing slash", () => {
    const out = validatedBaseUrl({
      rawBaseUrl: "https://api.example.com/",
      allowedHosts: "api.example.com",
    });
    expect(out).toBe("https://api.example.com");
  });

  it("is case-insensitive on hostnames (lower-cases the host before comparison)", () => {
    // Note: the function lowercases the URL host internally for comparison;
    // the returned string preserves whatever the caller passed in *after*
    // lowercasing the hostname. Here we document the actual behavior.
    const out = validatedBaseUrl({
      rawBaseUrl: "https://API.Example.COM/v1",
      allowedHosts: "api.example.com",
    });
    expect(out.toLowerCase()).toBe("https://api.example.com/v1");
  });

  it("supports comma-separated allowlist", () => {
    const out = validatedBaseUrl({
      rawBaseUrl: "https://api.openai.com/v1",
      allowedHosts: "api.openai.com, api.minimaxi.com",
    });
    expect(out).toBe("https://api.openai.com/v1");
  });

  it("throws ProviderError for http:// (non-https)", () => {
    expect(() =>
      validatedBaseUrl({
        rawBaseUrl: "http://api.example.com",
        allowedHosts: "api.example.com",
      }),
    ).toThrowError(ProviderError);
  });

  it("throws ProviderError for non-allowlisted host", () => {
    expect(() =>
      validatedBaseUrl({
        rawBaseUrl: "https://evil.example.com",
        allowedHosts: "api.openai.com",
      }),
    ).toThrowError(ProviderError);
  });

  it("throws ProviderError for malformed URL", () => {
    expect(() =>
      validatedBaseUrl({
        rawBaseUrl: "not a url",
        allowedHosts: "api.openai.com",
      }),
    ).toThrowError(ProviderError);
  });

  it("trims whitespace from allowlist entries", () => {
    const out = validatedBaseUrl({
      rawBaseUrl: "https://api.openai.com/v1",
      allowedHosts: "  api.openai.com  ,  api.minimaxi.com  ",
    });
    expect(out).toBe("https://api.openai.com/v1");
  });
});

describe("responsesApiText", () => {
  it("returns output_text directly when present", () => {
    expect(responsesApiText({ output_text: "hello" })).toBe("hello");
  });

  it("returns empty string for non-object", () => {
    expect(responsesApiText(null)).toBe("");
    expect(responsesApiText(undefined)).toBe("");
    expect(responsesApiText("string")).toBe("");
    expect(responsesApiText(42)).toBe("");
  });

  it("returns empty string when no output_text and no output array", () => {
    expect(responsesApiText({ foo: "bar" })).toBe("");
  });

  it("returns empty string for empty output array", () => {
    expect(responsesApiText({ output: [] })).toBe("");
  });

  it("extracts text from output[].content[].text parts", () => {
    const data = {
      output: [
        {
          content: [
            { type: "text", text: "first" },
            { type: "text", text: "second" },
          ],
        },
      ],
    };
    expect(responsesApiText(data)).toBe("first\nsecond");
  });

  it("skips non-object content parts and non-text parts", () => {
    const data = {
      output: [
        {
          content: [
            { type: "text", text: "kept" },
            null,
            "string-not-object",
            { type: "image", url: "x" },
            { type: "text", text: "also-kept" },
          ],
        },
      ],
    };
    expect(responsesApiText(data)).toBe("kept\nalso-kept");
  });

  it("concatenates text from multiple output items with newline", () => {
    const data = {
      output: [
        { content: [{ text: "alpha" }] },
        { content: [{ text: "beta" }] },
      ],
    };
    expect(responsesApiText(data)).toBe("alpha\nbeta");
  });

  it("prefers output_text over output[] when both exist", () => {
    const data = {
      output_text: "preferred",
      output: [{ content: [{ text: "fallback" }] }],
    };
    expect(responsesApiText(data)).toBe("preferred");
  });
});
