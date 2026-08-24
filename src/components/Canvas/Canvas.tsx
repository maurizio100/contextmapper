import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import type {
  BoundedContextNode,
  RelationshipEdge,
  BoundedContextData,
} from '../../types/context-map';
import type { NodeChange, EdgeChange, Connection } from '@xyflow/react';
import BoundedContextNodeComponent from './BoundedContextNode';
import RelationshipEdgeComponent from './RelationshipEdge';

// Module-level constants — avoids React Flow re-render pitfall
const nodeTypes: NodeTypes = {
  boundedContext: BoundedContextNodeComponent,
};

const edgeTypes: EdgeTypes = {
  relationship: RelationshipEdgeComponent,
};

interface CanvasProps {
  nodes: BoundedContextNode[];
  edges: RelationshipEdge[];
  onNodesChange: (changes: NodeChange<BoundedContextNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<RelationshipEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  onReconnect: (oldEdge: RelationshipEdge, newConnection: Connection) => void;
  onEdgeClick: (edgeId: string) => void;
  onNodeDoubleClick: (nodeId: string) => void;
  onNodeDragStop: (nodeId: string) => void;
}

export default function Canvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onReconnect,
  onEdgeClick,
  onNodeDoubleClick,
  onNodeDragStop,
}: CanvasProps) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onReconnect={onReconnect}
      edgesReconnectable
      connectionMode={ConnectionMode.Loose}
      connectionRadius={45}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onEdgeClick={(_event, edge) => onEdgeClick(edge.id)}
      onNodeDoubleClick={(_event, node) => onNodeDoubleClick(node.id)}
      onNodeDragStop={(_event, node) => onNodeDragStop(node.id)}
      fitView
      deleteKeyCode={['Backspace', 'Delete']}
      className="bg-gray-50"
    >
      <Background gap={20} size={1} color="#e2e8f0" />
      <Controls />
      <MiniMap
        nodeColor={(node) => {
          const data = node.data as BoundedContextData;
          return data.color ?? '#94a3b8';
        }}
        maskColor="rgba(0,0,0,0.1)"
        className="!bg-white !border !border-gray-200"
      />
      <svg>
        <defs>
          <marker
            id="arrow-downstream"
            viewBox="0 0 12 12"
            refX="11"
            refY="6"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path d="M 1 1 L 11 6 L 1 11 z" fill="#f97316" />
          </marker>
          <marker
            id="arrow-downstream-reverse"
            viewBox="0 0 12 12"
            refX="1"
            refY="6"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path d="M 11 1 L 1 6 L 11 11 z" fill="#f97316" />
          </marker>
        </defs>
      </svg>
    </ReactFlow>
  );
}
