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
} from '../types/context-map';
import { generateId } from '../utils/id-generator';
import { assignEdgeAnchors, layoutGrid, resolveDraggedNode } from '../utils/layout';

const STORAGE_KEY = 'context-map-data';

interface StoredData {
  nodes: BoundedContextNode[];
  edges: RelationshipEdge[];
}

const LEGACY_HANDLES = new Set(['top', 'right', 'bottom', 'left']);

/** Map pre-multi-anchor handle ids ("right") onto the new scheme ("right-0"). */
function migrateHandle(handle: string | null | undefined): string | undefined {
  if (!handle) return handle ?? undefined;
  return LEGACY_HANDLES.has(handle) ? `${handle}-0` : handle;
}

function loadFromStorage(): StoredData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredData;
    data.edges = data.edges?.map((e) => ({
      ...e,
      sourceHandle: migrateHandle(e.sourceHandle),
      targetHandle: migrateHandle(e.targetHandle),
    }));
    return data;
  } catch {
    return null;
  }
}

function saveToStorage(nodes: BoundedContextNode[], edges: RelationshipEdge[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
}

export function useContextMap() {
  const stored = useRef(loadFromStorage());

  const [nodes, setNodes] = useState<BoundedContextNode[]>(
    () => stored.current?.nodes ?? []
  );
  const [edges, setEdges] = useState<RelationshipEdge[]>(
    () => stored.current?.edges ?? []
  );
  const [pendingConnection, setPendingConnection] =
    useState<PendingConnection | null>(null);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // Keep the latest nodes/edges accessible to callbacks that need both at once.
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  // Auto-save + mirror the latest state into refs.
  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
    saveToStorage(nodes, edges);
  }, [nodes, edges]);

  const onNodesChange = useCallback(
    (changes: NodeChange<BoundedContextNode>[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<RelationshipEdge>[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    []
  );

  const onConnect = useCallback((connection: Connection) => {
    setPendingConnection({
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    });
  }, []);

  const onReconnect = useCallback(
    (oldEdge: RelationshipEdge, newConnection: Connection) => {
      setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
    },
    []
  );

  const addNode = useCallback(
    (data: BoundedContextData, position: { x: number; y: number }) => {
      const newNode: BoundedContextNode = {
        id: generateId(),
        type: 'boundedContext',
        position,
        data,
      };
      setNodes((nds) => [...nds, newNode]);
    },
    []
  );

  const updateNode = useCallback((id: string, data: BoundedContextData) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data } : n))
    );
  }, []);

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
      };
      setEdges((eds) => [...eds, newEdge]);
    },
    []
  );

  const updateEdge = useCallback((id: string, data: RelationshipData) => {
    setEdges((eds) =>
      eds.map((e) => (e.id === id ? { ...e, data } : e))
    );
  }, []);

  const replaceAll = useCallback(
    (newNodes: BoundedContextNode[], newEdges: RelationshipEdge[]) => {
      setNodes(newNodes);
      setEdges(newEdges);
      setPendingConnection(null);
      setEditingEdgeId(null);
      setEditingNodeId(null);
    },
    []
  );

  // Re-pack all nodes into a tidy, overlap-free grid, then spread each
  // context's edges evenly across its sides.
  const tidyLayout = useCallback(() => {
    const laidOut = layoutGrid(nodesRef.current);
    const anchored = assignEdgeAnchors(laidOut, edgesRef.current);
    setNodes(anchored.nodes);
    setEdges(anchored.edges);
  }, []);

  // After a drag, push the node clear of any it landed on top of.
  const separateNode = useCallback((nodeId: string) => {
    setNodes((nds) => {
      const dragged = nds.find((n) => n.id === nodeId);
      if (!dragged) return nds;
      const others = nds.filter((n) => n.id !== nodeId);
      const pos = resolveDraggedNode(dragged, others);
      if (pos.x === dragged.position.x && pos.y === dragged.position.y) {
        return nds;
      }
      return nds.map((n) => (n.id === nodeId ? { ...n, position: pos } : n));
    });
  }, []);

  const clearPendingConnection = useCallback(() => {
    setPendingConnection(null);
  }, []);

  const clearEditingEdge = useCallback(() => {
    setEditingEdgeId(null);
  }, []);

  const clearEditingNode = useCallback(() => {
    setEditingNodeId(null);
  }, []);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onReconnect,
    addNode,
    updateNode,
    addEdge,
    updateEdge,
    replaceAll,
    tidyLayout,
    separateNode,
    pendingConnection,
    clearPendingConnection,
    editingEdgeId,
    setEditingEdgeId,
    clearEditingEdge,
    editingNodeId,
    setEditingNodeId,
    clearEditingNode,
  };
}
