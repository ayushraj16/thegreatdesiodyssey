import * as THREE from 'three';
import { VoxelBatch, disposeGroup, randomFor } from './VoxelBatch.js';
import { isGameplayClearance } from './GameplayLayout.js';

export const WORLD = Object.freeze({ min: -128, max: 128, chunkSize: 32, tileSize: 4, waterY: 0 });
export const LANDMARKS = Object.freeze({ gateway: [-66, -44], chariot: [62, -44] });
export function biomeAt(x, z) { return z >= 12 ? 'kerala' : x < 0 ? 'maharashtra' : 'karnataka'; }
export function riverX(z) { return 9 * Math.sin(z / 28) + 4 * Math.cos(z / 17); }

/** Shared deterministic land/water contract: generator, decoration, and caller queries. */
export function terrainHeight(x, z) {
  if (x < WORLD.min || x >= WORLD.max || z < WORLD.min || z >= WORLD.max) return -3;
  const mainRiver = Math.abs(x - riverX(z)) < (z > 12 ? 15 : 10);
  const backwater = z > 20 && Math.abs(z - (55 + 9 * Math.sin(x / 24))) < 11;
  if (mainRiver || backwater) return -3;
  if (z < 12) return 3;
  const hill = Math.max(0, 1 - Math.hypot((x - 82) / 56, (z - 92) / 53));
  return 3 + Math.floor(hill * 8) * 2;
}

function palm(batch, x, y, z, random) {
  const h = 7 + random() * 4;
  for (let i = 0; i < 5; i++) batch.box(x + i * .15, y + (i + .5) * h / 5, z, .65, h / 5, .65, '#86603a');
  for (let i = 0; i < 7; i++) {
    const a = i * Math.PI * 2 / 7;
    for (let j = 1; j <= 3; j++) batch.box(x + Math.cos(a) * j * 1.1, y + h - j * .5, z + Math.sin(a) * j * 1.1,
      2.2, .4, 1.1, i % 2 ? '#4f882b' : '#659e32', [0, -a, 0]);
  }
}

function gateway(batch, x, z) {
  const stone = '#c6a06b', trim = '#e4c28a', y = 3;
  batch.box(x, y + .5, z, 29, 1, 15, trim);
  // Real opening: two piers and stepped arch voussoirs, never a painted doorway.
  for (const side of [-1, 1]) {
    batch.box(x + side * 9, y + 9, z, 9, 18, 9, stone);
    for (let step = 0; step < 5; step++) batch.box(x + side * (4.3 - step * .65), y + 11 + step * 1.1, z, 1.4, 1.3, 9, trim);
  }
  batch.box(x, y + 18, z, 29, 3, 11, stone);
  for (const level of [17, 20]) batch.box(x, y + level, z, 30, .7, 12, trim);
  for (const dx of [-11, 11]) for (const dz of [-4, 4]) {
    batch.box(x + dx, y + 23, z + dz, 3, 6, 3, trim);
    for (let i = 0; i < 3; i++) batch.box(x + dx, y + 26 + i * .6, z + dz, 4 - i, .7, 4 - i, stone);
    batch.box(x + dx, y + 29, z + dz, .5, 2, .5, '#80623b');
  }
  for (let i = -13; i <= 13; i += 2) batch.box(x + i, y + 21, z + 5, .7, 1.5, 1, stone);
}

function chariot(batch, x, z) {
  const stone = '#c9a777', dark = '#997d59';
  batch.box(x, 4, z, 23, 2, 21, stone);
  batch.box(x, 7, z, 14, 4, 12, dark);
  for (const dx of [-5, 5]) for (const dz of [-5, 5]) {
    // Radial blocks form the stone wheels with carved spokes.
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8;
      batch.box(x + dx + Math.sin(a) * 3, 7 + Math.cos(a) * 3, z + dz * 1.3, 1.3, 1.4, 1.3, stone, [0, 0, -a]);
    }
    for (let i = 0; i < 8; i++) batch.box(x + dx, 7, z + dz * 1.3, .45, 5, .5, stone, [0, 0, i * Math.PI / 4]);
    batch.box(x + dx, 14, z + dz * .7, 1.8, 10, 1.8, stone);
  }
  for (let i = 0; i < 6; i++) batch.box(x, 19 + i * 1.3, z, 17 - i * 2, 1.3, 14 - i * 1.7, i % 2 ? dark : stone);
}

