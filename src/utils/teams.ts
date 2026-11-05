import type { BoundedContextNode } from '../types/context-map';

/** Distinct owning teams on the map: trimmed, non-empty, case-insensitive, first spelling kept. */
export function teamsInUse(nodes: BoundedContextNode[]): string[] {
  const seen = new Map<string, string>();
  for (const node of nodes) {
    const team = node.data.owningTeam?.trim();
    if (team && !seen.has(team.toLowerCase())) seen.set(team.toLowerCase(), team);
  }
  return [...seen.values()];
}

/** Trimmed input, mapped to an existing spelling when one matches ignoring case; blank is no team. */
export function canonicalTeam(input: string, teams: string[]): string | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  return teams.find((t) => t.toLowerCase() === trimmed.toLowerCase()) ?? trimmed;
}
