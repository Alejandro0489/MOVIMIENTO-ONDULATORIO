/**
 * ============================================================================
 * CONTROLADOR PRINCIPAL DEL SIMULADOR DEL EFECTO DOPPLER
 * Cuaderno Interactivo de Física III • Universidad
 * 
 * Orquestador integral:
 * - Vinculación reactiva de controles (sliders y entradas numéricas sincronizados).
 * - Bucle de animación requestAnimationFrame con física temporal independiente.
 * - Sincronización precisa entre animación, audio Web Audio API, gráficas y KaTeX.
 * - Modalidades de Exploración y Laboratorio.
 * - Deslizador temporal determinista y velocidad de reproducción (0.25x - 2x).
 * - Modales de escenarios, verificación, laboratorio de código y teoría.
 * ============================================================================
 */

import { DopplerModel } from './doppler-model.js';
import { DopplerCanvasRenderer } from './doppler-canvas.js';
import { DopplerChartsEngine } from './doppler-charts.js';
import { DopplerAudioEngine } from './doppler-audio.js';
import { DOPPLER_SCENARIOS } from './doppler-scenarios.js';
import { DopplerVerifier } from './doppler-verifier.js';
import { DopplerCodeLab, CODE_PRESETS } from './doppler-code-lab.js';

export class DopplerApp {
  constructor() {
    this.isPlaying = false;
    this.playSpeed = 1.0;
    this.lastFrameTime = performance.now();
    this.currentMode = 'exploration'; // 'exploration' o 'lab'

    // Instanciar Motor Físico con configuración inicial recomendada
    // f = 2 Hz, c = 340 m/s, vf = 0 m/s, vo = 0 m/s, sep = 340 m, t_total = 10 s
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

    // Motores de Audio y Renderizado
    this.audio = new DopplerAudioEngine();
    
    const canvas = document.getElementById('doppler-canvas');
    this.renderer = new DopplerCanvasRenderer(canvas, this.model);

    const chartCanvas = document.getElementById('doppler-chart-canvas');
    this.charts = new DopplerChartsEngine(chartCanvas, this.model);

    this.codeLab = new DopplerCodeLab(this.model, () => {
      this.syncInputsFromModel();
      this.updateMathPanel();
      this.updateEventsTable();
    });

    this.activeScenario = null;

    this.init();
  }

  init() {
    this.bindDomElements();
    this.bindEvents();
    this.syncInputsFromModel();
    this.updateMathPanel();
    this.updateEventsTable();
    this.updateMachBadge();

    // Iniciar bucle de animación
    requestAnimationFrame((t) => this.loop(t));

    // Renderizado KaTeX
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
    // Controles de transporte
    this.btnPlay = document.getElementById('btn-play-pause');
    this.btnReset = document.getElementById('btn-reset');
    this.btnStepFwd = document.getElementById('btn-step-fwd');
    this.btnStepBack = document.getElementById('btn-step-back');
    this.btnStepPeriod = document.getElementById('btn-step-period');
    this.scrubber = document.getElementById('time-scrubber');
    this.timeDisplay = document.getElementById('time-display');
    this.speedSelect = document.getElementById('speed-select');

    // Botones de Modo Exploración / Laboratorio
    this.btnModeExploration = document.getElementById('btn-mode-exploration');
    this.btnModeLab = document.getElementById('btn-mode-lab');

    // Entradas y deslizadores físicos
    this.sliderF = document.getElementById('slider-f');
    this.inputF = document.getElementById('input-f');
    this.sliderC = document.getElementById('slider-c');
    this.inputC = document.getElementById('input-c');
    this.sliderVf = document.getElementById('slider-vf');
    this.inputVf = document.getElementById('input-vf');
    this.sliderVo = document.getElementById('slider-vo');
    this.inputVo = document.getElementById('input-vo');
    this.sliderSep = document.getElementById('slider-sep');
    this.inputSep = document.getElementById('input-sep');
    this.sliderDuration = document.getElementById('slider-duration');
    this.inputDuration = document.getElementById('input-duration');

    // Selectores de fuente y estilos
    this.selectSourceType = document.getElementById('select-source-type');
    this.selectWaveStyle = document.getElementById('select-wave-style');
    this.colorWave = document.getElementById('color-wave');
    this.checkAttenuation = document.getElementById('check-attenuation');
    this.checkVectors = document.getElementById('check-vectors');
    this.checkGrid = document.getElementById('check-grid');
    this.checkTrackSource = document.getElementById('check-track-source');

    // Audio
    this.btnToggleAudio = document.getElementById('btn-toggle-audio');
    this.selectAudioMode = document.getElementById('select-audio-mode');
    this.sliderVolume = document.getElementById('slider-volume');

    // Modales y botones de cabecera
    this.btnOpenScenarios = document.getElementById('btn-open-scenarios');
    this.btnOpenVerify = document.getElementById('btn-open-verify');
    this.btnOpenCodeLab = document.getElementById('btn-open-codelab');
    this.btnOpenManual = document.getElementById('btn-open-manual');

    // Insignia de régimen
    this.machBadge = document.getElementById('mach-status-badge');
  }

