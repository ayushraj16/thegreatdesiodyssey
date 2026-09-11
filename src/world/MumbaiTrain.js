import * as THREE from 'three';

// ── Train geometry constants ──────────────────────────────────────────────────
const MAROON  = '#7B1818';
const CREAM   = '#FFF8DC';
const DARK_GR = '#333333';
const WIN_COL = '#a8d8ea';
const ROOF_C  = '#555566';

const TRACK_X  = 9;     // world x of track centre (matches main.js rails)
const START_Z  = -120;  // off-screen top (north)
const PLAT_Z   = 0;     // train centre when at platform
const END_Z    = 120;   // off-screen bottom (south)
const HALT_DUR = 8;     // seconds halted at platform
const ARR_SPD  = 9;     // max approach speed (units/sec)
const DEP_SPD  = 11;    // departure speed
const SLOW_Z   = 18;    // distance from platform to begin braking

const STATE = {
  WAITING:   'WAITING',
  ARRIVING:  'ARRIVING',
  HALTING:   'HALTING',
  HALTED:    'HALTED',
  DEPARTING: 'DEPARTING',
};

// ── Helper: build one coach body ──────────────────────────────────────────────
function makeCoach(scene, xOff) {
  const g = new THREE.Group();
  const L = 5.6, W = 2.0, H_LO = 1.0, H_HI = 1.4, ROOF_H = 0.28;
  const matMa = new THREE.MeshLambertMaterial({ color: MAROON });
  const matCr = new THREE.MeshLambertMaterial({ color: CREAM  });
  const matGr = new THREE.MeshLambertMaterial({ color: DARK_GR });
  const matRo = new THREE.MeshLambertMaterial({ color: ROOF_C });
  const matWn = new THREE.MeshLambertMaterial({ color: WIN_COL, transparent: true, opacity: 0.8 });
  const matDo = new THREE.MeshLambertMaterial({ color: '#aaaaaa' });

  // Lower maroon body
  const bLo = new THREE.Mesh(new THREE.BoxGeometry(L, H_LO, W), matMa);
  bLo.position.y = H_LO / 2;
  bLo.castShadow = true; g.add(bLo);

  // Upper cream body
  const bHi = new THREE.Mesh(new THREE.BoxGeometry(L, H_HI, W), matCr);
  bHi.position.y = H_LO + H_HI / 2;
  bHi.castShadow = true; g.add(bHi);

  // Roof
  const bRo = new THREE.Mesh(new THREE.BoxGeometry(L + 0.1, ROOF_H, W + 0.1), matRo);
  bRo.position.y = H_LO + H_HI + ROOF_H / 2;
  g.add(bRo);

  // Ventilator nub on roof
  const ventGeo = new THREE.BoxGeometry(L * 0.6, 0.18, 0.3);
  const vent = new THREE.Mesh(ventGeo, matGr);
  vent.position.y = H_LO + H_HI + ROOF_H + 0.09;
  g.add(vent);

  // Windows (platform side z=+W/2, away side z=-W/2)
  const winXs = [-1.8, -0.7, 0.4, 1.5, 2.2]; // relative x offsets
  const winGeo = new THREE.BoxGeometry(0.7, 0.55, 0.06);
  for (const wx of winXs) {
    for (const wz of [W / 2 + 0.02, -(W / 2 + 0.02)]) {
      const win = new THREE.Mesh(winGeo, matWn);
      win.position.set(wx, H_LO + H_HI * 0.55, wz);
      g.add(win);
    }
  }

  // Maroon stripe between lower/upper
  const stripeGeo = new THREE.BoxGeometry(L + 0.02, 0.12, W + 0.02);
  const stripeMat = new THREE.MeshLambertMaterial({ color: '#4a0000' });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.y = H_LO - 0.06;
  g.add(stripe);

  // Bogies
  const bogGeo = new THREE.BoxGeometry(1.0, 0.32, W * 0.85);
  for (const bx of [-1.8, 1.8]) {
    const bog = new THREE.Mesh(bogGeo, matGr);
    bog.position.set(bx, -0.16, 0);
    g.add(bog);
    // Wheels
    const whGeo = new THREE.CylinderGeometry(0.18, 0.18, W * 0.7, 8);
    const whMat = new THREE.MeshLambertMaterial({ color: '#222222' });
    const wh = new THREE.Mesh(whGeo, whMat);
    wh.rotation.x = Math.PI / 2;
    wh.position.set(bx, -0.2, 0);
    g.add(wh);
  }

  // Sliding doors (4 per coach: 2 each side)
  g.doors = [];
  const doorGeo = new THREE.BoxGeometry(0.88, H_LO + H_HI * 0.9, 0.07);
  const doorOffsets = [-1.0, 1.0];
  for (const dx of doorOffsets) {
    for (const zSign of [1, -1]) {
      const door = new THREE.Mesh(doorGeo, matDo);
      const zPos = zSign * (W / 2 + 0.03);
      door.position.set(dx, (H_LO + H_HI * 0.9) / 2, zPos);
      door.userData.closedX = dx;
      door.userData.openX  = dx + (dx > 0 ? 0.95 : -0.95);
      door.userData.zPos   = zPos;
      g.add(door);
      g.doors.push(door);
    }
  }

  g.position.x = xOff;
  return g;
}

