import { useCallback, useMemo } from 'react';
import { ReactFlowProvider, useReactFlow, type Connection } from '@xyflow/react';
import Canvas from './components/Canvas/Canvas';
import Toolbar from './components/Toolbar/Toolbar';
import SelectionPanel from './components/SelectionPanel/SelectionPanel';
import { useContextMap } from './hooks/useContextMap';
import { useMarkdownExport } from './hooks/useMarkdownExport';
import { useMarkdownImport } from './hooks/useMarkdownImport';
import { useJsonExport } from './hooks/useJsonExport';
import { useJsonImport } from './hooks/useJsonImport';
import { useUndoRedoShortcuts } from './hooks/useUndoRedoShortcuts';
import { useFocusMode } from './hooks/useFocusMode';
import type {
  BoundedContextNode,
  RelationshipEdge as RelationshipEdgeType,
} from './types/context-map';
import { exportToPng } from './utils/png-export';
import { CONTEXT_COLORS, DEFAULT_RELATIONSHIP_DATA } from './constants/relationships';
import {
  FIT_VIEW_OPTIONS,
  NEW_CONTEXT_OFFSET_X,
  NEW_CONTEXT_OFFSET_Y,
  NEW_CONTEXT_JITTER_RANGE,
  NEW_CONTEXT_NAME,
} from './constants/canvas';

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
    undo,
    redo,
    canUndo,
    canRedo,
  } = useContextMap();
  useUndoRedoShortcuts({ undo, redo });

  const handleConnect = useCallback(
    (connection: Connection) => {
      addEdge(connection, DEFAULT_RELATIONSHIP_DATA);
    },
    [addEdge]
  );

  const handleReplaceAll = useCallback(
    (newNodes: BoundedContextNode[], newEdges: RelationshipEdgeType[]) => {
      replaceAll(newNodes, newEdges);
    },
    [replaceAll]
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
    requestAnimationFrame(() => fitView(FIT_VIEW_OPTIONS));
  }, [focusOnSelection, fitView]);

  const handleClearFocus = useCallback(() => {
    clearFocus();
    requestAnimationFrame(() => fitView(FIT_VIEW_OPTIONS));
  }, [clearFocus, fitView]);

  // --- Tidy Up: re-pack into an overlap-free grid, then refit ---
  const handleTidy = useCallback(() => {
    tidyLayout();
    requestAnimationFrame(() => fitView(FIT_VIEW_OPTIONS));
  }, [tidyLayout, fitView]);

  // --- Add Context: create it immediately, centred on the viewport, and select it ---
  const handleAddContext = useCallback(() => {
    const { x, y, zoom } = getViewport();
    const centerX = (-x + window.innerWidth / 2) / zoom;
    const centerY = (-y + window.innerHeight / 2) / zoom;
    addNode(
      { name: NEW_CONTEXT_NAME, description: '', color: CONTEXT_COLORS[0] },
      {
        x: centerX - NEW_CONTEXT_OFFSET_X + Math.random() * NEW_CONTEXT_JITTER_RANGE - NEW_CONTEXT_JITTER_RANGE / 2,
        y: centerY - NEW_CONTEXT_OFFSET_Y + Math.random() * NEW_CONTEXT_JITTER_RANGE - NEW_CONTEXT_JITTER_RANGE / 2,
      }
    );
  }, [addNode, getViewport]);

  // --- Selection panel: derived from the map's own selection, not a second copy of UI state ---
  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);
  const selectedEdges = useMemo(() => edges.filter((e) => e.selected), [edges]);
  const selectedNode =
    selectedNodes.length === 1 && selectedEdges.length === 0 ? selectedNodes[0] : null;
  const selectedEdge =
    selectedEdges.length === 1 && selectedNodes.length === 0 ? selectedEdges[0] : null;
  const selectedEdgeSourceName = selectedEdge
    ? nodes.find((n) => n.id === selectedEdge.source)?.data.name ?? ''
    : '';
  const selectedEdgeTargetName = selectedEdge
    ? nodes.find((n) => n.id === selectedEdge.target)?.data.name ?? ''
    : '';

  return (
    <div className="w-full h-screen relative">
      <Canvas
        nodes={visibleNodes}
        edges={visibleEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onReconnect={onReconnect}
        onNodeDragStop={separateNode}
        bendEdge={bendEdge}
      />
      <Toolbar
        onAddContext={handleAddContext}
        onTidy={handleTidy}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
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

      <SelectionPanel
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        sourceName={selectedEdgeSourceName}
        targetName={selectedEdgeTargetName}
        onUpdateNode={updateNode}
        onUpdateEdge={updateEdge}
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
