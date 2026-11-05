import { describe, expect, it } from 'vitest';
import { filterCommands, formatShortcut, matchesShortcut, type Command } from './commands';

const cmd = (label: string, available = true): Command => ({ id: label, label, available, run: () => {} });
const key = (init: KeyboardEventInit & { key: string }) => new KeyboardEvent('keydown', init);

describe('filterCommands', () => {
  const commands = [cmd('Export JSON'), cmd('Import JSON'), cmd('Focus Selection', false)];

  it('matches a case-insensitive substring of the label', () => {
    expect(filterCommands(commands, 'EXPORT').map((c) => c.label)).toEqual(['Export JSON']);
    expect(filterCommands(commands, 'json')).toHaveLength(2);
  });

  it('hides unavailable commands and lists all available ones for an empty query', () => {
    expect(filterCommands(commands, 'focus')).toEqual([]);
    expect(filterCommands(commands, '')).toHaveLength(2);
  });
});

describe('matchesShortcut', () => {
  it('requires the modifier for mod shortcuts and none for plain ones', () => {
    expect(matchesShortcut(key({ key: 'z', ctrlKey: true }), { key: 'z', mod: true })).toBe(true);
    expect(matchesShortcut(key({ key: 'z', metaKey: true }), { key: 'z', mod: true })).toBe(true);
    expect(matchesShortcut(key({ key: 'z' }), { key: 'z', mod: true })).toBe(false);
    expect(matchesShortcut(key({ key: 'f' }), { key: 'f' })).toBe(true);
    expect(matchesShortcut(key({ key: 'f', ctrlKey: true }), { key: 'f' })).toBe(false);
  });

  it('distinguishes Shift and treats ctrl shortcuts as Ctrl only', () => {
    expect(matchesShortcut(key({ key: 'Z', ctrlKey: true, shiftKey: true }), { key: 'z', mod: true })).toBe(false);
    expect(matchesShortcut(key({ key: 'Z', ctrlKey: true, shiftKey: true }), { key: 'z', mod: true, shift: true })).toBe(true);
    expect(matchesShortcut(key({ key: 'y', ctrlKey: true }), { key: 'y', ctrl: true })).toBe(true);
    expect(matchesShortcut(key({ key: 'y', metaKey: true }), { key: 'y', ctrl: true })).toBe(false);
  });
});

describe('formatShortcut', () => {
  it('formats for Windows/Linux and macOS', () => {
    expect(formatShortcut({ key: 'z', mod: true }, false)).toBe('Ctrl+Z');
    expect(formatShortcut({ key: 'z', mod: true, shift: true }, false)).toBe('Ctrl+Shift+Z');
    expect(formatShortcut({ key: 'z', mod: true }, true)).toBe('⌘Z');
    expect(formatShortcut({ key: 'Escape' }, false)).toBe('Esc');
  });
});
