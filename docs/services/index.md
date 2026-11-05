# Services

Per-component implementation conventions — coding style, test conventions, and anything
else that is code-adjacent and too volatile for the architecture chapters.

Each component has a folder under `docs/services/` fronted by a `README.md` that states the
component's purpose and indexes that folder's documents. Start there: read the component's
`README.md` and let its index tell you which document to open next.

Use the `component-docs` skill to add or revise a component's documents — it keeps the index
in step.

## Components

- [app](app/README.md) — the whole Context Mapper app: React canvas for drawing context maps, plus the Tauri desktop shell.
