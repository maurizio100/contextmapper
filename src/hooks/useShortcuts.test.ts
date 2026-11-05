import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useShortcuts } from './useShortcuts';
import {
  UNDO_SHORTCUT,
  REDO_SHORTCUT,
  REDO_ALT_SHORTCUT,
  FOCUS_SHORTCUT,
  PALETTE_SHORTCUT,
  type Command,
} from '../utils/commands';

function setup(overrides: Partial<Record<string, boolean>> = {}) {
  const run = { undo: vi.fn(), redo: vi.fn(), focus: vi.fn(), palette: vi.fn() };
  const commands: Command[] = [
    { id: 'undo', label: 'Undo', shortcuts: [UNDO_SHORTCUT], available: overrides.undo ?? true, run: run.undo },
    { id: 'redo', label: 'Redo', shortcuts: [REDO_SHORTCUT, REDO_ALT_SHORTCUT], available: true, run: run.redo },
    { id: 'focus', label: 'Focus Selection', shortcuts: [FOCUS_SHORTCUT], available: overrides.focus ?? true, run: run.focus },
    { id: 'palette', label: 'Command palette', shortcuts: [PALETTE_SHORTCUT], available: true, run: run.palette },
  ];
  renderHook(() => useShortcuts(commands));
  return run;
}

function press(target: EventTarget, init: KeyboardEventInit & { key: string }) {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

describe('useShortcuts', () => {
  it('undoes on Ctrl+Z and Cmd+Z and prevents the default', () => {
    const run = setup();
    const event = press(document.body, { key: 'z', ctrlKey: true });
    press(document.body, { key: 'z', metaKey: true });
    expect(run.undo).toHaveBeenCalledTimes(2);
    expect(event.defaultPrevented).toBe(true);
    expect(run.redo).not.toHaveBeenCalled();
  });

  it('redoes on Shift+Ctrl+Z and Ctrl+Y', () => {
    const run = setup();
    press(document.body, { key: 'Z', ctrlKey: true, shiftKey: true });
    press(document.body, { key: 'y', ctrlKey: true });
    expect(run.redo).toHaveBeenCalledTimes(2);
    expect(run.undo).not.toHaveBeenCalled();
  });

  it('skips shortcuts inside an input, but not those allowed while typing', () => {
    const run = setup();
    const input = document.createElement('input');
    document.body.appendChild(input);
    press(input, { key: 'z', ctrlKey: true });
    press(input, { key: 'f' });
    press(input, { key: 'k', ctrlKey: true });
    input.remove();
    expect(run.undo).not.toHaveBeenCalled();
    expect(run.focus).not.toHaveBeenCalled();
    expect(run.palette).toHaveBeenCalledTimes(1);
  });

  it('ignores a command that is not available', () => {
    const run = setup({ focus: false });
    press(document.body, { key: 'f' });
    expect(run.focus).not.toHaveBeenCalled();
  });
});
