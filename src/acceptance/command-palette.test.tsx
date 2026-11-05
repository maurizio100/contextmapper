import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import App from '../App';
import { aBoundedContext, aRelationship } from '../test/builders';
import { RelationshipType, type BoundedContextNode } from '../types/context-map';

const STORAGE_KEY = 'context-map-data';

/** "Billing" related to "Shipping", scattered so Tidy Up has work to do, plus an unrelated "Catalog". */
function seedMap() {
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
  const catalog = aBoundedContext({
    id: 'ctx-catalog',
    data: { name: 'Catalog', description: '', color: '#f59e0b' },
    position: { x: -600, y: 300 },
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes: [billing, shipping, catalog], edges: [relationship] }));
}

function positions() {
  const stored: { nodes: BoundedContextNode[] } = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{"nodes":[]}');
  return stored.nodes
    .map((n) => ({ id: n.id, x: n.position.x, y: n.position.y }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function clickNode(name: string) {
  const nodeEl = screen.getByText(name).closest('.react-flow__node');
  if (!nodeEl) throw new Error(`node "${name}" not found on canvas`);
  fireEvent.click(nodeEl);
}

function openPalette() {
  fireEvent.keyDown(document.body, { key: 'k', code: 'KeyK', ctrlKey: true });
  return screen.getByRole('dialog', { name: /command palette/i });
}

const isFocusActive = () => screen.queryByRole('button', { name: /exit focus/i }) !== null;

describe('STORY-008 Reach any action from a command palette and keyboard shortcuts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('finds export actions by typing "export"', () => {
    seedMap();
    render(<App />);
    const palette = openPalette();

    fireEvent.change(within(palette).getByLabelText('Search actions'), { target: { value: 'export' } });

    const labels = within(palette)
      .getAllByRole('option')
      .map((o) => o.textContent ?? '');
    expect(labels.some((l) => /export to markdown/i.test(l))).toBe(true);
    expect(labels.some((l) => /export json/i.test(l))).toBe(true);
    expect(labels.some((l) => /export to png/i.test(l))).toBe(true);
    expect(labels).toHaveLength(3);
    expect(within(palette).queryByRole('option', { name: /tidy up/i })).not.toBeInTheDocument();
  });

  it('runs Tidy Up from the palette and closes it', async () => {
    seedMap();
    render(<App />);
    const before = positions();
    const palette = openPalette();

    fireEvent.change(within(palette).getByLabelText('Search actions'), { target: { value: 'tidy' } });
    fireEvent.click(within(palette).getByRole('option', { name: /tidy up/i }));

    await waitFor(() => expect(positions()).not.toEqual(before));
    expect(screen.queryByRole('dialog', { name: /command palette/i })).not.toBeInTheDocument();
  });

  it('does not offer Focus Selection with nothing selected', () => {
    seedMap();
    render(<App />);
    const palette = openPalette();

    expect(within(palette).getAllByRole('option').length).toBeGreaterThan(0);
    fireEvent.change(within(palette).getByLabelText('Search actions'), { target: { value: 'focus' } });

    expect(within(palette).queryByRole('option', { name: /focus selection/i })).not.toBeInTheDocument();
  });

  it('Ctrl+Z brings back a deleted context', async () => {
    seedMap();
    render(<App />);
    clickNode('Billing');
    fireEvent.keyDown(document.body, { key: 'Delete', code: 'Delete' });
    await waitFor(() => expect(screen.queryByText('Billing')).not.toBeInTheDocument());

    fireEvent.keyDown(document.body, { key: 'z', code: 'KeyZ', ctrlKey: true });

    await waitFor(() => expect(screen.getByText('Billing')).toBeInTheDocument());
  });

  it('F focuses the selected context', async () => {
    seedMap();
    render(<App />);
    clickNode('Billing');

    fireEvent.keyDown(document.body, { key: 'f', code: 'KeyF' });

    await waitFor(() => expect(isFocusActive()).toBe(true));
    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.queryByText('Catalog')).not.toBeInTheDocument();
  });

  it('Delete removes the selected context', async () => {
    seedMap();
    render(<App />);
    clickNode('Billing');

    fireEvent.keyDown(document.body, { key: 'Delete', code: 'Delete' });

    await waitFor(() => expect(screen.queryByText('Billing')).not.toBeInTheDocument());
    expect(screen.getByText('Shipping')).toBeInTheDocument();
    expect(screen.getByText('Catalog')).toBeInTheDocument();
  });

  it('Escape shows the whole map again', async () => {
    seedMap();
    render(<App />);
    clickNode('Billing');
    fireEvent.keyDown(document.body, { key: 'f', code: 'KeyF' });
    await waitFor(() => expect(screen.queryByText('Catalog')).not.toBeInTheDocument());

    fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' });

    await waitFor(() => expect(screen.getByText('Catalog')).toBeInTheDocument());
    expect(isFocusActive()).toBe(false);
  });

  it('typing "f" in the description does not focus the canvas', () => {
    seedMap();
    render(<App />);
    clickNode('Billing');
    const description = within(screen.getByRole('complementary')).getByLabelText(/^description$/i);
    description.focus();

    fireEvent.keyDown(description, { key: 'f', code: 'KeyF' });
    fireEvent.change(description, { target: { value: 'f' } });

    expect(description).toHaveValue('f');
    expect(isFocusActive()).toBe(false);
    expect(screen.getByText('Catalog')).toBeInTheDocument();
  });
});
