import * as THREE from 'three';

/**
 * Creates a canvas texture billboard with multi-line text.
 */
function makeSignTexture(lines, { bg = '#1a1030', border = '#FFD700', headline = '#FFD700', body = '#e8e0d8' } = {}) {
  const W = 512, H = 256;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');

  // Background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, bg);
  grad.addColorStop(1, '#0d0820');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Double border
  ctx.strokeStyle = border;
  ctx.lineWidth = 8;
  ctx.strokeRect(5, 5, W - 10, H - 10);
  ctx.strokeStyle = 'rgba(255,215,0,0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, W - 28, H - 28);

  // Decorative corner diamonds
  ctx.fillStyle = border;
  for (const [cx2, cy2] of [[18,18],[W-18,18],[18,H-18],[W-18,H-18]]) {
    ctx.beginPath();
    ctx.moveTo(cx2, cy2 - 6);
    ctx.lineTo(cx2 + 6, cy2);
    ctx.lineTo(cx2, cy2 + 6);
    ctx.lineTo(cx2 - 6, cy2);
    ctx.closePath();
    ctx.fill();
  }

  // Text
  ctx.textAlign = 'center';
  const lineCount = lines.length;
  const totalHeight = lineCount <= 1 ? 0 : (H - 60) * 0.7;
  const step = lineCount > 1 ? totalHeight / (lineCount - 1) : 0;
  const startY = lineCount > 1 ? (H - totalHeight) / 2 + 8 : H / 2 + 8;

  lines.forEach((line, i) => {
    const isHeader = i === 0;
    const fontSize = isHeader ? Math.min(34, Math.floor(460 / Math.max(line.length, 1) * 1.8)) : 22;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = isHeader ? headline : body;

    if (isHeader) {
      ctx.shadowColor = 'rgba(255,180,0,0.6)';
      ctx.shadowBlur = 12;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fillText(line, W / 2, startY + i * step);
  });

  return new THREE.CanvasTexture(cv);
}

/**
 * Builds a hoarding (billboard) with a metal frame and sign.
 * @param {THREE.Scene} scene
 * @param {number} x
 * @param {number} y  - base Y (usually 0)
 * @param {number} z
 * @param {number} rotY - rotation around Y
 * @param {string[]} lines - text lines (first = headline)
 * @param {object} [opts]
 */
function createHoarding(scene, x, y, z, rotY, lines, opts = {}) {
  const group = new THREE.Group();

  const POLE_H   = 5.5;
  const SIGN_W   = 7.5;
  const SIGN_H   = 3.4;
  const POLE_SEP = 3.0;

  const metalMat = new THREE.MeshLambertMaterial({ color: '#555566' });
  const boardMat = new THREE.MeshLambertMaterial({ color: '#1a1030' });

  // Poles
  for (const sx of [-POLE_SEP / 2, POLE_SEP / 2]) {
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.22, POLE_H, 0.22), metalMat);
    pole.position.set(sx, POLE_H / 2, 0);
    pole.castShadow = true;
    group.add(pole);
  }

  // Cross brace
  const brace = new THREE.Mesh(new THREE.BoxGeometry(POLE_SEP + 0.4, 0.15, 0.15), metalMat);
  brace.position.set(0, POLE_H - 0.8, 0);
  group.add(brace);

  // Sign board backing
  const backing = new THREE.Mesh(new THREE.BoxGeometry(SIGN_W, SIGN_H, 0.18), boardMat);
  backing.position.set(0, POLE_H - SIGN_H / 2 + 0.2, 0);
  backing.castShadow = true;
  group.add(backing);

  // Sign texture plane (front)
  const tex  = makeSignTexture(lines, opts);
  const planeMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.FrontSide });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(SIGN_W - 0.15, SIGN_H - 0.15), planeMat);
  plane.position.set(0, POLE_H - SIGN_H / 2 + 0.2, 0.11);
  group.add(plane);

  // Warm spotlight on sign
  const spot = new THREE.PointLight('#fff5cc', 0.8, 12);
  spot.position.set(0, POLE_H + 0.5, 1.5);
  group.add(spot);

  group.position.set(x, y, z);
  group.rotation.y = rotY;
  scene.add(group);
  return group;
}

// ─────────────────────────────────────────────────────────────────────────────
export class Hoardings {
  constructor(scene) { this.scene = scene; }

  init() {
    const s = this.scene;
    // Platform entrance
    createHoarding(s, -2, 0, 8.5, 0,
      ['BHARAT CENTRAL', 'PLATFORM NO. 1', '🇮🇳 The Great Desi Odyssey 🇮🇳'],
      { border: '#FF9933', headline: '#FF9933' });

    // Maharashtra border (east)
    createHoarding(s, 32, 0, 0, -Math.PI / 2,
      ['WELCOME TO MAHARASHTRA', 'Aamchi Mumbai • Pune • Nagpur', '🚂 Local train stops here'],
      { bg: '#0d1f0d', border: '#FF6600', headline: '#FF6600', body: '#ccffcc' });

    // Kerala border (west)
    createHoarding(s, -32, 0, 0, Math.PI / 2,
      ["GOD'S OWN COUNTRY", 'Kochi • Alappuzha • Munnar', '🌴 Kerala Zone Ahead'],
      { bg: '#001a0d', border: '#00C878', headline: '#00E888', body: '#ccffdd' });

    // Gateway of India
    createHoarding(s, 8, 0, 20, Math.PI / 8,
      ['GATEWAY OF INDIA', 'Colaba, Mumbai — Est. 1924', '⚓ Indo-Saracenic Arch'],
      { bg: '#1a1200', border: '#c8a84b', headline: '#e8c860' });

    // Taj Hotel
    createHoarding(s, -14, 0, 21.5, 0,
      ['THE TAJ MAHAL PALACE', 'Established 1903 — Colaba', '🏨 Heritage Hotel of India'],
      { bg: '#1a0808', border: '#cc4444', headline: '#ff8888' });

    // Marine Drive
    createHoarding(s, -22, 0, 16.5, Math.PI / 5,
      ["MARINE DRIVE", "QUEEN'S NECKLACE", '🌊 Netaji Subhash Chandra Bose Rd']);

    // Munnar Tea
    createHoarding(s, -38, 0, -16, 0,
      ['MUNNAR TEA HIGHLANDS', 'Elevation: 1500m — Idukki District', '☕ Fresh First Flush Tea'],
      { bg: '#0a1a06', border: '#4CAF50', headline: '#8BC34A', body: '#ccffcc' });

    // Alappuzha backwaters
    createHoarding(s, -44, 0, 9, Math.PI / 6,
      ['ALAPPUZHA BACKWATERS', 'Venice of the East', '🛶 Kettuvallam Houseboat Experience'],
      { bg: '#001a1a', border: '#00BCD4', headline: '#4DD0E1' });
  }
}
