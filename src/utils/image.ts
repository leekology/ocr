export function bitmapToCanvas(bitmap: ImageBitmap): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  return canvas;
}

export async function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), type);
  });
}

export async function generateThumbnail(
  source: ImageBitmap | HTMLCanvasElement,
  maxDim = 80
): Promise<string> {
  const w = source instanceof HTMLCanvasElement ? source.width : source.width;
  const h = source instanceof HTMLCanvasElement ? source.height : source.height;
  const scale = Math.min(maxDim / w, maxDim / h, 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.6);
}

export async function fileToBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

export async function renderPageToBitmap(
  canvas: HTMLCanvasElement
): Promise<ImageBitmap> {
  return createImageBitmap(canvas);
}
