import type { Clarity, Role } from '../types/context-map';

/** Stroke colours for a relationship edge, keyed by its clarity. */
export const CLARITY_COLORS: Record<Clarity, { normal: string; selected: string }> = {
  clear:               { normal: '#22c55e', selected: '#15803d' },
  unsure:              { normal: '#3b82f6', selected: '#1d4ed8' },
  'needs-improvement': { normal: '#ef4444', selected: '#b91c1c' },
};

/** Stroke colour for an edge whose clarity is not set. */
export const CLARITY_UNSET_STROKE: { normal: string; selected: string } = {
  normal: '#64748b',
  selected: '#3b82f6',
};

/** Colours and classes for the upstream/downstream relationship roles. */
export const ROLE_COLORS: Record<Extract<Role, 'upstream' | 'downstream'>, {
  hex: string;
  textClass: string;
  badgeClass: string;
}> = {
  upstream:   { hex: '#3b82f6', textClass: 'text-blue-500', badgeClass: 'bg-blue-500 text-white' },
  downstream: { hex: '#f97316', textClass: 'text-orange-500', badgeClass: 'bg-orange-500 text-white' },
};
