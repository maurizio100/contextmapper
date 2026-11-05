import type { BoundedContextNode, RelationshipEdge } from '../types/context-map';
import { parseMarkdown } from '../utils/markdown-import';
import { useFileImport } from './useFileImport';

interface Options {
  replaceAll: (nodes: BoundedContextNode[], edges: RelationshipEdge[]) => void;
  hasExistingMap: boolean;
}

export function useMarkdownImport({ replaceAll, hasExistingMap }: Options) {
  const { importFile } = useFileImport({
    accept: '.md,text/markdown,text/plain',
    parse: parseMarkdown,
    replaceAll,
    hasExistingMap,
  });

  return { importMarkdown: importFile };
}
