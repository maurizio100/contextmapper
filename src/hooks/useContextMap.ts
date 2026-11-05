import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type Connection,
  type EdgeChange,
  type NodeChange,
  applyNodeChanges,
  applyEdgeChanges,
  reconnectEdge,
} from '@xyflow/react';
import type {
  BoundedContextNode,
  RelationshipEdge,
  BoundedContextData,
  RelationshipData,
  PendingConnection,
  ControlOffset,
} from '../types/context-map';
import { generateId } from '../utils/id-generator';
import {
  ANCHORS_PER_SIDE,
  assignEdgeAnchors,
  layoutDirected,
  resolveDraggedNode,
} from '../utils/layout';
import { normalizeRelationshipEdge } from '../utils/relationship-normalize';

const STORAGE_KEY = 'context-map-data';

interface StoredData {
  nodes: BoundedContextNode[];
  edges: RelationshipEdge[];
}

const HISTORY_LIMIT = 100;

interface Snapshot {
  nodes: BoundedContextNode[];
  edges: RelationshipEdge[];
}

const LEGACY_HANDLES = new Set(['top', 'right', 'bottom', 'left']);
const ANCHOR_HANDLE = /^(top|right|bottom|left)-(\d+)$/;

/**
 * Normalise stored handle ids onto the current fixed-anchor scheme: map
 * pre-multi-anchor ids ("right" → "right-0") and clamp any anchor index left
 * over from the old dynamic scheme into the fixed range (e.g. "right-4" →
 * "right-2"), so edges never point at an anchor the node no longer renders.
 */
function migrateHandle(handle: string | null | undefined): string | undefined {
  if (!handle) return handle ?? undefined;
  if (LEGACY_HANDLES.has(handle)) return `${handle}-0`;
  const m = ANCHOR_HANDLE.exec(handle);
  if (m) {
    const idx = Math.min(ANCHORS_PER_SIDE - 1, Number(m[2]));
    return `${m[1]}-${idx}`;
  }
  return handle;
}

function loadFromStorage(): StoredData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredData;
    data.edges = data.edges?.map((e) =>
      normalizeRelationshipEdge({
        ...e,
        sourceHandle: migrateHandle(e.sourceHandle),
        targetHandle: migrateHandle(e.targetHandle),
      })
    );
    return data;
  } catch {
    return null;
  }
}