function train() {
  const batch = new VoxelBatch();
  for (let car = 0; car < 4; car++) {
    const x = -car * 12;
    batch.box(x, 1.8, 0, 11, 3.2, 4, '#e5e4df');
    batch.box(x, 1, 0, 11.1, .65, 4.1, '#863885');
    batch.box(x, 3.5, 0, 11.3, .45, 4.3, '#bac4cb');
    for (let i = -4; i <= 4; i += 2) for (const side of [-1, 1]) batch.box(x + i, 2.5, side * 2.05, 1.1, 1.1, .1, '#213d50');
    for (const dx of [-3.5, 3.5]) batch.box(x + dx, 0, 0, 1.5, 1.1, 3.5, '#30373c');
  }
  batch.box(5.55, 1.7, 0, .2, 2.5, 4, '#edbd31');
  return batch.build();
}

function houseboat() {
  const batch = new VoxelBatch();
  batch.box(0, .5, 0, 19, 1.5, 7, '#3b2b20');
  batch.box(0, 1.5, 0, 21, .6, 7.6, '#ac7a39');
  for (const side of [-1, 1]) {
    batch.box(side * 10, 1, 0, 3, 1.2, 5, '#493226', [0, 0, side * .25]);
    for (let i = -7; i <= 7; i += 2) batch.box(i, 3, side * 3, .3, 3, .3, '#b78b4f');
    batch.box(0, 2.5, side * 3, 18, .3, .3, '#c89d62');
  }
  // Segmented barrel roof leaves the veranda and window openings visible.
  for (let i = -4; i <= 4; i++) {
    const a = i * Math.PI / 12;
    batch.box(-1, 4 + Math.cos(a) * 2, Math.sin(a) * 3.5, 15, .6, 1.2, i % 2 ? '#d3a558' : '#ba8941', [-a, 0, 0]);
  }
  batch.box(-1, 3, 0, 12, 3, 3.2, '#865c30');
  for (let i = -5; i <= 3; i += 3) for (const side of [-1, 1]) batch.box(i, 3.4, side * 1.65, 1.5, 1.5, .1, '#263933');
  return batch.build();
}

/** Streaming is deterministic, cancellable, distance-prioritized, and frame-budgeted.
 * update focus is the PLAYER/GROUND TARGET, not the elevated camera position.
 * elapsedSeconds should come from the server-synchronized world clock in multiplayer.
 */
