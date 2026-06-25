/**
 * Password-based encryption for LaunchLens JSON exports.
 * AES-GCM 256 + PBKDF2-SHA256 with random salt/iv.
 * Wire format: "launchlens-enc-v1." + b64(salt) + "." + b64(iv) + "." + b64(ciphertext+tag)
 *
 * The Crypto provider is injected so the helpers can be unit-tested in a node
 * environment. By default we use the global crypto available in browsers and
 * modern Node 20+.
 */

export const ENCRYPTED_FILE_PREFIX = "launchlens-enc-v1.";
const PBKDF2_ITERATIONS = 120_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const RANDOM_PASSWORD_BYTES = 9;

export type CryptoProvider = {
  getRandomValues: <T extends ArrayBufferView | null>(array: T) => T;
  subtle: {
    importKey: (format: string, keyData: ArrayBuffer, algo: string, extractable: boolean, usages: string[]) => Promise<unknown>;
    deriveKey: (params: unknown, keyMaterial: unknown, derivedAlgo: unknown, extractable: boolean, usages: string[]) => Promise<unknown>;
    encrypt: (params: unknown, key: unknown, data: ArrayBuffer) => Promise<ArrayBuffer>;
    decrypt: (params: unknown, key: unknown, data: ArrayBuffer) => Promise<ArrayBuffer>;
  };
};

export function defaultCryptoProvider(): CryptoProvider | null {
  const c = (globalThis as { crypto?: CryptoProvider }).crypto;
  return c ?? null;
}

function getCrypto(provider?: CryptoProvider): CryptoProvider {
  return provider ?? defaultCryptoProvider() ?? ((): never => { throw new Error("Crypto API unavailable"); })();
}

function toB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as number[]);
  }
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function fromB64(s: string): Uint8Array {
  const padded = s.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function toArrayBuffer(u: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(u.length);
  copy.set(u);
  return copy.buffer.slice(0) as ArrayBuffer;
}

async function deriveKey(
  provider: CryptoProvider,
  password: string,
  salt: Uint8Array,
): Promise<unknown> {
  const enc = new TextEncoder();
  const pw = enc.encode(password);
  const keyMaterial = await provider.subtle.importKey(
    "raw",
    pw.buffer as ArrayBuffer,
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return provider.subtle.deriveKey(
    { name: "PBKDF2", salt: toArrayBuffer(salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptJson(
  plaintext: string,
  password: string,
  provider?: CryptoProvider,
): Promise<string> {
  const crypto = getCrypto(provider);
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(crypto, password, salt);
  const encoded = enc.encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(encoded),
  );
  return ENCRYPTED_FILE_PREFIX + [toB64(toArrayBuffer(salt)), toB64(toArrayBuffer(iv)), toB64(ciphertext)].join(".");
}

export function isEncryptedPayload(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  return text.startsWith(ENCRYPTED_FILE_PREFIX);
}

export async function decryptToJson(
  payload: string,
  password: string,
  provider?: CryptoProvider,
): Promise<string> {
  const crypto = getCrypto(provider);
  if (!isEncryptedPayload(payload)) throw new Error("Not an encrypted payload");
  const parts = payload.slice(ENCRYPTED_FILE_PREFIX.length).split(".");
  if (parts.length !== 3) throw new Error("Malformed encrypted payload");
  const salt = fromB64(parts[0]);
  const iv = fromB64(parts[1]);
  const data = fromB64(parts[2]);
  const key = await deriveKey(crypto, password, salt);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(data),
  );
  return new TextDecoder().decode(plain);
}

export function randomPassword(
  provider?: CryptoProvider,
  length = RANDOM_PASSWORD_BYTES,
): string {
  const crypto = getCrypto(provider);
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}
