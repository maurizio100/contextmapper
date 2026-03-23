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

const STORAGE_KEY = 'context-map-data';

interface StoredData {
  nodes: BoundedContextNode[];
  edges: RelationshipEdge[];
}

function loadFromStorage(): StoredData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
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

  // Auto-save
  useEffect(() => {
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
