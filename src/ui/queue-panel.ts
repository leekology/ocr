import {
  events,
  getPages,
  getSelectedPage,
  selectPage,
  togglePageIncluded,
  removePage,
  reorderPages,
  selectAll,
  deselectAll,
  clearPages,
  type PageItem,
} from "../state";

export function createQueuePanel(container: HTMLElement): void {
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.style.display = "flex";
  panel.style.flexDirection = "column";
  panel.style.height = "100%";
  panel.style.overflow = "hidden";

  panel.innerHTML = `
    <div class="panel-header">
      <span>Pages</span>
      <div style="display:flex;gap:4px">
        <button class="btn-sm" id="qSelectAll" title="Select all">All</button>
        <button class="btn-sm" id="qDeselectAll" title="Deselect all">None</button>
        <button class="btn-sm btn-danger" id="qClear" title="Clear all">Clear</button>
      </div>
    </div>
    <div class="scroll-y" id="qList" style="flex:1"></div>
  `;

  container.appendChild(panel);

  const listEl = panel.querySelector<HTMLDivElement>("#qList")!;
  const selectAllBtn = panel.querySelector<HTMLButtonElement>("#qSelectAll")!;
  const deselectAllBtn = panel.querySelector<HTMLButtonElement>("#qDeselectAll")!;
  const clearBtn = panel.querySelector<HTMLButtonElement>("#qClear")!;

  selectAllBtn.addEventListener("click", selectAll);
  deselectAllBtn.addEventListener("click", deselectAll);
  clearBtn.addEventListener("click", clearPages);

  // Drag state
  let dragIdx = -1;

  function render(): void {
    const pages = getPages();
    const selectedId = getSelectedPage()?.id;

    listEl.innerHTML = "";

    if (pages.length === 0) {
      listEl.innerHTML = `<div style="padding:20px;text-align:center;opacity:0.4;font-size:13px">No pages loaded</div>`;
      return;
    }

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const item = document.createElement("div");
      item.className = "queue-item";
      if (page.id === selectedId) item.classList.add("active");
      if (!page.included) item.classList.add("excluded");
      item.draggable = true;
      item.dataset.idx = String(i);

      item.innerHTML = `
        <input type="checkbox" ${page.included ? "checked" : ""} title="Include in export" style="cursor:pointer" />
        <img class="thumb" src="${page.thumbnail}" alt="" />
        <div class="info">
          <div class="name" title="${page.label}">${page.label}</div>
          <div class="meta">${page.status === "done" && page.ocrResult ? `${page.ocrResult.items.length} regions` : page.status}</div>
        </div>
        <div class="status-dot ${page.status}"></div>
        <button class="btn-sm btn-danger" title="Remove" style="padding:2px 6px">×</button>
      `;

      // Events
      const cb = item.querySelector("input")!;
      cb.addEventListener("change", (e) => {
        e.stopPropagation();
        togglePageIncluded(page.id);
      });

      const removeBtn = item.querySelector("button")!;
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removePage(page.id);
      });

      item.addEventListener("click", () => {
        selectPage(page.id);
      });

      // Drag & drop reorder
      item.addEventListener("dragstart", (e) => {
        dragIdx = i;
        e.dataTransfer!.effectAllowed = "move";
        item.style.opacity = "0.4";
      });

      item.addEventListener("dragend", () => {
        item.style.opacity = "";
        dragIdx = -1;
      });

      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = "move";
      });

      item.addEventListener("drop", (e) => {
        e.preventDefault();
        if (dragIdx >= 0 && dragIdx !== i) {
          reorderPages(dragIdx, i);
        }
      });

      listEl.appendChild(item);
    }
  }

  render();
  events.on("pages:change", () => render());
  events.on("selected:change", () => render());
}
