# Code quality

## Quality gate
- `npm test`, `npm run lint` and `npm run build` pass on every commit to `main` — no "fix lint later".
- Generated and build output (`dist/`, `src-tauri/target/`) is excluded from linting.
- An `eslint-disable` needs a comment on the same line saying why the rule doesn't apply here.

## Where logic lives
- Domain rules (which pattern applies to which side, role naming, legacy-shape resolution, placement
  of new contexts) are pure functions in `utils/` with unit tests. Components render their results;
  they don't compute them.
- Legacy and imported data is normalised at the boundary — on load from storage and on import.
  Rendering, editing and export code sees only the current shape and contains no compatibility branches.
- No module-level mutable state. State shared between components goes through props, a hook or context.
- Browser side effects (file download, file picker, clipboard) live in one small helper each and are
  reused, never re-implemented per format.

## Types
- No `any`. `as` casts on domain data only at a validated boundary (after schema validation or
  normalisation), never to silence the compiler elsewhere.
- Lookup tables over a union are typed `Record<TheUnion, …>` so a new member fails the build until handled.

## React
- Follow the `react-hooks` lint rules as errors. Typical fixes: reset a form by remounting it with a
  `key` instead of setting state in an effect; derive values during render instead of syncing them in effects.
- A component file exports components only; shared helpers go to `utils/` or a sibling non-component file.
- A component over ~200 lines, or one doing two jobs (e.g. layout and a form section), is split.
- A hook returns a focused API; when the return grows past ~10 members, look for the second concern inside it.

## Duplication and constants
- Values with domain meaning — clarity colours, role colours, pattern abbreviations — are defined once
  in `constants/` and imported everywhere they are used, including the UI, exports and legends.
- Repeated UI with one meaning is one component: buttons per role (see
  [`../design-guidelines.md`](../design-guidelines.md)), edge badges, dialog/panel field sections.
- Numbers with meaning are named constants (`FIT_VIEW_PADDING`, `NEW_CONTEXT_JITTER`), not inline literals.

## Scope of a change
- A story leaves the code it touches no worse and fixes violations of these rules in the lines it changes.
- Cleanup beyond that goes into its own chore story, not into an unrelated feature change.
