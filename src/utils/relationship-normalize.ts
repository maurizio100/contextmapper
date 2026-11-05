import type { RelationshipData, RelationshipEdge } from '../types/context-map';

/**
 * Convert a legacy relationship shape — an upstream pattern (Open Host
 * Service, Published Language) or downstream pattern (Conformist,
 * Anticorruption Layer) stored as the main `relationshipType` — into the
 * current shape: `CustomerSupplier` plus the pattern moved onto its
 * `upstreamType`/`downstreamType` side. Current-shape data is returned
 * unchanged, so normalising is idempotent.
 */
export function normalizeRelationshipData(data: RelationshipData): RelationshipData {
  return data;
}

/**
 * Edge-level counterpart of {@link normalizeRelationshipData}; an edge
 * without `data` passes through unchanged.
 */
export function normalizeRelationshipEdge(edge: RelationshipEdge): RelationshipEdge {
  return edge;
}
