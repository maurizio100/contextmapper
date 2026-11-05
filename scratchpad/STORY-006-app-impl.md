### Implementation summary: STORY-006
**Mode:** hand-back
**Red commit:** none — hand-back fix to existing code, covered by extending the already-green acceptance suite with two new assertions/tests
**Suite:** green — `npm test` (53 passed, 18 files), `npm run lint` clean, `npm run build` clean
**Files touched:** 4 — `src/constants/canvas.ts`, `src/App.tsx`, `src/components/SelectionPanel/BoundedContextFields.tsx`, `src/acceptance/edit-selected-in-place.test.tsx`
**Learnings:** none — bugfix within the already-recorded design, nothing new to record
**Findings addressed:** `src/App.tsx:97-98` nameless new bounded context — `handleAddContext` now passes `NEW_CONTEXT_NAME` ("New context", `src/constants/canvas.ts`) instead of `''`; `BoundedContextFields` selects the name input's text on mount (alongside the existing focus) so typing still replaces the default; updated the "a new bounded context opens with its details ready to fill in" acceptance test to assert the default name plus full text selection, and added a new acceptance test asserting a newly added, untouched, then-deselected context still has a non-empty name on the canvas
**Notes for review:** none
**Summary:** corrected — added the default-name behaviour and its test coverage to "What changes"/"What is tested"
**Head:** {head}
