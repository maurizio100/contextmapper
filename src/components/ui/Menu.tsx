import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export interface MenuItem {
  label: string;
  onSelect: () => void;
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

interface MenuProps {
  label: ReactNode;
  groups: MenuGroup[];
  className?: string;
}

/** Generic accessible menu: a trigger button that opens a grouped, dismissible menu. */
export default function Menu({ label, groups, className = '' }: MenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors ${className}`}
      >
        {label}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1 min-w-max rounded-lg border border-gray-300 bg-white py-1 shadow-md z-20"
        >
          {groups.map((group) => (
            <div key={group.label} role="group" aria-label={group.label} className="py-1 first:pt-0 last:pb-0">
              <div className="px-3 py-1 text-xs font-semibold text-gray-400">{group.label}</div>
              {group.items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    item.onSelect();
                    setOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
