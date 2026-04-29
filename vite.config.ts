import { defineConfig } from "vite";

export default defineConfig({
  base: "/ocr/",
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  },
  build: {
    target: "es2022",
    outDir: "dist",
    assetsInlineLimit: 0
  },
  worker: {
    format: "es"
  },
  optimizeDeps: {
    exclude: ["@paddleocr/paddleocr-js"]
  }
});
