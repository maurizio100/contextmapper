import type {
  BoundedContextData,
  BoundedContextNode,
  RelationshipData,
  RelationshipEdge,
} from '../../types/context-map';
import BoundedContextFields from './BoundedContextFields';
import RelationshipFields from './RelationshipFields';

interface SelectionPanelProps {
  selectedNode: BoundedContextNode | null;
  selectedEdge: RelationshipEdge | null;
  sourceName: string;
  targetName: string;
  teams: string[];
  otherTeams: string[];
  onUpdateNode: (id: string, data: BoundedContextData) => void;
  onUpdateEdge: (id: string, data: RelationshipData) => void;
}

/**
 * Right-side panel that shows and edits whatever is currently selected on
 * the canvas. Opens on selection, closes on deselect — driven entirely by
 * the map's own `selected` flags (guidelines/architecture.md: selection is
 * derived, not a second copy of UI state). Multi-selection is out of scope:
 * the panel stays closed unless exactly one node or one edge is selected.
 */
export default function SelectionPanel({
  selectedNode,
  selectedEdge,
  sourceName,
  targetName,
  teams,
  otherTeams,
  onUpdateNode,
  onUpdateEdge,
}: SelectionPanelProps) {
  if (!selectedNode && !selectedEdge) return null;

  return (
    <aside className="absolute top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg overflow-y-auto p-5 z-10">
      {selectedNode && (
        <BoundedContextFields
          key={selectedNode.id}
          node={selectedNode}
          teams={teams}
          otherTeams={otherTeams}
          onUpdate={onUpdateNode}
        />
      )}
      {selectedEdge && (
        <RelationshipFields
          key={selectedEdge.id}
          edge={selectedEdge}
          sourceName={sourceName}
          targetName={targetName}
          onUpdate={onUpdateEdge}
        />
      )}
    </aside>
  );
}
