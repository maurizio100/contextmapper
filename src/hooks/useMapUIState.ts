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
 * Scaffold: fields and setters have the right shape but don't yet hold
 * state — wiring them to useState (and resetAll clearing all three) is the
 * implementor's work.
 */
export function useMapUIState(): MapUIState {
  return {
    pendingConnection: null,
    setPendingConnection: () => {},
    clearPendingConnection: () => {},
    editingEdgeId: null,
    setEditingEdgeId: () => {},
    clearEditingEdge: () => {},
    editingNodeId: null,
    setEditingNodeId: () => {},
    clearEditingNode: () => {},
    resetAll: () => {},
  };
}
