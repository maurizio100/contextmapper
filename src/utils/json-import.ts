import Ajv2020, { type ErrorObject } from 'ajv/dist/2020';
import type {
  BoundedContextNode,
  RelationshipEdge,
} from '../types/context-map';
import schema from '../schema/context-map.schema.json';
import { CONTEXT_MAP_JSON_VERSION } from './json-export';

export interface JsonImportResult {
  nodes: BoundedContextNode[];
  edges: RelationshipEdge[];
  warnings: string[];
}

// Compile validators once from the canonical JSON Schema. Nodes and edges are
// validated individually against their `$defs` so a single malformed entry is
// skipped with a warning rather than rejecting the whole file.
const ajv = new Ajv2020({ allErrors: true, strict: false });
ajv.addSchema(schema);
const validateNode = ajv.getSchema(`${schema.$id}#/$defs/node`)!;
const validateEdge = ajv.getSchema(`${schema.$id}#/$defs/edge`)!;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function summarize(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) return 'invalid shape';
  return errors
    .map((e) => `${e.instancePath || 'root'} ${e.message}`)
    .join('; ');
}

/**
 * Parse a JSON document produced by {@link generateJson} back into nodes and
 * edges, validating against the Context Map JSON Schema. Throws on malformed
 * JSON or an unrecognisable shape; drops individual nodes/edges that fail schema
 * validation (or reference a missing context) and reports them as warnings.
 */
export function parseJson(text: string): JsonImportResult {
  const parsed = JSON.parse(text) as unknown;

  if (!isRecord(parsed) || !Array.isArray(parsed.nodes)) {
    throw new Error('Not a valid context map file.');
  }

  const warnings: string[] = [];

  if (
    typeof parsed.version === 'number' &&
    parsed.version > CONTEXT_MAP_JSON_VERSION
  ) {
    warnings.push(
      `File uses a newer format (version ${parsed.version}); some data may not import correctly.`
    );
  }

  const nodes: BoundedContextNode[] = [];
  parsed.nodes.forEach((raw, i) => {
    if (validateNode(raw)) {
      nodes.push({ ...(raw as object), type: 'boundedContext' } as BoundedContextNode);
    } else {
      warnings.push(`Skipped context #${i + 1}: ${summarize(validateNode.errors)}.`);
    }
  });

  const nodeIds = new Set(nodes.map((n) => n.id));

  const rawEdges = Array.isArray(parsed.edges) ? parsed.edges : [];
  const edges: RelationshipEdge[] = [];
  rawEdges.forEach((raw, i) => {
    if (!validateEdge(raw)) {
      warnings.push(`Skipped relationship #${i + 1}: ${summarize(validateEdge.errors)}.`);
      return;
    }
    const edge = raw as RelationshipEdge;
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      warnings.push(
        `Skipped relationship #${i + 1}: references a context that no longer exists.`
      );
      return;
    }
    edges.push({ ...(raw as object), type: 'relationship' } as RelationshipEdge);
  });

  return { nodes, edges, warnings };
}
