import * as THREE from 'three';
import { buildVoxelMesh } from '../engine/VoxelBuilder.js';
import { KEYS, justPressed } from '../engine/Input.js';

const WATER_LEVEL = -0.28; // world Y of pond surface
const BOARD_DIST  = 2.4;   // pickup radius for boarding

// ── Vallam / Shikara voxel boat ───────────────────────────────────────────────
const BOAT_VOXELS = [
  // Hull bottom (dark wood)
  ...[...Array(12)].flatMap((_, x) => [[x,0,0,'#5c2a08'],[x,0,1,'#5c2a08'],[x,0,2,'#5c2a08']]),
  // Port side
  ...[...Array(12)].map((_, x) => [x,1,0,'#8B4513']),
  // Starboard side
  ...[...Array(12)].map((_, x) => [x,1,2,'#8B4513']),
  // Bow cap (tapered front)
  [0,1,0,'#7a3c10'],[0,0,0,'#6a2c08'],[0,1,1,'#7a3c10'],[0,1,2,'#7a3c10'],
  [11,1,0,'#8B4513'],[11,1,2,'#8B4513'],
  // Interior floor
  ...[...Array(10)].flatMap((_, x) => [[x+1,0,1,'#6B3010']]),
  // Canopy support poles
  [2,2,0,'#c8a840'],[2,3,0,'#c8a840'],[2,2,2,'#c8a840'],[2,3,2,'#c8a840'],
  [9,2,0,'#c8a840'],[9,3,0,'#c8a840'],[9,2,2,'#c8a840'],[9,3,2,'#c8a840'],
  // Canopy roof (thatched)
  ...[...Array(8)].flatMap((_, x) => [
    [x+2,4,0,'#c8a032'],[x+2,4,1,'#d4a820'],[x+2,4,2,'#c8a032'],
  ]),
  // Oar at stern
  [10,2,1,'#8B4513'],[11,2,1,'#6B3010'],
];

// ── Pond class ────────────────────────────────────────────────────────────────
class Pond {
  constructor(scene, cx, cz, w, d) {
    this.scene     = scene;
    this.cx = cx; this.cz = cz;
    this.w = w;  this.d = d;
    this.boat      = null;
    this.waterGeo  = null;
    this.waterOrigY = null;
    this.playerOnBoat = false;
    this._interactCooldown = 0;

    this._build();
  }

  _build() {
    const s = this.scene;
    const { cx, cz, w, d } = this;

    // ── Basin (depressed box) ────────────────────────────────────────────────
    const basinMat = new THREE.MeshLambertMaterial({ color: '#5c4a3c' });
    const basin = new THREE.Mesh(new THREE.BoxGeometry(w + 2, 1.0, d + 2), basinMat);
    basin.position.set(cx, -1.0, cz);
    basin.receiveShadow = true;
    s.add(basin);

    // Gravel ring
    const gravelMat = new THREE.MeshLambertMaterial({ color: '#8a7868' });
    for (const [gx, gz, gw, gd] of [
      [cx, cz - d/2 - 0.7, w + 2.4, 1.5],
      [cx, cz + d/2 + 0.7, w + 2.4, 1.5],
      [cx - w/2 - 0.7, cz, 1.5, d + 2.4],
      [cx + w/2 + 0.7, cz, 1.5, d + 2.4],
    ]) {
      const g = new THREE.Mesh(new THREE.BoxGeometry(gw, 0.18, gd), gravelMat);
      g.position.set(gx, -0.49, gz);
      g.receiveShadow = true;
      s.add(g);
    }

    // ── Animated water plane ─────────────────────────────────────────────────
    const SEG = 16;
    const wGeo = new THREE.PlaneGeometry(w, d, SEG, SEG);
    wGeo.rotateX(-Math.PI / 2);

    const posAttr = wGeo.attributes.position;
    this.waterOrigY = new Float32Array(posAttr.count);
    for (let i = 0; i < posAttr.count; i++) {
      this.waterOrigY[i] = posAttr.getY(i);
    }

    const wMat = new THREE.MeshLambertMaterial({
      color: '#0288d1', transparent: true, opacity: 0.75,
    });
    this.waterMesh = new THREE.Mesh(wGeo, wMat);
    this.waterMesh.position.set(cx, WATER_LEVEL, cz);
    this.waterGeo = wGeo;
    s.add(this.waterMesh);

    // ── Floating voxel boat ───────────────────────────────────────────────────
    const boatMesh = buildVoxelMesh(BOAT_VOXELS, 0.24);
    boatMesh.position.set(cx - w * 0.2, WATER_LEVEL + 0.05, cz);
    boatMesh.castShadow = true;
    s.add(boatMesh);
    this.boat = boatMesh;

    // Interact label (HTML)
    this._label = document.getElementById('boat-label');
  }

