import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { BoundedContextNode, RelationshipEdge } from '../types/context-map';
import { parseJson } from '../utils/json-import';

interface Options {
  replaceAll: (nodes: BoundedContextNode[], edges: RelationshipEdge[]) => void;
  hasExistingMap: boolean;
}

export function useJsonImport({ replaceAll, hasExistingMap }: Options) {
  const { fitView } = useReactFlow();

  const importJson = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      if (
        hasExistingMap &&
        !window.confirm(
          'Importing will replace the current context map. Continue?'
        )
      ) {
        return;
      }

      const text = await file.text();

      let result;
      try {
        result = parseJson(text);
      } catch (err) {
        window.alert(
          `Could not import this file: ${
            err instanceof Error ? err.message : 'invalid JSON.'
          }`
        );
        return;
      }

      if (result.nodes.length === 0 && result.edges.length === 0) {
        window.alert(
          'No bounded contexts or relationships were found in this file.'
        );
        return;
      }

      replaceAll(result.nodes, result.edges);

      // Fit the restored content into view after the next render.
      requestAnimationFrame(() => {
        fitView({ padding: 0.2 });
      });

      if (result.warnings.length > 0) {
        window.alert(
          `Imported with warnings:\n\n- ${result.warnings.join('\n- ')}`
        );
      }
    };

    input.click();
  }, [replaceAll, hasExistingMap, fitView]);

  return { importJson };
}
