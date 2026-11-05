# Context: ContextMapping

Drawing and editing a context map: the modeller adds bounded contexts to a canvas, connects them with
strategic DDD relationships, focuses on part of the map to discuss it in isolation, and imports or
exports the map. The application is deliberately simple; drawing context maps is its whole purpose.

Terms: [`glossary.md`](glossary.md) — this context's own vocabulary, in the folder beside this file.

## Participants
- Modeller — the person using the app to draw and maintain a context map

## Behaviour
- Add bounded contexts to the context map (owner-notes L2).
- Add relationships between two bounded contexts, choosing a relationship type, roles, notes and clarity (owner-notes L3).
- Focus on a context snippet: one context with its direct neighbours, or exactly the selected contexts. The underlying map stays unchanged (owner-notes L4, code:useFocusMode.ts).
- Export and import the context map as JSON (schema version 1) or Markdown (code only; the owner did not mention it).
