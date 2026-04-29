import {
  events,
  getSettings,
  setOcrSettings,
  getState,
  type OcrSettings,
} from "../state";
import { initEngine, disposeEngine } from "../ocr-engine";

const LANGUAGES = [
  { value: "ch", label: "Chinese (Simplified)" },
  { value: "chinese_cht", label: "Chinese (Traditional)" },
  { value: "en", label: "English" },
  { value: "japan", label: "Japanese" },
];

const BACKENDS = [
  { value: "auto", label: "auto" },
  { value: "webgpu", label: "webgpu" },
  { value: "wasm", label: "wasm" },
];

export function createSettingsPanel(container: HTMLElement): void {
  const panel = document.createElement("div");
  panel.className = "panel settings-panel scroll-y";
  panel.style.height = "100%";
  panel.style.overflowY = "auto";

  const s = getSettings();

  panel.innerHTML = `
    <div class="panel-header">
      <span>OCR Settings</span>
    </div>

    <div class="settings-section">
      <h3>Model &amp; Runtime</h3>
      <div class="fields">
        <label>
          Language
          <select id="sLang">
            ${LANGUAGES.map((l) => `<option value="${l.value}" ${l.value === s.lang ? "selected" : ""}>${l.label}</option>`).join("")}
          </select>
        </label>
        <label>
          Backend
          <select id="sBackend">
            ${BACKENDS.map((b) => `<option value="${b.value}" ${b.value === s.backend ? "selected" : ""}>${b.label}</option>`).join("")}
          </select>
        </label>
        <label>
          Threads
          <input id="sThreads" type="number" min="1" max="8" value="${s.numThreads}" />
        </label>
      </div>
    </div>

    <div class="settings-section">
      <h3>Detection</h3>
      <div class="fields">
        <div class="two-col">
          <label>
            Det threshold
            <input id="sDetThresh" type="number" step="0.05" min="0" max="1" value="${s.detThresh}" />
          </label>
          <label>
            Box threshold
            <input id="sBoxThresh" type="number" step="0.05" min="0" max="1" value="${s.boxThresh}" />
          </label>
        </div>
        <div class="two-col">
          <label>
            Unclip ratio
            <input id="sUnclipRatio" type="number" step="0.1" min="0" value="${s.unclipRatio}" />
          </label>
          <label>
            Limit side len
            <input id="sDetLimitSideLen" type="number" step="64" min="64" value="${s.detLimitSideLen}" />
          </label>
        </div>
        <div class="two-col">
          <label>
            Limit type
            <select id="sDetLimitType">
              <option value="max" ${s.detLimitType === "max" ? "selected" : ""}>max</option>
              <option value="min" ${s.detLimitType === "min" ? "selected" : ""}>min</option>
            </select>
          </label>
          <label>
            Max side limit
            <input id="sDetMaxSideLimit" type="number" step="500" min="0" value="${s.detMaxSideLimit}" />
          </label>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3>Recognition</h3>
      <div class="fields">
        <label>
          Rec score threshold
          <input id="sRecScoreThresh" type="number" step="0.05" min="0" max="1" value="${s.recScoreThresh}" />
        </label>
      </div>
    </div>

    <div class="settings-section">
      <h3>Batch Size</h3>
      <div class="fields">
        <div class="two-col">
          <label>
            Det batch
            <input id="sDetBatch" type="number" min="1" max="16" value="${s.detBatchSize}" />
          </label>
          <label>
            Rec batch
            <input id="sRecBatch" type="number" min="1" max="16" value="${s.recBatchSize}" />
          </label>
        </div>
      </div>
    </div>

    <button class="collapsible-toggle" id="advToggle">
      <span class="arrow">▶</span> Advanced
    </button>
    <div class="collapsible-content" id="advContent">
      <div class="settings-section">
        <div class="fields">
          <label>
            Custom det model URL
            <input id="sCustomDetUrl" type="text" placeholder="https://..." value="${s.customDetModelUrl}" />
          </label>
          <label>
            Custom rec model URL
            <input id="sCustomRecUrl" type="text" placeholder="https://..." value="${s.customRecModelUrl}" />
          </label>
          <label>
            Pipeline config (YAML)
            <textarea id="sPipelineYaml" rows="4" placeholder="Leave empty for defaults">${s.customPipelineYaml}</textarea>
          </label>
        </div>
      </div>
    </div>

    <div class="settings-section" style="display:flex;gap:8px">
      <button id="sApply" style="flex:1">Apply &amp; Reinitialize</button>
      <button id="sDispose" class="btn-danger">Stop</button>
    </div>
  `;

  container.appendChild(panel);

  // Collapsible
  const advToggle = panel.querySelector<HTMLButtonElement>("#advToggle")!;
  const advContent = panel.querySelector<HTMLDivElement>("#advContent")!;
  advToggle.addEventListener("click", () => {
    advToggle.classList.toggle("open");
    advContent.classList.toggle("open");
  });

  // Apply
  const applyBtn = panel.querySelector<HTMLButtonElement>("#sApply")!;
  const disposeBtn = panel.querySelector<HTMLButtonElement>("#sDispose")!;

  function readSettings(): Partial<OcrSettings> {
    return {
      lang: (panel.querySelector("#sLang") as HTMLSelectElement).value,
      backend: (panel.querySelector("#sBackend") as HTMLSelectElement).value as OcrSettings["backend"],
      numThreads: Number((panel.querySelector("#sThreads") as HTMLInputElement).value),
      detThresh: Number((panel.querySelector("#sDetThresh") as HTMLInputElement).value),
      boxThresh: Number((panel.querySelector("#sBoxThresh") as HTMLInputElement).value),
      unclipRatio: Number((panel.querySelector("#sUnclipRatio") as HTMLInputElement).value),
      recScoreThresh: Number((panel.querySelector("#sRecScoreThresh") as HTMLInputElement).value),
      detLimitSideLen: Number((panel.querySelector("#sDetLimitSideLen") as HTMLInputElement).value),
      detLimitType: (panel.querySelector("#sDetLimitType") as HTMLSelectElement).value as "min" | "max",
      detMaxSideLimit: Number((panel.querySelector("#sDetMaxSideLimit") as HTMLInputElement).value),
      detBatchSize: Number((panel.querySelector("#sDetBatch") as HTMLInputElement).value),
      recBatchSize: Number((panel.querySelector("#sRecBatch") as HTMLInputElement).value),
      customDetModelUrl: (panel.querySelector("#sCustomDetUrl") as HTMLInputElement).value,
      customRecModelUrl: (panel.querySelector("#sCustomRecUrl") as HTMLInputElement).value,
      customPipelineYaml: (panel.querySelector("#sPipelineYaml") as HTMLTextAreaElement).value,
    };
  }

  applyBtn.addEventListener("click", () => {
    setOcrSettings(readSettings());
    void initEngine();
  });

  disposeBtn.addEventListener("click", () => {
    void disposeEngine();
  });

  events.on("ocr:ready", (ready) => {
    applyBtn.disabled = !ready && getState().ocrInitializing;
  });
}
