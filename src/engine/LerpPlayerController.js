import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const MOVE_SPEED      = 8.0;    // world units / second at full sprint
const ACCEL_LERP      = 12.0;   // velocity smoothing rate (higher = snappier)
const ROT_LERP        = 14.0;   // body rotation smoothing rate
const CAM_POS_LERP    = 10.0;   // spring-arm position tracking rate
const GRAVITY         = -22.0;  // m/s²
const JUMP_IMPULSE    = 9.0;    // m/s on jump
const SENSITIVITY     = 0.0018;
const PITCH_MIN       = -0.26;  // -15°
const PITCH_MAX       =  1.05;  //  60°
const ARM_LENGTH      =  6.0;   // spring-arm distance
const HEAD_H          =  1.6;   // camera height above avatar root

// ─────────────────────────────────────────────────────────────────────────────
// LerpPlayerController
// A drop-in enhancement layer on top of the existing avatar system.
// Adds: smooth acceleration, body-facing LERP, spring-arm camera LERP.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Smooth LERP-based player controller.
 * Wraps the avatar group produced by the base PlayerController.
 *
 * Usage:
 *   const ctrl = new LerpPlayerController(scene, camera, canvas);
 *   // in game loop:
 *   ctrl.update(delta, terrain);
 */
export class LerpPlayerController {
  /**
   * @param {THREE.Scene}         scene
   * @param {THREE.PerspectiveCamera} camera
   * @param {HTMLCanvasElement}   canvas
   */
  constructor(scene, camera, canvas) {
    this.scene  = scene;
    this.camera = camera;
    this.canvas = canvas;

    // ── Camera look angles ─────────────────────────────────────────────────
    this.yaw   = 0;
    this.pitch = 0.35;
    this.isPointerLocked = false;

    // ── Physics state ──────────────────────────────────────────────────────
    /** Current velocity (world space) */
    this._velocity       = new THREE.Vector3();
    /** Desired velocity this frame (computed from input) */
    this._targetVelocity = new THREE.Vector3();
    /** Vertical velocity separate from XZ (gravity integration) */
    this._verticalVel    = 0;
    this._onGround       = false;

    // ── Body facing ────────────────────────────────────────────────────────
    /** Current facing quaternion (LERP target) */
    this._bodyQuat      = new THREE.Quaternion();
    this._targetBodyQuat = new THREE.Quaternion();

    // ── Spring-arm camera ─────────────────────────────────────────────────
    /** Camera ideal position (computed each frame) */
    this._camIdeal   = new THREE.Vector3();
    /** Camera actual position (LERP'd towards ideal) */
    this._camActual  = new THREE.Vector3();

    // ── Buff system ────────────────────────────────────────────────────────
    this.buffs           = [];
    this.speedMultiplier = 1.0;
    this.jumpMultiplier  = 1.0;

    // ── Avatar ─────────────────────────────────────────────────────────────
    this.avatarGroup = new THREE.Group();
    this.scene.add(this.avatarGroup);

    // Walk animation
    this._walkTime = 0;
    this.isMoving  = false;

    // Reuse objects to avoid per-frame GC
    this._tmpVec  = new THREE.Vector3();
    this._tmpQuat = new THREE.Quaternion();
    this._forward = new THREE.Vector3();
    this._right   = new THREE.Vector3();
    this._up      = new THREE.Vector3(0, 1, 0);

    this._setupPointerLock();
    this._setupInputMap();
  }

  // ── Input ──────────────────────────────────────────────────────────────────
  _setupInputMap() {
    this._keys = {};
    window.addEventListener('keydown', e => { this._keys[e.code] = true;  });
    window.addEventListener('keyup',   e => { this._keys[e.code] = false; });
  }

  _key(code) { return !!this._keys[code]; }

  // ── Pointer lock ───────────────────────────────────────────────────────────
  _setupPointerLock() {
    this.canvas.addEventListener('click', () => {
      const title  = document.getElementById('title-screen');
      const hidden = !title || title.style.display === 'none';
      if (!this.isPointerLocked && hidden) this.canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === this.canvas);
    });

