# app

The whole Context Mapper application: a React single-page app that draws and edits context maps on a
React Flow canvas, persists the map in the browser's `localStorage`, and imports/exports it as JSON
(versioned schema), Markdown and PNG. A thin Tauri 2 shell packages the same web app as a desktop
app. It has no backend, no accounts and no server-side storage.

- **Bounded context(s):** ContextMapping
- **Building block:** — (no arc42 docs; the whole system is this one component)
- **Code lives in:** `src/` (web app), `src-tauri/` (desktop shell)
- **Tech:** TypeScript 5.9, React 19, Vite 7, Tailwind CSS 4, @xyflow/react 12, dagre, Ajv; Tauri 2 (Rust)
- **Build & test:** `npm test && npm run lint && npm run build`
- **Talks to:** — (the browser's `localStorage` and file download/upload only)

## Documents in this folder

Read this index first and then open **only** the documents your task needs.

| Document | What it contains | Read it when |
| --- | --- | --- |
| `design-guidelines.md` | UX principles, the placement map (which UI region every feature belongs to), the placement test for new features, interaction and visual patterns | Planning or reviewing any story that adds or changes something the user sees |
| `guidelines/` | Architecture (folder layout, state, persistence, file formats), code quality, naming, testing. `guidelines/README.md` indexes them. | Writing or reviewing production or test code in this component |
| `decisions/` | Component-scoped mini-ADRs — decisions binding only this component. `decisions/README.md` indexes them all. | Planning or reviewing a change: scan the index, open the entries that bear on it, and check the change does not contradict one. |
