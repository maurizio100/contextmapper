import { useReactFlow } from '@xyflow/react';
import { FIT_VIEW_OPTIONS } from '../../constants/canvas';
import PrimaryButton from '../ui/PrimaryButton';
import SecondaryButton from '../ui/SecondaryButton';
import ModeActiveButton from '../ui/ModeActiveButton';
import FileMenu from './FileMenu';

interface ToolbarProps {
  onAddContext: () => void;
  onTidy: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onImport: () => void;
  onExport: () => void;
  onImportJson: () => void;
  onExportJson: () => void;
  onExportPng: () => void;
  onFocus: () => void;
  onClearFocus: () => void;
  isFocused: boolean;
  canFocus: boolean;
  visibleCount: number;
  hiddenCount: number;
}

export default function Toolbar({
  onAddContext,
  onTidy,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onImport,
  onExport,
  onImportJson,
  onExportJson,
  onExportPng,
  onFocus,
  onClearFocus,
  isFocused,
  canFocus,
  visibleCount,
  hiddenCount,
}: ToolbarProps) {
  const { fitView } = useReactFlow();

  return (
    <div className="absolute top-4 left-4 z-10 flex gap-2">
      <PrimaryButton
        onClick={onAddContext}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg shadow-md"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Context
      </PrimaryButton>
      <SecondaryButton
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        className="px-3 py-2 rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Undo
      </SecondaryButton>
      <SecondaryButton
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Shift+Ctrl+Z)"
        className="px-3 py-2 rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Redo
      </SecondaryButton>
      <SecondaryButton onClick={() => fitView(FIT_VIEW_OPTIONS)} className="px-3 py-2 rounded-lg shadow-sm">
        Fit View
      </SecondaryButton>
      <SecondaryButton onClick={onTidy} className="px-3 py-2 rounded-lg shadow-sm">
        Tidy Up
      </SecondaryButton>
      {isFocused ? (
        <ModeActiveButton
          onClick={onClearFocus}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg shadow-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Exit Focus
          <span className="ml-0.5 rounded bg-white/25 px-1.5 py-0.5 text-xs">
            {visibleCount} shown{hiddenCount > 0 ? `, ${hiddenCount} hidden` : ''}
          </span>
        </ModeActiveButton>
      ) : (
        <SecondaryButton
          onClick={onFocus}
          disabled={!canFocus}
          title="Select one context to see it and its neighbours, or several to show just those"
          className="px-3 py-2 rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Focus Selection
        </SecondaryButton>
      )}
      <FileMenu
        onImport={onImport}
        onExport={onExport}
        onImportJson={onImportJson}
        onExportJson={onExportJson}
        onExportPng={onExportPng}
      />
    </div>
  );
}
