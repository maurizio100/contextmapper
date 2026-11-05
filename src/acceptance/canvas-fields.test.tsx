import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from '../App';
import { aBoundedContext } from '../test/builders';
import { generateJson } from '../utils/json-export';
import { parseJson } from '../utils/json-import';
import type { BoundedContextNode } from '../types/context-map';

const PURPOSE = 'Turn shipped orders into paid invoices';
const TERMS = 'Invoice, Dunning, Payment Term';
const DECISIONS = 'When an overdue invoice goes to dunning';

function seed(nodes: BoundedContextNode[]) {
  localStorage.setItem('context-map-data', JSON.stringify({ nodes, edges: [] }));
}

function ctx(id: string, name: string, extra: Record<string, unknown> = {}) {
  return aBoundedContext({
    id,
    data: { name, description: '', color: '#3b82f6', ...extra },
  });
}

function clickNode(name: string) {
  const nodeEl = screen.getByText(name).closest('.react-flow__node');
  if (!nodeEl) throw new Error(`node "${name}" not found on canvas`);
  fireEvent.click(nodeEl);
}

function panel() {
  return within(screen.getByRole('complementary'));
}

function storedNodes(): BoundedContextNode[] {
  return JSON.parse(localStorage.getItem('context-map-data') ?? '{}').nodes;
}

describe('STORY-011 Describe a bounded context with canvas fields', () => {
  it('recording purpose, key terms and decisions shows them for the selected context', () => {
    seed([ctx('b', 'Billing')]);
    render(<App />);

    clickNode('Billing');
    fireEvent.change(panel().getByLabelText(/^purpose$/i), { target: { value: PURPOSE } });
    fireEvent.change(panel().getByLabelText(/^key terms$/i), { target: { value: TERMS } });
    fireEvent.change(panel().getByLabelText(/^business decisions$/i), { target: { value: DECISIONS } });

    expect(panel().getByLabelText(/^purpose$/i)).toHaveValue(PURPOSE);
    expect(panel().getByLabelText(/^key terms$/i)).toHaveValue(TERMS);
    expect(panel().getByLabelText(/^business decisions$/i)).toHaveValue(DECISIONS);
    const data = storedNodes()[0].data;
    expect([data.purpose, data.keyTerms, data.businessDecisions]).toEqual([PURPOSE, TERMS, DECISIONS]);
  });

  it('the Billing box does not show its canvas field values', () => {
    seed([ctx('b', 'Billing', { purpose: PURPOSE, keyTerms: TERMS })]);
    render(<App />);

    const box = within(screen.getByTestId('bounded-context-Billing'));
    expect(box.getByText('Billing')).toBeInTheDocument();
    expect(box.queryByText(PURPOSE)).not.toBeInTheDocument();
    expect(box.queryByText(TERMS)).not.toBeInTheDocument();
    expect(box.queryByText(DECISIONS)).not.toBeInTheDocument();
  });

  it('a context with no canvas fields shows that nothing is recorded yet', () => {
    seed([ctx('c', 'Catalog')]);
    render(<App />);

    clickNode('Catalog');

    expect(panel().getByText('Nothing recorded yet.')).toBeInTheDocument();
  });

  it('purpose and key terms survive generateJson then parseJson', () => {
    seed([ctx('b', 'Billing', { purpose: PURPOSE, keyTerms: TERMS })]);

    const imported = parseJson(generateJson(storedNodes(), []));

    expect(imported.warnings).toEqual([]);
    expect(imported.nodes[0].data.purpose).toBe(PURPOSE);
    expect(imported.nodes[0].data.keyTerms).toBe(TERMS);
  });
});
