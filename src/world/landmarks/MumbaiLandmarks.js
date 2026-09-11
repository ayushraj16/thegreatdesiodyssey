import * as THREE from 'three';
import { buildVoxelMesh } from '../../engine/VoxelBuilder.js';

// ── Shared materials ──────────────────────────────────────────────────────────
const mats = {
  stone:    () => new THREE.MeshLambertMaterial({ color: '#9e9e9e' }),
  basalt:   () => new THREE.MeshLambertMaterial({ color: '#c8a84b' }),
  brick:    () => new THREE.MeshLambertMaterial({ color: '#8b3a3a' }),
  cream:    () => new THREE.MeshLambertMaterial({ color: '#f5f0e0' }),
  concrete: () => new THREE.MeshLambertMaterial({ color: '#808080' }),
  gold:     () => new THREE.MeshLambertMaterial({ color: '#b8860b' }),
  dark:     () => new THREE.MeshLambertMaterial({ color: '#2a2a2a' }),
  glass:    () => new THREE.MeshLambertMaterial({ color: '#89cff0', transparent: true, opacity: 0.55 }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Marine Drive Promenade + Tetrapods + Street lights
// ─────────────────────────────────────────────────────────────────────────────
function buildMarineDrive(scene) {
  const g = new THREE.Group();

  // Promenade walkway (curved via segments)
  const walkMat = mats.stone();
  const SEGS = 14;
  for (let i = 0; i < SEGS; i++) {
    const t   = i / (SEGS - 1);
    const xP  = THREE.MathUtils.lerp(-30, 30, t);
    const zP  = 14 + Math.sin(t * Math.PI) * 4; // gentle curve
    const tile = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.3, 4.5), walkMat);
    tile.position.set(xP, -0.35, zP);
    tile.receiveShadow = true;
    g.add(tile);
  }

  // Low sea-wall parapet
  const parMat = mats.concrete();
  const parGeo = new THREE.BoxGeometry(62, 0.8, 0.45);
  const par = new THREE.Mesh(parGeo, parMat);
  par.position.set(0, 0.05, 16.5);
  par.castShadow = true;
  g.add(par);

  // ── Tetrapods (InstancedMesh) ────────────────────────────────────────────
  // Each tetrapod = 3 perpendicular rods merged via instanced dummy
  const tetCount = 28;
  const armGeo = new THREE.BoxGeometry(0.55, 0.55, 1.4);
  const tetMat = new THREE.MeshLambertMaterial({ color: '#787878' });
  const tetInst = new THREE.InstancedMesh(armGeo, tetMat, tetCount * 3);
  tetInst.castShadow = true;
  const dummy = new THREE.Object3D();
  let idx = 0;

  for (let i = 0; i < tetCount; i++) {
    const tx = -28 + i * 2.05;
    const tz = 17.5 + Math.random() * 1.5;
    const ty = -0.55;
    const rot = Math.random() * Math.PI;

    // 3 arms
    for (let arm = 0; arm < 3; arm++) {
      dummy.position.set(tx, ty, tz);
      dummy.rotation.set(
        arm === 0 ? 0      : (arm === 1 ? Math.PI / 2 : 0),
        rot,
        arm === 2 ? Math.PI / 2 : 0
      );
      dummy.updateMatrix();
      tetInst.setMatrixAt(idx++, dummy.matrix);
    }
  }
  tetInst.count = idx;
  tetInst.instanceMatrix.needsUpdate = true;
  g.add(tetInst);

  // ── Retro street lights (InstancedMesh pole + globe) ────────────────────
  const poleCount = 10;
  const poleGeo = new THREE.BoxGeometry(0.15, 3.5, 0.15);
  const poleMat = new THREE.MeshLambertMaterial({ color: '#1a1a1a' });
  const poleInst = new THREE.InstancedMesh(poleGeo, poleMat, poleCount);
  const globeGeo = new THREE.SphereGeometry(0.22, 6, 6);
  const globeMat = new THREE.MeshLambertMaterial({ color: '#fff5cc', emissive: '#ffdd66', emissiveIntensity: 0.8 });
  const globeInst = new THREE.InstancedMesh(globeGeo, globeMat, poleCount);
  poleInst.castShadow = true;

  for (let i = 0; i < poleCount; i++) {
    const lx = -22 + i * 5;
    const lz = 15.2;

    dummy.position.set(lx, 1.55, lz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    poleInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(lx, 3.5, lz);
    dummy.updateMatrix();
    globeInst.setMatrixAt(i, dummy.matrix);

    // Warm point light every other pole
    if (i % 2 === 0) {
      const pt = new THREE.PointLight('#ffdd66', 1.2, 10);
      pt.position.set(lx, 3.4, lz);
      g.add(pt);
    }
  }
  poleInst.instanceMatrix.needsUpdate = true;
  globeInst.instanceMatrix.needsUpdate = true;
  g.add(poleInst);
  g.add(globeInst);

  scene.add(g);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Gateway of India (Indo-Saracenic voxel arch)
// ─────────────────────────────────────────────────────────────────────────────
function buildGateway(scene) {
  const BASALT = '#c8a84b';
  const STONE  = '#b8956a';
  const DOME   = '#d4b87a';
  const WHITE  = '#f5f0e0';

  const voxels = [
    // ── Base plinth (wide) ──
    ...[...Array(9)].flatMap((_, x) => [...Array(3)].flatMap((_, z) => [
      [x, 0, z, STONE], [x, 1, z, STONE],
    ])),
    // ── Left pillar ──
    ...[...Array(12)].map((_, y) => [0, y + 2, 1, BASALT]),
    ...[...Array(12)].map((_, y) => [1, y + 2, 1, BASALT]),
    // ── Right pillar ──
    ...[...Array(12)].map((_, y) => [7, y + 2, 1, BASALT]),
    ...[...Array(12)].map((_, y) => [8, y + 2, 1, BASALT]),
    // ── Central arch (horizontal span) ──
    [2,13,1,BASALT],[3,13,1,BASALT],[4,13,1,BASALT],[5,13,1,BASALT],[6,13,1,BASALT],
    [2,14,1,BASALT],[3,14,1,WHITE],[4,14,1,WHITE],[5,14,1,WHITE],[6,14,1,BASALT],
    // ── Arch keystone ──
    [4,15,1,DOME],
    // ── Arch curve fill ──
    [2,11,1,BASALT],[6,11,1,BASALT],
    [2,12,1,BASALT],[3,12,1,BASALT],[5,12,1,BASALT],[6,12,1,BASALT],
    // ── Small windows in pillars ──
    [0,5,1,WHITE],[0,8,1,WHITE],
    [8,5,1,WHITE],[8,8,1,WHITE],
    // ── Central Indo-Saracenic dome ──
    [3,16,1,DOME],[4,16,1,DOME],[5,16,1,DOME],
    [3,17,1,DOME],[4,17,1,DOME],[5,17,1,DOME],
    [4,18,1,DOME],[4,19,1,DOME],
    // ── Corner turrets ──
    ...[0,8].flatMap(tx => [
      [tx,12,1,'#d4b060'],[tx,13,1,'#d4b060'],[tx,14,1,'#d4b060'],
      [tx,14,1,DOME],
    ]),
    // ── Back face (depth) ──
    ...[...Array(9)].flatMap((_, x) => [...Array(12)].map((_, y) => [x, y + 2, 0, STONE])),
  ];

  const mesh = buildVoxelMesh(voxels, 0.42);
  mesh.position.set(6, 0, 22);
  mesh.castShadow = true;
  scene.add(mesh);

  // Spot pointing at the gateway
  const spot = new THREE.SpotLight('#fff4c2', 2.5, 35, Math.PI / 5, 0.4);
  spot.position.set(6, 18, 16);
  spot.target.position.set(6, 3, 22);
  scene.add(spot);
  scene.add(spot.target);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Taj Mahal Palace Hotel
// ─────────────────────────────────────────────────────────────────────────────
function buildTajHotel(scene) {
  const BRICK  = '#8b3a2a';
  const CREAM  = '#f5efe0';
  const DOME_R = '#993322';
  const WIN    = '#87ceeb';
  const GOLD   = '#c8a830';

  const voxels = [
    // ── Main block ──
    ...[...Array(12)].flatMap((_, x) => [...Array(8)].flatMap((_, y) => [...Array(4)].map((_, z) =>
      [x, y, z, y < 2 ? CREAM : BRICK]
    ))),
    // ── Upper setback ──
    ...[...Array(10)].flatMap((_, x) => [...Array(5)].flatMap((_, y) => [...Array(4)].map((_, z) =>
      [x + 1, y + 8, z, BRICK]
    ))),
    // ── Victorian corner towers ──
    ...[0, 10].flatMap(tx => [...Array(13)].map((_, y) => [tx, y, 1, BRICK])),
    // ── Windows ──
    ...[2,4,6,8].flatMap(wx => [2,5].flatMap(wy => [
      [wx, wy, 3.1, WIN], [wx, wy, -0.1, WIN],
    ])),
    // ── Ornate balconies ──
    ...[2,5,8].flatMap(bx => [[bx,7,4,GOLD],[bx,7,-1,GOLD]]),
    // ── Central iconic red dome ──
    [5,13,1,DOME_R],[6,13,1,DOME_R],
    [4,14,1,DOME_R],[5,14,1,DOME_R],[6,14,1,DOME_R],[7,14,1,DOME_R],
    [5,15,1,DOME_R],[6,15,1,DOME_R],
    [5,16,1,DOME_R],
    [5,17,1,GOLD],  // finial
    // ── Corner domes ──
    ...[0,10].flatMap(cx => [
      [cx,12,1,DOME_R],[cx,13,1,DOME_R],[cx,14,DOME_R],
    ]).filter(Boolean),
    // ── Flagpoles ──
    ...[0,11].flatMap(fx => [...Array(3)].map((_, y) => [fx, 16 + y, 1, '#888888'])),
  ];

  const mesh = buildVoxelMesh(voxels, 0.38);
  mesh.position.set(-16, 0, 24);
  mesh.castShadow = true;
  scene.add(mesh);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. City Skyline (procedural buildings + InstancedMesh windows)
// ─────────────────────────────────────────────────────────────────────────────
function buildSkyline(scene) {
  const MAX_WINDOWS = 600;
  const winGeo = new THREE.BoxGeometry(0.55, 0.7, 0.06);

  // Lit and dark window materials
  const winLitMat  = new THREE.MeshLambertMaterial({ color: '#fffacc', emissive: '#ffee88', emissiveIntensity: 0.7 });
  const winDarkMat = new THREE.MeshLambertMaterial({ color: '#1a2040' });
  const instLit  = new THREE.InstancedMesh(winGeo, winLitMat,  MAX_WINDOWS);
  const instDark = new THREE.InstancedMesh(winGeo, winDarkMat, MAX_WINDOWS);

  let litIdx = 0, darkIdx = 0;
  const dummy = new THREE.Object3D();

  const BUILDING_DEFS = [
    { x: -38, w: 5, h: 22, d: 5, col: '#2a3050' },
    { x: -30, w: 4, h: 15, d: 4, col: '#1e2a40' },
    { x: -22, w: 6, h: 18, d: 5, col: '#253045' },
    { x: -14, w: 3, h: 12, d: 4, col: '#1a2535' },
    { x: -7,  w: 5, h: 25, d: 5, col: '#2d3560' },
    { x: 0,   w: 4, h: 14, d: 4, col: '#1c2848' },
    { x: 8,   w: 7, h: 20, d: 6, col: '#252f55' },
    { x: 16,  w: 4, h: 17, d: 4, col: '#1e2a3e' },
    { x: 24,  w: 5, h: 23, d: 5, col: '#2a3558' },
    { x: 32,  w: 3, h: 10, d: 4, col: '#1a2030' },
    { x: 38,  w: 6, h: 16, d: 5, col: '#232e50' },
  ];

  for (const bd of BUILDING_DEFS) {
    const buildMat = new THREE.MeshLambertMaterial({ color: bd.col });
    const buildGeo = new THREE.BoxGeometry(bd.w, bd.h, bd.d);
    const build = new THREE.Mesh(buildGeo, buildMat);
    build.position.set(bd.x, bd.h / 2 - 0.5, -28);
    build.castShadow = true;
    scene.add(build);

    // Windows on front face (z = -28 - bd.d/2 + 0.04)
    const frontZ = -28 - bd.d / 2 - 0.05;
    const wCols = Math.floor((bd.w - 1) / 1.2);
    const wRows = Math.floor((bd.h - 1) / 1.8);
    for (let wr = 0; wr < wRows; wr++) {
      for (let wc = 0; wc < wCols; wc++) {
        const wx = bd.x - bd.w / 2 + 1.0 + wc * 1.2;
        const wy = 0.5 + wr * 1.8;
        const lit = Math.random() > 0.35;
        dummy.position.set(wx, wy, frontZ);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        if (lit && litIdx < MAX_WINDOWS) {
          instLit.setMatrixAt(litIdx++, dummy.matrix);
        } else if (!lit && darkIdx < MAX_WINDOWS) {
          instDark.setMatrixAt(darkIdx++, dummy.matrix);
        }
      }
    }

    // Rooftop water tank or antenna
    const antMat = new THREE.MeshLambertMaterial({ color: '#888888' });
    const ant = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 0.2), antMat);
    ant.position.set(bd.x, bd.h + 0.75, -28);
    scene.add(ant);

    // Red/white aviation light
    const avLightMat = new THREE.MeshLambertMaterial({ color: '#ff0000', emissive: '#ff0000', emissiveIntensity: 1.0 });
    const avLight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 4, 4), avLightMat);
    avLight.position.set(bd.x, bd.h + 2.0, -28);
    scene.add(avLight);
  }

  instLit.count  = litIdx;
  instDark.count = darkIdx;
  instLit.instanceMatrix.needsUpdate  = true;
  instDark.instanceMatrix.needsUpdate = true;
  scene.add(instLit);
  scene.add(instDark);

  // Road between platform and skyline
  const roadMat = new THREE.MeshLambertMaterial({ color: '#3a3a3a' });
  const road = new THREE.Mesh(new THREE.BoxGeometry(80, 0.12, 12), roadMat);
  road.position.set(0, -0.49, -19);
  road.receiveShadow = true;
  scene.add(road);

  // Road markings
  const markMat = new THREE.MeshLambertMaterial({ color: '#ffffaa' });
  for (let mx = -30; mx <= 30; mx += 8) {
    const mark = new THREE.Mesh(new THREE.BoxGeometry(4, 0.07, 0.35), markMat);
    mark.position.set(mx, -0.46, -19);
    scene.add(mark);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────
export class MumbaiLandmarks {
  constructor(scene) {
    this.scene = scene;
  }

  init() {
    buildMarineDrive(this.scene);
    buildGateway(this.scene);
    buildTajHotel(this.scene);
    buildSkyline(this.scene);
  }
}
