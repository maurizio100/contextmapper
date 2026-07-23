import type { BoundedContextNode } from '../types/context-map';

// Mirrors the sizing constraints of BoundedContextNode (min-w-[180px]
// max-w-[240px] plus a header and an optional 3-line description). Used to
// reserve enough space per node when we don't yet have a measured size.
const NODE_MIN_WIDTH = 180;
const NODE_MAX_WIDTH = 240;
const HEADER_HEIGHT = 36;
const DESCRIPTION_HEIGHT = 64; // px-3 py-2 text-xs, line-clamp-3

const NODE_GAP_X = 80;
const NODE_GAP_Y = 60;

/** Clearance kept between nodes when separating an overlapping one. */
const SEPARATION_GAP = 24;

export interface Size {
  width: number;
  height: number;
}

/** Conservative estimate of a node's footprint before it has been rendered. */
export function estimateNodeSize(node: BoundedContextNode): Size {
  const nameWidth = node.data.name.length * 8 + 48; // ~8px/char at text-sm + padding & button
  const width = Math.min(NODE_MAX_WIDTH, Math.max(NODE_MIN_WIDTH, nameWidth));
  const height = HEADER_HEIGHT + (node.data.description ? DESCRIPTION_HEIGHT : 0);
  return { width, height };
}

/** Real rendered size once React Flow has measured the node, else an estimate. */
export function getNodeSize(node: BoundedContextNode): Size {
  const w = node.measured?.width;
  const h = node.measured?.height;
  if (w && h) return { width: w, height: h };
  return estimateNodeSize(node);
}

/**
 * Arranges nodes on a grid whose row heights are driven by the tallest node in
 * each row, guaranteeing that no two bounded contexts overlap regardless of
 * their name length or description size. Returns new node objects (pure).
 */
export function layoutGrid(nodes: BoundedContextNode[]): BoundedContextNode[] {
  const total = nodes.length;
  if (total === 0) return nodes;

  const cols = Math.max(1, Math.ceil(Math.sqrt(total)));
  const sizes = nodes.map(getNodeSize);
  // A uniform column width (widest node + gap) keeps columns clear horizontally.
  const colWidth = Math.max(...sizes.map((s) => s.width)) + NODE_GAP_X;

  const result = [...nodes];
  let rowTop = 0;
  for (let row = 0; row * cols < total; row++) {
    const start = row * cols;
    const end = Math.min(start + cols, total);
    let rowHeight = 0;
    for (let i = start; i < end; i++) {
      const col = i - start;
      result[i] = { ...nodes[i], position: { x: col * colWidth, y: rowTop } };
      rowHeight = Math.max(rowHeight, sizes[i].height);
    }
    rowTop += rowHeight + NODE_GAP_Y;
  }
  return result;
}

interface Rect extends Size {
  x: number;
  y: number;
}

function overlaps(a: Rect, b: Rect, gap: number): boolean {
  return !(
    a.x + a.width + gap <= b.x ||
    b.x + b.width + gap <= a.x ||
    a.y + a.height + gap <= b.y ||
    b.y + b.height + gap <= a.y
  );
}

/**
 * Finds the closest position for `dragged` that doesn't overlap any of the
 * `others`, pushing it out along the axis of least penetration. Returns the
 * (possibly unchanged) position — callers can skip the update when it matches.
 */
export function resolveDraggedNode(
  dragged: BoundedContextNode,
  others: BoundedContextNode[],
  gap: number = SEPARATION_GAP
): { x: number; y: number } {
  const size = getNodeSize(dragged);
  const obstacles = others.map<Rect>((n) => ({
    ...getNodeSize(n),
    x: n.position.x,
    y: n.position.y,
  }));

  const pos = { x: dragged.position.x, y: dragged.position.y };

  // Iterate: separating one overlap can create another, so repeat until clear.
  for (let iter = 0; iter < 50; iter++) {
    let moved = false;
    for (const o of obstacles) {
      const a: Rect = { x: pos.x, y: pos.y, width: size.width, height: size.height };
      if (!overlaps(a, o, gap)) continue;

      const penX = Math.min(a.x + a.width + gap - o.x, o.x + o.width + gap - a.x);
      const penY = Math.min(a.y + a.height + gap - o.y, o.y + o.height + gap - a.y);
      if (penX < penY) {
        const dir = a.x + a.width / 2 < o.x + o.width / 2 ? -1 : 1;
        pos.x += dir * penX;
      } else {
        const dir = a.y + a.height / 2 < o.y + o.height / 2 ? -1 : 1;
        pos.y += dir * penY;
      }
      moved = true;
    }
    if (!moved) break;
  }

  return pos;
}
