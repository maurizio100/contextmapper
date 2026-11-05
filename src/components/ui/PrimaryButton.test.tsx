import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PrimaryButton from './PrimaryButton';

describe('PrimaryButton', () => {
  it('renders a native button with the primary role classes', () => {
    render(<PrimaryButton>Add Context</PrimaryButton>);
    const button = screen.getByRole('button', { name: 'Add Context' });
    expect(button.className).toContain('bg-blue-600');
    expect(button.className).toContain('text-white');
  });

  it('forwards onClick, disabled and children', () => {
    const onClick = vi.fn();
    render(
      <PrimaryButton onClick={onClick} disabled>
        Create
      </PrimaryButton>,
    );
    const button = screen.getByRole('button', { name: 'Create' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('merges a caller-supplied className', () => {
    render(<PrimaryButton className="px-4 py-2 rounded-lg">Save</PrimaryButton>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.className).toContain('px-4 py-2 rounded-lg');
    expect(button.className).toContain('bg-blue-600');
  });
});
