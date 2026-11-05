import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BoundedContextFields from './BoundedContextFields';
import { aBoundedContext } from '../../test/builders';

describe('BoundedContextFields', () => {
  it('does not commit an empty name, and recovers once a valid name is typed again', () => {
    const node = aBoundedContext({ data: { name: 'Billing', description: '', color: '#3b82f6' } });
    const onUpdate = vi.fn();
    render(<BoundedContextFields node={node} teams={[]} onUpdate={onUpdate} />);

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
    render(<BoundedContextFields node={node} teams={[]} onUpdate={onUpdate} />);

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
    render(<BoundedContextFields node={node} teams={['Team Payments']} onUpdate={onUpdate} />);

    fireEvent.change(screen.getByLabelText(/owning team/i), { target: { value: '  ' } });

    const data = onUpdate.mock.calls[0][1];
    expect('owningTeam' in data).toBe(false);
    expect(data.name).toBe('Billing');
  });
});
