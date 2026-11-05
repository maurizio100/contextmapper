import { describe, expect, it } from 'vitest';
import {
  ANCHORS_PER_SIDE,
  assignEdgeAnchors,
  estimateNodeSize,
  layoutDirected,
  layoutGrid,
  resolveDraggedNode,
} from './layout';
import { aBoundedContext, aRelationship } from '../test/builders';

function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

describe('layoutDirected', () => {
  it('lays out connected nodes without overlap', () => {
    const a = aBoundedContext({ data: { name: 'Billing', description: '', color: '#3b82f6' } });
    const b = aBoundedContext({ data: { name: 'Shipping', description: '', color: '#10b981' } });
    const c = aBoundedContext({ data: { name: 'Catalog', description: '', color: '#f59e0b' } });
    const edges = [
      aRelationship({ source: a.id, target: b.id }),
      aRelationship({ source: b.id, target: c.id }),
    ];

    const laid = layoutDirected([a, b, c], edges);

    const rects = laid.map((n) => ({ ...n.position, ...estimateNodeSize(n) }));
    expect(rectsOverlap(rects[0], rects[1])).toBe(false);
    expect(rectsOverlap(rects[0], rects[2])).toBe(false);
    expect(rectsOverlap(rects[1], rects[2])).toBe(false);
  });

  it('falls back to the grid layout when there are no edges', () => {
    const a = aBoundedContext({ data: { name: 'Billing', description: '', color: '#3b82f6' } });
    const b = aBoundedContext({ data: { name: 'Shipping', description: '', color: '#10b981' } });

    const directed = layoutDirected([a, b], []);
    const grid = layoutGrid([a, b]);

    expect(directed).toEqual(grid);
  });
});

describe('assignEdgeAnchors', () => {
  it('assigns one valid anchor handle per edge endpoint', () => {
    const a = aBoundedContext({
      data: { name: 'Billing', description: '', color: '#3b82f6' },
      position: { x: 0, y: 0 },
    });
    const b = aBoundedContext({
      data: { name: 'Shipping', description: '', color: '#10b981' },
      position: { x: 400, y: 0 },
    });
    const edge = aRelationship({ source: a.id, target: b.id });

    const { edges } = assignEdgeAnchors([a, b], [edge]);

    expect(edges).toHaveLength(1);
    const handleRegex = new RegExp(`^(top|right|bottom|left)-([0-${ANCHORS_PER_SIDE - 1}])$`);
    expect(edges[0].sourceHandle).toMatch(handleRegex);
    expect(edges[0].targetHandle).toMatch(handleRegex);

    const sourceIndex = Number(edges[0].sourceHandle?.split('-')[1]);
    const targetIndex = Number(edges[0].targetHandle?.split('-')[1]);
    expect(sourceIndex).toBeGreaterThanOrEqual(0);
    expect(sourceIndex).toBeLessThan(ANCHORS_PER_SIDE);
    expect(targetIndex).toBeGreaterThanOrEqual(0);
    expect(targetIndex).toBeLessThan(ANCHORS_PER_SIDE);
  });
});

describe('resolveDraggedNode', () => {
  it('leaves a non-overlapping position unchanged', () => {
    const dragged = aBoundedContext({
      data: { name: 'Billing', description: '', color: '#3b82f6' },
      position: { x: 0, y: 0 },
    });
    const other = aBoundedContext({
      data: { name: 'Shipping', description: '', color: '#10b981' },
      position: { x: 1000, y: 1000 },
    });

    const result = resolveDraggedNode(dragged, [other]);

    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('separates an overlapping node by at least the gap', () => {
    const gap = 24;
    const dragged = aBoundedContext({
      data: { name: 'Billing', description: '', color: '#3b82f6' },
      position: { x: 0, y: 0 },
    });
    const other = aBoundedContext({
      data: { name: 'Shipping', description: '', color: '#10b981' },
      position: { x: 10, y: 10 },
    });

    const result = resolveDraggedNode(dragged, [other], gap);

    const draggedSize = estimateNodeSize(dragged);
    const otherSize = estimateNodeSize(other);
    const draggedRect = { x: result.x, y: result.y, width: draggedSize.width, height: draggedSize.height };
    const otherRect = { x: other.position.x, y: other.position.y, width: otherSize.width, height: otherSize.height };

    expect(rectsOverlap(draggedRect, otherRect)).toBe(false);
    expect(result).not.toEqual({ x: 0, y: 0 });
  });
});
