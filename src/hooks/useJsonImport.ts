import type { BoundedContextNode, RelationshipEdge } from '../types/context-map';
import { parseJson } from '../utils/json-import';
import { useFileImport } from './useFileImport';

interface Options {
  replaceAll: (nodes: BoundedContextNode[], edges: RelationshipEdge[]) => void;
  hasExistingMap: boolean;
}

export function useJsonImport({ replaceAll, hasExistingMap }: Options) {
  const { importFile } = useFileImport({
    accept: '.json,application/json',
    parse: (text) => {
      try {
        return parseJson(text);
      } catch (err) {
        window.alert(
          `Could not import this file: ${
            err instanceof Error ? err.message : 'invalid JSON.'
          }`
        );
        throw err;
      }
    },
    replaceAll,
    hasExistingMap,
  });

  return { importJson: importFile };
}
