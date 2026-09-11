import * as THREE from 'three';
import { buildVoxelMesh } from '../../engine/VoxelBuilder.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
function box(w, h, d, color, x, y, z, group) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color })
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  group.add(m);
  return m;
}

function addCollectible(scene, stateManager, itemData, wx, wy, wz) {
  const mesh = buildVoxelMesh(itemData.voxels, 0.2);
  mesh.position.set(wx, wy + 0.5, wz);
  mesh.castShadow = true;
  scene.add(mesh);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.3, 0.48, 16),
    new THREE.MeshBasicMaterial({ color: 0x00cc88, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(wx, wy + 0.05, wz);
  scene.add(ring);

  stateManager.registerCollectible(itemData, mesh, ring, wy + 0.5);
}

// Coconut palm tree (InstancedMesh-friendly helper, returns group)
function makePalm(group, px, py, pz) {
  const trunkMat = new THREE.MeshLambertMaterial({ color: '#8B6340' });
  const frondMat = new THREE.MeshLambertMaterial({ color: '#228B22' });
  const cocoMat  = new THREE.MeshLambertMaterial({ color: '#5c3a1e' });
  // Trunk (slight taper using scale)
  for (let s = 0; s < 5; s++) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.3 - s * 0.02, 0.8, 0.3 - s * 0.02), trunkMat);
    seg.position.set(px + Math.sin(s * 0.4) * 0.1, py + 0.4 + s * 0.8, pz);
    group.add(seg);
  }
  const topY = py + 4.5;
  // Fronds
  const frondAngles = [0, 60, 120, 180, 240, 300];
  for (const ang of frondAngles) {
    const rad = (ang * Math.PI) / 180;
    const frond = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 0.35), frondMat);
    frond.position.set(
      px + Math.cos(rad) * 1.0,
      topY - Math.abs(Math.cos(rad * 2)) * 0.4,
      pz + Math.sin(rad) * 1.0
    );
    frond.rotation.y = rad;
    frond.rotation.z = -0.35;
    group.add(frond);
  }
  // Coconuts
  for (let ci = 0; ci < 3; ci++) {
    const coco = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), cocoMat);
    coco.position.set(
      px + Math.cos((ci * 120 * Math.PI) / 180) * 0.3,
      topY - 0.3,
      pz + Math.sin((ci * 120 * Math.PI) / 180) * 0.3
    );
    group.add(coco);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. KOCHI – Fort Kochi, Chinese Fishing Nets & Spice Stall
