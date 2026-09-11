export class IndiaMapModal {
  constructor(player) {
    this.player = player;
    this._menuEl = null;
    this._open = false;
    this._dotEl = null;
    this._buildMenu();
    this._bindM();
  }

  _buildMenu() {
    const el = document.createElement('div');
    el.id = 'india-map-modal';
    el.innerHTML = `
      <div class="imm-inner">
        <div class="imm-header">
          <span class="imm-icon">🗺️</span>
          <h2 class="imm-title">AERIAL MAP OF INDIA</h2>
          <button class="imm-close" id="imm-close-btn">✕</button>
        </div>
        <div class="imm-map-container">
          <!-- Stylized map background -->
          <div class="imm-map-bg">
            <div class="imm-zone imm-maharashtra">Maharashtra</div>
            <div class="imm-zone imm-karnataka">Karnataka</div>
            <div class="imm-zone imm-kerala">Kerala</div>
          </div>
          <div class="imm-player-blip" id="imm-player-blip">
            <div class="imm-blip-pulse"></div>
            <div class="imm-blip-core"></div>
            <div class="imm-blip-label">YOU ARE HERE</div>
          </div>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #india-map-modal {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 400;
        background: rgba(5,2,20,0.88);
        backdrop-filter: blur(18px);
        align-items: center;
        justify-content: center;
      }
      #india-map-modal.open { display: flex; }
      .imm-inner {
        background: linear-gradient(135deg, #0d1a20 0%, #0a2535 100%);
        border: 2px solid rgba(142,202,230,0.4);
        border-radius: 18px;
        padding: 28px 32px;
        width: 80vw;
        max-width: 800px;
        height: 80vh;
        max-height: 800px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 0 60px rgba(142,202,230,0.2);
      }
      .imm-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 24px;
        border-bottom: 1px solid rgba(142,202,230,0.2);
        padding-bottom: 16px;
      }
      .imm-icon { font-size: 28px; }
      .imm-title {
        font-family: 'Press Start 2P', monospace;
        font-size: 13px;
        color: #8ECAE6;
        text-shadow: 0 0 20px rgba(142,202,230,0.5);
        flex: 1;
        letter-spacing: 1px;
      }
      .imm-close {
        background: none;
        border: 1px solid rgba(142,202,230,0.4);
        color: #8ECAE6;
        border-radius: 6px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      }
      .imm-close:hover { background: rgba(142,202,230,0.15); }
      .imm-map-container {
        flex: 1;
        position: relative;
        background: #020a10;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        overflow: hidden;
      }
      .imm-map-bg {
        position: absolute;
        inset: 0;
        background-image: 
          linear-gradient(rgba(142,202,230,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(142,202,230,0.05) 1px, transparent 1px);
        background-size: 20px 20px;
        display: flex;
        flex-direction: column;
      }
      .imm-zone {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Press Start 2P', monospace;
        font-size: 18px;
        opacity: 0.3;
        letter-spacing: 4px;
        border-bottom: 1px dashed rgba(255,255,255,0.2);
      }
      .imm-maharashtra { color: #FF9933; background: rgba(255,153,51,0.05); }
      .imm-karnataka   { color: #FFD700; background: rgba(255,215,0,0.05); }
      .imm-kerala      { color: #4CAF50; background: rgba(76,175,80,0.05); border-bottom: none; }
      
      .imm-player-blip {
        position: absolute;
        width: 12px;
        height: 12px;
        transform: translate(-50%, -50%);
        z-index: 10;
      }
      .imm-blip-core {
        position: absolute;
        inset: 0;
        background: #FF9933;
        border-radius: 50%;
        border: 2px solid #FFF;
      }
      .imm-blip-pulse {
        position: absolute;
        inset: -10px;
        background: rgba(255,153,51,0.5);
        border-radius: 50%;
        animation: blipPulse 1.5s infinite;
      }
      @keyframes blipPulse {
        0% { transform: scale(0.5); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
      }
      .imm-blip-label {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
        font-size: 10px;
        color: #FFF;
        background: #000;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
        border: 1px solid #FF9933;
      }
    `;
    document.head.appendChild(style);

    el.querySelector('#imm-close-btn').addEventListener('click', () => this.closeMenu());
    document.body.appendChild(el);
    this._menuEl = el;
    this._dotEl = el.querySelector('#imm-player-blip');
  }

  _bindM() {
    window.addEventListener('keydown', e => {
      if (e.code === 'KeyM') {
        if (this._open) this.closeMenu();
        else            this.openMenu();
      }
    });
  }

  openMenu() {
    this._open = true;
    this._menuEl.classList.add('open');
    document.exitPointerLock?.();
    this._updateBlip();
  }

  closeMenu() {
    this._open = false;
    this._menuEl.classList.remove('open');
  }

  _updateBlip() {
    if (!this._open || !this.player) return;
    
    // Map Z bounds: [-150, 160] to Y% [0, 100]
    // Map X bounds: [-80, 80] to X% [0, 100]
    const WORLD_Z_MIN = -150;
    const WORLD_Z_MAX = 160;
    const WORLD_X_MIN = -100;
    const WORLD_X_MAX = 100;
    
    const pz = this.player.position.z;
    const px = this.player.position.x;
    
    // Y percentage goes from top (Z_MIN) to bottom (Z_MAX)
    const ny = Math.max(0, Math.min(1, (pz - WORLD_Z_MIN) / (WORLD_Z_MAX - WORLD_Z_MIN)));
    const nx = Math.max(0, Math.min(1, (px - WORLD_X_MIN) / (WORLD_X_MAX - WORLD_X_MIN)));
    
    this._dotEl.style.top = `${ny * 100}%`;
    this._dotEl.style.left = `${nx * 100}%`;
    
    requestAnimationFrame(() => this._updateBlip());
  }
}
