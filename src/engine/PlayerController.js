import * as THREE from 'three';
import { buildVoxelMesh } from './VoxelBuilder.js';
import { KEYS } from './Input.js';

// ── Avatar voxel definitions ──────────────────────────────────────────────────
// Avatar is built so that Y=0 is exactly the soles of the feet.
const HEAD_VOXELS = [
  [0,0,0,'#C68642'],[1,0,0,'#C68642'],[2,0,0,'#C68642'],
  [0,1,0,'#C68642'],[1,1,0,'#C68642'],[2,1,0,'#C68642'],
  [0,2,0,'#111111'],[1,2,0,'#111111'],[2,2,0,'#111111'], // sunglasses
  [0,3,0,'#3B1F0A'],[1,3,0,'#3B1F0A'],[2,3,0,'#3B1F0A'], // hair
];
const TORSO_VOXELS = [
  [0,0,0,'#F5F5F5'],[1,0,0,'#F5F5F5'],[2,0,0,'#F5F5F5'],
  [0,1,0,'#F5F5F5'],[1,1,0,'#F5F5F5'],[2,1,0,'#F5F5F5'],
  [0,2,0,'#F5F5F5'],[1,2,0,'#F5F5F5'],[2,2,0,'#F5F5F5'],
  [0,3,0,'#F5F5F5'],[1,3,0,'#F5F5F5'],[2,3,0,'#F5F5F5'],
  [2,3,0,'#CC2222'],[1,2,0,'#CC2222'],[0,1,0,'#CC2222'], // gamcha diagonal
];
const LARM_VOXELS = [[0,0,0,'#F5F5F5'],[0,1,0,'#F5F5F5'],[0,2,0,'#C68642'],[0,3,0,'#C68642']];
const RARM_VOXELS = [[0,0,0,'#F5F5F5'],[0,1,0,'#F5F5F5'],[0,2,0,'#C68642'],[0,3,0,'#C68642']];
const LLEG_VOXELS = [[0,0,0,'#2C2C2C'],[0,1,0,'#2C2C2C'],[0,2,0,'#2C2C2C'],[0,3,0,'#1A1A1A']];
const RLEG_VOXELS = [[0,0,0,'#2C2C2C'],[0,1,0,'#2C2C2C'],[0,2,0,'#2C2C2C'],[0,3,0,'#1A1A1A']];

// ── Camera constants ──────────────────────────────────────────────────────────
const SENSITIVITY = 0.0018;
const PITCH_MIN   = -0.26;   // -15 deg
const PITCH_MAX   =  1.05;   //  60 deg
const ARM_LENGTH  =  6.0;    // spring-arm units
const HEAD_H      =  1.6;    // head height above avatar.position.y

export class PlayerController {
  /**
   * @param {THREE.Scene}       scene
   * @param {THREE.Camera}      camera
   * @param {HTMLCanvasElement} domElement - canvas for pointer lock
   */
  constructor(scene, camera, domElement) {
    this.scene      = scene;
    this.camera     = camera;
    this.domElement = domElement;

    // Camera angles
    this.yaw   = 0;
    this.pitch = 0.35;
    this.isPointerLocked = false;

    // Speed / buffs
    this.baseSpeed      = 5;
    this.speedMultiplier = 1.0;
    this.buffs = [];

    // Walk animation
    this.walkTime = 0;
    this.isMoving = false;

    // Boat boarding
    this.onBoat  = false;
    this.boatRef = null;

    this._buildAvatar();
    this._setupPointerLock();
  }

  // ── Pointer lock setup ──────────────────────────────────────────────────────
  _setupPointerLock() {
    // Click canvas to grab pointer — only if modals are closed
    this.domElement.addEventListener('click', () => {
      const titleGone = document.getElementById('title-screen')?.style.display === 'none';
      const mapClosed = document.getElementById('india-map-modal')?.style.display !== 'flex';
      const travelClosed = document.getElementById('travel-modal')?.style.display !== 'flex';
      
      if (!this.isPointerLocked && titleGone && mapClosed && travelClosed) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === this.domElement);
    });

