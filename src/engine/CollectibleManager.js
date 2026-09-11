import * as THREE from 'three';
import { buildVoxelMesh } from './VoxelBuilder.js';

const PICKUP_RADIUS = 1.5;
const RESPAWN_DELAY = 18000; // ms

// ── State bounding boxes (Z-axis based layout) ───────────────────────────────
const MAHARASHTRA_BOUNDS = { xMin: -80, xMax: 80, zMin: -150, zMax: -55 };
const KARNATAKA_BOUNDS   = { xMin: -80, xMax: 80, zMin: -50, zMax: 50 };
const KERALA_BOUNDS      = { xMin: -80, xMax: 80, zMin: 55, zMax: 160 };

function randInBounds(b) {
  return {
    x: b.xMin + Math.random() * (b.xMax - b.xMin),
    z: b.zMin + Math.random() * (b.zMax - b.zMin),
  };
}

// ── Item definitions ──────────────────────────────────────────────────────────
const MAHARASHTRA_DEFS = [
  {
    id: 'vada_pav', name: 'Vada Pav', icon: '🍔',
    description: '🍔 Mumbai ka Vada Pav! +1.7x Speed Dash for 12s!',
    buff: { type: 'speed', multiplier: 1.7, duration: 12000 },
    voxels: [
      [0,0,0,'#C8A882'],[1,0,0,'#C8A882'],[2,0,0,'#C8A882'],
      [0,0,1,'#C8A882'],[1,0,1,'#C8A882'],[2,0,1,'#C8A882'],
      [0,1,0,'#8B4513'],[1,1,0,'#A0522D'],[2,1,0,'#8B4513'],
      [0,1,1,'#A0522D'],[1,1,1,'#8B4513'],[2,1,1,'#A0522D'],
      [0,2,0,'#D4A76A'],[1,2,0,'#E8C08A'],[2,2,0,'#D4A76A'],
      [0,2,1,'#D4A76A'],[1,2,1,'#E8C08A'],[2,2,1,'#D4A76A'],
    ],
  },
  {
    id: 'cutting_chai', name: 'Cutting Chai', icon: '🍵',
    description: '🍵 Half-cup of Mumbai magic! +Shield for 10s!',
    buff: { type: 'shield', multiplier: 1.0, duration: 10000 },
    voxels: [
      [0,0,0,'#E8D5B0'],[1,0,0,'#E8D5B0'],[0,0,1,'#E8D5B0'],[1,0,1,'#E8D5B0'],
      [0,1,0,'#C47A1E'],[1,1,0,'#B8622A'],[0,1,1,'#C47A1E'],[1,1,1,'#A0522D'],
      [0,2,0,'#B8622A'],[1,2,0,'#C47A1E'],[0,2,1,'#C47A1E'],[1,2,1,'#B8622A'],
      [0,3,0,'#D4956A'],[1,3,0,'#D4956A'],[0,3,1,'#D4956A'],[1,3,1,'#D4956A'],
    ],
  }
];

const KARNATAKA_DEFS = [
  {
    id: 'mysore_pak', name: 'Mysore Pak', icon: '🧈',
    description: '🧈 Royal Mysore Pak! 2x Stamina for 12s!',
    buff: { type: 'stamina', multiplier: 2.0, duration: 12000 },
    voxels: [
      [0,0,0,'#F9A602'],[1,0,0,'#F9A602'],[2,0,0,'#F9A602'],[3,0,0,'#F9A602'],
      [0,1,0,'#FFB347'],[1,1,0,'#FFB347'],[2,1,0,'#FFB347'],[3,1,0,'#FFB347'],
      [0,2,0,'#F9A602'],[1,2,0,'#F9A602'],[2,2,0,'#F9A602'],[3,2,0,'#F9A602'],
      [0,0,1,'#E89502'],[1,0,1,'#E89502'],[2,0,1,'#E89502'],[3,0,1,'#E89502'],
      [0,1,1,'#FFB347'],[1,1,1,'#FFB347'],[2,1,1,'#FFB347'],[3,1,1,'#FFB347'],
      [0,2,1,'#E89502'],[1,2,1,'#E89502'],[2,2,1,'#E89502'],[3,2,1,'#E89502'],
    ]
  },
  {
    id: 'filter_kaapi', name: 'Filter Kaapi', icon: '☕',
    description: '☕ Strong Filter Kaapi! +80% Sprint Speed for 10s!',
    buff: { type: 'speed', multiplier: 1.8, duration: 10000 },
    voxels: [
      // Dabarah (bottom saucer/cup)
      [0,0,0,'#B0C4DE'],[1,0,0,'#B0C4DE'],[2,0,0,'#B0C4DE'],
      [0,0,1,'#B0C4DE'],[1,0,1,'#B0C4DE'],[2,0,1,'#B0C4DE'],
      [0,1,0,'#A9A9A9'],[2,1,0,'#A9A9A9'],[0,1,1,'#A9A9A9'],[2,1,1,'#A9A9A9'],
      // Tumbler
      [1,1,0,'#D3D3D3'],[1,1,1,'#D3D3D3'],
      [1,2,0,'#D3D3D3'],[1,2,1,'#D3D3D3'],
      [0,3,0,'#D3D3D3'],[1,3,0,'#D3D3D3'],[2,3,0,'#D3D3D3'],
      [0,3,1,'#D3D3D3'],[1,3,1,'#D3D3D3'],[2,3,1,'#D3D3D3'],
      // Coffee
      [1,3,0,'#3B2F2F'],[1,3,1,'#3B2F2F'],
    ]
  }
];

