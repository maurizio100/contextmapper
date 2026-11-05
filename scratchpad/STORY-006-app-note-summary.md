Fixed `handleAddContext` creating a bounded context with an empty name: it now seeds
`NEW_CONTEXT_NAME` ("New context") from `src/constants/canvas.ts`, and the name field selects its
text on open so typing replaces it. Added acceptance coverage for both the selected-default-name
case and a new context left deselected without typing.
