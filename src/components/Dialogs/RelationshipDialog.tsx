import { useEffect, useRef, useState } from 'react';
import { RelationshipType, type RelationshipData, type Role } from '../../types/context-map';
import { RELATIONSHIP_META } from '../../constants/relationships';

interface RelationshipDialogProps {
  open: boolean;
  sourceName: string;
  targetName: string;
  initial?: RelationshipData;
  onConfirm: (data: RelationshipData) => void;
  onCancel: () => void;
}

const baseTypes = (Object.values(RelationshipType) as RelationshipType[]).filter(
  (t) => RELATIONSHIP_META[t].category === 'symmetric' || RELATIONSHIP_META[t].category === 'directional-base'
);

const upstreamPatterns = (Object.values(RelationshipType) as RelationshipType[]).filter(
  (t) => RELATIONSHIP_META[t].category === 'upstream-pattern'
);

const downstreamPatterns = (Object.values(RelationshipType) as RelationshipType[]).filter(
  (t) => RELATIONSHIP_META[t].category === 'downstream-pattern'
);

function normalizeInitial(initial?: RelationshipData): {
  baseType: RelationshipType;
  upstreamPattern: RelationshipType | null;
  downstreamPattern: RelationshipType | null;
  sourceRole: Role;
  targetRole: Role;
  notes: string;
} {
  if (!initial) {
    return {
      baseType: RelationshipType.CustomerSupplier,
      upstreamPattern: null,
      downstreamPattern: null,
      sourceRole: 'upstream',
      targetRole: 'downstream',
      notes: '',
    };
  }

  const mainMeta = RELATIONSHIP_META[initial.relationshipType];

  let baseType = initial.relationshipType;
  let upstreamPattern = initial.upstreamType ?? null;
  let downstreamPattern = initial.downstreamType ?? null;

  if (mainMeta.category === 'upstream-pattern') {
    baseType = RelationshipType.CustomerSupplier;
    upstreamPattern = upstreamPattern ?? initial.relationshipType;
  } else if (mainMeta.category === 'downstream-pattern') {
    baseType = RelationshipType.CustomerSupplier;
    downstreamPattern = downstreamPattern ?? initial.relationshipType;
  }

  return {
    baseType,
    upstreamPattern,
    downstreamPattern,
    sourceRole: initial.sourceRole,
    targetRole: initial.targetRole,
    notes: initial.notes,
  };
}

