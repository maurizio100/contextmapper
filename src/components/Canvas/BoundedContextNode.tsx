import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { BoundedContextNode } from '../../types/context-map';

function BoundedContextNodeComponent({ data, selected }: NodeProps<BoundedContextNode>) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`
        rounded-lg shadow-md border-2 bg-white min-w-[180px] max-w-[240px]
        transition-shadow cursor-grab active:cursor-grabbing
        ${selected ? 'shadow-lg ring-2 ring-blue-400' : ''}
      `}
      style={{ borderColor: data.color }}
    >
      <div
        className="px-3 py-1.5 rounded-t-md text-white font-semibold text-sm flex items-center justify-between gap-2"
        style={{ backgroundColor: data.color }}
      >
        <span className="truncate">{data.name}</span>
        {data.description && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((c) => !c);
            }}
            className="shrink-0 w-4 h-4 flex items-center justify-center rounded hover:bg-white/20 transition-colors cursor-pointer"
          >
            <svg
              className={`w-3 h-3 transition-transform ${collapsed ? '-rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
      {data.description && !collapsed && (
        <div className="px-3 py-2 text-xs text-gray-600 line-clamp-3">
          {data.description}
        </div>
      )}
      <Handle type="source" position={Position.Top} id="top"
        className="!w-3 !h-3 !bg-gray-300 !border-2 !border-gray-400 hover:!bg-blue-400 hover:!border-blue-500 !transition-colors" />
      <Handle type="source" position={Position.Right} id="right"
        className="!w-3 !h-3 !bg-gray-300 !border-2 !border-gray-400 hover:!bg-blue-400 hover:!border-blue-500 !transition-colors" />
      <Handle type="source" position={Position.Bottom} id="bottom"
        className="!w-3 !h-3 !bg-gray-300 !border-2 !border-gray-400 hover:!bg-blue-400 hover:!border-blue-500 !transition-colors" />
      <Handle type="source" position={Position.Left} id="left"
        className="!w-3 !h-3 !bg-gray-300 !border-2 !border-gray-400 hover:!bg-blue-400 hover:!border-blue-500 !transition-colors" />
    </div>
  );
}

export default memo(BoundedContextNodeComponent);
