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

describe('JSON import domain classification', () => {
  const build = (extra: Record<string, unknown>) => {
    const node = aBoundedContext({
      data: { name: 'Billing', description: '', color: '#3b82f6' },
    });
    const doc = JSON.parse(generateJson([node], []));
    Object.assign(doc.nodes[0].data, extra);
    return JSON.stringify(doc);
  };

  it('accepts a node without a classification', () => {
    const result = parseJson(build({}));
    expect(result.warnings).toEqual([]);
    expect(result.nodes[0].data.domainClassification).toBeUndefined();
  });

  it('keeps a valid classification', () => {
    const result = parseJson(build({ domainClassification: 'core' }));
    expect(result.nodes[0].data.domainClassification).toBe('core');
  });

  it('skips a node with an invalid classification and warns', () => {
    const result = parseJson(build({ domainClassification: 'vital' }));
    expect(result.nodes).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });
});

describe('parseJson owning team', () => {
  const build = (extra: Record<string, unknown>) => {
    const node = aBoundedContext({ data: { name: 'Billing', description: '', color: '#3b82f6' } });
    const doc = JSON.parse(generateJson([node], []));
    Object.assign(doc.nodes[0].data, extra);
    return JSON.stringify(doc);
  };

  it('accepts a node without an owning team', () => {
    const result = parseJson(build({}));
    expect(result.warnings).toEqual([]);
    expect(result.nodes[0].data.owningTeam).toBeUndefined();
  });

  it('keeps a string owning team', () => {
    expect(parseJson(build({ owningTeam: 'Team Payments' })).nodes[0].data.owningTeam).toBe('Team Payments');
  });

  it('skips a node with a non-string owning team and warns', () => {
    const result = parseJson(build({ owningTeam: 5 }));
    expect(result.nodes).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });

  it('accepts a node without canvas fields', () => {
    const result = parseJson(build({}));
    expect(result.warnings).toEqual([]);
    expect(result.nodes[0].data.purpose).toBeUndefined();
  });

  it('skips a node with a non-string purpose and warns', () => {
    const result = parseJson(build({ purpose: 5 }));
    expect(result.nodes).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });
});

describe('parseJson external system', () => {
  const build = (extra: Record<string, unknown>) => {
    const node = aBoundedContext({ data: { name: 'Billing', description: '', color: '#3b82f6' } });
    const doc = JSON.parse(generateJson([node], []));
    Object.assign(doc.nodes[0].data, extra);
    return JSON.stringify(doc);
  };

  it('keeps external: true', () => {
    const result = parseJson(build({ external: true }));
    expect(result.warnings).toEqual([]);
    expect(result.nodes[0].data.external).toBe(true);
  });

  it('skips a node with a non-boolean external and warns', () => {
    const result = parseJson(build({ external: 'yes' }));
    expect(result.nodes).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });
});