// ─────────────────────────────────────────────────────────────────────────────
function buildKochiDistrict(scene, stateManager) {
  const g = new THREE.Group();

  // ── Chinese Fishing Net (Cheena Vala) ─────────────────────────────────────
  // Main bamboo frame
  const bambooMat = new THREE.MeshLambertMaterial({ color: '#c8a86c' });
  // Vertical post
  box(0.3, 6, 0.3, '#c8a86c', 0, 3, 0, g);
  // Horizontal arm extending over water
  box(5, 0.25, 0.25, '#c8a86c', 2.5, 6, 0, g);
  // Counter-weight arm
  box(3, 0.25, 0.25, '#a08044', -1.5, 5.5, 0, g);
  box(1, 0.8, 1, '#4a3010', -3.1, 5.5, 0, g); // counter weight
  // Net lines
  const netMat = new THREE.LineBasicMaterial({ color: '#ccccaa' });
  const tipX = 5.0, tipY = 6;
  const netCorners = [[-0.5, 0.1], [0.5, 0.1], [5.2, 0.1], [5.2, 0.1]];
  const netPts = [
    new THREE.Vector3(tipX, tipY, -1.0),
    new THREE.Vector3(tipX - 3, 0.5, -1.0),
    new THREE.Vector3(tipX - 3, 0.5,  1.0),
    new THREE.Vector3(tipX, tipY,  1.0),
    new THREE.Vector3(tipX, tipY, -1.0),
  ];
  const netLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(netPts), netMat
  );
  g.add(netLine);
  // Net crosshatch
  for (let ni = 0; ni < 4; ni++) {
    const t = ni / 3;
    const nRow = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(tipX, tipY, THREE.MathUtils.lerp(-1, 1, t)),
        new THREE.Vector3(tipX - 3, 0.5, THREE.MathUtils.lerp(-1, 1, t)),
      ]), netMat
    );
    g.add(nRow);
  }

  // ── Fort Kochi street art wall ────────────────────────────────────────────
  box(8, 4, 0.4, '#f5e8d0', 10, 2, 0, g); // white wall
  // Colourful art panels (voxel-style blocks)
  const artColors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c'];
  for (let ac = 0; ac < 6; ac++) {
    box(1.0, 1.5, 0.42, artColors[ac], 6.8 + ac * 1.2, 1.2 + (ac % 2) * 1.0, 0, g);
  }
  // Door in wall
  box(1.2, 2.5, 0.45, '#8B4513', 13.6, 1.25, 0, g);

  // ── Spice stall ───────────────────────────────────────────────────────────
  box(3.5, 2, 1.8, '#7c4a1e', 17, 1, 0, g); // stall
  box(4, 0.2, 2.2, '#cc4400', 17, 2.1, 0, g); // red canopy
  // Spice jars (small spheres)
  const spiceColors = ['#e74c3c','#e67e22','#f1c40f','#27ae60'];
  for (let sc = 0; sc < 4; sc++) {
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.45, 6),
      new THREE.MeshLambertMaterial({ color: spiceColors[sc] })
    );
    jar.position.set(15.6 + sc * 0.85, 2.25, -0.4);
    g.add(jar);
  }

  // Palm trees
  for (const [px, pz] of [[-4, -3], [20, -2], [-3, 4]]) {
    makePalm(g, px, 0, pz);
  }

  g.position.set(-28, 0, 4);
  scene.add(g);

  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(36, 22),
    new THREE.MeshLambertMaterial({ color: '#c8b888' }));
  gnd.rotation.x = -Math.PI / 2;
  gnd.position.set(-28, -0.48, 4);
  scene.add(gnd);

  // ── Collectible: Kerala Pepper ───────────────────────────────────────────
  const keralaP = {
    id: 'kerala_pepper',
    name: 'Kerala Pepper',
    icon: '🌶️',
    description: 'Black Gold of Malabar! +Focus x1.3 for 15s',
    stateName: 'Kochi, Kerala',
    buff: { type: 'focus', multiplier: 1.3, duration: 15000 },
    voxels: [
      [0,0,0,'#1a1a1a'],[1,0,0,'#1a1a1a'],[2,0,0,'#1a1a1a'],
      [0,1,0,'#222222'],[1,1,0,'#2a2a2a'],[2,1,0,'#222222'],
      [0,2,0,'#1a1a1a'],[1,2,0,'#222222'],[2,2,0,'#1a1a1a'],
      [1,3,0,'#228B22'],[1,4,0,'#228B22'],
      [0,0,1,'#222222'],[1,0,1,'#1a1a1a'],[2,0,1,'#222222'],
      [0,1,1,'#2a2a2a'],[1,1,1,'#1a1a1a'],
      [1,2,1,'#222222'],[2,2,1,'#1a1a1a'],
    ],
  };
  addCollectible(scene, stateManager, keralaP, -26, 0.5, 8);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ALAPPUZHA – Kettuvallam Houseboat on Canal
