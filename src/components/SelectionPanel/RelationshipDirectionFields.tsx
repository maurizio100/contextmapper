import { RelationshipType, type Role } from '../../types/context-map';
import { RELATIONSHIP_META } from '../../constants/relationships';
import { ROLE_COLORS } from '../../constants/colors';

const upstreamPatterns = (Object.values(RelationshipType) as RelationshipType[]).filter(
  (t) => RELATIONSHIP_META[t].category === 'upstream-pattern'
);

const downstreamPatterns = (Object.values(RelationshipType) as RelationshipType[]).filter(
  (t) => RELATIONSHIP_META[t].category === 'downstream-pattern'
);

interface RelationshipDirectionFieldsProps {
  sourceName: string;
  targetName: string;
  sourceRole: Role;
  targetRole: Role;
  upstreamPattern: RelationshipType | null;
  downstreamPattern: RelationshipType | null;
  onToggleDirection: () => void;
  onUpstreamPatternChange: (type: RelationshipType | null) => void;
  onDownstreamPatternChange: (type: RelationshipType | null) => void;
}

/** The direction card (source/target with a swap button) and the per-side pattern pickers. */
export default function RelationshipDirectionFields({
  sourceName,
  targetName,
  sourceRole,
  targetRole,
  upstreamPattern,
  downstreamPattern,
  onToggleDirection,
  onUpstreamPatternChange,
  onDownstreamPatternChange,
}: RelationshipDirectionFieldsProps) {
  const upstreamName = sourceRole === 'upstream' ? sourceName : targetName;
  const downstreamName = sourceRole === 'downstream' ? sourceName : targetName;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
        Direction &amp; Patterns
      </p>

      {/* Direction card */}
      <div className="rounded-lg border border-gray-200 overflow-hidden mb-2">
        <div className="flex items-stretch">
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

          <div className="flex items-center px-2 bg-gray-50 border-x border-gray-200 shrink-0">
            <button
              type="button"
              onClick={onToggleDirection}
              title="Swap upstream / downstream"
              className="text-gray-400 hover:text-gray-700 transition-colors text-base leading-none"
            >
              ⇄
            </button>
          </div>

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
            <span className={`block text-[10px] font-bold uppercase tracking-wide ${ROLE_COLORS.upstream.textClass}`}>
              Upstream
            </span>
            <span className="block text-xs text-gray-500 truncate" title={upstreamName}>
              {upstreamName}
            </span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              aria-pressed={upstreamPattern === null}
              onClick={() => onUpstreamPatternChange(null)}
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
                  aria-pressed={upstreamPattern === t}
                  onClick={() => onUpstreamPatternChange(upstreamPattern === t ? null : t)}
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
            <span className={`block text-[10px] font-bold uppercase tracking-wide ${ROLE_COLORS.downstream.textClass}`}>
              Downstream
            </span>
            <span className="block text-xs text-gray-500 truncate" title={downstreamName}>
              {downstreamName}
            </span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              aria-pressed={downstreamPattern === null}
              onClick={() => onDownstreamPatternChange(null)}
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
                  aria-pressed={downstreamPattern === t}
                  onClick={() => onDownstreamPatternChange(downstreamPattern === t ? null : t)}
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
  );
}
