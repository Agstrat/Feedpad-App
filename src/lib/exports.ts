// src/lib/export.ts
// Universal export/import helpers so both default and named imports work.
// This satisfies any of the following in your components:
//   import Export from '../lib/export'
//   import { exportToPdf, exportJSON } from '../lib/export'

import jsPDF from 'jspdf';

/** Download a Blob as a file */
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

/** Export arbitrary data to JSON */
export function exportJSON(data: unknown, filename = 'feedpad.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, filename);
}

/** Import JSON from a File input */
export async function importJSON<T = unknown>(file: File): Promise<T> {
  const text = await file.text();
  return JSON.parse(text) as T;
}

/** Quick PDF export using jsPDF. Accepts an element or string. */
export function exportToPdf(target: HTMLElement | string, filename = 'feedpad.pdf') {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;

  // Simple text fallback if no element provided
  if (!el) {
    doc.text('FeedPad Export', 40, 60);
    doc.save(filename);
    return;
  }

  // Very light DOM snapshot: innerText into a single page
  const text = el.innerText || el.textContent || 'FeedPad Export';
  const left = 40;
  let top = 60;
  const maxWidth = 515; // A4 width (595pt) minus margins

  // naive line-wrapping
  const lines = doc.splitTextToSize(text, maxWidth);
  lines.forEach((line: string) => {
    doc.text(line, left, top);
    top += 18;
  });

  doc.save(filename);
}

// Also provide a default export so `import Export from '../lib/export'` works.
const Export = { downloadBlob, exportJSON, importJSON, exportToPdf };
export default Export;
