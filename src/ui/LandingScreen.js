
/**
 * Manages the festive landing / title screen.
 * Handles dismiss + pointer lock handshake.
 */
export class LandingScreen {
  /**
   * @param {Function} onStart - called when player dismisses title screen
   * @param {HTMLCanvasElement} canvas - game canvas (for requestPointerLock)
   */
  constructor(onStart, canvas) {
    this.onStart  = onStart;
    this.canvas   = canvas;
    this._dismissed = false;
    this._setup();
  }

  _setup() {
    const screen  = document.getElementById('title-screen');
    const btn     = document.getElementById('start-btn');
    if (!screen || !btn) return;

    const dismiss = () => {
      if (this._dismissed) return;
      this._dismissed = true;

      // Animate out
      screen.classList.add('hidden');
      setTimeout(() => { screen.style.display = 'none'; }, 900);

      // Request pointer lock (GTA controls)
      this.canvas?.requestPointerLock?.();

      // Callback to main
      this.onStart?.();

      // Welcome banner after fade
      setTimeout(() => {
        const b = document.getElementById('hud-banner');
        if (b) {
          b.textContent = '🎮 Yatra shuru! WASD to move · Mouse to look · M for map · E to board boats';
          b.classList.add('active');
          setTimeout(() => b.classList.remove('active'), 6000);
        }
      }, 1100);
    };

    btn.addEventListener('click', dismiss);

    document.addEventListener('keydown', e => {
      if ((e.code === 'Enter' || e.code === 'Space') && !this._dismissed) {
        dismiss();
      }
    });
  }
}
