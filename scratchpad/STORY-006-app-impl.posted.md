### Implementation summary: STORY-006
**Mode:** quick-fix
**Red commit:** none — non-behavioural fix, nothing to make fail first
**Suite:** full — `npm test`, `npm run lint`, `npm run build` all green
**Files touched:** 4 — `src/components/Canvas/BoundedContextNode.tsx`, `src/components/Canvas/RelationshipEdge.tsx`, `src/components/Canvas/RelationshipEdge.test.tsx`, `src/acceptance/edit-selected-in-place.test.tsx`
**Learnings:** none
**Findings addressed:** should-fix (test ids) — added `data-testid="bounded-context-<name>"` to `BoundedContextNode`'s root div and `data-testid="relationship-<source>-<target>"` to `RelationshipEdge`'s `BaseEdge`, resolving source/target names via `useReactFlow().getNode`; switched `edit-selected-in-place.test.tsx` off `rf__node-`/`rf__edge-` to the new named ids; updated `RelationshipEdge.test.tsx`'s `useReactFlow` mock to provide `getNode`. No other test used the internal ids (grepped repo-wide).
**Notes for review:** none
**Summary:** unchanged — fix is internal to test tooling, no behavioural or externally-visible change
**Head:** 878ff84