const KERALA_DEFS = [
  {
    id: 'banana_chips', name: 'Banana Chips', icon: '🍌',
    description: '🍌 Thrissur Nendran chips! +1.5x Speed for 12s!',
    buff: { type: 'speed', multiplier: 1.5, duration: 12000 },
    voxels: [
      [0,0,0,'#D4A017'],[1,0,0,'#D4A017'],[2,0,0,'#D4A017'],
      [0,0,1,'#D4A017'],[1,0,1,'#C8941A'],[2,0,1,'#D4A017'],
      [0,1,0,'#E8B822'],[1,1,0,'#E8B822'],[2,1,0,'#C8941A'],
      [0,1,1,'#D4A017'],[1,1,1,'#F0C830'],[2,1,1,'#E8B822'],
      [0,2,0,'#C8941A'],[1,2,0,'#D4A017'],[0,2,1,'#E8B822'],[1,2,1,'#C8941A'],
    ],
  },
  {
    id: 'tender_coconut', name: 'Tender Coconut', icon: '🥥',
    description: '🥥 Fresh Ilaneer! +Stamina x1.5 for 12s!',
    buff: { type: 'stamina', multiplier: 1.5, duration: 12000 },
    voxels: [
      [1,0,1,'#3A7D44'],[0,1,1,'#3A7D44'],[1,1,0,'#3A7D44'],
      [2,1,1,'#3A7D44'],[1,1,2,'#3A7D44'],
      [0,2,0,'#4CAF50'],[1,2,0,'#4CAF50'],[2,2,0,'#4CAF50'],
      [0,2,1,'#4CAF50'],[1,2,1,'#F5F5DC'],[2,2,1,'#4CAF50'],
      [0,2,2,'#4CAF50'],[1,2,2,'#4CAF50'],[2,2,2,'#4CAF50'],
      [1,3,1,'#2E6B35'],[1,4,1,'#1B5E20'],
    ],
  }
];

// ── Helper: build ring ────────────────────────────────────────────────────────
function makeRing(color) {
  const geo = new THREE.RingGeometry(0.3, 0.5, 16);
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
  const r = new THREE.Mesh(geo, mat);
  r.rotation.x = -Math.PI / 2;
  return r;
}

// ── CollectibleManager ────────────────────────────────────────────────────────
export class CollectibleManager {
  /**
   * @param {THREE.Scene} scene
   * @param {{ banner: HTMLElement, hotbar: HTMLElement }} hud
   */
  constructor(scene, hud) {
    this.scene    = scene;
    this.hud      = hud;
    this.items    = [];    // active scene items
    this.inventory = [];   // collected items
    this._bannerTimer = null;
  }

  init() {
    // Spawn 4-6 items per state, scattered randomly within bounds
    const mahCount = 4 + Math.floor(Math.random() * 3);
    const karCount = 4 + Math.floor(Math.random() * 3);
    const kerCount = 4 + Math.floor(Math.random() * 3);

    for (let i = 0; i < mahCount; i++) {
      const def = MAHARASHTRA_DEFS[i % MAHARASHTRA_DEFS.length];
      const { x, z } = randInBounds(MAHARASHTRA_BOUNDS);
      this._spawn(def, 'maharashtra', x, z);
    }

    for (let i = 0; i < karCount; i++) {
      const def = KARNATAKA_DEFS[i % KARNATAKA_DEFS.length];
      const { x, z } = randInBounds(KARNATAKA_BOUNDS);
      this._spawn(def, 'karnataka', x, z);
    }

    for (let i = 0; i < kerCount; i++) {
      const def = KERALA_DEFS[i % KERALA_DEFS.length];
      const { x, z } = randInBounds(KERALA_BOUNDS);
      this._spawn(def, 'kerala', x, z);
    }

    this._updateHotbar();
  }

