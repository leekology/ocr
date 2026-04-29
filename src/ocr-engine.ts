import type { PaddleOCRStatic, PaddleOCRInstance, OcrResult } from "./types/paddleocr";
import { getState, setOcrReady, setOcrInitializing, setStatus } from "./state";

const PADDLEOCR_CDN = "https://cdn.jsdelivr.net/npm/@paddleocr/paddleocr-js@0.3.2/+esm";
const ORT_CDN = "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/";

let PaddleOCR: PaddleOCRStatic | null = null;
let engine: PaddleOCRInstance | null = null;

export function getEngine(): PaddleOCRInstance | null {
  return engine;
}

async function loadModule(): Promise<PaddleOCRStatic> {
  if (PaddleOCR) return PaddleOCR;
  const mod = await import(/* @vite-ignore */ PADDLEOCR_CDN);
  PaddleOCR = (mod.PaddleOCR ?? mod.default?.PaddleOCR ?? mod.default) as PaddleOCRStatic;
  if (!PaddleOCR) throw new Error("Failed to load PaddleOCR from CDN");
  return PaddleOCR;
}

export async function initEngine(): Promise<void> {
  const s = getState().ocrSettings;

  setOcrInitializing(true);
  setStatus("Initializing OCR engine...");

  if (engine) {
    try { await engine.dispose(); } catch { /* ignore */ }
    engine = null;
  }

  try {
    const Paddle = await loadModule();
    engine = await Paddle.create({
      initialize: false,
      worker: false,
      lang: s.lang,
      textDetectionModelName: `PP-OCRv5_mobile_det`,
      textRecognitionModelName: `PP-OCRv5_mobile_rec`,
      textDetectionBatchSize: s.detBatchSize,
      textRecognitionBatchSize: s.recBatchSize,
      ortOptions: {
        backend: s.backend,
        wasmPaths: ORT_CDN,
        numThreads: self.crossOriginIsolated
          ? Math.min(4, Math.max(1, (navigator.hardwareConcurrency || 2) - 1))
          : 1,
        simd: true,
      },
    });

    const summary = await engine.initialize();
    setOcrReady(true);
    setStatus(
      `OCR ready — backend: ${summary.backend}, det: ${summary.detProvider}, rec: ${summary.recProvider} (${(summary.elapsedMs / 1000).toFixed(1)}s)`
    );
  } catch (err) {
    setOcrReady(false);
    const msg = err instanceof Error ? err.message : String(err);
    setStatus(`OCR init failed: ${msg}`, true);
    throw err;
  }
}

export async function runOcr(image: ImageBitmap): Promise<OcrResult> {
  if (!engine) throw new Error("OCR engine not initialized");
  const s = getState().ocrSettings;

  const results = await engine.predict(image, {
    textDetThresh: s.detThresh,
    textDetBoxThresh: s.boxThresh,
    textDetUnclipRatio: s.unclipRatio,
    textRecScoreThresh: s.recScoreThresh,
    textDetLimitSideLen: s.detLimitSideLen,
    textDetLimitType: s.detLimitType,
    textDetMaxSideLimit: s.detMaxSideLimit,
  });

  return results[0];
}

export async function disposeEngine(): Promise<void> {
  if (engine) {
    try { await engine.dispose(); } catch { /* ignore */ }
    engine = null;
    setOcrReady(false);
  }
}
