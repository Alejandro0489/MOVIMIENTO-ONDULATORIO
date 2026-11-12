/**
 * ============================================================================
 * MOTOR Y SIMULADOR AVANZADO DE ONDAS ESTACIONARIAS EN CUERDAS TENSAS
 * Cuaderno Interactivo de Física III • Universidad
 * 
 * Implementación UMD / Browser Vanilla (100% libre de imports/exports para
 * compatibilidad absoluta con protocolo local file:/// sin restricciones CORS).
 * ============================================================================
 */

(function (global) {
  'use strict';

  // ==========================================================================
  // 1. SINTETIZADOR ACÚSTICO WEB AUDIO API (SONIFICACIÓN DE ARMÓNICOS)
  // ==========================================================================
  class StandingWaveAudio {
    constructor() {
      this.audioCtx = null;
      this.masterGain = null;
      this.oscillators = [];
      this.isEnabled = false;
      this.volume = 0.3;
      this.baseMusicalFreq = 110; // La fundamental de referencia (A2 = 110 Hz)
    }

    initContext() {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioCtx = new AudioContext();
          this.masterGain = this.audioCtx.createGain();
          this.masterGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
          this.masterGain.connect(this.audioCtx.destination);
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }

    toggle() {
      this.initContext();
      this.isEnabled = !this.isEnabled;
      if (this.masterGain && this.audioCtx) {
        const targetVol = this.isEnabled ? this.volume : 0;
        this.masterGain.gain.setTargetAtTime(targetVol, this.audioCtx.currentTime, 0.05);
      }
      return this.isEnabled;
    }

    setVolume(val) {
      this.volume = Math.max(0, Math.min(1, val));
      if (this.isEnabled && this.masterGain && this.audioCtx) {
        this.masterGain.gain.setTargetAtTime(this.volume, this.audioCtx.currentTime, 0.05);
      }
    }

    updateHarmonic(n, physicalFreq) {
      if (!this.audioCtx) return;
      this.stopOscillators();

      if (!this.isEnabled) return;

      // Determinamos frecuencia audible pedagógica proporcional al armónico
      let audiblePitch = physicalFreq;
      while (audiblePitch < 65) {
        audiblePitch *= 2;
      }
      while (audiblePitch > 1200) {
        audiblePitch /= 2;
      }

      const now = this.audioCtx.currentTime;

      // 1. Oscilador fundamental del armónico n
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(audiblePitch, now);
      gain1.gain.setValueAtTime(0.7, now);
      osc1.connect(gain1);
      gain1.connect(this.masterGain);
      osc1.start();
      this.oscillators.push(osc1);

      // 2. Sobretono sutil (timbre de cuerda elástica con armónicos naturales)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(audiblePitch * 2, now);
      gain2.gain.setValueAtTime(0.2, now);
      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start();
      this.oscillators.push(osc2);
    }

    playPluckSound(physicalFreq) {
      this.initContext();
      if (!this.audioCtx || !this.isEnabled) return;

      let audiblePitch = physicalFreq;
      while (audiblePitch < 80) audiblePitch *= 2;
      while (audiblePitch > 1000) audiblePitch /= 2;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(audiblePitch, now);
      osc.frequency.exponentialRampToValueAtTime(audiblePitch * 0.99, now + 0.5);

      gain.gain.setValueAtTime(this.volume * 0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.2);
    }

    stopOscillators() {
      this.oscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {}
      });
      this.oscillators = [];
    }
  }

  // ==========================================================================
  // 2. CLASE PRINCIPAL: SIMULADOR DE ONDAS ESTACIONARIAS
  // ==========================================================================
  class StandingWavesSimulator {
    constructor(options = {}) {
      this.containerId = options.containerId || 'standing-waves-root';
      this.canvasId = options.canvasId || 'canvas-standing-waves';
      this.isEmbedded = Boolean(options.isEmbedded);
      this.prefix = options.prefix || '';

      // Parámetros físicos fundamentales
      this.T = 120.0;     // Tensión en la cuerda (N)
      this.mu = 0.010;    // Densidad lineal de masa (kg/m)
      this.L = 2.0;       // Longitud entre extremos fijos (m)
      this.A = 0.15;      // Amplitud máxima del antinodo (m)
      this.n = 1;         // Número de armónico (1 a 10)

      // Modo Experimento de Melde (T = m * g)
      this.isMeldeMode = false;
      this.g = 9.80665;
      this.hangingMassKg = this.T / this.g;

      // Punteo interactivo de la cuerda (Pluck)
      this.isPlucking = false;
      this.pluckX = null;
      this.pluckY = 0;

      // Sonda y Osciloscopio en tiempo real y(t)
      this.probeX = this.L / (2 * this.n); // Posición métrica sonda
      this.scopeBuffer = [];
      this.scopeMaxPoints = 120;
      this.scopeCanvas = null;
      this.scopeCtx = null;

      // Variables cinemáticas y derivadas
      this.v = 0;         // Rapidez de onda (m/s)
      this.lambda = 0;    // Longitud de onda (m)
      this.k = 0;         // Número de onda (rad/m)
      this.f1 = 0;        // Frecuencia fundamental (Hz)
      this.fn = 0;        // Frecuencia del armónico n (Hz)
      this.omega = 0;     // Frecuencia angular (rad/s)
      this.period = 0;    // Período (s)
      this.totalMass = 0; // Masa total de la cuerda (kg)
      this.totalEnergy = 0; // Energía total constante (J)

      // Estado de simulación temporal
      this.time = 0.0;
      this.playbackSpeed = 0.03; // Factor de velocidad de animación inicial ultra lenta
      this.isPlaying = true;
      this.lastTimestamp = 0;
      this.animFrameId = null;

      // Opciones de visualización
      this.showNodes = true;
      this.showAntinodes = true;
      this.showEnvelope = true;
      this.showTravelingWaves = false; // Descomposición en y1 y y2
      this.showVectors = true;         // Vectores vy y ay
      this.showGrid = true;
      this.showEnergy = true;

      // Sonda interactiva (Mouse / Touch)
      this.mousePos = null; // { xMeters, yPixels }
      this.isHoveringCanvas = false;

      // Módulo de audio
      this.audio = new StandingWaveAudio();

      this.init();
    }

    getEl(subId) {
      const id = this.prefix ? `${this.prefix}-${subId}` : subId;
      return document.getElementById(id);
    }

    init() {
      this.canvas = this.getEl(this.canvasId) || document.getElementById(this.canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');

      // Inicializar canvas del osciloscopio
      const scopeId = this.prefix ? `${this.prefix}-canvas-sw-scope` : 'canvas-sw-scope';
      this.scopeCanvas = document.getElementById(scopeId);
      if (this.scopeCanvas) {
        this.scopeCtx = this.scopeCanvas.getContext('2d');
      }

      this.bindControls();
      this.setSpeed(0.03); // Velocidad inicial ultra lenta solicitada
      this.bindPresets();
      this.bindModals();
      this.bindCanvasEvents();
      this.bindKeyboard();
      this.initSolver();
      this.initChallenges();

      this.updatePhysics();
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());

      // Iniciar bucle de animación
      this.lastTimestamp = performance.now();
      this.loop = this.loop.bind(this);
      this.animFrameId = requestAnimationFrame(this.loop);
    }

    // ------------------------------------------------------------------------
    // CÁLCULOS FÍSICOS ANALÍTICOS
    // ------------------------------------------------------------------------
    updatePhysics() {
      if (this.isMeldeMode) {
        this.T = this.hangingMassKg * this.g;
      } else {
        this.hangingMassKg = this.T / this.g;
      }

      // Rapidez de propagación: v = sqrt(T / mu)
      this.v = Math.sqrt(this.T / this.mu);
      // Masa total de la cuerda: M = mu * L
      this.totalMass = this.mu * this.L;
      // Longitud de onda del modo n: lambda_n = 2L / n
      this.lambda = (2 * this.L) / this.n;
      // Número de onda angular: k_n = 2*pi / lambda = n*pi / L
      this.k = (this.n * Math.PI) / this.L;
      // Frecuencia fundamental: f_1 = v / (2L)
      this.f1 = this.v / (2 * this.L);
      // Frecuencia del armónico n: f_n = n * f_1
      this.fn = this.n * this.f1;
      // Frecuencia angular: omega = 2*pi * f_n
      this.omega = 2 * Math.PI * this.fn;
      // Período: T_n = 1 / f_n
      this.period = 1 / this.fn;

      // Energía total del modo estacionario: E_tot = 1/4 * mu * omega^2 * A^2 * L
      this.totalEnergy = 0.25 * this.mu * Math.pow(this.omega, 2) * Math.pow(this.A, 2) * this.L;

      this.updateTelemetryDOM();

      // Actualizar sonificación
      if (this.audio) {
        this.audio.updateHarmonic(this.n, this.fn);
      }
    }

    updateTelemetryDOM() {
      const setTxt = (id, val) => {
        const el = this.getEl(id);
        if (el) el.textContent = val;
      };

      setTxt('sw-val-v', `${this.v.toFixed(2)} m/s`);
      setTxt('sw-val-fn', `${this.fn.toFixed(2)} Hz`);
      setTxt('sw-val-f1', `${this.f1.toFixed(2)} Hz`);
      setTxt('sw-val-lambda', `${this.lambda.toFixed(3)} m`);
      setTxt('sw-val-k', `${this.k.toFixed(2)} rad/m`);
      setTxt('sw-val-omega', `${this.omega.toFixed(1)} rad/s`);
      setTxt('sw-val-period', `${(this.period * 1000).toFixed(1)} ms`);
      setTxt('sw-val-mass', `${(this.totalMass * 1000).toFixed(1)} g`);
      setTxt('sw-val-nodes-count', `${this.n + 1} nodos`);
      setTxt('sw-val-antinodes-count', `${this.n} antinodos`);
      setTxt('sw-val-node-dist', `${(this.L / this.n).toFixed(3)} m`);

      const vmax = this.omega * this.A;
      const amax = Math.pow(this.omega, 2) * this.A;
      setTxt('sw-val-vmax', `${vmax.toFixed(2)} m/s`);
      setTxt('sw-val-amax', `${amax.toFixed(1)} m/s²`);
      setTxt('sw-val-energy', `${this.totalEnergy.toFixed(3)} J`);
      setTxt('sw-val-power', `0.000 W (Nula)`);

      setTxt('sw-featured-fn', `${this.fn.toFixed(2)} Hz`);
      setTxt('sw-featured-v', `${this.v.toFixed(2)} m/s`);

      // Valores del Experimento de Melde
      setTxt('sw-val-hanging-mass', `${(this.hangingMassKg * 1000).toFixed(0)} g (${this.hangingMassKg.toFixed(3)} kg)`);
      setTxt('sw-val-melde-tension', `${this.T.toFixed(2)} N`);

      // Fórmulas KaTeX vivas si están disponibles
      const formulaEl = this.getEl('sw-math-harmonic-formula');
      if (formulaEl) {
        formulaEl.innerHTML = `f_{${this.n}} = ${this.n} \\cdot \\left(\\frac{${this.v.toFixed(1)}}{2 \\cdot ${this.L.toFixed(1)}}\\right) = ${this.fn.toFixed(2)}\\text{ Hz}`;
        if (window.katex) {
          try {
            window.katex.render(formulaEl.textContent, formulaEl, { throwOnError: false });
          } catch (e) {}
        }
      }
    }

    setSpeed(val) {
      const num = Math.max(0.005, Math.min(5.0, parseFloat(val) || 0.03));
      this.playbackSpeed = num;

      const slider = this.getEl('slider-sw-speed');
      const input = this.getEl('input-sw-speed');
      const select = this.getEl('select-sw-speed');

      if (slider) slider.value = num;
      if (input) input.value = num.toFixed(2);
      if (select) select.value = num.toString();

      // Actualizar botones de velocidad recomendada
      const speedBtns = document.querySelectorAll(this.prefix ? `.${this.prefix}-speed-btn` : '.speed-btn');
      speedBtns.forEach(btn => {
        const btnVal = parseFloat(btn.getAttribute('data-speed'));
        btn.classList.toggle('active', Math.abs(btnVal - num) < 0.005);
      });
    }

    // ------------------------------------------------------------------------
    // ENLACE DE CONTROLES (SLIDERS, STEPPERS, BOTONES)
    // ------------------------------------------------------------------------
    bindControls() {
      // Sliders numéricos y rangos
      const bindParam = (name, min, max, step, initial, isInt = false) => {
        const slider = this.getEl(`slider-${name}`);
        const input = this.getEl(`input-${name}`);

        const syncVal = (val) => {
          let num = isInt ? parseInt(val, 10) : parseFloat(val);
          if (isNaN(num)) return;
          num = Math.max(min, Math.min(max, num));
          if (slider) slider.value = num;
          if (input) input.value = isInt ? num : num.toFixed(step >= 0.01 ? 2 : 3);

          if (name === 'tension') {
            this.T = num;
            this.hangingMassKg = this.T / this.g;
            const hSlider = this.getEl('slider-hanging-mass');
            const hInput = this.getEl('input-hanging-mass');
            if (hSlider) hSlider.value = (this.hangingMassKg * 1000).toFixed(0);
            if (hInput) hInput.value = (this.hangingMassKg * 1000).toFixed(0);
          }
          if (name === 'density') this.mu = num;
          if (name === 'length') this.L = num;
          if (name === 'amplitude') this.A = num;
          if (name === 'harmonic') {
            this.n = num;
            this.updateHarmonicSteppers();
          }
          this.updatePhysics();
        };

        if (slider) {
          slider.addEventListener('input', (e) => syncVal(e.target.value));
        }
        if (input) {
          input.addEventListener('change', (e) => syncVal(e.target.value));
        }
      };

      bindParam('tension', 10, 400, 1, this.T);
      bindParam('density', 0.001, 0.08, 0.001, this.mu);
      bindParam('length', 0.5, 5.0, 0.1, this.L);
      bindParam('amplitude', 0.02, 0.40, 0.01, this.A);
      bindParam('harmonic', 1, 10, 1, this.n, true);

      // Slider de Masa Colgante para Experimento de Melde (en gramos)
      const massSlider = this.getEl('slider-hanging-mass');
      const massInput = this.getEl('input-hanging-mass');
      const syncHangingMass = (valGrams) => {
        const grams = Math.max(50, Math.min(40000, parseFloat(valGrams) || 1200));
        this.hangingMassKg = grams / 1000;
        this.T = this.hangingMassKg * this.g;
        if (massSlider) massSlider.value = grams;
        if (massInput) massInput.value = grams;

        const tSlider = this.getEl('slider-tension');
        const tInput = this.getEl('input-tension');
        if (tSlider) tSlider.value = this.T.toFixed(0);
        if (tInput) tInput.value = this.T.toFixed(1);

        this.updatePhysics();
      };

      if (massSlider) massSlider.addEventListener('input', (e) => syncHangingMass(e.target.value));
      if (massInput) massInput.addEventListener('change', (e) => syncHangingMass(e.target.value));

      // Toggle para activar el Modo Experimento de Melde
      const chkMelde = this.getEl('chk-melde-mode');
      if (chkMelde) {
        chkMelde.addEventListener('change', (e) => {
          this.isMeldeMode = e.target.checked;
          const box = this.getEl('melde-controls-box');
          if (box) box.style.display = this.isMeldeMode ? 'block' : 'none';
          this.updatePhysics();
        });
      }

      // Stepper de armónicos (botones directos 1..8)
      const stepperBtns = document.querySelectorAll(this.prefix ? `.${this.prefix}-harmonic-btn` : '.harmonic-btn');
      stepperBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = parseInt(btn.getAttribute('data-harmonic'), 10);
          if (!isNaN(mode)) {
            this.n = mode;
            const slider = this.getEl('slider-harmonic');
            const input = this.getEl('input-harmonic');
            if (slider) slider.value = mode;
            if (input) input.value = mode;
            this.updateHarmonicSteppers();
            this.updatePhysics();
          }
        });
      });

      // Transporte y Scrubber
      const btnPlay = this.getEl('btn-sw-play');
      if (btnPlay) {
        btnPlay.addEventListener('click', () => this.togglePlay());
      }

      const btnStepFwd = this.getEl('btn-sw-step-fwd');
      if (btnStepFwd) {
        btnStepFwd.addEventListener('click', () => {
          this.isPlaying = false;
          this.updatePlayBtnState();
          this.time += 0.02 * this.playbackSpeed;
        });
      }

      const btnStepBack = this.getEl('btn-sw-step-back');
      if (btnStepBack) {
        btnStepBack.addEventListener('click', () => {
          this.isPlaying = false;
          this.updatePlayBtnState();
          this.time = Math.max(0, this.time - 0.02 * this.playbackSpeed);
        });
      }

      const btnReset = this.getEl('btn-sw-reset');
      if (btnReset) {
        btnReset.addEventListener('click', () => {
          this.time = 0;
          this.scopeBuffer = [];
        });
      }

      // Controles de velocidad (Recomendadas y Personalizada)
      const speedSlider = this.getEl('slider-sw-speed');
      if (speedSlider) {
        speedSlider.addEventListener('input', (e) => this.setSpeed(e.target.value));
      }

      const speedInput = this.getEl('input-sw-speed');
      if (speedInput) {
        speedInput.addEventListener('input', (e) => this.setSpeed(e.target.value));
        speedInput.addEventListener('change', (e) => this.setSpeed(e.target.value));
      }

      const speedSelect = this.getEl('select-sw-speed');
      if (speedSelect) {
        speedSelect.addEventListener('change', (e) => this.setSpeed(e.target.value));
      }

      // Botones de velocidad recomendada
      const speedBtns = document.querySelectorAll(this.prefix ? `.${this.prefix}-speed-btn` : '.speed-btn');
      speedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const s = btn.getAttribute('data-speed');
          this.setSpeed(s);
        });
      });

      // Checkboxes visuales
      const bindCheck = (id, prop) => {
        const chk = this.getEl(id);
        if (chk) {
          chk.addEventListener('change', (e) => {
            this[prop] = e.target.checked;
          });
        }
      };

      bindCheck('chk-sw-nodes', 'showNodes');
      bindCheck('chk-sw-antinodes', 'showAntinodes');
      bindCheck('chk-sw-envelope', 'showEnvelope');
      bindCheck('chk-sw-traveling', 'showTravelingWaves');
      bindCheck('chk-sw-vectors', 'showVectors');
      bindCheck('chk-sw-grid', 'showGrid');
      bindCheck('chk-sw-energy', 'showEnergy');

      // Botón de Web Audio
      const btnAudio = this.getEl('btn-sw-audio');
      if (btnAudio) {
        btnAudio.addEventListener('click', () => {
          const active = this.audio.toggle();
          btnAudio.classList.toggle('primary', active);
          btnAudio.innerHTML = active
            ? `<i data-lucide="volume-2"></i><span>Sonido Activo</span>`
            : `<i data-lucide="volume-x"></i><span>Activar Audio</span>`;
          if (window.lucide) window.lucide.createIcons();
          if (active) this.audio.updateHarmonic(this.n, this.fn);
        });
      }

      const sliderVolume = this.getEl('slider-sw-volume');
      if (sliderVolume) {
        sliderVolume.addEventListener('input', (e) => {
          this.audio.setVolume(parseFloat(e.target.value) || 0.3);
        });
      }

      // Botón de Captura Gráfica PNG
      const btnSnapshot = this.getEl('btn-sw-snapshot');
      if (btnSnapshot) {
        btnSnapshot.addEventListener('click', () => this.takeSnapshot());
      }
      const btnHeaderSnapshot = this.getEl('btn-sw-header-snapshot');
      if (btnHeaderSnapshot) {
        btnHeaderSnapshot.addEventListener('click', () => this.takeSnapshot());
      }
    }

    bindKeyboard() {
      window.addEventListener('keydown', (e) => {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
          return;
        }

        // Si es embebido y no estamos en la página 16, no interceptar
        if (this.isEmbedded && window.notebookApp && window.notebookApp.currentPage !== 16) {
          return;
        }

        if (e.code === 'Space') {
          e.preventDefault();
          this.togglePlay();
        } else if (e.code === 'KeyR') {
          e.preventDefault();
          this.time = 0;
          this.scopeBuffer = [];
        } else if (e.code === 'KeyM') {
          e.preventDefault();
          const btnAudio = this.getEl('btn-sw-audio');
          if (btnAudio) btnAudio.click();
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          this.isPlaying = false;
          this.updatePlayBtnState();
          this.time += 0.02 * this.playbackSpeed;
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          this.isPlaying = false;
          this.updatePlayBtnState();
          this.time = Math.max(0, this.time - 0.02 * this.playbackSpeed);
        } else if (e.key >= '1' && e.key <= '9') {
          const mode = parseInt(e.key, 10);
          this.n = mode;
          const slider = this.getEl('slider-harmonic');
          const input = this.getEl('input-harmonic');
          if (slider) slider.value = mode;
          if (input) input.value = mode;
          this.updateHarmonicSteppers();
          this.updatePhysics();
        }
      });
    }

    takeSnapshot() {
      if (!this.canvas) return;
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = this.canvas.width;
      exportCanvas.height = this.canvas.height;
      const eCtx = exportCanvas.getContext('2d');

      // Copiar contenido del lienzo
      eCtx.drawImage(this.canvas, 0, 0);

      // Membrete estético institucional
      const dpr = window.devicePixelRatio || 1;
      eCtx.save();
      eCtx.scale(dpr, dpr);
      const cardW = 450;
      const cardH = 56;
      eCtx.fillStyle = 'rgba(6, 9, 17, 0.92)';
      eCtx.fillRect(16, 16, cardW, cardH);
      eCtx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
      eCtx.lineWidth = 1.5;
      eCtx.strokeRect(16, 16, cardW, cardH);

      eCtx.fillStyle = '#f8fafc';
      eCtx.font = 'bold 12px "Cinzel", Georgia, serif';
      eCtx.fillText(`ONDAS ESTACIONARIAS • MODO ARMÓNICO n = ${this.n}`, 28, 36);

      eCtx.fillStyle = '#38bdf8';
      eCtx.font = '10px "JetBrains Mono", monospace';
      eCtx.fillText(`f_${this.n} = ${this.fn.toFixed(2)} Hz | v = ${this.v.toFixed(1)} m/s | T = ${this.T.toFixed(1)} N | L = ${this.L.toFixed(1)} m`, 28, 54);
      eCtx.restore();

      const link = document.createElement('a');
      link.download = `onda_estacionaria_armonico_n${this.n}_${Date.now()}.png`;
      link.href = exportCanvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    updateHarmonicSteppers() {
      const stepperBtns = document.querySelectorAll(this.prefix ? `.${this.prefix}-harmonic-btn` : '.harmonic-btn');
      stepperBtns.forEach(btn => {
        const mode = parseInt(btn.getAttribute('data-harmonic'), 10);
        btn.classList.toggle('active', mode === this.n);
      });
    }

    togglePlay() {
      this.isPlaying = !this.isPlaying;
      this.updatePlayBtnState();
    }

    updatePlayBtnState() {
      const btnPlay = this.getEl('btn-sw-play');
      if (!btnPlay) return;
      btnPlay.classList.toggle('paused', !this.isPlaying);
      btnPlay.innerHTML = this.isPlaying
        ? `<i data-lucide="pause"></i><span>Pausar</span>`
        : `<i data-lucide="play"></i><span>Reanudar</span>`;
      if (window.lucide) window.lucide.createIcons();
    }

    // ------------------------------------------------------------------------
    // PRESETS DIDÁCTICOS (GUITARRA, VIOLÍN, MELDE, ETC.)
    // ------------------------------------------------------------------------
    bindPresets() {
      const presetButtons = document.querySelectorAll(this.prefix ? `.${this.prefix}-preset-pill` : '.preset-pill');
      presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          presetButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const type = btn.getAttribute('data-preset');
          this.applyPreset(type);
        });
      });
    }

    applyPreset(type) {
      if (type === 'guitar-e4') {
        // Cuerda 1 de Guitarra (Mi agudo ~330 Hz, n=1)
        this.T = 72.0;
        this.mu = 0.00045;
        this.L = 0.65;
        this.A = 0.08;
        this.n = 1;
        this.isMeldeMode = false;
      } else if (type === 'guitar-e2') {
        // Cuerda 6 de Guitarra (Mi grave ~82 Hz, n=1)
        this.T = 65.0;
        this.mu = 0.0068;
        this.L = 0.65;
        this.A = 0.12;
        this.n = 1;
        this.isMeldeMode = false;
      } else if (type === 'violin-a4') {
        // Cuerda La de Violín (440 Hz, n=1)
        this.T = 55.0;
        this.mu = 0.00065;
        this.L = 0.33;
        this.A = 0.06;
        this.n = 1;
        this.isMeldeMode = false;
      } else if (type === 'melde-lab') {
        // Experimento de Melde en laboratorio universitario (f = 60 Hz)
        this.isMeldeMode = true;
        this.mu = 0.0035;
        this.L = 1.50;
        this.n = 2; // Segundo armónico
        this.hangingMassKg = 0.850; // 850 gramos
        this.T = this.hangingMassKg * this.g;
        this.A = 0.12;
      } else if (type === 'harmonic-1') {
        this.T = 120.0;
        this.mu = 0.010;
        this.L = 2.0;
        this.A = 0.18;
        this.n = 1;
        this.isMeldeMode = false;
      } else if (type === 'harmonic-2') {
        this.T = 120.0;
        this.mu = 0.010;
        this.L = 2.0;
        this.A = 0.16;
        this.n = 2;
        this.isMeldeMode = false;
      } else if (type === 'harmonic-3') {
        this.T = 120.0;
        this.mu = 0.010;
        this.L = 2.0;
        this.A = 0.14;
        this.n = 3;
        this.isMeldeMode = false;
      } else if (type === 'harmonic-4') {
        this.T = 120.0;
        this.mu = 0.010;
        this.L = 2.0;
        this.A = 0.12;
        this.n = 4;
        this.isMeldeMode = false;
      } else if (type === 'harmonic-5') {
        this.T = 120.0;
        this.mu = 0.010;
        this.L = 2.0;
        this.A = 0.10;
        this.n = 5;
        this.isMeldeMode = false;
      }

      // Sincronizar inputs
      const syncInput = (name, val, isInt = false) => {
        const slider = this.getEl(`slider-${name}`);
        const input = this.getEl(`input-${name}`);
        if (slider) slider.value = val;
        if (input) input.value = isInt ? val : Number(val).toFixed(3);
      };

      syncInput('tension', this.T);
      syncInput('density', this.mu);
      syncInput('length', this.L);
      syncInput('amplitude', this.A);
      syncInput('harmonic', this.n, true);

      const chkMelde = this.getEl('chk-melde-mode');
      if (chkMelde) chkMelde.checked = this.isMeldeMode;
      const box = this.getEl('melde-controls-box');
      if (box) box.style.display = this.isMeldeMode ? 'block' : 'none';

      this.updateHarmonicSteppers();
      this.updatePhysics();
    }

    // ------------------------------------------------------------------------
    // GESTIÓN DE MODALES (TEORÍA, GUÍA, RETOS)
    // ------------------------------------------------------------------------
    bindModals() {
      const openModal = (id) => {
        const modal = this.getEl(id) || document.getElementById(id);
        if (modal) modal.classList.add('active');
      };

      const closeModal = (modal) => {
        if (modal) modal.classList.remove('active');
      };

      // Abrir botones
      this.getEl('btn-open-theory')?.addEventListener('click', () => openModal('sw-modal-theory'));
      this.getEl('btn-open-guide')?.addEventListener('click', () => openModal('sw-modal-guide'));
      this.getEl('btn-open-solver')?.addEventListener('click', () => openModal('sw-modal-solver'));

      // Cerrar botones
      document.querySelectorAll('.sw-modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const backdrop = btn.closest('.sw-modal-backdrop');
          closeModal(backdrop);
        });
      });

      // Clic fuera del contenido
      document.querySelectorAll('.sw-modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) closeModal(backdrop);
        });
      });
    }

    // ------------------------------------------------------------------------
    // EVENTOS DEL CANVAS (SONDA Y PUNTEO DE LA CUERDA / PLUCK)
    // ------------------------------------------------------------------------
    bindCanvasEvents() {
      if (!this.canvas) return;

      const getCoords = (clientX, clientY) => {
        const rect = this.canvas.getBoundingClientRect();
        const px = clientX - rect.left;
        const py = clientY - rect.top;
        const paddingLeft = 54;
        const paddingRight = 54;
        const usefulWidth = rect.width - paddingLeft - paddingRight;

        const clampedPx = Math.max(paddingLeft, Math.min(rect.width - paddingRight, px));
        const xMeters = ((clampedPx - paddingLeft) / usefulWidth) * this.L;
        const centerY = rect.height / 2;
        const maxVisualAmp = rect.height * 0.36;
        const scaleY = maxVisualAmp / Math.max(0.2, this.A * 1.25);
        const yDisplMeters = -(py - centerY) / scaleY;

        return { px, py, xMeters, yDisplMeters, rect };
      };

      const handleMove = (clientX, clientY) => {
        const coords = getCoords(clientX, clientY);
        const { px, py, xMeters, yDisplMeters } = coords;

        if (this.isPlucking) {
          this.pluckX = xMeters;
          this.pluckY = Math.max(-this.A * 1.5, Math.min(this.A * 1.5, yDisplMeters));
          this.mousePos = { xMeters, px, py };
          this.updateProbeHUD(xMeters);
          return;
        }

        if (px >= 54 && px <= coords.rect.width - 54) {
          this.mousePos = { xMeters, px, py };
          this.probeX = xMeters;
          this.isHoveringCanvas = true;
          this.updateProbeHUD(xMeters);
        } else {
          this.isHoveringCanvas = false;
        }
      };

      const handleStart = (clientX, clientY) => {
        const coords = getCoords(clientX, clientY);
        if (coords.px >= 54 && coords.px <= coords.rect.width - 54) {
          this.isPlucking = true;
          this.pluckX = coords.xMeters;
          this.pluckY = coords.yDisplMeters;
          this.probeX = coords.xMeters;
        }
      };

      const handleEnd = () => {
        if (this.isPlucking) {
          this.isPlucking = false;
          this.time = 0; // Se reinicia en fase para la onda
          if (this.audio && this.audio.isEnabled) {
            this.audio.updateHarmonic(this.n, this.fn);
          }
        }
      };

      this.canvas.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY));
      window.addEventListener('mouseup', handleEnd);
      this.canvas.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
      this.canvas.addEventListener('mouseenter', () => { this.isHoveringCanvas = true; });
      this.canvas.addEventListener('mouseleave', () => {
        if (!this.isPlucking) {
          this.isHoveringCanvas = false;
          const hud = this.getEl('sw-canvas-probe');
          if (hud) hud.style.display = 'none';
        }
      });

      // Eventos táctiles
      this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      this.canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
          handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      window.addEventListener('touchend', handleEnd);
    }

    updateProbeHUD(x) {
      const hud = this.getEl('sw-canvas-probe');
      if (!hud) return;

      hud.style.display = 'flex';

      // Cálculo del estado instantáneo en x
      const y = this.A * Math.sin(this.k * x) * Math.cos(this.omega * this.time);
      const vy = -this.omega * this.A * Math.sin(this.k * x) * Math.sin(this.omega * this.time);
      const ay = -Math.pow(this.omega, 2) * y;

      const nodeStep = this.L / this.n;
      const distToNearestNode = Math.abs(x % nodeStep);
      let pointType = 'Punto General';
      if (distToNearestNode < 0.03 || Math.abs(distToNearestNode - nodeStep) < 0.03) {
        pointType = '📍 Nodo (y = 0)';
      } else if (Math.abs(distToNearestNode - nodeStep / 2) < 0.04) {
        pointType = '⚡ Vientre / Antinodo';
      }

      hud.innerHTML = `
        <div><span class="probe-item-title">x:</span> ${x.toFixed(3)} m (${pointType})</div>
        <div><span class="probe-item-title">y(t):</span> ${(y * 100).toFixed(2)} cm</div>
        <div><span class="probe-item-title">v_y:</span> ${vy.toFixed(2)} m/s</div>
        <div><span class="probe-item-title">a_y:</span> ${ay.toFixed(1)} m/s²</div>
      `;
    }

    resizeCanvas() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.width = rect.width;
      this.height = rect.height;

      this.canvas.width = Math.floor(rect.width * dpr);
      this.canvas.height = Math.floor(rect.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Redimensionar canvas de osciloscopio si existe
      if (this.scopeCanvas) {
        const sRect = this.scopeCanvas.getBoundingClientRect();
        this.scopeWidth = sRect.width;
        this.scopeHeight = sRect.height;
        this.scopeCanvas.width = Math.floor(sRect.width * dpr);
        this.scopeCanvas.height = Math.floor(sRect.height * dpr);
        if (this.scopeCtx) this.scopeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }

    // ------------------------------------------------------------------------
    // BUCLE DE RENDERIZADO 60 FPS
    // ------------------------------------------------------------------------
    loop(timestamp) {
      const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
      this.lastTimestamp = timestamp;

      if (this.isPlaying && !this.isPlucking) {
        this.time += dt * this.playbackSpeed;
      }

      this.render();
      this.updateEnergyBar();
      this.renderScope();

      // Scrubber visual
      const scrubber = this.getEl('sw-time-scrubber');
      const timeTxt = this.getEl('sw-time-display');
      if (scrubber && timeTxt) {
        timeTxt.textContent = `t = ${this.time.toFixed(2)} s`;
        scrubber.value = (this.time % 10).toFixed(2);
      }

      this.animFrameId = requestAnimationFrame(this.loop);
    }

    updateEnergyBar() {
      const sinVal = Math.sin(this.omega * this.time);
      const cosVal = Math.cos(this.omega * this.time);
      const fracK = Math.pow(sinVal, 2);
      const fracP = Math.pow(cosVal, 2);

      const barK = this.getEl('sw-bar-kinetic');
      const barP = this.getEl('sw-bar-potential');
      const txtK = this.getEl('sw-energy-k-val');
      const txtP = this.getEl('sw-energy-p-val');

      if (barK) barK.style.width = `${(fracK * 100).toFixed(1)}%`;
      if (barP) barP.style.width = `${(fracP * 100).toFixed(1)}%`;

      if (txtK) txtK.textContent = `${(this.totalEnergy * fracK).toFixed(3)} J (${(fracK * 100).toFixed(0)}%)`;
      if (txtP) txtP.textContent = `${(this.totalEnergy * fracP).toFixed(3)} J (${(fracP * 100).toFixed(0)}%)`;
    }

    // ------------------------------------------------------------------------
    // RENDERIZADO DEL OSCILOSCOPIO y(t) EN TIEMPO REAL
    // ------------------------------------------------------------------------
    renderScope() {
      if (!this.scopeCtx || !this.scopeCanvas) return;
      const sCtx = this.scopeCtx;
      const sw = this.scopeWidth || this.scopeCanvas.width;
      const sh = this.scopeHeight || this.scopeCanvas.height;
      const centerY = sh / 2;

      // Calcular elongación en el punto sonda probeX
      const curY = this.isPlucking
        ? (this.probeX <= this.pluckX ? this.pluckY * (this.probeX / this.pluckX) : this.pluckY * ((this.L - this.probeX) / (this.L - this.pluckX)))
        : this.A * Math.sin(this.k * this.probeX) * Math.cos(this.omega * this.time);

      this.scopeBuffer.push(curY);
      if (this.scopeBuffer.length > this.scopeMaxPoints) {
        this.scopeBuffer.shift();
      }

      // 1. Fondo del osciloscopio
      sCtx.fillStyle = '#050811';
      sCtx.fillRect(0, 0, sw, sh);

      // 2. Cuadrícula verde reticulada
      sCtx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
      sCtx.lineWidth = 1;
      for (let x = 0; x < sw; x += 25) {
        sCtx.beginPath();
        sCtx.moveTo(x, 0);
        sCtx.lineTo(x, sh);
        sCtx.stroke();
      }
      for (let y = 0; y < sh; y += 20) {
        sCtx.beginPath();
        sCtx.moveTo(0, y);
        sCtx.lineTo(sw, y);
        sCtx.stroke();
      }

      // Eje central de cero y = 0
      sCtx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      sCtx.setLineDash([3, 3]);
      sCtx.beginPath();
      sCtx.moveTo(0, centerY);
      sCtx.lineTo(sw, centerY);
      sCtx.stroke();
      sCtx.setLineDash([]);

      // 3. Trazo continuo de oscilación
      if (this.scopeBuffer.length > 1) {
        const scopeScaleY = (sh * 0.42) / Math.max(0.1, this.A);
        const dx = sw / this.scopeMaxPoints;

        sCtx.shadowColor = '#10b981';
        sCtx.shadowBlur = 8;
        sCtx.strokeStyle = '#34d399';
        sCtx.lineWidth = 2.2;
        sCtx.beginPath();

        for (let i = 0; i < this.scopeBuffer.length; i++) {
          const px = i * dx;
          const py = centerY - this.scopeBuffer[i] * scopeScaleY;
          if (i === 0) sCtx.moveTo(px, py);
          else sCtx.lineTo(px, py);
        }
        sCtx.stroke();
        sCtx.shadowBlur = 0;
      }

      // Etiqueta flotante del osciloscopio
      sCtx.fillStyle = '#38bdf8';
      sCtx.font = 'bold 9px "JetBrains Mono", monospace';
      sCtx.fillText(`SONDA x = ${this.probeX.toFixed(2)}m | y(t) = ${(curY * 100).toFixed(1)} cm`, 8, 12);
    }

    // ------------------------------------------------------------------------
    // RENDERIZADO GRÁFICO EN CANVAS
    // ------------------------------------------------------------------------
    render() {
      if (!this.ctx || !this.width || !this.height) return;
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      const centerY = h / 2;

      ctx.clearRect(0, 0, w, h);

      // 1. Fondo degradado de alta precisión científica
      const gradBg = ctx.createLinearGradient(0, 0, 0, h);
      gradBg.addColorStop(0, '#0a0f1d');
      gradBg.addColorStop(0.5, '#060911');
      gradBg.addColorStop(1, '#080d19');
      ctx.fillStyle = gradBg;
      ctx.fillRect(0, 0, w, h);

      // Márgenes de sujeción fija
      const padX = 54;
      const stringWidth = w - padX * 2;
      const scaleX = stringWidth / this.L;

      // Escala vertical: La amplitud máxima ocupa proporcionalmente la altura
      const maxVisualAmp = h * 0.36;
      const scaleY = maxVisualAmp / Math.max(0.2, this.A * 1.25);

      // 2. Cuadrícula métrica milimetrada
      if (this.showGrid) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
        ctx.lineWidth = 1;

        const meterStep = this.L <= 1.5 ? 0.25 : 0.5;
        for (let xm = 0; xm <= this.L + 0.001; xm += meterStep) {
          const px = padX + xm * scaleX;
          ctx.beginPath();
          ctx.moveTo(px, 20);
          ctx.lineTo(px, h - 20);
          ctx.stroke();

          ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${xm.toFixed(2)}m`, px, h - 8);
        }

        // Línea horizontal de equilibrio y = 0
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.25)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padX - 10, centerY);
        ctx.lineTo(w - padX + 10, centerY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. Envolvente espacial de amplitud: ±A(x) = ±A * sin(k*x)
      if (this.showEnvelope && !this.isPlucking) {
        ctx.fillStyle = 'rgba(139, 92, 246, 0.06)';
        ctx.beginPath();
        ctx.moveTo(padX, centerY);
        for (let i = 0; i <= 200; i++) {
          const x = (i / 200) * this.L;
          const px = padX + x * scaleX;
          const envY = this.A * Math.sin(this.k * x) * scaleY;
          ctx.lineTo(px, centerY - envY);
        }
        for (let i = 200; i >= 0; i--) {
          const x = (i / 200) * this.L;
          const px = padX + x * scaleX;
          const envY = this.A * Math.sin(this.k * x) * scaleY;
          ctx.lineTo(px, centerY + envY);
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 5]);

        // Envolvente superior +A(x)
        ctx.beginPath();
        for (let i = 0; i <= 200; i++) {
          const x = (i / 200) * this.L;
          const px = padX + x * scaleX;
          const envY = this.A * Math.sin(this.k * x) * scaleY;
          if (i === 0) ctx.moveTo(px, centerY - envY);
          else ctx.lineTo(px, centerY - envY);
        }
        ctx.stroke();

        // Envolvente inferior -A(x)
        ctx.beginPath();
        for (let i = 0; i <= 200; i++) {
          const x = (i / 200) * this.L;
          const px = padX + x * scaleX;
          const envY = this.A * Math.sin(this.k * x) * scaleY;
          if (i === 0) ctx.moveTo(px, centerY + envY);
          else ctx.lineTo(px, centerY + envY);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 4. Descomposición en ondas viajeras componentes (y1: +x, y2: -x)
      if (this.showTravelingWaves && !this.isPlucking) {
        const halfAmp = (this.A / 2) * scaleY;

        // Onda 1 (incidente, viaja a la derecha +x)
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let i = 0; i <= 150; i++) {
          const x = (i / 150) * this.L;
          const px = padX + x * scaleX;
          const py = centerY - halfAmp * Math.sin(this.k * x - this.omega * this.time);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Onda 2 (reflejada, viaja a la izquierda -x)
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
        ctx.beginPath();
        for (let i = 0; i <= 150; i++) {
          const x = (i / 150) * this.L;
          const px = padX + x * scaleX;
          const py = centerY - halfAmp * Math.sin(this.k * x + this.omega * this.time);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 5. Cuerda principal en vibración o punteo (Pluck)
      const numSegments = 240;
      const cosTime = Math.cos(this.omega * this.time);
      const points = [];

      for (let i = 0; i <= numSegments; i++) {
        const x = (i / numSegments) * this.L;
        const px = padX + x * scaleX;
        let y = 0;

        if (this.isPlucking) {
          // Perfil triangular de deformación por punteo
          if (x <= this.pluckX) {
            y = this.pluckY * (x / this.pluckX);
          } else {
            y = this.pluckY * ((this.L - x) / (this.L - this.pluckX));
          }
        } else {
          y = this.A * Math.sin(this.k * x) * cosTime;
        }

        const py = centerY - y * scaleY;
        points.push({ x, px, py, y });
      }

      // Sombra proyectada resplandeciente (Glow)
      ctx.shadowColor = 'rgba(168, 85, 247, 0.7)';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = this.isPlucking ? '#f59e0b' : '#c084fc';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].px, points[i].py);
        else ctx.lineTo(points[i].px, points[i].py);
      }
      ctx.stroke();

      // Trazo interior brillante (núcleo blanco/oro)
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].px, points[i].py);
        else ctx.lineTo(points[i].px, points[i].py);
      }
      ctx.stroke();

      // Indicador visual de Punteo Activo (Pluck)
      if (this.isPlucking && this.pluckX !== null) {
        const pluckPx = padX + this.pluckX * scaleX;
        const pluckPy = centerY - this.pluckY * scaleY;

        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(pluckPx, pluckPy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`⚡ PUNTEO ELÁSTICO ACTIVO: x = ${this.pluckX.toFixed(2)} m (Suelta para liberar la onda)`, w / 2, 38);
      }

      // 6. Vectores cinemáticos (Velocidad transversal vy y Aceleración ay)
      if (this.showVectors && !this.isPlucking) {
        const sampleCount = Math.max(8, this.n * 4);
        const sinTime = Math.sin(this.omega * this.time);

        for (let s = 1; s < sampleCount; s++) {
          const x = (s / sampleCount) * this.L;
          const px = padX + x * scaleX;
          const y = this.A * Math.sin(this.k * x) * cosTime;
          const py = centerY - y * scaleY;

          const vy = -this.omega * this.A * Math.sin(this.k * x) * sinTime;
          const vScale = 0.05 * scaleY;
          const vyPx = vy * vScale;

          if (Math.abs(vyPx) > 2) {
            ctx.strokeStyle = '#10b981';
            ctx.fillStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px, py - vyPx);
            ctx.stroke();

            const arrowHead = vyPx > 0 ? -4 : 4;
            ctx.beginPath();
            ctx.moveTo(px - 3, py - vyPx - arrowHead);
            ctx.lineTo(px, py - vyPx);
            ctx.lineTo(px + 3, py - vyPx - arrowHead);
            ctx.fill();
          }

          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 7. Soportes mecánicos fijos en los extremos o Polea de Melde
      const drawClamp = (xPos, isLeft) => {
        const clampW = 16;
        const clampH = 70;
        const leftX = isLeft ? xPos - clampW : xPos;

        const gradMetal = ctx.createLinearGradient(leftX, 0, leftX + clampW, 0);
        gradMetal.addColorStop(0, '#334155');
        gradMetal.addColorStop(0.5, '#64748b');
        gradMetal.addColorStop(1, '#1e293b');
        ctx.fillStyle = gradMetal;
        ctx.fillRect(leftX, centerY - clampH / 2, clampW, clampH);

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.strokeRect(leftX, centerY - clampH / 2, clampW, clampH);

        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(leftX + clampW / 2, centerY - clampH / 2 + 10, 3, 0, Math.PI * 2);
        ctx.arc(leftX + clampW / 2, centerY + clampH / 2 - 10, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = isLeft ? 'right' : 'left';
        ctx.fillText(isLeft ? 'x=0 (Fijo)' : `x=L (Fijo)`, isLeft ? leftX - 6 : leftX + clampW + 6, centerY + 3);
      };

      // Extremo izquierdo fijo siempre
      drawClamp(padX, true);

      // Extremo derecho: ¿Abrazadera fija o Polea del Experimento de Melde?
      if (!this.isMeldeMode) {
        drawClamp(padX + stringWidth, false);
      } else {
        // MONTAJE VIRTUAL DE LA POLEA DE MELDE
        const rightX = padX + stringWidth;
        const pulleyR = 18;

        // Soporte de la polea
        ctx.fillStyle = '#475569';
        ctx.fillRect(rightX + pulleyR - 4, centerY, 8, 90);
        ctx.strokeStyle = '#94a3b8';
        ctx.strokeRect(rightX + pulleyR - 4, centerY, 8, 90);

        // Rueda de la polea metálica/bronce
        const gradPulley = ctx.createRadialGradient(rightX + pulleyR, centerY, 3, rightX + pulleyR, centerY, pulleyR);
        gradPulley.addColorStop(0, '#fef08a');
        gradPulley.addColorStop(0.7, '#d97706');
        gradPulley.addColorStop(1, '#78350f');
        ctx.fillStyle = gradPulley;
        ctx.beginPath();
        ctx.arc(rightX + pulleyR, centerY, pulleyR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef3c7';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Eje central
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(rightX + pulleyR, centerY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Cuerda doblando 90° hacia abajo
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(rightX + pulleyR, centerY, pulleyR - 2, Math.PI, Math.PI / 2, true);
        ctx.lineTo(rightX + pulleyR * 2 - 2, centerY + 70);
        ctx.stroke();

        // Portapesas con masa colgante (m)
        const massY = centerY + 70;
        const massX = rightX + pulleyR * 2 - 2;

        // Gancho
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(massX, massY + 4, 4, Math.PI, 0);
        ctx.lineTo(massX, massY + 12);
        ctx.stroke();

        // Pesa cilíndrica ranurada
        const gradWeight = ctx.createLinearGradient(massX - 12, 0, massX + 12, 0);
        gradWeight.addColorStop(0, '#d97706');
        gradWeight.addColorStop(0.5, '#fde68a');
        gradWeight.addColorStop(1, '#92400e');
        ctx.fillStyle = gradWeight;
        ctx.fillRect(massX - 12, massY + 12, 24, 28);
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1;
        ctx.strokeRect(massX - 12, massY + 12, 24, 28);

        // Texto de masa y tensión en la polea
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Polea Melde (x=L)`, rightX + pulleyR * 2 + 8, centerY - 4);
        ctx.fillText(`m = ${(this.hangingMassKg * 1000).toFixed(0)}g`, rightX + pulleyR * 2 + 8, massY + 22);
        ctx.fillText(`T = mg = ${this.T.toFixed(1)}N`, rightX + pulleyR * 2 + 8, massY + 36);
      }

      // 8. Marcadores de NODOS (N0, N1, ..., Nn)
      if (this.showNodes && !this.isPlucking) {
        for (let m = 0; m <= this.n; m++) {
          const nodeX = m * (this.L / this.n);
          const px = padX + nodeX * scaleX;

          ctx.fillStyle = '#f43f5e';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, centerY, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#fca5a5';
          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`N${m}`, px, centerY + 18);
        }
      }

      // 9. Marcadores de ANTINODOS / VIENTRES (A1, A2, ..., An)
      if (this.showAntinodes && !this.isPlucking) {
        for (let m = 0; m < this.n; m++) {
          const antinodeX = ((2 * m + 1) / (2 * this.n)) * this.L;
          const px = padX + antinodeX * scaleX;

          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(px, centerY - this.A * scaleY, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`A${m + 1}`, px, centerY - this.A * scaleY - 8);
        }
      }

      // 10. Sonda interactiva sobre el lienzo (Laser sight)
      if (this.isHoveringCanvas && this.mousePos) {
        const { xMeters, px } = this.mousePos;
        const curY = this.isPlucking ? this.pluckY : this.A * Math.sin(this.k * xMeters) * cosTime;
        const py = centerY - curY * scaleY;

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(px, 20);
        ctx.lineTo(px, h - 20);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // ------------------------------------------------------------------------
    // SOLVER NUMÉRICO INTERACTIVO PASO A PASO
    // ------------------------------------------------------------------------
    initSolver() {
      const selectTarget = this.getEl('solver-target') || document.getElementById('solver-target');
      const inputsGrid = this.getEl('solver-inputs-grid') || document.getElementById('solver-inputs-grid');
      const btnCalc = this.getEl('btn-calc-solver') || document.getElementById('btn-calc-solver');
      const resultBox = this.getEl('solver-result-box') || document.getElementById('solver-result-box');
      const btnApply = this.getEl('btn-apply-solver-to-sim') || document.getElementById('btn-apply-solver-to-sim');

      if (!selectTarget || !inputsGrid || !btnCalc) return;

      const renderInputs = () => {
        const target = selectTarget.value;
        let html = '';

        if (target !== 'n') {
          html += `
            <div class="sw-param-group">
              <label class="sw-param-name">Armónico (n):</label>
              <input type="number" id="sol-input-n" class="sw-param-val-input" style="width:100%; text-align:left;" min="1" max="10" step="1" value="${this.n}">
            </div>
          `;
        }
        if (target !== 'L') {
          html += `
            <div class="sw-param-group">
              <label class="sw-param-name">Longitud (L, en m):</label>
              <input type="number" id="sol-input-L" class="sw-param-val-input" style="width:100%; text-align:left;" min="0.1" max="10" step="0.1" value="${this.L}">
            </div>
          `;
        }
        if (target !== 'T' && target !== 'v') {
          html += `
            <div class="sw-param-group">
              <label class="sw-param-name">Tensión (T, en N):</label>
              <input type="number" id="sol-input-T" class="sw-param-val-input" style="width:100%; text-align:left;" min="1" max="1000" step="1" value="${this.T.toFixed(1)}">
            </div>
          `;
        }
        if (target !== 'mu' && target !== 'v') {
          html += `
            <div class="sw-param-group">
              <label class="sw-param-name">Densidad lineal (μ, en kg/m):</label>
              <input type="number" id="sol-input-mu" class="sw-param-val-input" style="width:100%; text-align:left;" min="0.0001" max="1" step="0.001" value="${this.mu}">
            </div>
          `;
        }
        if (target === 'T' || target === 'mu' || target === 'L') {
          html += `
            <div class="sw-param-group">
              <label class="sw-param-name">Frecuencia del Armónico (f_n, en Hz):</label>
              <input type="number" id="sol-input-fn" class="sw-param-val-input" style="width:100%; text-align:left;" min="0.1" max="5000" step="0.1" value="${this.fn.toFixed(2)}">
            </div>
          `;
        }
        if (target === 'v') {
          html += `
            <div class="sw-param-group">
              <label class="sw-param-name">Tensión (T, en N):</label>
              <input type="number" id="sol-input-T" class="sw-param-val-input" style="width:100%; text-align:left;" min="1" max="1000" step="1" value="${this.T.toFixed(1)}">
            </div>
            <div class="sw-param-group">
              <label class="sw-param-name">Densidad lineal (μ, en kg/m):</label>
              <input type="number" id="sol-input-mu" class="sw-param-val-input" style="width:100%; text-align:left;" min="0.0001" max="1" step="0.001" value="${this.mu}">
            </div>
          `;
        }

        inputsGrid.innerHTML = html;
        if (resultBox) resultBox.style.display = 'none';
      };

      selectTarget.addEventListener('change', renderInputs);
      renderInputs();

      let lastSolution = null;

      btnCalc.addEventListener('click', () => {
        const target = selectTarget.value;
        const nVal = parseFloat(document.getElementById('sol-input-n')?.value) || 1;
        const LVal = parseFloat(document.getElementById('sol-input-L')?.value) || 2.0;
        const TVal = parseFloat(document.getElementById('sol-input-T')?.value) || 120.0;
        const muVal = parseFloat(document.getElementById('sol-input-mu')?.value) || 0.010;
        const fnVal = parseFloat(document.getElementById('sol-input-fn')?.value) || 27.39;

        const formulaEl = document.getElementById('solver-step-formula');
        const substEl = document.getElementById('solver-step-subst');
        const resEl = document.getElementById('solver-step-result');

        if (target === 'fn') {
          const v = Math.sqrt(TVal / muVal);
          const fn = (nVal / (2 * LVal)) * v;
          lastSolution = { n: nVal, L: LVal, T: TVal, mu: muVal, fn };
          if (formulaEl) formulaEl.textContent = `Paso 1: f_n = (n / 2L) * √(T / μ)`;
          if (substEl) substEl.textContent = `Paso 2: f_{${nVal}} = (${nVal} / (2 * ${LVal})) * √(${TVal} / ${muVal}) = (${(nVal/(2*LVal)).toFixed(3)}) * ${v.toFixed(2)}`;
          if (resEl) resEl.textContent = `Resultado: f_{${nVal}} = ${fn.toFixed(3)} Hz`;
        } else if (target === 'T') {
          const T = muVal * Math.pow((2 * LVal * fnVal) / nVal, 2);
          lastSolution = { n: nVal, L: LVal, T, mu: muVal, fn: fnVal };
          if (formulaEl) formulaEl.textContent = `Paso 1: T = μ * [ (2 * L * f_n) / n ]²`;
          if (substEl) substEl.textContent = `Paso 2: T = ${muVal} * [ (2 * ${LVal} * ${fnVal}) / ${nVal} ]²`;
          if (resEl) resEl.textContent = `Resultado: Tensión T = ${T.toFixed(3)} N`;
        } else if (target === 'mu') {
          const v = (2 * LVal * fnVal) / nVal;
          const mu = TVal / Math.pow(v, 2);
          lastSolution = { n: nVal, L: LVal, T: TVal, mu, fn: fnVal };
          if (formulaEl) formulaEl.textContent = `Paso 1: μ = T / v² = T / [ (2 * L * f_n) / n ]²`;
          if (substEl) substEl.textContent = `Paso 2: μ = ${TVal} / [ (2 * ${LVal} * ${fnVal}) / ${nVal} ]²`;
          if (resEl) resEl.textContent = `Resultado: Densidad lineal μ = ${mu.toFixed(5)} kg/m (${(mu*1000).toFixed(2)} g/m)`;
        } else if (target === 'L') {
          const v = Math.sqrt(TVal / muVal);
          const L = (nVal * v) / (2 * fnVal);
          lastSolution = { n: nVal, L, T: TVal, mu: muVal, fn: fnVal };
          if (formulaEl) formulaEl.textContent = `Paso 1: L = (n * v) / (2 * f_n) = [ n * √(T / μ) ] / (2 * f_n)`;
          if (substEl) substEl.textContent = `Paso 2: L = [ ${nVal} * √(${TVal} / ${muVal}) ] / (2 * ${fnVal}) = [ ${nVal} * ${v.toFixed(2)} ] / ${(2*fnVal).toFixed(2)}`;
          if (resEl) resEl.textContent = `Resultado: Longitud L = ${L.toFixed(3)} m`;
        } else if (target === 'v') {
          const v = Math.sqrt(TVal / muVal);
          lastSolution = { T: TVal, mu: muVal, v };
          if (formulaEl) formulaEl.textContent = `Paso 1: v = √(T / μ)`;
          if (substEl) substEl.textContent = `Paso 2: v = √(${TVal} / ${muVal})`;
          if (resEl) resEl.textContent = `Resultado: Rapidez v = ${v.toFixed(3)} m/s`;
        }

        if (resultBox) resultBox.style.display = 'block';
      });

      if (btnApply) {
        btnApply.addEventListener('click', () => {
          if (!lastSolution) return;
          if (lastSolution.T !== undefined) this.T = lastSolution.T;
          if (lastSolution.mu !== undefined) this.mu = lastSolution.mu;
          if (lastSolution.L !== undefined) this.L = lastSolution.L;
          if (lastSolution.n !== undefined) this.n = lastSolution.n;

          const syncInput = (name, val, isInt = false) => {
            const slider = this.getEl(`slider-${name}`);
            const input = this.getEl(`input-${name}`);
            if (slider) slider.value = val;
            if (input) input.value = isInt ? val : Number(val).toFixed(3);
          };

          syncInput('tension', this.T);
          syncInput('density', this.mu);
          syncInput('length', this.L);
          syncInput('harmonic', this.n, true);

          this.updateHarmonicSteppers();
          this.updatePhysics();

          // Cerrar modal
          const modal = btnApply.closest('.sw-modal-backdrop');
          if (modal) modal.classList.remove('active');
        });
      }
    }

    // ------------------------------------------------------------------------
    // SUITE DE RETOS EXPERIMENTALES AUTOEVALUABLES
    // ------------------------------------------------------------------------
    initChallenges() {
      const bindQ = (btnId, inputId, feedId, expected, tol = 0.04, explain = '') => {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        const feed = document.getElementById(feedId);
        if (!btn || !input || !feed) return;

        btn.addEventListener('click', () => {
          const val = parseFloat(input.value);
          if (isNaN(val)) {
            feed.className = 'sw-challenge-feedback incorrect';
            feed.textContent = 'Introduce un valor numérico.';
            return;
          }

          const diff = Math.abs(val - expected) / expected;
          if (diff <= tol) {
            feed.className = 'sw-challenge-feedback correct';
            feed.textContent = `¡Excelente! Respuesta correcta (~${expected}). ${explain}`;
          } else {
            feed.className = 'sw-challenge-feedback incorrect';
            feed.textContent = `Incorrecto. Obtuviste ${val}, pero el valor esperado es cercano a ${expected}. ${explain}`;
          }
        });
      };

      // Reto 1: f1 con L=1.5m, T=150N, mu=0.012 kg/m -> v=111.8m/s -> f1=37.27 Hz
      bindQ('btn-check-q1', 'input-q1', 'feed-q1', 37.27, 0.05, 'Fórmula: f1 = (1/2L)*√(T/μ) = (1/3)*√(150/0.012) = 37.27 Hz.');
      // Reto 2: Guitarra L=0.65m, mu=0.005 kg/m, f1=110 Hz -> v=143 m/s -> T=102.2 N
      bindQ('btn-check-q2', 'input-q2', 'feed-q2', 102.24, 0.05, 'Fórmula: T = μ*(2L*f1)² = 0.005*(2*0.65*110)² = 102.2 N.');
      // Reto 3: Melde n=3, f=60Hz, L=1.2m, mu=0.002kg/m -> v=48 m/s -> T=4.61N -> m=470 g
      bindQ('btn-check-q3', 'input-q3', 'feed-q3', 470, 0.06, 'Fórmula: v=(2*1.2*60)/3=48 m/s -> T=0.002*48²=4.61 N -> m=T/g = 470 g.');
      // Reto 4: Nodos interiores para n=6 -> 5 nodos interiores
      bindQ('btn-check-q4', 'input-q4', 'feed-q4', 5, 0.01, 'Los nodos interiores siempre equivalen a n - 1. Para n=6 hay exactamente 5 nodos interiores.');
    }

    destroy() {
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
      }
      if (this.audio) {
        this.audio.stopOscillators();
      }
    }
  }

  // Exponer globalmente
  global.StandingWavesSimulator = StandingWavesSimulator;

})(typeof window !== 'undefined' ? window : this);
