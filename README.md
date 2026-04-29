# Scan to Markdown

Browser-based batch OCR tool — convert scanned PDFs and images to Markdown.

Powered by [PaddleOCR.js](https://github.com/PaddlePaddle/PaddleOCR), runs entirely in the browser. No server, no upload, no cost.

## Features

- **Batch upload** — PDF files and images (PNG, JPG, TIFF, WebP)
- **PDF rendering** — extract pages as images via pdf.js
- **Page management** — thumbnails, drag-to-reorder, include/exclude toggles
- **Full OCR control** — detection thresholds, recognition params, language, model selection, custom pipeline config
- **Post-OCR editing** — edit recognized text, toggle text regions, draw custom regions
- **Markdown export** — per-page files or single merged document
- **ZIP download** — packaged with fflate
- **100% browser** — no data leaves your machine

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The app requires `Cross-Origin-Isolation` headers (set automatically by Vite config) for threaded WASM and WebGPU support.

## Supported Languages

- Chinese (Simplified): `ch`
- Chinese (Traditional): `chinese_cht`
- English: `en`
- Japanese: `japan`

## Build

```bash
npm run build
```

Output goes to `dist/`. Serve with any static file server — make sure to set COOP/COEP headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

## Tech Stack

- [PaddleOCR.js](https://github.com/PaddlePaddle/PaddleOCR) — ONNX-based OCR in the browser
- [pdf.js](https://mozilla.github.io/pdf.js/) — PDF rendering
- [fflate](https://github.com/101arrowz/fflate) — ZIP compression
- Vite — build tooling
- Vanilla TypeScript — zero framework overhead

## License

MIT
