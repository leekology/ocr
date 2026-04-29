import { EventEmitter } from "./utils/events";
import type { OcrResult, OcrResultItem } from "./types/paddleocr";

// --- Types ---

export interface PageItem {
  id: string;
  sourceId: string;
  sourceName: string;
  pageIndex: number;
  label: string;
  bitmap: ImageBitmap;
  thumbnail: string;
  included: boolean;
  status: "pending" | "running" | "done" | "error";
  ocrResult: OcrResult | null;
  editedText: string | null;
  error: string | null;
}

export interface OcrSettings {
  lang: string;
  backend: "auto" | "webgpu" | "wasm";
  numThreads: number;
  detThresh: number;
  boxThresh: number;
  unclipRatio: number;
  recScoreThresh: number;
  detLimitSideLen: number;
  detLimitType: "min" | "max";
  detMaxSideLimit: number;
  detBatchSize: number;
  recBatchSize: number;
  customPipelineYaml: string;
  customDetModelUrl: string;
  customRecModelUrl: string;
}

export interface ExportSettings {
  mode: "merged" | "separate";
  includeScores: boolean;
  includeImages: boolean;
  nameTemplate: string;
}

export interface AppState {
  pages: PageItem[];
  selectedPageId: string | null;
  ocrSettings: OcrSettings;
  exportSettings: ExportSettings;
  ocrReady: boolean;
  ocrInitializing: boolean;
  processing: boolean;
  processingProgress: { current: number; total: number } | null;
  statusText: string;
  statusError: boolean;
}

export interface AppEvents {
  "state:change": AppState;
  "pages:change": PageItem[];
  "selected:change": string | null;
  "ocr:ready": boolean;
  "status": { text: string; error: boolean };
  "progress": { current: number; total: number } | null;
}

// --- Defaults ---

export const defaultOcrSettings: OcrSettings = {
  lang: "ch",
  backend: "auto",
  numThreads: 2,
  detThresh: 0.3,
  boxThresh: 0.6,
  unclipRatio: 1.5,
  recScoreThresh: 0.1,
  detLimitSideLen: 960,
  detLimitType: "max",
  detMaxSideLimit: 4000,
  detBatchSize: 1,
  recBatchSize: 1,
  customPipelineYaml: "",
  customDetModelUrl: "",
  customRecModelUrl: "",
};

export const defaultExportSettings: ExportSettings = {
  mode: "separate",
  includeScores: false,
  includeImages: false,
  nameTemplate: "{name}_p{page}",
};

// --- State ---

let nextId = 1;
export function genId(): string {
  return `page_${nextId++}`;
}

const state: AppState = {
  pages: [],
  selectedPageId: null,
  ocrSettings: { ...defaultOcrSettings },
  exportSettings: { ...defaultExportSettings },
  ocrReady: false,
  ocrInitializing: false,
  processing: false,
  processingProgress: null,
  statusText: "Ready.",
  statusError: false,
};

export const events = new EventEmitter<AppEvents>();

function emit<K extends keyof AppEvents>(event: K, data: AppEvents[K]) {
  events.emit(event, data);
}

// --- Accessors ---

export function getState(): Readonly<AppState> {
  return state;
}

export function getPages(): readonly PageItem[] {
  return state.pages;
}

export function getSelectedPage(): PageItem | null {
  return state.pages.find((p) => p.id === state.selectedPageId) ?? null;
}

export function getSettings(): Readonly<OcrSettings> {
  return state.ocrSettings;
}

export function getExportSettings(): Readonly<ExportSettings> {
  return state.exportSettings;
}

// --- Mutations ---

export function setOcrSettings(partial: Partial<OcrSettings>): void {
  Object.assign(state.ocrSettings, partial);
  emit("state:change", state);
}

export function setExportSettings(partial: Partial<ExportSettings>): void {
  Object.assign(state.exportSettings, partial);
  emit("state:change", state);
}

export function setStatus(text: string, error = false): void {
  state.statusText = text;
  state.statusError = error;
  emit("status", { text, error });
  emit("state:change", state);
}

export function setOcrReady(ready: boolean): void {
  state.ocrReady = ready;
  state.ocrInitializing = false;
  emit("ocr:ready", ready);
  emit("state:change", state);
}

export function setOcrInitializing(init: boolean): void {
  state.ocrInitializing = init;
  emit("state:change", state);
}

export function setProcessing(processing: boolean): void {
  state.processing = processing;
  if (!processing) state.processingProgress = null;
  emit("state:change", state);
}

export function setProgress(current: number, total: number): void {
  state.processingProgress = { current, total };
  emit("progress", state.processingProgress);
  emit("state:change", state);
}

export function selectPage(id: string | null): void {
  state.selectedPageId = id;
  emit("selected:change", id);
  emit("state:change", state);
}

export function addPages(pages: PageItem[]): void {
  state.pages.push(...pages);
  if (!state.selectedPageId && pages.length > 0) {
    state.selectedPageId = pages[0].id;
    emit("selected:change", pages[0].id);
  }
  emit("pages:change", state.pages);
  emit("state:change", state);
}

export function removePage(id: string): void {
  const idx = state.pages.findIndex((p) => p.id === id);
  if (idx < 0) return;
  const [removed] = state.pages.splice(idx, 1);
  removed.bitmap.close();
  if (state.selectedPageId === id) {
    state.selectedPageId = state.pages[Math.min(idx, state.pages.length - 1)]?.id ?? null;
    emit("selected:change", state.selectedPageId);
  }
  emit("pages:change", state.pages);
  emit("state:change", state);
}

export function clearPages(): void {
  for (const p of state.pages) p.bitmap.close();
  state.pages = [];
  state.selectedPageId = null;
  emit("selected:change", null);
  emit("pages:change", state.pages);
  emit("state:change", state);
}

export function updatePage(id: string, partial: Partial<PageItem>): void {
  const page = state.pages.find((p) => p.id === id);
  if (!page) return;
  Object.assign(page, partial);
  emit("pages:change", state.pages);
  emit("state:change", state);
}

export function togglePageIncluded(id: string): void {
  const page = state.pages.find((p) => p.id === id);
  if (!page) return;
  page.included = !page.included;
  emit("pages:change", state.pages);
  emit("state:change", state);
}

export function reorderPages(fromIdx: number, toIdx: number): void {
  const [item] = state.pages.splice(fromIdx, 1);
  state.pages.splice(toIdx, 0, item);
  emit("pages:change", state.pages);
  emit("state:change", state);
}

export function selectAll(): void {
  for (const p of state.pages) p.included = true;
  emit("pages:change", state.pages);
  emit("state:change", state);
}

export function deselectAll(): void {
  for (const p of state.pages) p.included = false;
  emit("pages:change", state.pages);
  emit("state:change", state);
}

export function getIncludedPages(): PageItem[] {
  return state.pages.filter((p) => p.included);
}
