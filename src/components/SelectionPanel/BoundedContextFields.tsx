import { useEffect, useRef, useState } from 'react';
import type { BoundedContextData, BoundedContextNode, DomainClassification } from '../../types/context-map';
import { CONTEXT_COLORS } from '../../constants/relationships';
import { canonicalTeam } from '../../utils/teams';
import { CLASSIFICATION_LABELS, DOMAIN_CLASSIFICATIONS } from '../../constants/classification';

interface BoundedContextFieldsProps {
  node: BoundedContextNode;
  /** Every team on the map: the suggestions. */
  teams: string[];
  /** Teams of the other contexts only: what typed input is matched against. */
  otherTeams: string[];
  onUpdate: (id: string, data: BoundedContextData) => void;
}

/**
 * Fields for the selected bounded context, shown in the selection panel.
 * Every change applies to the map immediately; the name is the one
 * validated field — an empty trimmed name is never committed.
 */
export default function BoundedContextFields({ node, teams, otherTeams, onUpdate }: BoundedContextFieldsProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(node.data.name);
  const [description, setDescription] = useState(node.data.description);
  const [color, setColor] = useState(node.data.color);
  const [team, setTeam] = useState(node.data.owningTeam ?? '');
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    const trimmed = value.trim();
    if (!trimmed) {
      setNameError(true);
      return;
    }
    setNameError(false);
    onUpdate(node.id, { ...node.data, name: trimmed });
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    onUpdate(node.id, { ...node.data, description: value });
  };

  const handleColorChange = (value: string) => {
    setColor(value);
    onUpdate(node.id, { ...node.data, color: value });
  };

  const handleClassificationChange = (value: string) => {
    if (value === '') {
      const rest = { ...node.data };
      delete rest.domainClassification;
      onUpdate(node.id, rest);
      return;
    }
    onUpdate(node.id, { ...node.data, domainClassification: value as DomainClassification });
  };

  const handleTeamChange = (value: string) => {
    setTeam(value);
    const canonical = canonicalTeam(value, otherTeams);
    if (canonical === undefined) {
      const rest = { ...node.data };
      delete rest.owningTeam;
      onUpdate(node.id, rest);
      return;
    }
    onUpdate(node.id, { ...node.data, owningTeam: canonical });
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-gray-900">Bounded Context</h2>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Name</span>
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          placeholder="e.g. Order Management"
        />
        {nameError && (
          <span className="mt-1 block text-xs text-red-600">A bounded context needs a name.</span>
        )}
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Description</span>
        <textarea
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
          placeholder="What does this context handle?"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Domain classification</span>
        <select
          value={node.data.domainClassification ?? ''}
          onChange={(e) => handleClassificationChange(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
        >
          <option value="">Unclassified</option>
          {DOMAIN_CLASSIFICATIONS.map((c) => (
            <option key={c} value={c}>
              {CLASSIFICATION_LABELS[c]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Owning team</span>
        <input
          type="text"
          list="owning-team-options"
          value={team}
          onChange={(e) => handleTeamChange(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          placeholder="e.g. Team Payments"
        />
        <datalist id="owning-team-options">
          {teams.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">Color</legend>
        <div className="flex gap-2 flex-wrap">
          {CONTEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={color === c}
              onClick={() => handleColorChange(c)}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                color === c ? 'border-gray-800 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
