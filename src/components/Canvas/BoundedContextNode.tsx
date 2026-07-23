import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { BoundedContextNode, HandleSide } from '../../types/context-map';

const SIDE_POSITION: Record<HandleSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

const HANDLE_CLASS =
  '!w-3 !h-3 !bg-gray-300 !border-2 !border-gray-400 hover:!bg-blue-400 hover:!border-blue-500 !transition-colors';

/** Anchors evenly spaced along one side: fractions (i+1)/(count+1). */
function sideHandles(side: HandleSide, count: number) {
  const n = Math.max(1, count);
  const horizontal = side === 'top' || side === 'bottom';
  return Array.from({ length: n }, (_, i) => {
    const pct = ((i + 1) / (n + 1)) * 100;
    return (
      <Handle
        key={`${side}-${i}`}
        type="source"
        position={SIDE_POSITION[side]}
        id={`${side}-${i}`}
        className={HANDLE_CLASS}
        style={horizontal ? { left: `${pct}%` } : { top: `${pct}%` }}
      />
    );
  });
}

function BoundedContextNodeComponent({ data, selected }: NodeProps<BoundedContextNode>) {
  const [collapsed, setCollapsed] = useState(false);
  const counts = data.handleCounts ?? { top: 1, right: 1, bottom: 1, left: 1 };

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
      {sideHandles('top', counts.top)}
      {sideHandles('right', counts.right)}
      {sideHandles('bottom', counts.bottom)}
      {sideHandles('left', counts.left)}
    </div>
  );
}

export default memo(BoundedContextNodeComponent);
