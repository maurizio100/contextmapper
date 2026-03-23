import { useCallback, useState } from 'react';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import Canvas from './components/Canvas/Canvas';
import Toolbar from './components/Toolbar/Toolbar';
import ContextDialog from './components/Dialogs/ContextDialog';
import RelationshipDialog from './components/Dialogs/RelationshipDialog';
import { useContextMap } from './hooks/useContextMap';
import { useMarkdownExport } from './hooks/useMarkdownExport';
import type { BoundedContextData, RelationshipData } from './types/context-map';
import { exportToPng } from './utils/png-export';
import { wasDraggingRecently } from './components/Canvas/RelationshipEdge';

function AppInner() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onReconnect,
    addNode,
    updateNode,
    addEdge,
    updateEdge,
    pendingConnection,
    clearPendingConnection,
    editingEdgeId,
    setEditingEdgeId,
    clearEditingEdge,
    editingNodeId,
    setEditingNodeId,
    clearEditingNode,
  } = useContextMap();

  const { exportMarkdown } = useMarkdownExport(nodes, edges);
  const reactFlowInstance = useReactFlow();
  const { getViewport } = reactFlowInstance;

  const [showContextDialog, setShowContextDialog] = useState(false);

  // --- Add Context ---
  const handleAddContext = useCallback(() => {
    setShowContextDialog(true);
  }, []);

  const handleContextConfirm = useCallback(
    (data: BoundedContextData) => {
      if (editingNodeId) {
        updateNode(editingNodeId, data);
        clearEditingNode();
      } else {
        const { x, y, zoom } = getViewport();
        const centerX = (-x + window.innerWidth / 2) / zoom;
        const centerY = (-y + window.innerHeight / 2) / zoom;
        addNode(data, {
          x: centerX - 90 + Math.random() * 40 - 20,
          y: centerY - 40 + Math.random() * 40 - 20,
        });
      }
      setShowContextDialog(false);
    },
    [addNode, updateNode, editingNodeId, clearEditingNode, getViewport]
  );

  const handleContextCancel = useCallback(() => {
    setShowContextDialog(false);
    clearEditingNode();
  }, [clearEditingNode]);

  // --- Node double-click → edit ---
  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      setEditingNodeId(nodeId);
      setShowContextDialog(true);
    },
    [setEditingNodeId]
  );

  // --- Relationship ---
  const handleRelationshipConfirm = useCallback(
    (data: RelationshipData) => {
      if (editingEdgeId) {
        updateEdge(editingEdgeId, data);
        clearEditingEdge();
      } else if (pendingConnection) {
        addEdge(pendingConnection, data);
        clearPendingConnection();
      }
    },
    [pendingConnection, editingEdgeId, addEdge, updateEdge, clearPendingConnection, clearEditingEdge]
  );

  const handleRelationshipCancel = useCallback(() => {
    clearPendingConnection();
    clearEditingEdge();
  }, [clearPendingConnection, clearEditingEdge]);

  const handleEdgeClick = useCallback(
    (edgeId: string) => {
      if (wasDraggingRecently()) return;
      setEditingEdgeId(edgeId);
    },
    [setEditingEdgeId]
  );

  // Resolve names for relationship dialog
  const pendingSourceName =
    pendingConnection
      ? nodes.find((n) => n.id === pendingConnection.source)?.data.name ?? ''
      : '';
  const pendingTargetName =
    pendingConnection
      ? nodes.find((n) => n.id === pendingConnection.target)?.data.name ?? ''
      : '';

  const editingEdge = editingEdgeId
    ? edges.find((e) => e.id === editingEdgeId)
    : null;
  const editSourceName = editingEdge
    ? nodes.find((n) => n.id === editingEdge.source)?.data.name ?? ''
    : '';
  const editTargetName = editingEdge
    ? nodes.find((n) => n.id === editingEdge.target)?.data.name ?? ''
    : '';

  const editingNode = editingNodeId
    ? nodes.find((n) => n.id === editingNodeId)
    : null;

  const showRelDialog = !!(pendingConnection || editingEdgeId);

  return (
    <div className="w-full h-screen relative">
      <Canvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onEdgeClick={handleEdgeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
      />
      <Toolbar
        onAddContext={handleAddContext}
        onExport={exportMarkdown}
        onExportPng={() => exportToPng(reactFlowInstance)}
      />

      <ContextDialog
        open={showContextDialog}
        initial={editingNode?.data}
        onConfirm={handleContextConfirm}
        onCancel={handleContextCancel}
      />

      <RelationshipDialog
        open={showRelDialog}
        sourceName={editingEdge ? editSourceName : pendingSourceName}
        targetName={editingEdge ? editTargetName : pendingTargetName}
        initial={editingEdge?.data}
        onConfirm={handleRelationshipConfirm}
        onCancel={handleRelationshipCancel}
      />
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppInner />
    </ReactFlowProvider>
  );
}
