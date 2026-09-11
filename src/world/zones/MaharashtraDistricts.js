import * as THREE from 'three';
import { buildVoxelMesh } from '../../engine/VoxelBuilder.js';

// ── Shared helpers ────────────────────────────────────────────────────────────
function box(w, h, d, color, x, y, z, group, shadows = true) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color })
  );
  m.position.set(x, y, z);
  if (shadows) { m.castShadow = true; m.receiveShadow = true; }
  group.add(m);
  return m;
}

function addCollectible(scene, stateManager, itemData, wx, wy, wz) {
  const mesh = buildVoxelMesh(itemData.voxels, 0.2);
  mesh.position.set(wx, wy + 0.5, wz);
  mesh.castShadow = true;
  scene.add(mesh);

  const ringGeo = new THREE.RingGeometry(0.3, 0.48, 16);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff8800, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(wx, wy + 0.05, wz);
  scene.add(ring);

  stateManager.registerCollectible(itemData, mesh, ring, wy + 0.5);
}

// ── Saffron flag ──────────────────────────────────────────────────────────────
function makeSaffronFlag(group, fx, fy, fz) {
  // Pole
  box(0.12, 4, 0.12, '#888888', fx, fy + 2, fz, group);
  // Flag cloth
  const flagGeo = new THREE.BoxGeometry(1.6, 0.8, 0.06);
  const flagMat = new THREE.MeshLambertMaterial({ color: '#FF9933' });
  const flag = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(fx + 0.9, fy + 4.1, fz);
  group.add(flag);
  // Ashoka chakra dot (blue)
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6),
    new THREE.MeshLambertMaterial({ color: '#000080' }));
  dot.position.set(fx + 0.9, fy + 4.1, fz + 0.04);
  group.add(dot);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PUNE – Shaniwar Wada Gate
// ─────────────────────────────────────────────────────────────────────────────
function buildPuneDistrict(scene, stateManager) {
  const g = new THREE.Group();
  const STONE = '#8a7560';
  const RUST  = '#7a3c1e';

  // Gate arch base pillars
  box(2, 8, 2, STONE, -2, 4, 0, g);
  box(2, 8, 2, STONE,  2, 4, 0, g);
  // Arch top
  box(6, 1.5, 2, STONE, 0, 8.75, 0, g);
  // Arch interior fill (darker)
  box(2.5, 6.5, 0.3, '#5c4a35', 0, 4, -0.85, g);
  // Brass spike finials (5 spikes)
  for (let sx = -2; sx <= 2; sx++) {
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.7, 6),
      new THREE.MeshLambertMaterial({ color: '#b8860b' })
    );
    spike.position.set(sx, 9.9, 0);
    g.add(spike);
  }
  // Upper battlements
  for (let bx = -2.4; bx <= 2.4; bx += 0.8) {
    box(0.45, 0.7, 2, STONE, bx, 9.85, 0, g);
  }
  // Wall extensions
  box(10, 5, 1.2, STONE, -8, 2.5, 0, g);
  box(10, 5, 1.2, STONE,  8, 2.5, 0, g);
  // Watchtower left
  box(2, 10, 2, RUST, -14, 5, 0, g);
  box(3, 0.6, 3, STONE, -14, 10.3, 0, g);
  // Watchtower right
  box(2, 10, 2, RUST,  14, 5, 0, g);
  box(3, 0.6, 3, STONE,  14, 10.3, 0, g);

  // Decorative Peshwa-era border motif on gate top
  for (let mx = -2.5; mx <= 2.5; mx += 0.8) {
    const mot = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.15),
      new THREE.MeshLambertMaterial({ color: '#b8860b' }));
    mot.position.set(mx, 8.5, 1.1);
    g.add(mot);
  }

  makeSaffronFlag(g, 0, 9.5, -1.2);

  // Sign board
  const signMat = new THREE.MeshLambertMaterial({ color: '#3a2010' });
  box(3.5, 0.7, 0.2, '#3a2010', 0, 5, 1.1, g);

  g.position.set(38, 0.5, -2);
  scene.add(g);

  // Ground patch
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(32, 18),
    new THREE.MeshLambertMaterial({ color: '#9e8c7a' }));
  gnd.rotation.x = -Math.PI / 2;
  gnd.position.set(38, -0.48, -2);
  gnd.receiveShadow = true;
  scene.add(gnd);

  // ── Collectible: Bakharwadi ──────────────────────────────────────────────
  const bakharwadi = {
    id: 'bakharwadi',
    name: 'Bakharwadi',
    icon: '🥨',
    description: 'Crispy Pune Bakharwadi! +Stamina x1.4 for 14s',
    stateName: 'Pune, Maharashtra',
    buff: { type: 'stamina', multiplier: 1.4, duration: 14000 },
    voxels: [
      [0,0,0,'#C8860A'],[1,0,0,'#D4920F'],[2,0,0,'#C8860A'],
      [0,1,0,'#D4920F'],[1,1,0,'#E8A820'],[2,1,0,'#D4920F'],
      [0,2,0,'#C8860A'],[1,2,0,'#D4920F'],[2,2,0,'#C8860A'],
      [0,0,1,'#B87808'],[1,0,1,'#C8860A'],[2,0,1,'#B87808'],
      [1,1,1,'#FFB830'],[1,2,1,'#C8860A'],
      [0,3,0,'#D4920F'],[2,3,0,'#D4920F'],
    ],
  };
  addCollectible(scene, stateManager, bakharwadi, 38, 0.5, 3);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. NAGPUR – Zero Mile Marker & Orange Mart
