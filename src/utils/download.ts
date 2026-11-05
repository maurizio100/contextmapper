/**
 * Shared browser download side effect: creates a throwaway anchor, clicks it,
 * and lets the browser take it from there. All file exports funnel through
 * this helper so the DOM dance lives in one place.
 */
function triggerDownload(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
}

/** Downloads in-memory text content (JSON, Markdown, …) as a file. */
export function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}

/** Downloads an already-encoded data URL (e.g. a PNG export) as a file. */
export function downloadDataUrl(dataUrl: string, filename: string) {
  triggerDownload(dataUrl, filename);
}
