import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import App from '../App';
import { aBoundedContext, aRelationship } from '../test/builders';
import { RelationshipType } from '../types/context-map';

function seed(nodes: ReturnType<typeof aBoundedContext>[], edges: ReturnType<typeof aRelationship>[] = []) {
  localStorage.setItem('context-map-data', JSON.stringify({ nodes, edges }));
}

/** Clicks a bounded context's card on the canvas by its visible name. */
function clickNode(name: string) {
  const label = screen.getByText(name);
  const nodeEl = label.closest('.react-flow__node');
  if (!nodeEl) throw new Error(`node "${name}" not found on canvas`);
  fireEvent.click(nodeEl);
}

/** Clicks a relationship edge on the canvas by its source and target names. */
function clickEdge(sourceName: string, targetName: string) {
  fireEvent.click(screen.getByTestId(`relationship-${sourceName}-${targetName}`));
}

describe('STORY-006 Edit the selected bounded context or relationship in place', () => {
  it('selecting a bounded context shows its details', () => {
    seed([
      aBoundedContext({
        id: 'ctx-billing',
        data: { name: 'Billing', description: 'Invoices and payments', color: '#3b82f6' },
      }),
    ]);
    render(<App />);

    clickNode('Billing');

    const panel = screen.getByRole('complementary');
    const nameInput = within(panel).getByLabelText(/^name$/i);
    expect(nameInput).toHaveValue('Billing');
    expect(nameInput).toBeEnabled();
    expect(within(panel).getByLabelText(/^description$/i)).toHaveValue('Invoices and payments');
    expect(within(panel).getByText(/color/i)).toBeInTheDocument();
  });

  it('selecting a relationship shows its details', () => {
    seed(
      [
        aBoundedContext({ id: 'ctx-billing', data: { name: 'Billing', description: '', color: '#3b82f6' } }),
        aBoundedContext({ id: 'ctx-shipping', data: { name: 'Shipping', description: '', color: '#10b981' } }),
      ],
      [
        aRelationship({
          id: 'rel-1',
          source: 'ctx-billing',
          target: 'ctx-shipping',
          data: {
            relationshipType: RelationshipType.CustomerSupplier,
            sourceRole: 'upstream',
            targetRole: 'downstream',
            notes: 'Integration via REST',
            clarity: 'clear',
          },
        }),
      ]
    );
    render(<App />);

    clickEdge('Billing', 'Shipping');

    const panel = screen.getByRole('complementary');
    expect(
      within(panel).getByRole('button', { name: /Customer-Supplier/i, pressed: true })
    ).toBeInTheDocument();
    expect(within(panel).getAllByText('Billing').length).toBeGreaterThan(0);
    expect(within(panel).getAllByText('Shipping').length).toBeGreaterThan(0);
    expect(within(panel).getByLabelText(/notes/i)).toHaveValue('Integration via REST');
    expect(within(panel).getByRole('button', { name: 'Clear', pressed: true })).toBeInTheDocument();
  });

  it('an edit is applied to the context map immediately', () => {
    seed([
      aBoundedContext({ id: 'ctx-billing', data: { name: 'Billing', description: '', color: '#3b82f6' } }),
    ]);
    render(<App />);
    clickNode('Billing');

    const panel = screen.getByRole('complementary');
    const nameInput = within(panel).getByLabelText(/^name$/i);
    fireEvent.change(nameInput, { target: { value: 'Invoicing' } });

    const nodeEl = screen.getByTestId('bounded-context-Invoicing');
    expect(within(nodeEl).getByText('Invoicing')).toBeInTheDocument();
  });

  it('a new bounded context opens with its details ready to fill in', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Add Context' }));

    expect(document.querySelectorAll('.react-flow__node.selected').length).toBe(1);

    const panel = screen.getByRole('complementary');
    const nameInput = within(panel).getByLabelText(/^name$/i) as HTMLInputElement;
    expect(nameInput).toHaveValue('New context');
    await waitFor(() => expect(nameInput).toHaveFocus());
    expect(nameInput.selectionStart).toBe(0);
    expect(nameInput.selectionEnd).toBe(nameInput.value.length);
  });

  it('a new bounded context left untouched still has a name once deselected', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Add Context' }));

    const pane = document.querySelector('.react-flow__pane');
    if (!pane) throw new Error('react flow pane not found');
    fireEvent.click(pane);

    const nodeEl = screen.getByTestId('bounded-context-New context');
    expect(within(nodeEl).getByText('New context')).toBeInTheDocument();
  });

  it('clearing the selection hides the details', () => {
    seed([
      aBoundedContext({ id: 'ctx-billing', data: { name: 'Billing', description: '', color: '#3b82f6' } }),
    ]);
    render(<App />);
    clickNode('Billing');
    expect(screen.getByRole('complementary')).toBeInTheDocument();

    const pane = document.querySelector('.react-flow__pane');
    if (!pane) throw new Error('react flow pane not found');
    fireEvent.click(pane);

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('a bounded context cannot be left without a name', () => {
    seed([
      aBoundedContext({ id: 'ctx-billing', data: { name: 'Billing', description: '', color: '#3b82f6' } }),
    ]);
    render(<App />);
    clickNode('Billing');

    const panel = screen.getByRole('complementary');
    const nameInput = within(panel).getByLabelText(/^name$/i);
    fireEvent.change(nameInput, { target: { value: '' } });

    expect(screen.getByText('A bounded context needs a name.')).toBeInTheDocument();
    const nodeEl = screen.getByTestId('bounded-context-Billing');
    expect(within(nodeEl).getByText('Billing')).toBeInTheDocument();
  });
});
