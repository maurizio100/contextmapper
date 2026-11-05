## What changes
- Selecting a bounded context or a relationship on the canvas now opens a right-side selection
  panel (`<aside>`) showing its fields, instead of a blocking `ContextDialog`/`RelationshipDialog` modal.
- Edits in the panel apply to the context map immediately as you type/click — no Save button.
- Adding a context, or dragging a new connection between two contexts, creates it with sensible
  defaults right away and selects it (`addNode`/`addEdge` now set `selected: true` on the new
  element and clear `selected` on everything else), opening the panel on the new element.
- A newly added bounded context defaults to the name "New context" (`NEW_CONTEXT_NAME` in
  `src/constants/canvas.ts`), with the name field's text selected on open — typing replaces it,
  and one left untouched and deselected keeps a non-empty name instead of staying nameless.
- Clearing an empty name is rejected: the bounded context keeps its previous name and the panel
  shows "A bounded context needs a name."
- Clicking empty canvas (or Esc) closes the panel, via React Flow's own selection clearing.
- The old `Dialogs/` folder and the now-unused `useMapUIState` hook are removed.

## What is tested
- Acceptance tests for all six scenarios in `src/acceptance/edit-selected-in-place.test.tsx`.
- Acceptance test: a new context opens with the name "New context" selected and focused.
- Acceptance test: a new context deselected without typing still carries a non-empty name.
- Unit test `BoundedContextFields.test.tsx`: an empty name is never committed and never shows
  the error once a valid name is re-typed.
- Unit tests on `useContextMap.test.ts`: `addNode`/`addEdge` select the new element and deselect
  every other node/edge.
- `one-mutation-path.test.tsx` updated for the new immediate-connection flow: connecting two
  nodes selects the new edge and opens the relationship panel; importing JSON while an element
  is selected clears the panel.

Story: STORY-006
