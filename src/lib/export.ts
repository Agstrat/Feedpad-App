// src/lib/export.ts
import jsPDF from 'jspdf';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportJSON(data: unknown, filename = 'feedpad.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, filename);
}

export async function importJSON<T = unknown>(file: File): Promise<T> {
  const text = await file.text();
  return JSON.parse(text) as T;
}

export function exportToPdf(target: HTMLElement | string, filename = 'feedpad.pdf') {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;

  if (!el) {
    doc.text('FeedPad Export', 40, 60);
    doc.save(filename);
    return;
  }

  const text = el.innerText || el.textContent || 'FeedPad Export';
  const left = 40;
  let top = 60;
  const maxWidth = 515;
  const lines = doc.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    doc.text(line, left, top);
    top += 18;
  }
  doc.save(filename);
}

const Export = { downloadBlob, exportJSON, importJSON, exportToPdf };
export default Export;
