import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMapUIState } from './useMapUIState';

describe('useMapUIState', () => {
  it('sets pendingConnection/editingEdgeId/editingNodeId; clear* and resetAll reset them to null', () => {
    const { result } = renderHook(() => useMapUIState());

    act(() => {
      result.current.setPendingConnection({ source: 'a', target: 'b' });
      result.current.setEditingEdgeId('edge-1');
      result.current.setEditingNodeId('node-1');
    });

    expect(result.current.pendingConnection).toEqual({ source: 'a', target: 'b' });
    expect(result.current.editingEdgeId).toBe('edge-1');
    expect(result.current.editingNodeId).toBe('node-1');

    act(() => result.current.clearPendingConnection());
    act(() => result.current.clearEditingEdge());
    act(() => result.current.clearEditingNode());

    expect(result.current.pendingConnection).toBeNull();
    expect(result.current.editingEdgeId).toBeNull();
    expect(result.current.editingNodeId).toBeNull();

    act(() => {
      result.current.setPendingConnection({ source: 'c', target: 'd' });
      result.current.setEditingEdgeId('edge-2');
      result.current.setEditingNodeId('node-2');
    });

    act(() => result.current.resetAll());

    expect(result.current.pendingConnection).toBeNull();
    expect(result.current.editingEdgeId).toBeNull();
    expect(result.current.editingNodeId).toBeNull();
  });
});
