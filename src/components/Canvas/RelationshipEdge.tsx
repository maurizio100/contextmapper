import { useCallback, useRef } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import type { RelationshipData } from '../../types/context-map';
import { RELATIONSHIP_META } from '../../constants/relationships';

let lastDragEndTime = 0;

export function wasDraggingRecently(): boolean {
  return Date.now() - lastDragEndTime < 300;
}

/** Point on a quadratic bezier at parameter t */
function quadAt(
  t: number,
  p0: number,
  p1: number,
  p2: number,
): number {
  const mt = 1 - t;
  return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
}

export default function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
}: EdgeProps & { data?: RelationshipData }) {
  const { setEdges, screenToFlowPosition } = useReactFlow();
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });

  const meta = data ? RELATIONSHIP_META[data.relationshipType] : null;
  const isDirectional = meta && !meta.symmetric;

  // Control point = midpoint + user offset
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const ox = data?.controlOffset?.x ?? 0;
  const oy = data?.controlOffset?.y ?? 0;
  const ctrlX = midX + ox;
  const ctrlY = midY + oy;

  // Quadratic bezier SVG path
  const edgePath = `M ${sourceX} ${sourceY} Q ${ctrlX} ${ctrlY} ${targetX} ${targetY}`;

  // Positions along the curve
  const labelPosX = quadAt(0.5, sourceX, ctrlX, targetX);
  const labelPosY = quadAt(0.5, sourceY, ctrlY, targetY);
  const srcBadgeX = quadAt(0.2, sourceX, ctrlX, targetX);
  const srcBadgeY = quadAt(0.2, sourceY, ctrlY, targetY);
  const tgtBadgeX = quadAt(0.8, sourceX, ctrlX, targetX);
  const tgtBadgeY = quadAt(0.8, sourceY, ctrlY, targetY);

  // Arrow markers
  const markerEnd =
    isDirectional && data?.targetRole === 'downstream'
      ? 'url(#arrow-downstream)'
      : undefined;
  const markerStart =
    isDirectional && data?.sourceRole === 'downstream'
      ? 'url(#arrow-downstream-reverse)'
      : undefined;

  // --- Drag logic for the control handle ---
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      dragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      offsetStart.current = { x: ox, y: oy };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [ox, oy],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;

      // Convert start and current screen positions to flow coordinates
      const flowStart = screenToFlowPosition({
        x: dragStart.current.x,
        y: dragStart.current.y,
      });
      const flowNow = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      const dx = flowNow.x - flowStart.x;
      const dy = flowNow.y - flowStart.y;

      const newOffset = {
        x: offsetStart.current.x + dx,
        y: offsetStart.current.y + dy,
      };

      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === id
            ? { ...edge, data: { ...edge.data, controlOffset: newOffset } }
            : edge,
        ),
      );
    },
    [id, setEdges, screenToFlowPosition],
  );

  const onPointerUp = useCallback(() => {
    if (dragging.current) {
      lastDragEndTime = Date.now();
    }
    dragging.current = false;
  }, []);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3b82f6' : '#64748b',
          strokeWidth: selected ? 2.5 : 1.5,
        }}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      {meta && (
        <EdgeLabelRenderer>
          {/* Center label: relationship abbreviation */}
          <div
            className={`
              absolute pointer-events-auto cursor-pointer
              px-2 py-0.5 rounded text-xs font-bold
              border shadow-sm
              ${selected ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-white border-gray-300 text-gray-700'}
            `}
            style={{
              transform: `translate(-50%, -50%) translate(${labelPosX}px, ${labelPosY}px)`,
            }}
            data-edge-id={id}
          >
            {meta.abbreviation}
          </div>

          {/* Draggable control handle — visible on hover / when selected */}
          <div
            className={`
              absolute pointer-events-auto cursor-grab active:cursor-grabbing
              w-3 h-3 rounded-full border-2
              transition-opacity
              ${selected
                ? 'bg-blue-400 border-blue-600 opacity-100'
                : 'bg-gray-300 border-gray-400 opacity-0 hover:opacity-100'}
            `}
            style={{
              transform: `translate(-50%, -50%) translate(${ctrlX}px, ${ctrlY}px)`,
            }}
            title="Drag to bend the edge"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />

          {/* Role badges near source and target */}
          {isDirectional && data && (
            <>
              <div
                className={`
                  absolute pointer-events-none
                  px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none
                  ${data.sourceRole === 'upstream'
                    ? 'bg-blue-500 text-white'
                    : 'bg-orange-500 text-white'}
                `}
                style={{
                  transform: `translate(-50%, -50%) translate(${srcBadgeX}px, ${srcBadgeY}px)`,
                }}
              >
                {data.sourceRole === 'upstream' ? 'U' : 'D'}
              </div>
              <div
                className={`
                  absolute pointer-events-none
                  px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none
                  ${data.targetRole === 'upstream'
                    ? 'bg-blue-500 text-white'
                    : 'bg-orange-500 text-white'}
                `}
                style={{
                  transform: `translate(-50%, -50%) translate(${tgtBadgeX}px, ${tgtBadgeY}px)`,
                }}
              >
                {data.targetRole === 'upstream' ? 'U' : 'D'}
              </div>
            </>
          )}
        </EdgeLabelRenderer>
      )}
    </>
  );
}
