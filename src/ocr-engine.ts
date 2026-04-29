import { PaddleOCR } from "@paddleocr/paddleocr-js";
import type { OcrResult } from "@paddleocr/paddleocr-js";
import { getState, setOcrReady, setOcrInitializing, setStatus } from "./state";

type OcrEngine = Awaited<ReturnType<typeof PaddleOCR.create>>;

const ORT_CDN = "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/";

let engine: OcrEngine | null = null;

export function getEngine(): OcrEngine | null {
  return engine;
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
    engine = await PaddleOCR.create({
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