    document.addEventListener('mousemove', e => {
      if (!this.isPointerLocked) return;
      this.yaw   -= e.movementX * SENSITIVITY;
      this.pitch -= e.movementY * SENSITIVITY;
      this.pitch  = THREE.MathUtils.clamp(this.pitch, PITCH_MIN, PITCH_MAX);
    });
  }

  // ── Build voxel avatar ──────────────────────────────────────────────────────
  _buildAvatar() {
    this.avatarGroup = new THREE.Group();

    // The avatar pivot is at Y=0 (soles of the feet)
    const legH = 0.18 * 4; // 0.72
    const torsoH = 0.18 * 4; // 0.72
    const headH = 0.18 * 4; // 0.72

    // Head
    this.headMesh = buildVoxelMesh(HEAD_VOXELS, 0.18);
    this.headMesh.position.set(0, legH + torsoH, 0);
    this.avatarGroup.add(this.headMesh);

    // Torso
    this.torsoMesh = buildVoxelMesh(TORSO_VOXELS, 0.18);
    this.torsoMesh.position.set(0, legH, 0);
    this.avatarGroup.add(this.torsoMesh);

    // Arms (with pivots for swing animation)
    this.lArmPivot = new THREE.Group();
    this.lArmPivot.position.set(-0.35, legH + torsoH - 0.1, 0);
    this.lArmMesh  = buildVoxelMesh(LARM_VOXELS, 0.18);
    this.lArmMesh.position.y = -torsoH / 2;
    this.lArmPivot.add(this.lArmMesh);
    this.avatarGroup.add(this.lArmPivot);

    this.rArmPivot = new THREE.Group();
    this.rArmPivot.position.set(0.35, legH + torsoH - 0.1, 0);
    this.rArmMesh  = buildVoxelMesh(RARM_VOXELS, 0.18);
    this.rArmMesh.position.y = -torsoH / 2;
    this.rArmPivot.add(this.rArmMesh);
    this.avatarGroup.add(this.rArmPivot);

    // Legs
    this.lLegPivot = new THREE.Group();
    this.lLegPivot.position.set(-0.18, legH, 0);
    this.lLegMesh  = buildVoxelMesh(LLEG_VOXELS, 0.18);
    this.lLegMesh.position.y = -legH;
    this.lLegPivot.add(this.lLegMesh);
    this.avatarGroup.add(this.lLegPivot);

    this.rLegPivot = new THREE.Group();
    this.rLegPivot.position.set(0.18, legH, 0);
    this.rLegMesh  = buildVoxelMesh(RLEG_VOXELS, 0.18);
    this.rLegMesh.position.y = -legH;
    this.rLegPivot.add(this.rLegMesh);
    this.avatarGroup.add(this.rLegPivot);

    this.avatarGroup.castShadow = true;
    this.scene.add(this.avatarGroup);
  }

  // ── Public getters ──────────────────────────────────────────────────────────
  get position() { return this.avatarGroup.position; }

  applyBuff(buff) {
    this.buffs.push({ ...buff, remaining: buff.duration });
    this._recalcSpeed();
  }

  _recalcSpeed() {
    let mult = 1.0;
    for (const b of this.buffs) {
      if (b.type === 'speed') mult = Math.max(mult, b.multiplier);
    }
    this.speedMultiplier = mult;
  }

  getActiveBuffLabels() {
    return this.buffs.map(b => {
      const s = Math.ceil(b.remaining / 1000);
      const m = b.multiplier;
      if (b.type === 'speed')    return `⚡ Speed x${m} (${s}s)`;
      if (b.type === 'jump')     return `🦘 Jump x${m} (${s}s)`;
      if (b.type === 'shield')   return `🛡️ Shield (${s}s)`;
      if (b.type === 'stamina')  return `💪 Stamina x${m} (${s}s)`;
      if (b.type === 'focus')    return `🎯 Focus x${m} (${s}s)`;
      if (b.type === 'strength') return `💥 Strength x${m} (${s}s)`;
      return `✨ Buff (${s}s)`;
    });
  }

  // ── Main update ─────────────────────────────────────────────────────────────
  /**
   * @param {number} delta
   * @param {import('./TerrainPhysics').TerrainPhysics} [terrain]
   */
  update(delta, terrain) {
    // ── Tick buffs ────────────────────────────────────────────────────────────
    for (const b of this.buffs) b.remaining -= delta * 1000;
    const prev = this.buffs.length;
    this.buffs = this.buffs.filter(b => b.remaining > 0);
    if (this.buffs.length !== prev) this._recalcSpeed();

    // ── Movement ──────────────────────────────────────────────────────────────
    if (!this.onBoat) {
      // Calculate movement vectors strictly relative to camera yaw
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      
      const right = new THREE.Vector3();
      right.crossVectors(this.camera.up, forward).negate().normalize();

      const move = new THREE.Vector3();
      if (KEYS.has('KeyW') || KEYS.has('ArrowUp'))    move.add(forward);
      if (KEYS.has('KeyS') || KEYS.has('ArrowDown'))  move.sub(forward);
      if (KEYS.has('KeyA') || KEYS.has('ArrowLeft'))  move.sub(right);
      if (KEYS.has('KeyD') || KEYS.has('ArrowRight')) move.add(right);

      this.isMoving = move.lengthSq() > 0.001;

      if (this.isMoving) {
        move.normalize(); // Normalize composite diagonal vectors
        
        let slopeSpeedMod = 1.0;
        let targetY = this.avatarGroup.position.y;
        const prevPos = this.avatarGroup.position.clone();
        
        // Proposed new XZ position
        const proposed = prevPos.clone();
        
        // Preliminary XZ move to test terrain
        let tempSpeed = this.baseSpeed * this.speedMultiplier;
        proposed.x += move.x * tempSpeed * delta;
        proposed.z += move.z * tempSpeed * delta;

        // Terrain physics: adjust Y, check cliff, get slope modifier
        if (terrain) {
          const res = terrain.resolve(prevPos, proposed, delta);
          
          if (!res.blocked) {
            // Apply the slope speed modifier for the actual move
            slopeSpeedMod = res.speedMod;
            const finalSpeed = tempSpeed * slopeSpeedMod;
            
            proposed.x = prevPos.x + move.x * finalSpeed * delta;
            proposed.z = prevPos.z + move.z * finalSpeed * delta;
            targetY = res.targetY;
            
            this.avatarGroup.position.x = proposed.x;
            this.avatarGroup.position.z = proposed.z;
          } else {
            targetY = res.targetY;
          }
        } else {
          this.avatarGroup.position.x = proposed.x;
          this.avatarGroup.position.z = proposed.z;
        }

        // Smooth Y transition
        this.avatarGroup.position.y = THREE.MathUtils.damp(this.avatarGroup.position.y, targetY, 14, delta);

        // Smooth face direction (shortest-arc interpolation)
        const targetAngle = Math.atan2(move.x, move.z);
        let diff = targetAngle - this.avatarGroup.rotation.y;
        while (diff >  Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        this.avatarGroup.rotation.y += diff * 10 * delta;
      } else if (terrain) {
        // Still apply gravity/smoothing when standing still
        const cur = this.avatarGroup.position.clone();
        const groundY = terrain.getGroundY(cur);
        this.avatarGroup.position.y = THREE.MathUtils.damp(this.avatarGroup.position.y, groundY, 14, delta);
      }
    } else if (this.boatRef) {
      // On boat: lock to deck
      const bp = this.boatRef.position;
      this.avatarGroup.position.set(bp.x, bp.y + 0.3, bp.z + 0.3); // Adjust for Y=0 pivot
    }

    // ── Walk animation ────────────────────────────────────────────────────────
    if (this.isMoving && !this.onBoat) {
      this.walkTime += delta * 8;
    } else {
      this.walkTime *= 0.82;
    }

    const swing = Math.sin(this.walkTime) * 0.55;
    this.lArmPivot.rotation.x =  swing;
    this.rArmPivot.rotation.x = -swing;
    this.lLegPivot.rotation.x = -swing;
    this.rLegPivot.rotation.x =  swing;

    // Body bob
    this.torsoMesh.position.y = 0.72 + Math.abs(Math.sin(this.walkTime)) * 0.04;

    // ── Spring-arm camera ─────────────────────────────────────────────────────
    const headPos = new THREE.Vector3(
      this.avatarGroup.position.x,
      this.avatarGroup.position.y + HEAD_H,
      this.avatarGroup.position.z
    );

    // Arm offset rotated by yaw (Y) then pitch (X) in YXZ order
    const armOffset = new THREE.Vector3(0, 0, ARM_LENGTH);
    armOffset.applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));

    const targetCamPos = headPos.clone().add(armOffset);
    
    // Clamp camera position above terrain
    if (terrain) {
      const camGroundY = terrain.getGroundY(targetCamPos);
      targetCamPos.y = Math.max(targetCamPos.y, camGroundY + 1.2);
    }
    
    // Lerp camera
    this.camera.position.lerp(targetCamPos, 0.15); // Adjust lerp speed slightly for stability
    this.camera.lookAt(headPos);
  }
}
