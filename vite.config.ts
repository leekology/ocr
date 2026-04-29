import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@paddleocr/paddleocr-js": resolve(__dirname, "../paddleocr-js/packages/core/src"),
      "@paddleocr/paddleocr-js/viz": resolve(__dirname, "../paddleocr-js/packages/core/src/viz")
    }
  },
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
