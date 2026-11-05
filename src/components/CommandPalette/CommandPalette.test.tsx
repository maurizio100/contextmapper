import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CommandPalette from './CommandPalette';
import type { Command } from '../../utils/commands';

function setup() {
  const runs = { a: vi.fn(), b: vi.fn() };
  const onClose = vi.fn();
  const commands: Command[] = [
    { id: 'a', label: 'Alpha', shortcuts: [{ key: 'f' }], available: true, run: runs.a },
    { id: 'b', label: 'Beta', available: true, run: runs.b },
    { id: 'c', label: 'Gamma', available: false, run: vi.fn() },
  ];
  render(<CommandPalette open commands={commands} onClose={onClose} />);
  return { runs, onClose, input: screen.getByRole('textbox', { name: 'Search actions' }) };
}

describe('CommandPalette', () => {
  it('renders nothing when closed', () => {
    render(<CommandPalette open={false} commands={[]} onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('lists available actions with their shortcut and filters by typing', () => {
    const { input } = setup();
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['AlphaF', 'Beta']);
    fireEvent.change(input, { target: { value: 'bet' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('shows an empty-result message', () => {
    const { input } = setup();
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.getByText('No matching action')).toBeTruthy();
  });

  it('runs the arrowed-to action on Enter and closes', () => {
    const { input, runs, onClose } = setup();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(runs.b).toHaveBeenCalledTimes(1);
    expect(runs.a).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('runs an action on click and closes on Escape', () => {
    const { input, runs, onClose } = setup();
    fireEvent.click(screen.getByRole('option', { name: /Alpha/ }));
    expect(runs.a).toHaveBeenCalledTimes(1);
    onClose.mockClear();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
