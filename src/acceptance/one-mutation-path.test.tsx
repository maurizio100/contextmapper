import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from '../App';
import { aBoundedContext } from '../test/builders';
import { generateJson } from '../utils/json-export';

function seedTwoContexts() {
  const a = aBoundedContext({
    id: 'ctx-a',
    data: { name: 'Billing', description: '', color: '#3b82f6' },
    position: { x: 0, y: 0 },
  });
  const b = aBoundedContext({
    id: 'ctx-b',
    data: { name: 'Shipping', description: '', color: '#10b981' },
    position: { x: 400, y: 0 },
  });
  localStorage.setItem(
    'context-map-data',
    JSON.stringify({ nodes: [a, b], edges: [] })
  );
  return { a, b };
}

/** Drives a React Flow handle-to-handle connection drag between two nodes. */
function connect(sourceNodeId: string, targetNodeId: string) {
  const sourceHandle = document.querySelector(
    `.react-flow__handle[data-nodeid="${sourceNodeId}"]`
  ) as HTMLElement;
  const targetHandle = document.querySelector(
    `.react-flow__handle[data-nodeid="${targetNodeId}"]`
  ) as HTMLElement;
  expect(sourceHandle).toBeTruthy();
  expect(targetHandle).toBeTruthy();

  vi.spyOn(document, 'elementFromPoint').mockReturnValue(targetHandle);

  // React Flow's connection drag listens for mouse (not pointer) events.
  fireEvent.mouseDown(sourceHandle, { clientX: 0, clientY: 0, button: 0 });
  fireEvent.mouseMove(document, { clientX: 50, clientY: 0 });
  fireEvent.mouseUp(document, { clientX: 50, clientY: 0 });
}

describe('STORY-002 one mutation path', () => {
  it('connecting two nodes creates the relationship immediately and selects it', () => {
    const { a, b } = seedTwoContexts();
    render(<App />);

    connect(a.id, b.id);

    expect(document.querySelectorAll('.react-flow__edge.selected').length).toBe(1);
    const panel = screen.getByRole('complementary');
    expect(
      within(panel).getByRole('button', { name: /Customer-Supplier/i, pressed: true })
    ).toBeInTheDocument();
  });

  it('importing JSON while a relationship is selected clears the selection panel', async () => {
    const { a, b } = seedTwoContexts();
    render(<App />);

    connect(a.id, b.id);
    expect(screen.getByRole('complementary')).toBeInTheDocument();

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const createdInputs: HTMLInputElement[] = [];
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'input') createdInputs.push(el as HTMLInputElement);
      return el;
    });

    fireEvent.click(screen.getByRole('button', { name: 'File' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Import JSON' }));

    const input = createdInputs.at(-1);
    if (!input) throw new Error('import did not create a file input');

    const imported = aBoundedContext({
      id: 'ctx-c',
      data: { name: 'Catalog', description: '', color: '#f59e0b' },
    });
    const json = generateJson([imported], []);
    const file = new File([json], 'map.json', { type: 'application/json' });
    Object.defineProperty(input, 'files', { value: [file] });

    fireEvent.change(input);
    // input.onchange reads the file asynchronously before calling replaceAll.
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });
});
