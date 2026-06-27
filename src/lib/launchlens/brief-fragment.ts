import { briefFromJson, type BriefImportResult } from "./brief-from-json";

const BRIEF_HASH_PREFIX = "#brief=";

export function decodeBase64UrlUtf8(value: string): string {
  const normalized = decodeURIComponent(value.trim())
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded =
    padding === 0 ? normalized : normalized + "=".repeat(4 - padding);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function briefJsonFromHashFragment(hash: string): string | null {
  if (!hash.startsWith(BRIEF_HASH_PREFIX)) {
    return null;
  }

  const encoded = hash.slice(BRIEF_HASH_PREFIX.length);
  return encoded ? decodeBase64UrlUtf8(encoded) : null;
}

export function briefFromHashFragment(hash: string): BriefImportResult | null {
  const json = briefJsonFromHashFragment(hash);
  return json ? briefFromJson(json) : null;
}
