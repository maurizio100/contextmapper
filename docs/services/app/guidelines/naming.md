# Naming

| Kind | Convention | Example |
|---|---|---|
| React component file | `PascalCase.tsx`, one component, **default export** | `components/SelectionPanel/BoundedContextFields.tsx` |
| Component props | `interface <Component>Props` | `ToolbarProps` |
| Hook file | `useCamelCase.ts`, **named export** | `hooks/useFocusMode.ts` |
| Util file | `kebab-case.ts`, **named exports** | `utils/markdown-import.ts` |
| Enum-like values | `const` object + derived union type (TS `enum` is not allowed: `erasableSyntaxOnly`) | `RelationshipType` |
| String unions | Lower-case / kebab-case literals | `'needs-improvement'` |
| Module-level constants | `UPPER_SNAKE_CASE` | `RELATIONSHIP_META`, `STORAGE_KEY` |
| Type-only imports | `import type { … }` (`verbatimModuleSyntax`) | |

## Domain vocabulary

Use the terms in [`docs/domain/contexts/ContextMapping/glossary.md`](../../../domain/contexts/ContextMapping/glossary.md)
in code and in the UI: *bounded context*, *relationship*, *relationship type*, *role*
(upstream/downstream), *clarity*, *focus*. In code a bounded context is a `BoundedContextNode` and a
relationship is a `RelationshipEdge` (React Flow node/edge). Don't introduce synonyms such as "box",
"link" or "connection" for these concepts.
