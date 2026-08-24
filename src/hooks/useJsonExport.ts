import { useCallback } from 'react';
import type { BoundedContextNode, RelationshipEdge } from '../types/context-map';
import { generateJson, downloadJson } from '../utils/json-export';

export function useJsonExport(
  nodes: BoundedContextNode[],
  edges: RelationshipEdge[]
) {
  const exportJson = useCallback(() => {
    const json = generateJson(nodes, edges);
    downloadJson(json);
  }, [nodes, edges]);

  return { exportJson };
}
