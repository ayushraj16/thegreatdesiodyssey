import * as THREE from 'three';

/** One instanced draw per material per chunk; resources belong to this batch. */
export class VoxelBatch {
  constructor() { this.groups = new Map(); }
  box(x, y, z, sx, sy, sz, color, rotation = [0, 0, 0], metalness = 0) {
    const key = `${color}:${metalness}`;
    if (!this.groups.has(key)) this.groups.set(key, { color, metalness, transforms: [] });
    this.groups.get(key).transforms.push([x, y, z, sx, sy, sz, ...rotation]);
  }
  build() {
    const root = new THREE.Group();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const dummy = new THREE.Object3D();
    for (const { color, metalness, transforms } of this.groups.values()) {
      const material = new THREE.MeshStandardMaterial({ color, metalness, roughness: metalness ? 0.24 : 0.88, flatShading: true });
      const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
      transforms.forEach(([x, y, z, sx, sy, sz, rx, ry, rz], i) => {
        dummy.position.set(x, y, z); dummy.scale.set(sx, sy, sz); dummy.rotation.set(rx, ry, rz);
        dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingBox(); mesh.computeBoundingSphere();
      mesh.castShadow = true; mesh.receiveShadow = true;
      root.add(mesh);
    }
    // An empty batch must not leave an unattached geometry allocated.
    if (!root.children.length) geometry.dispose();
    return root;
  }
}

export function disposeGroup(root) {
  root.removeFromParent();
  const geometries = new Set(), materials = new Set();
  root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
    if (object.isInstancedMesh) object.dispose();
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
  root.clear();
}

export function randomFor(x, z, seed) {
  let state = (Math.imul(x, 73856093) ^ Math.imul(z, 19349663) ^ seed) >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
