#!/usr/bin/env node
/**
 * DEMO_SCENARIO 마크다운을 PDF/DOCX로 변환.
 *
 * 사용:
 *   node scripts/build-demo-doc.mjs
 *
 * 출력:
 *   ../../docs/DEMO_SCENARIO_2026-06-05.pdf
 *   ../../docs/DEMO_SCENARIO_2026-06-05.docx
 *   (기존 .md 파일은 그대로 유지)
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import puppeteer from "puppeteer";
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.join(__dirname, "..", "..", "docs");
const SRC = path.join(DOCS_DIR, "DEMO_SCENARIO_2026-06-05.md");
const PDF_OUT = path.join(DOCS_DIR, "DEMO_SCENARIO_2026-06-05.pdf");
const DOCX_OUT = path.join(DOCS_DIR, "DEMO_SCENARIO_2026-06-05.docx");

async function main() {
  const md = await readFile(SRC, "utf-8");

  // === 1. PDF (puppeteer로 HTML 렌더 → PDF print) ===
  console.log("[1/2] PDF 생성 중...");
  const htmlBody = marked.parse(md);
  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>터무니 발표 시연 시나리오</title><style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap');
    body { font-family: 'Noto Sans KR', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.65; font-size: 14px; }
    h1 { font-size: 28px; border-bottom: 3px solid #2d4f3a; padding-bottom: 10px; color: #2d4f3a; margin-top: 32px; }
    h2 { font-size: 22px; border-bottom: 2px solid #c9a455; padding-bottom: 6px; color: #1a1a1a; margin-top: 28px; }
    h3 { font-size: 18px; color: #2d4f3a; margin-top: 24px; }
    h4 { font-size: 15px; color: #555; margin-top: 16px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th { background: #2d4f3a; color: #fff; padding: 8px 12px; text-align: left; font-weight: 700; font-size: 13px; }
    td { border: 1px solid #e0d8c8; padding: 8px 12px; font-size: 13px; vertical-align: top; }
    tr:nth-child(even) td { background: #faf7f0; }
    code { background: #f0ebdf; padding: 2px 6px; border-radius: 3px; font-family: 'Consolas', monospace; font-size: 12px; color: #8b3a3a; }
    pre { background: #f0ebdf; padding: 12px; border-radius: 6px; overflow-x: auto; }
    pre code { background: transparent; padding: 0; color: #1a1a1a; }
    ul, ol { margin: 8px 0; padding-left: 24px; }
    li { margin: 4px 0; }
    blockquote { border-left: 4px solid #c9a455; padding-left: 16px; color: #555; margin: 12px 0; }
    hr { border: none; border-top: 1px dashed #c9a455; margin: 24px 0; }
    a { color: #2d4f3a; text-decoration: underline; }
    strong { color: #1a1a1a; font-weight: 700; }
  </style></head><body>${htmlBody}</body></html>`;

  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({
    path: PDF_OUT,
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", bottom: "20mm", left: "18mm", right: "18mm" },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:9px; color:#888; text-align:center; width:100%;">터무니 (Trust Ark) — 발표 시연 시나리오</div>',
    footerTemplate: '<div style="font-size:9px; color:#888; text-align:center; width:100%;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
  });
  await browser.close();
  console.log(`  ✓ ${PDF_OUT}`);

  // === 2. DOCX (docx 패키지로 직접 구성) ===
  console.log("[2/2] DOCX 생성 중...");
  const docChildren = mdToDocxChildren(md);
  const doc = new Document({
    creator: "터무니 팀",
    title: "터무니 발표 시연 시나리오",
    description: "디엘톤 발표 (10분 데모) 시나리오 + Q&A + 로드맵",
    styles: {
      paragraphStyles: [
        { id: "Normal", name: "Normal", run: { font: "맑은 고딕", size: 22 }, paragraph: { spacing: { before: 60, after: 60 } } }
      ]
    },
    sections: [{ properties: {}, children: docChildren }]
  });
  const buffer = await Packer.toBuffer(doc);
  await writeFile(DOCX_OUT, buffer);
  console.log(`  ✓ ${DOCX_OUT}`);

  console.log("\n=== 완료 ===");
  console.log(`MD:   ${SRC}`);
  console.log(`PDF:  ${PDF_OUT}`);
  console.log(`DOCX: ${DOCX_OUT}`);
}

/** 마크다운을 docx Paragraph[] 배열로 단순 변환 */
function mdToDocxChildren(md) {
  const lines = md.split("\n");
  const children = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let tableBuffer = null;

  const flushTable = () => {
    if (tableBuffer && tableBuffer.length > 0) {
      children.push(buildTable(tableBuffer));
      tableBuffer = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");

    // 코드블록
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushTable();
        children.push(new Paragraph({ children: [new TextRun({ text: codeBuffer.join("\n"), font: "Consolas", size: 18 })], shading: { fill: "F0EBDF" } }));
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // 표
    if (line.startsWith("|")) {
      flushTable();
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.every((c) => /^[-:\s]+$/.test(c))) continue; // separator skip
      tableBuffer = tableBuffer ?? [];
      tableBuffer.push(cells);
      continue;
    } else {
      flushTable();
    }

    // 헤딩
    if (line.startsWith("# ")) {
      children.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
      continue;
    }
    if (line.startsWith("## ")) {
      children.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2, spacing: { before: 320, after: 160 } }));
      continue;
    }
    if (line.startsWith("### ")) {
      children.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3, spacing: { before: 240, after: 120 } }));
      continue;
    }
    if (line.startsWith("#### ")) {
      children.push(new Paragraph({ text: line.slice(5), heading: HeadingLevel.HEADING_4, spacing: { before: 200, after: 100 } }));
      continue;
    }

    // 구분선
    if (/^---+$/.test(line.trim())) {
      children.push(new Paragraph({ text: "", border: { bottom: { color: "C9A455", space: 4, style: "single", size: 6 } } }));
      continue;
    }

    // 리스트
    if (/^(\s*)[-*]\s+/.test(line)) {
      const m = line.match(/^(\s*)[-*]\s+(.*)$/);
      const text = m ? m[2] : line;
      children.push(new Paragraph({ children: parseInlineRuns(text), bullet: { level: 0 } }));
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const m = line.match(/^\s*\d+\.\s+(.*)$/);
      const text = m ? m[1] : line;
      children.push(new Paragraph({ children: parseInlineRuns(text), numbering: { reference: "default-num", level: 0 } }));
      continue;
    }

    // 빈 줄
    if (line.trim() === "") {
      children.push(new Paragraph({ children: [new TextRun("")] }));
      continue;
    }

    // 일반 텍스트
    children.push(new Paragraph({ children: parseInlineRuns(line) }));
  }

  flushTable();
  return children;
}

