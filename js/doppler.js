/**
 * ============================================================================
 * MOTOR Y SIMULADOR AVANZADO DEL EFECTO DOPPLER ACÚSTICO Y SUPERSÓNICO
 * Cuaderno Interactivo de Física III • Universidad
 * 
 * Implementación UMD / Browser Vanilla (100% libre de imports/exports para
 * compatibilidad absoluta con protocolo local file:/// sin restricciones CORS).
 * ============================================================================
 */

(function (global) {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. ÁLGEBRA VECTORIAL 2D
  // --------------------------------------------------------------------------
  class Vector2D {
    constructor(x = 0, y = 0) {
      this.x = Number(x) || 0;
      this.y = Number(y) || 0;
    }

    set(x, y) {
      this.x = Number(x) || 0;
      this.y = Number(y) || 0;
      return this;
    }

    clone() {
      return new Vector2D(this.x, this.y);
    }

    add(v) {
      return new Vector2D(this.x + v.x, this.y + v.y);
    }

    sub(v) {
      return new Vector2D(this.x - v.x, this.y - v.y);
    }

    mult(s) {
      return new Vector2D(this.x * s, this.y * s);
    }

    div(s) {
      if (s === 0) return new Vector2D(0, 0);
      return new Vector2D(this.x / s, this.y / s);
    }

    dot(v) {
      return this.x * v.x + this.y * v.y;
    }

    magSq() {
      return this.x * this.x + this.y * this.y;
    }

    mag() {
      return Math.sqrt(this.magSq());
    }

    dist(v) {
      return Math.hypot(this.x - v.x, this.y - v.y);
    }

    normalize() {
      const m = this.mag();
      if (m === 0) return new Vector2D(0, 0);
      return new Vector2D(this.x / m, this.y / m);
    }

    angle() {
      return Math.atan2(this.y, this.x);
    }
  }

  // --------------------------------------------------------------------------
  // 2. FRENTES DE ONDA CIRCULARES EN MEDIO HOMOGÉNEO
  // --------------------------------------------------------------------------
  class Wavefront {
    constructor(id, t_e, center) {
      this.id = id;
      this.t_e = t_e;
      this.center = center.clone(); // Centro FIJO en el medio: x_c,n = x_f(t_e,n)
      this.t_r = null;
      this.receptionEvaluated = false;
    }

    radius(t, c) {
      if (t < this.t_e) return 0;
      return c * (t - this.t_e);
    }

    isEmitted(t) {
      return t >= this.t_e;
    }
  }

  // --------------------------------------------------------------------------
  // 3. MODELO FÍSICO Y MATEMÁTICO DEL EFECTO DOPPLER
  // --------------------------------------------------------------------------
  class DopplerModel {
    constructor(config = {}) {
      this.f = config.f !== undefined ? config.f : 2.0;          // Hz
      this.c = config.c !== undefined ? config.c : 340.0;        // m/s
      
      this.sourcePos0 = new Vector2D(config.sourceX0 !== undefined ? config.sourceX0 : -170.0, config.sourceY0 || 0);
      this.sourceVel = new Vector2D(config.sourceVx !== undefined ? config.sourceVx : 0.0, config.sourceVy || 0);

      this.obsPos0 = new Vector2D(config.obsX0 !== undefined ? config.obsX0 : 170.0, config.obsY0 || 0);
      this.obsVel = new Vector2D(config.obsVx !== undefined ? config.obsVx : 0.0, config.obsVy || 0);

      this.simTime = 0.0;
      this.duration = config.duration !== undefined ? config.duration : 10.0;
      this.durationMode = config.durationMode || 'fixed';
      this.numPeriods = config.numPeriods || 20;
      this.subdivisions = config.subdivisions || 100;

      this.sourceTrajectoryFn = null;
      this.obsTrajectoryFn = null;

      this.wavefronts = [];
      this.receptions = [];

      this.rebuildExperiment();
    }

    get T() {
      return this.f > 0 ? 1.0 / this.f : Infinity;
    }

    get dtStep() {
      return this.f > 0 ? 1.0 / (this.subdivisions * this.f) : 0.01;
    }

    get Mach() {
      return this.c > 0 ? this.sourceVel.mag() / this.c : 0;
    }

    get machAngle() {
      const M = this.Mach;
      return M > 1.0 ? Math.asin(1.0 / M) : null;
    }

    get machAngleDeg() {
      const rad = this.machAngle;
      return rad !== null ? (rad * 180.0) / Math.PI : null;
    }

    get lambda0() {
      return this.f > 0 ? this.c / this.f : 0;
    }

    get lambdaFront() {
      if (this.f <= 0) return 0;
      const v = this.sourceVel.mag();
      return Math.max(0, (this.c - v) / this.f);
    }

    get lambdaBack() {
      if (this.f <= 0) return 0;
      const v = this.sourceVel.mag();
      return (this.c + v) / this.f;
    }

    getTotalDuration() {
      if (this.durationMode === 'periods') {
        return this.f > 0 ? this.numPeriods / this.f : this.duration;
      }
      return this.duration;
    }

    getSourcePos(t) {
      if (this.sourceTrajectoryFn) return this.sourceTrajectoryFn(t);
      return this.sourcePos0.add(this.sourceVel.mult(t));
    }

    getSourceVel(t) {
      if (this.sourceTrajectoryFn) {
        const dt = 1e-4;
        const p1 = this.sourceTrajectoryFn(t - dt);
        const p2 = this.sourceTrajectoryFn(t + dt);
        return p2.sub(p1).div(2 * dt);
      }
      return this.sourceVel.clone();
    }

    getObsPos(t) {
      if (this.obsTrajectoryFn) return this.obsTrajectoryFn(t);
      return this.obsPos0.add(this.obsVel.mult(t));
    }

    getObsVel(t) {
      if (this.obsTrajectoryFn) {
        const dt = 1e-4;
        const p1 = this.obsTrajectoryFn(t - dt);
        const p2 = this.obsTrajectoryFn(t + dt);
        return p2.sub(p1).div(2 * dt);
      }
      return this.obsVel.clone();
    }

    rebuildExperiment() {
      this.wavefronts = [];
      this.receptions = [];

      const totalT = this.getTotalDuration();
      if (this.f <= 0 || totalT <= 0) return;

      const maxN = Math.floor(totalT * this.f + 1e-9);

      for (let n = 0; n <= maxN; n++) {
        const t_e = n / this.f;
        const center = this.getSourcePos(t_e);
        const wf = new Wavefront(n, t_e, center);

        wf.t_r = this.calculateAnalyticalReception(wf);
        wf.receptionEvaluated = true;

        this.wavefronts.push(wf);

        if (wf.t_r !== null && wf.t_r <= totalT) {
          this.receptions.push({
            wavefrontId: n,
            t_e: wf.t_e,
            t_r: wf.t_r,
            flightTime: wf.t_r - wf.t_e,
            center: center.clone()
          });
        }
      }

      this.receptions.sort((a, b) => a.t_r - b.t_r);

      for (let i = 0; i < this.receptions.length; i++) {
        if (i > 0) {
          const dt_r = this.receptions[i].t_r - this.receptions[i - 1].t_r;
          this.receptions[i].dt_r = dt_r;
          this.receptions[i].f_measured = dt_r > 1e-7 ? 1.0 / dt_r : Infinity;
        } else {
          this.receptions[i].dt_r = null;
          this.receptions[i].f_measured = null;
        }
      }
    }

    calculateAnalyticalReception(wf) {
      const t_e = wf.t_e;
      const xc = wf.center;
      const c = this.c;

      if (this.obsTrajectoryFn) {
        return this.solveReceptionNumerically(wf);
      }

      const D = this.obsPos0.sub(xc);
      const vo = this.obsVel;

      const A = vo.magSq() - c * c;
      const B = 2.0 * (D.dot(vo) + c * c * t_e);
      const C = D.magSq() - c * c * t_e * t_e;

      if (Math.abs(A) < 1e-9) {
        if (Math.abs(B) < 1e-9) return null;
        const t_r = -C / B;
        return t_r >= t_e - 1e-7 ? Math.max(t_e, t_r) : null;
      }

      const disc = B * B - 4.0 * A * C;
      if (disc < 0) return null;

      const sqrtDisc = Math.sqrt(Math.max(0, disc));
      const r1 = (-B - sqrtDisc) / (2.0 * A);
      const r2 = (-B + sqrtDisc) / (2.0 * A);

      const validRoots = [];
      if (r1 >= t_e - 1e-7) validRoots.push(Math.max(t_e, r1));
      if (r2 >= t_e - 1e-7) validRoots.push(Math.max(t_e, r2));

      if (validRoots.length === 0) return null;
      validRoots.sort((a, b) => a - b);
      return validRoots[0];
    }

    solveReceptionNumerically(wf) {
      const t_e = wf.t_e;
      const xc = wf.center;
      const c = this.c;
      const totalT = this.getTotalDuration() * 1.5;

      const f = (t) => this.getObsPos(t).dist(xc) - c * (t - t_e);

      let tA = t_e;
      let tB = totalT;
      const step = 0.05;
      let found = false;
      let currA = t_e;
      let currValA = f(currA);

      for (let t = t_e + step; t <= totalT; t += step) {
        const val = f(t);
        if (currValA * val <= 0) {
          tA = currA;
          tB = t;
          found = true;
          break;
        }
        currA = t;
        currValA = val;
      }

      if (!found) return null;

      for (let iter = 0; iter < 40; iter++) {
        const mid = 0.5 * (tA + tB);
        const valMid = f(mid);
        if (Math.abs(valMid) < 1e-9 || Math.abs(tB - tA) < 1e-7) return mid;
        if (f(tA) * valMid < 0) tB = mid;
        else tA = mid;
      }

      return 0.5 * (tA + tB);
    }

    getTheoreticalFrequency(t) {
      if (this.f <= 0) return { fo: 0, status: 'Frecuencia nula' };

      const currDist = this.getSourcePos(t).dist(this.getObsPos(t));
      const minDelay = currDist / this.c;

      let activeWf = null;
      let minDiff = Infinity;

      for (const wf of this.wavefronts) {
        if (wf.t_r !== null) {
          const diff = Math.abs(wf.t_r - t);
          if (diff < minDiff && diff < 0.3) {
            minDiff = diff;
            activeWf = wf;
          }
        }
      }

      let t_e = t - minDelay;
      let t_r = t;
      if (activeWf) {
        t_e = activeWf.t_e;
        t_r = activeWf.t_r;
      }

      const xf = this.getSourcePos(t_e);
      const xo = this.getObsPos(t_r);
      const dist = xo.dist(xf);

      if (dist < 1e-6) return { fo: this.f, status: 'Coincidencia espacial' };

      const n = xo.sub(xf).normalize();
      const vf = this.getSourceVel(t_e);
      const vo = this.getObsVel(t_r);

      const denom = this.c - n.dot(vf);
      const numer = this.c - n.dot(vo);

      if (Math.abs(denom) < 1e-6) {
        return { fo: Infinity, status: 'Frente sónico coincidente (Singularidad Mach 1)', n, numer, denom };
      }

      const foRaw = this.f * (numer / denom);
      return {
        fo: foRaw,
        status: foRaw < 0 ? 'Régimen supersónico (Inversión temporal de llegada)' : 'Régimen acústico ordinario',
        n, numer, denom
      };
    }

    getMeasuredFrequencyAt(t) {
      const pastReceptions = this.receptions.filter(r => r.t_r <= t + 1e-6);
      if (pastReceptions.length < 2) {
        return { count: pastReceptions.length, status: 'Esperando dos llegadas', f_measured: null, lastDt: null };
      }
      const last = pastReceptions[pastReceptions.length - 1];
      const prev = pastReceptions[pastReceptions.length - 2];
      const dt = last.t_r - prev.t_r;
      if (dt <= 1e-6) {
        return { count: pastReceptions.length, status: 'Frente de choque simultáneo', f_measured: Infinity, lastDt: dt };
      }
      return { count: pastReceptions.length, status: 'Medición empírica válida', f_measured: 1.0 / dt, lastDt: dt, lastArrival: last.t_r };
    }

    getNewArrivals(t_prev, t_curr) {
      const arrivals = [];
      for (const rec of this.receptions) {
        if (rec.t_r > t_prev - 1e-11 && rec.t_r <= t_curr + 1e-11) {
          arrivals.push(rec);
        }
      }
      return arrivals;
    }

    checkMachEnvelopeCrossing(t_prev, t_curr) {
      if (this.Mach <= 1.0) return false;
      const mu = this.machAngle;
      const vfAngle = this.sourceVel.angle();

      const isInsideCone = (t) => {
        const xf = this.getSourcePos(t);
        const xo = this.getObsPos(t);
        const toObs = xo.sub(xf);
        const dist = toObs.mag();
        if (dist < 1e-4) return true;

        let angleDiff = Math.atan2(toObs.y, toObs.x) - vfAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        const backAngle = Math.PI - Math.abs(angleDiff);
        return backAngle <= mu + 1e-3;
      };

      return !isInsideCone(t_prev) && isInsideCone(t_curr);
    }

    advanceTime(dt) {
      const t_prev = this.simTime;
      const totalT = this.getTotalDuration();
      this.simTime = Math.min(totalT, this.simTime + dt);

      const arrivals = this.getNewArrivals(t_prev, this.simTime);
      const machCrossing = this.checkMachEnvelopeCrossing(t_prev, this.simTime);

      return {
        t: this.simTime,
        dt,
        arrivals,
        machCrossing,
        isFinished: this.simTime >= totalT
      };
    }

    setTime(t) {
      const totalT = this.getTotalDuration();
      this.simTime = Math.max(0, Math.min(totalT, t));
      return this.simTime;
    }

    reset() {
      this.simTime = 0.0;
      this.rebuildExperiment();
    }
  }

  // --------------------------------------------------------------------------
  // 4. MOTOR DE AUDIO CIENTÍFICO (WEB AUDIO API)
  // --------------------------------------------------------------------------
  class DopplerAudioEngine {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.isEnabled = false;
      this.isMuted = false;
      this.volume = 0.5;
      this.audioMode = 'pulses';
      this.baseAudibleFreq = 440.0;
      this.tonalOsc = null;
      this.tonalGain = null;
      this.isPlayingTonal = false;
      this.tonalTarget = 'received';
    }

    async init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        this.isEnabled = true;
        return true;
      }
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return false;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.isEnabled = true;
        return true;
      } catch (err) {
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
        if (mode === 'pulses') this.stopTonalTone();
      }
    }

    playArrivalPulse(frequency = 784) {
      if (!this.isEnabled || this.isMuted || !this.ctx || this.audioMode !== 'pulses') return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.040);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.045);
      } catch (e) {}
    }

    playSonicBoom() {
      if (!this.isEnabled || this.isMuted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
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
      } catch (e) {}
    }

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
        this.tonalOsc.frequency.setTargetAtTime(audibleFreq, this.ctx.currentTime, 0.03);
      }
    }

    startTonalTone(initialFreq) {
      try {
        const now = this.ctx.currentTime;
        this.tonalOsc = this.ctx.createOscillator();
        this.tonalGain = this.ctx.createGain();
        this.tonalOsc.type = 'triangle';
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

    stopAll() {
      this.stopTonalTone();
    }
  }

  // --------------------------------------------------------------------------
  // 5. RENDERIZADOR CANVAS 2D
  // --------------------------------------------------------------------------
  class DopplerCanvasRenderer {
    constructor(canvas, model) {
      this.canvas = canvas;
      this.ctx = canvas ? canvas.getContext('2d') : null;
      this.model = model;

      this.pixelsPerMeter = 1.0;
      this.originX = canvas ? canvas.width / 2 : 250;
      this.originY = canvas ? canvas.height / 2 : 150;
      this.width = canvas ? canvas.width : 500;
      this.height = canvas ? canvas.height : 300;

      this.sourceType = 'ambulance';
      this.waveColor = '#2563eb';
      this.waveWidth = 2.0;
      this.waveStyle = 'solid';
      this.enableAttenuation = false;
      this.showVectors = true;
      this.showGrid = true;
      this.showWavelengths = true;
      this.trackSource = false;

      this.selectedWavefrontId = null;
      this.rulerActive = false;
      this.rulerP1 = null;
      this.rulerP2 = null;
      this.observerPulseIntensity = 0.0;

      this.isDragging = false;
      this.dragTarget = null;
      this.dragStart = { x: 0, y: 0 };

      if (this.canvas) {
        this.initEvents();
        this.resize();
        this.fitScene();
      }
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dpr = window.devicePixelRatio || 1;
      this.width = rect.width;
      this.height = rect.height;

      this.canvas.width = Math.round(rect.width * dpr);
      this.canvas.height = Math.round(rect.height * dpr);

      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    worldToScreen(wx, wy) {
      return {
        x: this.originX + wx * this.pixelsPerMeter,
        y: this.originY - wy * this.pixelsPerMeter
      };
    }

    screenToWorld(sx, sy) {
      return {
        x: (sx - this.originX) / this.pixelsPerMeter,
        y: -(sy - this.originY) / this.pixelsPerMeter
      };
    }

    triggerReceptionPulse() {
      this.observerPulseIntensity = 1.0;
    }

    fitScene() {
      if (!this.canvas) return;
      const totalT = this.model.getTotalDuration();
      const pSource = this.model.getSourcePos(0);
      const pObs = this.model.getObsPos(0);
      const pSourceEnd = this.model.getSourcePos(totalT);
      const pObsEnd = this.model.getObsPos(totalT);
      const maxRadius = this.model.c * totalT;

      const minX = Math.min(pSource.x, pObs.x, pSourceEnd.x, pObsEnd.x) - maxRadius * 0.35;
      const maxX = Math.max(pSource.x, pObs.x, pSourceEnd.x, pObsEnd.x) + maxRadius * 0.35;
      const spanX = Math.max(300, maxX - minX);

      const margin = 80;
      const availableW = Math.max(200, this.width - margin * 2);
      this.pixelsPerMeter = Math.max(0.2, Math.min(3.0, availableW / spanX));

      const midX = (minX + maxX) / 2;
      this.originX = this.width / 2 - midX * this.pixelsPerMeter;
      this.originY = this.height / 2;
    }

    resetView() {
      this.pixelsPerMeter = 1.0;
      this.originX = this.width / 2;
      this.originY = this.height / 2;
      this.fitScene();
    }

    zoomIn() {
      this.pixelsPerMeter = Math.max(0.05, Math.min(10.0, this.pixelsPerMeter * 1.25));
    }

    zoomOut() {
      this.pixelsPerMeter = Math.max(0.05, Math.min(10.0, this.pixelsPerMeter / 1.25));
    }

    focusSource() {
      const src = this.model.getSourcePos(this.model.simTime);
      this.originX = this.width / 2 - src.x * this.pixelsPerMeter;
      this.originY = this.height / 2 + src.y * this.pixelsPerMeter;
    }

    initEvents() {
      if (!this.canvas) return;
      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldPosBefore = this.screenToWorld(mouseX, mouseY);
        const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;

        this.pixelsPerMeter = Math.max(0.05, Math.min(10.0, this.pixelsPerMeter * zoomFactor));
        this.originX = mouseX - worldPosBefore.x * this.pixelsPerMeter;
        this.originY = mouseY + worldPosBefore.y * this.pixelsPerMeter;
      }, { passive: false });

      const getPos = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
      };

      this.canvas.addEventListener('mousedown', (e) => this.handlePointerDown(getPos(e), e.button));
      this.canvas.addEventListener('touchstart', (e) => this.handlePointerDown(getPos(e), 0), { passive: true });

      window.addEventListener('mousemove', (e) => {
        if (this.isDragging) this.handlePointerMove(getPos(e));
      });
      window.addEventListener('touchmove', (e) => {
        if (this.isDragging) this.handlePointerMove(getPos(e));
      }, { passive: true });

      window.addEventListener('mouseup', () => this.handlePointerUp());
      window.addEventListener('touchend', () => this.handlePointerUp());

      this.canvas.addEventListener('click', (e) => {
        if (this.rulerActive) return;
        this.handleSelectWavefront(getPos(e));
      });
    }

    handlePointerDown(pos, button) {
      const world = this.screenToWorld(pos.x, pos.y);
      this.dragStart = { ...pos };

      if (this.rulerActive) {
        if (!this.rulerP1 || (this.rulerP1 && this.rulerP2)) {
          this.rulerP1 = new Vector2D(world.x, world.y);
          this.rulerP2 = null;
        } else {
          this.rulerP2 = new Vector2D(world.x, world.y);
        }
        return;
      }

      if (button === 1 || button === 2) {
        this.isDragging = true;
        this.dragTarget = 'pan';
        return;
      }

      const srcPos = this.model.getSourcePos(this.model.simTime);
      const obsPos = this.model.getObsPos(this.model.simTime);
      const distSrc = Math.hypot(world.x - srcPos.x, world.y - srcPos.y);
      const distObs = Math.hypot(world.x - obsPos.x, world.y - obsPos.y);
      const hitThreshold = 35 / this.pixelsPerMeter;

      if (distSrc < hitThreshold) {
        this.isDragging = true;
        this.dragTarget = 'source';
      } else if (distObs < hitThreshold) {
        this.isDragging = true;
        this.dragTarget = 'observer';
      } else {
        this.isDragging = true;
        this.dragTarget = 'pan';
      }
    }

    handlePointerMove(pos) {
      if (!this.isDragging) return;
      if (this.dragTarget === 'pan') {
        const dx = pos.x - this.dragStart.x;
        const dy = pos.y - this.dragStart.y;
        this.originX += dx;
        this.originY += dy;
        this.dragStart = { ...pos };
      } else if (this.dragTarget === 'source') {
        const world = this.screenToWorld(pos.x, pos.y);
        this.model.sourcePos0.set(world.x, world.y);
        this.model.rebuildExperiment();
      } else if (this.dragTarget === 'observer') {
        const world = this.screenToWorld(pos.x, pos.y);
        this.model.obsPos0.set(world.x, world.y);
        this.model.rebuildExperiment();
      }
    }

    handlePointerUp() {
      this.isDragging = false;
      this.dragTarget = null;
    }

    handleSelectWavefront(pos) {
      const world = this.screenToWorld(pos.x, pos.y);
      const t = this.model.simTime;
      let closestId = null;
      let minErr = 18 / this.pixelsPerMeter;

      for (const wf of this.model.wavefronts) {
        if (wf.isEmitted(t)) {
          const r = wf.radius(t, this.model.c);
          const distToCenter = Math.hypot(world.x - wf.center.x, world.y - wf.center.y);
          const err = Math.abs(distToCenter - r);
          if (err < minErr) {
            minErr = err;
            closestId = wf.id;
          }
        }
      }
      this.selectedWavefrontId = closestId;
    }

    render() {
      if (!this.ctx || !this.canvas) return;
      if (this.canvas.clientWidth > 0 && (this.width <= 0 || Math.abs(this.canvas.clientWidth - this.width) > 2)) {
        this.resize();
        this.fitScene();
      }
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      if (w <= 0 || h <= 0) return;
      const t = this.model.simTime;

      if (this.trackSource) {
        const src = this.model.getSourcePos(t);
        this.originX = w / 2 - src.x * this.pixelsPerMeter;
        this.originY = h / 2 + src.y * this.pixelsPerMeter;
      }

      ctx.clearRect(0, 0, w, h);

      if (this.showGrid) this.drawGrid();
      this.drawWavefronts(t);
      if (this.model.Mach > 1.0) this.drawMachCone(t);
      if (this.showWavelengths) this.drawWavelengthAnnotations(t);
      this.drawSource(t);
      this.drawObserver(t);
      if (this.rulerActive && this.rulerP1) this.drawRuler();
      this.drawScaleBar();

      if (this.observerPulseIntensity > 0) {
        this.observerPulseIntensity = Math.max(0, this.observerPulseIntensity - 0.05);
      }
    }

    drawGrid() {
      const ctx = this.ctx;
      const ppm = this.pixelsPerMeter;
      const isDark = document.body && document.body.classList.contains('dark-theme');

      ctx.save();
      // Background fill
      ctx.fillStyle = isDark ? '#080c14' : '#ffffff';
      ctx.fillRect(0, 0, this.width, this.height);

      // Grid step: 200m major, 100m minor
      const stepMeters = 200;
      const stepPx = stepMeters * ppm;
      const minorPx = (stepMeters / 2) * ppm;

      // Minor grid lines
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9';
      if (minorPx >= 15) {
        const startXMinor = this.originX % minorPx;
        for (let x = startXMinor; x <= this.width; x += minorPx) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, this.height);
          ctx.stroke();
        }
        const startYMinor = this.originY % minorPx;
        for (let y = startYMinor; y <= this.height; y += minorPx) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(this.width, y);
          ctx.stroke();
        }
      }

      // Major grid lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
      if (stepPx >= 20) {
        const startX = this.originX % stepPx;
        for (let x = startX; x <= this.width; x += stepPx) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, this.height);
          ctx.stroke();
        }
        const startY = this.originY % stepPx;
        for (let y = startY; y <= this.height; y += stepPx) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(this.width, y);
          ctx.stroke();
        }
      }

      // Central Axes lines
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = isDark ? '#94a3b8' : '#475569';
      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.font = '11px "Outfit", sans-serif';

      // X Axis
      ctx.beginPath();
      ctx.moveTo(0, this.originY);
      ctx.lineTo(this.width, this.originY);
      ctx.stroke();

      // Y Axis
      ctx.beginPath();
      ctx.moveTo(this.originX, 0);
      ctx.lineTo(this.originX, this.height);
      ctx.stroke();

      // X Axis Ticks and Numbers (-400, -200, 0, 200, 400, 600, 800, 1000...)
      const startTickX = Math.floor((-this.originX / ppm) / stepMeters) * stepMeters;
      const endTickX = Math.ceil(((this.width - this.originX) / ppm) / stepMeters) * stepMeters;

      for (let mx = startTickX; mx <= endTickX; mx += stepMeters) {
        const sx = this.originX + mx * ppm;
        ctx.beginPath();
        ctx.moveTo(sx, this.originY - 4);
        ctx.lineTo(sx, this.originY + 4);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillText(`${mx}`, sx, this.originY + 16);
      }

      // Y Axis Ticks and Numbers (-200, 200...)
      const startTickY = Math.floor(((this.originY - this.height) / ppm) / stepMeters) * stepMeters;
      const endTickY = Math.ceil((this.originY / ppm) / stepMeters) * stepMeters;

      for (let my = startTickY; my <= endTickY; my += stepMeters) {
        if (my === 0) continue;
        const sy = this.originY - my * ppm;
        ctx.beginPath();
        ctx.moveTo(this.originX - 4, sy);
        ctx.lineTo(this.originX + 4, sy);
        ctx.stroke();

        ctx.textAlign = 'right';
        ctx.fillText(`${my}`, this.originX - 7, sy + 4);
      }

      // Axis labels
      ctx.font = 'bold 11px "Outfit", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('x (m)', 24, this.originY - 10);
      ctx.fillText('y (m)', this.originX + 8, 20);

      ctx.restore();
    }

    drawWavefronts(t) {
      const ctx = this.ctx;
      const c = this.model.c;
      const maxRadius = c * this.model.getTotalDuration();

      ctx.save();
      ctx.lineWidth = this.waveWidth;
      if (this.waveStyle === 'dashed') ctx.setLineDash([8, 6]);
      else if (this.waveStyle === 'dotted') ctx.setLineDash([3, 4]);
      else ctx.setLineDash([]);

      for (const wf of this.model.wavefronts) {
        if (!wf.isEmitted(t)) continue;
        const rMeters = wf.radius(t, c);
        const rPx = rMeters * this.pixelsPerMeter;
        if (rPx <= 0) continue;

        const centerScreen = this.worldToScreen(wf.center.x, wf.center.y);
        if (centerScreen.x + rPx < -200 || centerScreen.x - rPx > this.width + 200 ||
            centerScreen.y + rPx < -200 || centerScreen.y - rPx > this.height + 200) continue;

        const isSelected = wf.id === this.selectedWavefrontId;
        let alpha = 0.85;
        if (this.enableAttenuation && maxRadius > 0) {
          alpha = Math.max(0.18, 0.9 - 0.75 * (rMeters / maxRadius));
        }

        ctx.beginPath();
        ctx.arc(centerScreen.x, centerScreen.y, rPx, 0, Math.PI * 2);
        ctx.strokeStyle = isSelected ? '#f59e0b' : this.waveColor;
        ctx.lineWidth = isSelected ? this.waveWidth + 2 : this.waveWidth;
        ctx.globalAlpha = isSelected ? 1.0 : alpha;
        ctx.stroke();

        if (isSelected) {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(centerScreen.x, centerScreen.y, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '11px "JetBrains Mono", monospace';
          ctx.fillText(`Frente #${wf.id} | te=${wf.t_e.toFixed(2)}s | r=${rMeters.toFixed(1)}m`, centerScreen.x + 8, centerScreen.y - 8);
        }
      }
      ctx.restore();
    }

    drawMachCone(t) {
      const ctx = this.ctx;
      const M = this.model.Mach;
      const mu = this.model.machAngle;
      if (M <= 1.0 || mu === null) return;

      const srcPos = this.model.getSourcePos(t);
      const srcScreen = this.worldToScreen(srcPos.x, srcPos.y);
      const vfAngle = this.model.sourceVel.angle();

      const lengthMeters = (this.width / this.pixelsPerMeter) * 2;
      const a1 = vfAngle + Math.PI - mu;
      const a2 = vfAngle + Math.PI + mu;

      const p1World = new Vector2D(srcPos.x + lengthMeters * Math.cos(a1), srcPos.y + lengthMeters * Math.sin(a1));
      const p2World = new Vector2D(srcPos.x + lengthMeters * Math.cos(a2), srcPos.y + lengthMeters * Math.sin(a2));

      const s1 = this.worldToScreen(p1World.x, p1World.y);
      const s2 = this.worldToScreen(p2World.x, p2World.y);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(srcScreen.x, srcScreen.y);
      ctx.lineTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(srcScreen.x, srcScreen.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.stroke();

      const midAngle = vfAngle + Math.PI;
      const labelDist = 65;
      const lx = srcScreen.x + labelDist * Math.cos(midAngle);
      const ly = srcScreen.y - labelDist * Math.sin(midAngle);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillText(`Cono de Mach (μ = ${(mu * 180 / Math.PI).toFixed(1)}°)`, lx - 70, ly);
      ctx.restore();
    }

    drawWavelengthAnnotations(t) {
      if (!this.showWavelengths || this.model.f <= 0) return;
      const ctx = this.ctx;
      const c = this.model.c;
      const vf = this.model.sourceVel.x;
      const lambdaFront = this.model.lambdaFront;
      const lambdaBack = this.model.lambdaBack;

      const srcPos = this.model.getSourcePos(t);
      const srcScreen = this.worldToScreen(srcPos.x, srcPos.y);

      // Only draw when wavefronts exist
      const emitted = this.model.wavefronts.filter(w => w.isEmitted(t));
      if (emitted.length < 2) return;

      const lastWf = emitted[emitted.length - 1];
      const prevWf = emitted[emitted.length - 2];
      const r1 = lastWf.radius(t, c);
      const r2 = prevWf.radius(t, c);

      ctx.save();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#7c3aed';
      ctx.fillStyle = '#7c3aed';
      ctx.font = 'bold 11px "Outfit", sans-serif';

      const drawDimArrow = (x1, x2, y, label) => {
        if (Math.abs(x2 - x1) < 8) return;
        const left = Math.min(x1, x2);
        const right = Math.max(x1, x2);
        const arrowSize = 6;

        ctx.beginPath();
        // Horizontal line
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        // Vertical end caps
        ctx.moveTo(left, y - 6);
        ctx.lineTo(left, y + 6);
        ctx.moveTo(right, y - 6);
        ctx.lineTo(right, y + 6);
        ctx.stroke();

        // Left arrowhead
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(left + arrowSize, y - 3.5);
        ctx.lineTo(left + arrowSize, y + 3.5);
        ctx.closePath();
        ctx.fill();

        // Right arrowhead
        ctx.beginPath();
        ctx.moveTo(right, y);
        ctx.lineTo(right - arrowSize, y - 3.5);
        ctx.lineTo(right - arrowSize, y + 3.5);
        ctx.closePath();
        ctx.fill();

        // Text centered below
        ctx.textAlign = 'center';
        ctx.fillText(label, (left + right) / 2, y + 16);
      };

      const yOffset = srcScreen.y + 42;

      if (vf > 0) {
        // Moving right (+x): delante is to the right, detrás is to the left
        const frontX1 = this.worldToScreen(lastWf.center.x + r1, 0).x;
        const frontX2 = this.worldToScreen(prevWf.center.x + r2, 0).x;
        drawDimArrow(frontX1, frontX2, yOffset, `λ delante = ${lambdaFront.toFixed(1)} m`);

        const backX1 = this.worldToScreen(lastWf.center.x - r1, 0).x;
        const backX2 = this.worldToScreen(prevWf.center.x - r2, 0).x;
        drawDimArrow(backX1, backX2, yOffset, `λ detrás = ${lambdaBack.toFixed(1)} m`);
      } else if (vf < 0) {
        // Moving left (-x): delante is to the left, detrás is to the right
        const frontX1 = this.worldToScreen(lastWf.center.x - r1, 0).x;
        const frontX2 = this.worldToScreen(prevWf.center.x - r2, 0).x;
        drawDimArrow(frontX1, frontX2, yOffset, `λ delante = ${lambdaFront.toFixed(1)} m`);

        const backX1 = this.worldToScreen(lastWf.center.x + r1, 0).x;
        const backX2 = this.worldToScreen(prevWf.center.x + r2, 0).x;
        drawDimArrow(backX1, backX2, yOffset, `λ detrás = ${lambdaBack.toFixed(1)} m`);
      } else {
        // Stationary
        const frontX1 = this.worldToScreen(lastWf.center.x + r1, 0).x;
        const frontX2 = this.worldToScreen(prevWf.center.x + r2, 0).x;
        drawDimArrow(frontX1, frontX2, yOffset, `λ = ${(c / this.model.f).toFixed(1)} m`);
      }

      ctx.restore();
    }

    drawSource(t) {
      const ctx = this.ctx;
      const pos = this.model.getSourcePos(t);
      const screen = this.worldToScreen(pos.x, pos.y);
      const vel = this.model.getSourceVel(t);

      ctx.save();

      if (this.sourceType === 'ambulance' || this.sourceType === 'car') {
        const vx = vel.x;
        const flipX = vx < -0.1 ? -1 : 1;
        ctx.save();
        ctx.translate(screen.x, screen.y);
        ctx.scale(flipX, 1);

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(0, 16, 26, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wheels
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(-16, 12, 6.5, 0, Math.PI * 2);
        ctx.arc(16, 12, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(-16, 12, 2.5, 0, Math.PI * 2);
        ctx.arc(16, 12, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Ambulance Main Body (white with dark outline)
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-26, -11, 52, 22, [4, 7, 3, 3]);
        else ctx.rect(-26, -11, 52, 22);
        ctx.fill();
        ctx.stroke();

        // Front Windshield Cabin
        ctx.fillStyle = '#93c5fd';
        ctx.beginPath();
        ctx.moveTo(10, -8);
        ctx.lineTo(21, -8);
        ctx.lineTo(24, 1);
        ctx.lineTo(10, 1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Side window
        ctx.fillStyle = '#dbeafe';
        ctx.fillRect(-6, -8, 12, 8);
        ctx.strokeStyle = '#3b82f6';
        ctx.strokeRect(-6, -8, 12, 8);

        // Red emergency horizontal stripe
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-25, 2.5, 49, 4);

        // Red Cross
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-17.5, -6.5, 3.5, 7.5);
        ctx.fillRect(-19.5, -4.5, 7.5, 3.5);

        // Roof Siren
        const sirenTick = Math.floor(t * 12) % 2 === 0;
        ctx.fillStyle = '#475569';
        ctx.fillRect(-5, -14, 10, 3);
        // Red bulb
        ctx.fillStyle = sirenTick ? '#ef4444' : '#991b1b';
        ctx.beginPath();
        ctx.arc(-3, -14.5, 2.8, 0, Math.PI * 2);
        ctx.fill();
        // Blue bulb
        ctx.fillStyle = !sirenTick ? '#3b82f6' : '#1e3a8a';
        ctx.beginPath();
        ctx.arc(3, -14.5, 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Siren glow if active/moving
        if (Math.abs(vx) > 0.1 || this.model.simTime > 0) {
          ctx.beginPath();
          ctx.arc(sirenTick ? -3 : 3, -14.5, 8, 0, Math.PI * 2);
          ctx.fillStyle = sirenTick ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)';
          ctx.fill();
        }

        // Headlight & Taillight
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(24.5, 3, 2, 3);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-26.5, 3, 2, 3);

        ctx.restore();

        // Label below: "Fuente" in dark red
        ctx.fillStyle = '#b91c1c';
        ctx.font = 'bold 12px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Fuente', screen.x, screen.y + 28);

        // Velocity vector arrow above vehicle: "v_f = ... m/s" in magenta/crimson
        if (this.showVectors && Math.abs(vx) > 0.1) {
          const arrowDir = vx >= 0 ? 1 : -1;
          const arrowLen = Math.min(75, Math.max(35, Math.abs(vx) * 0.4));
          const startX = screen.x + (arrowDir > 0 ? 16 : -16);
          const startY = screen.y - 16;
          const endX = startX + arrowDir * arrowLen;

          ctx.save();
          ctx.strokeStyle = '#e11d48';
          ctx.fillStyle = '#e11d48';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, startY);
          ctx.stroke();

          // Arrow head
          ctx.beginPath();
          ctx.moveTo(endX, startY);
          ctx.lineTo(endX - arrowDir * 7, startY - 4.5);
          ctx.lineTo(endX - arrowDir * 7, startY + 4.5);
          ctx.closePath();
          ctx.fill();

          ctx.font = 'bold 11px "Outfit", sans-serif';
          ctx.textAlign = arrowDir > 0 ? 'left' : 'right';
          ctx.fillText(`v_f = ${Math.round(Math.abs(vx))} m/s`, endX + (arrowDir > 0 ? 6 : -6), startY - 2);
          ctx.restore();
        }
      } else if (this.sourceType === 'plane') {
        const angle = vel.mag() > 0.1 ? vel.angle() : 0;
        ctx.save();
        ctx.translate(screen.x, screen.y);
        ctx.rotate(angle);
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(-14, -6);
        ctx.lineTo(-18, 0);
        ctx.lineTo(-14, 6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.lineTo(-12, -18);
        ctx.lineTo(-10, 0);
        ctx.lineTo(-12, 18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(18, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#b91c1c';
        ctx.font = 'bold 12px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Fuente (Avión)', screen.x, screen.y + 24);
      } else {
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(screen.x, screen.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#1d4ed8';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#b91c1c';
        ctx.font = 'bold 12px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Fuente (S)', screen.x, screen.y + 24);
      }
      ctx.restore();
    }

    drawObserver(t) {
      const ctx = this.ctx;
      const pos = this.model.getObsPos(t);
      const screen = this.worldToScreen(pos.x, pos.y);
      const vel = this.model.getObsVel(t);

      ctx.save();
      const ox = screen.x;
      const oy = screen.y;

      // Cyan dashed halo circle with label: "v_o = 0 - arrastra"
      ctx.strokeStyle = '#0ea5e9';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(ox, oy, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 11px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      const voMag = Math.round(Math.abs(vel.x));
      ctx.fillText(`v_o = ${voMag} - arrastra`, ox, oy - 22);

      // Microphone Tripod Stand
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ox, oy - 10);
      ctx.lineTo(ox, oy + 8);
      ctx.stroke();

      // Tripod 3 legs
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(ox, oy + 8);
      ctx.lineTo(ox - 9, oy + 18);
      ctx.moveTo(ox, oy + 8);
      ctx.lineTo(ox + 9, oy + 18);
      ctx.moveTo(ox, oy + 8);
      ctx.lineTo(ox, oy + 19);
      ctx.stroke();

      // Microphone capsule head
      ctx.fillStyle = '#0ea5e9';
      ctx.strokeStyle = '#0369a1';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(ox - 4.5, oy - 18, 9, 10, 4);
      else ctx.rect(ox - 4.5, oy - 18, 9, 10);
      ctx.fill();
      ctx.stroke();

      // Reception Pulse ring
      if (this.observerPulseIntensity > 0) {
        ctx.beginPath();
        ctx.arc(ox, oy, 16 + 24 * this.observerPulseIntensity, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(14, 165, 233, ${this.observerPulseIntensity})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Label below: "Observador"
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 12px "Outfit", sans-serif';
      ctx.fillText('Observador', ox, oy + 32);

      // Velocity vector if observer moves
      if (this.showVectors && Math.abs(vel.x) > 0.1) {
        const arrowDir = vel.x >= 0 ? 1 : -1;
        const arrowLen = Math.min(65, Math.max(30, Math.abs(vel.x) * 0.4));
        const startX = ox + (arrowDir > 0 ? 14 : -14);
        const startY = oy - 32;
        const endX = startX + arrowDir * arrowLen;

        ctx.save();
        ctx.strokeStyle = '#0284c7';
        ctx.fillStyle = '#0284c7';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, startY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(endX, startY);
        ctx.lineTo(endX - arrowDir * 6, startY - 4);
        ctx.lineTo(endX - arrowDir * 6, startY + 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    }

    drawVectorArrow(worldOrigin, worldVec, color, label) {
      const ctx = this.ctx;
      const sOrigin = this.worldToScreen(worldOrigin.x, worldOrigin.y);
      const arrowLen = Math.min(100, Math.max(30, worldVec.mag() * this.pixelsPerMeter * 0.4));
      const angle = worldVec.angle();
      const sEnd = {
        x: sOrigin.x + arrowLen * Math.cos(angle),
        y: sOrigin.y - arrowLen * Math.sin(angle)
      };

      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(sOrigin.x, sOrigin.y);
      ctx.lineTo(sEnd.x, sEnd.y);
      ctx.stroke();

      const headLen = 9;
      const a = Math.atan2(-(sEnd.y - sOrigin.y), sEnd.x - sOrigin.x);
      ctx.beginPath();
      ctx.moveTo(sEnd.x, sEnd.y);
      ctx.lineTo(sEnd.x - headLen * Math.cos(a - Math.PI / 6), sEnd.y + headLen * Math.sin(a - Math.PI / 6));
      ctx.lineTo(sEnd.x - headLen * Math.cos(a + Math.PI / 6), sEnd.y + headLen * Math.sin(a + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(label, sEnd.x + 6, sEnd.y - 4);
      ctx.restore();
    }

    drawRuler() {
      const ctx = this.ctx;
      const s1 = this.worldToScreen(this.rulerP1.x, this.rulerP1.y);
      const s2 = this.rulerP2 ? this.worldToScreen(this.rulerP2.x, this.rulerP2.y) : s1;

      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.fillStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(s1.x, s1.y, 4, 0, Math.PI * 2);
      if (this.rulerP2) ctx.arc(s2.x, s2.y, 4, 0, Math.PI * 2);
      ctx.fill();

      if (this.rulerP2) {
        const distM = this.rulerP1.dist(this.rulerP2);
        ctx.setLineDash([]);
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillText(`Distancia: ${distM.toFixed(2)} m`, (s1.x + s2.x) / 2 + 8, (s1.y + s2.y) / 2 - 8);
      }
      ctx.restore();
    }

    drawScaleBar() {
      const ctx = this.ctx;
      const ppm = this.pixelsPerMeter;
      const targetPx = 100;
      const rawMeters = targetPx / ppm;
      let barMeters = 200;
      if (rawMeters < 80) barMeters = 50;
      else if (rawMeters < 150) barMeters = 100;
      else if (rawMeters < 350) barMeters = 200;
      else if (rawMeters < 750) barMeters = 500;
      else barMeters = 1000;

      const barPx = barMeters * ppm;
      const x = 24;
      const y = this.height - 24;

      const isDark = document.body && document.body.classList.contains('dark-theme');
      ctx.save();
      ctx.strokeStyle = isDark ? '#cbd5e1' : '#334155';
      ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + barPx, y);
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x, y + 6);
      ctx.moveTo(x + barPx, y - 6);
      ctx.lineTo(x + barPx, y + 6);
      ctx.stroke();

      ctx.font = 'bold 11px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${barMeters} m`, x + barPx / 2, y - 8);
      ctx.restore();
    }
  }

  // --------------------------------------------------------------------------
  // 6. MOTOR DE GRÁFICAS SINCRONIZADAS
  // --------------------------------------------------------------------------
  class DopplerChartsEngine {
    constructor(canvas, model) {
      this.canvas = canvas;
      this.ctx = canvas ? canvas.getContext('2d') : null;
      this.model = model;
      this.activeTab = 'frequency';
      if (this.canvas) this.resize();
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dpr = window.devicePixelRatio || 1;
      this.width = rect.width;
      this.height = rect.height;

      this.canvas.width = Math.round(rect.width * dpr);
      this.canvas.height = Math.round(rect.height * dpr);

      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    setTab(tab) {
      this.activeTab = tab;
    }

    render() {
      if (!this.ctx || !this.canvas) return;
      if (this.canvas.clientWidth > 0 && (this.width <= 0 || Math.abs(this.canvas.clientWidth - this.width) > 2)) {
        this.resize();
      }
      if (this.width <= 0 || this.height <= 0) return;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      if (this.activeTab === 'frequency') this.drawFrequencyChart();
      else if (this.activeTab === 'kinematics') this.drawKinematicsChart();
      else if (this.activeTab === 'spacetime') this.drawSpacetimeChart();
      else if (this.activeTab === 'intervals') this.drawIntervalsChart();
    }

    drawFrequencyChart() {
      const ctx = this.ctx;
      const totalT = this.model.getTotalDuration();
      const currentT = this.model.simTime;
      const padL = 60, padR = 25, padT = 30, padB = 40;
      const plotW = this.width - padL - padR;
      const plotH = this.height - padT - padB;
      if (plotW <= 0 || plotH <= 0) return;

      const fe = this.model.f;
      let maxF = fe * 2.2;
      let minF = 0;

      const steps = 150;
      const foSamples = [];
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * totalT;
        const theo = this.model.getTheoreticalFrequency(t);
        const val = isFinite(theo.fo) ? Math.max(0, theo.fo) : null;
        foSamples.push({ t, val });
        if (val !== null && val < fe * 5 && val > maxF) maxF = val;
      }
      maxF = Math.max(maxF * 1.15, fe * 1.5);

      this.drawAxes(padL, padR, padT, padB, plotW, plotH, totalT, minF, maxF, 'Tiempo t (s)', 'Frecuencia f (Hz)');

      const yFe = padT + plotH - ((fe - minF) / (maxF - minF)) * plotH;
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, yFe);
      ctx.lineTo(padL + plotW, yFe);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started = false;
      for (const pt of foSamples) {
        if (pt.val === null) { started = false; continue; }
        const x = padL + (pt.t / totalT) * plotW;
        const y = padT + plotH - ((pt.val - minF) / (maxF - minF)) * plotH;
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      ctx.save();
      for (const rec of this.model.receptions) {
        if (rec.f_measured !== null && isFinite(rec.f_measured) && rec.t_r <= totalT) {
          const x = padL + (rec.t_r / totalT) * plotW;
          const y = padT + plotH - ((rec.f_measured - minF) / (maxF - minF)) * plotH;
          if (y >= padT && y <= padT + plotH) {
            ctx.beginPath();
            ctx.arc(x, y, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ec4899';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      this.drawTimeCursor(padL, padT, plotW, plotH, totalT, currentT);
      this.drawLegend([
        { label: `fe emitida (${fe.toFixed(1)} Hz)`, color: '#38bdf8', dashed: true },
        { label: 'fo teórica (retardada)', color: '#f59e0b', dashed: false },
        { label: 'f medida (cruces)', color: '#ec4899', isPoint: true }
      ], padL + 10, padT + 12);
    }

    drawKinematicsChart() {
      const ctx = this.ctx;
      const totalT = this.model.getTotalDuration();
      const currentT = this.model.simTime;
      const padL = 60, padR = 25, padT = 30, padB = 40;
      const plotW = this.width - padL - padR;
      const plotH = this.height - padT - padB;
      if (plotW <= 0 || plotH <= 0) return;

      const p1 = this.model.getSourcePos(0);
      const p2 = this.model.getSourcePos(totalT);
      const o1 = this.model.getObsPos(0);
      const o2 = this.model.getObsPos(totalT);

      let minX = Math.min(p1.x, p2.x, o1.x, o2.x, 0);
      let maxX = Math.max(p1.x, p2.x, o1.x, o2.x, 100);
      const span = Math.max(50, maxX - minX);
      minX -= span * 0.1;
      maxX += span * 0.1;

      this.drawAxes(padL, padR, padT, padB, plotW, plotH, totalT, minX, maxX, 'Tiempo t (s)', 'Posición x (m)');

      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const t = (i / 100) * totalT;
        const xWorld = this.model.getSourcePos(t).x;
        const x = padL + (t / totalT) * plotW;
        const y = padT + plotH - ((xWorld - minX) / (maxX - minX)) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = '#ec4899';
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const t = (i / 100) * totalT;
        const xWorld = this.model.getObsPos(t).x;
        const x = padL + (t / totalT) * plotW;
        const y = padT + plotH - ((xWorld - minX) / (maxX - minX)) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      this.drawTimeCursor(padL, padT, plotW, plotH, totalT, currentT);
      this.drawLegend([
        { label: 'Posición fuente xf(t)', color: '#38bdf8', dashed: false },
        { label: 'Posición observador xo(t)', color: '#ec4899', dashed: false }
      ], padL + 10, padT + 12);
    }

    drawSpacetimeChart() {
      const ctx = this.ctx;
      const totalT = this.model.getTotalDuration();
      const currentT = this.model.simTime;
      const padL = 60, padR = 25, padT = 30, padB = 40;
      const plotW = this.width - padL - padR;
      const plotH = this.height - padT - padB;
      if (plotW <= 0 || plotH <= 0) return;

      const p1 = this.model.getSourcePos(0);
      const p2 = this.model.getSourcePos(totalT);
      const o1 = this.model.getObsPos(0);
      const o2 = this.model.getObsPos(totalT);

      let minX = Math.min(p1.x, p2.x, o1.x, o2.x, 0) - 50;
      let maxX = Math.max(p1.x, p2.x, o1.x, o2.x, 100) + 50;

      this.drawAxes(padL, padR, padT, padB, plotW, plotH, totalT, minX, maxX, 'Tiempo t (s)', 'Posición x (m)');

      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';

      for (const rec of this.model.receptions) {
        if (rec.t_r <= totalT) {
          const x_e = padL + (rec.t_e / totalT) * plotW;
          const y_e = padT + plotH - ((rec.center.x - minX) / (maxX - minX)) * plotH;
          const x_r = padL + (rec.t_r / totalT) * plotW;
          const obsPosR = this.model.getObsPos(rec.t_r);
          const y_r = padT + plotH - ((obsPosR.x - minX) / (maxX - minX)) * plotH;

          ctx.beginPath();
          ctx.moveTo(x_e, y_e);
          ctx.lineTo(x_r, y_r);
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(x_e - 2, y_e - 2, 4, 4);
          ctx.fillStyle = '#ec4899';
          ctx.beginPath();
          ctx.arc(x_r, y_r, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      this.drawTimeCursor(padL, padT, plotW, plotH, totalT, currentT);
      this.drawLegend([
        { label: 'Rayos acústicos (te -> tr)', color: '#f59e0b', dashed: false },
        { label: 'Emisión en fuente', color: '#38bdf8', isPoint: true },
        { label: 'Recepción en observador', color: '#ec4899', isPoint: true }
      ], padL + 10, padT + 12);
    }

    drawIntervalsChart() {
      const ctx = this.ctx;
      const totalT = this.model.getTotalDuration();
      const padL = 60, padR = 25, padT = 30, padB = 40;
      const plotW = this.width - padL - padR;
      const plotH = this.height - padT - padB;
      if (plotW <= 0 || plotH <= 0) return;

      const data = this.model.receptions.filter(r => r.dt_r !== null && r.t_r <= totalT);
      const maxN = Math.max(10, data.length + 1);
      const T_emit = this.model.T;
      let maxDt = T_emit * 2;
      for (const d of data) {
        if (d.dt_r > maxDt) maxDt = d.dt_r;
      }
      maxDt *= 1.2;

      this.drawAxes(padL, padR, padT, padB, plotW, plotH, maxN, 0, maxDt, 'Evento k', 'Intervalo Δtr (s)');

      const yT = padT + plotH - (T_emit / maxDt) * plotH;
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, yT);
      ctx.lineTo(padL + plotW, yT);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      data.forEach((d, idx) => {
        const k = idx + 1;
        const x = padL + (k / maxN) * plotW;
        const y = padT + plotH - (d.dt_r / maxDt) * plotH;
        ctx.fillStyle = '#10b981';
        ctx.fillRect(x - 3, y, 6, padT + plotH - y);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      this.drawLegend([
        { label: `Período emitido T = ${T_emit.toFixed(3)}s`, color: '#38bdf8', dashed: true },
        { label: 'Intervalo Δtr,k medido', color: '#10b981', isPoint: true }
      ], padL + 10, padT + 12);
    }

    drawAxes(padL, padR, padT, padB, plotW, plotH, xMax, yMin, yMax, xLabel, yLabel) {
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.lineWidth = 1;

      ctx.strokeRect(padL, padT, plotW, plotH);

      for (let i = 0; i <= 5; i++) {
        const frac = i / 5;
        const x = padL + frac * plotW;
        const valX = (frac * xMax).toFixed(1);
        ctx.beginPath();
        ctx.moveTo(x, padT + plotH);
        ctx.lineTo(x, padT + plotH + 5);
        ctx.stroke();
        ctx.fillText(valX, x - 10, padT + plotH + 18);
      }

      for (let i = 0; i <= 4; i++) {
        const frac = i / 4;
        const y = padT + plotH - frac * plotH;
        const valY = (yMin + frac * (yMax - yMin)).toFixed(1);
        ctx.beginPath();
        ctx.moveTo(padL - 5, y);
        ctx.lineTo(padL, y);
        ctx.stroke();
        ctx.fillText(valY, padL - 38, y + 3);
      }

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 11px "Outfit", sans-serif';
      ctx.fillText(xLabel, padL + plotW / 2 - 35, padT + plotH + 34);

      ctx.save();
      ctx.translate(padL - 42, padT + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(yLabel, -35, 0);
      ctx.restore();
      ctx.restore();
    }

    drawTimeCursor(padL, padT, plotW, plotH, totalT, currentT) {
      if (currentT < 0 || currentT > totalT) return;
      const ctx = this.ctx;
      const x = padL + (currentT / totalT) * plotW;

      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(`t=${currentT.toFixed(2)}s`, x + 3, padT + 12);
      ctx.restore();
    }

    drawLegend(items, x, y) {
      const ctx = this.ctx;
      ctx.save();
      ctx.font = '10px "JetBrains Mono", monospace';
      let currY = y;
      for (const item of items) {
        ctx.strokeStyle = item.color;
        ctx.fillStyle = item.color;

        if (item.isPoint) {
          ctx.beginPath();
          ctx.arc(x + 6, currY - 3, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.lineWidth = 2;
          if (item.dashed) ctx.setLineDash([3, 3]);
          else ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(x, currY - 3);
          ctx.lineTo(x + 14, currY - 3);
          ctx.stroke();
        }
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(item.label, x + 20, currY);
        currY += 14;
      }
      ctx.restore();
    }

    exportCSV() {
      const totalT = this.model.getTotalDuration();
      const rows = [
        ['Tiempo_s', 'Posicion_Fuente_X_m', 'Posicion_Observador_X_m', 'Distancia_m', 'Frecuencia_Emitida_Hz', 'Frecuencia_Teorica_Hz']
      ];
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * totalT;
        const xf = this.model.getSourcePos(t).x;
        const xo = this.model.getObsPos(t).x;
        const d = Math.abs(xo - xf);
        const fe = this.model.f;
        const theo = this.model.getTheoreticalFrequency(t);
        const fo = isFinite(theo.fo) ? theo.fo.toFixed(4) : 'NaN';
        rows.push([t.toFixed(4), xf.toFixed(3), xo.toFixed(3), d.toFixed(3), fe.toFixed(2), fo]);
      }
      rows.push([]);
      rows.push(['# Evento', 'ID Frente', 'te (s)', 'tr (s)', 'Vuelo (s)', 'Δtr (s)', 'f_medida (Hz)']);
      this.model.receptions.forEach((rec, idx) => {
        rows.push([
          idx + 1,
          rec.wavefrontId,
          rec.t_e.toFixed(4),
          rec.t_r.toFixed(4),
          rec.flightTime.toFixed(4),
          rec.dt_r !== null ? rec.dt_r.toFixed(4) : '-',
          rec.f_measured !== null && isFinite(rec.f_measured) ? rec.f_measured.toFixed(3) : '-'
        ]);
      });
      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `efecto_doppler_datos_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    exportPNG() {
      if (!this.canvas) return;
      const dataUrl = this.canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `efecto_doppler_grafica_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  }

  // --------------------------------------------------------------------------
  // 7. LOS 8 ESCENARIOS DE APRENDIZAJE GUIADO
  // --------------------------------------------------------------------------
  const DOPPLER_SCENARIOS = [
    {
      id: 1,
      title: "1. Fuente y Observador Inmóviles en Reposo",
      tag: "Línea Base",
      objective: "Verificar el régimen estacionario clásico donde los frentes de onda son concéntricos y la frecuencia recibida coincide con la emitida (fo = fe).",
      config: { f: 2.0, c: 340.0, sourceX0: -170.0, sourceY0: 0.0, sourceVx: 0.0, sourceVy: 0.0, obsX0: 170.0, obsY0: 0.0, obsVx: 0.0, obsVy: 0.0, duration: 10.0, sourceType: 'point', is2D: false },
      prediction: {
        question: "Si la fuente y el observador están en reposo, ¿qué relación existirá entre los frentes y la frecuencia percibida?",
        options: [
          { text: "La frecuencia medida será igual a la emitida (fo = fe = 2 Hz) y los frentes se mantendrán concéntricos.", isCorrect: true, feedback: "¡Correcto! Sin movimiento relativo, la longitud de onda λ0 = c/f = 170 m es uniforme y el período es T = 0.5 s." },
          { text: "La frecuencia aumentará progresivamente con la distancia.", isCorrect: false, feedback: "Incorrecto. En un medio homogéneo sin dispersión, la frecuencia no varía con la distancia." },
          { text: "El sonido llegará instantáneamente sin retardo.", isCorrect: false, feedback: "Incorrecto. El sonido tarda t = d/c = 340/340 = 1.0 s en llegar." }
        ]
      },
      procedure: [
        "1. Observa la distancia inicial de 340 m entre la fuente y el observador.",
        "2. Presiona Iniciar (Play). Nota que el primer frente tarda exactamente 1.0 s en cruzar el micrófono.",
        "3. Activa los pulsos de audio y cuenta un beep cada 0.50 s.",
        "4. Comprueba en la tabla de mediciones que f_medida = 2.000 Hz."
      ],
      explanation: "Dado que vf = 0 y vo = 0, fo = fe * (c/c) = fe. En el medio no existe compresión: λ = c/f = 170 m en todas direcciones.",
      quiz: {
        question: "¿Cuánto tiempo transcurre entre la emisión del primer frente en la fuente y su registro a 340 m?",
        options: [
          { text: "1.00 segundo exacto, dado por t = d / c = 340 / 340.", isCorrect: true, feedback: "¡Exacto! El retardo físico de propagación en el aire es de 1 s para 340 m." },
          { text: "0.50 segundos, equivalente a un período.", isCorrect: false, feedback: "Incorrecto. 0.5 s es el período de oscilación T = 1/f, no el tiempo de viaje." }
        ]
      }
    },
    {
      id: 2,
      title: "2. Fuente en Aproximación hacia Receptor Fijo",
      tag: "Acercamiento",
      objective: "Comprender la compresión espacial de los frentes de onda delante de una fuente en movimiento (vf > 0) y el incremento de frecuencia.",
      config: { f: 2.0, c: 340.0, sourceX0: -200.0, sourceY0: 0.0, sourceVx: 68.0, sourceVy: 0.0, obsX0: 140.0, obsY0: 0.0, obsVx: 0.0, obsVy: 0.0, duration: 8.0, sourceType: 'car', is2D: false },
      prediction: {
        question: "Al moverse la fuente hacia el observador a 68 m/s (20% de c), ¿qué sucederá con la longitud de onda y la frecuencia recibida?",
        options: [
          { text: "Los frentes se comprimen (λdelante disminuye) y la frecuencia recibida aumenta (fo > fe).", isCorrect: true, feedback: "¡Excelente! La fuente comprime las ondas delante a λ' = (c - vf)/f = 136 m y fo = 2.50 Hz." },
          { text: "La rapidez del sonido en el aire aumenta a c + vf = 408 m/s.", isCorrect: false, feedback: "¡Error conceptual común! La rapidez c en el aire depende del medio, NO de la fuente." }
        ]
      },
      procedure: [
        "1. Verifica los parámetros: fe = 2 Hz, c = 340 m/s, vf = +68 m/s.",
        "2. Inicia la simulación y observa la cota verde 'λdelante' comprimida a 136 m.",
        "3. Comprueba el cálculo analítico: fo = 2 * (340 / 272) = 2.50 Hz."
      ],
      explanation: "λdelante = (c - vf)/f = (340 - 68)/2 = 136 m. Como las ondas viajan a c hacia el observador, fo = c / λdelante = 340 / 136 = 2.50 Hz (+25%).",
      quiz: {
        question: "Para fe = 2 Hz, c = 340 m/s y vf = 68 m/s, ¿cuál es el valor exacto de fo?",
        options: [
          { text: "fo = 2.50 Hz.", isCorrect: true, feedback: "¡Correcto! fo = 2 * 340 / 272 = 2.50 Hz." },
          { text: "fo = 2.40 Hz.", isCorrect: false, feedback: "Incorrecto. 2.40 Hz ocurre cuando se mueve el observador a 68 m/s." }
        ]
      }
    },
    {
      id: 3,
      title: "3. Fuente en Alejamiento de Receptor Fijo",
      tag: "Alejamiento",
      objective: "Analizar la dilatación espacial de la longitud de onda detrás de una fuente que se aleja y la caída de la frecuencia percibida (tono grave).",
      config: { f: 2.0, c: 340.0, sourceX0: 50.0, sourceY0: 0.0, sourceVx: 68.0, sourceVy: 0.0, obsX0: -150.0, obsY0: 0.0, obsVx: 0.0, obsVy: 0.0, duration: 8.0, sourceType: 'car', is2D: false },
      prediction: {
        question: "Cuando la fuente viaja en sentido contrario al observador, ¿qué efecto se produce?",
        options: [
          { text: "Los frentes se dilatan (λdetrás aumenta) y el receptor percibe una frecuencia menor (fo < fe).", isCorrect: true, feedback: "¡Exacto! Al alejarse, la distancia entre frentes aumenta a λ' = (c + vf)/f = 204 m." },
          { text: "La frecuencia permanece igual.", isCorrect: false, feedback: "Incorrecto. Hay velocidad relativa alejándose." }
        ]
      },
      procedure: [
        "1. Inicia la simulación: la fuente avanza hacia la derecha alejándose del receptor en x = -150 m.",
        "2. Observa la cota 'λdetrás = 204 m'.",
        "3. Comprueba el cálculo: fo = 2 * (340 / 408) = 1.667 Hz."
      ],
      explanation: "λdetrás = (340 + 68)/2 = 204 m. La frecuencia percibida es fo = 340 / 204 ≈ 1.667 Hz.",
      quiz: {
        question: "¿Cuál es la longitud de onda dilatada en la estela posterior?",
        options: [
          { text: "λdetrás = 204 m.", isCorrect: true, feedback: "¡Excelente! (340 + 68)/2 = 204 m." },
          { text: "λdetrás = 170 m.", isCorrect: false, feedback: "170 m es la longitud en reposo." }
        ]
      }
    },
    {
      id: 4,
      title: "4. Observador en Movimiento hacia Fuente Fija",
      tag: "Observador Móvil",
      objective: "Demostrar que el movimiento del observador NO altera la longitud de onda espacial en el aire, sino la rapidez de intercepción de frentes.",
      config: { f: 2.0, c: 340.0, sourceX0: -150.0, sourceY0: 0.0, sourceVx: 0.0, sourceVy: 0.0, obsX0: 170.0, obsY0: 0.0, obsVx: -68.0, obsVy: 0.0, duration: 6.0, sourceType: 'point', is2D: false },
      prediction: {
        question: "¿Se comprimen los círculos en el aire cuando se desplaza el observador?",
        options: [
          { text: "No: los círculos en el aire son concéntricos y de λ0 = 170 m; la mayor frecuencia se debe a la velocidad relativa de encuentro (c + vo).", isCorrect: true, feedback: "¡Brillante distinción clásica! El medio no se deforma; el observador se abalanza sobre las ondas con rapidez c + vo." },
          { text: "Sí, todos los círculos se mueven con el observador.", isCorrect: false, feedback: "Incorrecto. Los frentes son perturbaciones del medio, no del observador." }
        ]
      },
      procedure: [
        "1. Fíjate en los frentes de onda: son círculos perfectamente concéntricos con λ0 = 170 m.",
        "2. Comprueba el cálculo analítico: fo = fe * (c + vo)/c = 2 * (340 + 68)/340 = 2.40 Hz.",
        "3. Contrasta con el Escenario 2: ¡2.40 Hz ≠ 2.50 Hz! Esto demuestra la asimetría clásica."
      ],
      explanation: "En la acústica clásica el medio es el marco de referencia. Mover la fuente comprime λ: fo = 2.50 Hz. Mover el receptor altera la velocidad relativa: fo = 2.40 Hz.",
      quiz: {
        question: "¿Por qué para una misma rapidez relativa de 68 m/s, fo = 2.40 Hz (observador móvil) y fo = 2.50 Hz (fuente móvil)?",
        options: [
          { text: "Porque mover la fuente altera λ en el medio, mientras que mover el observador altera la rapidez relativa de captura.", isCorrect: true, feedback: "¡Perfecto! Has comprendido la asimetría fundamental del efecto Doppler clásico." },
          { text: "Es solo un error de redondeo.", isCorrect: false, feedback: "Incorrecto. Es un resultado exacto." }
        ]
      }
    },
    {
      id: 5,
      title: "5. Observador en Alejamiento de Fuente Fija",
      tag: "Observador Móvil",
      objective: "Analizar el caso en que el receptor huye de las ondas emitidas por una fuente en reposo, reduciendo la rapidez de encuentro a c - vo.",
      config: { f: 2.0, c: 340.0, sourceX0: -150.0, sourceY0: 0.0, sourceVx: 0.0, sourceVy: 0.0, obsX0: 50.0, obsY0: 0.0, obsVx: 68.0, obsVy: 0.0, duration: 8.0, sourceType: 'point', is2D: false },
      prediction: {
        question: "Si el receptor se desplaza a 68 m/s alejándose de la fuente en reposo, ¿qué valor registrará?",
        options: [
          { text: "fo = 2 * (340 - 68) / 340 = 1.60 Hz.", isCorrect: true, feedback: "¡Correcto! Rapidez efectiva c - vo = 272 m/s -> fo = 272 / 170 = 1.60 Hz." },
          { text: "fo = 0 Hz.", isCorrect: false, feedback: "Incorrecto. Como vo < c, las ondas aún lo alcanzan." }
        ]
      },
      procedure: [
        "1. Inicia la simulación: el observador huye hacia la derecha a 68 m/s.",
        "2. Verifica que fo = 1.60 Hz."
      ],
      explanation: "Rapidez con que las ondas sobrepasan al receptor: 340 - 68 = 272 m/s. Dividido por λ0 = 170 m da exactamente fo = 1.60 Hz.",
      quiz: {
        question: "¿Qué ocurriría si el observador se alejara a vo = c = 340 m/s?",
        options: [
          { text: "fo = 0 Hz (viaja sobre una misma cresta y nunca cruza frentes sucesivos).", isCorrect: true, feedback: "¡Exacto!" },
          { text: "fo = infinito.", isCorrect: false, feedback: "Incorrecto." }
        ]
      }
    },
    {
      id: 6,
      title: "6. Movimiento Conjunto con Separación Fija (vf = vo)",
      tag: "Tándem",
      objective: "Comprobar que cuando la fuente y el observador viajan a la misma velocidad y dirección, la frecuencia recibida es exactamente igual a la emitida (fo = fe).",
      config: { f: 2.0, c: 340.0, sourceX0: -200.0, sourceY0: 0.0, sourceVx: 68.0, sourceVy: 0.0, obsX0: 100.0, obsY0: 0.0, obsVx: 68.0, obsVy: 0.0, duration: 8.0, sourceType: 'car', is2D: false },
      prediction: {
        question: "Si ambos viajan juntos a 68 m/s manteniendo su separación fija, ¿cuál será la frecuencia registrada?",
        options: [
          { text: "fo = fe = 2.0 Hz. La compresión de la fuente se cancela con la 'huida' del receptor.", isCorrect: true, feedback: "¡Exacto! (c - v)/(c - v) = 1." },
          { text: "fo = 2.5 Hz.", isCorrect: false, feedback: "Incorrecto. El receptor no está quieto." }
        ]
      },
      procedure: [
        "1. Inicia la simulación: ambos móviles se desplazan juntos.",
        "2. Nota que en el aire los frentes están comprimidos delante de la fuente, pero el receptor navega a la misma tasa.",
        "3. Comprueba fo = 2.000 Hz."
      ],
      explanation: "fo = fe * (c - v)/(c - v) = fe * 1 = 2.0 Hz.",
      quiz: {
        question: "¿Se cumple esta igualdad para cualquier velocidad subsónica constante compartida?",
        options: [
          { text: "Sí, siempre que vf = vo < c en régimen colineal.", isCorrect: true, feedback: "¡Correcto!" },
          { text: "No, solo a v = 0.", isCorrect: false, feedback: "Incorrecto." }
        ]
      }
    },
    {
      id: 7,
      title: "7. Paso Lateral Bidimensional (Efecto Doppler 2D)",
      tag: "Geometría 2D",
      objective: "Estudiar la variación suave de frecuencia cuando la fuente pasa cerca de un observador desplazado lateralmente (yo ≠ yf).",
      config: { f: 2.0, c: 340.0, sourceX0: -250.0, sourceY0: 0.0, sourceVx: 100.0, sourceVy: 0.0, obsX0: 0.0, obsY0: 80.0, obsVx: 0.0, obsVy: 0.0, duration: 6.0, sourceType: 'car', is2D: true },
      prediction: {
        question: "Cuando la fuente pasa de largo frente a un observador desplazado a 80 m, ¿cómo evoluciona la frecuencia?",
        options: [
          { text: "Comienza en un valor alto, realiza una transición suave decreciente al pasar cerca y termina en un valor bajo.", isCorrect: true, feedback: "¡Excelente! Este es el clásico glissando continuo de sirena." },
          { text: "Salta bruscamente de golpe.", isCorrect: false, feedback: "Incorrecto." }
        ]
      },
      procedure: [
        "1. Inicia la simulación y observa la curva en la gráfica de frecuencias.",
        "2. En la modalidad de audio tonal, escucha la caída suave de agudo a grave."
      ],
      explanation: "El factor relevante es n · vf = vf * cos(θ_retardado). La variación suave de θ produce la transición continua.",
      quiz: {
        question: "Cuando la onda recibida fue emitida perpendicularmente (cos θ = 0), ¿cuánto vale fo?",
        options: [
          { text: "fo = fe (la frecuencia observada es exactamente la frecuencia propia emitida).", isCorrect: true, feedback: "¡Correcto!" },
          { text: "fo = 0.", isCorrect: false, feedback: "Incorrecto." }
        ]
      }
    },
    {
      id: 8,
      title: "8. Regímenes Sónico y Supersónico (Mach 1 y Mach 1.5)",
      tag: "Supersónico",
      objective: "Explorar la barrera acústica en M = 1 y el cono de Mach envolvente para M > 1 con semíangulo μ = arcsin(1/M).",
      config: { f: 2.5, c: 340.0, sourceX0: -280.0, sourceY0: 0.0, sourceVx: 510.0, sourceVy: 0.0, obsX0: 0.0, obsY0: 100.0, obsVx: 0.0, obsVy: 0.0, duration: 3.5, sourceType: 'plane', is2D: true },
      prediction: {
        question: "Para una aeronave volando a Mach 1.5 (vf = 510 m/s > c), ¿qué escucha el observador antes de que el choque lo alcance?",
        options: [
          { text: "Silencio absoluto (zona de calma). Ninguna onda puede adelantarse a la fuente supersónica.", isCorrect: true, feedback: "¡Exacto! El observador no oye nada hasta que la superficie del cono cruza su posición." },
          { text: "Un tono muy agudo.", isCorrect: false, feedback: "Incorrecto." }
        ]
      },
      procedure: [
        "1. Observa el avión supersónico a Mach 1.50.",
        "2. Nota el cono de Mach con semíangulo μ = arcsin(1 / 1.5) ≈ 41.8°.",
        "3. Inicia la simulación y observa que al tocar la línea roja el micrófono, se dispara el estampido sónico."
      ],
      explanation: "Para M > 1, los frentes emitidos quedan encerrados en una superficie cónica tangente con semíangulo μ = arcsin(1/M). Su cruce genera el estampido sónico.",
      quiz: {
        question: "Para Mach 2.0, ¿cuánto vale el semíangulo de Mach μ?",
        options: [
          { text: "μ = arcsin(1 / 2.0) = 30.0°.", isCorrect: true, feedback: "¡Perfecto!" },
          { text: "μ = 45.0°.", isCorrect: false, feedback: "Incorrecto." }
        ]
      }
    }
  ];

  // --------------------------------------------------------------------------
  // 8. SUITE DE VERIFICACIÓN NUMÉRICA (12 CASOS OBLIGATORIOS)
  // --------------------------------------------------------------------------
  class DopplerVerifier {
    static runAllTests() {
      const results = [];
      const tol = 1e-4;
      const c = 340.0;
      const f = 1000.0;

      const testCollinear = (name, vf, vo, expectedFo) => {
        const model = new DopplerModel({ f, c, sourceX0: 0, sourceVx: vf, obsX0: 340, obsVx: vo, duration: 2.0 });
        const theo = model.getTheoreticalFrequency(0.5);
        const errTheo = Math.abs(theo.fo - expectedFo);
        const recs = model.receptions.filter(r => r.f_measured !== null && isFinite(r.f_measured));
        let measuredAvg = null;
        let errMeasured = null;
        if (recs.length > 0) {
          measuredAvg = recs[Math.floor(recs.length / 2)].f_measured;
          errMeasured = Math.abs(measuredAvg - expectedFo);
        }
        const passed = errTheo < tol && (errMeasured === null || errMeasured < 1e-2);
        results.push({
          name,
          expected: expectedFo.toFixed(4) + " Hz",
          obtainedTheo: theo.fo.toFixed(4) + " Hz",
          obtainedEmpirical: measuredAvg !== null ? measuredAvg.toFixed(4) + " Hz" : "N/A",
          deltaError: errTheo.toExponential(3),
          passed
        });
      };

      testCollinear("1. Ambos inmóviles (vf=0, vo=0)", 0.0, 0.0, 1000.0);
      testCollinear("2. Fuente que se aproxima a 34 m/s (vf=+34, vo=0)", 34.0, 0.0, 1000.0 * (340.0 / 306.0));
      testCollinear("3. Fuente que se aleja a 34 m/s (vf=-34, vo=0)", -34.0, 0.0, 1000.0 * (340.0 / 374.0));
      testCollinear("4. Observador se aproxima a 34 m/s (vf=0, vo=-34 hacia fuente)", 0.0, -34.0, 1000.0 * (374.0 / 340.0));
      testCollinear("5. Observador se aleja a 34 m/s (vf=0, vo=+34 alejándose)", 0.0, 34.0, 1000.0 * (306.0 / 340.0));
      testCollinear("6. Ambos a 34 m/s en tándem con separación fija", 34.0, 34.0, 1000.0);

      // 7. Retardo a 340 m
      {
        const model = new DopplerModel({ f: 2.0, c: 340.0, sourceX0: 0, obsX0: 340.0, duration: 5.0 });
        const firstRec = model.receptions.find(r => r.wavefrontId === 0);
        const delay = firstRec ? firstRec.t_r - firstRec.t_e : -1;
        results.push({
          name: "7. Tiempo de vuelo para d = 340 m (c = 340 m/s)",
          expected: "1.0000 s",
          obtainedTheo: delay.toFixed(4) + " s",
          obtainedEmpirical: "tr = " + (firstRec ? firstRec.t_r.toFixed(4) : "N/A") + " s",
          deltaError: Math.abs(delay - 1.0).toExponential(3),
          passed: Math.abs(delay - 1.0) < 1e-6
        });
      }

      // 8. Mach 2 semíangulo
      {
        const model = new DopplerModel({ f: 2.0, c: 340.0, sourceVx: 680.0, duration: 3.0 });
        const angleDeg = model.machAngleDeg;
        results.push({
          name: "8. Semíangulo del cono de Mach para M = 2.0 (vf = 680 m/s)",
          expected: "30.0000°",
          obtainedTheo: angleDeg.toFixed(4) + "°",
          obtainedEmpirical: "μ = arcsin(1/2)",
          deltaError: Math.abs(angleDeg - 30.0).toExponential(3),
          passed: Math.abs(angleDeg - 30.0) < 1e-6
        });
      }

      // 9. Invarianza de framerate
      {
        const model = new DopplerModel({ f: 4.0, c: 340.0, sourceVx: 50.0, obsX0: 200.0, duration: 4.0 });
        const testDuration = 2.5;
        const simulateFPS = (fps) => {
          model.reset();
          const totalFrames = Math.round(testDuration * fps);
          const dt = testDuration / totalFrames;
          let arrivalsCount = 0;
          for (let frame = 0; frame < totalFrames; frame++) {
            const res = model.advanceTime(dt);
            arrivalsCount += res.arrivals.length;
          }
          return arrivalsCount;
        };
        const c30 = simulateFPS(30), c60 = simulateFPS(60), c144 = simulateFPS(144);
        const passed = (c30 === c60) && (c60 === c144);
        results.push({
          name: "9. Invarianza temporal de conteo a 30, 60 y 144 fps",
          expected: "Mismo número de llegadas",
          obtainedTheo: `30fps:${c30} | 60fps:${c60} | 144fps:${c144}`,
          obtainedEmpirical: passed ? "Exactamente idéntico" : "Discrepancia",
          deltaError: "0",
          passed
        });
      }

      // 10. Determinismo en reversa
      {
        const model = new DopplerModel({ f: 2.0, c: 340.0, sourceVx: 40.0, duration: 5.0 });
        model.setTime(3.5);
        const x1 = model.getSourcePos(model.simTime).x;
        model.setTime(1.2);
        model.setTime(3.5);
        const x2 = model.getSourcePos(model.simTime).x;
        results.push({
          name: "10. Determinismo al retroceder y avanzar el tiempo",
          expected: "Preservación idéntica",
          obtainedTheo: `x(3.5s) = ${x1.toFixed(4)}m`,
          obtainedEmpirical: `x(3.5s) = ${x2.toFixed(4)}m`,
          deltaError: Math.abs(x1 - x2).toExponential(3),
          passed: Math.abs(x1 - x2) < 1e-10
        });
      }

      // 11. Singularidad Mach 1
      {
        const model = new DopplerModel({ f: 2.0, c: 340.0, sourceVx: 340.0, obsX0: 100.0, duration: 4.0 });
        const theo = model.getTheoreticalFrequency(0.5);
        results.push({
          name: "11. Manejo seguro de singularidad en Mach 1 (denominador nulo)",
          expected: "Infinity controlado sin NaN",
          obtainedTheo: theo.fo === Infinity ? "Infinity (Singularidad)" : theo.fo.toString(),
          obtainedEmpirical: theo.status,
          deltaError: "0",
          passed: !isNaN(theo.fo)
        });
      }

      // 12. Unicidad de recepciones
      {
        const model = new DopplerModel({ f: 3.0, c: 340.0, duration: 3.0 });
        const total = model.receptions.length;
        const unique = new Set(model.receptions.map(r => r.wavefrontId)).size;
        results.push({
          name: "12. Unicidad de recepciones (sin eventos ni sonidos duplicados)",
          expected: "1 cruce único por frente",
          obtainedTheo: `${total} eventos registrados`,
          obtainedEmpirical: `${unique} IDs únicos`,
          deltaError: "0",
          passed: total === unique
        });
      }

      return results;
    }
  }

  // --------------------------------------------------------------------------
  // 9. LABORATORIO DE CÓDIGO DE TRAYECTORIAS
  // --------------------------------------------------------------------------
  const CODE_PRESETS = {
    harmonic: {
      title: "Fuente en Movimiento Armónico Simple (M.A.S.)",
      code: `// Simulación de fuente oscilante alrededor del origen\nconst A = 80.0;\nconst Tosc = 2.0;\nconst omega = 2 * Math.PI / Tosc;\n\nreturn {\n  x: A * Math.sin(omega * t),\n  y: 0.0\n};`
    },
    circular: {
      title: "Efecto Doppler Rotacional (Órbita Circular 2D)",
      code: `// Fuente rotando en círculo de radio R = 100 m\nconst R = 100.0;\nconst T_rev = 3.0;\nconst omega = 2 * Math.PI / T_rev;\n\nreturn {\n  x: R * Math.cos(omega * t),\n  y: R * Math.sin(omega * t)\n};`
    },
    accelerated: {
      title: "Transición Transónica con Aceleración Constante",
      code: `// Fuente acelerando desde el reposo: a = 70 m/s²\nconst x0 = -300.0;\nconst a = 70.0;\n\nreturn {\n  x: x0 + 0.5 * a * t * t,\n  y: 0.0\n};`
    }
  };

  class DopplerCodeLab {
    constructor(model, onAppliedCallback) {
      this.model = model;
      this.onApplied = onAppliedCallback;
    }

    applySourceTrajectory(codeString) {
      try {
        const fn = new Function('t', `"use strict"; try { ${codeString} } catch(e) { throw e; }`);
        const p0 = fn(0);
        if (!p0 || typeof p0.x !== 'number' || typeof p0.y !== 'number' || isNaN(p0.x) || isNaN(p0.y)) {
          return { success: false, error: "La función debe retornar un objeto con coordenadas numéricas { x, y }." };
        }
        this.model.sourceTrajectoryFn = (t) => {
          try {
            const res = fn(t);
            return new Vector2D(res.x || 0, res.y || 0);
          } catch (err) {
            return new Vector2D(0, 0);
          }
        };
        this.model.rebuildExperiment();
        if (this.onApplied) this.onApplied();
        return { success: true, message: "¡Trayectoria compilada y aplicada exitosamente!" };
      } catch (err) {
        return { success: false, error: "Error de compilación o ejecución: " + err.message };
      }
    }

    resetToLinearTrajectory() {
      this.model.sourceTrajectoryFn = null;
      this.model.obsTrajectoryFn = null;
      this.model.rebuildExperiment();
      if (this.onApplied) this.onApplied();
    }
  }

  // --------------------------------------------------------------------------
  // 10. COORDINADOR PRINCIPAL (DopplerApp)
  // --------------------------------------------------------------------------
  class DopplerApp {
    constructor(containerPrefix = '') {
      window.dopplerApp = this;
      this.prefix = containerPrefix;
      this.isPlaying = false;
      this.playSpeed = 1.0;
      this.lastFrameTime = performance.now();
      this.currentMode = 'exploration';

      this.model = new DopplerModel({
        f: 2.0,
        c: 340.0,
        sourceX0: -170.0,
        sourceVx: 0.0,
        obsX0: 170.0,
        obsVx: 0.0,
        duration: 10.0,
        subdivisions: 100
      });

      this.audio = new DopplerAudioEngine();

      const canvas = this.getEl('doppler-canvas');
      this.renderer = new DopplerCanvasRenderer(canvas, this.model);

      const chartCanvas = this.getEl('doppler-chart-canvas');
      this.charts = new DopplerChartsEngine(chartCanvas, this.model);

      this.codeLab = new DopplerCodeLab(this.model, () => {
        this.syncInputsFromModel();
        this.updateMathPanel();
        this.updateEventsTable();
      });

      this.activeScenario = null;
      this.init();
    }

    getEl(id) {
      if (this.prefix) {
        const el = document.getElementById(this.prefix + id);
        if (el) return el;
      }
      return document.getElementById(id);
    }

    init() {
      this.bindDomElements();
      this.bindEvents();
      this.syncInputsFromModel();
      this.updateMathPanel();
      this.updateEventsTable();
      this.updateMachBadge();

      requestAnimationFrame((t) => this.loop(t));
      this.renderMath();
    }

    renderMath() {
      if (window.renderMathInElement) {
        window.renderMathInElement(document.body, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      }
    }

    bindDomElements() {
      this.btnPlay = this.getEl('btn-play-pause');
      this.btnReset = this.getEl('btn-reset');
      this.btnStepFwd = this.getEl('btn-step-fwd');
      this.btnStepBack = this.getEl('btn-step-back');
      this.btnStepPeriod = this.getEl('btn-step-period');
      this.scrubber = this.getEl('time-scrubber');
      this.timeDisplay = this.getEl('time-display');
      this.speedSelect = this.getEl('speed-select');

      this.btnModeExploration = this.getEl('btn-mode-exploration');
      this.btnModeLab = this.getEl('btn-mode-lab');

      this.sliderF = this.getEl('slider-f');
      this.inputF = this.getEl('input-f');
      this.sliderC = this.getEl('slider-c');
      this.inputC = this.getEl('input-c');
      this.sliderVf = this.getEl('slider-vf');
      this.inputVf = this.getEl('input-vf');
      this.sliderVo = this.getEl('slider-vo');
      this.inputVo = this.getEl('input-vo');
      this.sliderSep = this.getEl('slider-sep');
      this.inputSep = this.getEl('input-sep');
      this.sliderDuration = this.getEl('slider-duration');
      this.inputDuration = this.getEl('input-duration');

      this.selectSourceType = this.getEl('select-source-type');
      this.selectWaveStyle = this.getEl('select-wave-style');
      this.colorWave = this.getEl('color-wave');
      this.checkAttenuation = this.getEl('check-attenuation');
      this.checkVectors = this.getEl('check-vectors');
      this.checkGrid = this.getEl('check-grid');
      this.checkTrackSource = this.getEl('check-track-source');

      this.btnToggleAudio = this.getEl('btn-toggle-audio');
      this.selectAudioMode = this.getEl('select-audio-mode');
      this.sliderVolume = this.getEl('slider-volume');

      this.btnOpenScenarios = this.getEl('btn-open-scenarios');
      this.btnOpenVerify = this.getEl('btn-open-verify');
      this.btnOpenCodeLab = this.getEl('btn-open-codelab');
      this.btnOpenManual = this.getEl('btn-open-manual');

      this.sliderSourceX = this.getEl('slider-source-x');
      this.inputSourceX = this.getEl('input-source-x');
      this.selectSubdivisions = this.getEl('select-subdivisions');

      this.machBadge = this.getEl('mach-status-badge');
    }

    bindEvents() {
      window.addEventListener('resize', () => {
        this.renderer.resize();
        this.charts.resize();
      });

      if (this.btnPlay) this.btnPlay.addEventListener('click', () => this.togglePlay());
      if (this.btnReset) this.btnReset.addEventListener('click', () => this.resetSimulation());
      if (this.btnStepFwd) this.btnStepFwd.addEventListener('click', () => { this.pause(); this.advanceStep(this.model.dtStep); });
      if (this.btnStepBack) this.btnStepBack.addEventListener('click', () => { this.pause(); this.advanceStep(-this.model.dtStep); });
      if (this.btnStepPeriod) this.btnStepPeriod.addEventListener('click', () => { this.pause(); this.advanceStep(this.model.T); });

      if (this.scrubber) {
        this.scrubber.addEventListener('input', (e) => {
          this.pause();
          this.model.setTime(parseFloat(e.target.value));
          this.audio.stopAll();
          this.updateUiState();
        });
      }

      if (this.speedSelect) {
        this.speedSelect.addEventListener('change', (e) => {
          this.playSpeed = parseFloat(e.target.value) || 1.0;
        });
      }

      document.querySelectorAll('[data-speed]').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('[data-speed]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.playSpeed = parseFloat(btn.dataset.speed) || 1.0;
        });
      });

      document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.sidebar-tab-btn').forEach(b => b.classList.remove('active'));
          document.querySelectorAll('.sidebar-tab-pane').forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          const target = this.getEl('pane-' + btn.dataset.tab);
          if (target) target.classList.add('active');
        });
      });

      const btnToggleRes = this.getEl('btn-toggle-results');
      const flyout = this.getEl('results-flyout-panel');
      const btnCloseFlyout = this.getEl('btn-close-results-flyout');
      if (btnToggleRes && flyout) {
        btnToggleRes.addEventListener('click', () => {
          flyout.classList.toggle('open');
          this.charts.resize();
        });
      }
      if (btnCloseFlyout && flyout) {
        btnCloseFlyout.addEventListener('click', () => flyout.classList.remove('open'));
      }

      const btnTheme = this.getEl('btn-theme-toggle');
      if (btnTheme) {
        btnTheme.addEventListener('click', () => {
          const isDark = document.body.classList.toggle('dark-theme');
          btnTheme.innerHTML = isDark ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
          if (window.lucide) window.lucide.createIcons();
          this.renderer.render();
          this.charts.render();
        });
      }

      if (this.btnModeExploration) this.btnModeExploration.addEventListener('click', () => this.setMode('exploration'));
      if (this.btnModeLab) this.btnModeLab.addEventListener('click', () => this.setMode('lab'));

      const bindPair = (slider, input, setter, minVal = null) => {
        if (!slider || !input) return;
        slider.addEventListener('input', (e) => {
          let val = parseFloat(e.target.value);
          if (minVal !== null && val < minVal) val = minVal;
          input.value = val;
          setter(val);
          this.model.rebuildExperiment();
          this.updateUiState();
        });
        input.addEventListener('change', (e) => {
          let val = parseFloat(e.target.value);
          if (isNaN(val)) return;
          if (minVal !== null && val < minVal) val = minVal;
          slider.value = val;
          setter(val);
          this.model.rebuildExperiment();
          this.updateUiState();
        });
      };

      bindPair(this.sliderF, this.inputF, (v) => this.model.f = v, 0.1);
      bindPair(this.sliderC, this.inputC, (v) => this.model.c = v, 50);
      bindPair(this.sliderVf, this.inputVf, (v) => this.model.sourceVel.x = v);
      bindPair(this.sliderVo, this.inputVo, (v) => this.model.obsVel.x = v);
      bindPair(this.sliderDuration, this.inputDuration, (v) => this.model.duration = v, 1);
      bindPair(this.sliderSourceX, this.inputSourceX, (v) => this.model.sourcePos0.x = v);

      if (this.selectSubdivisions) {
        this.selectSubdivisions.addEventListener('change', (e) => {
          this.model.subdivisions = parseInt(e.target.value, 10) || 100;
          this.model.rebuildExperiment();
          this.updateUiState();
        });
      }

      const updateSeparation = (sep) => {
        const half = sep / 2;
        this.model.sourcePos0.x = -half;
        this.model.obsPos0.x = half;
      };
      bindPair(this.sliderSep, this.inputSep, updateSeparation, 10);

      if (this.selectSourceType) this.selectSourceType.addEventListener('change', (e) => this.renderer.sourceType = e.target.value);
      if (this.selectWaveStyle) this.selectWaveStyle.addEventListener('change', (e) => this.renderer.waveStyle = e.target.value);
      if (this.colorWave) this.colorWave.addEventListener('input', (e) => this.renderer.waveColor = e.target.value);
      if (this.checkAttenuation) this.checkAttenuation.addEventListener('change', (e) => this.renderer.enableAttenuation = e.target.checked);
      if (this.checkVectors) this.checkVectors.addEventListener('change', (e) => this.renderer.showVectors = e.target.checked);
      if (this.checkGrid) this.checkGrid.addEventListener('change', (e) => this.renderer.showGrid = e.target.checked);
      if (this.checkTrackSource) this.checkTrackSource.addEventListener('change', (e) => this.renderer.trackSource = e.target.checked);

      const btnZoomIn = this.getEl('btn-zoom-in');
      if (btnZoomIn) btnZoomIn.addEventListener('click', () => this.renderer.zoomIn());

      const btnZoomOut = this.getEl('btn-zoom-out');
      if (btnZoomOut) btnZoomOut.addEventListener('click', () => this.renderer.zoomOut());

      const btnFocus = this.getEl('btn-focus-source');
      if (btnFocus) btnFocus.addEventListener('click', () => this.renderer.focusSource());

      const btnFit = this.getEl('btn-fit-scene');
      if (btnFit) btnFit.addEventListener('click', () => this.renderer.fitScene());

      const btnResetView = this.getEl('btn-reset-view');
      if (btnResetView) btnResetView.addEventListener('click', () => this.renderer.resetView());

      const btnRuler = this.getEl('btn-toggle-ruler');
      if (btnRuler) {
        btnRuler.addEventListener('click', () => {
          this.renderer.rulerActive = !this.renderer.rulerActive;
          btnRuler.classList.toggle('active', this.renderer.rulerActive);
          if (!this.renderer.rulerActive) {
            this.renderer.rulerP1 = null;
            this.renderer.rulerP2 = null;
          }
        });
      }

      if (this.btnToggleAudio) {
        this.btnToggleAudio.addEventListener('click', async () => {
          if (!this.audio.isEnabled) {
            const ok = await this.audio.init();
            if (ok) {
              this.btnToggleAudio.classList.add('primary');
              this.btnToggleAudio.innerHTML = '<i data-lucide="volume-2"></i> Audio Activo';
              if (window.lucide) window.lucide.createIcons();
            }
          } else {
            this.audio.setMute(!this.audio.isMuted);
            if (this.audio.isMuted) {
              this.btnToggleAudio.classList.remove('primary');
              this.btnToggleAudio.innerHTML = '<i data-lucide="volume-x"></i> Audio Silenciado';
            } else {
              this.btnToggleAudio.classList.add('primary');
              this.btnToggleAudio.innerHTML = '<i data-lucide="volume-2"></i> Audio Activo';
            }
            if (window.lucide) window.lucide.createIcons();
          }
        });
      }

      if (this.selectAudioMode) this.selectAudioMode.addEventListener('change', (e) => this.audio.setMode(e.target.value));
      if (this.sliderVolume) this.sliderVolume.addEventListener('input', (e) => this.audio.setVolume(parseFloat(e.target.value)));

      document.querySelectorAll('.chart-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.chart-tab-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          this.charts.setTab(e.target.dataset.tab);
        });
      });

      const btnExpCSV = this.getEl('btn-export-csv');
      if (btnExpCSV) btnExpCSV.addEventListener('click', () => this.charts.exportCSV());

      const btnExpPNG = this.getEl('btn-export-png');
      if (btnExpPNG) btnExpPNG.addEventListener('click', () => this.charts.exportPNG());

      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        const page15 = document.getElementById('page-15');
        if (page15 && !page15.classList.contains('active') && !page15.classList.contains('active-page')) return;

        if (e.code === 'Space') { e.preventDefault(); this.togglePlay(); }
        else if (e.code === 'KeyR') { this.resetSimulation(); }
        else if (e.code === 'ArrowRight' && !page15) { this.advanceStep(this.model.dtStep); }
        else if (e.code === 'ArrowLeft' && !page15) { this.advanceStep(-this.model.dtStep); }
        else if (e.code === 'KeyM') { this.audio.setMute(!this.audio.isMuted); }
      });

      this.setupModals();
    }

    setupModals() {
      const bindModal = (btnId, modalId, closeId) => {
        const btn = this.getEl(btnId);
        const modal = this.getEl(modalId);
        const close = this.getEl(closeId);
        if (btn && modal && close) {
          btn.addEventListener('click', () => modal.classList.add('open'));
          close.addEventListener('click', () => modal.classList.remove('open'));
          modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
        }
      };

      bindModal('btn-open-scenarios', 'modal-scenarios', 'btn-close-scenarios');
      bindModal('btn-open-verify', 'modal-verify', 'btn-close-verify');
      bindModal('btn-open-codelab', 'modal-codelab', 'btn-close-codelab');
      bindModal('btn-open-manual', 'modal-manual', 'btn-close-manual');
      bindModal('btn-open-theory', 'modal-theory', 'btn-close-theory');

      this.renderScenariosList();

      const btnRunTests = this.getEl('btn-run-tests');
      if (btnRunTests) {
        btnRunTests.addEventListener('click', () => this.runVerificationTests());
      }

      this.setupCodeLabUI();
    }

    renderScenariosList() {
      const container = this.getEl('scenarios-grid');
      if (!container) return;
      container.innerHTML = '';

      DOPPLER_SCENARIOS.forEach(sc => {
        const btn = document.createElement('button');
        btn.className = 'scenario-card-btn';
        btn.innerHTML = `
          <div class="scenario-card-tag">${sc.tag}</div>
          <div class="scenario-card-title">${sc.title}</div>
          <p style="font-size:0.75rem; color:var(--doppler-text-muted); line-height:1.3;">${sc.objective.substring(0, 95)}...</p>
        `;
        btn.addEventListener('click', () => this.loadScenario(sc));
        container.appendChild(btn);
      });
    }

    loadScenario(sc) {
      this.activeScenario = sc;
      this.pause();

      this.model.f = sc.config.f;
      this.model.c = sc.config.c;
      this.model.sourcePos0.set(sc.config.sourceX0, sc.config.sourceY0);
      this.model.sourceVel.set(sc.config.sourceVx, sc.config.sourceVy);
      this.model.obsPos0.set(sc.config.obsX0, sc.config.obsY0);
      this.model.obsVel.set(sc.config.obsVx, sc.config.obsVy);
      this.model.duration = sc.config.duration;
      this.renderer.sourceType = sc.config.sourceType || 'point';

      this.model.reset();
      this.syncInputsFromModel();
      this.renderer.fitScene();
      this.updateUiState();

      const detailBox = this.getEl('scenario-detail-box');
      if (detailBox) {
        detailBox.style.display = 'block';
        detailBox.innerHTML = `
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--doppler-panel-border); border-radius:var(--radius-md); padding:16px; display:flex; flex-direction:column; gap:12px;">
            <h3 style="color:var(--doppler-accent-amber); font-family:var(--font-serif); font-size:1.05rem;">${sc.title}</h3>
            <p style="font-size:0.85rem; color:#cbd5e1; line-height:1.4;">${sc.objective}</p>
            
            <div class="interactive-quiz-box">
              <h4 style="color:var(--doppler-accent-cyan); font-size:0.88rem;">🤔 Pregunta de Predicción</h4>
              <p style="font-size:0.82rem; color:#e2e8f0;">${sc.prediction.question}</p>
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${sc.prediction.options.map((opt, i) => `
                  <button class="quiz-option-btn" data-opt-idx="${i}">${opt.text}</button>
                `).join('')}
              </div>
              <div id="pred-feedback" class="quiz-feedback-box" style="display:none;"></div>
            </div>

            <div style="background:rgba(0,0,0,0.25); border-left:3px solid var(--doppler-accent-emerald); padding:10px 14px; border-radius:4px;">
              <h4 style="color:var(--doppler-accent-emerald); font-size:0.85rem; margin-bottom:6px;">📋 Procedimiento Didáctico</h4>
              <ul style="font-size:0.8rem; color:#cbd5e1; list-style-position:inside; line-height:1.5;">
                ${sc.procedure.map(step => `<li>${step}</li>`).join('')}
              </ul>
            </div>

            <div style="background:rgba(0,0,0,0.25); border-left:3px solid var(--doppler-accent-cyan); padding:10px 14px; border-radius:4px;">
              <h4 style="color:var(--doppler-accent-cyan); font-size:0.85rem; margin-bottom:6px;">🔬 Explicación Física y Geométrica</h4>
              <p style="font-size:0.8rem; color:#cbd5e1; line-height:1.4;">${sc.explanation}</p>
            </div>

            <button id="btn-start-scenario-exp" class="btn-header primary" style="align-self:flex-start; margin-top:6px;">
              <i data-lucide="play"></i> Cargar al Simulador e Iniciar
            </button>
          </div>
        `;

        detailBox.querySelectorAll('.quiz-option-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.optIdx, 10);
            const opt = sc.prediction.options[idx];
            const fb = detailBox.querySelector('#pred-feedback');
            fb.style.display = 'block';
            fb.style.background = opt.isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
            fb.style.color = opt.isCorrect ? '#34d399' : '#f87171';
            fb.innerHTML = `<strong>${opt.isCorrect ? '✓ ¡Correcto!' : '✗ Inténtalo de nuevo:'}</strong> ${opt.feedback}`;
          });
        });

        const btnStart = detailBox.querySelector('#btn-start-scenario-exp');
        if (btnStart) {
          btnStart.addEventListener('click', () => {
            const m = this.getEl('modal-scenarios');
            if (m) m.classList.remove('open');
            this.play();
          });
        }

        if (window.lucide) window.lucide.createIcons();
      }
    }

    setupCodeLabUI() {
      const editor = this.getEl('codelab-editor');
      const selectPreset = this.getEl('select-codelab-preset');
      const btnCompile = this.getEl('btn-compile-code');
      const btnResetCode = this.getEl('btn-reset-code');
      const msgBox = this.getEl('codelab-msg');

      if (!editor || !selectPreset) return;

      selectPreset.addEventListener('change', (e) => {
        const key = e.target.value;
        if (CODE_PRESETS[key]) editor.value = CODE_PRESETS[key].code;
      });

      if (btnCompile) {
        btnCompile.addEventListener('click', () => {
          const res = this.codeLab.applySourceTrajectory(editor.value);
          if (msgBox) {
            msgBox.style.display = 'block';
            msgBox.style.background = res.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
            msgBox.style.color = res.success ? '#34d399' : '#f87171';
            msgBox.textContent = res.success ? res.message : res.error;
          }
          if (res.success) {
            const modal = this.getEl('modal-codelab');
            if (modal) modal.classList.remove('open');
            this.renderer.fitScene();
          }
        });
      }

      if (btnResetCode) {
        btnResetCode.addEventListener('click', () => {
          this.codeLab.resetToLinearTrajectory();
          if (msgBox) {
            msgBox.style.display = 'block';
            msgBox.style.background = 'rgba(56, 189, 248, 0.15)';
            msgBox.style.color = '#38bdf8';
            msgBox.textContent = "Trayectoria restaurada a movimiento rectilíneo.";
          }
        });
      }
    }

    runVerificationTests() {
      const tbody = this.getEl('verify-table-body');
      if (!tbody) return;
      tbody.innerHTML = '';
      const results = DopplerVerifier.runAllTests();

      results.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="color:#e2e8f0; font-weight:600;">${r.name}</td>
          <td style="color:#94a3b8;">${r.expected}</td>
          <td style="color:#38bdf8;">${r.obtainedTheo}</td>
          <td style="color:#a78bfa;">${r.obtainedEmpirical}</td>
          <td style="color:#cbd5e1;">${r.deltaError}</td>
          <td><span class="verify-badge ${r.passed ? 'pass' : 'fail'}">${r.passed ? '✓ PASÓ' : '✗ FALLÓ'}</span></td>
        `;
        tbody.appendChild(tr);
      });
    }

    setMode(mode) {
      this.currentMode = mode;
      if (this.btnModeExploration) this.btnModeExploration.classList.toggle('active', mode === 'exploration');
      if (this.btnModeLab) this.btnModeLab.classList.toggle('active', mode === 'lab');

      document.querySelectorAll('.lab-only').forEach(el => {
        el.style.display = mode === 'lab' ? '' : 'none';
      });
    }

    syncInputsFromModel() {
      if (this.sliderF) this.sliderF.value = this.model.f;
      if (this.inputF) this.inputF.value = this.model.f;
      if (this.sliderC) this.sliderC.value = this.model.c;
      if (this.inputC) this.inputC.value = this.model.c;
      if (this.sliderVf) this.sliderVf.value = this.model.sourceVel.x;
      if (this.inputVf) this.inputVf.value = this.model.sourceVel.x;
      if (this.sliderVo) this.sliderVo.value = this.model.obsVel.x;
      if (this.inputVo) this.inputVo.value = this.model.obsVel.x;

      const sep = Math.abs(this.model.obsPos0.x - this.model.sourcePos0.x);
      if (this.sliderSep) this.sliderSep.value = sep.toFixed(1);
      if (this.inputSep) this.inputSep.value = sep.toFixed(1);

      const dur = this.model.getTotalDuration();
      if (this.sliderDuration) this.sliderDuration.value = dur.toFixed(1);
      if (this.inputDuration) this.inputDuration.value = dur.toFixed(1);
      if (this.scrubber) this.scrubber.max = dur;
    }

    togglePlay() {
      if (this.isPlaying) this.pause();
      else this.play();
    }

    play() {
      this.isPlaying = true;
      this.lastFrameTime = performance.now();
      if (this.btnPlay) {
        this.btnPlay.innerHTML = '<i data-lucide="pause"></i> Pausar';
        this.btnPlay.classList.add('primary');
      }
      if (window.lucide) window.lucide.createIcons();
    }

    pause() {
      this.isPlaying = false;
      if (this.btnPlay) {
        this.btnPlay.innerHTML = '<i data-lucide="play"></i> Iniciar';
        this.btnPlay.classList.remove('primary');
      }
      this.audio.stopAll();
      if (window.lucide) window.lucide.createIcons();
    }

    resetSimulation() {
      this.pause();
      this.model.reset();
      this.updateUiState();
    }

    advanceStep(dt) {
      const totalT = this.model.getTotalDuration();
      const newT = Math.max(0, Math.min(totalT, this.model.simTime + dt));
      this.model.setTime(newT);
      this.updateUiState();
    }

    loop(timestamp) {
      const deltaMs = timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;

      if (this.isPlaying) {
        const dtPhysical = (deltaMs / 1000.0) * this.playSpeed;
        const res = this.model.advanceTime(dtPhysical);

        if (res.arrivals.length > 0) {
          for (let i = 0; i < res.arrivals.length; i++) {
            this.audio.playArrivalPulse();
            this.renderer.triggerReceptionPulse();
          }
        }

        if (res.machCrossing) {
          this.audio.playSonicBoom();
        }

        if (this.audio.audioMode === 'tonal') {
          const theo = this.model.getTheoreticalFrequency(this.model.simTime);
          this.audio.updateTonalSynthesis(theo.fo, this.model.f);
        }

        if (res.isFinished) this.pause();
        this.updateUiState();
      }

      this.renderer.render();
      this.charts.render();
      requestAnimationFrame((t) => this.loop(t));
    }

    updateUiState() {
      const t = this.model.simTime;
      const dur = this.model.getTotalDuration();
      const nSub = this.model.subdivisions || 100;
      const dtPeriod = this.model.T / nSub;

      if (this.scrubber) {
        this.scrubber.value = t;
        this.scrubber.max = dur;
      }
      if (this.timeDisplay) {
        this.timeDisplay.textContent = `t = ${t.toFixed(3)} s`;
      }
      const elSubInfo = this.getEl('time-subdivision-info');
      if (elSubInfo) {
        elSubInfo.textContent = `Δt = T/${nSub} = ${dtPeriod.toFixed(4)} s`;
      }
      const elDurInfo = this.getEl('time-duration-info');
      if (elDurInfo) {
        elDurInfo.textContent = `${dur.toFixed(2)} s`;
      }

      this.updateMachBadge();
      this.updateMathPanel();
      this.updateEventsTable();
    }

    updateMachBadge() {
      const M = this.model.Mach;
      const badge = this.machBadge;
      if (badge) {
        badge.className = 'status-pill';
        if (M < 0.99) {
          badge.classList.add('mach-sub');
          badge.innerHTML = `<span class="pill-dot green"></span> Subsónico &bull; M = ${M.toFixed(2)}`;
        } else if (M <= 1.05) {
          badge.classList.add('mach-sonic');
          badge.innerHTML = `<span class="pill-dot amber"></span> Mach 1.00 &bull; Barrera Sónica`;
        } else {
          badge.classList.add('mach-super');
          badge.innerHTML = `<span class="pill-dot red"></span> Supersónico &bull; M = ${M.toFixed(2)} (μ=${this.model.machAngleDeg.toFixed(1)}°)`;
        }
      }

      const badgeMotion = this.getEl('motion-status-badge');
      if (badgeMotion) {
        const t = this.model.simTime;
        const pS = this.model.getSourcePos(t);
        const pO = this.model.getObsPos(t);
        const vS = this.model.getSourceVel(t);
        const vO = this.model.getObsVel(t);

        const relPos = pO.sub(pS);
        const relVel = vO.sub(vS);
        const dist = relPos.mag();
        const rate = dist > 1e-4 ? relPos.dot(relVel) / dist : 0;

        badgeMotion.className = 'status-pill';
        if (rate > 0.5) {
          badgeMotion.classList.add('motion-away');
          badgeMotion.innerHTML = `<span class="pill-dot purple"></span> Alejamiento`;
        } else if (rate < -0.5) {
          badgeMotion.classList.add('motion-approach');
          badgeMotion.innerHTML = `<span class="pill-dot blue"></span> Acercamiento`;
        } else {
          badgeMotion.classList.add('motion-rest');
          badgeMotion.innerHTML = `<span class="pill-dot gray"></span> Reposo Relativo`;
        }
      }
    }

    updateMathPanel() {
      const t = this.model.simTime;
      const theo = this.model.getTheoreticalFrequency(t);
      const measured = this.model.getMeasuredFrequencyAt(t);

      const elFo = this.getEl('val-fo');
      const elFm = this.getEl('val-fm');
      const elMach = this.getEl('val-mach');
      const elLambda = this.getEl('val-lambda');

      if (elFo) elFo.textContent = isFinite(theo.fo) ? `${theo.fo.toFixed(3)} Hz` : 'Singularidad';
      if (elFm) elFm.textContent = measured.f_measured !== null ? `${measured.f_measured.toFixed(3)} Hz` : measured.status;
      if (elMach) elMach.textContent = `${this.model.Mach.toFixed(3)}`;
      if (elLambda) elLambda.textContent = `${this.model.lambdaFront.toFixed(1)} m`;
    }

    updateEventsTable() {
      const tbody = this.getEl('events-table-body');
      if (!tbody) return;

      const t = this.model.simTime;
      tbody.innerHTML = '';
      const recs = this.model.receptions.slice(0, 30);
      recs.forEach((r, idx) => {
        const isPast = r.t_r <= t + 1e-6;
        const isCurrent = Math.abs(r.t_r - t) < 0.15;
        const tr = document.createElement('tr');
        if (isCurrent) tr.className = 'active-row';
        tr.innerHTML = `
          <td>#${idx + 1}</td>
          <td>${r.wavefrontId}</td>
          <td>${r.t_e.toFixed(2)}s</td>
          <td style="color:${isPast ? '#10b981' : '#94a3b8'}">${r.t_r.toFixed(2)}s</td>
          <td>${r.flightTime.toFixed(2)}s</td>
          <td style="color:#ec4899; font-weight:700;">${r.f_measured ? r.f_measured.toFixed(2) + ' Hz' : '-'}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  // --------------------------------------------------------------------------
  // EXPORTAR AL OBJETO GLOBAL (window)
  // --------------------------------------------------------------------------
  global.Vector2D = Vector2D;
  global.Wavefront = Wavefront;
  global.DopplerModel = DopplerModel;
  global.DopplerAudioEngine = DopplerAudioEngine;
  global.DopplerCanvasRenderer = DopplerCanvasRenderer;
  global.DopplerChartsEngine = DopplerChartsEngine;
  global.DOPPLER_SCENARIOS = DOPPLER_SCENARIOS;
  global.DopplerVerifier = DopplerVerifier;
  global.CODE_PRESETS = CODE_PRESETS;
  global.DopplerCodeLab = DopplerCodeLab;
  global.DopplerApp = DopplerApp;

})(typeof window !== 'undefined' ? window : globalThis);
