import * as THREE from 'three';

import { PlayerController }     from './engine/PlayerController.js';
import { TerrainPhysics }       from './engine/TerrainPhysics.js';
import { CollectibleManager }   from './engine/CollectibleManager.js';
import { clearEdge }            from './engine/Input.js';

import { Environment }          from './world/Environment.js';
import { MumbaiTrain }          from './world/MumbaiTrain.js';
import { WaterBodies }          from './world/WaterBodies.js';
import { Hoardings }            from './world/Hoardings.js';
import { MumbaiLandmarks }      from './world/landmarks/MumbaiLandmarks.js';
import { MaharashtraDistricts } from './world/zones/MaharashtraDistricts.js';
import { KarnatakaDistricts }   from './world/zones/KarnatakaDistricts.js';
import { KeralaDistricts }      from './world/zones/KeralaDistricts.js';

import { TravelModal }          from './ui/TravelModal.js';
import { IndiaMapModal }        from './ui/IndiaMapModal.js';
import { LandingScreen }        from './ui/LandingScreen.js';

// ─────────────────────────────────────────────────────────────────────────────
// Renderer
// ─────────────────────────────────────────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.toneMapping       = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene  = new THREE.Scene();
scene.fog    = new THREE.FogExp2('#81d4fa', 0.008);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 250);

// ─────────────────────────────────────────────────────────────────────────────
// Lighting
// ─────────────────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight('#ffe0b0', 0.55));

const sun = new THREE.DirectionalLight('#fff5e0', 2.4);
sun.position.set(30, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.setScalar(2048);
sun.shadow.camera.left   = -70;
sun.shadow.camera.right  =  70;
sun.shadow.camera.top    =  70;
sun.shadow.camera.bottom = -70;
sun.shadow.camera.far    = 200;
sun.shadow.bias = -0.001;
scene.add(sun);
scene.add(new THREE.DirectionalLight('#6688cc', 0.35).position.set(-20, 12, -15));

// ─────────────────────────────────────────────────────────────────────────────
// Ground + Platform (Rotated to run along Z-axis)
// ─────────────────────────────────────────────────────────────────────────────
const uniforms = {
  uTime: { value: 0 }
};

const groundGeo = new THREE.PlaneGeometry(350, 350, 120, 120);
const groundMat = new THREE.MeshStandardMaterial({
  color: '#4CAF50',
  roughness: 0.8,
  metalness: 0.1,
});

groundMat.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = uniforms.uTime;
  
  // Vertex Shader: Add wind displacement
  shader.vertexShader = `
    uniform float uTime;
    varying vec3 vWorldPos;
    ${shader.vertexShader}
  `.replace(
    `#include <begin_vertex>`,
    `#include <begin_vertex>
    
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    
    // Wind displacement based on sine waves
    float wind = sin(worldPosition.x * 0.1 + uTime * 1.5) * 
                 cos(worldPosition.z * 0.1 + uTime * 1.2);
                 
    transformed.z += wind * 0.8; // Z is UP in PlaneGeometry before rotation
    `
  );

  // Fragment Shader: Mix colors based on position/wind to simulate lush grass
  shader.fragmentShader = `
    uniform float uTime;
    varying vec3 vWorldPos;
    ${shader.fragmentShader}
  `.replace(
    `#include <color_fragment>`,
    `#include <color_fragment>
    
    // Create organic color patches
    float noise = sin(vWorldPos.x * 0.05 + uTime * 0.5) * cos(vWorldPos.z * 0.05);
    
    vec3 baseGreen = vec3(0.18, 0.49, 0.19); // #2E7D32 Darker lush green
    vec3 highlightGreen = vec3(0.50, 0.78, 0.32); // #81C784 Lighter green
    
    // Mix based on wind/noise
    vec3 grassColor = mix(baseGreen, highlightGreen, (noise + 1.0) * 0.5);
    
    diffuseColor.rgb = grassColor;
    `
  );
};

const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = -0.05; // Base ground
groundMesh.receiveShadow = true;
scene.add(groundMesh);

