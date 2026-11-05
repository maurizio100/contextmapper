import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useContextMap } from './useContextMap';
import { aBoundedContext, aRelationship } from '../test/builders';
import { RelationshipType } from '../types/context-map';

describe('useContextMap', () => {
  it('loads legacy relationship types in the current shape', () => {
    const a = aBoundedContext();
    const b = aBoundedContext();
    const legacyEdge = {
      id: 'legacy-edge',
      source: a.id,
      target: b.id,
      type: 'relationship',
      sourceHandle: 'right',
      targetHandle: 'left',
      data: {
        relationshipType: RelationshipType.OpenHostService,
        sourceRole: 'upstream',
        targetRole: 'downstream',
        notes: 'legacy stored edge',
      },
    };
    localStorage.setItem(
      'context-map-data',
      JSON.stringify({ nodes: [a, b], edges: [legacyEdge] })
    );

    const { result } = renderHook(() => useContextMap());

    expect(result.current.edges).toHaveLength(1);
    const loadedEdge = result.current.edges[0];
    expect(loadedEdge.data?.relationshipType).toBe(RelationshipType.CustomerSupplier);
    expect(loadedEdge.data?.upstreamType).toBe(RelationshipType.OpenHostService);
    expect(loadedEdge.sourceHandle).toBe('right-0');
    expect(loadedEdge.targetHandle).toBe('left-0');
  });

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

  it('addNode selects the new node and deselects existing nodes/edges', () => {
    const existingA = aBoundedContext({ selected: true });
    const existingB = aBoundedContext();
    const existingEdge = aRelationship({
      source: existingA.id,
      target: existingB.id,
      selected: true,
    });
    const { result } = renderHook(() => useContextMap());

    act(() => {
      result.current.replaceAll([existingA, existingB], [existingEdge]);
    });

    act(() => {
      result.current.addNode({ name: 'New', description: '', color: '#3b82f6' }, { x: 0, y: 0 });
    });

    const newNode = result.current.nodes.find(
      (n) => n.id !== existingA.id && n.id !== existingB.id
    );
    expect(newNode?.selected).toBe(true);
    expect(result.current.nodes.find((n) => n.id === existingA.id)?.selected).toBe(false);
    expect(result.current.edges.find((e) => e.id === existingEdge.id)?.selected).toBe(false);
  });

  it('addEdge selects the new edge and deselects existing nodes/edges', () => {
    const a = aBoundedContext({ selected: true });
    const b = aBoundedContext();
    const existingEdge = aRelationship({ source: a.id, target: b.id, selected: true });
    const { result } = renderHook(() => useContextMap());

    act(() => {
      result.current.replaceAll([a, b], [existingEdge]);
    });

    act(() => {
      result.current.addEdge(
        { source: a.id, target: b.id },
        {
          relationshipType: RelationshipType.CustomerSupplier,
          sourceRole: 'upstream',
          targetRole: 'downstream',
          notes: '',
        }
      );
    });

    const newEdge = result.current.edges.find((e) => e.id !== existingEdge.id);
    expect(newEdge?.selected).toBe(true);
    expect(result.current.edges.find((e) => e.id === existingEdge.id)?.selected).toBe(false);
    expect(result.current.nodes.every((n) => n.selected === false)).toBe(true);
  });

  describe('undo history granularity', () => {
    function seed() {
      const a = aBoundedContext({ data: { name: 'A', description: '', color: '#000' } });
      const b = aBoundedContext({ data: { name: 'B', description: '', color: '#000' } });
      const edge = aRelationship({ source: a.id, target: b.id });
      localStorage.setItem('context-map-data', JSON.stringify({ nodes: [a, b], edges: [edge] }));
      return { a, b, edge, hook: renderHook(() => useContextMap()) };
    }

    async function countSteps(result: { current: ReturnType<typeof useContextMap> }) {
      let steps = 0;
      while (result.current.canUndo) {
        await act(async () => result.current.undo());
        steps++;
      }
      return steps;
    }

    it('selection and dimension changes create no undo step', async () => {
      const { a, hook } = seed();
      await act(async () => {
        hook.result.current.onNodesChange([
          { type: 'select', id: a.id, selected: true },
          { type: 'dimensions', id: a.id, dimensions: { width: 10, height: 10 } },
        ]);
      });
      expect(hook.result.current.canUndo).toBe(false);
    });

    it('one drag plus separateNode is a single step', async () => {
      const { a, hook } = seed();
      for (const x of [1, 2, 3]) {
        await act(async () => {
          hook.result.current.onNodesChange([
            { type: 'position', id: a.id, position: { x, y: 0 }, dragging: true },
          ]);
        });
      }
      await act(async () => {
        hook.result.current.onNodesChange([
          { type: 'position', id: a.id, position: { x: 3, y: 0 }, dragging: false },
        ]);
        hook.result.current.separateNode(a.id);
      });
      expect(await countSteps(hook.result)).toBe(1);
      expect(hook.result.current.nodes.find((n) => n.id === a.id)?.position).toEqual({ x: 0, y: 0 });
    });

    it('consecutive updateNode on the same id coalesce; a different id does not', async () => {
      const { a, b, hook } = seed();
      const data = (name: string) => ({ name, description: '', color: '#000' });
      for (const name of ['A1', 'A2', 'A3']) {
        await act(async () => hook.result.current.updateNode(a.id, data(name)));
      }
      await act(async () => hook.result.current.updateNode(b.id, data('B1')));
      await act(async () => hook.result.current.updateNode(a.id, data('A4')));
      expect(await countSteps(hook.result)).toBe(3);
    });

    it('bendEdge is one step per gesture: two separate bends of one edge are two steps', async () => {
      const { edge, hook } = seed();
      await act(async () => hook.result.current.bendEdge(edge.id, { x: 10, y: 10 }));
      await act(async () => hook.result.current.bendEdge(edge.id, { x: 20, y: 20 }));
      expect(await countSteps(hook.result)).toBe(2);
    });

    it('one bend gesture (a single bendEdge on release) is one step', async () => {
      const { edge, hook } = seed();
      await act(async () => hook.result.current.bendEdge(edge.id, { x: 10, y: 10 }));
      expect(await countSteps(hook.result)).toBe(1);
      expect(hook.result.current.edges[0].data?.controlOffset).toBeUndefined();
    });

    it('updateEdge text edits coalesce but do not merge into a preceding bend', async () => {
      const { edge, hook } = seed();
      const data = edge.data!;
      await act(async () => hook.result.current.bendEdge(edge.id, { x: 10, y: 10 }));
      await act(async () => hook.result.current.updateEdge(edge.id, { ...data, description: 'x' }));
      await act(async () => hook.result.current.updateEdge(edge.id, { ...data, description: 'xy' }));
      expect(await countSteps(hook.result)).toBe(2);
    });

    it('removing a node and its edges in one tick is one step', async () => {
      const { a, edge, hook } = seed();
      await act(async () => {
        hook.result.current.onNodesChange([{ type: 'remove', id: a.id }]);
        hook.result.current.onEdgesChange([{ type: 'remove', id: edge.id }]);
      });
      expect(hook.result.current.nodes).toHaveLength(1);
      expect(hook.result.current.edges).toHaveLength(0);
      await act(async () => hook.result.current.undo());
      expect(hook.result.current.nodes).toHaveLength(2);
      expect(hook.result.current.edges).toHaveLength(1);
      expect(hook.result.current.canUndo).toBe(false);
    });
  });
});
