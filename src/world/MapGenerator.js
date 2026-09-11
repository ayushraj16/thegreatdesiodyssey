import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// StateZoneManager
// Divides the world into a 2D named-grid of non-overlapping zones.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Zone grid layout — all 28 Indian states + 8 UTs mapped to world coordinates.
 *
 * Grid cell size: CELL_W × CELL_D world units.
 * Origin (0,0) = Maharashtra (the starting hub).
 * Grid axes: +X = East, -X = West, +Z = South, -Z = North.
 *
 * Each state entry defines:
 *   id      — machine key
 *   name    — display name
 *   col     — grid column (integer, 0-centred)
 *   row     — grid row    (integer, 0-centred)
 *   biome   — 'plains' | 'desert' | 'forest' | 'mountain' | 'coastal' | 'delta'
 */

const CELL_W = 120; // world units per grid column
const CELL_D = 120; // world units per grid row

export const STATE_GRID = [
  // ── Column 0 (Central) ────────────────────────────────────────────────────
  { id:'maharashtra',     name:'Maharashtra',          col: 0, row: 0, biome:'plains'   },
  { id:'madhya_pradesh',  name:'Madhya Pradesh',       col: 0, row:-1, biome:'forest'   },
  { id:'chhattisgarh',    name:'Chhattisgarh',         col: 1, row:-1, biome:'forest'   },
  { id:'telangana',       name:'Telangana',            col: 0, row: 1, biome:'plains'   },
  { id:'andhra_pradesh',  name:'Andhra Pradesh',       col: 1, row: 1, biome:'coastal'  },

  // ── Column -1 (West) ─────────────────────────────────────────────────────
  { id:'gujarat',         name:'Gujarat',              col:-1, row: 0, biome:'desert'   },
  { id:'rajasthan',       name:'Rajasthan',            col:-1, row:-1, biome:'desert'   },
  { id:'goa',             name:'Goa',                  col:-1, row: 1, biome:'coastal'  },
  { id:'karnataka',       name:'Karnataka',            col:-1, row: 2, biome:'forest'   },
  { id:'kerala',          name:'Kerala',               col:-2, row: 2, biome:'coastal'  },
  { id:'tamilnadu',       name:'Tamil Nadu',           col: 0, row: 3, biome:'coastal'  },

  // ── Column -2 / -3 (Far West) ────────────────────────────────────────────
  { id:'sindhu_kshetra',  name:'Lakshadweep (UT)',     col:-3, row: 2, biome:'coastal'  },

  // ── Column 1 (East-Central) ───────────────────────────────────────────────
  { id:'odisha',          name:'Odisha',               col: 2, row: 0, biome:'coastal'  },
  { id:'jharkhand',       name:'Jharkhand',            col: 2, row:-1, biome:'forest'   },
  { id:'west_bengal',     name:'West Bengal',          col: 2, row:-2, biome:'delta'    },

  // ── Column 2 (East) ───────────────────────────────────────────────────────
  { id:'assam',           name:'Assam',                col: 3, row:-2, biome:'delta'    },
  { id:'arunachal',       name:'Arunachal Pradesh',    col: 4, row:-3, biome:'mountain' },
  { id:'nagaland',        name:'Nagaland',             col: 4, row:-2, biome:'forest'   },
  { id:'manipur',         name:'Manipur',              col: 4, row:-1, biome:'forest'   },
  { id:'mizoram',         name:'Mizoram',              col: 4, row: 0, biome:'forest'   },
  { id:'tripura',         name:'Tripura',              col: 3, row:-1, biome:'forest'   },
  { id:'meghalaya',       name:'Meghalaya',            col: 3, row:-3, biome:'mountain' },
  { id:'sikkim',          name:'Sikkim',               col: 3, row:-4, biome:'mountain' },

  // ── Column 0 / -1 (North) ────────────────────────────────────────────────
  { id:'uttar_pradesh',   name:'Uttar Pradesh',        col: 0, row:-2, biome:'plains'   },
  { id:'bihar',           name:'Bihar',                col: 1, row:-2, biome:'plains'   },
  { id:'uttarakhand',     name:'Uttarakhand',          col:-1, row:-3, biome:'mountain' },
  { id:'himachal',        name:'Himachal Pradesh',     col:-1, row:-4, biome:'mountain' },
  { id:'punjab',          name:'Punjab',               col:-1, row:-2, biome:'plains'   },
  { id:'haryana',         name:'Haryana',              col: 0, row:-3, biome:'plains'   },
  { id:'delhi',           name:'Delhi (UT)',            col: 0, row:-4, biome:'plains'   },
  { id:'jammu_kashmir',   name:'Jammu & Kashmir (UT)', col:-1, row:-5, biome:'mountain' },
  { id:'ladakh',          name:'Ladakh (UT)',           col: 0, row:-5, biome:'mountain' },
];

/**
 * Get world-space {x, z, width, depth} bounding box for a state.
 * @param {string} stateId
 * @returns {{ x: number, z: number, width: number, depth: number } | null}
 */
export function getStateBounds(stateId) {
  const s = STATE_GRID.find(s => s.id === stateId);
  if (!s) return null;
  return {
    x:     s.col * CELL_W,
    z:     s.row * CELL_D,
    width: CELL_W,
    depth: CELL_D,
  };
}