function buildPlatform() {
  const g = new THREE.Group();

  // Concrete slab (platform)
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(14, 0.5, 60),
    new THREE.MeshLambertMaterial({ color: '#888888' })
  );
  slab.position.set(0, 0.02, 0); // Slight offset
  slab.receiveShadow = true;
  g.add(slab);

  // Yellow edge stripes
  const stripeMat = new THREE.MeshLambertMaterial({ color: '#FFD700' });
  for (const x of [-6.8, 6.8]) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 60), stripeMat);
    s.position.set(x, 0.29, 0);
    g.add(s);
  }

  // Rails (running along Z axis)
  const railMat    = new THREE.MeshLambertMaterial({ color: '#555555' });
  const sleeperMat = new THREE.MeshLambertMaterial({ color: '#6B4226' });
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 200), railMat);
    // Move track to the side of the platform (X = 9)
    rail.position.set(9 + side * 0.7, 0.20, 0);
    g.add(rail);
  }
  for (let z = -100; z <= 100; z += 1.2) {
    const sl = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.2), sleeperMat);
    sl.position.set(9, 0.15, z); // Above ground, below rail
    g.add(sl);
  }

  // Roof pillars
  const pillarMat = new THREE.MeshLambertMaterial({ color: '#aaaaaa' });
  for (let z = -24; z <= 24; z += 6) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4, 0.4), pillarMat);
    p.position.set(-6, 2.25, z);
    p.castShadow = true;
    g.add(p);
  }

  // Station roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(5, 0.2, 60),
    new THREE.MeshLambertMaterial({ color: '#cc4400', transparent: true, opacity: 0.85 })
  );
  roof.position.set(-5, 4.35, 0);
  g.add(roof);

  // Benches
  const benchMat = new THREE.MeshLambertMaterial({ color: '#8B4513' });
  for (let bz = -20; bz <= 20; bz += 10) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 3), benchMat);
    bench.position.set(-4.5, 0.55, bz);
    g.add(bench);
    // Bench legs
    for (const lz of [-1.2, 1.2]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), benchMat);
      leg.position.set(-4.5, 0.3, bz + lz);
      g.add(leg);
    }
  }

  // Chai stall
  const chaiStall = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 2.5, 3),
    new THREE.MeshLambertMaterial({ color: '#7a3c10' })
  );
  chaiStall.position.set(-4.2, 1.25, 12);
  g.add(chaiStall);
  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.18, 4),
    new THREE.MeshLambertMaterial({ color: '#FF6600' })
  );
  awning.position.set(-4.2, 2.59, 12);
  g.add(awning);

  return g;
}

const platform = buildPlatform();
scene.add(platform);

// Footbridge
function buildFootbridge() {
  const g = new THREE.Group();
  const deckMat = new THREE.MeshLambertMaterial({ color: '#c8b888' });
  const railMat = new THREE.MeshLambertMaterial({ color: '#aaaaaa' });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(25, 0.25, 2), deckMat);
  deck.position.set(7, 1.5, -18);
  g.add(deck);
  for (const rz of [-18 - 1.1, -18 + 1.1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(25, 0.8, 0.1), railMat);
    rail.position.set(7, 2.15, rz);
    g.add(rail);
    for (let px = -5; px <= 19; px += 3) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 0.12), railMat);
      post.position.set(px, 2.15, rz);
      g.add(post);
    }
  }
  scene.add(g);
}
buildFootbridge();

// ─────────────────────────────────────────────────────────────────────────────
// Terrain physics — register ground + platform slab
// ─────────────────────────────────────────────────────────────────────────────
const terrain = new TerrainPhysics();
terrain.addMesh(groundMesh);
terrain.addMesh(platform.children[0]); // slab

// ─────────────────────────────────────────────────────────────────────────────
// Player
// ─────────────────────────────────────────────────────────────────────────────
const player = new PlayerController(scene, camera, canvas);
player.avatarGroup.position.set(0, 0, 0);

// ─────────────────────────────────────────────────────────────────────────────
// HUD refs
// ─────────────────────────────────────────────────────────────────────────────
const hud = {
  banner:     document.getElementById('hud-banner'),
  hotbar:     document.getElementById('hud-hotbar'),
  stateLabel: document.getElementById('state-label'),
};

// ─────────────────────────────────────────────────────────────────────────────
// World modules
// ─────────────────────────────────────────────────────────────────────────────
const environment   = new Environment(scene);
environment.init();

const train         = new MumbaiTrain(scene, (text) => {
  if (!hud.banner) return;
  hud.banner.textContent = text;
  hud.banner.classList.add('active');
  setTimeout(() => hud.banner.classList.remove('active'), 5500);
});

const landmarks     = new MumbaiLandmarks(scene);
const mahDistricts  = new MaharashtraDistricts(scene, { registerCollectible: () => {} });
const karDistricts  = new KarnatakaDistricts(scene);
const kerDistricts  = new KeralaDistricts(scene, { registerCollectible: () => {} });
const hoardings     = new Hoardings(scene);
const waterBodies   = new WaterBodies(scene);

