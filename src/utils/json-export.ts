import type { BoundedContextNode, RelationshipEdge } from '../types/context-map';
import schema from '../schema/context-map.schema.json';

// Bump when the on-disk shape changes in a non-backwards-compatible way.
// Kept in sync with the `version` const in context-map.schema.json.
export const CONTEXT_MAP_JSON_VERSION = 1;

// Canonical identifier of the JSON Schema this format conforms to. Emitted as
// the `$schema` field so editors (and re-imports) can validate the document.
export const CONTEXT_MAP_SCHEMA_ID = schema.$id;

export interface ContextMapJson {
  $schema: string;
  version: number;
  nodes: BoundedContextNode[];
  edges: RelationshipEdge[];
}

/**
 * Serialise the full map — node positions, edge handles, and all data — into a
 * JSON string that round-trips exactly back into the app via {@link parseJson}.
 * The document conforms to {@link CONTEXT_MAP_SCHEMA_ID}.
 */
export function generateJson(
  nodes: BoundedContextNode[],
  edges: RelationshipEdge[]
): string {
  const doc: ContextMapJson = {
    $schema: CONTEXT_MAP_SCHEMA_ID,
    version: CONTEXT_MAP_JSON_VERSION,
    nodes,
    edges,
  };
  return JSON.stringify(doc, null, 2);
}

export function downloadJson(content: string, filename = 'context-map.json') {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
