import type {
  BoundedContextData,
  BoundedContextNode,
  RelationshipData,
  RelationshipEdge,
} from '../types/context-map';
import { RelationshipType } from '../types/context-map';
import { generateId } from '../utils/id-generator';

export function aBoundedContext(
  overrides: Partial<BoundedContextNode> = {}
): BoundedContextNode {
  const data: BoundedContextData = {
    name: 'Billing',
    description: 'Handles invoices and payments',
    color: '#3b82f6',
    ...overrides.data,
  };
  return {
    id: generateId(),
    type: 'boundedContext',
    position: { x: 0, y: 0 },
    ...overrides,
    data,
  };
}

export function aRelationship(
  overrides: Partial<RelationshipEdge> = {}
): RelationshipEdge {
  const data: RelationshipData = {
    relationshipType: RelationshipType.CustomerSupplier,
    sourceRole: 'upstream',
    targetRole: 'downstream',
    notes: '',
    ...overrides.data,
  };
  return {
    id: generateId(),
    source: generateId(),
    target: generateId(),
    type: 'relationship',
    ...overrides,
    data,
  };
}

export function aContextMap(
  overrides: { nodes?: BoundedContextNode[]; edges?: RelationshipEdge[] } = {}
): { nodes: BoundedContextNode[]; edges: RelationshipEdge[] } {
  const nodes = overrides.nodes ?? [
    aBoundedContext({ data: { name: 'Billing', description: '', color: '#3b82f6' } }),
    aBoundedContext({ data: { name: 'Shipping', description: '', color: '#10b981' } }),
  ];
  const edges =
    overrides.edges ??
    (nodes.length >= 2
      ? [
          aRelationship({
            source: nodes[0].id,
            target: nodes[1].id,
          }),
        ]
      : []);
  return { nodes, edges };
}
