import { useCallback } from 'react';
import type { BoundedContextNode, RelationshipEdge } from '../types/context-map';
import { generateMarkdown, downloadMarkdown } from '../utils/markdown-export';

export function useMarkdownExport(
  nodes: BoundedContextNode[],
  edges: RelationshipEdge[]
) {
  const exportMarkdown = useCallback(() => {
    const md = generateMarkdown(nodes, edges);
    downloadMarkdown(md);
  }, [nodes, edges]);

  return { exportMarkdown };
}
