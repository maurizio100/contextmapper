import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BoundedContextFields from './BoundedContextFields';
import { aBoundedContext } from '../../test/builders';

describe('BoundedContextFields', () => {
  it('does not commit an empty name, and recovers once a valid name is typed again', () => {
    const node = aBoundedContext({ data: { name: 'Billing', description: '', color: '#3b82f6' } });
    const onUpdate = vi.fn();
    render(<BoundedContextFields node={node} teams={[]} otherTeams={[]} onUpdate={onUpdate} />);

    const nameInput = screen.getByLabelText(/^name$/i);

    fireEvent.change(nameInput, { target: { value: '' } });
    expect(screen.getByText('A bounded context needs a name.')).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();

    fireEvent.change(nameInput, { target: { value: 'Invoicing' } });
    expect(screen.queryByText('A bounded context needs a name.')).not.toBeInTheDocument();
    expect(onUpdate).toHaveBeenCalledWith(node.id, expect.objectContaining({ name: 'Invoicing' }));
  });

  it('omits the classification key when "Unclassified" is chosen', () => {
    const node = aBoundedContext({
      data: { name: 'Billing', description: '', color: '#3b82f6', domainClassification: 'core' },
    });
    const onUpdate = vi.fn();
    render(<BoundedContextFields node={node} teams={[]} otherTeams={[]} onUpdate={onUpdate} />);

    fireEvent.change(screen.getByLabelText(/domain classification/i), { target: { value: '' } });

    const data = onUpdate.mock.calls[0][1];
    expect('domainClassification' in data).toBe(false);
    expect(data.name).toBe('Billing');
  });

  it('omits the owning team key when the field is cleared', () => {
    const node = aBoundedContext({
      data: { name: 'Billing', description: '', color: '#3b82f6', owningTeam: 'Team Payments' },
    });
    const onUpdate = vi.fn();
    render(<BoundedContextFields node={node} teams={['Team Payments']} otherTeams={[]} onUpdate={onUpdate} />);

    fireEvent.change(screen.getByLabelText(/owning team/i), { target: { value: '  ' } });

    const data = onUpdate.mock.calls[0][1];
    expect('owningTeam' in data).toBe(false);
    expect(data.name).toBe('Billing');
  });

  it('lets the sole owner of a team change its spelling', () => {
    const node = aBoundedContext({
      data: { name: 'Billing', description: '', color: '#3b82f6', owningTeam: 'growth' },
    });
    const onUpdate = vi.fn();
    render(<BoundedContextFields node={node} teams={['growth']} otherTeams={[]} onUpdate={onUpdate} />);

    fireEvent.change(screen.getByLabelText(/owning team/i), { target: { value: 'Growth' } });

    expect(onUpdate.mock.calls[0][1].owningTeam).toBe('Growth');
  });

  it('joins the spelling of a team another context owns', () => {
    const node = aBoundedContext({
      data: { name: 'Billing', description: '', color: '#3b82f6' },
    });
    const onUpdate = vi.fn();
    render(
      <BoundedContextFields
        node={node}
        teams={['Team Payments']}
        otherTeams={['Team Payments']}
        onUpdate={onUpdate}
      />
    );

    fireEvent.change(screen.getByLabelText(/owning team/i), { target: { value: ' team payments ' } });

    expect(onUpdate.mock.calls[0][1].owningTeam).toBe('Team Payments');
  });

  it('omits a canvas key when cleared or whitespace-only and keeps the other keys', () => {
    const node = aBoundedContext({
      data: { name: 'Billing', description: '', color: '#3b82f6', purpose: 'Pay', keyTerms: 'Invoice' },
    });
    const onUpdate = vi.fn();
    render(<BoundedContextFields node={node} teams={[]} otherTeams={[]} onUpdate={onUpdate} />);

    fireEvent.change(screen.getByLabelText(/^purpose$/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/^key terms$/i), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText(/^business decisions$/i), { target: { value: 'Dunning' } });

    const first = onUpdate.mock.calls[0][1];
    expect('purpose' in first).toBe(false);
    expect(first.keyTerms).toBe('Invoice');
    const second = onUpdate.mock.calls[1][1];
    expect('keyTerms' in second).toBe(false);
    expect(onUpdate.mock.calls[2][1].businessDecisions).toBe('Dunning');
  });

  it('shows the hint only while no canvas field is recorded', () => {
    const empty = aBoundedContext({ data: { name: 'Catalog', description: '', color: '#3b82f6' } });
    const { unmount } = render(<BoundedContextFields node={empty} teams={[]} otherTeams={[]} onUpdate={vi.fn()} />);
    expect(screen.getByText('Nothing recorded yet.')).toBeInTheDocument();
    unmount();
    const filled = aBoundedContext({ data: { name: 'Billing', description: '', color: '#3b82f6', purpose: 'x' } });
    render(<BoundedContextFields node={filled} teams={[]} otherTeams={[]} onUpdate={vi.fn()} />);
    expect(screen.queryByText('Nothing recorded yet.')).not.toBeInTheDocument();
  });
});
