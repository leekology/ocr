import type { PageItem } from "./state";
import { genId } from "./state";
import { generateThumbnail } from "./utils/image";

export interface PdfLoadResult {
  pages: PageItem[];
}

const PDFJS_CDN = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/build/pdf.min.mjs";
const PDFJS_WORKER_CDN = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/build/pdf.worker.min.mjs";

let pdfjsLib: typeof import("pdfjs-dist") | null = null;

async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import(/* @vite-ignore */ PDFJS_CDN) as typeof import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
  }
  return pdfjsLib;
}

export async function loadPdf(file: File, dpi = 200): Promise<PdfLoadResult> {
  const pdfjs = await getPdfjs();
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const pages: PageItem[] = [];

  const scale = dpi / 72;

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const vp = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = vp.width;
    canvas.height = vp.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport: vp }).promise;

    const bitmap = await createImageBitmap(canvas);
    const thumbnail = await generateThumbnail(bitmap);

    pages.push({
      id: genId(),
      sourceId: file.name,
      sourceName: file.name,
      pageIndex: i - 1,
      label: `${file.name} — p${i}`,
      bitmap,
      thumbnail,
      included: true,
      status: "pending",
      ocrResult: null,
      editedText: null,
      error: null,
    });

    canvas.width = 0;
    canvas.height = 0;
  }

  return { pages };
}

export async function loadImage(file: File): Promise<PdfLoadResult> {
  const bitmap = await createImageBitmap(file);
  const thumbnail = await generateThumbnail(bitmap);

  const page: PageItem = {
    id: genId(),
    sourceId: file.name,
    sourceName: file.name,
    pageIndex: 0,
    label: file.name,
    bitmap,
    thumbnail,
    included: true,
    status: "pending",
    ocrResult: null,
    editedText: null,
    error: null,
  };

  return { pages: [page] };
}

const PDF_MIME = "application/pdf";
const IMG_EXTS = [".png", ".jpg", ".jpeg", ".tiff", ".tif", ".webp", ".bmp", ".gif"];

function isPdf(file: File): boolean {
  return file.type === PDF_MIME || file.name.toLowerCase().endsWith(".pdf");
}

function isImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const lower = file.name.toLowerCase();
  return IMG_EXTS.some((ext) => lower.endsWith(ext));
}

export async function loadFiles(files: FileList | File[], dpi = 200): Promise<PageItem[]> {
  const allPages: PageItem[] = [];

  for (const file of Array.from(files)) {
    if (isPdf(file)) {
      const { pages } = await loadPdf(file, dpi);
      allPages.push(...pages);
    } else if (isImage(file)) {
      const { pages } = await loadImage(file);
      allPages.push(...pages);
    }
  }

  return allPages;
}
