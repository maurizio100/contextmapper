import { describe, expect, it } from 'vitest';
import { aBoundedContext } from '../test/builders';
import { canonicalTeam, teamsInUse } from './teams';

const ctx = (owningTeam?: string) =>
  aBoundedContext({ data: { name: 'X', description: '', color: '#000', ...(owningTeam !== undefined && { owningTeam }) } });

describe('teamsInUse', () => {
  it('returns distinct teams, keeping the first spelling, ignoring blanks and unset', () => {
    const nodes = [ctx('Team Payments'), ctx(), ctx(' team payments '), ctx('  '), ctx('Platform')];
    expect(teamsInUse(nodes)).toEqual(['Team Payments', 'Platform']);
  });
});

describe('canonicalTeam', () => {
  it('returns undefined for blank input', () => {
    expect(canonicalTeam('   ', ['A'])).toBeUndefined();
    expect(canonicalTeam('', [])).toBeUndefined();
  });
  it('returns the existing spelling on a case-insensitive match', () => {
    expect(canonicalTeam(' team payments ', ['Team Payments'])).toBe('Team Payments');
  });
  it('returns the trimmed input for a new team', () => {
    expect(canonicalTeam(' Growth ', ['Team Payments'])).toBe('Growth');
  });
});
