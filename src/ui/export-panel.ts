import {
  events,
  getExportSettings,
  setExportSettings,
  getIncludedPages,
} from "../state";
import { processAll, exportFiles } from "../exporter";

export function createExportPanel(container: HTMLElement): void {
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.style.overflow = "hidden";

  const s = getExportSettings();

  panel.innerHTML = `
    <div class="panel-header">
      <span>Export</span>
      <span id="exportCount" style="font-size:11px;opacity:0.5">0 pages</span>
    </div>
    <div class="settings-section">
      <div class="fields">
        <label>
          Mode
          <select id="eMode">
            <option value="separate" ${s.mode === "separate" ? "selected" : ""}>Separate files (ZIP)</option>
            <option value="merged" ${s.mode === "merged" ? "selected" : ""}>Single merged .md</option>
          </select>
        </label>
        <label id="eNameTemplateLabel">
          Filename template
          <input id="eNameTemplate" type="text" value="${s.nameTemplate}" placeholder="{name}_p{page}" />
          <span style="font-size:11px;opacity:0.5">{name} = filename, {page} = page number</span>
        </label>
        <label style="flex-direction:row;align-items:center;gap:6px">
          <input id="eIncludeScores" type="checkbox" ${s.includeScores ? "checked" : ""} />
          Include confidence scores
        </label>
      </div>
    </div>
    <div class="settings-section" style="display:flex;gap:8px">
      <button id="eProcess" class="btn-success" style="flex:1">Run OCR</button>
      <button id="eExport" style="flex:1">Export</button>
    </div>
  `;

  container.appendChild(panel);

  const modeEl = panel.querySelector<HTMLSelectElement>("#eMode")!;
  const nameTemplateEl = panel.querySelector<HTMLInputElement>("#eNameTemplate")!;
  const nameTemplateLabel = panel.querySelector<HTMLLabelElement>("#eNameTemplateLabel")!;
  const includeScoresEl = panel.querySelector<HTMLInputElement>("#eIncludeScores")!;
  const processBtn = panel.querySelector<HTMLButtonElement>("#eProcess")!;
  const exportBtn = panel.querySelector<HTMLButtonElement>("#eExport")!;
  const countEl = panel.querySelector<HTMLSpanElement>("#exportCount")!;

  function updateNameTemplateVisibility() {
    nameTemplateLabel.style.display = modeEl.value === "separate" ? "" : "none";
  }
  updateNameTemplateVisibility();

  modeEl.addEventListener("change", () => {
    setExportSettings({ mode: modeEl.value as "merged" | "separate" });
    updateNameTemplateVisibility();
  });

  nameTemplateEl.addEventListener("input", () => {
    setExportSettings({ nameTemplate: nameTemplateEl.value });
  });

  includeScoresEl.addEventListener("change", () => {
    setExportSettings({ includeScores: includeScoresEl.checked });
  });

  processBtn.addEventListener("click", () => {
    void processAll();
  });

  exportBtn.addEventListener("click", () => {
    void exportFiles();
  });

  function updateCount(): void {
    const count = getIncludedPages().length;
    countEl.textContent = `${count} page${count !== 1 ? "s" : ""}`;
  }

  updateCount();
  events.on("pages:change", updateCount);
}
