# Context Mapper

A desktop (Tauri) and web app for visually modelling DDD context maps — bounded contexts, their relationships, and JSON/Markdown import/export.

## Tech stack

- TypeScript 5.9 (strict), React 19, Vite 7, Tailwind CSS 4
- @xyflow/react 12 (canvas), @dagrejs/dagre (auto-layout), Ajv (JSON schema validation), html-to-image (PNG export)
- Tauri 2 (Rust) as a thin desktop shell around the web app
- Persistence: browser `localStorage` only. No backend.
- Tests: Vitest + Testing Library (not set up yet; the first story with tests sets it up)

## How to run things

```
npm install
npm run dev            # web app on the Vite dev server
npm run tauri:dev      # desktop app
npm test               # Vitest (once set up)
npm run lint           # ESLint
npm run build          # type check + production build
npm run tauri:build    # desktop bundle
```

A change is done when `npm test`, `npm run lint` and `npm run build` all pass.

## Domain at a glance

<!-- Owned and kept current by the domain-artifacts skill. Do not write it by hand. -->
Context Mapper is a deliberately simple tool for drawing DDD context maps. One actor, the **Modeller**,
works in a single bounded context, **ContextMapping**. Core flow: add bounded contexts → connect them
with relationships (DDD pattern, upstream/downstream roles, clarity) → focus on a context snippet →
export/import as JSON or Markdown. Full model: `docs/domain/`.

## Where things live

- `docs/domain/` — bounded contexts, glossary, context map
- `docs/arc42/` — architecture documentation (intentionally not maintained: the app is one simple component)
- `docs/adr/` — architecture decision records
- `docs/services/<component>/` — per-component docs; start at its `README.md` (purpose + index
  of that component's documents)

## Per-component conventions

Each component's docs live in its own folder, fronted by a `README.md` that states the component's
purpose and indexes the folder's documents. Before working on a story, read the `README.md` of the
component(s) it touches and open only the documents its index points you at:
- `docs/services/app/README.md` — the whole app: React canvas for drawing context maps, plus the Tauri desktop shell

## Conventions

- **Every source code change must be motivated by a story.** Use `gherkin-story-authoring` for
  behavioral changes (new features, rule changes) and `chore-story` for non-behavioral changes
  (layout tweaks, refactorings, dependency updates, tooling).
- Story IDs: `STORY-NNN` / Epic IDs: `EPIC-NNN` / ADR IDs: `NNNN`
- Branch names: `STORY-NNN-kebab-case-title`
- Commit messages: Conventional Commits with `Refs: STORY-NNN` in footer
- One change request per story, draft while in progress, squash on merge
- Default branch: `main`
