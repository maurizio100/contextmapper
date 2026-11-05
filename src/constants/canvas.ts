/** Shared React Flow `fitView` options, used after any change to what is shown. */
export const FIT_VIEW_OPTIONS = { padding: 0.2 };

/** Placement of a newly added context relative to the viewport centre. */
export const NEW_CONTEXT_OFFSET_X = 90;
export const NEW_CONTEXT_OFFSET_Y = 40;
/** Default name given to a newly added bounded context, so one left untyped is never nameless. */
export const NEW_CONTEXT_NAME = 'New context';
/** Random jitter range (px) applied on top of the offset so stacked contexts don't overlap exactly. */
export const NEW_CONTEXT_JITTER_RANGE = 40;
