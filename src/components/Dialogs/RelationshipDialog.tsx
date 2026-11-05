import { useEffect, useRef, useState } from 'react';
import { RelationshipType, type Clarity, type RelationshipData, type Role } from '../../types/context-map';
import { RELATIONSHIP_META } from '../../constants/relationships';
import { CLARITY_COLORS, ROLE_COLORS } from '../../constants/colors';
import PrimaryButton from '../ui/PrimaryButton';
import SecondaryButton from '../ui/SecondaryButton';

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

interface RelationshipDialogProps {
  open: boolean;
  dialogKey?: string;
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
  clarity: Clarity | undefined;
} {
  if (!initial) {
    return {
      baseType: RelationshipType.CustomerSupplier,
      upstreamPattern: null,
      downstreamPattern: null,
      sourceRole: 'upstream',
      targetRole: 'downstream',
      notes: '',
      clarity: undefined,
    };
  }

  const baseType = initial.relationshipType;
  const upstreamPattern = initial.upstreamType ?? null;
  const downstreamPattern = initial.downstreamType ?? null;

  return {
    baseType,
    upstreamPattern,
    downstreamPattern,
    sourceRole: initial.sourceRole,
    targetRole: initial.targetRole,
    notes: initial.notes,
    clarity: initial.clarity,
  };
}

export default function RelationshipDialog({
  open,
  dialogKey,
  sourceName,
  targetName,
  initial,
  onConfirm,
  onCancel,
}: RelationshipDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      className="rounded-xl shadow-2xl border border-gray-200 p-0 backdrop:bg-black/30 w-[480px] max-w-[calc(100vw-2rem)]"
    >
      <RelationshipDialogForm
        key={dialogKey ?? 'new'}
        sourceName={sourceName}
        targetName={targetName}
        initial={initial}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </dialog>
  );
}

interface RelationshipDialogFormProps {
  sourceName: string;
  targetName: string;
  initial?: RelationshipData;
  onConfirm: (data: RelationshipData) => void;
  onCancel: () => void;
}

function RelationshipDialogForm({
  sourceName,
  targetName,
  initial,
  onConfirm,
  onCancel,
}: RelationshipDialogFormProps) {
  const n = normalizeInitial(initial);
  const [baseType, setBaseType] = useState<RelationshipType>(n.baseType);
  const [upstreamPattern, setUpstreamPattern] = useState<RelationshipType | null>(n.upstreamPattern);
  const [downstreamPattern, setDownstreamPattern] = useState<RelationshipType | null>(n.downstreamPattern);
  const [sourceRole, setSourceRole] = useState<Role>(n.sourceRole);
  const [targetRole, setTargetRole] = useState<Role>(n.targetRole);
  const [notes, setNotes] = useState(n.notes);
  const [clarity, setClarity] = useState<Clarity | undefined>(n.clarity);

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
      clarity,
    });
  };

  return (
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
                    sourceRole === 'upstream' ? ROLE_COLORS.upstream.textClass : ROLE_COLORS.downstream.textClass
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
                    targetRole === 'upstream' ? ROLE_COLORS.upstream.textClass : ROLE_COLORS.downstream.textClass
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

        {/* Clarity */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Clarity
          </p>
          <div className="flex gap-2">
            {CLARITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setClarity(clarity === opt.value ? undefined : opt.value)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-colors
                  ${clarity === opt.value
                    ? opt.activeClass
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 bg-white'}
                `}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: opt.color }}
                />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <SecondaryButton type="button" onClick={onCancel} className="px-4 py-2 rounded-lg">
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" className="px-4 py-2 rounded-lg">
            {initial ? 'Save' : 'Create'}
          </PrimaryButton>
        </div>

      </form>
  );
}
