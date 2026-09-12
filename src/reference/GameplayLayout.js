// Shared by static generation and gameplay so trees cannot grow through crossings.
export const BRIDGES = Object.freeze([
  { id: 'east-west', x: 0, z: -8, axis: 'x', length: 52, width: 8, material: 'stone' },
  { id: 'kerala-west', x: -42, z: 55, axis: 'z', length: 50, width: 8, material: 'wood' },
  { id: 'kerala-east', x: 42, z: 61, axis: 'z', length: 54, width: 8, material: 'wood' },
]);
export const HOARDINGS = Object.freeze([
  { text: 'Welcome to Maharashtra', lines: ['Welcome to', 'Maharashtra'], x: -27, z: -25, color: '#a9592c' },
  { text: 'Welcome to Karnataka', lines: ['Welcome to', 'Karnataka'], x: 27, z: -25, color: '#805538' },
  { text: "God's Own Country: Kerala", lines: ["God's Own Country:", 'Kerala'], x: -53, z: 25, color: '#27604b' },
]);
export function isGameplayClearance(x, z) {
  if (x > -54 && x < -24 && z > -30 && z < -12) return true;
  if (HOARDINGS.some(s => Math.abs(x-s.x) < 11 && Math.abs(z-s.z) < 7)) return true;
  return BRIDGES.some(b => Math.abs(x-b.x) < (b.axis === 'x' ? b.length / 2 + 6 : b.width / 2 + 5) &&
    Math.abs(z-b.z) < (b.axis === 'z' ? b.length / 2 + 6 : b.width / 2 + 5));
}
