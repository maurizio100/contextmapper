import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { BoundedContextNode, HandleSide } from '../../types/context-map';
import { ANCHORS_PER_SIDE } from '../../utils/layout';

const SIDE_POSITION: Record<HandleSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

const SIDES: HandleSide[] = ['top', 'right', 'bottom', 'left'];

// A generous, mostly-transparent hit target makes the anchors easy to grab;
// the small coloured dot inside is the visible affordance. Growing the hit
// area (not just the dot) is what removes the "hover very precisely" problem.
const HANDLE_CLASS =
  '!w-6 !h-6 !bg-transparent !border-0 !rounded-full ' +
  'before:content-[""] before:absolute before:top-1/2 before:left-1/2 ' +
  'before:-translate-x-1/2 before:-translate-y-1/2 ' +
  'before:w-3 before:h-3 before:rounded-full ' +
  'before:bg-gray-300 before:border-2 before:border-gray-400 ' +
  'before:transition-all hover:before:w-4 hover:before:h-4 ' +
  'hover:before:bg-blue-400 hover:before:border-blue-500';

/** Anchors evenly spaced along one side: fractions (i+1)/(count+1). */
function sideHandles(side: HandleSide) {
  const horizontal = side === 'top' || side === 'bottom';
  return Array.from({ length: ANCHORS_PER_SIDE }, (_, i) => {
    const pct = ((i + 1) / (ANCHORS_PER_SIDE + 1)) * 100;
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
  // Collapsed by default: show a 3-line preview. Expanding reveals the full
  // description in place, letting the card grow to fit longer text.
  const [expanded, setExpanded] = useState(false);

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
              setExpanded((v) => !v);
            }}
            className="shrink-0 w-4 h-4 flex items-center justify-center rounded hover:bg-white/20 transition-colors cursor-pointer"
            title={expanded ? 'Show less' : 'Show full description'}
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
      {data.description && (
        <div
          className={`px-3 py-2 text-xs text-gray-600 whitespace-pre-wrap break-words ${
            expanded ? '' : 'line-clamp-3'
          }`}
        >
          {data.description}
        </div>
      )}
      {SIDES.flatMap((side) => sideHandles(side))}
    </div>
  );
}

export default memo(BoundedContextNodeComponent);
