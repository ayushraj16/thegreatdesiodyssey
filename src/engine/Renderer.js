import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// GameLoop — decoupled, time-based animation driver
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Decoupled game loop using requestAnimationFrame.
 * Provides stable, capped deltaTime to prevent spiral-of-death on tab switch.
 *
 * @example
 *   const loop = new GameLoop();
 *   loop.onTick = (delta, elapsed) => { player.update(delta); renderer.render(); };
 *   loop.start();
 */
export class GameLoop {
  /** Maximum delta cap — prevents huge jumps after tab resume (seconds) */
  static MAX_DELTA = 0.1;

  constructor() {
    this._rafId    = null;
    this._last     = null;
    this.elapsed   = 0;
    /** @type {(delta: number, elapsed: number) => void} */
    this.onTick    = null;
  }

  start() {
    this._last = performance.now();
    this._tick();
  }

  stop() {
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }

  _tick() {
    this._rafId = requestAnimationFrame((now) => {
      const raw   = (now - this._last) / 1000;
      const delta = Math.min(raw, GameLoop.MAX_DELTA);
      this._last  = now;
      this.elapsed += delta;

      if (typeof this.onTick === 'function') this.onTick(delta, this.elapsed);
      this._tick();
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RendererFactory — creates a production-grade WebGLRenderer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a WebGLRenderer configured for a large open-world voxel game.
 *
 * Key decisions:
 *  - logarithmicDepthBuffer: true  → eliminates Z-fighting at all distances
 *  - near: 0.1, far: 2000          → covers ground-level to cinematic altitude
 *  - ACES tone mapping             → cinematic colour grading out of the box
 *  - PCFSoft shadows               → soft, high-quality shadow edges
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} [opts]
 * @param {number} [opts.pixelRatio=2]
 * @returns {{ renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera }}
 */
export function createRenderer(canvas, opts = {}) {
  const { pixelRatio = 2 } = opts;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    logarithmicDepthBuffer: true,   // ← single-line Z-fighting fix
    powerPreference: 'high-performance',
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Shadows
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

  // HDR-like tone mapping
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  // Camera tuned for open world: near tight, far massive
  const camera = new THREE.PerspectiveCamera(
    65,                                    // vertical FOV
    window.innerWidth / window.innerHeight,
    0.1,                                   // near — tight to reduce precision waste
    2000,                                  // far  — covers full map + cinematic alt
  );

  // Responsive resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { renderer, camera };
}
