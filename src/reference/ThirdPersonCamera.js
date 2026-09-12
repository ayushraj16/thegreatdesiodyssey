import * as THREE from 'three';

/** Owns mouse input only on the game canvas; UI buttons never request lock. */
export class ThirdPersonCamera {
  constructor(camera, canvas, target, { groundHeight = () => 0, onHint = () => {} } = {}) {
    this.camera = camera; this.canvas = canvas; this.document = canvas?.ownerDocument;
    this.groundHeight = groundHeight; this.onHint = onHint;
    this.yaw = 0; this.pitch = .55; this.distance = 32; this.mapMode = false;
    this.target = target.clone().add(new THREE.Vector3(0, 2, 0));
    this.desired = new THREE.Vector3(); this.lookTarget = new THREE.Vector3();
    this.dragging = false; this.disposed = false;
    this.look = event => {
      if (this.disposed || this.mapMode || (!this.locked && !this.dragging)) return;
      this.yaw = THREE.MathUtils.euclideanModulo(this.yaw - event.movementX * .0025 + Math.PI, Math.PI * 2) - Math.PI;
      this.pitch = THREE.MathUtils.clamp(this.pitch + event.movementY * .0025, .12, 1.35);
    };
    this.down = event => {
      if (event.button !== 0 || this.mapMode || this.disposed) return;
      this.dragging = true;
      if (!canvas.requestPointerLock) { this.onHint('Drag to look · Scroll to zoom'); return; }
      try { canvas.requestPointerLock()?.catch(() => this.lockError()); }
      catch { this.lockError(); }
    };
    this.up = () => { this.dragging = false; };
    this.escape = event => { if (event.code === 'Escape') this.release(); };
    this.lockError = () => { if (!this.disposed) this.onHint('Drag to look · Scroll to zoom'); };
    this.lockChanged = () => {
      this.dragging = false;
      if (this.disposed && this.locked) this.document.exitPointerLock();
      else if (!this.disposed) this.onHint(this.locked ? 'Mouse: look · Scroll: zoom · Esc: release mouse' : 'Click to look · Scroll to zoom');
    };
    this.wheel = event => {
      if (this.mapMode) return;
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 600 : 1);
      this.distance = THREE.MathUtils.clamp(this.distance * Math.exp(THREE.MathUtils.clamp(delta, -300, 300) * .001), 10, 65);
    };
    canvas?.addEventListener('mousedown', this.down);
    canvas?.addEventListener('wheel', this.wheel, { passive: false });
    this.document?.addEventListener('mousemove', this.look);
    this.document?.addEventListener('mouseup', this.up);
    this.document?.addEventListener('keydown', this.escape);
    this.document?.addEventListener('pointerlockchange', this.lockChanged);
    this.document?.addEventListener('pointerlockerror', this.lockError);
    this.document?.defaultView?.addEventListener('blur', this.up);
    this.update(0, target, true);
  }
  get locked() { return !!this.canvas && this.document?.pointerLockElement === this.canvas; }
  release() { this.dragging = false; if (this.locked) this.document.exitPointerLock(); }
  update(dt, position, snap = false) {
    if (this.mapMode) this.lookTarget.set(0, 0, -7);
    else this.lookTarget.copy(position).y += 2;
    this.target.lerp(this.lookTarget, snap ? 1 : 1 - Math.exp(-10 * dt));
    if (this.mapMode) this.desired.set(0, 195, 262);
    else this.desired.set(Math.sin(this.yaw) * Math.cos(this.pitch) * this.distance,
      Math.sin(this.pitch) * this.distance, Math.cos(this.yaw) * Math.cos(this.pitch) * this.distance);
    this.desired.add(this.target);
    this.camera.position.lerp(this.desired, snap ? 1 : 1 - Math.exp(-12 * dt));
    this.camera.position.y = Math.max(this.camera.position.y, this.groundHeight(this.camera.position.x, this.camera.position.z) + 2);
    this.camera.lookAt(this.target);
  }
  dispose() {
    if (this.disposed) return; this.disposed = true; this.release();
    this.canvas?.removeEventListener('mousedown', this.down); this.canvas?.removeEventListener('wheel', this.wheel);
    this.document?.removeEventListener('mousemove', this.look); this.document?.removeEventListener('mouseup', this.up);
    this.document?.removeEventListener('keydown', this.escape);
    this.document?.removeEventListener('pointerlockchange', this.lockChanged); this.document?.removeEventListener('pointerlockerror', this.lockError);
    this.document?.defaultView?.removeEventListener('blur', this.up);
  }
}
