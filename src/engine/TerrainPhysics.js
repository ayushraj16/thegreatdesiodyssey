import * as THREE from 'three';

export function getMunnarElevation(x, z) {
  const minX = -120, maxX = -45, minZ = 55, maxZ = 160;
  if (x < minX || x > maxX || z < minZ || z > maxZ) return 0;
  const nx = (x - minX) / (maxX - minX);
  const nz = (z - minZ) / (maxZ - minZ);
  const edgeWeight = Math.sin(nx * Math.PI) * Math.sin(nz * Math.PI);
  const hill1 = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 3.5;
  const hill2 = Math.sin(x * 0.04 + 1.2) * Math.sin(z * 0.04) * 5.0;
  return Math.max(0, hill1 + hill2) * Math.pow(edgeWeight, 1.2);
}

/**
 * Simple raycaster-based terrain grounding system with analytical Munnar hills.
 */
export class TerrainPhysics {
  constructor() {
    /** @type {THREE.Mesh[]} */
    this.terrainMeshes = [];
    this._ray = new THREE.Raycaster();
    this._down = new THREE.Vector3(0, -1, 0);
    this._origin = new THREE.Vector3();

    this.DEFAULT_Y = -0.05;   // fallback ground level
    this.STEP_MAX  = 1.2;     // max voxel-step height player auto-climbs
    this.CLIFF_MAX = 1.5;     // height that blocks forward movement
  }

  /**
   * Register a mesh or group as walkable terrain.
   * @param {THREE.Object3D} obj
   */
  addMesh(obj) {
    if (!obj) return;
    obj.traverse(child => {
      if (child.isMesh) this.terrainMeshes.push(child);
    });
  }

  /**
   * Raycast straight down from `pos` (+ 3 units overhead) to find ground.
   * Also checks analytical Munnar elevation.
   * @param {THREE.Vector3} pos
   * @returns {number} world Y of ground
   */
  getGroundY(pos) {
    this._origin.set(pos.x, pos.y + 3, pos.z);
    this._ray.set(this._origin, this._down);
    this._ray.far = 10;
    
    let groundY = this.DEFAULT_Y;
    const hits = this._ray.intersectObjects(this.terrainMeshes, false);
    if (hits.length > 0) {
      groundY = Math.max(groundY, hits[0].point.y);
    }
    
    // Check Munnar elevation
    const munnarY = getMunnarElevation(pos.x, pos.z);
    return Math.max(groundY, munnarY);
  }

  /**
   * Adjust playerPosition.y to match terrain and determine speed modifier.
   * Returns an object { blocked, speedMod, targetY }
   *
   * @param {THREE.Vector3} prevPos - position BEFORE this frame's XZ move
   * @param {THREE.Vector3} newPos  - position AFTER XZ move
   * @param {number} delta          - frame time
   * @returns {{ blocked: boolean, speedMod: number, targetY: number }}
   */
  resolve(prevPos, newPos, delta) {
    const groundAtPrev = this.getGroundY(prevPos);
    const groundAtNew  = this.getGroundY(newPos);

    const stepHeight = groundAtNew - groundAtPrev;

    // Cliff too steep — reject XZ movement
    if (stepHeight > this.CLIFF_MAX) {
      return { blocked: true, speedMod: 1.0, targetY: groundAtPrev };
    }

    // Determine speed modifier based on slope
    let speedMod = 1.0;
    if (stepHeight > 0.1) {
      speedMod = 0.8; // Climbing uphill
    } else if (stepHeight < -0.1) {
      speedMod = 1.15; // Running downhill
    }

    return { blocked: false, speedMod, targetY: groundAtNew };
  }
}
