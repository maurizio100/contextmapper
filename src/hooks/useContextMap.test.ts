import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useContextMap } from './useContextMap';
import { aBoundedContext, aRelationship } from '../test/builders';

describe('useContextMap', () => {
  it('bendEdge merges controlOffset into the matching edge and leaves others untouched', () => {
    const a = aBoundedContext();
    const b = aBoundedContext();
    const c = aBoundedContext();
    const bent = aRelationship({
      source: a.id,
      target: b.id,
      data: {
        relationshipType: 'CustomerSupplier',
        sourceRole: 'upstream',
        targetRole: 'downstream',
        notes: 'bent edge',
      },
    });
    const untouched = aRelationship({
      source: b.id,
      target: c.id,
      data: {
        relationshipType: 'SharedKernel',
        sourceRole: 'none',
        targetRole: 'none',
        notes: 'leave me alone',
        controlOffset: { x: 5, y: 5 },
      },
    });

    const { result } = renderHook(() => useContextMap());

    act(() => {
      result.current.replaceAll([a, b, c], [bent, untouched]);
    });

    act(() => {
      result.current.bendEdge(bent.id, { x: 42, y: -17 });
    });

    const bentAfter = result.current.edges.find((e) => e.id === bent.id);
    const untouchedAfter = result.current.edges.find((e) => e.id === untouched.id);

    expect(bentAfter?.data?.controlOffset).toEqual({ x: 42, y: -17 });
    expect(bentAfter?.data?.notes).toBe('bent edge');
    expect(untouchedAfter?.data).toEqual(untouched.data);
  });

  it('no longer exposes pendingConnection/editingEdgeId/editingNodeId/onConnect', () => {
    const { result } = renderHook(() => useContextMap());

    expect(result.current).not.toHaveProperty('pendingConnection');
    expect(result.current).not.toHaveProperty('editingEdgeId');
    expect(result.current).not.toHaveProperty('editingNodeId');
    expect(result.current).not.toHaveProperty('onConnect');
    expect(result.current).not.toHaveProperty('setEditingEdgeId');
    expect(result.current).not.toHaveProperty('setEditingNodeId');
    expect(result.current).not.toHaveProperty('clearPendingConnection');
    expect(result.current).not.toHaveProperty('clearEditingEdge');
    expect(result.current).not.toHaveProperty('clearEditingNode');
  });
});
