import * as THREE from 'three';

/**
 * Distant city silhouette for depth — fog-blended low-poly skyline
 * placed far behind Maharashtra zone at x = 110, visible from platform.
 */
export class DistantCity {
  constructor(scene) {
    this.scene = scene;
  }

  init() {
    const s = this.scene;
    const g = new THREE.Group();

    function hazyMat(hex, opacity = 1.0) {
      return new THREE.MeshLambertMaterial({
        color: hex,
        transparent: opacity < 1.0,
        opacity,
        fog: true,
      });
    }

    const GLASS  = hazyMat('#7aaabb', 0.88);
    const STONE  = hazyMat('#aabbc0', 0.90);
    const CREAM  = hazyMat('#c8c0a8', 0.92);
    const DARK   = hazyMat('#3a4855', 0.85);
    const ORANGE = hazyMat('#c86030', 0.88);

    function bld(w, h, d, mat, x, z) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, h / 2, z);
      g.add(m);
    }

    // Back row — tall towers
    bld(4, 30, 4, GLASS,  0,   0);
    bld(6, 22, 5, STONE,  6,  -3);
    bld(3, 40, 3, DARK,  -4,   2);
    bld(5, 18, 5, CREAM, -10,  0);
    bld(4, 35, 4, GLASS,  12,  2);
    bld(3, 28, 3, DARK,   18, -2);
    bld(6, 16, 5, STONE,  22,  3);
    bld(4, 44, 4, GLASS, -15,  1);
    bld(3, 20, 3, ORANGE,-20, -1);
    bld(5, 32, 4, STONE, -25,  2);
    bld(4, 26, 4, DARK,   28,  0);
    bld(3, 38, 3, GLASS,  34, -2);
    bld(6, 14, 5, CREAM,  38,  3);
    bld(4, 50, 4, DARK,  -30,  0);

    // Mid row
    bld(3, 12, 3, CREAM,  3,  6);
    bld(4, 15, 4, GLASS, -8,  7);
    bld(3,  9, 3, STONE,  15, 5);
    bld(5, 13, 5, ORANGE, 25, 6);
    bld(3, 17, 3, DARK,  -18, 7);
    bld(4, 11, 4, CREAM,  30, 5);
    bld(3,  8, 3, GLASS, -35, 6);

    // Front podiums
    bld(8,  5, 6, STONE,  -2, 10);
    bld(10, 4, 7, CREAM,   8, 11);
    bld(6,  6, 5, ORANGE, -14,10);
    bld(9,  3, 7, STONE,   18,11);
    bld(7,  5, 6, DARK,   -22,10);
    bld(8,  4, 6, CREAM,   28,10);

    // Antenna spire on tallest
    const spire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.15, 10, 4),
      hazyMat('#cc4444', 0.8)
    );
    spire.position.set(-30, 55, 0);
    g.add(spire);

    const tipLight = new THREE.PointLight('#ff2200', 2, 20);
    tipLight.position.set(-30, 60, 0);
    g.add(tipLight);
    this._tipLight = tipLight;

    g.position.set(110, -1, 0);
    s.add(g);
    this._group = g;
  }

  update(t) {
    if (this._tipLight) {
      this._tipLight.intensity = 1.5 + Math.sin(t * 3) * 1.5;
    }
  }
}
