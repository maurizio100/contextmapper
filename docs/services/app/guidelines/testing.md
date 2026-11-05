# Testing

**Stack:** Vitest (jsdom environment) + `@testing-library/react` + `@testing-library/user-event` +
`@testing-library/jest-dom`. Run with `npm test` (`vitest run`). Every change must also pass
`npm run lint` and `npm run build` (type check).

## Levels

| Level | Tests | Lives in |
|---|---|---|
| Unit | Pure functions in `utils/` (layout, JSON/Markdown import and export, round-trips) and hooks via `renderHook` | Co-located: `<file>.test.ts` next to the source |
| Component | One component rendered in isolation, driven through Testing Library queries and `userEvent` | Co-located: `<Component>.test.tsx` |
| Acceptance | One test per Gherkin scenario of a story. Black-box: render `<App />`, act as the modeller, assert on what the user sees | `src/acceptance/<feature-kebab>.test.tsx`; `describe('STORY-NNN <title>')`, one `it` per scenario named after it |

## Rules

- Query by role, label or text (`getByRole`, `getByLabelText`). Use `data-testid` only for canvas
  elements that have no accessible name, named `bounded-context-<name>` / `relationship-<source>-<target>`.
- Don't assert on React Flow internals or pixel positions, except in layout unit tests.
- Reset `localStorage` before each test (in `src/test/setup.ts`).
- React Flow in jsdom needs `ResizeObserver` and `DOMMatrixReadOnly` stubs, which live in `src/test/setup.ts`.
- Test data comes from builders in `src/test/builders.ts`: `aBoundedContext({...})`,
  `aRelationship({...})`, `aContextMap({...})`, all with sensible defaults and partial overrides.
