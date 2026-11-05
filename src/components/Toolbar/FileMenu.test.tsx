import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FileMenu from './FileMenu';

describe('FileMenu', () => {
  it('renders a File button and, once opened, menuitems wired to the matching callback', () => {
    const callbacks = {
      onImport: vi.fn(),
      onExport: vi.fn(),
      onImportJson: vi.fn(),
      onExportJson: vi.fn(),
      onExportPng: vi.fn(),
    };
    render(<FileMenu {...callbacks} />);

    expect(screen.getByRole('button', { name: 'File' })).toBeInTheDocument();

    const cases: [string, keyof typeof callbacks][] = [
      ['Import Markdown', 'onImport'],
      ['Import JSON', 'onImportJson'],
      ['Export to Markdown', 'onExport'],
      ['Export JSON', 'onExportJson'],
      ['Export to PNG', 'onExportPng'],
    ];

    for (const [label, key] of cases) {
      fireEvent.click(screen.getByRole('button', { name: 'File' }));
      fireEvent.click(screen.getByRole('menuitem', { name: label }));
      expect(callbacks[key]).toHaveBeenCalledTimes(1);
    }
  });
});
