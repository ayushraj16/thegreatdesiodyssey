/** Small synthesized arcade chime; no downloads or autoplay before a gesture. */
export class GameAudio {
  constructor() { this.context = null; this.master = null; this.muted = false; this.disposed = false; this.voices = new Set(); }
  async unlock() {
    if (this.disposed) return false;
    try {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return false;
        this.context = new AudioContext(); this.master = this.context.createGain();
        this.master.gain.value = this.muted ? 0 : .16; this.master.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') await this.context.resume();
      return !this.disposed && this.context.state === 'running';
    } catch { return false; }
  }
  setMuted(muted) {
    this.muted = muted;
    if (this.master && !this.disposed) this.master.gain.setTargetAtTime(muted ? 0 : .16, this.context.currentTime, .015);
  }
  pickup(points) {
    if (this.disposed || this.muted || this.context?.state !== 'running' || this.voices.size >= 12) return;
    const time = this.context.currentTime, transpose = points >= 25 ? 1.25 : 1;
    [659.25, 830.61, 987.77].forEach((frequency, index) => {
      const oscillator = this.context.createOscillator(), envelope = this.context.createGain();
      const start = time + index * .055;
      oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(frequency * transpose, start);
      envelope.gain.setValueAtTime(0, start); envelope.gain.linearRampToValueAtTime(.65, start + .008);
      envelope.gain.exponentialRampToValueAtTime(.001, start + .17);
      oscillator.connect(envelope); envelope.connect(this.master); this.voices.add(oscillator);
      oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); this.voices.delete(oscillator); };
      oscillator.start(start); oscillator.stop(start + .18);
    });
  }
  dispose() {
    if (this.disposed) return; this.disposed = true;
    this.voices.forEach(voice => { try { voice.stop(); } catch {} });
    this.master?.disconnect(); this.context?.close().catch(() => {});
  }
}
