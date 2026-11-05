export interface Shortcut {
  /** `KeyboardEvent.key`, compared case-insensitively. */
  key: string;
  /** Ctrl on Windows/Linux, Cmd on macOS. */
  mod?: boolean;
  /** Ctrl only (not Cmd), for bindings such as Ctrl+Y. */
  ctrl?: boolean;
  shift?: boolean;
  /** Fire even while the focus is in a text field. */
  allowWhileTyping?: boolean;
}

export interface Command {
  id: string;
  label: string;
  shortcuts?: Shortcut[];
  available: boolean;
  run: () => void;
}

export const UNDO_SHORTCUT: Shortcut = { key: 'z', mod: true };
export const REDO_SHORTCUT: Shortcut = { key: 'z', mod: true, shift: true };
export const REDO_ALT_SHORTCUT: Shortcut = { key: 'y', ctrl: true };
export const FOCUS_SHORTCUT: Shortcut = { key: 'f' };
export const EXIT_FOCUS_SHORTCUT: Shortcut = { key: 'Escape' };
export const PALETTE_SHORTCUT: Shortcut = { key: 'k', mod: true, allowWhileTyping: true };

/** Available commands whose label contains the query, case-insensitively. */
export function filterCommands(commands: Command[], query: string): Command[] {
  const needle = query.trim().toLowerCase();
  return commands.filter((c) => c.available && c.label.toLowerCase().includes(needle));
}

export function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut): boolean {
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) return false;
  if (event.altKey) return false;
  if (event.shiftKey !== !!shortcut.shift) return false;
  if (shortcut.ctrl) return event.ctrlKey && !event.metaKey;
  const hasMod = event.ctrlKey || event.metaKey;
  return hasMod === !!shortcut.mod;
}

const KEY_NAMES: Record<string, string> = { Escape: 'Esc' };

export function formatShortcut(shortcut: Shortcut, isMac: boolean): string {
  const key = KEY_NAMES[shortcut.key] ?? (shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key);
  if (isMac) {
    return `${shortcut.ctrl ? '⌃' : ''}${shortcut.mod ? '⌘' : ''}${shortcut.shift ? '⇧' : ''}${key}`;
  }
  const parts = [];
  if (shortcut.mod || shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  parts.push(key);
  return parts.join('+');
}

export function isMacPlatform(): boolean {
  return typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
}
