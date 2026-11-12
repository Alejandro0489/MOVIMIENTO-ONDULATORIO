/**
 * ============================================================================
 * MOTOR DE AUDIO CIENTÍFICO Y DIDÁCTICO (WEB AUDIO API)
 * Cuaderno Interactivo de Física III • Universidad
 * 
 * Implementación conforme a la especificación:
 * - Activación bajo interacción explícita del usuario.
 * - Modalidad 1: Pulsos discretos de llegada física (ritmo temporal exacto).
 * - Modalidad 2: Comparación tonal armónica (frecuencia base escalada).
 * - Sonificación geométrica del estampido sónico.
 * - Envolventes suaves y cancelación en pausa/scrubbing.
 * ============================================================================
 */

export class DopplerAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isEnabled = false;
    this.isMuted = false;
    this.volume = 0.5;

    // Modalidad actual: 'pulses' o 'tonal'
    this.audioMode = 'pulses';

    // Frecuencia audible de referencia (La4 = 440 Hz)
    this.baseAudibleFreq = 440.0;

    // Estado del sintetizador continuo (Modalidad tonal)
    this.tonalOsc = null;
    this.tonalGain = null;
    this.isPlayingTonal = false;
    this.tonalTarget = 'received'; // 'received' o 'emitted'
  }

  /**
   * Inicializa el contexto de audio solo tras acción explícita del usuario
   */
  async init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      this.isEnabled = true;
      return true;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        console.warn("Web Audio API no soportada en este navegador.");
        return false;
      }

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.isEnabled = true;
      return true;
    } catch (err) {
      console.error("Error al iniciar Web Audio API:", err);
      return false;
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, Number(val) || 0));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
  }

  setMute(mute) {
    this.isMuted = !!mute;
    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
    }
  }

  setMode(mode) {
    if (mode === 'pulses' || mode === 'tonal') {
      this.audioMode = mode;
      if (mode === 'pulses') {
        this.stopTonalTone();
      }
    }
  }

  setTonalTarget(target) {
    this.tonalTarget = target; // 'emitted' o 'received'
  }

  /**
   * Modalidad 1: Pulso acústico limpio por cada frente físico recibido.
   * El ritmo reproduce con fidelidad absoluta los intervalos temporales reales de llegada.
   */
  playArrivalPulse(frequency = 784) {
    if (!this.isEnabled || this.isMuted || !this.ctx || this.audioMode !== 'pulses') return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);

      // Envolvente rápida y suave sin chasquidos (ataque 4ms, decaimiento 36ms)
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.040);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch (e) {
      // Audio ignorado en casos de desconexión
    }
  }

  /**
   * Sonificación didáctica del Estampido Sónico al cruzar la envolvente de Mach.
   * Transitorio de baja frecuencia + ruido filtrado.
   */
  playSonicBoom() {
    if (!this.isEnabled || this.isMuted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Oscilador subsónico de choque (60 Hz con caída a 20 Hz)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.25);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.6, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch (e) {
      // Ignorar fallas secundarias de audio
    }
  }

  /**
   * Modalidad 2: Tono continuo proporcional al Efecto Doppler
   * Escala: f_audible = 440 * (fo / fe)
   */
  updateTonalSynthesis(fo, fe) {
    if (!this.isEnabled || this.isMuted || !this.ctx || this.audioMode !== 'tonal') {
      this.stopTonalTone();
      return;
    }

    if (fe <= 0 || !isFinite(fo) || fo <= 0) {
      this.stopTonalTone();
      return;
    }

    const ratio = this.tonalTarget === 'emitted' ? 1.0 : (fo / fe);
    const audibleFreq = Math.max(50, Math.min(4000, this.baseAudibleFreq * ratio));

    if (!this.tonalOsc) {
      this.startTonalTone(audibleFreq);
    } else {
      const now = this.ctx.currentTime;
      this.tonalOsc.frequency.setTargetAtTime(audibleFreq, now, 0.03);
    }
  }

  startTonalTone(initialFreq) {
    try {
      const now = this.ctx.currentTime;
      this.tonalOsc = this.ctx.createOscillator();
      this.tonalGain = this.ctx.createGain();

      this.tonalOsc.type = 'triangle'; // Tono agradable con armónicos ricos
      this.tonalOsc.frequency.setValueAtTime(initialFreq, now);

      this.tonalGain.gain.setValueAtTime(0.0001, now);
      this.tonalGain.gain.linearRampToValueAtTime(0.25, now + 0.05);

      this.tonalOsc.connect(this.tonalGain);
      this.tonalGain.connect(this.masterGain);

      this.tonalOsc.start(now);
      this.isPlayingTonal = true;
    } catch (e) {
      this.tonalOsc = null;
    }
  }

  stopTonalTone() {
    if (this.tonalOsc && this.tonalGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.tonalGain.gain.linearRampToValueAtTime(0.0001, now + 0.03);
        const osc = this.tonalOsc;
        setTimeout(() => {
          try { osc.stop(); osc.disconnect(); } catch (err) {}
        }, 40);
      } catch (e) {}
    }
    this.tonalOsc = null;
    this.tonalGain = null;
    this.isPlayingTonal = false;
  }

  /**
   * Silencia y detiene cualquier sonido activo inmediatamente (pausa / scrub / reset)
   */
  stopAll() {
    this.stopTonalTone();
  }
}