/** Return the origin {x, z} world position for a state. */
export function getStateOrigin(stateId) {
  const b = getStateBounds(stateId);
  if (!b) return null;
  return { x: b.x, z: b.z };
}

// ─────────────────────────────────────────────────────────────────────────────
// AABB Collision Guard
// Ensures no two spawned structures overlap within a state zone.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Axis-Aligned Bounding Box for a placed structure.
 * @typedef {{ x: number, z: number, w: number, d: number, label?: string }} AABB
 */

/**
 * Tests whether two AABBs overlap (with an optional margin).
 * @param {AABB} a
 * @param {AABB} b
 * @param {number} [margin=2] - extra buffer distance in world units
 * @returns {boolean}
 */
function aabbOverlap(a, b, margin = 2) {
  return (
    a.x - a.w / 2 - margin < b.x + b.w / 2 &&
    a.x + a.w / 2 + margin > b.x - b.w / 2 &&
    a.z - a.d / 2 - margin < b.z + b.d / 2 &&
    a.z + a.d / 2 + margin > b.z - b.d / 2
  );
}

/**
 * SpawnGuard — manages a list of placed AABBs and exposes a safe placement API.
 *
 * @example
 *   const guard = new SpawnGuard();
 *   const ok = guard.tryPlace({ x: 10, z: 20, w: 8, d: 8, label: 'GatewayOfIndia' });
 *   if (!ok) console.warn('Placement rejected — overlaps existing structure');
 */
export class SpawnGuard {
  constructor() {
    /** @type {AABB[]} */
    this._placed = [];
  }

  /**
   * Attempt to place a structure. Returns true if accepted, false if rejected.
   * @param {AABB} box
   * @param {number} [margin=2]
   * @returns {boolean}
   */
  tryPlace(box, margin = 2) {
    for (const placed of this._placed) {
      if (aabbOverlap(box, placed, margin)) return false;
    }
    this._placed.push({ ...box });
    return true;
  }

  /**
   * Force-place without collision check (use for immovable anchors like spawn).
   * @param {AABB} box
   */
  forcePlace(box) {
    this._placed.push({ ...box });
  }

  /** Remove all placed objects — useful on zone unload. */
  clear() { this._placed = []; }

  /** Return a read-only copy of all placed AABBs (for debug visualisation). */
  snapshot() { return [...this._placed]; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Poisson Disk Sampling
// Distributes scattered objects (trees, collectibles, NPCs) without clumping.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates well-distributed sample points inside a rectangle using
 * Bridson's O(n) Poisson Disk Sampling algorithm.
 *
 * @param {object} opts
 * @param {number} opts.width   - total width of the area
 * @param {number} opts.depth   - total depth of the area
 * @param {number} opts.radius  - minimum distance between any two points
 * @param {number} [opts.k=30]  - attempts per candidate before rejection
 * @param {number} [opts.offsetX=0] - world-space X offset of the area origin
 * @param {number} [opts.offsetZ=0] - world-space Z offset of the area origin
 * @returns {Array<{x: number, z: number}>} array of world-space positions
 */
export function poissonDiskSample({ width, depth, radius, k = 30, offsetX = 0, offsetZ = 0 }) {
  const cellSize  = radius / Math.SQRT2;
  const cols      = Math.ceil(width / cellSize);
  const rows      = Math.ceil(depth / cellSize);
  const grid      = new Array(cols * rows).fill(null);
  const active    = [];
  const samples   = [];

  const idx = (c, r) => r * cols + c;
  const gridCell = (x, z) => [Math.floor(x / cellSize), Math.floor(z / cellSize)];
  const inBounds  = (x, z) => x >= 0 && x < width && z >= 0 && z < depth;

  // Seed with a random first point
  const x0 = width  * Math.random();
  const z0 = depth  * Math.random();
  const seed = { x: x0, z: z0 };
  const [sc, sr] = gridCell(x0, z0);
  grid[idx(sc, sr)] = seed;
  samples.push(seed);
  active.push(seed);

  while (active.length > 0) {
    const ri = Math.floor(Math.random() * active.length);
    const pt = active[ri];
    let found = false;

    for (let attempt = 0; attempt < k; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = radius + Math.random() * radius; // [r, 2r]
      const nx    = pt.x + Math.cos(angle) * dist;
      const nz    = pt.z + Math.sin(angle) * dist;

      if (!inBounds(nx, nz)) continue;

      const [nc, nr] = gridCell(nx, nz);
      let tooClose = false;

      // Check 5×5 neighbourhood
      for (let dr = -2; dr <= 2 && !tooClose; dr++) {
        for (let dc = -2; dc <= 2 && !tooClose; dc++) {
          const cc = nc + dc, cr = nr + dr;
          if (cc < 0 || cc >= cols || cr < 0 || cr >= rows) continue;
          const neighbor = grid[idx(cc, cr)];
          if (!neighbor) continue;
          const dx = nx - neighbor.x, dz = nz - neighbor.z;
          if (dx * dx + dz * dz < radius * radius) tooClose = true;
        }
      }

      if (!tooClose) {
        const np = { x: nx, z: nz };
        grid[idx(nc, nr)] = np;
        samples.push(np);
        active.push(np);
        found = true;
        break;
      }
    }

    if (!found) active.splice(ri, 1);
  }

  // Apply world-space offset
  return samples.map(s => ({ x: s.x + offsetX, z: s.z + offsetZ }));
}
