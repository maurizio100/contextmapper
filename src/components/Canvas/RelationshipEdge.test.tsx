import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import RelationshipEdge from './RelationshipEdge';
import { EdgeActionsContext } from '../../hooks/useEdgeActions';
import { RelationshipType } from '../../types/context-map';

// RelationshipEdge is rendered by React Flow with EdgeProps; isolate it from
// React Flow's store/portal machinery (guidelines/testing.md: don't assert
// on — or depend on — React Flow internals in component tests).
vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();
  return {
    ...actual,
    useReactFlow: () => ({
      // Identity conversion: screen deltas equal flow deltas in this test.
      screenToFlowPosition: (p: { x: number; y: number }) => p,
      // The current implementation still writes edges directly; the
      // scenario is red regardless, but a no-op keeps the drag sequence
      // from throwing before bendEdge's absence can be observed.
      setEdges: vi.fn(),
    }),
    EdgeLabelRenderer: ({ children }: { children: ReactNode }) => children,
  };
});

const EDGE_ID = 'edge-1';

function renderEdge(
  bendEdge: (id: string, offset: { x: number; y: number }) => void,
  data: Parameters<typeof RelationshipEdge>[0]['data'] = {
    relationshipType: RelationshipType.CustomerSupplier,
    sourceRole: 'upstream',
    targetRole: 'downstream',
    notes: '',
  }
) {
  const onEdgeClickHandle = vi.fn();

  render(
    <EdgeActionsContext.Provider value={{ bendEdge }}>
      <svg onClick={() => onEdgeClickHandle(EDGE_ID)}>
        <RelationshipEdge
          id={EDGE_ID}
          source="a"
          target="b"
          sourceX={0}
          sourceY={0}
          targetX={200}
          targetY={0}
          sourcePosition={undefined as never}
          targetPosition={undefined as never}
          selected={false}
          data={data}
        />
      </svg>
    </EdgeActionsContext.Provider>
  );

  return { onEdgeClick: onEdgeClickHandle };
}

function getEdgePath(): SVGPathElement {
  const path = document.getElementById(EDGE_ID);
  if (!path) throw new Error('no path found for edge');
  return path as unknown as SVGPathElement;
}

describe('RelationshipEdge bend', () => {
  it('updates the visual curve live while dragging and commits the offset once on pointer-up', () => {
    const bendEdge = vi.fn();
    renderEdge(bendEdge);

    const handle = screen.getByTitle('Drag to bend the edge');
    const path = getEdgePath();
    const initialD = path.getAttribute('d');

    fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 60, clientY: 60, pointerId: 1 });

    expect(path.getAttribute('d')).not.toBe(initialD);
    expect(bendEdge).not.toHaveBeenCalled();

    fireEvent.pointerUp(handle, { clientX: 60, clientY: 60, pointerId: 1 });

    expect(bendEdge).toHaveBeenCalledTimes(1);
    expect(bendEdge).toHaveBeenCalledWith(
      EDGE_ID,
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
    );
  });
});

describe('RelationshipEdge badges', () => {
  it('renders side pattern badges instead of the centre base badge', () => {
    renderEdge(vi.fn(), {
      relationshipType: RelationshipType.CustomerSupplier,
      upstreamType: RelationshipType.OpenHostService,
      sourceRole: 'upstream',
      targetRole: 'downstream',
      notes: '',
    });

    expect(screen.getByText('OHS')).toBeInTheDocument();
    expect(screen.queryByText('CS')).not.toBeInTheDocument();
  });
});

describe('RelationshipEdge click suppression', () => {
  it('a click ending a drag does not reach the edge click handler; a plain click still bubbles', () => {
    const bendEdge = vi.fn();
    const { onEdgeClick } = renderEdge(bendEdge);

    const handle = screen.getByTitle('Drag to bend the edge');

    // pointerdown -> pointermove -> pointerup -> click, as a real drag-then-release does.
    fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 40, clientY: 40, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientX: 40, clientY: 40, pointerId: 1 });
    fireEvent.click(handle);

    expect(onEdgeClick).not.toHaveBeenCalled();

    // A plain click, with no preceding move, still bubbles to the edge click handler.
    fireEvent.pointerDown(handle, { clientX: 40, clientY: 40, pointerId: 2 });
    fireEvent.pointerUp(handle, { clientX: 40, clientY: 40, pointerId: 2 });
    fireEvent.click(handle);

    expect(onEdgeClick).toHaveBeenCalledTimes(1);
  });
});