// ─────────────────────────────────────────────────────────────────────────────
function buildNagpurDistrict(scene, stateManager) {
  const g = new THREE.Group();

  // Zero Mile obelisk
  const obMat = new THREE.MeshLambertMaterial({ color: '#c8c0a0' });
  box(1.2, 8, 1.2, '#c8c0a0', 0, 4, 0, g);
  // Obelisk cap
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2, 4),
    new THREE.MeshLambertMaterial({ color: '#d4b880' }));
  cap.position.set(0, 9, 0);
  g.add(cap);
  // Inscriptions (stripe decoration)
  for (let iy = 1; iy <= 6; iy += 2) {
    box(1.22, 0.18, 1.22, '#8a7850', 0, iy, 0, g);
  }
  // Surrounding low fence
  for (let fx = -3; fx <= 3; fx += 3) {
    box(0.2, 1.0, 6.2, '#888877', fx, 0.5, 0, g);
  }
  box(6.2, 1.0, 0.2, '#888877', 0, 0.5, -3, g);
  box(6.2, 1.0, 0.2, '#888877', 0, 0.5,  3, g);

  // Orange Mart stall
  const stallMat = new THREE.MeshLambertMaterial({ color: '#5c3010' });
  box(5, 2.5, 2, '#5c3010',  8, 1.25, 0, g); // back wall
  box(6, 0.2, 2.5, '#FF6600', 8, 2.6, 0, g); // orange awning
  // Crates of oranges (InstancedMesh)
  const crateGeo = new THREE.BoxGeometry(0.7, 0.6, 0.7);
  const crateMat = new THREE.MeshLambertMaterial({ color: '#8B4513' });
  const crateInst = new THREE.InstancedMesh(crateGeo, crateMat, 12);
  const orangeGeo = new THREE.SphereGeometry(0.25, 6, 6);
  const orangeMat = new THREE.MeshLambertMaterial({ color: '#FF6600' });
  const orangeInst = new THREE.InstancedMesh(orangeGeo, orangeMat, 18);
  const dummy = new THREE.Object3D();
  let ci = 0, oi = 0;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const cx2 = 5.8 + col * 0.85, cz2 = -0.5 + row * 0.85;
      dummy.position.set(cx2, 0.3, cz2); dummy.rotation.set(0,0,0); dummy.scale.set(1,1,1);
      dummy.updateMatrix(); if (ci < 12) crateInst.setMatrixAt(ci++, dummy.matrix);
      // 2 oranges per crate
      for (let oc = 0; oc < 2; oc++) {
        dummy.position.set(cx2 + (oc - 0.5) * 0.28, 0.75, cz2);
        dummy.updateMatrix(); if (oi < 18) orangeInst.setMatrixAt(oi++, dummy.matrix);
      }
    }
  }
  crateInst.instanceMatrix.needsUpdate = true;
  orangeInst.instanceMatrix.needsUpdate = true;
  g.add(crateInst); g.add(orangeInst);

  g.position.set(52, 0.5, -12);
  scene.add(g);

  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(28, 22),
    new THREE.MeshLambertMaterial({ color: '#c8b888' }));
  gnd.rotation.x = -Math.PI / 2;
  gnd.position.set(52, -0.48, -12);
  scene.add(gnd);

  // ── Collectible: Nagpur Orange ──────────────────────────────────────────
  const nagpurOrange = {
    id: 'nagpur_orange',
    name: 'Nagpur Orange',
    icon: '🍊',
    description: 'VIP Nagpur Santra! +Jump Boost x1.6 for 10s',
    stateName: 'Nagpur, Maharashtra',
    buff: { type: 'jump', multiplier: 1.6, duration: 10000 },
    voxels: [
      [0,0,0,'#FF6600'],[1,0,0,'#FF6600'],[2,0,0,'#FF6600'],
      [0,1,0,'#FF6600'],[1,1,0,'#FF8C00'],[2,1,0,'#FF6600'],
      [0,2,0,'#FF6600'],[1,2,0,'#FF6600'],[2,2,0,'#FF6600'],
      [1,3,0,'#228B22'],// leaf
      [0,0,1,'#FF7400'],[1,0,1,'#FF6600'],[2,0,1,'#FF7400'],
      [0,1,1,'#FF6600'],[1,1,1,'#FF8C00'],[2,1,1,'#FF6600'],
    ],
  };
  addCollectible(scene, stateManager, nagpurOrange, 52, 0.5, -6);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. RAIGAD – Maratha Hilltop Fort Outpost