    document.addEventListener('mousemove', e => {
      if (!this.isPointerLocked) return;
      this.yaw   -= e.movementX * SENSITIVITY;
      this.pitch -= e.movementY * SENSITIVITY;
      this.pitch  = THREE.MathUtils.clamp(this.pitch, PITCH_MIN, PITCH_MAX);
    });
  }

  // ── Public helpers ─────────────────────────────────────────────────────────
  get position() { return this.avatarGroup.position; }

  applyBuff(buff) {
    this.buffs.push({ ...buff, remaining: buff.duration });
    this._recalcMultipliers();
  }

  _recalcMultipliers() {
    let sm = 1, jm = 1;
    for (const b of this.buffs) {
      if (b.type === 'speed') sm = Math.max(sm, b.multiplier);
      if (b.type === 'jump')  jm = Math.max(jm, b.multiplier);
    }
    this.speedMultiplier = sm;
    this.jumpMultiplier  = jm;
  }

  // ── Main update ────────────────────────────────────────────────────────────
  /**
   * @param {number} delta  - seconds since last frame (capped by GameLoop)
   * @param {import('./TerrainPhysics').TerrainPhysics} [terrain]
   */
  update(delta, terrain) {
    this._tickBuffs(delta);
    this._computeTargetVelocity(delta);
    this._integrateGravity(delta, terrain);
    this._smoothBodyRotation(delta);
    this._updateSpringArmCamera(delta);
    this._animateWalk(delta);
  }

  // ── Step 1: read input, build target velocity ──────────────────────────────
  _computeTargetVelocity(delta) {
    const speed = MOVE_SPEED * this.speedMultiplier;

    // Camera-relative forward / right (XZ plane only)
    this._forward.set(
      Math.sin(this.yaw), 0, Math.cos(this.yaw)
    ).negate();
    this._right.crossVectors(this._forward, this._up).normalize();

    let dx = 0, dz = 0;
    if (this._key('KeyW') || this._key('ArrowUp'))    dz -= 1;
    if (this._key('KeyS') || this._key('ArrowDown'))  dz += 1;
    if (this._key('KeyA') || this._key('ArrowLeft'))  dx -= 1;
    if (this._key('KeyD') || this._key('ArrowRight')) dx += 1;

    this.isMoving = dx !== 0 || dz !== 0;

    this._targetVelocity.set(0, 0, 0);
    if (this.isMoving) {
      this._targetVelocity
        .addScaledVector(this._forward, -dz)
        .addScaledVector(this._right,    dx)
        .normalize()
        .multiplyScalar(speed);

      // Face body toward movement direction (LERP in _smoothBodyRotation)
      this._tmpQuat.setFromAxisAngle(
        this._up,
        Math.atan2(this._targetVelocity.x, this._targetVelocity.z)
      );
      this._targetBodyQuat.copy(this._tmpQuat);
    }

    // LERP current velocity toward target — smooth acceleration / deceleration
    const alpha = Math.min(1, ACCEL_LERP * delta);
    this._velocity.lerp(this._targetVelocity, alpha);

    // Translate avatar
    this.avatarGroup.position.addScaledVector(this._velocity, delta);
  }

  // ── Step 2: gravity + jump + terrain snapping ──────────────────────────────
  _integrateGravity(delta, terrain) {
    // Jump
    if ((this._key('Space') || this._key('KeyQ')) && this._onGround) {
      this._verticalVel = JUMP_IMPULSE * this.jumpMultiplier;
      this._onGround    = false;
    }

    this._verticalVel += GRAVITY * delta;
    this.avatarGroup.position.y += this._verticalVel * delta;

    // Ground snapping via terrain raycaster
    if (terrain) {
      const groundY = terrain.getGroundY(this.avatarGroup.position);
      if (this.avatarGroup.position.y <= groundY) {
        this.avatarGroup.position.y = groundY;
        this._verticalVel = 0;
        this._onGround    = true;
      } else {
        this._onGround = false;
      }
    } else {
      // Fallback: flat floor at y=0
      if (this.avatarGroup.position.y < 0) {
        this.avatarGroup.position.y = 0;
        this._verticalVel = 0;
        this._onGround    = true;
      }
    }
  }

  // ── Step 3: smooth body rotation ──────────────────────────────────────────
  _smoothBodyRotation(delta) {
    if (!this.isMoving) return;
    const alpha = Math.min(1, ROT_LERP * delta);
    this._bodyQuat.slerp(this._targetBodyQuat, alpha);
    this.avatarGroup.quaternion.copy(this._bodyQuat);
  }

  // ── Step 4: spring-arm camera LERP ────────────────────────────────────────
  _updateSpringArmCamera(delta) {
    const pivot = this.avatarGroup.position;

    // Compute ideal camera position from yaw / pitch / arm length
    const sinY = Math.sin(this.yaw),    cosY = Math.cos(this.yaw);
    const sinP = Math.sin(this.pitch),  cosP = Math.cos(this.pitch);

    this._camIdeal.set(
      pivot.x - sinY * cosP * ARM_LENGTH,
      pivot.y + HEAD_H + sinP * ARM_LENGTH,
      pivot.z - cosY * cosP * ARM_LENGTH,
    );

    // LERP actual camera toward ideal — smooths jitter / bumps
    const alpha = Math.min(1, CAM_POS_LERP * delta);
    this._camActual.lerp(this._camIdeal, alpha);

    this.camera.position.copy(this._camActual);
    this.camera.lookAt(pivot.x, pivot.y + HEAD_H, pivot.z);
  }

  // ── Step 5: walk animation ─────────────────────────────────────────────────
  _animateWalk(delta) {
    if (!this.isMoving) return;
    this._walkTime += delta * 8;
    const swing = Math.sin(this._walkTime) * 0.5;
    // Expose limb pivots so the base avatar mesh can be swung
    if (this.lArmPivot) this.lArmPivot.rotation.x =  swing;
    if (this.rArmPivot) this.rArmPivot.rotation.x = -swing;
    if (this.lLegPivot) this.lLegPivot.rotation.x = -swing;
    if (this.rLegPivot) this.rLegPivot.rotation.x =  swing;
  }

  // ── Buff ticker ────────────────────────────────────────────────────────────
  _tickBuffs(delta) {
    const ms = delta * 1000;
    for (const b of this.buffs) b.remaining -= ms;
    this.buffs = this.buffs.filter(b => b.remaining > 0);
    this._recalcMultipliers();
  }

  getActiveBuffLabels() {
    return this.buffs.map(b => {
      const s = Math.ceil(b.remaining / 1000);
      const icons = { speed:'⚡', jump:'🦘', shield:'🛡️', stamina:'💪', focus:'🎯', strength:'💥' };
      return `${icons[b.type] || '✨'} ${b.type[0].toUpperCase()+b.type.slice(1)} x${b.multiplier} (${s}s)`;
    });
  }
}
