export type Point2D = [number, number];

export interface OcrResultItem {
  poly: Point2D[];
  text: string;
  score: number;
}

export interface OcrResult {
  image: { width: number; height: number };
  items: OcrResultItem[];
  metrics: {
    detMs: number;
    recMs: number;
    totalMs: number;
    detectedBoxes: number;
    recognizedCount: number;
  };
  runtime: {
    requestedBackend: string;
    detProvider: string;
    recProvider: string;
    webgpuAvailable: boolean;
  };
}

export interface InitializationSummary {
  backend: string;
  webgpuAvailable: boolean;
  detProvider: string;
  recProvider: string;
  elapsedMs: number;
}

export interface PaddleOCRInstance {
  initialize(): Promise<InitializationSummary>;
  predict(input: unknown, params?: Record<string, unknown>): Promise<OcrResult[]>;
  dispose(): Promise<void>;
}

export interface PaddleOCRStatic {
  create(options: Record<string, unknown>): Promise<PaddleOCRInstance>;
}
