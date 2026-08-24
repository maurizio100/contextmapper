import { useCallback, useMemo, useState } from 'react';
import type { BoundedContextNode, RelationshipEdge } from '../types/context-map';

/**
 * Restrict the canvas to a subset of bounded contexts so a single context and
 * its relationships can be discussed in isolation. Two ways to focus, driven by
 * the current node selection:
 *
 *  - one context selected  → show it plus its directly connected neighbours
 *  - many contexts selected → show exactly the selected set
 *
 * The underlying map (and everything that reads it — persistence, export) is
 * untouched; only the nodes/edges handed to the canvas are filtered.
 */
export function useFocusMode(
  nodes: BoundedContextNode[],
  edges: RelationshipEdge[]
) {
  const [focusedIds, setFocusedIds] = useState<Set<string> | null>(null);

  const selectedCount = useMemo(
    () => nodes.filter((n) => n.selected).length,
    [nodes]
  );

  const focusOnSelection = useCallback(() => {
    const selected = nodes.filter((n) => n.selected).map((n) => n.id);
    if (selected.length === 0) return;

    if (selected.length === 1) {
      const [id] = selected;
      const ids = new Set<string>([id]);
      for (const edge of edges) {
        if (edge.source === id) ids.add(edge.target);
        if (edge.target === id) ids.add(edge.source);
      }
      setFocusedIds(ids);
    } else {
      setFocusedIds(new Set(selected));
    }
  }, [nodes, edges]);

  const clearFocus = useCallback(() => setFocusedIds(null), []);

  const visibleNodes = useMemo(
    () => (focusedIds ? nodes.filter((n) => focusedIds.has(n.id)) : nodes),
    [nodes, focusedIds]
  );

  const visibleEdges = useMemo(() => {
    if (!focusedIds) return edges;
    return edges.filter(
      (e) => focusedIds.has(e.source) && focusedIds.has(e.target)
    );
  }, [edges, focusedIds]);

  return {
    isFocused: focusedIds !== null,
    visibleCount: visibleNodes.length,
    hiddenCount: nodes.length - visibleNodes.length,
    selectedCount,
    focusOnSelection,
    clearFocus,
    visibleNodes,
    visibleEdges,
  };
}
