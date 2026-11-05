import { describe, expect, it } from 'vitest';
import { generateMarkdown } from './markdown-export';
import { aBoundedContext, aRelationship } from '../test/builders';

describe('generateMarkdown', () => {
  it('renders a directional relationship with its edge data', () => {
    const billing = aBoundedContext({ data: { name: 'Billing', description: '', color: '#3b82f6' } });
    const shipping = aBoundedContext({ data: { name: 'Shipping', description: '', color: '#10b981' } });
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

    const markdown = generateMarkdown([billing, shipping], [relationship]);

    expect(markdown).toContain('Billing');
    expect(markdown).toContain('Shipping');
    expect(markdown).toContain('weekly batch sync');
    expect(markdown).toContain('- **Total Relationships:** 1');
  });

  it('skips an edge whose data is missing instead of throwing', () => {
    const billing = aBoundedContext({ data: { name: 'Billing', description: '', color: '#3b82f6' } });
    const shipping = aBoundedContext({ data: { name: 'Shipping', description: '', color: '#10b981' } });
    const relationship = aRelationship({ source: billing.id, target: shipping.id });
    const edgeWithoutData = { ...relationship, id: 'edge-no-data', data: undefined };

    expect(() => generateMarkdown([billing, shipping], [edgeWithoutData])).not.toThrow();

    const markdown = generateMarkdown([billing, shipping], [edgeWithoutData]);
    expect(markdown).toContain('_No directional relationships._');
  });
});
