import { useCallback, useState } from 'react';
import type { PendingConnection } from '../types/context-map';

export interface MapUIState {
  pendingConnection: PendingConnection | null;
  setPendingConnection: (connection: PendingConnection | null) => void;
  clearPendingConnection: () => void;
  editingEdgeId: string | null;
  setEditingEdgeId: (id: string | null) => void;
  clearEditingEdge: () => void;
  editingNodeId: string | null;
  setEditingNodeId: (id: string | null) => void;
  clearEditingNode: () => void;
  resetAll: () => void;
}

/**
 * The element being connected/edited — separate from the map itself
 * (guidelines/architecture.md, State: map state and UI state are separate).
 */
export function useMapUIState(): MapUIState {
  const [pendingConnection, setPendingConnection] =
    useState<PendingConnection | null>(null);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const clearPendingConnection = useCallback(() => {
    setPendingConnection(null);
  }, []);

  const clearEditingEdge = useCallback(() => {
    setEditingEdgeId(null);
  }, []);

  const clearEditingNode = useCallback(() => {
    setEditingNodeId(null);
  }, []);

  const resetAll = useCallback(() => {
    setPendingConnection(null);
    setEditingEdgeId(null);
    setEditingNodeId(null);
  }, []);

  return {
    pendingConnection,
    setPendingConnection,
    clearPendingConnection,
    editingEdgeId,
    setEditingEdgeId,
    clearEditingEdge,
    editingNodeId,
    setEditingNodeId,
    clearEditingNode,
    resetAll,
  };
}
