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

const allTypes = Object.values(RelationshipType);

export default function RelationshipDialog({
  open,
  sourceName,
  targetName,
  initial,
  onConfirm,
  onCancel,
}: RelationshipDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedType, setSelectedType] = useState<RelationshipType>(
    RelationshipType.CustomerSupplier
  );
  const [sourceRole, setSourceRole] = useState<Role>('upstream');
  const [targetRole, setTargetRole] = useState<Role>('downstream');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedType(initial?.relationshipType ?? RelationshipType.CustomerSupplier);
      setSourceRole(initial?.sourceRole ?? 'upstream');
      setTargetRole(initial?.targetRole ?? 'downstream');
      setNotes(initial?.notes ?? '');
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open, initial]);

  const meta = RELATIONSHIP_META[selectedType];

  const handleTypeSelect = (type: RelationshipType) => {
    setSelectedType(type);
    const m = RELATIONSHIP_META[type];
    if (m.symmetric) {
      setSourceRole('none');
      setTargetRole('none');
    } else {
      setSourceRole('upstream');
      setTargetRole('downstream');
    }
  };

  const toggleDirection = () => {
    setSourceRole((prev) => (prev === 'upstream' ? 'downstream' : 'upstream'));
    setTargetRole((prev) => (prev === 'upstream' ? 'downstream' : 'upstream'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      relationshipType: selectedType,
      sourceRole,
      targetRole,
      notes: notes.trim(),
    });
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      className="rounded-xl shadow-2xl border border-gray-200 p-0 backdrop:bg-black/30 max-w-lg w-full"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          {initial ? 'Edit' : 'New'} Relationship
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {sourceName} &harr; {targetName}
        </p>

        <div className="grid grid-cols-3 gap-2 mb-4 max-h-[240px] overflow-y-auto">
          {allTypes.map((type) => {
            const m = RELATIONSHIP_META[type];
            const isSelected = selectedType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeSelect(type)}
                className={`
                  rounded-lg border-2 p-2 text-left transition-colors
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <span className="block text-xs font-bold text-gray-800">{m.abbreviation}</span>
                <span className="block text-xs text-gray-500 mt-0.5 leading-tight">{m.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          {meta.description}
        </div>

        {!meta.symmetric && (
          <div className="mb-4 flex items-center gap-3">
            <div className="flex-1 text-sm">
              <span className="font-medium text-gray-700">{sourceName}</span>
              <span className="text-gray-400 mx-1">=</span>
              <span className={sourceRole === 'upstream' ? 'text-blue-600 font-medium' : 'text-orange-600 font-medium'}>
                {sourceRole}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleDirection}
              className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
            >
              Swap
            </button>
            <div className="flex-1 text-sm text-right">
              <span className="font-medium text-gray-700">{targetName}</span>
              <span className="text-gray-400 mx-1">=</span>
              <span className={targetRole === 'upstream' ? 'text-blue-600 font-medium' : 'text-orange-600 font-medium'}>
                {targetRole}
              </span>
            </div>
          </div>
        )}

        <label className="block mb-5">
          <span className="text-sm font-medium text-gray-700">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            placeholder="Integration details, constraints..."
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium"
          >
            {initial ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
