import { describe, expect, it } from 'vitest';
import { generateJson } from './json-export';
import { parseJson } from './json-import';
import { aBoundedContext, aRelationship } from '../test/builders';

describe('JSON export/import round-trip', () => {
  it('preserves nodes, edges, ids and positions', () => {
    const billing = aBoundedContext({
      data: { name: 'Billing', description: 'Handles invoices', color: '#3b82f6' },
      position: { x: 120, y: 40 },
    });
    const shipping = aBoundedContext({
      data: { name: 'Shipping', description: '', color: '#10b981' },
      position: { x: 360, y: 200 },
    });
    const relationship = aRelationship({
      source: billing.id,
      target: shipping.id,
      data: {
        relationshipType: 'CustomerSupplier',
        sourceRole: 'upstream',
        targetRole: 'downstream',
        notes: 'weekly batch sync',
        clarity: 'clear',
      },
    });

    const json = generateJson([billing, shipping], [relationship]);
    const result = parseJson(json);

    expect(result.warnings).toEqual([]);
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);

    const importedBilling = result.nodes.find((n) => n.id === billing.id);
    const importedShipping = result.nodes.find((n) => n.id === shipping.id);
    expect(importedBilling?.position).toEqual({ x: 120, y: 40 });
    expect(importedShipping?.position).toEqual({ x: 360, y: 200 });
    expect(importedBilling?.data.name).toBe('Billing');
    expect(importedShipping?.data.name).toBe('Shipping');

    const importedEdge = result.edges[0];
    expect(importedEdge.id).toBe(relationship.id);
    expect(importedEdge.source).toBe(billing.id);
    expect(importedEdge.target).toBe(shipping.id);
    expect(importedEdge.data?.notes).toBe('weekly batch sync');
    expect(importedEdge.data?.clarity).toBe('clear');
  });
});
