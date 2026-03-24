import "server-only";
import mammoth from "mammoth";

interface DocxExtractionOutput {
  rawText: string;
  warnings: string[];
  lineCount: number;
}

export async function extractDocxText(
  buffer: Buffer
): Promise<DocxExtractionOutput> {
  const result = await mammoth.extractRawText({ buffer });
  const warnings = result.messages.map((message) => message.message);
  const lines = result.value
    .split("\n")
    .filter((line) => line.trim().length > 0);

  return {
    rawText: result.value,
    warnings,
    lineCount: lines.length,
  };
}
