# app — Design guidelines

How the Context Mapper UI is organised, and where a new feature goes. The goal: a tool that is easy to
use, offers a good set of features, and never overloads the screen — every capability has one obvious
place, and that place is where a modeller would look for it.

Code-level conventions (folder layout, Tailwind usage, naming) live in [`guidelines/`](guidelines/README.md);
this document covers what the user sees and does.

## Principles

1. **The canvas is the product.** Chrome (toolbars, panels, menus) stays small and at the edges. A
   feature that permanently takes canvas space must justify it.
2. **Show what is relevant now.** Controls appear where and when they apply — properties of the
   selection in the panel, edge actions on the edge — not as always-visible buttons.
3. **One obvious place per feature.** A capability lives in exactly one region of the placement map
   below. It may *also* be reachable via a shortcut or the command palette, but it never gets a second
   visible button somewhere else.
4. **Works without setup.** Every new field or feature has a sensible default; an existing map keeps
   working and looks the same until the modeller opts in.
5. **Safe to try.** Every change to the map can be undone; destructive actions need no confirmation
   dialog when they are undoable.
6. **Modes are visible and easy to leave.** Anything that changes what the canvas shows (focus, a
   filter, a saved view) is announced on screen with a one-click way out — as focus mode does today.

## Placement map

The UI has six regions. Every feature belongs to exactly one.

| Region | What belongs here | What does not |
|---|---|---|
| **Main toolbar** (top left) | The few actions used in almost every session: *Add Context*, *Undo/Redo*, *Tidy Up*, *Focus*, and the active-mode indicator. Hard limit: ~6 controls. | Anything used occasionally; anything that acts on one specific element. |
| **File menu** (one toolbar button opening a menu) | Everything about the map as a whole document: import/export in every format, PNG export, and later switching/creating maps. | Editing actions; view changes. |
| **Selection panel** (right side, opens on selection, closes on deselect/Esc) | Viewing and editing the selected context or relationship: all its fields, its list of relationships (upstream/downstream, each clickable to jump), and actions on it (delete, focus on it, trace from it). Multi-selection shows what applies to all. | Map-wide settings; anything that should be visible with nothing selected. |
| **On the canvas** | Direct manipulation only: dragging, connection handles, edge bend points, badges that *encode model data* (pattern abbreviations, clarity, classification). Hover may reveal a small affordance. | Buttons, forms, explanatory text. |
| **View controls** (bottom left, beside the zoom controls; minimap bottom right) | Changing how the map is *displayed* without changing it: zoom/fit, filter lenses, legend, saved views. | Anything that modifies the map. |
| **Command palette** (Cmd/Ctrl+K) | A searchable list of every action, plus search-and-jump to any context. It adds reach, not new features — anything in it also lives in one region above. | Features that exist only in the palette. |

Modal dialogs are reserved for short, blocking interactions: confirming a lossy import, naming a new
map. Creating a context or relationship opens the selection panel on the new element rather than a dialog.

### Where the candidate features go

| Feature | Region |
|---|---|
| Domain classification, owning team, canvas fields, external-system marker | Selection panel (fields); canvas (badge/border encoding) |
| Pattern consistency hints | Selection panel of the affected relationship; a small marker on the edge |
| Undo / redo | Main toolbar + shortcuts |
| Search | Command palette |
| Neighbour navigation, path / dependency tracing | Selection panel (started from the selected context); result shown as a visible mode |
| Filter lenses, legend, saved views | View controls |
| Multiple maps, versions | File menu |

## Adding a feature: the placement test

A story that adds UI answers these in its plan before any code is written:

1. **Which region?** Name it from the placement map. If none fits, that is a design discussion
   (and possibly an update to this document), not a new ad-hoc button.
2. **How often is it used?** Every session → may earn a toolbar slot (and must then name what it
   displaces if the toolbar is full). Occasionally → menu, panel or palette.
3. **Can it extend an existing control** instead of adding one — a new option in an existing menu, a
   new field in the panel, a new lens in the existing filter control?
4. **What does an existing map look like afterwards?** Unchanged until the modeller opts in (principle 4).
5. **Is it undoable, and does it have a shortcut?** A shortcut is required only for frequent actions.

## Interaction patterns

- **Selection drives context.** Click selects and opens the selection panel; double-click on a context
  starts editing its name. Esc clears the selection, then exits the active mode.
- **Keyboard.** Frequent actions have shortcuts, shown in their tooltip and menu entry
  (e.g. `Undo  ⌘Z`). Everything else is reachable through the command palette. The mouse stays the
  primary path; no feature requires a shortcut.
  Standard bindings: ⌘/Ctrl+K palette, ⌘/Ctrl+Z / ⇧⌘Z undo/redo, Delete/Backspace delete selection,
  Esc clear selection / exit mode, F focus selection.
- **Visible modes.** Focus, filters, tracing and saved views show an indicator in the main toolbar
  stating what is hidden ("4 shown, 7 hidden") with an exit control. Only one view mode is active at a
  time, or their combination is stated explicitly in the indicator.
- **Empty states teach.** An empty map shows one short hint (add a context, drag between handles to
  connect); an empty panel section says what would appear there.
- **Labels in the domain's words.** UI text uses the glossary terms
  ([ContextMapping glossary](../../domain/contexts/ContextMapping/glossary.md)): *bounded context*,
  *relationship*, *upstream/downstream*, *clarity* — not invented synonyms.

## Visual consistency

- **Three button roles, one style each:** *primary* (filled blue — at most one per region, e.g. Add
  Context), *secondary* (white with grey border), *mode-active* (filled amber — an active view mode
  and its exit). Icons accompany toolbar labels; icon-only buttons carry a tooltip.
- **Colour means something on the canvas.** A context's colour is the modeller's choice; any colour
  the app assigns by meaning (classification, clarity, hints) comes with a legend in the view controls
  and never reuses a context colour for a different meaning.
- **Canvas text stays short.** Nodes show the name and at most a one-line summary; edges show pattern
  abbreviations. Full descriptions and notes live in the selection panel.

## Where the app does not match yet

The current UI predates these guidelines. Each gap is fixed by its own chore story, not as a side
effect of an unrelated change:

- Toolbar shows 10 buttons, five of them import/export → move import/export/PNG into the File menu.
- No command palette, and no keyboard shortcuts other than undo/redo.
- Button styles are repeated class strings rather than one shared component per role.
