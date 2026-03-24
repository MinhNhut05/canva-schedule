import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

import fontkit from "@pdf-lib/fontkit";
import JSZip from "jszip";
import { PDFDocument, rgb } from "pdf-lib";

const FIXTURES_DIR = path.join(process.cwd(), "tests/fixtures/documents");
const FONT_PATH = "/usr/share/fonts/liberation-sans-fonts/LiberationSans-Regular.ttf";

const TOUR_LINES = [
  "CHƯƠNG TRÌNH TOUR",
  "Ngày 1: Buổi sáng - Khởi hành từ TP.HCM",
  "Tham quan Dinh Độc Lập",
  "Buổi chiều - Chợ Bến Thành",
  "Thực đơn: Cơm tấm, phở bò, bánh mì",
];

async function ensureDir() {
  await fs.mkdir(FIXTURES_DIR, { recursive: true });
}

async function loadFontBytes() {
  return fs.readFile(FONT_PATH);
}

async function createVietnamesePdf(outputPath: string) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontBytes = await loadFontBytes();
  const font = await pdfDoc.embedFont(fontBytes, { subset: true });

  let y = page.getHeight() - 80;
  for (const line of TOUR_LINES) {
    page.drawText(line, {
      x: 50,
      y,
      size: line === TOUR_LINES[0] ? 18 : 13,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 32;
  }

  const bytes = await pdfDoc.save();
  await fs.writeFile(outputPath, bytes);
}

async function createEmptyPdf(outputPath: string) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([595.28, 841.89]);
  const bytes = await pdfDoc.save();
  await fs.writeFile(outputPath, bytes);
}

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function createDocx(outputPath: string) {
  const zip = new JSZip();

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  );

  zip.folder("_rels")?.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );

  zip.folder("word")?.file(
    "document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${TOUR_LINES.map(
      (line) => `<w:p><w:r><w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r></w:p>`,
    ).join("\n    ")}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`,
  );

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  await fs.writeFile(outputPath, buffer);
}

async function createRandomBinary(outputPath: string) {
  await fs.writeFile(outputPath, randomBytes(100));
}

async function verifyFile(outputPath: string) {
  const stats = await fs.stat(outputPath);
  if (stats.size === 0) {
    throw new Error(`Fixture is empty: ${outputPath}`);
  }
}

async function main() {
  await ensureDir();

  const pdfPath = path.join(FIXTURES_DIR, "sample-tour-vi.pdf");
  const docxPath = path.join(FIXTURES_DIR, "sample-tour-vi.docx");
  const emptyPdfPath = path.join(FIXTURES_DIR, "empty-no-text.pdf");
  const binaryPath = path.join(FIXTURES_DIR, "not-a-pdf.bin");

  await createVietnamesePdf(pdfPath);
  await createDocx(docxPath);
  await createEmptyPdf(emptyPdfPath);
  await createRandomBinary(binaryPath);

  await Promise.all([
    verifyFile(pdfPath),
    verifyFile(docxPath),
    verifyFile(emptyPdfPath),
    verifyFile(binaryPath),
  ]);

  console.log("Fixture generation complete");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
