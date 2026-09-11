// ── Destination registry ──────────────────────────────────────────────────────
const DESTINATIONS = [
  { id: 'platform1',  label: 'Platform 1',            zone: '🇮🇳 Bharat Central',     pos: { x: 0,   y: 0, z: 0,  yaw: 0 } },
  { id: 'gateway',    label: 'Gateway of India',       zone: '🚂 Maharashtra',          pos: { x: 19,  y: 0, z: -100, yaw: -Math.PI/2 } },
  { id: 'marine',     label: 'Marine Drive',           zone: '🚂 Maharashtra',          pos: { x: 15,  y: 0, z: -80, yaw: -Math.PI/2 } },
  { id: 'taj',        label: 'Taj Mahal Palace',       zone: '🚂 Maharashtra',          pos: { x: 20,  y: 0, z: -120, yaw: -Math.PI/2 } },
  { id: 'hampi',      label: 'Hampi Stone Chariot',    zone: '🛕 Karnataka',            pos: { x: 10,  y: 0, z: -20, yaw: 0 } },
  { id: 'bengaluru',  label: 'Bengaluru Tech Park',    zone: '🛕 Karnataka',            pos: { x: 25,  y: 10,z: 30, yaw: 0 } },
  { id: 'kochi',      label: 'Fort Kochi Coast',       zone: '🌴 Kerala',               pos: { x: 4,   y: 0, z: 70,  yaw: -Math.PI/2 } },
  { id: 'alappuzha',  label: 'Alappuzha Backwaters',  zone: '🌴 Kerala',               pos: { x: 12,  y: 0, z: 100, yaw: Math.PI } },
  { id: 'munnar',     label: 'Munnar Tea Hills',       zone: '🌴 Kerala',               pos: { x: -60, y: 5, z: 80, yaw: Math.PI / 2 } },
];

export class TravelModal {
  /**
   * @param {HTMLElement} cloudOverlay  - the #cloud-overlay element
   * @param {Function}   onTeleport    - (pos: {x,y,z,yaw}) => void
   */
  constructor(cloudOverlay, onTeleport) {
    this._overlay   = cloudOverlay;
    this._onTeleport = onTeleport;
    this._menuEl    = null;
    this._open      = false;
    this._traveling = false;

    this._buildMenu();
    this._bindT();
  }

  // ── Build the travel menu DOM ───────────────────────────────────────────────
  _buildMenu() {
    const el = document.createElement('div');
    el.id = 'travel-modal';
    el.innerHTML = `
      <div class="tm-inner">
        <div class="tm-header">
          <span class="tm-icon">🗺️</span>
          <h2 class="tm-title">FAST TRAVEL DIRECTORY</h2>
          <button class="tm-close" id="tm-close-btn">✕</button>
        </div>
        <div class="tm-grid" id="tm-grid"></div>
        <p class="tm-hint">Select a destination · Press T or ✕ to close</p>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #travel-modal {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 400;
        background: rgba(5,2,20,0.88);
        backdrop-filter: blur(18px);
        align-items: center;
        justify-content: center;
      }
      #travel-modal.open { display: flex; }
      .tm-inner {
        background: linear-gradient(135deg, #0d0820 0%, #1a0a35 100%);
        border: 2px solid rgba(255,215,0,0.4);
        border-radius: 18px;
        padding: 28px 32px;
        max-width: 780px;
        width: 92vw;
        box-shadow: 0 0 60px rgba(255,153,51,0.2);
      }
      .tm-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 24px;
        border-bottom: 1px solid rgba(255,215,0,0.2);
        padding-bottom: 16px;
      }
      .tm-icon { font-size: 28px; }
      .tm-title {
        font-family: 'Press Start 2P', monospace;
        font-size: 13px;
        color: #FFD700;
        text-shadow: 0 0 20px rgba(255,215,0,0.5);
        flex: 1;
        letter-spacing: 1px;
      }
      .tm-close {
        background: none;
        border: 1px solid rgba(255,215,0,0.4);
        color: #FFD700;
        border-radius: 6px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      }
      .tm-close:hover { background: rgba(255,215,0,0.15); }
      .tm-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
        margin-bottom: 18px;
      }
      .dest-card {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 14px 16px;
        cursor: pointer;
        transition: all 0.18s ease;
        text-align: left;
      }
      .dest-card:hover {
        background: rgba(255,153,51,0.15);
        border-color: rgba(255,153,51,0.5);
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(255,153,51,0.2);
      }
      .dest-zone {
        font-size: 10px;
        color: rgba(255,255,255,0.45);
        margin-bottom: 5px;
        font-family: 'Outfit', sans-serif;
      }
      .dest-label {
        font-size: 13px;
        font-weight: 700;
        color: #e8e0ff;
        font-family: 'Outfit', sans-serif;
      }
      .tm-hint {
        font-size: 10px;
        color: rgba(255,255,255,0.35);
        text-align: center;
        font-family: 'Outfit', sans-serif;
      }
    `;
    document.head.appendChild(style);

    const grid = el.querySelector('#tm-grid');
    for (const dest of DESTINATIONS) {
      const card = document.createElement('div');
      card.className = 'dest-card';
      card.innerHTML = `<div class="dest-zone">${dest.zone}</div><div class="dest-label">${dest.label}</div>`;
      card.addEventListener('click', () => this._travel(dest));
      grid.appendChild(card);
    }

    el.querySelector('#tm-close-btn').addEventListener('click', () => this.closeMenu());
    document.body.appendChild(el);
    this._menuEl = el;
  }

  _bindT() {
    window.addEventListener('keydown', e => {
      if (e.code === 'KeyT') {
        if (this._open) this.closeMenu();
        else            this.openMenu();
      }
    });
  }

  openMenu() {
    this._open = true;
    this._menuEl.classList.add('open');
    document.exitPointerLock?.();
  }

  closeMenu() {
    this._open = false;
    this._menuEl.classList.remove('open');
  }

  // ── Cloud wipe ──────────────────────────────────────────────────────────────
  async _travel(dest) {
    if (this._traveling) return;
    this._traveling = true;
    this.closeMenu();

    // Clouds rush in (Clash of Clans style)
    await this._cloudIn();

    // Teleport
    this._onTeleport(dest.pos);

    // Short pause while covered
    await new Promise(r => setTimeout(r, 180));

    // Clouds part
    this._cloudOut();
    setTimeout(() => { this._traveling = false; }, 900);

    // Show banner
    setTimeout(() => {
      const b = document.getElementById('hud-banner');
      if (b) {
        b.textContent = `🗺️ Arrived at: ${dest.label}! (${dest.zone})`;
        b.classList.add('active');
        setTimeout(() => b.classList.remove('active'), 4000);
      }
    }, 750);
  }

  _cloudIn() {
    return new Promise(resolve => {
      this._overlay.classList.add('covering');
      setTimeout(resolve, 600);
    });
  }

  _cloudOut() {
    this._overlay.classList.remove('covering');
    this._overlay.classList.add('clearing');
    setTimeout(() => this._overlay.classList.remove('clearing'), 700);
  }
}
