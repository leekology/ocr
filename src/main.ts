import { createUploadZone } from "./ui/upload-zone";
import { createQueuePanel } from "./ui/queue-panel";
import { createPreviewPanel } from "./ui/preview-panel";
import { createSettingsPanel } from "./ui/settings-panel";
import { createExportPanel } from "./ui/export-panel";
import { createStatusBar } from "./ui/status-bar";
import { initEngine } from "./ocr-engine";

function buildLayout(): void {
  const app = document.getElementById("app")!;

  app.innerHTML = `
    <header>
      <h1>Scan to Markdown</h1>
      <span class="subtitle">Browser-based batch OCR — powered by PaddleOCR.js</span>
    </header>
    <div class="main-area">
      <div id="sidebar" style="display:flex;flex-direction:column;overflow:hidden;border-right:1px solid var(--border)"></div>
      <div id="center" style="overflow:hidden"></div>
      <div id="rightbar" style="display:flex;flex-direction:column;overflow:hidden;border-left:1px solid var(--border)"></div>
    </div>
    <div id="statusbar"></div>
  `;

  const sidebar = document.getElementById("sidebar")!;
  const center = document.getElementById("center")!;
  const rightbar = document.getElementById("rightbar")!;
  const statusbar = document.getElementById("statusbar")!;

  // Sidebar: upload zone + queue
  const uploadContainer = document.createElement("div");
  sidebar.appendChild(uploadContainer);
  createUploadZone(uploadContainer);

  const queueContainer = document.createElement("div");
  queueContainer.style.flex = "1";
  queueContainer.style.overflow = "hidden";
  queueContainer.style.display = "flex";
  queueContainer.style.flexDirection = "column";
  sidebar.appendChild(queueContainer);
  createQueuePanel(queueContainer);

  // Center: preview
  createPreviewPanel(center);

  // Right: settings + export
  const settingsContainer = document.createElement("div");
  settingsContainer.style.flex = "1";
  settingsContainer.style.overflow = "hidden";
  settingsContainer.style.display = "flex";
  settingsContainer.style.flexDirection = "column";
  rightbar.appendChild(settingsContainer);
  createSettingsPanel(settingsContainer);

  const exportContainer = document.createElement("div");
  rightbar.appendChild(exportContainer);
  createExportPanel(exportContainer);

  // Status bar
  createStatusBar(statusbar);
}

buildLayout();

// Initialize OCR engine on load
void initEngine();