  /** Animate water waves + boat buoyancy */
  update(elapsed, delta, playerPos, playerController) {
    // Water wave vertices
    const pos = this.waterGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const w2 = Math.sin(x * 0.4 + elapsed * 2) * 0.06
               + Math.cos(z * 0.35 + elapsed * 1.7) * 0.04;
      pos.setY(i, this.waterOrigY[i] + w2);
    }
    pos.needsUpdate = true;
    this.waterGeo.computeVertexNormals();

    // Boat buoyancy
    this.boat.position.y   = WATER_LEVEL + Math.sin(elapsed * 1.5) * 0.08;
    this.boat.rotation.z   = Math.sin(elapsed * 1.2) * 0.04;
    this.boat.rotation.x   = Math.cos(elapsed * 1.0) * 0.03;

    // If player is on boat, lock them to deck
    if (this.playerOnBoat && playerController) {
      const bp = this.boat.position;
      playerController.avatarGroup.position.set(bp.x, bp.y + 0.72, bp.z + 0.3);
    }

    // Proximity indicator
    if (playerPos) {
      const dx = playerPos.x - this.boat.position.x;
      const dz = playerPos.z - this.boat.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (this._label) {
        this._label.style.display = (dist < BOARD_DIST && !this.playerOnBoat) ? 'flex' : 'none';
      }
    }

    // E-key interaction
    if (this._interactCooldown > 0) {
      this._interactCooldown -= delta;
    } else if (justPressed('KeyE') && playerPos && playerController) {
      const dx = playerPos.x - this.boat.position.x;
      const dz = playerPos.z - this.boat.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (!this.playerOnBoat && dist < BOARD_DIST) {
        this.playerOnBoat = true;
        this._interactCooldown = 0.5;
        this._showBanner('🛶 Sailing the Backwaters! Press E to disembark.');
        if (this._label) this._label.style.display = 'none';
      } else if (this.playerOnBoat) {
        this.playerOnBoat = false;
        this._interactCooldown = 0.5;
        // Move player off boat
        if (playerController) {
          playerController.avatarGroup.position.x = this.boat.position.x + 2;
          playerController.avatarGroup.position.z = this.boat.position.z + 2;
        }
        this._showBanner('');
      }
    }
  }

  _showBanner(text) {
    const b = document.getElementById('hud-banner');
    if (!b) return;
    if (text) {
      b.textContent = text;
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export class WaterBodies {
  constructor(scene) {
    this.scene  = scene;
    this.ponds  = [];
  }

  init() {
    // Kerala backwater pond (near Alappuzha)
    this.ponds.push(new Pond(this.scene, -52, 10, 16, 10));
    // Small ornamental pond near platform
    this.ponds.push(new Pond(this.scene, 5, 20, 10, 7));
  }

  /**
   * @param {number} elapsed
   * @param {number} delta
   * @param {THREE.Vector3} playerPos
   * @param {object} playerController
   */
  update(elapsed, delta, playerPos, playerController) {
    for (const pond of this.ponds) {
      pond.update(elapsed, delta, playerPos, playerController);
    }
  }

  /** True if player is on any boat */
  get playerOnBoat() {
    return this.ponds.some(p => p.playerOnBoat);
  }
}
