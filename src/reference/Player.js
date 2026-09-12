import * as THREE from 'three';
import { terrainHeight } from './BiomeManager.js';
import { disposeGroup } from './VoxelBatch.js';
import { ThirdPersonCamera } from './ThirdPersonCamera.js';

// Match the rendered four-unit tile centers, including shoreline steps.
export function tileHeight(x, z) { return terrainHeight(Math.floor(x / 4) * 4 + 2, Math.floor(z / 4) * 4 + 2); }

export class Player {
  constructor(scene, camera, bridges, { inputTarget = window, canvas, onCameraHint, spawn = new THREE.Vector3(-42, 3, -20) } = {}) {
    this.camera = camera; this.bridges = bridges; this.inputTarget = inputTarget;
    this.enabled = true;
    this.spawn = spawn.clone(); this.position = spawn.clone(); this.velocity = new THREE.Vector3();
    this.keys = new Set(); this.grounded = true; this.jumpQueued = false; this.disposed = false; this.mapMode = false;
    this.bounds = new THREE.Box3(); this.scratchBounds = new THREE.Box3();
    this.root = new THREE.Group(); this.root.name = 'adventurer'; this.root.position.copy(spawn);
    this.geometry = new THREE.BoxGeometry(1, 1, 1); this.materials = new Map(); this.phase = 0;
    const box = (parent, x, y, z, sx, sy, sz, color) => {
      if (!this.materials.has(color)) this.materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .85 }));
      const mesh = new THREE.Mesh(this.geometry, this.materials.get(color));
      mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
    };
    // Local +Z faces forward. All geometry is relative to the character's feet.
    this.legs = [-1, 1].map(side => {
      const pivot = new THREE.Group(); pivot.position.set(side * .4, 1.6, 0); this.root.add(pivot);
      box(pivot, 0, -.6, 0, .65, 1.2, .7, '#253c60'); box(pivot, 0, -1.4, .12, .7, .4, 1, '#f2e8cb'); return pivot;
    });
    box(this.root, 0, 2.25, 0, 1.65, 1.4, .85, '#f5d795');
    for (const side of [-1, 1]) box(this.root, side * .58, 2.25, .48, .5, 1.45, .18, '#387aac');
    box(this.root, 0, 2.4, .46, .42, .38, .08, '#ed7148');
    box(this.root, 0, 2.05, .46, .25, .2, .08, '#428e70');
    this.arms = [-1, 1].map(side => {
      const pivot = new THREE.Group(); pivot.position.set(side * 1.05, 2.8, 0); this.root.add(pivot);
      box(pivot, 0, -.5, 0, .5, 1, .65, '#387aac'); box(pivot, 0, -1.1, 0, .48, .4, .6, '#b9794e'); return pivot;
    });
    box(this.root, 0, 3.6, 0, 1.3, 1.25, 1.15, '#b9794e');
    box(this.root, 0, 4.2, -.06, 1.38, .3, 1.2, '#292322');
    box(this.root, 0, 3.97, .01, 1.43, .25, 1.24, '#d52e37');
    box(this.root, .83, 3.85, -.2, .4, .3, .45, '#db3942');
    box(this.root, 1, 3.45, -.3, .25, .8, .2, '#d52e37');
    for (const side of [-1, 1]) { box(this.root, side * .34, 3.68, .61, .58, .34, .15, '#18242d'); box(this.root, side * .34 - .12, 3.74, .7, .14, .1, .04, '#b7e5df'); }
    box(this.root, 0, 3.7, .62, .18, .1, .15, '#18242d');
    scene.add(this.root);
    this.keydown = event => {
      if (!this.enabled) return;
      if (event.target?.closest?.('input,textarea,select,[contenteditable="true"]') || event.ctrlKey || event.metaKey || event.altKey) return;
      if (!['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','KeyM'].includes(event.code)) return;
      event.preventDefault(); this.keys.add(event.code);
      if (event.code === 'Space' && !event.repeat) this.jumpQueued = true;
      if (event.code === 'KeyM' && !event.repeat) { this.mapMode = !this.mapMode; this.orbit.mapMode = this.mapMode; this.orbit.release(); }
    };
    this.keyup = event => this.keys.delete(event.code);
    this.blur = () => { this.keys.clear(); this.jumpQueued = false; this.velocity.x = this.velocity.z = 0; };
    inputTarget.addEventListener('keydown', this.keydown); inputTarget.addEventListener('keyup', this.keyup); inputTarget.addEventListener('blur', this.blur);
    this.orbit = new ThirdPersonCamera(camera, canvas, spawn, { groundHeight: tileHeight, onHint: onCameraHint });
    this.updateBounds();
  }
  groundAt(x, z) { return Math.max(tileHeight(x, z), this.bridges.heightAt(x, z)); }
  boundsAt(position, box) {
    box.min.set(position.x - .6, position.y + .05, position.z - .6);
    box.max.set(position.x + .6, position.y + 4.35, position.z + .6); return box;
  }
  updateBounds() { return this.boundsAt(this.position, this.bounds); }
  moveAxis(axis, amount) {
    const old = this.position[axis]; this.position[axis] += amount;
    let floor = -Infinity;
    for (const dx of [-.55, .55]) for (const dz of [-.55, .55]) floor = Math.max(floor, this.groundAt(this.position.x + dx, this.position.z + dz));
    if (Math.abs(this.position.x) > 126 || Math.abs(this.position.z) > 126 || floor > this.position.y + .55 || this.bridges.intersectsRail(this.boundsAt(this.position, this.scratchBounds))) {
      this.position[axis] = old; this.velocity[axis] = 0;
    } else if (this.grounded && floor > this.position.y) this.position.y = floor;
  }
  step(dt) {
    const held = (...codes) => codes.some(code => this.keys.has(code));
    let x = Number(held('KeyD','ArrowRight')) - Number(held('KeyA','ArrowLeft'));
    let z = Number(held('KeyS','ArrowDown')) - Number(held('KeyW','ArrowUp'));
    const length = Math.hypot(x, z); if (length) { x /= length; z /= length; }
    const yaw = this.mapMode ? 0 : this.orbit.yaw;
    const localX = x;
    x = localX * Math.cos(yaw) + z * Math.sin(yaw);
    z = z * Math.cos(yaw) - localX * Math.sin(yaw);
    const speed = held('ShiftLeft','ShiftRight') ? 19 : 12;
    const alpha = 1 - Math.exp(-14 * dt);
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, x * speed, alpha);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, z * speed, alpha);
    if (this.jumpQueued && this.grounded) { this.velocity.y = 13; this.grounded = false; }
    this.jumpQueued = false;
    this.moveAxis('x', this.velocity.x * dt); this.moveAxis('z', this.velocity.z * dt);
    const previousY = this.position.y; this.velocity.y -= 30 * dt; this.position.y += this.velocity.y * dt;
    let ground = -Infinity;
    for (const dx of [-.55,.55]) for (const dz of [-.55,.55]) ground = Math.max(ground, this.groundAt(this.position.x + dx, this.position.z + dz));
    if (ground >= 0 && this.velocity.y <= 0 && previousY >= ground - .6 && this.position.y <= ground) {
      this.position.y = ground; this.velocity.y = 0; this.grounded = true;
    } else this.grounded = false;
    if (this.position.y < -5) { this.position.copy(this.spawn); this.velocity.set(0, 0, 0); this.grounded = true; }
    if (length) {
      const target = Math.atan2(x, z), difference = Math.atan2(Math.sin(target - this.root.rotation.y), Math.cos(target - this.root.rotation.y));
      this.root.rotation.y += difference * (1 - Math.exp(-16 * dt));
    }
    this.phase += Math.hypot(this.velocity.x, this.velocity.z) * dt * .65;
    const swing = this.grounded ? Math.sin(this.phase) * Math.min(.6, Math.hypot(this.velocity.x,this.velocity.z) * .05) : .2;
    this.legs[0].rotation.x = swing; this.legs[1].rotation.x = -swing;
    this.arms[0].rotation.x = -swing; this.arms[1].rotation.x = swing;
    this.root.position.copy(this.position); this.updateBounds();
  }
  update(dt) {
    // Bound each collision step to 1/120 s, including low-FPS frames.
    let remaining = Math.min(Math.max(dt, 0), .1);
    while (remaining > 1e-8) { const step = Math.min(remaining, 1 / 120); this.step(step); remaining -= step; }
    this.orbit.mapMode = this.mapMode; this.orbit.update(dt, this.position);
  }
  dispose() {
    if (this.disposed) return; this.disposed = true; this.blur();
    this.inputTarget.removeEventListener('keydown', this.keydown); this.inputTarget.removeEventListener('keyup', this.keyup); this.inputTarget.removeEventListener('blur', this.blur);
    this.orbit.dispose();
    disposeGroup(this.root);
  }
}
