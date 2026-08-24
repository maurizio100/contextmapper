import dagre from '@dagrejs/dagre';
import type {
  BoundedContextNode,
  HandleSide,
  RelationshipEdge,
} from '../types/context-map';

/** Fixed number of connection anchors rendered on every side of a context. */
export const ANCHORS_PER_SIDE = 3;

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

/**
 * Direction an edge implies for ranking: from the upstream context to the
 * downstream one. Symmetric relationships (Partnership, Shared Kernel, …) carry
 * no direction, so we keep the source→target order purely as a connectivity
 * link. Downstream-as-source edges are flipped so upstream still ranks higher.
 */
function edgeDirection(e: RelationshipEdge): { from: string; to: string } {
  if (e.data?.sourceRole === 'downstream') {
    return { from: e.target, to: e.source };
  }
  return { from: e.source, to: e.target };
}

/**
 * Arranges nodes with dagre's layered algorithm: connected contexts sit near
 * each other, upstream contexts rank above their downstream counterparts, and
 * the crossing-minimisation heuristic keeps edges from spanning the whole map.
 * Falls back to the plain grid when there are no edges to rank by. Pure.
 */
export function layoutDirected(
  nodes: BoundedContextNode[],
  edges: RelationshipEdge[]
): BoundedContextNode[] {
  if (nodes.length === 0) return nodes;
  if (edges.length === 0) return layoutGrid(nodes);

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: NODE_GAP_X, ranksep: NODE_GAP_Y });
  g.setDefaultEdgeLabel(() => ({}));

  const known = new Set(nodes.map((n) => n.id));
  for (const n of nodes) {
    const { width, height } = getNodeSize(n);
    g.setNode(n.id, { width, height });
  }
  for (const e of edges) {
    const { from, to } = edgeDirection(e);
    if (known.has(from) && known.has(to)) g.setEdge(from, to);
  }

  dagre.layout(g);

  // dagre reports node centres; React Flow positions are top-left corners.
  return nodes.map((n) => {
    const laid = g.node(n.id);
    if (!laid) return n;
    return {
      ...n,
      position: { x: laid.x - laid.width / 2, y: laid.y - laid.height / 2 },
    };
  });
}

interface Point {
  x: number;
  y: number;
}

function nodeCenter(node: BoundedContextNode, size: Size): Point {
  return {
    x: node.position.x + size.width / 2,
    y: node.position.y + size.height / 2,
  };
}

/** Which side of the node at `from` points towards `to`. */
function facingSide(from: Point, to: Point): HandleSide {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'bottom' : 'top';
}

/** Handle id for the i-th anchor on a side, e.g. "right-0". */
export function handleId(side: HandleSide, index: number): string {
  return `${side}-${index}`;
}

interface Endpoint {
  edgeId: string;
  role: 'source' | 'target';
  /** Coordinate along the side used to order anchors and reduce crossings. */
  cross: number;
}

/**
 * Maps the i-th of `n` endpoints sharing a side onto one of the fixed anchor
 * slots (0…ANCHORS_PER_SIDE-1). A lone edge takes the centre slot; several
 * spread from the first slot to the last. When more edges share a side than
 * there are slots, some slots carry more than one edge.
 */
function slotFor(i: number, n: number): number {
  if (n <= 1) return Math.floor(ANCHORS_PER_SIDE / 2);
  const slot = Math.round((i * (ANCHORS_PER_SIDE - 1)) / (n - 1));
  return Math.min(ANCHORS_PER_SIDE - 1, Math.max(0, slot));
}

/**
 * Assigns each edge a source/target anchor so that edges leave a context from
 * the side facing their counterpart and, when several share a side, spread out
 * across the fixed anchors on that side. Nodes always expose ANCHORS_PER_SIDE
 * anchors per side, so this only rewrites edge handles — nodes pass through
 * unchanged. Returns new edge objects (carrying sourceHandle/targetHandle). Pure.
 */
export function assignEdgeAnchors(
  nodes: BoundedContextNode[],
  edges: RelationshipEdge[]
): { nodes: BoundedContextNode[]; edges: RelationshipEdge[] } {
  if (nodes.length === 0) return { nodes, edges };

  const centers = new Map<string, Point>();
  for (const n of nodes) centers.set(n.id, nodeCenter(n, getNodeSize(n)));

  // Group every edge endpoint by the (node, side) it should attach to.
  const groups = new Map<string, Endpoint[]>();
  const groupKey = (nodeId: string, side: HandleSide) => `${nodeId}|${side}`;
  const add = (nodeId: string, side: HandleSide, ep: Endpoint) => {
    const key = groupKey(nodeId, side);
    const list = groups.get(key);
    if (list) list.push(ep);
    else groups.set(key, [ep]);
  };

  for (const e of edges) {
    const sc = centers.get(e.source);
    const tc = centers.get(e.target);
    if (!sc || !tc) continue;
    const sSide = facingSide(sc, tc);
    const tSide = facingSide(tc, sc);
    const sCross = sSide === 'top' || sSide === 'bottom' ? tc.x : tc.y;
    const tCross = tSide === 'top' || tSide === 'bottom' ? sc.x : sc.y;
    add(e.source, sSide, { edgeId: e.id, role: 'source', cross: sCross });
    add(e.target, tSide, { edgeId: e.id, role: 'target', cross: tCross });
  }

  // Within each side, order endpoints and snap them onto the fixed anchor slots.
  const handles = new Map<string, { source?: string; target?: string }>();

  for (const [key, eps] of groups) {
    const sep = key.lastIndexOf('|');
    const side = key.slice(sep + 1) as HandleSide;

    eps.sort((a, b) => a.cross - b.cross);

    eps.forEach((ep, i) => {
      const id = handleId(side, slotFor(i, eps.length));
      const h = handles.get(ep.edgeId) ?? {};
      if (ep.role === 'source') h.source = id;
      else h.target = id;
      handles.set(ep.edgeId, h);
    });
  }

  const newEdges = edges.map((e) => {
    const h = handles.get(e.id);
    if (!h) return e;
    return { ...e, sourceHandle: h.source, targetHandle: h.target };
  });

  return { nodes, edges: newEdges };
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