export default function RelationshipDialog({
  open,
  sourceName,
  targetName,
  initial,
  onConfirm,
  onCancel,
}: RelationshipDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [baseType, setBaseType] = useState<RelationshipType>(RelationshipType.CustomerSupplier);
  const [upstreamPattern, setUpstreamPattern] = useState<RelationshipType | null>(null);
  const [downstreamPattern, setDownstreamPattern] = useState<RelationshipType | null>(null);
  const [sourceRole, setSourceRole] = useState<Role>('upstream');
  const [targetRole, setTargetRole] = useState<Role>('downstream');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      const n = normalizeInitial(initial);
      setBaseType(n.baseType);
      setUpstreamPattern(n.upstreamPattern);
      setDownstreamPattern(n.downstreamPattern);
      setSourceRole(n.sourceRole);
      setTargetRole(n.targetRole);
      setNotes(n.notes);
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open, initial]);

  const baseMeta = RELATIONSHIP_META[baseType];
  const isSymmetric = baseMeta.symmetric;

  const handleBaseTypeSelect = (type: RelationshipType) => {
    setBaseType(type);
    const m = RELATIONSHIP_META[type];
    if (m.symmetric) {
      setSourceRole('none');
      setTargetRole('none');
      setUpstreamPattern(null);
      setDownstreamPattern(null);
    } else if (sourceRole === 'none') {
      setSourceRole('upstream');
      setTargetRole('downstream');
    }
  };

  const toggleDirection = () => {
    setSourceRole((prev) => (prev === 'upstream' ? 'downstream' : 'upstream'));
    setTargetRole((prev) => (prev === 'upstream' ? 'downstream' : 'upstream'));
  };

  const upstreamName = sourceRole === 'upstream' ? sourceName : targetName;
  const downstreamName = sourceRole === 'downstream' ? sourceName : targetName;

  const descriptionType = upstreamPattern ?? downstreamPattern ?? baseType;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      relationshipType: baseType,
      upstreamType: isSymmetric ? null : (upstreamPattern ?? null),
      downstreamType: isSymmetric ? null : (downstreamPattern ?? null),
      sourceRole,
      targetRole,
      notes: notes.trim(),
    });
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      className="rounded-xl shadow-2xl border border-gray-200 p-0 backdrop:bg-black/30 w-[480px] max-w-[calc(100vw-2rem)]"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">

        {/* Header */}
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            {initial ? 'Edit' : 'New'} Relationship
          </h2>
          <p className="text-sm text-gray-400 mt-0.5 truncate">
            {sourceName} &harr; {targetName}
          </p>
        </div>

        {/* Base type grid */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Type
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {baseTypes.map((type) => {
              const m = RELATIONSHIP_META[type];
              const isSelected = baseType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleBaseTypeSelect(type)}
                  className={`
                    rounded-lg border-2 px-2 py-2 text-center transition-colors
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  <span className="block text-xs font-bold text-gray-800 leading-tight">{m.abbreviation}</span>
                  <span className="block text-[10px] text-gray-400 mt-0.5 leading-tight">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed -mt-2">
          {RELATIONSHIP_META[descriptionType].description}
        </p>

        {/* Direction + patterns for directional types */}
        {!isSymmetric && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              Direction &amp; Patterns
            </p>

            {/* Direction card */}
            <div className="rounded-lg border border-gray-200 overflow-hidden mb-2">
              <div className="flex items-stretch">
                {/* Source context */}
                <div className="flex-1 min-w-0 px-3 py-2.5 bg-white">
                  <span className={`block text-[10px] font-bold uppercase tracking-wide mb-0.5 ${
                    sourceRole === 'upstream' ? 'text-blue-500' : 'text-orange-500'
                  }`}>
                    {sourceRole === 'upstream' ? 'Upstream' : 'Downstream'}
                  </span>
                  <span className="block text-sm font-medium text-gray-800 truncate" title={sourceName}>
                    {sourceName}
                  </span>
                </div>

                {/* Swap button */}
                <div className="flex items-center px-2 bg-gray-50 border-x border-gray-200 shrink-0">
                  <button
                    type="button"
                    onClick={toggleDirection}
                    title="Swap upstream / downstream"
                    className="text-gray-400 hover:text-gray-700 transition-colors text-base leading-none"
                  >
                    ⇄
                  </button>
                </div>

                {/* Target context */}
                <div className="flex-1 min-w-0 px-3 py-2.5 bg-white text-right">
                  <span className={`block text-[10px] font-bold uppercase tracking-wide mb-0.5 ${
                    targetRole === 'upstream' ? 'text-blue-500' : 'text-orange-500'
                  }`}>
                    {targetRole === 'upstream' ? 'Upstream' : 'Downstream'}
                  </span>
                  <span className="block text-sm font-medium text-gray-800 truncate" title={targetName}>
                    {targetName}
                  </span>
                </div>
              </div>
            </div>

            {/* Per-side pattern selectors */}
            <div className="rounded-lg border border-gray-200 overflow-hidden">

              {/* Upstream row */}
              <div className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-100">
                <div className="w-28 shrink-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-blue-500">
                    Upstream
                  </span>
                  <span className="block text-xs text-gray-500 truncate" title={upstreamName}>
                    {upstreamName}
                  </span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setUpstreamPattern(null)}
                    className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                      upstreamPattern === null
                        ? 'border-blue-400 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                    }`}
                  >
                    none
                  </button>
                  {upstreamPatterns.map((t) => {
                    const m = RELATIONSHIP_META[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setUpstreamPattern(upstreamPattern === t ? null : t)}
                        title={m.label}
                        className={`px-2.5 py-1 rounded-md text-xs border font-semibold transition-colors ${
                          upstreamPattern === t
                            ? 'border-blue-500 bg-blue-100 text-blue-800'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {m.abbreviation}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Downstream row */}
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className="w-28 shrink-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-orange-500">
                    Downstream
                  </span>
                  <span className="block text-xs text-gray-500 truncate" title={downstreamName}>
                    {downstreamName}
                  </span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setDownstreamPattern(null)}
                    className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                      downstreamPattern === null
                        ? 'border-orange-400 bg-orange-50 text-orange-700 font-semibold'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                    }`}
                  >
                    none
                  </button>
                  {downstreamPatterns.map((t) => {
                    const m = RELATIONSHIP_META[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setDownstreamPattern(downstreamPattern === t ? null : t)}
                        title={m.label}
                        className={`px-2.5 py-1 rounded-md text-xs border font-semibold transition-colors ${
                          downstreamPattern === t
                            ? 'border-orange-500 bg-orange-100 text-orange-800'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {m.abbreviation}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            placeholder="Integration details, constraints..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
          >
            {initial ? 'Save' : 'Create'}
          </button>
        </div>

      </form>
    </dialog>
  );
}
