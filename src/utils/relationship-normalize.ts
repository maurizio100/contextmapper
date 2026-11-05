import { RelationshipType, type RelationshipData, type RelationshipEdge } from '../types/context-map';
import { RELATIONSHIP_META } from '../constants/relationships';

/**
 * Convert a legacy relationship shape — an upstream pattern (Open Host
 * Service, Published Language) or downstream pattern (Conformist,
 * Anticorruption Layer) stored as the main `relationshipType` — into the
 * current shape: `CustomerSupplier` plus the pattern moved onto its
 * `upstreamType`/`downstreamType` side. Current-shape data is returned
 * unchanged, so normalising is idempotent.
 */
export function normalizeRelationshipData(data: RelationshipData): RelationshipData {
  const category = RELATIONSHIP_META[data.relationshipType].category;

  if (category === 'upstream-pattern') {
    return {
      ...data,
      relationshipType: RelationshipType.CustomerSupplier,
      upstreamType: data.upstreamType ?? data.relationshipType,
    };
  }

  if (category === 'downstream-pattern') {
    return {
      ...data,
      relationshipType: RelationshipType.CustomerSupplier,
      downstreamType: data.downstreamType ?? data.relationshipType,
    };
  }

  return data;
}

/**
 * Edge-level counterpart of {@link normalizeRelationshipData}; an edge
 * without `data` passes through unchanged.
 */
export function normalizeRelationshipEdge(edge: RelationshipEdge): RelationshipEdge {
  if (!edge.data) return edge;
  return { ...edge, data: normalizeRelationshipData(edge.data) };
}
