# Architecture

## Folder layout (`src/`)

| Folder | Holds | Rule |
|---|---|---|
| `types/` | Domain types (`context-map.ts`) | The single source of the model's shape. No logic. |
| `constants/` | Static domain data (relationship metadata, colours) | Data only. |
| `schema/` | `context-map.schema.json` — the JSON export/import schema | Must stay in step with `types/`. |
| `utils/` | Pure functions: layout, import/export parsing and generation, ids | No React, no DOM state; easy to unit-test. Browser side effects (downloads) stay in small, separate functions. |
| `hooks/` | React hooks that own state and wire utils to the UI (`useContextMap`, `useFocusMode`, `use*Import/Export`) | Logic belongs in `utils/`; a hook orchestrates. |
| `components/<Area>/` | UI grouped by area: `Canvas/`, `SelectionPanel/`, `Toolbar/` | Presentational; receive data and callbacks via props. |
| `components/ui/` | Shared presentational primitives used by more than one area (button roles: `PrimaryButton`, `SecondaryButton`, `ModeActiveButton`) | One component per file; no domain logic. |
| `App.tsx` | Composition root: wires hooks to components | |

New behaviour goes into the folder its role dictates. Put non-trivial logic in a pure `utils/` function
first, then call it from a hook.

## State

- The context map (bounded-context nodes and relationship edges) is owned by `useContextMap`.
  Components never keep their own copy of the map.
- Derived views (e.g. focus mode) filter what is handed to the canvas and never change the
  underlying map. Persistence and export always see the full map.
- **One mutation path.** Every change to the map goes through a function returned by `useContextMap`.
  Components and other hooks never call React Flow's `setNodes`/`setEdges` or write to storage
  directly. This is what makes undo/redo, persistence and import consistent.
- **Map state and UI state are separate.** `useContextMap` owns the map (contexts, relationships,
  positions). Selection is React Flow's `selected` flag on nodes and edges, read by deriving from
  the map (as focus mode does), never kept as a second copy; the element being edited is the selected
  one. Open panels and view modes live in their own hooks.
- **Canvas renderers get behaviour through context.** A custom React Flow node or edge component that
  needs to change the map gets the mutation from a React context provided above `<ReactFlow>`, never
  from a function stored in node/edge `data`: `data` stays the serializable domain shape that
  persistence, import and export read.

## Persistence

- The map is saved to `localStorage` under one key (`context-map-data`) and restored on start.
- Loading must tolerate older stored shapes: normalise legacy data on load rather than discarding it.

## File formats

- **JSON** is the canonical exchange format, validated against `src/schema/context-map.schema.json`
  with Ajv on import. Bump `CONTEXT_MAP_JSON_VERSION` and the schema's `version` only for
  backward-incompatible changes. A new optional field is not a version bump.
- **Markdown** export/import follows the context-map table format in `docs/domain/context-map.md`.
  The `Type` column grammar is `<Pattern Name> (<CODE>) [U:<CODE> D:<CODE>]`.
- A change to the map's model touches `types/`, the schema, and both import and export in the same change.

## Desktop shell (`src-tauri/`)

The Tauri shell only hosts the built web app. Keep app logic in `src/`; add Rust only for
capabilities the browser cannot provide.

## Styling

Tailwind utility classes inline in JSX; `index.css` only for globals and React Flow overrides.
