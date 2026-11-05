import { useEffect } from 'react';
import { matchesShortcut, type Command } from '../utils/commands';

function isTextTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
  );
}

/** Binds every command's shortcuts through one keydown listener; ignored while typing unless allowed. */
export function useShortcuts(commands: Command[]) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const typing = isTextTarget(event.target);
      const match = commands.find(
        (c) =>
          c.available &&
          c.shortcuts?.some(
            (s) => (!typing || s.allowWhileTyping) && matchesShortcut(event, s)
          )
      );
      if (!match) return;
      event.preventDefault();
      match.run();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [commands]);
}
