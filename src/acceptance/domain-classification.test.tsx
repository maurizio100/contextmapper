import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import App from '../App';
import { aBoundedContext } from '../test/builders';
import { generateJson } from '../utils/json-export';
import { parseJson } from '../utils/json-import';
import type { BoundedContextNode, RelationshipEdge } from '../types/context-map';

function seed(nodes: BoundedContextNode[]) {
  localStorage.setItem('context-map-data', JSON.stringify({ nodes, edges: [] }));
}

function billing(extra: Record<string, unknown> = {}) {
  return aBoundedContext({
    id: 'ctx-billing',
    data: { name: 'Billing', description: '', color: '#3b82f6', ...extra },
  });
}

function clickNode(name: string) {
  const nodeEl = screen.getByText(name).closest('.react-flow__node');
  if (!nodeEl) throw new Error(`node "${name}" not found on canvas`);
  fireEvent.click(nodeEl);
}

function classificationSelect() {
  return within(screen.getByRole('complementary')).getByLabelText(/domain classification/i);
}

function canvasNode(name: string) {
  return screen.getByTestId(`bounded-context-${name}`);
}

function storedMap(): { nodes: BoundedContextNode[]; edges: RelationshipEdge[] } {
  return JSON.parse(localStorage.getItem('context-map-data') ?? '{}');
}

const BADGES = ['Core', 'Supporting', 'Generic'];

describe('STORY-009 Classify a bounded context as core, supporting or generic', () => {
  it.each([
    ['core', 'Core'],
    ['supporting', 'Supporting'],
    ['generic', 'Generic'],
  ])('classifying Billing as %s shows it on the canvas', (value, label) => {
    seed([billing()]);
    render(<App />);

    clickNode('Billing');
    fireEvent.change(classificationSelect(), { target: { value } });

    const node = canvasNode('Billing');
    expect(within(node).getByText(label)).toBeInTheDocument();
    for (const other of BADGES.filter((b) => b !== label)) {
      expect(within(node).queryByText(other)).not.toBeInTheDocument();
    }
  });

  it('a new bounded context is unclassified and looks unchanged', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Add Context' }));
    fireEvent.change(within(screen.getByRole('complementary')).getByLabelText(/^name$/i), {
      target: { value: 'Catalog' },
    });

    expect(classificationSelect()).toHaveValue('');
    const node = canvasNode('Catalog');
    for (const badge of BADGES) {
      expect(within(node).queryByText(badge)).not.toBeInTheDocument();
    }
    expect(storedMap().nodes[0].data).not.toHaveProperty('domainClassification');
  });

  it('removing the classification leaves Billing unclassified', () => {
    seed([billing({ domainClassification: 'core' })]);
    render(<App />);

    clickNode('Billing');
    expect(classificationSelect()).toHaveValue('core');
    expect(within(canvasNode('Billing')).getByText('Core')).toBeInTheDocument();

    fireEvent.change(classificationSelect(), { target: { value: '' } });

    expect(classificationSelect()).toHaveValue('');
    expect(within(canvasNode('Billing')).queryByText('Core')).not.toBeInTheDocument();
    expect(storedMap().nodes[0].data).not.toHaveProperty('domainClassification');
  });

  it('classification round-trips through JSON export and import', () => {
    seed([billing()]);
    render(<App />);
    clickNode('Billing');
    fireEvent.change(classificationSelect(), { target: { value: 'core' } });

    const { nodes, edges } = storedMap();
    const imported = parseJson(generateJson(nodes, edges));
    expect(imported.warnings).toEqual([]);
    expect(imported.nodes[0].data.domainClassification).toBe('core');

    cleanup();
    localStorage.clear();
    seed(imported.nodes);
    render(<App />);
    expect(within(canvasNode('Billing')).getByText('Core')).toBeInTheDocument();
    clickNode('Billing');
    expect(classificationSelect()).toHaveValue('core');
  });

  it('classifying keeps the colour', () => {
    seed([billing()]);
    render(<App />);

    clickNode('Billing');
    fireEvent.change(classificationSelect(), { target: { value: 'supporting' } });

    expect(within(canvasNode('Billing')).getByText('Supporting')).toBeInTheDocument();
    expect(storedMap().nodes[0].data.color).toBe('#3b82f6');
    expect(canvasNode('Billing')).toHaveStyle({ borderColor: '#3b82f6' });
    const header = within(canvasNode('Billing')).getByText('Billing').parentElement;
    expect(header).toHaveStyle({ backgroundColor: '#3b82f6' });
  });
});
