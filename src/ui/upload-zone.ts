import { loadFiles } from "../pdf-loader";
import { addPages, setStatus } from "../state";

export function createUploadZone(container: HTMLElement): void {
  const zone = document.createElement("div");
  zone.className = "upload-zone";
  zone.innerHTML = `
    <div style="font-size:28px;opacity:0.3">📄</div>
    <strong>Drop PDFs or images here</strong>
    <p>or click to browse — supports PDF, PNG, JPG, TIFF, WebP</p>
  `;

  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = ".pdf,.png,.jpg,.jpeg,.tiff,.tif,.webp,.bmp,image/*,application/pdf";
  input.hidden = true;

  zone.appendChild(input);
  container.appendChild(zone);

  zone.addEventListener("click", () => input.click());

  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("drag-over");
  });

  zone.addEventListener("dragleave", () => {
    zone.classList.remove("drag-over");
  });

  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("drag-over");
    if (e.dataTransfer?.files.length) {
      void handleFiles(e.dataTransfer.files);
    }
  });

  input.addEventListener("change", () => {
    if (input.files?.length) {
      void handleFiles(input.files);
      input.value = "";
    }
  });
}

async function handleFiles(files: FileList): Promise<void> {
  setStatus(`Loading ${files.length} file(s)...`);
  try {
    const pages = await loadFiles(files);
    addPages(pages);
    setStatus(`Loaded ${pages.length} page(s).`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    setStatus(`Failed to load files: ${msg}`, true);
  }
}