// ─────────────────────────────────────────────────────────────────────────────
function buildAlappuzhaDistrict(scene, stateManager) {
  const g = new THREE.Group();

  // ── Canal water strip ─────────────────────────────────────────────────────
  const canalMat = new THREE.MeshLambertMaterial({ color: '#2e7d5e', transparent: true, opacity: 0.75 });
  const canal = new THREE.Mesh(new THREE.BoxGeometry(22, 0.15, 7), canalMat);
  canal.position.set(5, -0.08, 0);
  g.add(canal);

  // Canal banks (grassy)
  for (const bz of [-4, 4]) {
    box(22, 0.3, 1.2, '#4a7c3a', 5, 0.05, bz, g);
  }

  // ── Kettuvallam (houseboat) ───────────────────────────────────────────────
  // Hull
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(9, 0.6, 2.6),
    new THREE.MeshLambertMaterial({ color: '#3a2010' })
  );
  hull.position.set(5, 0.25, 0);
  g.add(hull);
  // Cabin (curved-ish roof via stacked)
  box(7, 1.6, 2.4, '#c8a868', 5, 1.3, 0, g);     // main cabin
  box(6, 0.35, 2.2, '#a07840', 5, 2.28, 0, g);    // roof base
  // Thatched roof (multiple layers)
  for (let rl = 0; rl < 3; rl++) {
    box(6 - rl * 0.6, 0.28, 2.0 - rl * 0.15, '#c8a032', 5, 2.65 + rl * 0.25, 0, g);
  }
  // Bow shape (tapered front)
  box(1.0, 0.5, 2.2, '#2a1808', 9.9, 0.15, 0, g);
  // Steering pole at back
  box(0.18, 2.2, 0.18, '#5c3010', 0.8, 1.3, 0, g);

  // Windows
  for (const wx of [3, 5, 7]) {
    for (const wz of [-1.2, 1.2]) {
      box(0.8, 0.5, 0.05, '#87ceeb', wx, 1.3, wz + (wz < 0 ? -1.21 : 1.21), g);
    }
  }

  // ── Palm-fringed canal banks ──────────────────────────────────────────────
  for (const [px, pz] of [[-4,-3.5],[-1,-3.5],[2,-3.5],[9,-3.5],[-4,3.5],[2,3.5],[8,3.5]]) {
    makePalm(g, px, 0.1, pz);
  }

  // Lily pads
  const lilyMat = new THREE.MeshLambertMaterial({ color: '#228B22', transparent: true, opacity: 0.9 });
  for (let li = 0; li < 8; li++) {
    const lily = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 8), lilyMat);
    lily.position.set(-3 + li * 2, 0.05, -1.5 + (li % 2) * 3);
    g.add(lily);
    // Flower
    const fMat = new THREE.MeshLambertMaterial({ color: '#ff99cc' });
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.2, 5, 5), fMat);
    flower.position.set(-3 + li * 2, 0.18, -1.5 + (li % 2) * 3);
    g.add(flower);
  }

  g.position.set(-46, 0.5, 12);
  scene.add(g);

  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(30, 22),
    new THREE.MeshLambertMaterial({ color: '#4a7c3a' }));
  gnd.rotation.x = -Math.PI / 2;
  gnd.position.set(-46, -0.48, 12);
  scene.add(gnd);

  // ── Collectible: Kerala Porotta & Roast ─────────────────────────────────
  const porotta = {
    id: 'kerala_porotta',
    name: 'Porotta & Roast',
    icon: '🫓',
    description: 'Alakapuri Special! +Sprint Dash x1.8 for 10s',
    stateName: 'Alappuzha, Kerala',
    buff: { type: 'speed', multiplier: 1.8, duration: 10000 },
    voxels: [
      [0,0,0,'#f5deb3'],[1,0,0,'#f5deb3'],[2,0,0,'#f5deb3'],[3,0,0,'#f5deb3'],
      [0,1,0,'#e8d09a'],[1,1,0,'#f5deb3'],[2,1,0,'#e8d09a'],[3,1,0,'#f5deb3'],
      [0,2,0,'#f5deb3'],[1,2,0,'#e8d09a'],[2,2,0,'#f5deb3'],[3,2,0,'#e8d09a'],
      [0,0,1,'#8B2500'],[1,0,1,'#A52A00'],[2,0,1,'#8B2500'],[3,0,1,'#A52A00'],
      [0,1,1,'#7B1800'],[1,1,1,'#8B2500'],
      [2,1,1,'#A52A00'],[3,1,1,'#7B1800'],
    ],
  };
  addCollectible(scene, stateManager, porotta, -44, 0.5, 16);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. MUNNAR/WAYANAD – Misty Tea Highland
