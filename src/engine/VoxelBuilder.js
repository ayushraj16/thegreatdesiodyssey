import * as THREE from 'three';

const materialCache = new Map();

/**
 * Returns a cached MeshLambertMaterial for the given hex color.
 * @param {string} hexColor - e.g. "#FF5500"
 * @returns {THREE.MeshLambertMaterial}
 */
function getMaterial(hexColor) {
  if (!materialCache.has(hexColor)) {
    materialCache.set(
      hexColor,
      new THREE.MeshLambertMaterial({ color: new THREE.Color(hexColor) })
    );
  }
  return materialCache.get(hexColor);
}

/**
 * Builds a composite Three.js Group from an array of voxel descriptors.
 * @param {Array<[number, number, number, string]>} voxelData - [x, y, z, hexColor]
 * @param {number} scale - uniform scale factor for each voxel unit
 * @returns {THREE.Group}
 */
export function buildVoxelMesh(voxelData, scale = 0.2) {
  const group = new THREE.Group();
  const geo = new THREE.BoxGeometry(1, 1, 1);

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const [x, y, z] of voxelData) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;

  for (const [x, y, z, hexColor] of voxelData) {
    const mesh = new THREE.Mesh(geo, getMaterial(hexColor));
    mesh.position.set(
      (x - cx) * scale,
      (y - cy) * scale,
      (z - cz) * scale
    );
    mesh.scale.setScalar(scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return group;
}

/**
 * Clears the material cache (useful for memory management between scenes).
 */
export function clearMaterialCache() {
  materialCache.forEach(mat => mat.dispose());
  materialCache.clear();
}