// ─────────────────────────────────────────────────────────────────────────────
function buildRaigadDistrict(scene, stateManager) {
  const g = new THREE.Group();
  const BASALT = '#707060';
  const DARK   = '#504840';

  // Hill mound (layered cone)
  const hillMats = ['#6b7c52','#7c8c60','#8c9c70'].map(c =>
    new THREE.MeshLambertMaterial({ color: c }));
  [8, 6, 4].forEach((s, i) => {
    const h = new THREE.Mesh(new THREE.BoxGeometry(s * 2, 1.5, s * 2), hillMats[i]);
    h.position.y = i * 1.5;
    g.add(h);
  });

  // Fort walls on hilltop (y=4.5)
  const WH = 4;
  const TOP_Y = 4.5;
  box(12, WH, 1,   BASALT, 0,  TOP_Y + WH/2, -5, g);
  box(12, WH, 1,   BASALT, 0,  TOP_Y + WH/2,  5, g);
  box(1,  WH, 10,  BASALT, -5.5, TOP_Y + WH/2, 0, g);
  box(1,  WH, 10,  BASALT,  5.5, TOP_Y + WH/2, 0, g);

  // Battlements
  for (let bx = -5; bx <= 5; bx += 2) {
    box(0.9, 0.9, 1.1, BASALT, bx, TOP_Y + WH + 0.45, -5, g);
    box(0.9, 0.9, 1.1, BASALT, bx, TOP_Y + WH + 0.45,  5, g);
  }
  for (let bz = -4; bz <= 4; bz += 2) {
    box(1.1, 0.9, 0.9, BASALT, -5.5, TOP_Y + WH + 0.45, bz, g);
    box(1.1, 0.9, 0.9, BASALT,  5.5, TOP_Y + WH + 0.45, bz, g);
  }

  // Central keep (taller inner tower)
  box(3, 7, 3, DARK, 0, TOP_Y + 3.5, 0, g);
  // Arched gate opening
  box(1.5, 2.5, 1.2, '#2a2018', 0, TOP_Y + 1.25, -5.1, g);

  // Saffron flag
  makeSaffronFlag(g, 0, TOP_Y + 7.5, 0);

  // Staircase up hill
  for (let s = 0; s < 6; s++) {
    box(1.2, 0.35, 1.0, BASALT, -7 + s * 0.7, s * 0.45 - 0.3, -4 + s * 0.35, g);
  }

  g.position.set(28, 0, 18);
  scene.add(g);

  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(30, 30),
    new THREE.MeshLambertMaterial({ color: '#6b7c52' }));
  gnd.rotation.x = -Math.PI / 2;
  gnd.position.set(28, -0.48, 18);
  scene.add(gnd);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. NASHIK – Grape Vineyard
