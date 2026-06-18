export type InlineMarkdownSegment =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "code"; value: string }
  | { type: "link"; value: string; href: string };

/**
 * Parses a very small subset of inline Markdown into typed segments.
 * Supports **bold**, *italic*, `code`, and [text](https://url).
 * Escaping with a backslash prevents parsing of the next special char.
 * Intentionally tiny: no block constructs, no nesting.
 */
export function parseInlineMarkdown(input: string): InlineMarkdownSegment[] {
  const segments: InlineMarkdownSegment[] = [];
  let buffer = "";
  let i = 0;

  function flush() {
    if (buffer.length > 0) {
      segments.push({ type: "text", value: buffer });
      buffer = "";
    }
  }

  function appendText(s: string) {
    buffer += s;
  }

  while (i < input.length) {
    const ch = input[i];
    if (ch === "\\" && i + 1 < input.length) {
      appendText(input[i + 1]);
      i += 2;
      continue;
    }

    if (ch === "*" && input[i + 1] === "*") {
      const end = input.indexOf("**", i + 2);
      if (end > i + 2) {
        flush();
        segments.push({ type: "bold", value: input.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
      appendText(ch);
      i += 1;
      continue;
    }

    if (ch === "*") {
      const end = input.indexOf("*", i + 1);
      if (end > i + 1) {
        flush();
        segments.push({ type: "italic", value: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
      appendText(ch);
      i += 1;
      continue;
    }

    if (ch === "`") {
      const end = input.indexOf("`", i + 1);
      if (end > i + 1) {
        flush();
        segments.push({ type: "code", value: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
      appendText(ch);
      i += 1;
      continue;
    }

    if (ch === "[") {
      const openParen = input.indexOf("](", i + 1);
      if (openParen > i + 1) {
        // Scan forward, taking the last ')' until whitespace/newline, so urls
        // containing ')' (e.g. mailto:foo@bar?subject=a(b)) still parse.
        let closeUrl = -1;
        for (let k = openParen + 2; k < input.length; k++) {
          if (input[k] === ")") {
            closeUrl = k;
          } else if (input[k] === " " || input[k] === "\n" || input[k] === "\t") {
            break;
          }
        }
        if (closeUrl > openParen + 2) {
          flush();
          segments.push({
            type: "link",
            value: input.slice(i + 1, openParen),
            href: input.slice(openParen + 2, closeUrl),
          });
          i = closeUrl + 1;
          continue;
        }
      }
      appendText(ch);
      i += 1;
      continue;
    }

    if ((ch === "h") && (input.slice(i, i + 7) === "http://" || input.slice(i, i + 8) === "https://")) {
      let end = i;
      while (end < input.length && !/[\s\t\n\r\)\]>"']/.test(input[end])) end++;
      let url = input.slice(i, end);
      while (url.length && /[.,;:!?]/.test(url[url.length - 1])) url = url.slice(0, -1);
      if (url.length > 7) {
        flush();
        segments.push({ type: "link", value: url, href: url });
        i += url.length;
        continue;
      }
    }

    appendText(ch);
    i += 1;
  }
  flush();
  return segments;
}
