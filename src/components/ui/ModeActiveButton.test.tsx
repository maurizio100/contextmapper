import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModeActiveButton from './ModeActiveButton';

describe('ModeActiveButton', () => {
  it('renders a native button with the mode-active role classes', () => {
    render(<ModeActiveButton>Exit Focus</ModeActiveButton>);
    const button = screen.getByRole('button', { name: 'Exit Focus' });
    expect(button.className).toContain('bg-amber-500');
    expect(button.className).toContain('text-white');
  });

  it('forwards onClick, disabled and children', () => {
    const onClick = vi.fn();
    render(
      <ModeActiveButton onClick={onClick} disabled>
        Exit Focus
      </ModeActiveButton>,
    );
    const button = screen.getByRole('button', { name: 'Exit Focus' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('merges a caller-supplied className', () => {
    render(
      <ModeActiveButton className="flex items-center gap-1.5 px-3 py-2 rounded-lg shadow-md">
        Exit Focus
      </ModeActiveButton>,
    );
    const button = screen.getByRole('button', { name: 'Exit Focus' });
    expect(button.className).toContain('flex items-center gap-1.5 px-3 py-2 rounded-lg shadow-md');
    expect(button.className).toContain('bg-amber-500');
  });
});
