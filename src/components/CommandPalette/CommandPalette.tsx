import { useState, type KeyboardEvent } from 'react';
import { filterCommands, formatShortcut, isMacPlatform, type Command } from '../../utils/commands';

interface CommandPaletteProps {
  open: boolean;
  commands: Command[];
  onClose: () => void;
}

function PaletteBody({ commands, onClose }: Omit<CommandPaletteProps, 'open'>) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const results = filterCommands(commands, query);
  const isMac = isMacPlatform();
  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));

  const run = (command: Command) => {
    onClose();
    command.run();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(Math.min(activeIndex + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (results[activeIndex]) run(results[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex items-start justify-center pt-24 bg-black/20">
      <div
        role="dialog"
        aria-label="Command palette"
        className="w-96 rounded-lg bg-white shadow-xl border border-gray-200"
      >
        <input
          autoFocus
          aria-label="Search actions"
          placeholder="Type an action..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className="w-full px-3 py-2 border-b border-gray-200 rounded-t-lg outline-none"
        />
        {results.length === 0 ? (
          <p className="px-3 py-2 text-sm text-gray-500">No matching action</p>
        ) : (
          <ul role="listbox" aria-label="Actions" className="max-h-72 overflow-auto py-1">
            {results.map((command, i) => (
              <li
                key={command.id}
                role="option"
                aria-selected={i === activeIndex}
                onClick={() => run(command)}
                onMouseEnter={() => setActive(i)}
                className={`flex justify-between px-3 py-1.5 text-sm cursor-pointer ${
                  i === activeIndex ? 'bg-blue-50' : ''
                }`}
              >
                <span>{command.label}</span>
                {command.shortcuts?.[0] && (
                  <span className="text-gray-500">{formatShortcut(command.shortcuts[0], isMac)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function CommandPalette({ open, commands, onClose }: CommandPaletteProps) {
  if (!open) return null;
  return <PaletteBody commands={commands} onClose={onClose} />;
}
