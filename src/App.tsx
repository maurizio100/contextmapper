import { useCallback, useState } from 'react';
import { ReactFlowProvider, useReactFlow, type Connection } from '@xyflow/react';
import Canvas from './components/Canvas/Canvas';
import Toolbar from './components/Toolbar/Toolbar';
import ContextDialog from './components/Dialogs/ContextDialog';
import RelationshipDialog from './components/Dialogs/RelationshipDialog';
import { useContextMap } from './hooks/useContextMap';
import { useMapUIState } from './hooks/useMapUIState';
import { useMarkdownExport } from './hooks/useMarkdownExport';
import { useMarkdownImport } from './hooks/useMarkdownImport';
import { useJsonExport } from './hooks/useJsonExport';
import { useJsonImport } from './hooks/useJsonImport';
import { useFocusMode } from './hooks/useFocusMode';
import type {
  BoundedContextData,
  BoundedContextNode,
  RelationshipData,
  RelationshipEdge as RelationshipEdgeType,
} from './types/context-map';
import { exportToPng } from './utils/png-export';

function AppInner() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onReconnect,
    addNode,
    updateNode,
    addEdge,
    updateEdge,
    replaceAll,
    tidyLayout,
    separateNode,
    bendEdge,
  } = useContextMap();

  const {
    pendingConnection,
    setPendingConnection,
    clearPendingConnection,
    editingEdgeId,
    setEditingEdgeId,
    clearEditingEdge,
    editingNodeId,
    setEditingNodeId,
    clearEditingNode,
    resetAll,
  } = useMapUIState();

  const handleConnect = useCallback(
    (connection: Connection) => {
      setPendingConnection({
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      });
    },
    [setPendingConnection]
  );

  const handleReplaceAll = useCallback(
    (newNodes: BoundedContextNode[], newEdges: RelationshipEdgeType[]) => {
      replaceAll(newNodes, newEdges);
      resetAll();
    },
    [replaceAll, resetAll]
  );

  const { exportMarkdown } = useMarkdownExport(nodes, edges);
  const { importMarkdown } = useMarkdownImport({
    replaceAll: handleReplaceAll,
    hasExistingMap: nodes.length > 0 || edges.length > 0,
  });
  const { exportJson } = useJsonExport(nodes, edges);
  const { importJson } = useJsonImport({
    replaceAll: handleReplaceAll,
    hasExistingMap: nodes.length > 0 || edges.length > 0,
  });
  const reactFlowInstance = useReactFlow();
  const { getViewport, fitView } = reactFlowInstance;

  const {
    isFocused,
    visibleNodes,
    visibleEdges,
    visibleCount,
    hiddenCount,
    selectedCount,
    focusOnSelection,
    clearFocus,
  } = useFocusMode(nodes, edges);

  // --- Focus: restrict the canvas to the selection, then refit ---
  const handleFocus = useCallback(() => {
    focusOnSelection();
    requestAnimationFrame(() => fitView({ padding: 0.2 }));
  }, [focusOnSelection, fitView]);

  const handleClearFocus = useCallback(() => {
    clearFocus();
    requestAnimationFrame(() => fitView({ padding: 0.2 }));
  }, [clearFocus, fitView]);

  const [showContextDialog, setShowContextDialog] = useState(false);
  const [addContextSeq, setAddContextSeq] = useState(0);

  // --- Tidy Up: re-pack into an overlap-free grid, then refit ---
  const handleTidy = useCallback(() => {
    tidyLayout();
    requestAnimationFrame(() => fitView({ padding: 0.2 }));
  }, [tidyLayout, fitView]);

  // --- Add Context ---
  const handleAddContext = useCallback(() => {
    setAddContextSeq((seq) => seq + 1);
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
        nodes={visibleNodes}
        edges={visibleEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onReconnect={onReconnect}
        onEdgeClick={handleEdgeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeDragStop={separateNode}
        bendEdge={bendEdge}
      />
      <Toolbar
        onAddContext={handleAddContext}
        onTidy={handleTidy}
        onImport={importMarkdown}
        onExport={exportMarkdown}
        onImportJson={importJson}
        onExportJson={exportJson}
        onExportPng={() => exportToPng(reactFlowInstance)}
        onFocus={handleFocus}
        onClearFocus={handleClearFocus}
        isFocused={isFocused}
        canFocus={selectedCount > 0}
        visibleCount={visibleCount}
        hiddenCount={hiddenCount}
      />

      <ContextDialog
        open={showContextDialog}
        dialogKey={editingNodeId ?? `new-${addContextSeq}`}
        initial={editingNode?.data}
        onConfirm={handleContextConfirm}
        onCancel={handleContextCancel}
      />

      <RelationshipDialog
        open={showRelDialog}
        dialogKey={editingEdgeId ?? (pendingConnection ? 'pending' : 'new')}
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