// ─────────────────────────────────────────────────────────────────────────────
function buildMunnarDistrict(scene, stateManager) {
  const g = new THREE.Group();

  // Tiered hillside (emerald terraces)
  const tierColors = ['#3a7a28','#4a8c32','#5aa03c','#6ab048','#7ac055'];
  const TIERS = 5;
  for (let t = 0; t < TIERS; t++) {
    const tw = 18 - t * 1.5;
    const tz = -t * 2.5;
    box(tw, 1.2, 5, tierColors[t], 0, t * 1.6 - 0.5, tz, g);
    // Tea bushes row (small rounded bumps)
    const bushMat = new THREE.MeshLambertMaterial({ color: '#2d5e1e' });
    for (let bx = -tw / 2 + 0.8; bx < tw / 2; bx += 1.4) {
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.42, 6, 5), bushMat);
      bush.position.set(bx, t * 1.6 + 0.55, tz);
      g.add(bush);
    }
    // Stone retaining wall
    box(tw, 0.6, 0.5, '#888070', 0, t * 1.6 - 0.8, tz + 2.5, g);
  }

  // Misty fog particles (semi-transparent planes)
  const fogMat = new THREE.MeshBasicMaterial({ color: '#c8e8d8', transparent: true, opacity: 0.18, side: THREE.DoubleSide });
  for (let fi = 0; fi < 5; fi++) {
    const fogPlane = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.5), fogMat);
    fogPlane.position.set((Math.random() - 0.5) * 10, 1.5 + fi * 0.8, -fi * 3 + 1);
    fogPlane.rotation.y = Math.random() * 0.4 - 0.2;
    g.add(fogPlane);
  }

  // Tea plucking hut
  box(3, 2, 2.5, '#c8a868', -7, 1, -6, g);
  box(3.5, 0.3, 3, '#8B4513', -7, 2.15, -6, g);

  // Plantation path
  const pathMat = new THREE.MeshLambertMaterial({ color: '#b8a888' });
  const path = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 14), pathMat);
  path.position.set(7, 0.07, -3);
  g.add(path);

  // Palm/eucalyptus trees around
  for (const [px, pz] of [[9, -1],[9,-4],[-9, -1]]) {
    makePalm(g, px, 0, pz);
  }

  g.position.set(-40, 0, -14);
  scene.add(g);

  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(32, 26),
    new THREE.MeshLambertMaterial({ color: '#3a7a28' }));
  gnd.rotation.x = -Math.PI / 2;
  gnd.position.set(-40, -0.48, -14);
  scene.add(gnd);

  // ── Collectible: Munnar Tea Cup ──────────────────────────────────────────
  const teaCup = {
    id: 'munnar_tea',
    name: 'Munnar Tea Cup',
    icon: '🍵',
    description: 'First flush Munnar tea! +Focus x1.4 for 18s',
    stateName: 'Munnar, Kerala',
    buff: { type: 'focus', multiplier: 1.4, duration: 18000 },
    voxels: [
      // Cup body
      [0,0,0,'#c8a870'],[1,0,0,'#c8a870'],[2,0,0,'#c8a870'],
      [0,1,0,'#c8a870'],[1,1,0,'#8B4513'],[2,1,0,'#c8a870'],
      [0,2,0,'#c8a870'],[1,2,0,'#7a6040'],[2,2,0,'#c8a870'],
      [0,3,0,'#c8a870'],[1,3,0,'#c8a870'],[2,3,0,'#c8a870'],
      // Saucer
      [0,0,1,'#c8a870'],[1,0,1,'#c8a870'],[2,0,1,'#c8a870'],
      // Tea steam (light)
      [1,4,0,'#e8e0d8'],[0,5,0,'#e8e0d8'],[2,5,0,'#e8e0d8'],
    ],
  };
  addCollectible(scene, stateManager, teaCup, -38, 1.5, -10);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. THIRUVANANTHAPURAM – Dravidian Gopuram
