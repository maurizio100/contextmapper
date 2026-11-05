import { describe, expect, it, vi, afterEach } from 'vitest';
import { downloadBlob, downloadDataUrl } from './download';

describe('download helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloadBlob builds a Blob URL, clicks an anchor, and revokes the URL', () => {
    const createdAnchors: HTMLAnchorElement[] = [];
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') createdAnchors.push(el as HTMLAnchorElement);
      return el;
    });
    const clickSpy = vi.fn();
    HTMLAnchorElement.prototype.click = clickSpy;

    const createObjectURL = vi.fn().mockReturnValue('blob:fake-url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });

    downloadBlob('{"a":1}', 'context-map.json', 'application/json');

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    const anchor = createdAnchors.at(-1);
    expect(anchor?.href).toBe('blob:fake-url');
    expect(anchor?.download).toBe('context-map.json');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
  });

  it('downloadDataUrl clicks an anchor pointed at the data URL without revoking anything', () => {
    const createdAnchors: HTMLAnchorElement[] = [];
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') createdAnchors.push(el as HTMLAnchorElement);
      return el;
    });
    const clickSpy = vi.fn();
    HTMLAnchorElement.prototype.click = clickSpy;

    downloadDataUrl('data:image/png;base64,xyz', 'context-map.png');

    const anchor = createdAnchors.at(-1);
    expect(anchor?.href).toBe('data:image/png;base64,xyz');
    expect(anchor?.download).toBe('context-map.png');
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
