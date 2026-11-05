import { useState } from 'react';
import {
  RelationshipType,
  type Clarity,
  type RelationshipData,
  type RelationshipEdge,
  type Role,
} from '../../types/context-map';
import { RELATIONSHIP_META } from '../../constants/relationships';
import { CLARITY_COLORS } from '../../constants/colors';
import RelationshipDirectionFields from './RelationshipDirectionFields';

const CLARITY_LABELS: Record<Clarity, string> = {
  clear: 'Clear',
  unsure: 'Unsure',
  'needs-improvement': 'Needs improvement',
};

const CLARITY_ACTIVE_CLASSES: Record<Clarity, string> = {
  clear: 'border-green-500 bg-green-50 text-green-800',
  unsure: 'border-blue-500 bg-blue-50 text-blue-800',
  'needs-improvement': 'border-red-500 bg-red-50 text-red-800',
};

const CLARITY_OPTIONS: { value: Clarity; label: string; color: string; activeClass: string }[] =
  (Object.keys(CLARITY_COLORS) as Clarity[]).map((value) => ({
    value,
    label: CLARITY_LABELS[value],
    color: CLARITY_COLORS[value].normal,
    activeClass: CLARITY_ACTIVE_CLASSES[value],
  }));

const baseTypes = (Object.values(RelationshipType) as RelationshipType[]).filter(
  (t) => RELATIONSHIP_META[t].category === 'symmetric' || RELATIONSHIP_META[t].category === 'directional-base'
);

interface RelationshipFieldsProps {
  edge: RelationshipEdge;
  sourceName: string;
  targetName: string;
  onUpdate: (id: string, data: RelationshipData) => void;
}

/**
 * Fields for the selected relationship, shown in the selection panel. Every
 * change applies to the map immediately via a single merged `RelationshipData`.
 */
export default function RelationshipFields({ edge, sourceName, targetName, onUpdate }: RelationshipFieldsProps) {
  const initial = edge.data!;
  const [baseType, setBaseType] = useState<RelationshipType>(initial.relationshipType);
  const [upstreamPattern, setUpstreamPattern] = useState<RelationshipType | null>(initial.upstreamType ?? null);
  const [downstreamPattern, setDownstreamPattern] = useState<RelationshipType | null>(initial.downstreamType ?? null);
  const [sourceRole, setSourceRole] = useState<Role>(initial.sourceRole);
  const [targetRole, setTargetRole] = useState<Role>(initial.targetRole);
  const [notes, setNotes] = useState(initial.notes);
  const [clarity, setClarity] = useState<Clarity | undefined>(initial.clarity);

  const baseMeta = RELATIONSHIP_META[baseType];
  const isSymmetric = baseMeta.symmetric;

  const buildData = (overrides: Partial<RelationshipData>): RelationshipData => ({
    relationshipType: baseType,
    upstreamType: isSymmetric ? null : upstreamPattern,
    downstreamType: isSymmetric ? null : downstreamPattern,
    sourceRole,
    targetRole,
    notes,
    clarity,
    ...overrides,
  });

  const handleBaseTypeSelect = (type: RelationshipType) => {
    const m = RELATIONSHIP_META[type];
    const nextSourceRole: Role = m.symmetric ? 'none' : sourceRole === 'none' ? 'upstream' : sourceRole;
    const nextTargetRole: Role = m.symmetric ? 'none' : targetRole === 'none' ? 'downstream' : targetRole;
    const nextUpstreamPattern = m.symmetric ? null : upstreamPattern;
    const nextDownstreamPattern = m.symmetric ? null : downstreamPattern;
    setBaseType(type);
    setSourceRole(nextSourceRole);
    setTargetRole(nextTargetRole);
    setUpstreamPattern(nextUpstreamPattern);
    setDownstreamPattern(nextDownstreamPattern);
    onUpdate(
      edge.id,
      buildData({
        relationshipType: type,
        upstreamType: nextUpstreamPattern,
        downstreamType: nextDownstreamPattern,
        sourceRole: nextSourceRole,
        targetRole: nextTargetRole,
      })
    );
  };

  const handleToggleDirection = () => {
    const nextSourceRole: Role = sourceRole === 'upstream' ? 'downstream' : 'upstream';
    const nextTargetRole: Role = targetRole === 'upstream' ? 'downstream' : 'upstream';
    setSourceRole(nextSourceRole);
    setTargetRole(nextTargetRole);
    onUpdate(edge.id, buildData({ sourceRole: nextSourceRole, targetRole: nextTargetRole }));
  };

  const handleUpstreamPatternChange = (type: RelationshipType | null) => {
    setUpstreamPattern(type);
    onUpdate(edge.id, buildData({ upstreamType: type }));
  };

  const handleDownstreamPatternChange = (type: RelationshipType | null) => {
    setDownstreamPattern(type);
    onUpdate(edge.id, buildData({ downstreamType: type }));
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    onUpdate(edge.id, buildData({ notes: value }));
  };

  const handleClarityChange = (value: Clarity | undefined) => {
    setClarity(value);
    onUpdate(edge.id, buildData({ clarity: value }));
  };

  const descriptionType = upstreamPattern ?? downstreamPattern ?? baseType;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Relationship</h2>
        <p className="text-sm text-gray-400 mt-0.5 truncate">
          {sourceName} &harr; {targetName}
        </p>
      </div>

      {/* Base type grid */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Type</p>
        <div className="grid grid-cols-5 gap-1.5">
          {baseTypes.map((type) => {
            const m = RELATIONSHIP_META[type];
            const isSelected = baseType === type;
            return (
              <button
                key={type}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleBaseTypeSelect(type)}
                className={`
                  rounded-lg border-2 px-2 py-2 text-center transition-colors
                  ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}
                `}
              >
                <span className="block text-xs font-bold text-gray-800 leading-tight">{m.abbreviation}</span>
                <span className="block text-[10px] text-gray-400 mt-0.5 leading-tight">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed -mt-2">
        {RELATIONSHIP_META[descriptionType].description}
      </p>

      {!isSymmetric && (
        <RelationshipDirectionFields
          sourceName={sourceName}
          targetName={targetName}
          sourceRole={sourceRole}
          targetRole={targetRole}
          upstreamPattern={upstreamPattern}
          downstreamPattern={downstreamPattern}
          onToggleDirection={handleToggleDirection}
          onUpstreamPatternChange={handleUpstreamPatternChange}
          onDownstreamPatternChange={handleDownstreamPatternChange}
        />
      )}

      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
        Notes
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          rows={2}
          className="mt-2 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
          placeholder="Integration details, constraints..."
        />
      </label>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Clarity</p>
        <div className="flex gap-2">
          {CLARITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={clarity === opt.value}
              onClick={() => handleClarityChange(clarity === opt.value ? undefined : opt.value)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-colors
                ${clarity === opt.value ? opt.activeClass : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 bg-white'}
              `}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
