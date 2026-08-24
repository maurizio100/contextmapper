import { useReactFlow } from '@xyflow/react';

interface ToolbarProps {
  onAddContext: () => void;
  onTidy: () => void;
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
      <button
        onClick={onAddContext}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Context
      </button>
      <button
        onClick={() => fitView({ padding: 0.2 })}
        className="px-3 py-2 text-sm font-medium rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors"
      >
        Fit View
      </button>
      <button
        onClick={onTidy}
        className="px-3 py-2 text-sm font-medium rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors"
      >
        Tidy Up
      </button>
      {isFocused ? (
        <button
          onClick={onClearFocus}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 shadow-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Exit Focus
          <span className="ml-0.5 rounded bg-white/25 px-1.5 py-0.5 text-xs">
            {visibleCount} shown{hiddenCount > 0 ? `, ${hiddenCount} hidden` : ''}
          </span>
        </button>
      ) : (
        <button
          onClick={onFocus}
          disabled={!canFocus}
          title="Select one context to see it and its neighbours, or several to show just those"
          className="px-3 py-2 text-sm font-medium rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Focus Selection
        </button>
      )}
      <button
        onClick={onImport}
        className="px-3 py-2 text-sm font-medium rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors"
      >
        Import Markdown
      </button>
      <button
        onClick={onExport}
        className="px-3 py-2 text-sm font-medium rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors"
      >
        Export to Markdown
      </button>
      <button
        onClick={onImportJson}
        className="px-3 py-2 text-sm font-medium rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors"
      >
        Import JSON
      </button>
      <button
        onClick={onExportJson}
        className="px-3 py-2 text-sm font-medium rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors"
      >
        Export JSON
      </button>
      <button
        onClick={onExportPng}
        className="px-3 py-2 text-sm font-medium rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors"
      >
        Export to PNG
      </button>
    </div>
  );
}
