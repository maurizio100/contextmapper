import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { BoundedContextNode, RelationshipEdge } from '../types/context-map';

export interface FileImportResult {
  nodes: BoundedContextNode[];
  edges: RelationshipEdge[];
  warnings: string[];
}

interface Options {
  /** `<input type="file">` accept attribute for the picked file type. */
  accept: string;
  /**
   * Parses the file's text into a result. If parsing fails, `parse` is
   * responsible for surfacing its own user-facing error (e.g. an alert) and
   * throwing; this hook aborts silently on a thrown error rather than
   * showing a generic message of its own.
   */
  parse: (text: string) => FileImportResult;
  replaceAll: (nodes: BoundedContextNode[], edges: RelationshipEdge[]) => void;
  hasExistingMap: boolean;
}

/**
 * Shared file-import flow: pick a file, confirm replacing the current map,
 * parse it, alert on an empty result, replace the map, fit it into view, and
 * alert on any warnings. `useJsonImport` and `useMarkdownImport` are thin
 * wrappers over this hook, differing only in accepted file type and parser.
 */
export function useFileImport({ accept, parse, replaceAll, hasExistingMap }: Options) {
  const { fitView } = useReactFlow();

  const importFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;

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

      let result: FileImportResult;
      try {
        result = parse(text);
      } catch {
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
  }, [accept, parse, replaceAll, hasExistingMap, fitView]);

  return { importFile };
}
