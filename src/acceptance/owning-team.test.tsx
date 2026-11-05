import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import App from '../App';
import { aBoundedContext } from '../test/builders';
import { generateJson } from '../utils/json-export';
import { parseJson } from '../utils/json-import';
import type { BoundedContextNode } from '../types/context-map';

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

function teamInput() {
  return within(screen.getByRole('complementary')).getByLabelText(/owning team/i);
}

function canvasNode(name: string) {
  return screen.getByTestId(`bounded-context-${name}`);
}

function storedNodes(): BoundedContextNode[] {
  return JSON.parse(localStorage.getItem('context-map-data') ?? '{}').nodes;
}

function offered() {
  const list = teamInput().getAttribute('list');
  const datalist = document.getElementById(list ?? '');
  return Array.from(datalist?.querySelectorAll('option') ?? []).map((o) => o.getAttribute('value'));
}

describe('STORY-010 Record the owning team of a bounded context', () => {
  it('setting the owning team of Billing shows it on the canvas', () => {
    seed([ctx('b', 'Billing')]);
    render(<App />);

    clickNode('Billing');
    fireEvent.change(teamInput(), { target: { value: 'Team Payments' } });

    expect(within(canvasNode('Billing')).getByText('Team: Team Payments')).toBeInTheDocument();
  });

  it('a team already used is offered as a choice for another context', () => {
    seed([ctx('b', 'Billing', { owningTeam: 'Team Payments' }), ctx('i', 'Invoicing')]);
    render(<App />);

    clickNode('Invoicing');

    expect(offered()).toEqual(['Team Payments']);
  });

  it('" team payments " is stored with the existing spelling', () => {
    seed([ctx('b', 'Billing', { owningTeam: 'Team Payments' }), ctx('i', 'Invoicing')]);
    render(<App />);

    clickNode('Invoicing');
    fireEvent.change(teamInput(), { target: { value: ' team payments ' } });

    expect(within(canvasNode('Invoicing')).getByText('Team: Team Payments')).toBeInTheDocument();
    expect(storedNodes().find((n) => n.id === 'i')?.data.owningTeam).toBe('Team Payments');
  });

  it('a new bounded context has no owning team', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Add Context' }));
    fireEvent.change(within(screen.getByRole('complementary')).getByLabelText(/^name$/i), {
      target: { value: 'Catalog' },
    });

    expect(teamInput()).toHaveValue('');
    expect(within(canvasNode('Catalog')).queryByText(/^Team:/)).not.toBeInTheDocument();
    expect(storedNodes()[0].data).not.toHaveProperty('owningTeam');
  });

  it('owning team round-trips through JSON export and import', () => {
    seed([ctx('b', 'Billing')]);
    render(<App />);
    clickNode('Billing');
    fireEvent.change(teamInput(), { target: { value: 'Team Payments' } });

    const imported = parseJson(generateJson(storedNodes(), []));
    expect(imported.warnings).toEqual([]);
    expect(imported.nodes[0].data.owningTeam).toBe('Team Payments');

    cleanup();
    localStorage.clear();
    seed(imported.nodes);
    render(<App />);
    expect(within(canvasNode('Billing')).getByText('Team: Team Payments')).toBeInTheDocument();
    clickNode('Billing');
    expect(teamInput()).toHaveValue('Team Payments');
  });
});
