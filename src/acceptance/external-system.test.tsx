import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import App from '../App';
import { aBoundedContext, aRelationship } from '../test/builders';
import { generateJson } from '../utils/json-export';
import { parseJson } from '../utils/json-import';
import { RelationshipType } from '../types/context-map';
import type { BoundedContextNode, RelationshipEdge } from '../types/context-map';

function seed(nodes: BoundedContextNode[], edges: RelationshipEdge[] = []) {
  localStorage.setItem('context-map-data', JSON.stringify({ nodes, edges }));
}

function context(id: string, name: string, extra: Record<string, unknown> = {}) {
  return aBoundedContext({ id, data: { name, description: '', color: '#3b82f6', ...extra } });
}

function clickNode(name: string) {
  const nodeEl = screen.getByText(name).closest('.react-flow__node');
  if (!nodeEl) throw new Error(`node "${name}" not found on canvas`);
  fireEvent.click(nodeEl);
}

function externalCheckbox() {
  return within(screen.getByRole('complementary')).getByLabelText(/external system/i);
}

function canvasNode(name: string) {
  return screen.getByTestId(`bounded-context-${name}`);
}

function storedMap(): { nodes: BoundedContextNode[]; edges: RelationshipEdge[] } {
  return JSON.parse(localStorage.getItem('context-map-data') ?? '{}');
}

describe('STORY-012 Mark a bounded context as an external system', () => {
  it('marking Payment Provider as external shows it on the canvas', () => {
    seed([context('ctx-pp', 'Payment Provider')]);
    render(<App />);

    clickNode('Payment Provider');
    fireEvent.click(externalCheckbox());

    const node = canvasNode('Payment Provider');
    expect(within(node).getByText('External system')).toBeInTheDocument();
    expect(node).toHaveStyle({ borderStyle: 'dashed', borderColor: '#3b82f6' });
    expect(storedMap().nodes[0].data.external).toBe(true);

    fireEvent.click(externalCheckbox());
    expect(within(canvasNode('Payment Provider')).queryByText('External system')).not.toBeInTheDocument();
    expect(storedMap().nodes[0].data).not.toHaveProperty('external');
  });

  it('a new bounded context is internal and looks unchanged', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Add Context' }));
    fireEvent.change(within(screen.getByRole('complementary')).getByLabelText(/^name$/i), {
      target: { value: 'Catalog' },
    });

    expect(externalCheckbox()).not.toBeChecked();
    const node = canvasNode('Catalog');
    expect(within(node).queryByText('External system')).not.toBeInTheDocument();
    expect(node).not.toHaveStyle({ borderStyle: 'dashed' });
    expect(storedMap().nodes[0].data).not.toHaveProperty('external');
  });

  it('a relationship to an external system renders like any other', () => {
    const billing = context('ctx-billing', 'Billing');
    const provider = context('ctx-pp', 'Payment Provider', { external: true });
    seed(
      [billing, provider],
      [
        aRelationship({
          source: billing.id,
          target: provider.id,
          data: {
            relationshipType: RelationshipType.AnticorruptionLayer,
            sourceRole: 'downstream',
            targetRole: 'upstream',
            notes: '',
          },
        }),
      ],
    );
    render(<App />);

    fireEvent.click(screen.getByTestId('relationship-Billing-Payment Provider'));

    expect(within(screen.getByRole('complementary')).getByText(/anticorruption layer/i)).toBeInTheDocument();
  });

  it('external round-trips through JSON export and import', () => {
    seed([context('ctx-pp', 'Payment Provider')]);
    render(<App />);
    clickNode('Payment Provider');
    fireEvent.click(externalCheckbox());

    const { nodes, edges } = storedMap();
    const imported = parseJson(generateJson(nodes, edges));
    expect(imported.warnings).toEqual([]);
    expect(imported.nodes[0].data.external).toBe(true);

    cleanup();
    localStorage.clear();
    seed(imported.nodes);
    render(<App />);
    expect(within(canvasNode('Payment Provider')).getByText('External system')).toBeInTheDocument();
    clickNode('Payment Provider');
    expect(externalCheckbox()).toBeChecked();
  });
});
