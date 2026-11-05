import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BoundedContextFields from './BoundedContextFields';
import { aBoundedContext } from '../../test/builders';

describe('BoundedContextFields', () => {
  it('does not commit an empty name, and recovers once a valid name is typed again', () => {
    const node = aBoundedContext({ data: { name: 'Billing', description: '', color: '#3b82f6' } });
    const onUpdate = vi.fn();
    render(<BoundedContextFields node={node} onUpdate={onUpdate} />);

    const nameInput = screen.getByLabelText(/^name$/i);

    fireEvent.change(nameInput, { target: { value: '' } });
    expect(screen.getByText('A bounded context needs a name.')).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();

    fireEvent.change(nameInput, { target: { value: 'Invoicing' } });
    expect(screen.queryByText('A bounded context needs a name.')).not.toBeInTheDocument();
    expect(onUpdate).toHaveBeenCalledWith(node.id, expect.objectContaining({ name: 'Invoicing' }));
  });
});