// ── Locomotive (front engine) ─────────────────────────────────────────────────
function makeLoco(scene) {
  const g = new THREE.Group();
  const matMa = new THREE.MeshLambertMaterial({ color: MAROON });
  const matCr = new THREE.MeshLambertMaterial({ color: CREAM  });
  const matGr = new THREE.MeshLambertMaterial({ color: DARK_GR });
  const matYe = new THREE.MeshLambertMaterial({ color: '#FFD700' });

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 2.0), matMa);
  body.position.y = 1.2; body.castShadow = true; g.add(body);

  // Cab window
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 2.02), matCr);
  cab.position.set(1.2, 1.9, 0); g.add(cab);

  // Headlights
  for (const z of [0.7, -0.7]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.12), matYe);
    hl.position.set(1.65, 0.9, z); g.add(hl);
    const ptLight = new THREE.PointLight('#ffffcc', 1.5, 12);
    ptLight.position.set(2.0, 0.9, z);
    g.add(ptLight);
  }

  // Coupling bar at front
  const coup = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.35), matGr);
  coup.position.set(1.65, 0.35, 0); g.add(coup);

  // Bogies
  const bogGeo = new THREE.BoxGeometry(0.9, 0.32, 1.7);
  for (const bx of [-0.7, 0.7]) {
    const bog = new THREE.Mesh(bogGeo, matGr);
    bog.position.set(bx, -0.16, 0); g.add(bog);
  }

  g.position.x = -10.4; // in front of coaches
  return g;
}

// ── Mumbai Local Train class ──────────────────────────────────────────────────
export class MumbaiTrain {
  /**
   * @param {THREE.Scene} scene
   * @param {Function} onBanner - (text: string) => void
   */
  constructor(scene, onBanner) {
    this.scene    = scene;
    this.onBanner = onBanner;

    this.group = new THREE.Group();
    this.state = STATE.WAITING;
    this.stateTimer = 2.0;   // initial wait before first approach
    this.doorsOpen  = false;
    this.doorAnim   = 0;     // 0 = closed, 1 = open

    this._buildTrain();
    this.group.position.set(TRACK_X, 0, START_Z);
    this.group.rotation.y = Math.PI / 2; // Rotate 90deg so local -X points to +Z
    this.scene.add(this.group);
  }

  _buildTrain() {
    this.loco = makeLoco(this.scene);
    this.group.add(this.loco);

    // 3 coaches offset along x (train moves along x-axis)
    this.coaches = [];
    const coachOffsets = [-3.8, 2.6, 9.0]; // relative x centres of coaches
    for (const ox of coachOffsets) {
      const c = makeCoach(this.scene, ox);
      this.coaches.push(c);
      this.group.add(c);
    }

    // Connector plates between coaches
    const connMat = new THREE.MeshLambertMaterial({ color: '#555555' });
    for (const cx of [-0.9, 5.8]) {
      const conn = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 1.9), connMat);
      conn.position.set(cx, 1.0, 0);
      this.group.add(conn);
    }
  }

  /** Open/close all coach doors (t = 0 closed, 1 open) */
  _setDoors(t) {
    for (const coach of this.coaches) {
      for (const door of coach.doors) {
        door.position.x = THREE.MathUtils.lerp(
          door.userData.closedX,
          door.userData.openX,
          t
        );
      }
    }
  }

  /**
   * @param {number} delta
   * @param {THREE.Vector3} playerPos
   */
  update(delta, playerPos) {
    const z = this.group.position.z;

    switch (this.state) {
      // ── Waiting before departure ──────────────────────────────────────────
      case STATE.WAITING:
        this.stateTimer -= delta;
        if (this.stateTimer <= 0) {
          this.state = STATE.ARRIVING;
        }
        break;

      // ── Train approaches platform ─────────────────────────────────────────
      case STATE.ARRIVING: {
        const dist = PLAT_Z - z;
        const t    = Math.max(0, 1 - dist / SLOW_Z);   // 0 far, 1 near
        const spd  = ARR_SPD * (1 - t * t) + 1.5;     // eased slowdown
        this.group.position.z = Math.min(z + spd * delta, PLAT_Z);
        if (this.group.position.z >= PLAT_Z) {
          this.group.position.z = PLAT_Z;
          this.state = STATE.HALTING;
          this.doorAnim = 0;
          this.onBanner('🚂 Platform 1 var local yet aahe! Doors opening — please mind the gap!');
        }
        break;
      }

      // ── Door open animation ───────────────────────────────────────────────
      case STATE.HALTING:
        this.doorAnim = Math.min(this.doorAnim + delta * 1.2, 1);
        this._setDoors(this.doorAnim);
        if (this.doorAnim >= 1) {
          this.state = STATE.HALTED;
          this.stateTimer = HALT_DUR;
        }
        break;

      // ── Halted at platform ────────────────────────────────────────────────
      case STATE.HALTED:
        this.stateTimer -= delta;
        if (this.stateTimer <= 0) {
          this.state = STATE.DEPARTING;
          this.doorAnim = 1;
          this.onBanner('🚂 Doors closing! Danda maaro departure hogi! Stand clear!');
        }
        break;

      // ── Depart: close doors then accelerate ───────────────────────────────
      case STATE.DEPARTING:
        // Close doors first
        if (this.doorAnim > 0) {
          this.doorAnim = Math.max(this.doorAnim - delta * 1.5, 0);
          this._setDoors(this.doorAnim);
        } else {
          const accelT   = Math.min((this.group.position.z - PLAT_Z) / 20, 1);
          const spd      = DEP_SPD * (0.15 + accelT * 0.85);
          this.group.position.z += spd * delta;
          if (this.group.position.z >= END_Z) {
            // Teleport to start and reset
            this.group.position.z = START_Z;
            this.state = STATE.WAITING;
            this.stateTimer = 3.0;
          }
        }
        break;
    }

    // Slight rock when moving
    if (this.state === STATE.ARRIVING || this.state === STATE.DEPARTING) {
      this.group.rotation.z = Math.sin(performance.now() * 0.012) * 0.008;
    } else {
      this.group.rotation.z *= 0.92;
    }
  }

  get isHalted() {
    return this.state === STATE.HALTED || this.state === STATE.HALTING;
  }
}
