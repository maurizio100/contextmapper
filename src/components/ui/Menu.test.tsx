import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Menu from './Menu';

function renderMenu(onSelect = vi.fn()) {
  const groups = [
    { label: 'Group A', items: [{ label: 'Item One', onSelect }] },
    { label: 'Group B', items: [{ label: 'Item Two', onSelect: vi.fn() }] },
  ];
  render(<Menu label="File" groups={groups} />);
  return { onSelect };
}

describe('Menu', () => {
  it('opens on trigger click, shows grouped menuitems, closes on Escape', () => {
    renderMenu();
    const trigger = screen.getByRole('button', { name: 'File' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Item One' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Item Two' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on outside click, and selecting an item calls its onSelect then closes the menu', () => {
    const { onSelect } = renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'File' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'File' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Item One' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
