import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SecondaryButton from './SecondaryButton';

describe('SecondaryButton', () => {
  it('renders a native button with the secondary role classes', () => {
    render(<SecondaryButton>Fit View</SecondaryButton>);
    const button = screen.getByRole('button', { name: 'Fit View' });
    expect(button.className).toContain('bg-white');
    expect(button.className).toContain('border-gray-300');
    expect(button.className).toContain('text-gray-700');
  });

  it('forwards onClick, disabled and children', () => {
    const onClick = vi.fn();
    render(
      <SecondaryButton onClick={onClick} disabled>
        Focus Selection
      </SecondaryButton>,
    );
    const button = screen.getByRole('button', { name: 'Focus Selection' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('merges a caller-supplied className', () => {
    render(<SecondaryButton className="px-3 py-2 rounded-lg shadow-sm">Tidy Up</SecondaryButton>);
    const button = screen.getByRole('button', { name: 'Tidy Up' });
    expect(button.className).toContain('px-3 py-2 rounded-lg shadow-sm');
    expect(button.className).toContain('bg-white');
  });
});
