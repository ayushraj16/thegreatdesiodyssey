import React, { useEffect, useSyncExternalStore } from 'react';

export const ITEMS = Object.freeze([
  { id: 'vada-pav', name: 'Vada Pav', region: 'Maharashtra' },
  { id: 'filter-coffee', name: 'Filter Coffee', region: 'Karnataka' },
  { id: 'banana-chips', name: 'Banana Chips', region: 'Kerala' },
]);

/** Engine-owned store: publish telemetry at 2 Hz, never every animation frame. */
export function createUIStore() {
  let snapshot = Object.freeze({ fps: null, pingMs: null, selected: 0, score: 0, collected: 0, total: 0, lastPickup: null });
  const listeners = new Set();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    set(patch) {
      const next = { ...snapshot, ...patch };
      if (!Number.isInteger(next.selected) || next.selected < 0 || next.selected > 2) {
        throw new RangeError('Inventory selection must be 0, 1, or 2.');
      }
      if (Object.keys(next).every(key => Object.is(next[key], snapshot[key]))) return;
      snapshot = Object.freeze(next);
      listeners.forEach(listener => listener());
    },
  };
}

/** Original vector item art; no remote URLs, emoji, or missing image assets. */
function ItemIcon({ id }) {
  return <svg viewBox="0 0 100 84" width="100%" height="100%" aria-hidden="true">
    {id === 'vada-pav' && <>
      <path d="M18 62Q50 52 82 62L79 74Q49 83 21 73Z" fill="#dba14d" />
      <path d="M18 58L31 54L45 59L59 53L83 59L76 65L60 63L47 67L28 63Z" fill="#479325" />
      <ellipse cx="50" cy="51" rx="29" ry="15" fill="#ce7616" />
      <path d="M18 40Q16 14 48 12Q79 10 83 37L79 44Q48 36 22 47Z" fill="#edaf54" />
      <path d="M23 37Q49 25 78 35L79 43Q49 36 22 47Z" fill="#fff0c5" />
      {[28, 38, 49, 61, 70].map((x, i) => <path key={x} d={`M${x} ${24 + i % 2 * 3}l3 -2`} stroke="#ffdda0" strokeWidth="2" />)}
      <path d="M10 65Q9 79 30 80Q18 73 15 66" fill="#60af25" />
    </>}
    {id === 'filter-coffee' && <>
      <ellipse cx="50" cy="70" rx="35" ry="11" fill="#808f9c" stroke="#e4e9e9" strokeWidth="2" />
      <path d="M25 30L31 68Q50 80 69 68L75 30" fill="#aebbc4" stroke="#eaf1f3" strokeWidth="2" />
      <path d="M35 37L38 69M59 37L58 71" stroke="#f2f4ef" strokeWidth="7" />
      <path d="M47 37L48 73" stroke="#515e67" strokeWidth="8" />
      <ellipse cx="50" cy="29" rx="25" ry="10" fill="#c68e50" stroke="#f1efe5" strokeWidth="3" />
      {[32, 39, 46, 53, 60, 67].map((x, i) => <circle key={x} cx={x} cy={27 + i % 3 * 2} r="2" fill="#f6d79d" />)}
      <path d="M42 18Q34 10 43 3M59 17Q52 9 60 2" fill="none" stroke="#e8eeef" strokeOpacity=".5" strokeWidth="2" />
    </>}
    {id === 'banana-chips' && <>
      <path d="M8 52L69 12L94 59L38 80Z" fill="#438929" />
      <path d="M18 56L81 35M36 44L43 69M51 34L62 63M66 24L78 55" stroke="#84b149" strokeWidth="2" />
      {[[35, 43], [53, 32], [69, 42], [46, 56], [65, 58], [29, 61], [56, 47]].map(([x, y], i) =>
        <g key={i} transform={`rotate(${i * 31} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx="12" ry="8" fill="#f2c331" stroke="#d39612" strokeWidth="2" />
          <path d={`M${x - 4} ${y}h8`} stroke="#bc8a19" strokeWidth="1.5" />
        </g>)}
    </>}
  </svg>;
}

export function GameUI({ store, onSelect }) {
  const { fps, pingMs, selected, score, collected, total, lastPickup } = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => {
    function keydown(event) {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey ||
          event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      const slot = ['Digit1', 'Digit2', 'Digit3'].indexOf(event.code);
      if (slot >= 0) { event.preventDefault(); store.set({ selected: slot }); onSelect?.(ITEMS[slot]); }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [store, onSelect]);
  return <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10, fontFamily: 'system-ui, sans-serif', color: '#f7f7ef' }}>
    <div style={{ position: 'absolute', top: 'max(10px, env(safe-area-inset-top))', left: 'max(12px, env(safe-area-inset-left))', padding: '8px 12px', background: 'rgba(18,29,39,.82)', border: '1px solid #a2b4be', borderRadius: 8, fontWeight: 600, fontSize: 'clamp(12px, 1.4vw, 20px)', fontVariantNumeric: 'tabular-nums' }}>
      WebGL Stats: {fps === null ? '—' : Math.round(fps)} FPS, Ping: {pingMs === null ? '—' : `${Math.round(pingMs)}ms`}
    </div>
    <div style={{ position: 'absolute', top: 66, left: 12, padding: '10px 14px', background: '#142a30df', border: '1px solid #e8c781', borderRadius: 8 }}>
      <div role="status" aria-label="Score" style={{ fontSize: 20, fontWeight: 700 }}>Score: {score}</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>Foods discovered: {collected} / {total}</div>
      {lastPickup && <div aria-live="polite" style={{ fontSize: 12, marginTop: 5, color: '#ffda86' }}>{lastPickup}</div>}
      {total > 0 && collected === total && <div style={{ marginTop: 6, color: '#bfeab3' }}>Odyssey complete!</div>}
    </div>
    <div style={{ position: 'absolute', bottom: 145, left: '50%', transform: 'translateX(-50%)', width: 'max-content', maxWidth: '90vw', textAlign: 'center', padding: '7px 12px', background: '#142a30d9', borderRadius: 8, fontSize: 12 }}>
      WASD / arrows: move · Space: jump · Shift: run · M: map<br />Walk into floating foods to collect them. Use bridges to cross rivers.
    </div>
    <div role="group" aria-label="Regional inventory" style={{ position: 'absolute', bottom: 'max(16px, env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4, padding: 5, background: 'rgba(16,29,36,.83)', border: '2px solid #8c9a9b', borderRadius: 14, boxShadow: '0 4px 20px #0006' }}>
      {ITEMS.map((item, index) => <button key={item.id} type="button" aria-label={`${index + 1}: ${item.name}, ${item.region}`} aria-pressed={selected === index} title={`${item.name} · ${index + 1}`}
        onPointerDown={event => event.stopPropagation()}
        onClick={() => { store.set({ selected: index }); onSelect?.(item); }}
        style={{ pointerEvents: 'auto', position: 'relative', width: 'clamp(76px, 8vw, 124px)', aspectRatio: '1.2', padding: '8px 4px 0', cursor: 'pointer', border: `2px solid ${selected === index ? '#f0d690' : '#748188'}`, borderRadius: 8, background: selected === index ? '#36484bde' : '#17232bba', color: 'inherit' }}>
        <span style={{ position: 'absolute', left: 6, top: 5, fontSize: 15, lineHeight: '20px', padding: '0 5px', border: '1px solid #8b9aa2', borderRadius: 4, background: '#263239' }}>{index + 1}</span>
        <ItemIcon id={item.id} />
      </button>)}
    </div>
  </div>;
}