export class BiomeManager {
  constructor(scene, { seed = 2026, loadRadius = 150, unloadRadius = 190, budgetMs = 3 } = {}) {
    if (!(loadRadius >= 0 && unloadRadius > loadRadius && budgetMs > 0)) throw new RangeError('Invalid streaming configuration');
    this.scene = scene; this.seed = seed; this.loadRadius = loadRadius;
    this.unloadRadius = unloadRadius; this.budgetMs = budgetMs;
    this.chunks = new Map(); this.disposed = false; this.actors = new Map();
    this.descriptors = [];
    for (let z = -4; z < 4; z++) for (let x = -4; x < 4; x++) {
      this.descriptors.push({ key: `${x}:${z}`, x: x * 32, z: z * 32 });
    }
  }
  *generate(descriptor) {
    const batch = new VoxelBatch();
    const { x: ox, z: oz } = descriptor;
    for (let x = ox + 2; x < ox + 32; x += 4) {
      for (let z = oz + 2; z < oz + 32; z += 4) {
        const height = terrainHeight(x, z);
        if (height < 0) continue;
        const biome = biomeAt(x, z), random = randomFor(x, z, this.seed);
        const color = biome === 'maharashtra' ? '#b6af8f' : biome === 'karnataka' ? '#c4aa7b' : '#588d35';
        batch.box(x, (height - 3) / 2, z, 4, height + 3, 4, color);
        const landmarkReserved = Object.values(LANDMARKS).some(([lx, lz]) => Math.abs(x - lx) < 19 && Math.abs(z - lz) < 18);
        if (landmarkReserved || isGameplayClearance(x, z) || (biome === 'maharashtra' && Math.abs(z + 80) < 7)) continue;
        if (biome === 'kerala') {
          if (height > 3) batch.box(x, height + .35, z, 3.5, .7, 2.5, '#93b93e');
          else if (random() < .18) palm(batch, x, height, z, random);
        } else if (biome === 'karnataka' && x > 40 && z < -80 && x % 12 === 2 && z % 12 === -10) {
          const h = 15 + random() * 28;
          batch.box(x, height + h / 2, z, 6, h, 6, '#287bb8', [0, 0, 0], .65);
          for (let y = 3; y < h; y += 3) batch.box(x, height + y, z, 6.1, .2, 6.1, '#a3dbeb');
        } else if (biome === 'maharashtra' && z < -90 && random() < .16) {
          const h = 10 + random() * 22;
          batch.box(x, height + h / 2, z, 3.4, h, 3.4, '#d0c8b6');
        } else if (random() < .11) {
          batch.box(x, height + 1.5, z, .6, 3, .6, '#785233');
          batch.box(x, height + 4, z, 3.5, 3, 3.5, '#64873c');
        }
        if (biome === 'maharashtra' && terrainHeight(x + 4, z) < 0) {
          for (const angle of [0, 2.1, 4.2]) batch.box(x + 1, 1.5, z, 1.4, 5, 1.4, '#8b9290', [.8, angle, .5]);
        }
      }
      yield; // Check the frame deadline after each eight-tile strip.
    }
    const owns = (x, z) => x >= ox && x < ox + 32 && z >= oz && z < oz + 32;
    if (owns(...LANDMARKS.gateway)) gateway(batch, ...LANDMARKS.gateway);
    if (owns(...LANDMARKS.chariot)) chariot(batch, ...LANDMARKS.chariot);
    if (oz <= -80 && oz + 32 > -80 && ox < 0) {
      batch.box(ox + 16, 5, -80, 32, 1.5, 7, '#999d93');
      for (const dz of [-1.5, 1.5]) batch.box(ox + 16, 6, -80 + dz, 32, .2, .2, '#454e54');
      for (let x = ox + 4; x < ox + 32; x += 8) batch.box(x, 1.5, -80, 2, 7, 5, '#90988d');
    }
    yield;
    return batch.build();
  }
  distance(descriptor, focus) {
    // Distance to chunk AABB, so boundary cells don't pop prematurely.
    const dx = Math.max(descriptor.x - focus.x, 0, focus.x - descriptor.x - 32);
    const dz = Math.max(descriptor.z - focus.z, 0, focus.z - descriptor.z - 32);
    return Math.hypot(dx, dz);
  }
  update(focus, elapsedSeconds) {
    if (this.disposed) return;
    if (![focus.x, focus.z, elapsedSeconds].every(Number.isFinite)) throw new TypeError('Finite focus and time required');
    for (const [key, chunk] of this.chunks) {
      if (this.distance(chunk.descriptor, focus) > this.unloadRadius) {
        if (chunk.root) disposeGroup(chunk.root);
        chunk.job?.return(); this.chunks.delete(key);
      }
    }
    const nearby = this.descriptors.filter(d => this.distance(d, focus) <= this.loadRadius)
      .sort((a, b) => this.distance(a, focus) - this.distance(b, focus));
    const deadline = performance.now() + this.budgetMs;
    for (const descriptor of nearby) {
      let chunk = this.chunks.get(descriptor.key);
      if (!chunk) {
        chunk = { descriptor, root: null, job: this.generate(descriptor) };
        this.chunks.set(descriptor.key, chunk);
      }
      while (chunk.job && performance.now() < deadline) {
        const result = chunk.job.next();
        if (result.done) {
          chunk.root = result.value; chunk.root.name = `chunk:${descriptor.key}`;
          this.scene.add(chunk.root); chunk.job = null;
        }
      }
      if (performance.now() >= deadline) break;
    }
    this.updateActor('train', new THREE.Vector3(-64, 6.8, -80), focus, train, elapsedSeconds);
    this.updateActor('boat', new THREE.Vector3(riverX(42), .4, 42), focus, houseboat, elapsedSeconds);
  }
  updateActor(id, anchor, focus, build, seconds) {
    const distance = Math.hypot(anchor.x - focus.x, anchor.z - focus.z);
    let actor = this.actors.get(id);
    if (!actor && distance <= this.loadRadius) { actor = build(); actor.name = id; this.actors.set(id, actor); this.scene.add(actor); }
    if (!actor) return;
    if (distance > this.unloadRadius) { disposeGroup(actor); this.actors.delete(id); return; }
    if (id === 'train') {
      // Smooth shuttling keeps all four cars on the elevated line.
      actor.position.set(-46 + Math.sin(seconds * .09) * 33, anchor.y, anchor.z);
    } else {
      const z = 44 + Math.sin(seconds * .035) * 28;
      actor.position.set(riverX(z), .4 + Math.sin(seconds * 1.2) * .12, z);
      actor.rotation.y = -Math.PI / 2;
      actor.rotation.z = Math.sin(seconds * .7) * .012;
    }
  }
  get loadingCount() { return [...this.chunks.values()].filter(c => c.job).length; }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const chunk of this.chunks.values()) { chunk.job?.return(); if (chunk.root) disposeGroup(chunk.root); }
    this.actors.forEach(disposeGroup); this.actors.clear(); this.chunks.clear();
  }
}