  _spawn(def, state, x, z) {
    const mesh = buildVoxelMesh(def.voxels, 0.22);
    const baseY = 0.8;
    mesh.position.set(x, baseY, z);
    mesh.castShadow = true;
    this.scene.add(mesh);

    let ringColor = '#FF6600'; // maharashtra
    if (state === 'karnataka') ringColor = '#FFD700';
    if (state === 'kerala') ringColor = '#00CC88';

    const ring = makeRing(ringColor);
    ring.position.set(x, 0.05, z);
    this.scene.add(ring);

    this.items.push({
      mesh, ring, def, state, ringColor,
      baseY, collected: false,
      respawnTimer: null,
    });
  }

  /**
   * @param {number} delta
   * @param {number} elapsed
   * @param {THREE.Vector3} playerPos
   * @param {object} playerCtrl
   */
  update(delta, elapsed, playerPos, playerCtrl) {
    for (const item of this.items) {
      if (item.collected) continue;

      // Float + spin
      item.mesh.position.y = item.baseY + Math.sin(elapsed * 2 + item.def.id.length) * 0.18;
      item.mesh.rotation.y = elapsed * 1.6;
      item.ring.material.opacity = 0.5 + 0.35 * Math.abs(Math.sin(elapsed * 3));
      item.ring.rotation.z = elapsed * 0.7;

      // Pickup check
      const dx = playerPos.x - item.mesh.position.x;
      const dz = playerPos.z - item.mesh.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < PICKUP_RADIUS) {
        this._collect(item, playerCtrl);
      }
    }
  }

  _collect(item, playerCtrl) {
    item.collected = true;
    this.scene.remove(item.mesh);
    this.scene.remove(item.ring);

    // Apply buff
    if (playerCtrl?.applyBuff) playerCtrl.applyBuff(item.def.buff);

    // Banner
    this._showBanner(`${item.def.icon} ${item.def.description}`);

    // Inventory
    this.inventory.push({
      id: item.def.id,
      name: item.def.name,
      icon: item.def.icon,
      buffLabel: this._buffLabel(item.def.buff),
    });
    this._updateHotbar();

    // Schedule respawn
    item.respawnTimer = setTimeout(() => {
      let bounds = MAHARASHTRA_BOUNDS;
      if (item.state === 'karnataka') bounds = KARNATAKA_BOUNDS;
      if (item.state === 'kerala') bounds = KERALA_BOUNDS;
      
      const { x, z } = randInBounds(bounds);
      const mesh = buildVoxelMesh(item.def.voxels, 0.22);
      mesh.position.set(x, item.baseY, z);
      mesh.castShadow = true;
      this.scene.add(mesh);

      const ring = makeRing(item.ringColor);
      ring.position.set(x, 0.05, z);
      this.scene.add(ring);

      item.mesh      = mesh;
      item.ring      = ring;
      item.collected = false;
      item.mesh.position.x = x;
      item.mesh.position.z = z;
      item.ring.position.x = x;
      item.ring.position.z = z;

      this._showBanner(`${item.def.icon} ${item.def.name} respawned!`);
    }, RESPAWN_DELAY);
  }

  _buffLabel(buff) {
    const m = buff.multiplier;
    if (buff.type === 'speed')    return `⚡ x${m} Speed`;
    if (buff.type === 'jump')     return `🦘 x${m} Jump`;
    if (buff.type === 'shield')   return `🛡️ Shield`;
    if (buff.type === 'stamina')  return `💪 x${m} Stamina`;
    if (buff.type === 'strength') return `💥 x${m} Strength`;
    return '✨';
  }

  _showBanner(text) {
    if (!this.hud.banner) return;
    this.hud.banner.textContent = text;
    this.hud.banner.classList.add('active');
    clearTimeout(this._bannerTimer);
    this._bannerTimer = setTimeout(() => this.hud.banner.classList.remove('active'), 4500);
  }

  _updateHotbar() {
    if (!this.hud.hotbar) return;
    const slots = this.hud.hotbar.querySelectorAll('.hotbar-slot');
    // Only 5 slots
    slots.forEach((slot, i) => {
      if (i >= 5) return; 
      const inv = this.inventory[i];
      if (inv) {
        slot.innerHTML = `<span class="slot-icon">${inv.icon}</span><span class="slot-name">${inv.name}</span><span class="slot-buff">${inv.buffLabel}</span>`;
        slot.classList.add('filled');
      } else {
        slot.innerHTML = `<span class="slot-empty">—</span>`;
        slot.classList.remove('filled');
      }
    });
  }

  getCollectedCount() { return Math.min(this.inventory.length, 5); }
  getTotalCount()     { return 5; } // Objective is to fill the hotbar
}