// ─────────────────────────────────────────────────────────────────────────────
function buildThiruDistrict(scene, stateManager) {
  const g = new THREE.Group();
  const GOLD  = '#d4a017';
  const RED   = '#c0392b';
  const CREME = '#f5e8c0';
  const STONE = '#9e8c78';

  // Base plinth
  box(10, 1.0, 8, STONE, 0, 0.5, 0, g);
  // Entry arch pillars
  box(1.5, 5, 1.5, STONE, -3, 3, 0, g);
  box(1.5, 5, 1.5, STONE,  3, 3, 0, g);
  // Lintel
  box(8, 0.8, 1.5, STONE,  0, 5.4, 0, g);

  // Gopuram tiers (5 narrowing tiers)
  const tierData = [
    { w: 7, h: 2.2, d: 5, y: 6.5, col: RED },
    { w: 6, h: 2.0, d: 4.5, y: 8.9, col: GOLD },
    { w: 4.5, h: 1.8, d: 4, y: 11.2, col: RED },
    { w: 3.5, h: 1.5, d: 3, y: 13.2, col: GOLD },
    { w: 2.5, h: 1.2, d: 2, y: 15.0, col: RED },
  ];
  for (const td of tierData) {
    box(td.w, td.h, td.d, td.col, 0, td.y, 0, g);
    // Tier decorations
    for (let dx = -(td.w / 2 - 0.8); dx <= td.w / 2 - 0.8; dx += 1.4) {
      box(0.6, td.h - 0.3, 0.4, CREME, dx, td.y, td.d / 2 + 0.15, g);
    }
  }

  // Kalasam (finial pot)
  const kalMat = new THREE.MeshLambertMaterial({ color: '#FFD700' });
  const kal = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 1.2, 8), kalMat);
  kal.position.set(0, 16.2, 0);
  g.add(kal);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 8), kalMat);
  tip.position.set(0, 17.05, 0);
  g.add(tip);

  // Decorative statues on plinth (simple voxel silhouettes)
  for (const sx of [-3.5, 3.5]) {
    box(0.6, 2.0, 0.6, STONE, sx, 1.5, 3.5, g);  // statue body
    box(0.5, 0.5, 0.5, STONE, sx, 2.7, 3.5, g);  // head
  }

  // Coconut palms flanking plaza
  for (const [px, pz] of [[-6,0],[-6,4],[6,0],[6,4],[-6,-4],[6,-4]]) {
    makePalm(g, px, 1.0, pz);
  }

  // Plaza ground
  const plazaMat = new THREE.MeshLambertMaterial({ color: '#d4c8a0' });
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(22, 0.15, 18), plazaMat);
  plaza.position.set(0, 0.98, 0);
  g.add(plaza);

  // Lamp posts
  const lampMat = new THREE.MeshLambertMaterial({ color: '#2a1a05' });
  for (const [lx, lz] of [[-7, -5],[7, -5],[-7, 5],[7, 5]]) {
    box(0.2, 3.5, 0.2, '#2a1a05', lx, 2.7, lz, g);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6),
      new THREE.MeshLambertMaterial({ color: '#fff5aa', emissive: '#ffdd66', emissiveIntensity: 0.9 }));
    globe.position.set(lx, 4.65, lz);
    g.add(globe);
    const pt = new THREE.PointLight('#ffdd66', 1.0, 8);
    pt.position.set(lx, 4.6, lz);
    g.add(pt);
  }

  g.position.set(-56, 0, 5);
  scene.add(g);

  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(32, 26),
    new THREE.MeshLambertMaterial({ color: '#c8b888' }));
  gnd.rotation.x = -Math.PI / 2;
  gnd.position.set(-56, -0.48, 5);
  scene.add(gnd);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────
export class KeralaDistricts {
  constructor(scene, stateManager) {
    this.scene = scene;
    this.stateManager = stateManager;
  }

  init() {
    buildKochiDistrict(this.scene, this.stateManager);
    buildAlappuzhaDistrict(this.scene, this.stateManager);
    buildMunnarDistrict(this.scene, this.stateManager);
    buildThiruDistrict(this.scene, this.stateManager);
  }
}