  bindEvents() {
    // Redimensionamiento de ventana
    window.addEventListener('resize', () => {
      this.renderer.resize();
      this.charts.resize();
    });

    // Play / Pause
    this.btnPlay.addEventListener('click', () => this.togglePlay());

    // Reset
    this.btnReset.addEventListener('click', () => this.resetSimulation());

    // Pasos manuales
    this.btnStepFwd.addEventListener('click', () => {
      this.pause();
      this.advanceStep(this.model.dtStep);
    });
    this.btnStepBack.addEventListener('click', () => {
      this.pause();
      this.advanceStep(-this.model.dtStep);
    });
    this.btnStepPeriod.addEventListener('click', () => {
      this.pause();
      this.advanceStep(this.model.T);
    });

    // Scrubber temporal determinista
    this.scrubber.addEventListener('input', (e) => {
      this.pause();
      const val = parseFloat(e.target.value);
      this.model.setTime(val);
      this.audio.stopAll();
      this.updateUiState();
    });

    // Velocidad de reproducción
    this.speedSelect.addEventListener('change', (e) => {
      this.playSpeed = parseFloat(e.target.value) || 1.0;
    });

    // Cambio de Modo (Exploración vs Laboratorio)
    this.btnModeExploration.addEventListener('click', () => this.setMode('exploration'));
    this.btnModeLab.addEventListener('click', () => this.setMode('lab'));

    // Sincronización bidireccional de parámetros físicos
    const bindPair = (slider, input, setter, minVal = null) => {
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

    // Separación inicial
    const updateSeparation = (sep) => {
      const half = sep / 2;
      this.model.sourcePos0.x = -half;
      this.model.obsPos0.x = half;
    };
    bindPair(this.sliderSep, this.inputSep, updateSeparation, 10);

    // Personalización visual
    this.selectSourceType.addEventListener('change', (e) => {
      this.renderer.sourceType = e.target.value;
    });
    this.selectWaveStyle.addEventListener('change', (e) => {
      this.renderer.waveStyle = e.target.value;
    });
    this.colorWave.addEventListener('input', (e) => {
      this.renderer.waveColor = e.target.value;
    });
    this.checkAttenuation.addEventListener('change', (e) => {
      this.renderer.enableAttenuation = e.target.checked;
    });
    this.checkVectors.addEventListener('change', (e) => {
      this.renderer.showVectors = e.target.checked;
    });
    this.checkGrid.addEventListener('change', (e) => {
      this.renderer.showGrid = e.target.checked;
    });
    this.checkTrackSource.addEventListener('change', (e) => {
      this.renderer.trackSource = e.target.checked;
    });

    // Herramientas flotantes de cámara en lienzo
    document.getElementById('btn-fit-scene').addEventListener('click', () => this.renderer.fitScene());
    document.getElementById('btn-reset-view').addEventListener('click', () => this.renderer.resetView());
    
    const btnRuler = document.getElementById('btn-toggle-ruler');
    btnRuler.addEventListener('click', () => {
      this.renderer.rulerActive = !this.renderer.rulerActive;
      btnRuler.classList.toggle('active', this.renderer.rulerActive);
      if (!this.renderer.rulerActive) {
        this.renderer.rulerP1 = null;
        this.renderer.rulerP2 = null;
      }
    });

    // Audio
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

    this.selectAudioMode.addEventListener('change', (e) => {
      this.audio.setMode(e.target.value);
    });

    this.sliderVolume.addEventListener('input', (e) => {
      this.audio.setVolume(parseFloat(e.target.value));
    });

    // Pestañas de gráficas
    document.querySelectorAll('.chart-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.chart-tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.charts.setTab(e.target.dataset.tab);
      });
    });

    // Exportación
    document.getElementById('btn-export-csv').addEventListener('click', () => this.charts.exportCSV());
    document.getElementById('btn-export-png').addEventListener('click', () => this.charts.exportPNG());

    // Atajos de teclado
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      } else if (e.code === 'KeyR') {
        this.resetSimulation();
      } else if (e.code === 'ArrowRight') {
        this.advanceStep(this.model.dtStep);
      } else if (e.code === 'ArrowLeft') {
        this.advanceStep(-this.model.dtStep);
      } else if (e.code === 'KeyM') {
        this.audio.setMute(!this.audio.isMuted);
      }
    });

    // Configurar Modales
    this.setupModals();
  }

  setupModals() {
    const bindModal = (btnId, modalId, closeId) => {
      const btn = document.getElementById(btnId);
      const modal = document.getElementById(modalId);
      const close = document.getElementById(closeId);
      if (btn && modal && close) {
        btn.addEventListener('click', () => modal.classList.add('open'));
        close.addEventListener('click', () => modal.classList.remove('open'));
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.classList.remove('open');
        });
      }
    };

    bindModal('btn-open-scenarios', 'modal-scenarios', 'btn-close-scenarios');
    bindModal('btn-open-verify', 'modal-verify', 'btn-close-verify');
    bindModal('btn-open-codelab', 'modal-codelab', 'btn-close-codelab');
    bindModal('btn-open-manual', 'modal-manual', 'btn-close-manual');

    // Renderizar selector de escenarios
    this.renderScenariosList();

    // Botón de ejecución de pruebas en modal de verificación
    document.getElementById('btn-run-tests').addEventListener('click', () => {
      this.runVerificationTests();
    });

    // Presets de código en el modal de laboratorio
    this.setupCodeLabUI();
  }

  renderScenariosList() {
    const container = document.getElementById('scenarios-grid');
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

    // Aplicar configuración del escenario al modelo
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

    // Mostrar sección interactiva de predicción y procedimiento
    const detailBox = document.getElementById('scenario-detail-box');
    if (detailBox) {
      detailBox.style.display = 'block';
      detailBox.innerHTML = `
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--doppler-panel-border); border-radius:var(--radius-md); padding:16px; display:flex; flex-direction:column; gap:12px;">
          <h3 style="color:var(--doppler-accent-amber); font-family:var(--font-serif); font-size:1.05rem;">${sc.title}</h3>
          <p style="font-size:0.85rem; color:#cbd5e1; line-height:1.4;">${sc.objective}</p>
          
          <div class="interactive-quiz-box">
            <h4 style="color:var(--doppler-accent-cyan); font-size:0.88rem;">🤔 Pregunta de Predicción</h4>
            <p style="font-size:0.82rem; color:#e2e8f0;">${sc.prediction.question}</p>
            <div style="display:flex; flex-direction:column; gap:8px;" id="pred-options-container">
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

      // Eventos de opciones de predicción
      detailBox.querySelectorAll('.quiz-option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.optIdx, 10);
          const opt = sc.prediction.options[idx];
          const fb = document.getElementById('pred-feedback');
          fb.style.display = 'block';
          fb.style.background = opt.isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
          fb.style.color = opt.isCorrect ? '#34d399' : '#f87171';
          fb.innerHTML = `<strong>${opt.isCorrect ? '✓ ¡Correcto!' : '✗ Inténtalo de nuevo:'}</strong> ${opt.feedback}`;
        });
      });

      document.getElementById('btn-start-scenario-exp').addEventListener('click', () => {
        document.getElementById('modal-scenarios').classList.remove('open');
        this.play();
      });

      if (window.lucide) window.lucide.createIcons();
    }
  }

  setupCodeLabUI() {
    const editor = document.getElementById('codelab-editor');
    const selectPreset = document.getElementById('select-codelab-preset');
    const btnCompile = document.getElementById('btn-compile-code');
    const btnResetCode = document.getElementById('btn-reset-code');
    const msgBox = document.getElementById('codelab-msg');

    if (!editor || !selectPreset) return;

    selectPreset.addEventListener('change', (e) => {
      const key = e.target.value;
      if (CODE_PRESETS[key]) {
        editor.value = CODE_PRESETS[key].code;
      }
    });

    btnCompile.addEventListener('click', () => {
      const code = editor.value;
      const res = this.codeLab.applySourceTrajectory(code);
      msgBox.style.display = 'block';
      if (res.success) {
        msgBox.style.background = 'rgba(16, 185, 129, 0.2)';
        msgBox.style.color = '#34d399';
        msgBox.textContent = res.message;
        document.getElementById('modal-codelab').classList.remove('open');
        this.renderer.fitScene();
      } else {
        msgBox.style.background = 'rgba(239, 68, 68, 0.2)';
        msgBox.style.color = '#f87171';
        msgBox.textContent = res.error;
      }
    });

    btnResetCode.addEventListener('click', () => {
      this.codeLab.resetToLinearTrajectory();
      msgBox.style.display = 'block';
      msgBox.style.background = 'rgba(56, 189, 248, 0.15)';
      msgBox.style.color = '#38bdf8';
      msgBox.textContent = "Trayectoria restaurada a movimiento rectilíneo.";
    });
  }

  runVerificationTests() {
    const tbody = document.getElementById('verify-table-body');
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
        <td>
          <span class="verify-badge ${r.passed ? 'pass' : 'fail'}">
            ${r.passed ? '✓ PASÓ' : '✗ FALLÓ'}
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  setMode(mode) {
    this.currentMode = mode;
    this.btnModeExploration.classList.toggle('active', mode === 'exploration');
    this.btnModeLab.classList.toggle('active', mode === 'lab');

    const labOnlyElements = document.querySelectorAll('.lab-only');
    labOnlyElements.forEach(el => {
      el.style.display = mode === 'lab' ? '' : 'none';
    });
  }

  syncInputsFromModel() {
    this.sliderF.value = this.model.f;
    this.inputF.value = this.model.f;
    this.sliderC.value = this.model.c;
    this.inputC.value = this.model.c;
    this.sliderVf.value = this.model.sourceVel.x;
    this.inputVf.value = this.model.sourceVel.x;
    this.sliderVo.value = this.model.obsVel.x;
    this.inputVo.value = this.model.obsVel.x;

    const sep = Math.abs(this.model.obsPos0.x - this.model.sourcePos0.x);
    this.sliderSep.value = sep.toFixed(1);
    this.inputSep.value = sep.toFixed(1);

    const dur = this.model.getTotalDuration();
    this.sliderDuration.value = dur.toFixed(1);
    this.inputDuration.value = dur.toFixed(1);

    this.scrubber.max = dur;
  }

  togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  play() {
    this.isPlaying = true;
    this.lastFrameTime = performance.now();
    this.btnPlay.innerHTML = '<i data-lucide="pause"></i> Pausar';
    this.btnPlay.classList.add('primary');
    if (window.lucide) window.lucide.createIcons();
  }

  pause() {
    this.isPlaying = false;
    this.btnPlay.innerHTML = '<i data-lucide="play"></i> Iniciar';
    this.btnPlay.classList.remove('primary');
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
      // Avanzar tiempo físico independiente del framerate
      const dtPhysical = (deltaMs / 1000.0) * this.playSpeed;
      const res = this.model.advanceTime(dtPhysical);

      // Reproducir eventos de audio sincronizados
      if (res.arrivals.length > 0) {
        for (const _ of res.arrivals) {
          this.audio.playArrivalPulse();
          this.renderer.triggerReceptionPulse();
        }
      }

      if (res.machCrossing) {
        this.audio.playSonicBoom();
      }

      // Si es audio tonal continuo, modular su frecuencia
      if (this.audio.audioMode === 'tonal') {
        const theo = this.model.getTheoreticalFrequency(this.model.simTime);
        this.audio.updateTonalSynthesis(theo.fo, this.model.f);
      }

      if (res.isFinished) {
        this.pause();
      }

      this.updateUiState();
    }

    // Dibujar lienzo y gráfica
    this.renderer.render();
    this.charts.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  updateUiState() {
    const t = this.model.simTime;
    const dur = this.model.getTotalDuration();

    // Actualizar scrubber y texto
    this.scrubber.value = t;
    this.scrubber.max = dur;
    this.timeDisplay.textContent = `${t.toFixed(2)}s / ${dur.toFixed(1)}s`;

    // Actualizar Mach Badge
    this.updateMachBadge();

    // Actualizar KaTeX y tabla
    this.updateMathPanel();
    this.updateEventsTable();
  }

  updateMachBadge() {
    const M = this.model.Mach;
    const badge = this.machBadge;
    if (!badge) return;

    badge.className = 'status-pill';
    if (M < 0.99) {
      badge.classList.add('mach-sub');
      badge.innerHTML = `<i data-lucide="wind"></i> Mach ${M.toFixed(2)} (Subsónico)`;
    } else if (M <= 1.05) {
      badge.classList.add('mach-sonic');
      badge.innerHTML = `<i data-lucide="zap"></i> Mach 1.00 (Barrera Sónica)`;
    } else {
      badge.classList.add('mach-super');
      badge.innerHTML = `<i data-lucide="flame"></i> Mach ${M.toFixed(2)} (Supersónico: μ=${this.model.machAngleDeg.toFixed(1)}°)`;
    }
    if (window.lucide) window.lucide.createIcons();
  }

  updateMathPanel() {
    const t = this.model.simTime;
    const theo = this.model.getTheoreticalFrequency(t);
    const measured = this.model.getMeasuredFrequencyAt(t);

    const elFo = document.getElementById('val-fo');
    const elFm = document.getElementById('val-fm');
    const elMach = document.getElementById('val-mach');
    const elLambda = document.getElementById('val-lambda');
    const elDelay = document.getElementById('val-delay');

    if (elFo) elFo.textContent = isFinite(theo.fo) ? `${theo.fo.toFixed(3)} Hz` : 'Singularidad';
    if (elFm) elFm.textContent = measured.f_measured !== null ? `${measured.f_measured.toFixed(3)} Hz` : measured.status;
    if (elMach) elMach.textContent = `${this.model.Mach.toFixed(3)}`;
    if (elLambda) elLambda.textContent = `${this.model.lambdaFront.toFixed(1)} m`;

    const dist = this.model.getSourcePos(t).dist(this.model.getObsPos(t));
    if (elDelay) elDelay.textContent = `${(dist / this.model.c).toFixed(3)} s`;
  }

  updateEventsTable() {
    const tbody = document.getElementById('events-table-body');
    if (!tbody) return;

    const t = this.model.simTime;
    tbody.innerHTML = '';

    const recs = this.model.receptions.slice(0, 30); // Primeros 30 eventos
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

// Iniciar aplicación al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
  window.dopplerApp = new DopplerApp();
});