// ─────────────────────────────────────────────────────────────────────────────
function buildNashikDistrict(scene, stateManager) {
  const g = new THREE.Group();

  // Vineyard pergola rows (InstancedMesh for posts)
  const postGeo = new THREE.BoxGeometry(0.2, 1.8, 0.2);
  const postMat = new THREE.MeshLambertMaterial({ color: '#8B6340' });
  const wireGeo = new THREE.BoxGeometry(6.2, 0.1, 0.1);
  const wireMat = new THREE.MeshLambertMaterial({ color: '#6B4820' });
  const postInst = new THREE.InstancedMesh(postGeo, postMat, 48);
  const dummy = new THREE.Object3D();
  let pi = 0;

  const ROWS = 4, COLS = 4;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      dummy.position.set(c * 2.2, 0.9, r * 3.5);
      dummy.rotation.set(0,0,0); dummy.scale.set(1,1,1);
      dummy.updateMatrix();
      if (pi < 48) postInst.setMatrixAt(pi++, dummy.matrix);
    }
    // Horizontal wires
    for (let c = 0; c < COLS - 1; c++) {
      const wire = new THREE.Mesh(wireGeo, wireMat);
      wire.position.set(c * 2.2 + 1.1, 1.8, r * 3.5);
      g.add(wire);
    }
  }
  postInst.count = pi;
  postInst.instanceMatrix.needsUpdate = true;
  g.add(postInst);

  // Grape clusters (purple spheres, InstancedMesh)
  const grapeGeo = new THREE.SphereGeometry(0.18, 6, 4);
  const grapeMat = new THREE.MeshLambertMaterial({ color: '#6a0dad' });
  const grapeInst = new THREE.InstancedMesh(grapeGeo, grapeMat, 80);
  let gi = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 1; c++) {
      for (let g2 = 0; g2 < 5; g2++) {
        dummy.position.set(c * 2.2 + 0.5 + g2 * 0.4, 1.7 - (g2 % 2) * 0.2, r * 3.5);
        dummy.updateMatrix();
        if (gi < 80) grapeInst.setMatrixAt(gi++, dummy.matrix);
      }
    }
  }
  grapeInst.instanceMatrix.needsUpdate = true;
  g.add(grapeInst);

  // Leaf canopy strips
  const leafMat = new THREE.MeshLambertMaterial({ color: '#228B22', transparent: true, opacity: 0.8 });
  for (let r = 0; r < ROWS; r++) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(7, 0.15, 2.5), leafMat);
    leaf.position.set(3.3, 1.85, r * 3.5);
    g.add(leaf);
  }

  g.position.set(42, 0.5, -18);
  scene.add(g);

  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(26, 20),
    new THREE.MeshLambertMaterial({ color: '#4a6c3a' }));
  gnd.rotation.x = -Math.PI / 2;
  gnd.position.set(42, -0.48, -18);
  scene.add(gnd);

  // ── Collectible: Grape Punch ─────────────────────────────────────────────
  const grapePunch = {
    id: 'grape_punch',
    name: 'Grape Punch',
    icon: '🍇',
    description: 'Nashik Angoor ka Punch! +Speed x1.5 for 13s',
    stateName: 'Nashik, Maharashtra',
    buff: { type: 'speed', multiplier: 1.5, duration: 13000 },
    voxels: [
      [0,0,0,'#6a0dad'],[1,0,0,'#7B1FA2'],[2,0,0,'#6a0dad'],
      [0,1,0,'#7B1FA2'],[1,1,0,'#9C27B0'],[2,1,0,'#7B1FA2'],
      [0,2,0,'#6a0dad'],[1,2,0,'#7B1FA2'],[2,2,0,'#6a0dad'],
      [1,3,0,'#228B22'],[0,3,0,'#228B22'],
      [0,0,1,'#7B1FA2'],[1,0,1,'#6a0dad'],[2,0,1,'#7B1FA2'],
      [0,1,1,'#9C27B0'],[1,1,1,'#7B1FA2'],
    ],
  };
  addCollectible(scene, stateManager, grapePunch, 44, 0.5, -14);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────
export class MaharashtraDistricts {
  constructor(scene, stateManager) {
    this.scene = scene;
    this.stateManager = stateManager;
  }

  init() {
    buildPuneDistrict(this.scene, this.stateManager);
    buildNagpurDistrict(this.scene, this.stateManager);
    buildRaigadDistrict(this.scene, this.stateManager);
    buildNashikDistrict(this.scene, this.stateManager);
  }
}
