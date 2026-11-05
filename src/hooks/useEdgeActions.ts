import { createContext, useContext } from 'react';
import type { ControlOffset } from '../types/context-map';

export interface EdgeActions {
  bendEdge: (id: string, offset: ControlOffset) => void;
}

/**
 * Carries the map's mutation functions down to custom React Flow edge
 * renderers, which only receive `EdgeProps` — never via node/edge `data`
 * (see guidelines/architecture.md, State).
 */
export const EdgeActionsContext = createContext<EdgeActions | null>(null);

export function useEdgeActions(): EdgeActions {
  const ctx = useContext(EdgeActionsContext);
  if (!ctx) {
    throw new Error('useEdgeActions must be used within an EdgeActionsContext.Provider');
  }
  return ctx;
}
