/**
 * Robust client-side text copy. Tries navigator.clipboard.writeText first
 * when available, falls back to a synthetic <textarea> +
 * document.execCommand("copy"), and returns true if either path succeeded.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  // Modern async path
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy path (permission denied, insecure context, etc.)
    }
  }

  // Legacy synchronous fallback
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.setAttribute("aria-hidden", "true");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Trigger a programmatic file download from a text string. Returns true if
 * the anchor click was dispatched successfully.
 */
export function downloadTextFile(
  filename: string,
  text: string,
  mime = "text/plain;charset=utf-8",
): boolean {
  try {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    return true;
  } catch {
    return false;
  }
}
