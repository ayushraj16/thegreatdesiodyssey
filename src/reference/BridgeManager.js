import * as THREE from 'three';
import { VoxelBatch, disposeGroup } from './VoxelBatch.js';
import { terrainHeight } from './BiomeManager.js';

import { BRIDGES } from './GameplayLayout.js';
export { BRIDGES } from './GameplayLayout.js';

export class BridgeManager {
  constructor(scene) {
    this.root = new THREE.Group(); this.root.name = 'bridges';
    this.colliders = []; this.rails = []; this.disposed = false;
    BRIDGES.forEach(spec => this.buildBridge(spec)); scene.add(this.root);
  }
  buildBridge({ id, x, z, axis, length, width, material }) {
    const batch = new VoxelBatch(), stone = material === 'stone';
    const color = stone ? '#bba582' : '#996137';
    const segments = Math.ceil(length);
    const sample = (px, pz) => Math.max(3, terrainHeight(Math.floor(px / 4) * 4 + 2, Math.floor(pz / 4) * 4 + 2)) + .15;
    const startY = sample(x - (axis === 'x' ? length / 2 : 0), z - (axis === 'z' ? length / 2 : 0));
    const endY = sample(x + (axis === 'x' ? length / 2 : 0), z + (axis === 'z' ? length / 2 : 0));
    for (let i = 0; i < segments; i++) {
      const distance = -length / 2 + (i + .5) * length / segments;
      const t = (i + .5) / segments;
      const top = THREE.MathUtils.lerp(startY, endY, t) + Math.sin(t * Math.PI) * 3;
      const cx = axis === 'x' ? x + distance : x, cz = axis === 'z' ? z + distance : z;
      const sx = axis === 'x' ? length / segments + .02 : width;
      const sz = axis === 'z' ? length / segments + .02 : width;
      batch.box(cx, top - .35, cz, sx, .7, sz, color);
      this.colliders.push(new THREE.Box3(new THREE.Vector3(cx - sx / 2, top - .7, cz - sz / 2), new THREE.Vector3(cx + sx / 2, top, cz + sz / 2)));
      for (const side of [-1, 1]) {
        const rx = cx + (axis === 'z' ? side * (width / 2 - .2) : 0);
        const rz = cz + (axis === 'x' ? side * (width / 2 - .2) : 0);
        const rw = axis === 'x' ? sx : .4, rd = axis === 'z' ? sz : .4;
        batch.box(rx, top + 1.5, rz, rw, .3, rd, stone ? '#d1bb94' : '#c09354');
        this.rails.push(new THREE.Box3(new THREE.Vector3(rx - rw / 2, top, rz - rd / 2), new THREE.Vector3(rx + rw / 2, top + 1.7, rz + rd / 2)));
        if (i % 4 === 0) batch.box(rx, top + .8, rz, .5, 1.8, .5, color);
      }
      if (i % 8 === 0 && i > 3 && i < segments - 3) batch.box(cx, (top - 3) / 2, cz, axis === 'x' ? 1 : width - 1, top + 3, axis === 'z' ? 1 : width - 1, color);
    }
    const mesh = batch.build(); mesh.name = id; this.root.add(mesh);
  }
  heightAt(x, z) {
    let height = -Infinity;
    for (const box of this.colliders) if (x >= box.min.x && x <= box.max.x && z >= box.min.z && z <= box.max.z) height = Math.max(height, box.max.y);
    return height;
  }
  intersectsRail(box) { return this.rails.some(rail => rail.intersectsBox(box)); }
  dispose() { if (this.disposed) return; this.disposed = true; disposeGroup(this.root); this.colliders.length = this.rails.length = 0; }
}
