import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUndoRedoShortcuts } from './useUndoRedoShortcuts';

function setup() {
  const undo = vi.fn();
  const redo = vi.fn();
  renderHook(() => useUndoRedoShortcuts({ undo, redo }));
  return { undo, redo };
}

function press(target: EventTarget, init: KeyboardEventInit) {
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
}

describe('useUndoRedoShortcuts', () => {
  it('undoes on Ctrl+Z and Cmd+Z', () => {
    const { undo, redo } = setup();
    press(document.body, { key: 'z', ctrlKey: true });
    press(document.body, { key: 'z', metaKey: true });
    expect(undo).toHaveBeenCalledTimes(2);
    expect(redo).not.toHaveBeenCalled();
  });

  it('redoes on Shift+Ctrl+Z', () => {
    const { undo, redo } = setup();
    press(document.body, { key: 'Z', ctrlKey: true, shiftKey: true });
    expect(redo).toHaveBeenCalledTimes(1);
    expect(undo).not.toHaveBeenCalled();
  });

  it('ignores the shortcut inside an input', () => {
    const { undo, redo } = setup();
    const input = document.createElement('input');
    document.body.appendChild(input);
    press(input, { key: 'z', ctrlKey: true });
    press(input, { key: 'z', ctrlKey: true, shiftKey: true });
    input.remove();
    expect(undo).not.toHaveBeenCalled();
    expect(redo).not.toHaveBeenCalled();
  });
});
