import type { PageItem } from "./state";
import {
  getIncludedPages,
  getExportSettings,
  updatePage,
  setProcessing,
  setProgress,
  setStatus,
} from "./state";
import { runOcr, getEngine } from "./ocr-engine";
import { itemsToMarkdown, mergeMarkdown } from "./utils/markdown";
import { zipSync, strToU8 } from "fflate";

// --- OCR Processing ---

export async function processAll(): Promise<void> {
  const pages = getIncludedPages().filter((p) => p.status !== "done");
  if (pages.length === 0) {
    setStatus("No pages to process.");
    return;
  }

  if (!getEngine()) {
    setStatus("OCR engine not ready.", true);
    return;
  }

  setProcessing(true);
  setProgress(0, pages.length);
  let done = 0;
  let errors = 0;

  for (const page of pages) {
    updatePage(page.id, { status: "running", error: null });
    setStatus(`Processing ${page.label} (${done + 1}/${pages.length})...`);

    try {
      const result = await runOcr(page.bitmap);
      updatePage(page.id, { status: "done", ocrResult: result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      updatePage(page.id, { status: "error", error: msg });
      errors++;
    }

    done++;
    setProgress(done, pages.length);
  }

  setProcessing(false);
  setStatus(`Done. ${done - errors}/${pages.length} pages processed.${errors > 0 ? ` ${errors} errors.` : ""}`);
}

export async function processSingle(pageId: string): Promise<void> {
  const page = getIncludedPages().find((p) => p.id === pageId);
  if (!page) return;
  if (!getEngine()) {
    setStatus("OCR engine not ready.", true);
    return;
  }

  updatePage(page.id, { status: "running", error: null });
  setStatus(`Processing ${page.label}...`);

  try {
    const result = await runOcr(page.bitmap);
    updatePage(page.id, { status: "done", ocrResult: result });
    setStatus(`Done: ${page.label} — ${result.items.length} text regions found.`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    updatePage(page.id, { status: "error", error: msg });
    setStatus(`Error processing ${page.label}: ${msg}`, true);
  }
}

// --- Export ---

function buildPageMarkdown(page: PageItem, includeScores: boolean): string {
  if (page.editedText !== null) {
    return page.editedText;
  }
  if (!page.ocrResult) return "";
  return itemsToMarkdown(page.ocrResult.items, {
    includeScores,
    pageHeader: `## ${page.sourceName} — Page ${page.pageIndex + 1}`,
  });
}

function formatName(template: string, page: PageItem): string {
  return template
    .replace(/\{name\}/g, page.sourceName.replace(/\.[^.]+$/, ""))
    .replace(/\{page\}/g, String(page.pageIndex + 1))
    .replace(/\{id\}/g, page.id);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportFiles(): Promise<void> {
  const pages = getIncludedPages().filter((p) => p.status === "done" || p.editedText !== null);
  if (pages.length === 0) {
    setStatus("No processed pages to export.", true);
    return;
  }

  const settings = getExportSettings();

  if (settings.mode === "merged") {
    const parts = pages.map((p) => buildPageMarkdown(p, settings.includeScores));
    const merged = mergeMarkdown(parts);
    const blob = new Blob([merged], { type: "text/markdown" });
    downloadBlob(blob, "merged.md");
    setStatus(`Exported merged markdown (${pages.length} pages).`);
  } else {
    const zipEntries: Record<string, Uint8Array> = {};
    for (const page of pages) {
      const name = formatName(settings.nameTemplate, page) + ".md";
      const md = buildPageMarkdown(page, settings.includeScores);
      zipEntries[name] = strToU8(md);
    }
    const zipped = zipSync(zipEntries);
    const blob = new Blob([zipped as unknown as BlobPart], { type: "application/zip" });
    downloadBlob(blob, "ocr-results.zip");
    setStatus(`Exported ZIP with ${pages.length} markdown files.`);
  }
}
