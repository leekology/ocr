import {
  events,
  getSelectedPage,
  updatePage,
  type PageItem,
} from "../state";
import { processSingle } from "../exporter";
import { bitmapToCanvas } from "../utils/image";

export function createPreviewPanel(container: HTMLElement): void {
  const area = document.createElement("div");
  area.className = "preview-area";

  area.innerHTML = `
    <div class="panel-header" style="border-bottom: 1px solid var(--border)">
      <span id="previewTitle">Preview</span>
      <div style="display:flex;gap:4px">
        <button class="btn-sm" id="previewRunOcr">Run OCR</button>
      </div>
    </div>
    <div class="preview-image-wrap" id="previewImageWrap">
      <div class="preview-empty">Select a page to preview</div>
    </div>
    <textarea class="text-editor" id="previewTextEditor" placeholder="OCR text will appear here. Edit before export..." hidden></textarea>
  `;

  container.appendChild(area);

  const titleEl = area.querySelector<HTMLSpanElement>("#previewTitle")!;
  const imageWrap = area.querySelector<HTMLDivElement>("#previewImageWrap")!;
  const editor = area.querySelector<HTMLTextAreaElement>("#previewTextEditor")!;
  const runOcrBtn = area.querySelector<HTMLButtonElement>("#previewRunOcr")!;

  let currentPageId: string | null = null;

  function renderPage(page: PageItem | null): void {
    if (!page) {
      titleEl.textContent = "Preview";
      imageWrap.innerHTML = `<div class="preview-empty">Select a page to preview</div>`;
      editor.hidden = true;
      currentPageId = null;
      return;
    }

    currentPageId = page.id;
    titleEl.textContent = page.label;

    // Show image
    imageWrap.innerHTML = "";
    const canvas = bitmapToCanvas(page.bitmap);
    canvas.style.maxWidth = "100%";
    canvas.style.maxHeight = "100%";
    canvas.style.borderRadius = "var(--radius-sm)";
    imageWrap.appendChild(canvas);

    // Show text editor
    editor.hidden = false;
    if (page.editedText !== null) {
      editor.value = page.editedText;
    } else if (page.ocrResult) {
      editor.value = page.ocrResult.items.map((it) => it.text).join("\n");
    } else {
      editor.value = "";
    }
  }

  editor.addEventListener("input", () => {
    if (currentPageId) {
      updatePage(currentPageId, { editedText: editor.value });
    }
  });

  runOcrBtn.addEventListener("click", () => {
    if (currentPageId) {
      void processSingle(currentPageId);
    }
  });

  renderPage(getSelectedPage());
  events.on("selected:change", () => {
    renderPage(getSelectedPage());
  });
  events.on("pages:change", () => {
    const p = getSelectedPage();
    if (p && p.id === currentPageId) {
      // Update title if needed
      titleEl.textContent = p.label;
      // Update editor if OCR finished and no manual edits
      if (p.status === "done" && p.ocrResult && p.editedText === null) {
        editor.value = p.ocrResult.items.map((it) => it.text).join("\n");
      }
    }
  });
}
