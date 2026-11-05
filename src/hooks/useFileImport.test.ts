import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { useFileImport } from './useFileImport';
import { aBoundedContext } from '../test/builders';
import type { BoundedContextNode, RelationshipEdge } from '../types/context-map';

function setup(
  parse: (text: string) => { nodes: BoundedContextNode[]; edges: RelationshipEdge[]; warnings: string[] },
  hasExistingMap = false
) {
  const replaceAll = vi.fn();
  const { result } = renderHook(
    () => useFileImport({ accept: '.json', parse, replaceAll, hasExistingMap }),
    { wrapper: ReactFlowProvider }
  );
  return { result, replaceAll };
}

function triggerImport(result: ReturnType<typeof setup>['result'], content: string) {
  const createdInputs: HTMLInputElement[] = [];
  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = originalCreateElement(tag);
    if (tag === 'input') createdInputs.push(el as HTMLInputElement);
    return el;
  });

  act(() => {
    result.current.importFile();
  });

  const input = createdInputs.at(-1);
  if (!input) throw new Error('importFile did not create a file input');

  const file = new File([content], 'map.json', { type: 'application/json' });
  Object.defineProperty(input, 'files', { value: [file] });

  return input;
}

describe('useFileImport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('replaces the map and fits the view on a successful import with no existing map', async () => {
    const node = aBoundedContext();
    const parse = vi.fn().mockReturnValue({ nodes: [node], edges: [], warnings: [] });
    const { result, replaceAll } = setup(parse, false);

    const input = triggerImport(result, 'irrelevant');
    await act(async () => {
      input.dispatchEvent(new Event('change'));
      await Promise.resolve();
    });

    expect(parse).toHaveBeenCalledWith('irrelevant');
    expect(replaceAll).toHaveBeenCalledWith([node], []);
  });

  it('asks for confirmation before replacing an existing map, and aborts when declined', async () => {
    const parse = vi.fn();
    const { result, replaceAll } = setup(parse, true);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const input = triggerImport(result, 'irrelevant');
    await act(async () => {
      input.dispatchEvent(new Event('change'));
      await Promise.resolve();
    });

    expect(parse).not.toHaveBeenCalled();
    expect(replaceAll).not.toHaveBeenCalled();
  });

  it('alerts and does not replace the map when the parsed result is empty', async () => {
    const parse = vi.fn().mockReturnValue({ nodes: [], edges: [], warnings: [] });
    const { result, replaceAll } = setup(parse, false);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const input = triggerImport(result, 'irrelevant');
    await act(async () => {
      input.dispatchEvent(new Event('change'));
      await Promise.resolve();
    });

    expect(replaceAll).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith(
      'No bounded contexts or relationships were found in this file.'
    );
  });

  it('alerts with warnings after a successful import that produced some', async () => {
    const node = aBoundedContext();
    const parse = vi.fn().mockReturnValue({ nodes: [node], edges: [], warnings: ['legacy type normalised'] });
    const { result, replaceAll } = setup(parse, false);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const input = triggerImport(result, 'irrelevant');
    await act(async () => {
      input.dispatchEvent(new Event('change'));
      await Promise.resolve();
    });

    expect(replaceAll).toHaveBeenCalledWith([node], []);
    expect(alertSpy).toHaveBeenCalledWith(
      'Imported with warnings:\n\n- legacy type normalised'
    );
  });

  it('does not alert generically and does not replace the map when parse throws', async () => {
    const parse = vi.fn().mockImplementation(() => {
      throw new Error('malformed');
    });
    const { result, replaceAll } = setup(parse, false);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const input = triggerImport(result, 'irrelevant');
    await act(async () => {
      input.dispatchEvent(new Event('change'));
      await Promise.resolve();
    });

    expect(replaceAll).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
