import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// NetworkManager — WebSocket client with Snapshot Interpolation
// ─────────────────────────────────────────────────────────────────────────────

/** How many milliseconds of network snapshots to buffer before interpolating. */
const INTERP_DELAY_MS = 100;

/**
 * A buffered position snapshot received from the server.
 * @typedef {{ timestamp: number, x: number, y: number, z: number, yaw: number }} Snapshot
 */

/**
 * RemotePlayer — represents another connected player in the scene.
 * Holds a snapshot buffer and interpolates smoothly between positions.
 */
class RemotePlayer {
  /**
   * @param {string}      id     - server-assigned player ID
   * @param {THREE.Scene} scene
   */
  constructor(id, scene) {
    this.id    = id;
    this.scene = scene;

    /** @type {Snapshot[]} - ring buffer of incoming position snapshots */
    this._buffer = [];

    // Simple voxel placeholder avatar (replace with your VoxelBuilder mesh)
    const geo = new THREE.BoxGeometry(0.5, 1.8, 0.5);
    const mat = new THREE.MeshLambertMaterial({ color: '#FF9933' });
    this.mesh  = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.mesh.userData.playerId = id;
    scene.add(this.mesh);

    // Name label (billboard sprite)
    this._label = this._makeLabel(id);
    scene.add(this._label);

    this._lastPos = new THREE.Vector3();
    this._tmpPos  = new THREE.Vector3();
  }

  /** Push a new server snapshot into the buffer. */
  pushSnapshot(snap) {
    this._buffer.push(snap);
    // Keep buffer bounded — discard snapshots older than 2 × delay
    const cutoff = snap.timestamp - INTERP_DELAY_MS * 2;
    while (this._buffer.length > 2 && this._buffer[0].timestamp < cutoff) {
      this._buffer.shift();
    }
  }

  /**
   * Interpolate the remote avatar toward the buffered position.
   * @param {number} renderTime - current render time (ms) — applies interp delay
   */
  interpolate(renderTime) {
    const target = renderTime - INTERP_DELAY_MS;

    // Need at least two snapshots to interpolate between
    if (this._buffer.length < 2) return;

    // Walk buffer to find the two snapshots that bracket `target`
    let older = this._buffer[0];
    let newer = this._buffer[1];

    for (let i = 1; i < this._buffer.length; i++) {
      if (this._buffer[i].timestamp >= target) {
        older = this._buffer[i - 1];
        newer = this._buffer[i];
        break;
      }
      older = this._buffer[i];
      newer = this._buffer[i]; // fallback: extrapolate from latest
    }

    const span = newer.timestamp - older.timestamp;
    const t    = span > 0
      ? THREE.MathUtils.clamp((target - older.timestamp) / span, 0, 1)
      : 1;

    // LERP position
    this._tmpPos.set(
      THREE.MathUtils.lerp(older.x, newer.x, t),
      THREE.MathUtils.lerp(older.y, newer.y, t),
      THREE.MathUtils.lerp(older.z, newer.z, t),
    );
    this.mesh.position.copy(this._tmpPos);

    // LERP yaw (shortest-path via sin/cos blending)
    const yaw = lerpAngle(older.yaw ?? 0, newer.yaw ?? 0, t);
    this.mesh.rotation.y = yaw;

    // Keep name label above head
    this._label.position.set(this._tmpPos.x, this._tmpPos.y + 2.2, this._tmpPos.z);
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.scene.remove(this._label);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }

