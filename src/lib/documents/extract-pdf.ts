import "server-only";

interface PdfExtractionOutput {
  rawText: string;
  pageCount: number;
  warnings: string[];
  textItemCount: number;
}

export async function extractPdfText(
  data: Uint8Array
): Promise<PdfExtractionOutput> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { getDocument } = pdfjsLib;

  const pdf = await getDocument({ data }).promise;
  const pages: string[] = [];
  const warnings: string[] = [];
  let totalTextItems = 0;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .filter(Boolean);

    totalTextItems += strings.length;
    pages.push(strings.join(" "));
    page.cleanup();
  }

  if (totalTextItems === 0 && pdf.numPages > 0) {
    warnings.push(
      "PDF có trang nhưng không có nội dung text. File có thể là ảnh scan."
    );
  }

  return {
    rawText: pages.join("\n\n"),
    pageCount: pdf.numPages,
    warnings,
    textItemCount: totalTextItems,
  };
}
