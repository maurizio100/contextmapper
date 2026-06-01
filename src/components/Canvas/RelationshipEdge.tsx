import { useCallback, useRef } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import type { Clarity, RelationshipData, RelationshipType } from '../../types/context-map';
import { RELATIONSHIP_META } from '../../constants/relationships';

const CLARITY_STROKE: Record<string, { normal: string; selected: string }> = {
  clear:              { normal: '#22c55e', selected: '#15803d' },
  unsure:             { normal: '#3b82f6', selected: '#1d4ed8' },
  'needs-improvement': { normal: '#ef4444', selected: '#b91c1c' },
  none:               { normal: '#64748b', selected: '#3b82f6' },
};

function strokeColor(clarity: Clarity | undefined, selected: boolean | undefined): string {
  const key = clarity ?? 'none';
  const colors = CLARITY_STROKE[key] ?? CLARITY_STROKE.none;
  return selected ? colors.selected : colors.normal;
}

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

  // Resolve which badges to render
  // Backward compat: old edges may store OHS/CF/ACL as the main relationshipType
  const resolvedUpstreamType: RelationshipType | null = (() => {
    if (!data || !isDirectional) return null;
    if (data.upstreamType) return data.upstreamType;
    const mainCat = RELATIONSHIP_META[data.relationshipType].category;
    return mainCat === 'upstream-pattern' ? data.relationshipType : null;
  })();
  const resolvedDownstreamType: RelationshipType | null = (() => {
    if (!data || !isDirectional) return null;
    if (data.downstreamType) return data.downstreamType;
    const mainCat = RELATIONSHIP_META[data.relationshipType].category;
    return mainCat === 'downstream-pattern' ? data.relationshipType : null;
  })();
  // Show the base badge (CS) in center only when no side patterns are set
  const showCenterBase =
    isDirectional && !resolvedUpstreamType && !resolvedDownstreamType;

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
  const upstreamT = data?.sourceRole === 'upstream' ? 0.12 : 0.88;
  const downstreamT = data?.sourceRole === 'downstream' ? 0.12 : 0.88;
  const upstreamBadgeX = quadAt(upstreamT, sourceX, ctrlX, targetX);
  const upstreamBadgeY = quadAt(upstreamT, sourceY, ctrlY, targetY);
  const downstreamBadgeX = quadAt(downstreamT, sourceX, ctrlX, targetX);
  const downstreamBadgeY = quadAt(downstreamT, sourceY, ctrlY, targetY);
  const srcBadgeX = quadAt(0.25, sourceX, ctrlX, targetX);
  const srcBadgeY = quadAt(0.25, sourceY, ctrlY, targetY);
  const tgtBadgeX = quadAt(0.75, sourceX, ctrlX, targetX);
  const tgtBadgeY = quadAt(0.75, sourceY, ctrlY, targetY);
  // Symmetric / base-only center
  const centerX = quadAt(0.5, sourceX, ctrlX, targetX);
  const centerY = quadAt(0.5, sourceY, ctrlY, targetY);

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
          stroke: strokeColor(data?.clarity, selected),
          strokeWidth: selected ? 2.5 : 1.5,
        }}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      {meta && (
        <EdgeLabelRenderer>
          {/* Symmetric / base-only: single center badge */}
          {(meta.symmetric || showCenterBase) && (
            <div
              className={`
                absolute pointer-events-auto cursor-pointer
                px-2 py-0.5 rounded text-xs font-bold
                border shadow-sm
                ${selected ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-white border-gray-300 text-gray-700'}
              `}
              style={{ transform: `translate(-50%, -50%) translate(${centerX}px, ${centerY}px)` }}
              data-edge-id={id}
            >
              {meta.abbreviation}
            </div>
          )}

          {/* Upstream pattern badge — near upstream node */}
          {resolvedUpstreamType && (
            <div
              className={`
                absolute pointer-events-auto cursor-pointer
                px-2 py-0.5 rounded text-xs font-bold
                border shadow-sm
                ${selected ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-blue-50 border-blue-300 text-blue-700'}
              `}
              style={{ transform: `translate(-50%, -50%) translate(${upstreamBadgeX}px, ${upstreamBadgeY}px)` }}
              data-edge-id={id}
            >
              {RELATIONSHIP_META[resolvedUpstreamType].abbreviation}
            </div>
          )}

          {/* Downstream pattern badge — near downstream node */}
          {resolvedDownstreamType && (
            <div
              className={`
                absolute pointer-events-auto cursor-pointer
                px-2 py-0.5 rounded text-xs font-bold
                border shadow-sm
                ${selected ? 'bg-orange-100 border-orange-500 text-orange-800' : 'bg-orange-50 border-orange-300 text-orange-700'}
              `}
              style={{ transform: `translate(-50%, -50%) translate(${downstreamBadgeX}px, ${downstreamBadgeY}px)` }}
              data-edge-id={id}
            >
              {RELATIONSHIP_META[resolvedDownstreamType].abbreviation}
            </div>
          )}

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

          {/* Role badges (U/D) near source and target */}
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