/** 인라인 마크다운(`**bold**`, `` `code` ``)을 TextRun[]로 분할 */
function parseInlineRuns(text) {
  const runs = [];
  const pattern = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let lastEnd = 0;
  let m;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > lastEnd) runs.push(new TextRun({ text: text.slice(lastEnd, m.index) }));
    if (m[1] != null) runs.push(new TextRun({ text: m[1], bold: true }));
    else if (m[2] != null) runs.push(new TextRun({ text: m[2], font: "Consolas", color: "8B3A3A" }));
    lastEnd = pattern.lastIndex;
  }
  if (lastEnd < text.length) runs.push(new TextRun({ text: text.slice(lastEnd) }));
  return runs.length > 0 ? runs : [new TextRun({ text })];
}

/** 표 헤더 1행 + 데이터 N행을 docx Table로 빌드 */
function buildTable(rows) {
  if (rows.length === 0) return new Paragraph({ text: "" });
  const header = rows[0];
  const body = rows.slice(1);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: header.map((cell) =>
          new TableCell({
            shading: { fill: "2D4F3A" },
            children: [new Paragraph({ children: [new TextRun({ text: cell, bold: true, color: "FFFFFF", size: 20 })], alignment: AlignmentType.LEFT })]
          })
        )
      }),
      ...body.map(
        (row, ri) =>
          new TableRow({
            children: row.map((cell) =>
              new TableCell({
                shading: ri % 2 === 1 ? { fill: "FAF7F0" } : undefined,
                children: [new Paragraph({ children: parseInlineRuns(cell), alignment: AlignmentType.LEFT })]
              })
            )
          })
      )
    ]
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