function saveToStorage(nodes: BoundedContextNode[], edges: RelationshipEdge[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
}

export function useContextMap() {
  const [nodes, setNodes] = useState<BoundedContextNode[]>(
    () => loadFromStorage()?.nodes ?? []
  );
  const [edges, setEdges] = useState<RelationshipEdge[]>(
    () => loadFromStorage()?.edges ?? []
  );

  // Latest nodes/edges, updated synchronously on every change so history
  // snapshots and multi-call ticks never read stale state.
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  const applyNodes = useCallback(
    (fn: (nds: BoundedContextNode[]) => BoundedContextNode[]) => {
      nodesRef.current = fn(nodesRef.current);
      setNodes(nodesRef.current);
    },
    []
  );
  const applyEdges = useCallback(
    (fn: (eds: RelationshipEdge[]) => RelationshipEdge[]) => {
      edgesRef.current = fn(edgesRef.current);
      setEdges(edgesRef.current);
    },
    []
  );

  // Auto-save.
  useEffect(() => {
    saveToStorage(nodes, edges);
  }, [nodes, edges]);

  // --- Undo/redo history (in memory only) ---
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const lastKey = useRef<string | null>(null);
  const tickOpen = useRef(false);
  const dragCheckpointed = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncAvailability = () => {
    setCanUndo(past.current.length > 0);
    setCanRedo(future.current.length > 0);
  };

  // Record the current map before an undoable change. Calls in the same tick
  // and consecutive calls with the same key form one step.
  const checkpoint = useCallback((key?: string) => {
    const merge = tickOpen.current || (key !== undefined && key === lastKey.current);
    lastKey.current = key ?? null;
    if (!tickOpen.current) {
      tickOpen.current = true;
      queueMicrotask(() => {
        tickOpen.current = false;
      });
    }
    if (merge) return;
    past.current.push({ nodes: nodesRef.current, edges: edgesRef.current });
    if (past.current.length > HISTORY_LIMIT) past.current.shift();
    future.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const restore = useCallback((snapshot: Snapshot) => {
    applyNodes(() => snapshot.nodes.map((n) => ({ ...n, selected: false })));
    applyEdges(() => snapshot.edges.map((e) => ({ ...e, selected: false })));
  }, [applyNodes, applyEdges]);

  const undo = useCallback(() => {
    const snapshot = past.current.pop();
    if (!snapshot) return;
    future.current.push({ nodes: nodesRef.current, edges: edgesRef.current });
    lastKey.current = null;
    restore(snapshot);
    syncAvailability();
  }, [restore]);

  const redo = useCallback(() => {
    const snapshot = future.current.pop();
    if (!snapshot) return;
    past.current.push({ nodes: nodesRef.current, edges: edgesRef.current });
    lastKey.current = null;
    restore(snapshot);
    syncAvailability();
  }, [restore]);

  const onNodesChange = useCallback(
    (changes: NodeChange<BoundedContextNode>[]) => {
      for (const c of changes) {
        if (c.type === 'remove') {
          checkpoint();
        } else if (c.type === 'position') {
          if (c.dragging === true && !dragCheckpointed.current) {
            dragCheckpointed.current = true;
            checkpoint();
          } else if (c.dragging === false) {
            dragCheckpointed.current = false;
          }
        }
      }
      applyNodes((nds) => applyNodeChanges(changes, nds));
    },
    [applyNodes, checkpoint]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<RelationshipEdge>[]) => {
      if (changes.some((c) => c.type === 'remove')) checkpoint();
      applyEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [applyEdges, checkpoint]
  );

  const onReconnect = useCallback(
    (oldEdge: RelationshipEdge, newConnection: Connection) => {
      checkpoint();
      applyEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
    },
    [applyEdges, checkpoint]
  );

  const addNode = useCallback(
    (data: BoundedContextData, position: { x: number; y: number }) => {
      const newNode: BoundedContextNode = {
        id: generateId(),
        type: 'boundedContext',
        position,
        data,
        selected: true,
      };
      checkpoint();
      applyNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), newNode]);
      applyEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
    },
    [applyNodes, applyEdges, checkpoint]
  );

  const updateNode = useCallback(
    (id: string, data: BoundedContextData) => {
      checkpoint('node:' + id);
      applyNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data } : n)));
    },
    [applyNodes, checkpoint]
  );

  const addEdge = useCallback(
    (conn: PendingConnection, data: RelationshipData) => {
      const newEdge: RelationshipEdge = {
        id: generateId(),
        source: conn.source,
        target: conn.target,
        sourceHandle: conn.sourceHandle ?? undefined,
        targetHandle: conn.targetHandle ?? undefined,
        type: 'relationship',
        data,
        selected: true,
      };
      checkpoint();
      applyNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
      applyEdges((eds) => [...eds.map((e) => ({ ...e, selected: false })), newEdge]);
    },
    [applyNodes, applyEdges, checkpoint]
  );

  const updateEdge = useCallback(
    (id: string, data: RelationshipData) => {
      checkpoint('edge:' + id);
      applyEdges((eds) => eds.map((e) => (e.id === id ? { ...e, data } : e)));
    },
    [applyEdges, checkpoint]
  );

  const replaceAll = useCallback(
    (newNodes: BoundedContextNode[], newEdges: RelationshipEdge[]) => {
      checkpoint();
      applyNodes(() => newNodes);
      applyEdges(() => newEdges);
    },
    [applyNodes, applyEdges, checkpoint]
  );

  // Re-pack nodes with a connectivity-aware layered layout (connected contexts
  // sit close, upstream above downstream), then spread each context's edges
  // evenly across its sides.
  const tidyLayout = useCallback(() => {
    const laidOut = layoutDirected(nodesRef.current, edgesRef.current);
    const anchored = assignEdgeAnchors(laidOut, edgesRef.current);
    checkpoint();
    applyNodes(() => anchored.nodes);
    applyEdges(() => anchored.edges);
  }, [applyNodes, applyEdges, checkpoint]);

  // After a drag, push the node clear of any it landed on top of. Not a
  // checkpoint of its own: it belongs to the drag that preceded it.
  const separateNode = useCallback(
    (nodeId: string) => {
      applyNodes((nds) => {
        const dragged = nds.find((n) => n.id === nodeId);
        if (!dragged) return nds;
        const others = nds.filter((n) => n.id !== nodeId);
        const pos = resolveDraggedNode(dragged, others);
        if (pos.x === dragged.position.x && pos.y === dragged.position.y) {
          return nds;
        }
        return nds.map((n) => (n.id === nodeId ? { ...n, position: pos } : n));
      });
    },
    [applyNodes]
  );

  const bendEdge = useCallback(
    (id: string, offset: ControlOffset) => {
      // Called once per bend gesture (on release), so each gesture is its own step.
      checkpoint();
      applyEdges((eds) =>
        eds.map((e) =>
          e.id === id && e.data ? { ...e, data: { ...e.data, controlOffset: offset } } : e
        )
      );
    },
    [applyEdges, checkpoint]
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onReconnect,
    addNode,
    updateNode,
    addEdge,
    updateEdge,
    replaceAll,
    tidyLayout,
    separateNode,
    bendEdge,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
