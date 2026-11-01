/**
 * Web Audio API Procedural Sound Synthesizer
 * 100% synthesized retro arcade sound effects with zero external audio assets.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private thrustNode: AudioBufferSourceNode | null = null;
  private thrustGain: GainNode | null = null;
  private saucerOsc: OscillatorNode | null = null;
  private saucerGain: GainNode | null = null;
  private saucerLfo: OscillatorNode | null = null;

  private isMuted: boolean = false;
  private volume: number = 0.5;
  private noiseBuffer: AudioBuffer | null = null;
  private heartbeatPitchLow: boolean = true;

  constructor() {
    // AudioContext will be initialized upon first user interaction
    try {
      const storedMute = localStorage.getItem('vv_audio_muted');
      if (storedMute !== null) {
        this.isMuted = storedMute === 'true';
      }
      const storedVol = localStorage.getItem('vv_audio_volume');
      if (storedVol !== null) {
        this.volume = parseFloat(storedVol) || 0.5;
      }
    } catch {
      // LocalStorage fallback
    }
  }

  /**
   * Initializes or resumes the AudioContext on user interaction.
   */
  public init(): boolean {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return false;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.generateNoiseBuffer();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return true;
  }

  private generateNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('vv_audio_muted', String(muted));
    } catch {}

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('vv_audio_volume', String(this.volume));
    } catch {}

    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Classic alternating heartbeat pulse (deep bass thump).
   */
  public playHeartbeat() {
    if (!this.init() || !this.ctx || !this.masterGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Alternate between 100Hz and 80Hz
    const freq = this.heartbeatPitchLow ? 80 : 100;
    this.heartbeatPitchLow = !this.heartbeatPitchLow;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  /**
   * Laser weapon discharge sound.
   */
  public playLaser(weaponType: 'standard' | 'spread' | 'rapid' = 'standard') {
    if (!this.init() || !this.ctx || !this.masterGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const now = this.ctx.currentTime;
    osc.type = weaponType === 'spread' ? 'sawtooth' : 'sine';

    const startFreq = weaponType === 'rapid' ? 1200 : weaponType === 'spread' ? 700 : 950;
    const endFreq = 120;
    const duration = weaponType === 'rapid' ? 0.08 : 0.12;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  /**
   * Procedural explosion sound for rocks, enemies, or player.
   */
  public playExplosion(size: 'small' | 'medium' | 'large' | 'player') {
    if (!this.init() || !this.ctx || !this.masterGain || !this.noiseBuffer || this.isMuted) return;

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';

    const gain = this.ctx.createGain();

    let duration = 0.25;
    let cutoff = 800;
    let volume = 0.4;

    if (size === 'small') {
      duration = 0.18;
      cutoff = 1400;
      volume = 0.3;
    } else if (size === 'medium') {
      duration = 0.35;
      cutoff = 900;
      volume = 0.45;
    } else if (size === 'large') {
      duration = 0.55;
      cutoff = 450;
      volume = 0.6;
    } else if (size === 'player') {
      duration = 0.9;
      cutoff = 600;
      volume = 0.8;
    }

    filter.frequency.setValueAtTime(cutoff, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + duration + 0.02);

    // Add sub-bass impact for medium, large and player
    if (size !== 'small') {
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(size === 'player' ? 90 : 130, now);
      sub.frequency.exponentialRampToValueAtTime(25, now + duration * 0.7);

      subGain.gain.setValueAtTime(volume * 0.7, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);

      sub.connect(subGain);
      subGain.connect(this.masterGain);

      sub.start(now);
      sub.stop(now + duration * 0.7 + 0.01);
    }
  }

  /**
   * Continuous thruster noise.
   */
  public setThrust(active: boolean) {
    if (this.isMuted || !this.ctx || !this.masterGain) return;

    if (active) {
      if (!this.thrustGain) {
        if (!this.noiseBuffer) return;
        const now = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(140, now);
        filter.Q.setValueAtTime(2, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.08);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
        this.thrustNode = noise;
        this.thrustGain = gain;
      }
    } else {
      if (this.thrustGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.thrustGain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        setTimeout(() => {
          try {
            this.thrustNode?.stop();
            this.thrustNode?.disconnect();
          } catch {}
          this.thrustNode = null;
          this.thrustGain = null;
        }, 100);
      }
    }
  }

  /**
   * Flying Saucer warble Theremin sound.
   */
  public setSaucerWarble(active: boolean, isSmall: boolean = false) {
    if (!active || this.isMuted || !this.ctx || !this.masterGain) {
      if (this.saucerOsc && this.ctx) {
        try {
          this.saucerLfo?.stop();
          this.saucerOsc.stop();
          this.saucerOsc.disconnect();
        } catch {}
        this.saucerOsc = null;
        this.saucerLfo = null;
        this.saucerGain = null;
      }
      return;
    }

    if (!this.saucerOsc) {
      const now = this.ctx.currentTime;
      const carrier = this.ctx.createOscillator();
      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(isSmall ? 850 : 520, now);

      const lfo = this.ctx.createOscillator();
      lfo.type = 'triangle';
      lfo.frequency.setValueAtTime(isSmall ? 10 : 6, now);

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(isSmall ? 90 : 60, now);

      lfo.connect(lfoGain);
      lfoGain.connect(carrier.frequency);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.1);

      carrier.connect(gain);
      gain.connect(this.masterGain);

      lfo.start(now);
      carrier.start(now);

      this.saucerOsc = carrier;
      this.saucerLfo = lfo;
      this.saucerGain = gain;
    }
  }

  /**
   * Arpeggiated chime on power-up collection.
   */
  public playPowerup() {
    if (!this.init() || !this.ctx || !this.masterGain || this.isMuted) return;

    const freqs = [440, 554.37, 659.25, 880]; // A Major arpeggio
    const now = this.ctx.currentTime;

    freqs.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const start = now + i * 0.055;
      const dur = 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(start);
      osc.stop(start + dur + 0.01);
    });
  }

  /**
   * Hyperspace warp sound effect.
   */
  public playHyperspace() {
    if (!this.init() || !this.ctx || !this.masterGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  /**
   * Stop all persistent audio loops (called on Pause / Game Over).
   */
  public stopAllLoops() {
    this.setThrust(false);
    this.setSaucerWarble(false);
  }
}

export const sound = new SoundSynthesizer();
