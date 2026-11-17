// Procedural Web Audio API synthesizer for tactile combat, mining, and UI feedback

class SoundEngine {
  private ctx: AudioContext | null = null;
  muted = false;

  private ensure(): AudioContext | null {
    if (this.muted || typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      try {
        this.ctx = new AC();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = "triangle",
    gain = 0.09,
  ) {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    const jitter = 0.94 + Math.random() * 0.12;
    osc.frequency.setValueAtTime(Math.max(40, freq * jitter), now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq * jitter), now + duration);
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playSlash() {
    this.tone(360, 120, 0.09, "sawtooth", 0.06);
  }

  playHeavySwing() {
    this.tone(240, 75, 0.16, "sawtooth", 0.1);
  }

  playBow() {
    this.tone(520, 210, 0.08, "triangle", 0.07);
  }

  playCast() {
    this.tone(440, 780, 0.14, "sine", 0.07);
  }

  playHit(heavy = false) {
    if (heavy) {
      this.tone(170, 55, 0.14, "square", 0.1);
    } else {
      this.tone(220, 95, 0.08, "triangle", 0.07);
    }
  }

  playKill() {
    this.tone(260, 520, 0.12, "triangle", 0.08);
    setTimeout(() => this.tone(520, 680, 0.14, "sine", 0.06), 60);
  }

  playPlayerHurt() {
    this.tone(150, 60, 0.18, "sawtooth", 0.11);
  }

  playPickaxe() {
    this.tone(980, 640, 0.06, "square", 0.05);
  }

  playOreBreak() {
    this.tone(680, 1120, 0.12, "triangle", 0.08);
  }

  playPickup() {
    this.tone(580, 880, 0.09, "sine", 0.06);
  }

  playLevelUp() {
    const notes = [440, 554, 659, 880];
    notes.forEach((n, i) => {
      setTimeout(() => this.tone(n, n * 1.02, 0.18, "triangle", 0.08), i * 75);
    });
  }

  playStair() {
    this.tone(300, 180, 0.18, "sine", 0.07);
  }

  playClick() {
    this.tone(640, 500, 0.04, "triangle", 0.04);
  }
}

export const sfx = new SoundEngine();
