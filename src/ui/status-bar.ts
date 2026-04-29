import { events, getState } from "../state";

export function createStatusBar(container: HTMLElement): void {
  const bar = document.createElement("div");
  bar.className = "status-bar";

  bar.innerHTML = `
    <div class="status-text" id="sbText">Ready.</div>
    <div class="progress-bar" id="sbProgress" style="display:none">
      <div class="fill" id="sbProgressFill" style="width:0%"></div>
    </div>
    <span id="sbOcrStatus" style="font-size:11px;opacity:0.5">OCR: not initialized</span>
  `;

  container.appendChild(bar);

  const textEl = bar.querySelector<HTMLDivElement>("#sbText")!;
  const progressBar = bar.querySelector<HTMLDivElement>("#sbProgress")!;
  const progressFill = bar.querySelector<HTMLDivElement>("#sbProgressFill")!;
  const ocrStatusEl = bar.querySelector<HTMLSpanElement>("#sbOcrStatus")!;

  events.on("status", ({ text, error }) => {
    textEl.textContent = text;
    textEl.style.color = error ? "var(--danger)" : "";
  });

  events.on("progress", (progress) => {
    if (progress) {
      progressBar.style.display = "";
      progressFill.style.width = `${(progress.current / progress.total) * 100}%`;
    } else {
      progressBar.style.display = "none";
    }
  });

  events.on("ocr:ready", (ready) => {
    ocrStatusEl.textContent = ready ? "OCR: ready" : "OCR: not initialized";
    ocrStatusEl.style.color = ready ? "var(--success)" : "";
  });
}
