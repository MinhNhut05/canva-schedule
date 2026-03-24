import "server-only";

export async function detectFileSignature(
  bytes: Uint8Array
): Promise<{ mime: string; ext: string } | undefined> {
  const { fileTypeFromBuffer } = await import("file-type");
  const result = await fileTypeFromBuffer(bytes);

  if (!result) {
    return undefined;
  }

  return {
    mime: result.mime,
    ext: result.ext,
  };
}
