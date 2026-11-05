import { describe, expect, it } from 'vitest';
import {
  normalizeRelationshipData,
  normalizeRelationshipEdge,
} from './relationship-normalize';
import { RelationshipType } from '../types/context-map';
import { aRelationship } from '../test/builders';

describe('normalizeRelationshipData', () => {
  it('moves an upstream pattern to the upstream side', () => {
    const result = normalizeRelationshipData({
      relationshipType: RelationshipType.OpenHostService,
      sourceRole: 'upstream',
      targetRole: 'downstream',
      notes: 'legacy OHS edge',
      clarity: 'clear',
    });

    expect(result.relationshipType).toBe(RelationshipType.CustomerSupplier);
    expect(result.upstreamType).toBe(RelationshipType.OpenHostService);
    expect(result.downstreamType ?? null).toBeNull();
    expect(result.sourceRole).toBe('upstream');
    expect(result.targetRole).toBe('downstream');
    expect(result.notes).toBe('legacy OHS edge');
    expect(result.clarity).toBe('clear');
  });

  it('moves a downstream pattern to the downstream side', () => {
    const result = normalizeRelationshipData({
      relationshipType: RelationshipType.Conformist,
      sourceRole: 'upstream',
      targetRole: 'downstream',
      notes: 'legacy CF edge',
    });

    expect(result.relationshipType).toBe(RelationshipType.CustomerSupplier);
    expect(result.downstreamType).toBe(RelationshipType.Conformist);
    expect(result.upstreamType ?? null).toBeNull();
    expect(result.notes).toBe('legacy CF edge');
  });

  it('keeps an explicit side pattern', () => {
    const result = normalizeRelationshipData({
      relationshipType: RelationshipType.OpenHostService,
      upstreamType: RelationshipType.PublishedLanguage,
      sourceRole: 'upstream',
      targetRole: 'downstream',
      notes: '',
    });

    expect(result.relationshipType).toBe(RelationshipType.CustomerSupplier);
    expect(result.upstreamType).toBe(RelationshipType.PublishedLanguage);
  });

  it('leaves current-shape data unchanged and is idempotent', () => {
    const currentShape = {
      relationshipType: RelationshipType.CustomerSupplier,
      upstreamType: RelationshipType.OpenHostService,
      downstreamType: null,
      sourceRole: 'upstream' as const,
      targetRole: 'downstream' as const,
      notes: 'already current',
      clarity: 'unsure' as const,
    };

    const once = normalizeRelationshipData(currentShape);
    expect(once).toEqual(currentShape);

    const twice = normalizeRelationshipData(once);
    expect(twice).toEqual(once);

    const sharedKernel = {
      relationshipType: RelationshipType.SharedKernel,
      sourceRole: 'none' as const,
      targetRole: 'none' as const,
      notes: '',
    };
    expect(normalizeRelationshipData(sharedKernel)).toEqual(sharedKernel);
    expect(normalizeRelationshipData(normalizeRelationshipData(sharedKernel))).toEqual(
      normalizeRelationshipData(sharedKernel)
    );
  });
});

describe('normalizeRelationshipEdge', () => {
  it('passes through an edge without data', () => {
    const edge = aRelationship();
    delete (edge as { data?: unknown }).data;

    const result = normalizeRelationshipEdge(edge);

    expect(result.data).toBeUndefined();
    expect(result.id).toBe(edge.id);
    expect(result.source).toBe(edge.source);
    expect(result.target).toBe(edge.target);
  });
});
