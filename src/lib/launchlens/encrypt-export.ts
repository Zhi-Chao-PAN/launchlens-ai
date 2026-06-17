"use client";
/**
 * Password-based encryption for LaunchLens JSON exports.
 * AES-GCM 256 + PBKDF2-SHA256 with random salt/iv.
 * Wire format: "launchlens-enc-v1." + b64(salt) + "." + b64(iv) + "." + b64(ciphertext+tag)
 */

export const ENCRYPTED_FILE_PREFIX = "launchlens-enc-v1.";

function toB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as number[]);
  }
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromB64(s: string): Uint8Array {
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

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const pw = enc.encode(password);
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    pw.buffer as ArrayBuffer,
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: toArrayBuffer(salt), iterations: 120000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptJson(plaintext: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encoded = enc.encode(plaintext);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(encoded),
  );
  return ENCRYPTED_FILE_PREFIX + [toB64(toArrayBuffer(salt)), toB64(toArrayBuffer(iv)), toB64(ciphertext)].join(".");
}

export function isEncryptedPayload(text: string): boolean {
  return text.startsWith(ENCRYPTED_FILE_PREFIX);
}

export async function decryptToJson(payload: string, password: string): Promise<string> {
  if (!isEncryptedPayload(payload)) throw new Error("Not an encrypted payload");
  const parts = payload.slice(ENCRYPTED_FILE_PREFIX.length).split(".");
  if (parts.length !== 3) throw new Error("Malformed encrypted payload");
  const salt = fromB64(parts[0]);
  const iv = fromB64(parts[1]);
  const data = fromB64(parts[2]);
  const key = await deriveKey(password, salt);
  const plain = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(data),
  );
  return new TextDecoder().decode(plain);
}

export function randomPassword(): string {
  const bytes = window.crypto.getRandomValues(new Uint8Array(9));
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}
