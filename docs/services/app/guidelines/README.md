# app — guidelines

Conventions for `app`, in one place. **Each file states the rule as it is now — no dates, no
history, no ticket references.** Why a rule exists and when it changed belongs in
[`../decisions/`](../decisions/README.md); this folder only says what is true today.

| File | Covers |
|---|---|
| [`architecture.md`](architecture.md) | Folder layout, where state lives, persistence, the JSON/Markdown file formats, the Tauri shell |
| [`naming.md`](naming.md) | File, component, hook, type and constant naming; domain vocabulary in code |
| [`code-quality.md`](code-quality.md) | Quality gate, where logic lives, normalising at the boundary, types, React rules, duplication and constants, scope of a change |
| [`testing.md`](testing.md) | Vitest + Testing Library setup, test levels, acceptance tests per story, builders |

A rule here applies to the whole component. Only rules that are **persistent and non-obvious from
the code** belong here — not the name of one class, not something the next refactor changes.
