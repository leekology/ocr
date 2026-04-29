import type { OcrResultItem } from "../types/paddleocr";

export interface MarkdownOptions {
  includeScores: boolean;
  pageHeader: string;
}

const defaults: MarkdownOptions = {
  includeScores: false,
  pageHeader: "",
};

export function itemsToMarkdown(
  items: OcrResultItem[],
  opts?: Partial<MarkdownOptions>
): string {
  const o = { ...defaults, ...opts };
  if (items.length === 0) return "";

  const sorted = [...items].sort((a, b) => {
    const ay = a.poly[0]?.[1] ?? 0;
    const by = b.poly[0]?.[1] ?? 0;
    const dy = ay - by;
    if (Math.abs(dy) > 10) return dy;
    const ax = a.poly[0]?.[0] ?? 0;
    const bx = b.poly[0]?.[0] ?? 0;
    return ax - bx;
  });

  const lines: string[] = [];
  if (o.pageHeader) lines.push(o.pageHeader, "");

  let prevY = -Infinity;
  for (const item of sorted) {
    const y = item.poly[0]?.[1] ?? 0;
    if (prevY >= 0 && y - prevY > 30) {
      lines.push("");
    }
    prevY = y;

    let line = item.text;
    if (o.includeScores) {
      line += ` <!-- score: ${item.score.toFixed(3)} -->`;
    }
    lines.push(line);
  }

  return lines.join("\n");
}

export function mergeMarkdown(parts: string[]): string {
  return parts.filter((p) => p.trim()).join("\n\n---\n\n");
}