landmarks.init();
mahDistricts.init();
karDistricts.init();
kerDistricts.init();
hoardings.init();
waterBodies.init();

// ─────────────────────────────────────────────────────────────────────────────
// Collectible Manager (state-restricted, dynamic respawn)
// ─────────────────────────────────────────────────────────────────────────────
const collectibleMgr = new CollectibleManager(scene, hud);
collectibleMgr.init();

// ─────────────────────────────────────────────────────────────────────────────
// Map & Fast travel system
// ─────────────────────────────────────────────────────────────────────────────
const indiaMapModal = new IndiaMapModal(player);

const cloudOverlay = document.getElementById('cloud-overlay');
const travelModal = new TravelModal(cloudOverlay, (pos) => {
  player.avatarGroup.position.set(pos.x, pos.y, pos.z);
  player.yaw   = pos.yaw ?? 0;
  player.pitch = 0.35;
  sun.target.position.copy(player.position);
});

// ─────────────────────────────────────────────────────────────────────────────
// Landing screen
// ─────────────────────────────────────────────────────────────────────────────
new LandingScreen(() => {
  // Anything to do on game start can go here
}, canvas);

// ─────────────────────────────────────────────────────────────────────────────
// Zone state label logic (Z-axis layout)
// ─────────────────────────────────────────────────────────────────────────────
function getZoneLabel() {
  const { x, z } = player.position;
  
  if (z < -100) return 'Taj Mahal Palace Hotel 🏨';
  if (z < -80)  return 'Gateway of India ⚓ / Marine Drive 🌊';
  if (z < -50)  return 'Maharashtra Outskirts 🚂';
  
  if (z > 50 && z < 75) return 'Fort Kochi 🎨';
  if (z > 75 && z < 90) return 'Munnar Tea Hills 🍵';
  if (z >= 90) return 'Alappuzha Backwaters 🛶';
  
  if (z >= -50 && z <= 50) {
    if (Math.abs(z - 30) < 15) return 'Bengaluru Tech Park 💻';
    if (Math.abs(z + 20) < 15) return 'Hampi Stone Chariot 🛕';
    if (Math.abs(z) <= 15) return 'Platform 1 — Mumbai Central 🚉';
    return 'Karnataka Region 🛕';
  }
  
  return 'Platform 1 — Mumbai Central 🚉';
}

// ─────────────────────────────────────────────────────────────────────────────
// HUD update
// ─────────────────────────────────────────────────────────────────────────────
function updateHUD(elapsed) {
  // State label
  if (hud.stateLabel) hud.stateLabel.textContent = getZoneLabel();

  // Buff display
  const buffEl = document.getElementById('buff-display');
  if (buffEl) {
    const labels = player.getActiveBuffLabels();
    buffEl.innerHTML = labels.length
      ? labels.map(l => `<span class="buff-tag">${l}</span>`).join('')
      : '';
  }

  // Quest hint
  const questEl = document.getElementById('quest-hint');
  if (questEl) {
    const c = collectibleMgr.getCollectedCount();
    const t = collectibleMgr.getTotalCount();
    questEl.textContent = c >= t && t > 0
      ? '🏅 All-State Explorer Achieved! Jai Hind! 🇮🇳'
      : `📍 Explore Maharashtra, Karnataka & Kerala to collect regional snacks! (${c}/${t})`;
  }

  // Sun follows player
  sun.target.position.copy(player.position);
  sun.target.updateMatrixWorld();
}

// ─────────────────────────────────────────────────────────────────────────────
// Animation loop
// ─────────────────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta   = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.elapsedTime;

  // Update grass wind shader time
  uniforms.uTime.value = elapsed;

  // Player (movement + spring camera)
  player.update(delta, terrain);

  // Boat boarding / disembark
  waterBodies.update(elapsed, delta, player.position, player);

  // If player is on a boat, override onBoat state in player
  player.onBoat  = waterBodies.playerOnBoat;
  player.boatRef = waterBodies.ponds.find(p => p.playerOnBoat)?.boat || null;

  // World
  environment.update(elapsed, delta);
  train.update(delta, player.position);
  collectibleMgr.update(delta, elapsed, player.position, player);

  // HUD
  updateHUD(elapsed);

  // Clear one-shot edge keys after all systems have read them
  clearEdge();

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
