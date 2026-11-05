# ContextMapping — glossary

Terms specific to this context. Shared terms and cross-context collisions are in
[`../../glossary.md`](../../glossary.md).

| Term | Definition | Source | Notes |
|------|------------|--------|-------|
| Bounded Context | A box on the context map with a name, a description and a colour. | owner-notes L2, code:context-map.ts | The owner says "context" |
| Canvas Fields | A bounded context's purpose, key terms and business decisions, recorded alongside its name and description. | STORY-011 | Planned; shown in the context's details, not on the canvas |
| Clarity | How well understood a relationship is: clear, unsure or needs-improvement. | code:context-map.ts | |
| Context Map | The drawing the modeller produces: a set of bounded contexts and the relationships between them. | owner-notes L1, code:context-map.schema.json | |
| Dependency Trace | Highlighting every bounded context a context transitively depends on (upstream) or that depends on it (downstream). | STORY-016 | Planned; symmetric relationships are followed both ways |
| Domain Classification | The strategic category of a bounded context: core, supporting or generic. | STORY-009 | Planned; optional, independent of the colour |
| Export / Import | Saving or loading a context map as JSON (schema version 1) or Markdown. | code:hooks | Not mentioned by the owner |
| External System | A bounded context the organisation does not own, such as a third-party or legacy system. | STORY-012 | Planned; a marker on the context |
| Focus Mode | Restricting the canvas to one context plus its direct neighbours, or to exactly the selected contexts, without changing the underlying map. | owner-notes L4, code:useFocusMode.ts | The owner says "zoom into a context snippet" |
| Lens | A way of viewing the context map that highlights the bounded contexts or relationships with one property value and dims the rest, without changing the map. | STORY-017 | Planned; one lens at a time (clarity, domain classification, owning team, relationship type) |
| Modeller | The person using the app to draw a context map. | owner-notes L1 | Implied; the owner does not name the user |
| Owning Team | The team responsible for a bounded context. | STORY-010 | Planned; optional, matched regardless of case |
| Pattern Hint | A non-blocking notice on a relationship whose patterns contradict each other. | STORY-013 | Planned |
| Relationship | A connection between two bounded contexts carrying a relationship type, upstream/downstream roles, notes and a clarity rating. | owner-notes L3, code:context-map.ts | |
| Relationship Type | The strategic DDD pattern of a relationship: Shared Kernel, Customer-Supplier, Conformist, Anticorruption Layer, Open Host Service, Published Language, Partnership, Separate Ways or Big Ball of Mud. | code:relationships.ts | Grouped as symmetric, directional base, upstream pattern or downstream pattern |
| Role | A bounded context's side of a relationship: upstream, downstream or none. | code:context-map.ts | |
| Saved View | A named combination of focus, lens and position on the context map that can be restored later. | STORY-018 | Planned; travels with the context map on export |
