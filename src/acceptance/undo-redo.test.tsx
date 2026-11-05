import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, createEvent, within, act, waitFor } from '@testing-library/react';
import App from '../App';
import { aBoundedContext, aRelationship } from '../test/builders';
import { generateJson } from '../utils/json-export';
import { RelationshipType, type BoundedContextNode, type RelationshipEdge } from '../types/context-map';

const STORAGE_KEY = 'context-map-data';

/** A map of "Billing" and "Shipping" related to each other, scattered so Tidy Up has work to do. */
function seedBillingAndShipping() {
  const billing = aBoundedContext({
    id: 'ctx-billing',
    data: { name: 'Billing', description: '', color: '#3b82f6' },
    position: { x: 0, y: 0 },
  });
  const shipping = aBoundedContext({
    id: 'ctx-shipping',
    data: { name: 'Shipping', description: '', color: '#10b981' },
    position: { x: 700, y: 450 },
  });
  const relationship = aRelationship({
    id: 'rel-1',
    source: billing.id,
    target: shipping.id,
    data: {
      relationshipType: RelationshipType.CustomerSupplier,
      sourceRole: 'upstream',
      targetRole: 'downstream',
      notes: '',
      clarity: 'clear',
    },
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes: [billing, shipping], edges: [relationship] }));
}

/** The map's content as persisted (selection is not content), in a stable order. */
function mapContent() {
  const stored: { nodes: BoundedContextNode[]; edges: RelationshipEdge[] } = JSON.parse(
    localStorage.getItem(STORAGE_KEY) ?? '{"nodes":[],"edges":[]}'
  );
  return {
    nodes: stored.nodes
      .map((n) => ({ id: n.id, name: n.data.name, x: n.position.x, y: n.position.y }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    edges: stored.edges
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.data?.relationshipType,
        clarity: e.data?.clarity,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  };
}

const undoButton = () => screen.getByRole('button', { name: /^undo$/i });
const redoButton = () => screen.getByRole('button', { name: /^redo$/i });

function undo() {
  fireEvent.click(undoButton());
}

function clickNode(name: string) {
  const nodeEl = screen.getByText(name).closest('.react-flow__node');
  if (!nodeEl) throw new Error(`node "${name}" not found on canvas`);
  fireEvent.click(nodeEl);
  return nodeEl as HTMLElement;
}

async function deleteContext(name: string) {
  clickNode(name);
  fireEvent.keyDown(document.body, { key: 'Delete', code: 'Delete' });
  await waitFor(() => expect(screen.queryByText(name)).not.toBeInTheDocument());
}

function addContext() {
  fireEvent.click(screen.getByRole('button', { name: /add context/i }));
}

async function importJsonMap(json: string) {
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
  const file = new File([json], 'map.json', { type: 'application/json' });
  Object.defineProperty(input, 'files', { value: [file] });
  fireEvent.change(input);
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/** Drags a context's card on the canvas with mouse events. */
async function dragNode(name: string, dx: number, dy: number) {
  const nodeEl = screen.getByText(name).closest('.react-flow__node') as HTMLElement;
  // d3-drag reads `event.view`, which jsdom's MouseEvent init refuses; define it on each event.
  const fire = (target: Element | Window, type: 'mouseDown' | 'mouseMove' | 'mouseUp', x: number, y: number) => {
    const event = createEvent[type](target, { clientX: x, clientY: y, button: 0 });
    Object.defineProperty(event, 'view', { value: window });
    fireEvent(target, event);
  };
  fire(nodeEl, 'mouseDown', 100, 100);
  fire(window, 'mouseMove', 100 + dx / 2, 100 + dy / 2);
  fire(window, 'mouseMove', 100 + dx, 100 + dy);
  fire(window, 'mouseUp', 100 + dx, 100 + dy);
  // d3-drag swallows the next click until a timeout fires; let it, or the next click is lost.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('STORY-007 Undo and redo changes to the context map', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('undoes adding a bounded context', () => {
    seedBillingAndShipping();
    render(<App />);
    const before = mapContent();

    addContext();
    expect(mapContent().nodes).toHaveLength(3);
    undo();

    expect(mapContent()).toEqual(before);
    expect(screen.queryByText('New context')).not.toBeInTheDocument();
  });

  it('undoes deleting Billing', async () => {
    seedBillingAndShipping();
    render(<App />);
    const before = mapContent();

    await deleteContext('Billing');
    expect(mapContent().edges).toHaveLength(0);
    undo();

    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(mapContent()).toEqual(before);
    expect(mapContent().edges).toHaveLength(1);
  });

  it('undoes moving Shipping', async () => {
    seedBillingAndShipping();
    render(<App />);
    const before = mapContent();

    await dragNode('Shipping', 200, 120);
    expect(mapContent()).not.toEqual(before);
    undo();

    expect(mapContent()).toEqual(before);
  });

  it("undoes changing the relationship's clarity", () => {
    seedBillingAndShipping();
    render(<App />);
    const before = mapContent();

    fireEvent.click(screen.getByTestId('relationship-Billing-Shipping'));
    const panel = screen.getByRole('complementary');
    fireEvent.click(within(panel).getByRole('button', { name: 'Unsure' }));
    expect(mapContent().edges[0].clarity).toBe('unsure');
    undo();

    expect(mapContent()).toEqual(before);
    expect(mapContent().edges[0].clarity).toBe('clear');
  });

  it('undoes tidying up the layout', () => {
    seedBillingAndShipping();
    render(<App />);
    const before = mapContent();

    fireEvent.click(screen.getByRole('button', { name: /tidy up/i }));
    expect(mapContent().nodes).not.toEqual(before.nodes);
    undo();

    expect(mapContent()).toEqual(before);
  });

  it('undoes importing another context map', async () => {
    seedBillingAndShipping();
    render(<App />);
    const before = mapContent();

    const catalog = aBoundedContext({
      id: 'ctx-catalog',
      data: { name: 'Catalog', description: '', color: '#f59e0b' },
    });
    await importJsonMap(generateJson([catalog], []));
    expect(screen.getByText('Catalog')).toBeInTheDocument();
    expect(screen.queryByText('Billing')).not.toBeInTheDocument();
    undo();

    expect(mapContent()).toEqual(before);
    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.queryByText('Catalog')).not.toBeInTheDocument();
  });

  it('redoes a deletion', async () => {
    seedBillingAndShipping();
    render(<App />);

    await deleteContext('Billing');
    undo();
    expect(screen.getByText('Billing')).toBeInTheDocument();
    fireEvent.click(redoButton());

    expect(screen.queryByText('Billing')).not.toBeInTheDocument();
    expect(mapContent().nodes.map((n) => n.name)).toEqual(['Shipping']);
  });

  it('a new change clears redo', async () => {
    seedBillingAndShipping();
    render(<App />);

    await deleteContext('Billing');
    undo();
    expect(redoButton()).toBeEnabled();
    addContext();

    expect(redoButton()).toBeDisabled();
  });

  it('nothing to undo on an unchanged map', () => {
    seedBillingAndShipping();
    render(<App />);

    expect(undoButton()).toBeDisabled();
    expect(redoButton()).toBeDisabled();
  });

  it('focus is not undoable and survives undo', () => {
    seedBillingAndShipping();
    render(<App />);

    addContext();
    expect(undoButton()).toBeEnabled();
    clickNode('Billing');
    fireEvent.click(screen.getByRole('button', { name: /focus selection/i }));
    expect(screen.getByRole('button', { name: /exit focus/i })).toBeInTheDocument();
    undo();

    expect(screen.getByRole('button', { name: /exit focus/i })).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
  });
});
