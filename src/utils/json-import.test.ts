import { describe, expect, it } from 'vitest';
import { generateJson } from './json-export';
import { parseJson } from './json-import';
import { aBoundedContext, aRelationship } from '../test/builders';
import { RelationshipType } from '../types/context-map';

describe('JSON import legacy relationship normalisation', () => {
  it('normalises legacy relationship types on import', () => {
    const billing = aBoundedContext({
      data: { name: 'Billing', description: '', color: '#3b82f6' },
    });
    const shipping = aBoundedContext({
      data: { name: 'Shipping', description: '', color: '#10b981' },
    });
    const legacy = aRelationship({
      source: billing.id,
      target: shipping.id,
      data: {
        relationshipType: RelationshipType.AnticorruptionLayer,
        sourceRole: 'upstream',
        targetRole: 'downstream',
        notes: 'legacy ACL edge',
      },
    });

    const json = generateJson([billing, shipping], [legacy]);
    const result = parseJson(json);

    expect(result.warnings).toEqual([]);
    expect(result.edges).toHaveLength(1);
    const importedEdge = result.edges[0];
    expect(importedEdge.data?.relationshipType).toBe(RelationshipType.CustomerSupplier);
    expect(importedEdge.data?.downstreamType).toBe(RelationshipType.AnticorruptionLayer);
  });
});
