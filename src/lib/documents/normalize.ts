/**
 * Normalize extracted text for quality scoring and downstream use.
 * Steps:
 * 1. Unicode NFC normalization
 * 2. Convert CRLF/CR to LF
 * 3. Collapse repeated spaces (preserve paragraph breaks)
 * 4. Trim lines and overall
 * 5. NEVER ASCII-fold — preserve Vietnamese diacritics exactly
 */
export function normalizeText(raw: string): string {
  let text = raw;
  text = text.normalize("NFC");
  text = text.replace(/\r\n/g, "\n");
  text = text.replace(/\r/g, "\n");
  text = text.replace(/[^\S\n]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
  text = text.trim();
  return text;
}
