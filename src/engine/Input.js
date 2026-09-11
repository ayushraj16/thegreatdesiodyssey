// Central keyboard state — import this everywhere instead of attaching listeners
export const KEYS = new Set();

window.addEventListener('keydown', e => KEYS.add(e.code));
window.addEventListener('keyup',   e => KEYS.delete(e.code));

/** One-shot "just pressed" detection */
const _edgeSet = new Set();
window.addEventListener('keydown', e => { if (!KEYS.has(e.code)) _edgeSet.add(e.code); });

/**
 * Returns true if a key was pressed this frame (edge-triggered).
 * Call clearEdge() once per frame after checking all edge keys.
 * @param {string} code - KeyboardEvent.code string
 */
export function justPressed(code) { return _edgeSet.has(code); }
export function clearEdge() { _edgeSet.clear(); }