  _makeLabel(id) {
    const canvas = document.createElement('canvas');
    canvas.width  = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.roundRect(4, 4, 248, 56, 12);
    ctx.fill();
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText(id.slice(0, 12), 128, 40);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2.5, 0.62, 1);
    return sprite;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Shortest-path angle LERP. */
function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff >  Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

// ─────────────────────────────────────────────────────────────────────────────
// NetworkManager
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Manages WebSocket connection and all remote player lifecycle.
 *
 * Protocol (JSON over WS):
 *   Server → Client:
 *     { type: 'INIT',        id: string, players: PlayerState[] }
 *     { type: 'PLAYER_JOIN', id: string }
 *     { type: 'PLAYER_MOVE', id: string, x, y, z, yaw, timestamp }
 *     { type: 'PLAYER_LEAVE',id: string }
 *
 *   Client → Server:
 *     { type: 'MOVE', x, y, z, yaw, timestamp }
 *
 * @example
 *   const net = new NetworkManager(scene, 'wss://your-server.example.com');
 *   net.connect();
 *   // In game loop:
 *   net.update(performance.now());
 *   // When local player moves:
 *   net.sendMove(player.position, player.yaw);
 */
export class NetworkManager {
  /**
   * @param {THREE.Scene} scene
   * @param {string}      url     - WebSocket server URL
   * @param {object}      [opts]
   * @param {number}      [opts.reconnectMs=3000] - reconnect delay on close
   */
  constructor(scene, url, opts = {}) {
    this.scene          = scene;
    this.url            = url;
    this.reconnectMs    = opts.reconnectMs ?? 3000;

    this._ws            = null;
    this._localId       = null;
    this._connected     = false;

    /** @type {Map<string, RemotePlayer>} */
    this._remotes       = new Map();

    // Throttle outbound move messages (send at most every N ms)
    this._sendInterval  = 50;   // 20 Hz
    this._lastSendTime  = 0;

    // Callbacks (override as needed)
    this.onConnect    = (localId) => {};
    this.onDisconnect = ()        => {};
    this.onPlayerJoin = (id)      => {};
    this.onPlayerLeave= (id)      => {};
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Open the WebSocket connection. Automatically reconnects on drop. */
  connect() {
    if (this._ws) return;
    this._ws = new WebSocket(this.url);

    this._ws.onopen    = ()    => this._onOpen();
    this._ws.onmessage = (evt) => this._onMessage(evt);
    this._ws.onerror   = (err) => console.error('[NetworkManager] WS error', err);
    this._ws.onclose   = ()    => this._onClose();
  }

  /** Gracefully disconnect. Will NOT reconnect. */
  disconnect() {
    if (!this._ws) return;
    this._ws.onclose = null; // prevent auto-reconnect
    this._ws.close();
    this._ws = null;
    this._connected = false;
  }

  /**
   * Send local player movement to server (rate-limited to _sendInterval).
   * @param {THREE.Vector3} position
   * @param {number}        yaw - facing angle in radians
   */
  sendMove(position, yaw) {
    if (!this._connected) return;
    const now = performance.now();
    if (now - this._lastSendTime < this._sendInterval) return;
    this._lastSendTime = now;

    this._send({
      type:      'MOVE',
      x:         position.x,
      y:         position.y,
      z:         position.z,
      yaw:       yaw,
      timestamp: now,
    });
  }

  /**
   * Must be called every frame from the game loop.
   * Drives snapshot interpolation for all remote players.
   * @param {number} nowMs - current time in milliseconds (e.g. performance.now())
   */
  update(nowMs) {
    for (const [, remote] of this._remotes) {
      remote.interpolate(nowMs);
    }
  }

  /** Number of connected remote players. */
  get remoteCount() { return this._remotes.size; }

  // ── Internal ────────────────────────────────────────────────────────────────

  _send(payload) {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) return;
    this._ws.send(JSON.stringify(payload));
  }

  _onOpen() {
    this._connected = true;
    console.info('[NetworkManager] Connected');
  }

  _onClose() {
    this._connected = false;
    this._ws        = null;
    console.warn('[NetworkManager] Disconnected — retrying in', this.reconnectMs, 'ms');
    this.onDisconnect();
    setTimeout(() => this.connect(), this.reconnectMs);
  }

  _onMessage(evt) {
    let msg;
    try { msg = JSON.parse(evt.data); }
    catch { return; }

    switch (msg.type) {
      case 'INIT':
        this._localId = msg.id;
        this.onConnect(msg.id);
        // Populate existing players
        for (const p of msg.players ?? []) {
          if (p.id !== this._localId) this._addRemote(p.id);
        }
        break;

      case 'PLAYER_JOIN':
        if (msg.id !== this._localId) {
          this._addRemote(msg.id);
          this.onPlayerJoin(msg.id);
        }
        break;

      case 'PLAYER_MOVE':
        if (msg.id !== this._localId) {
          const remote = this._remotes.get(msg.id);
          if (remote) {
            remote.pushSnapshot({
              timestamp: msg.timestamp ?? performance.now(),
              x: msg.x, y: msg.y, z: msg.z,
              yaw: msg.yaw ?? 0,
            });
          }
        }
        break;

      case 'PLAYER_LEAVE':
        this._removeRemote(msg.id);
        this.onPlayerLeave(msg.id);
        break;

      default:
        // Ignore unknown message types gracefully
        break;
    }
  }

  _addRemote(id) {
    if (this._remotes.has(id)) return;
    const rp = new RemotePlayer(id, this.scene);
    this._remotes.set(id, rp);
  }

  _removeRemote(id) {
    const rp = this._remotes.get(id);
    if (!rp) return;
    rp.dispose();
    this._remotes.delete(id);
  }
}
