import { useEffect, useRef, useState } from 'react';
import type { BoundedContextData } from '../../types/context-map';
import { CONTEXT_COLORS } from '../../constants/relationships';

interface ContextDialogProps {
  open: boolean;
  initial?: BoundedContextData;
  onConfirm: (data: BoundedContextData) => void;
  onCancel: () => void;
}

export default function ContextDialog({
  open,
  initial,
  onConfirm,
  onCancel,
}: ContextDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(CONTEXT_COLORS[0]);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setDescription(initial?.description ?? '');
      setColor(initial?.color ?? CONTEXT_COLORS[0]);
      dialogRef.current?.showModal();
      setTimeout(() => nameRef.current?.focus(), 0);
    } else {
      dialogRef.current?.close();
    }
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm({ name: name.trim(), description: description.trim(), color });
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      className="rounded-xl shadow-2xl border border-gray-200 p-0 backdrop:bg-black/30 max-w-md w-full"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {initial ? 'Edit' : 'New'} Bounded Context
        </h2>

        <label className="block mb-3">
          <span className="text-sm font-medium text-gray-700">Name *</span>
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="e.g. Order Management"
            required
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm font-medium text-gray-700">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            placeholder="What does this context handle?"
          />
        </label>

        <fieldset className="mb-5">
          <legend className="text-sm font-medium text-gray-700 mb-2">Color</legend>
          <div className="flex gap-2 flex-wrap">
            {CONTEXT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${
                  color === c ? 'border-gray-800 scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </fieldset>

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
