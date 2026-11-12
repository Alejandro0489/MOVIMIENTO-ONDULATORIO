/**
 * ============================================================================
 * SIMULACIONES FÍSICAS PREMIUM - MASA-RESORTE, PÉNDULO Y FASORES
 * Cuaderno Digital Interactivo: Física 3 - Movimiento Ondulatorio
 * ============================================================================
 */

class PhysicsLab {
  constructor() {
    // Parámetros físicos interactivos
    this.m = 0.5;       // Masa (kg)
    this.k = 200.0;     // Constante resorte (N/m)
    this.L = 1.0;       // Longitud péndulo (m)
    this.g = 9.8;       // Gravedad (m/s²)
    this.A = 0.12;      // Amplitud (m)
    this.phi = 0.0;     // Fase inicial (rad)
    this.damping = 0.0; // Coeficiente amortiguamiento (opcional)

    // Estado dinámico
    this.t = 0.0;
    this.isPlaying = true;
    this.lastTimestamp = null;

    // Historial para trazador sismográfico (masa-resorte)
    this.traceHistory = [];
    this.maxTracePoints = 400;

    // Referencias a lienzos
    this.canvasSpring = document.getElementById('canvas-spring-mass');
    this.canvasPendulum = document.getElementById('canvas-pendulum');
    this.canvasPhasor = document.getElementById('canvas-phasor');

    // Contextos 2D
    this.ctxSpring = this.canvasSpring ? this.canvasSpring.getContext('2d') : null;
    this.ctxPendulum = this.canvasPendulum ? this.canvasPendulum.getContext('2d') : null;
    this.ctxPhasor = this.canvasPhasor ? this.canvasPhasor.getContext('2d') : null;

    this.init();
  }

  init() {
    this.setupListeners();
    this.updateDerivedValues();
    requestAnimationFrame((ts) => this.loop(ts));
  }

  setupListeners() {
    // Sliders
    const bindSlider = (id, callback) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', (e) => {
          callback(parseFloat(e.target.value));
          this.updateDerivedValues();
        });
      }
    };

    bindSlider('slider-mass', (val) => { this.m = val; this.updateSliderLabel('val-mass', val, 'kg'); });
    bindSlider('slider-k', (val) => { this.k = val; this.updateSliderLabel('val-k', val, 'N/m'); });
    bindSlider('slider-amplitude', (val) => { this.A = val; this.updateSliderLabel('val-amplitude', val, 'm'); });
    bindSlider('slider-phi', (val) => { this.phi = val; this.updateSliderLabel('val-phi', val, 'rad'); });
    bindSlider('slider-length', (val) => { this.L = val; this.updateSliderLabel('val-length', val, 'm'); });

    // Botones de control Play/Pause, Step, Reset
    const btnPlay = document.getElementById('btn-sim-play');
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        this.isPlaying = !this.isPlaying;
        btnPlay.classList.toggle('playing', !this.isPlaying);
        btnPlay.innerHTML = this.isPlaying 
          ? `<i data-lucide="pause"></i><span>Pausar</span>` 
          : `<i data-lucide="play"></i><span>Reanudar</span>`;
        if (window.lucide) lucide.createIcons();
      });
    }

    const btnStep = document.getElementById('btn-sim-step');
    if (btnStep) {
      btnStep.addEventListener('click', () => {
        this.isPlaying = false;
        if (btnPlay) {
          btnPlay.classList.add('playing');
          btnPlay.innerHTML = `<i data-lucide="play"></i><span>Reanudar</span>`;
          if (window.lucide) lucide.createIcons();
        }
        this.t += 0.05;
        this.renderAll();
      });
    }

    const btnReset = document.getElementById('btn-sim-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.t = 0.0;
        this.traceHistory = [];
        this.renderAll();
      });
    }
  }

  updateSliderLabel(id, val, unit) {
    const el = document.getElementById(id);
    if (el) el.textContent = `${val.toFixed(2)} ${unit}`;
  }

  updateDerivedValues() {
    // Masa-Resorte
    this.omegaSpring = Math.sqrt(this.k / this.m);
    this.freqSpring = this.omegaSpring / (2 * Math.PI);
    this.periodSpring = 1 / this.freqSpring;

    // Péndulo
    this.omegaPendulum = Math.sqrt(this.g / this.L);
    this.freqPendulum = this.omegaPendulum / (2 * Math.PI);
    this.periodPendulum = 1 / this.freqPendulum;

    // Cinemática y Energía
    this.vMax = this.A * this.omegaSpring;
    this.aMax = this.A * this.omegaSpring * this.omegaSpring;
    this.EMec = 0.5 * this.k * this.A * this.A;

    // Actualizar telemetría visual
    const updateEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = text;
    };

    updateEl('telem-omega', `${this.omegaSpring.toFixed(2)} <span class="unit">rad/s</span>`);
    updateEl('telem-freq', `${this.freqSpring.toFixed(2)} <span class="unit">Hz</span>`);
    updateEl('telem-period', `${this.periodSpring.toFixed(2)} <span class="unit">s</span>`);
    updateEl('telem-vmax', `${this.vMax.toFixed(2)} <span class="unit">m/s</span>`);
    updateEl('telem-amax', `${this.aMax.toFixed(2)} <span class="unit">m/s²</span>`);
    updateEl('telem-emec', `${this.EMec.toFixed(3)} <span class="unit">J</span>`);

    // Sincronizar Geogebra si existe
    if (window.geoPlotter) {
      window.geoPlotter.setParams(this.A, this.omegaSpring, this.phi, this.t);
    }
  }

  loop(timestamp) {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;

    if (this.isPlaying) {
      this.t += dt;
      this.renderAll();
    }

    requestAnimationFrame((ts) => this.loop(ts));
  }

  renderAll() {
    const currentX = this.A * Math.cos(this.omegaSpring * this.t + this.phi);
    const currentV = -this.A * this.omegaSpring * Math.sin(this.omegaSpring * this.t + this.phi);
    const currentA = -this.omegaSpring * this.omegaSpring * currentX;

    // Actualizar historial del registrador de ondas
    this.traceHistory.push({ t: this.t, x: currentX });
    if (this.traceHistory.length > this.maxTracePoints) {
      this.traceHistory.shift();
    }

    // Dibujar simulaciones 2D
    if (this.ctxSpring) this.drawSpringMass(currentX, currentV, currentA);
    if (this.ctxPendulum) this.drawPendulum();
    if (this.ctxPhasor) this.drawPhasor(currentX, currentV, currentA);

    // Sincronizar Geogebra
    if (window.geoPlotter) {
      window.geoPlotter.setParams(undefined, undefined, undefined, this.t);
    }

    // Sincronizar Three.js 3D
    if (window.threeSpringSim) {
      window.threeSpringSim.update(currentX);
    }
  }

  // =========================================================================
  // 1. SISTEMA MASA-RESORTE 2D CON REGISTRO SISMOGRÁFICO Y VECTORES
  // =========================================================================
  drawSpringMass(x, v, a) {
    const ctx = this.ctxSpring;
    const w = this.canvasSpring.width;
    const h = this.canvasSpring.height;

    ctx.clearRect(0, 0, w, h);

    // Fondo estilo mesa de laboratorio
    ctx.fillStyle = '#faf6ef';
    ctx.fillRect(0, 0, w, h);

    // Línea de suelo / soporte
    const floorY = h * 0.72;
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, floorY);
    ctx.lineTo(w - 20, floorY);
    ctx.stroke();

    // Pared fija izquierda
    ctx.fillStyle = '#d5c2a5';
    ctx.fillRect(10, 40, 24, floorY - 40);
    ctx.strokeRect(10, 40, 24, floorY - 40);

    // Eclosión de pared
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 1;
    for (let py = 50; py < floorY - 10; py += 12) {
      ctx.beginPath();
      ctx.moveTo(10, py);
      ctx.lineTo(24, py + 10);
      ctx.stroke();
    }

    // Posición de equilibrio x = 0 en pantalla
    const eqX = w * 0.45;
    const scalePixelsPerMeter = (w * 0.35) / Math.max(this.A * 1.5, 0.2);
    const massCenterX = eqX + x * scalePixelsPerMeter;
    const massSize = 48;
    const massTopY = floorY - massSize;

    // Línea vertical punteada de equilibrio
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(eqX, 40);
    ctx.lineTo(eqX, floorY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Etiqueta x = 0
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#8b5a2b';
    ctx.textAlign = 'center';
    ctx.fillText('x = 0 (Equilibrio)', eqX, floorY + 18);

    // Dibujar Resorte Helicoidal
    this.drawCoilSpring(ctx, 34, floorY - massSize / 2, massCenterX - massSize / 2, floorY - massSize / 2, 14, 16);

    // Dibujar Bloque de Masa (con gradiente metálico pulido)
    const massGrad = ctx.createLinearGradient(massCenterX - massSize / 2, massTopY, massCenterX + massSize / 2, floorY);
    massGrad.addColorStop(0, '#c59b27');
    massGrad.addColorStop(0.5, '#e6be53');
    massGrad.addColorStop(1, '#8b5a2b');
    ctx.fillStyle = massGrad;
    ctx.fillRect(massCenterX - massSize / 2, massTopY, massSize, massSize);
    ctx.strokeStyle = '#4a2f13';
    ctx.lineWidth = 2;
    ctx.strokeRect(massCenterX - massSize / 2, massTopY, massSize, massSize);

    // Texto de masa sobre el bloque
    ctx.fillStyle = '#1a1209';
    ctx.font = 'bold 11px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`m=${this.m}kg`, massCenterX, massTopY + massSize / 2 + 4);

    // Vectores Físicos: Fuerza Restauradora (Rojo) y Velocidad (Verde)
    const vecY = massTopY - 14;

    // Vector Fuerza F = -k*x (Rojo)
    const forceMagnitude = -this.k * x;
    const forcePixels = Math.max(Math.min(forceMagnitude * 0.4, 70), -70);
    if (Math.abs(forcePixels) > 3) {
      this.drawArrow(ctx, massCenterX, vecY, massCenterX + forcePixels, vecY, '#dc2626', 2.5, 'F = -kx');
    }

    // Vector Velocidad (Verde)
    const velPixels = Math.max(Math.min(v * 20, 70), -70);
    if (Math.abs(velPixels) > 3) {
      this.drawArrow(ctx, massCenterX, vecY - 18, massCenterX + velPixels, vecY - 18, '#16a34a', 2.5, 'v(t)');
    }

    // Registro continuo estilo sismógrafo / tambor en la parte superior
    this.drawSeismographTrack(ctx, w, h * 0.28, eqX, scalePixelsPerMeter);
  }

  drawCoilSpring(ctx, x1, y1, x2, y2, coils, radius) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);

    const leadIn = 14;
    const leadOut = 14;
    const springLen = dist - leadIn - leadOut;
    const step = springLen / coils;

    ctx.lineTo(leadIn, 0);
    for (let i = 0; i < coils; i++) {
      const cx = leadIn + (i + 0.25) * step;
      const cy = -radius;
      const nx = leadIn + (i + 0.75) * step;
      const ny = radius;
      ctx.lineTo(cx, cy);
      ctx.lineTo(nx, ny);
    }
    ctx.lineTo(dist - leadOut, 0);
    ctx.lineTo(dist, 0);
    ctx.stroke();
    ctx.restore();
  }

  drawArrow(ctx, fromX, fromY, toX, toY, color, width, label) {
    const headLen = 8;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    if (label) {
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, (fromX + toX) / 2, fromY - 6);
    }
    ctx.restore();
  }

  drawSeismographTrack(ctx, w, trackH, eqX, scalePixels) {
    ctx.save();
    ctx.fillStyle = '#f3ebd9';
    ctx.fillRect(34, 8, w - 44, trackH);
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.3)';
    ctx.strokeRect(34, 8, w - 44, trackH);

    // Eje central de referencia
    const midY = 8 + trackH / 2;
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.2)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(34, midY);
    ctx.lineTo(w - 10, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Trazar curva temporal en vivo
    if (this.traceHistory.length > 1) {
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const latestT = this.traceHistory[this.traceHistory.length - 1].t;
      const timeWindow = 4.0; // 4 segundos visibles

      this.traceHistory.forEach((pt, idx) => {
        const timeOffset = latestT - pt.t;
        const screenX = (w - 18) - (timeOffset / timeWindow) * (w - 60);
        const screenY = midY - pt.x * (trackH * 0.35 / this.A);

        if (screenX >= 34) {
          if (idx === 0) ctx.moveTo(screenX, screenY);
          else ctx.lineTo(screenX, screenY);
        }
      });
      ctx.stroke();
    }
    ctx.restore();
  }

  // =========================================================================
  // 2. SIMULACIÓN DE PÉNDULO SIMPLE CON DESCOMPOSICIÓN DE FUERZAS
  // =========================================================================
  drawPendulum() {
    const ctx = this.ctxPendulum;
    const w = this.canvasPendulum.width;
    const h = this.canvasPendulum.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#faf6ef';
    ctx.fillRect(0, 0, w, h);

    const pivotX = w / 2;
    const pivotY = 30;
    const rodLength = h * 0.62;

    // Ángulo theta(t) = theta0 * cos(omega * t)
    const thetaMax = (this.A / this.L); // Aproximación
    const theta = thetaMax * Math.cos(this.omegaPendulum * this.t + this.phi);

    const bobX = pivotX + rodLength * Math.sin(theta);
    const bobY = pivotY + rodLength * Math.cos(theta);

    // Soporte y pivote
    ctx.fillStyle = '#4a3c31';
    ctx.fillRect(pivotX - 25, 10, 50, 12);
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#c59b27';
    ctx.fill();

    // Línea vertical de referencia
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.3)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(pivotX, pivotY + rodLength + 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cuerda del péndulo
    ctx.strokeStyle = '#2d1e12';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();

    // Esfera (bob) metálica con brillo esférico
    const bobRadius = 18;
    const sphereGrad = ctx.createRadialGradient(bobX - 5, bobY - 5, 2, bobX, bobY, bobRadius);
    sphereGrad.addColorStop(0, '#fef3c7');
    sphereGrad.addColorStop(0.4, '#d97706');
    sphereGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Descomposición de Fuerzas: Peso (mg), Tensión (T), Restauradora (-mg sin theta)
    // 1. Peso vertical (mg) - Azul
    this.drawArrow(ctx, bobX, bobY, bobX, bobY + 45, '#1d4ed8', 2, 'P = mg');

    // 2. Fuerza restauradora tangencial - Rojo
    const ftAngle = theta + (theta > 0 ? -Math.PI / 2 : Math.PI / 2);
    const ftMag = Math.abs(Math.sin(theta)) * 90;
    const ftEndX = bobX + ftMag * Math.cos(ftAngle);
    const ftEndY = bobY + ftMag * Math.sin(ftAngle);
    if (ftMag > 3) {
      this.drawArrow(ctx, bobX, bobY, ftEndX, ftEndY, '#dc2626', 2, 'F_t = -mg·sen θ');
    }

    // Indicador de ángulo
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#78350f';
    ctx.textAlign = 'center';
    ctx.fillText(`θ = ${(theta * 180 / Math.PI).toFixed(1)}°`, pivotX + 35, pivotY + 45);
  }

  // =========================================================================
  // 3. DIAGRAMA FASORIAL INTERACTIVO ACOPLADO A ONDA SENOIDAL
  // =========================================================================
  drawPhasor(x, v, a) {
    const ctx = this.ctxPhasor;
    const w = this.canvasPhasor.width;
    const h = this.canvasPhasor.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#faf6ef';
    ctx.fillRect(0, 0, w, h);

    const circleCenterX = w * 0.28;
    const circleCenterY = h / 2;
    const radius = Math.min(w * 0.2, h * 0.38);

    // Círculo trigonométrico de amplitud A
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(circleCenterX, circleCenterY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Ejes cartesianos del círculo
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.25)';
    ctx.beginPath();
    ctx.moveTo(circleCenterX - radius - 15, circleCenterY);
    ctx.lineTo(circleCenterX + radius + 15, circleCenterY);
    ctx.moveTo(circleCenterX, circleCenterY - radius - 15);
    ctx.lineTo(circleCenterX, circleCenterY + radius + 15);
    ctx.stroke();

    // Ángulo actual del fasor: omega * t + phi
    const currentAngle = (this.omegaSpring * this.t + this.phi);
    const tipX = circleCenterX + radius * Math.cos(currentAngle);
    const tipY = circleCenterY - radius * Math.sin(currentAngle); // Coordenada Canvas invertida

    // Vector Fasor de Posición (Azul Royal)
    this.drawArrow(ctx, circleCenterX, circleCenterY, tipX, tipY, '#2563eb', 3, 'A');

    // Fasor de Velocidad (desfasado +pi/2 rad) - Verde
    const vAngle = currentAngle + Math.PI / 2;
    const vRadius = radius * 0.65;
    this.drawArrow(ctx, circleCenterX, circleCenterY, 
      circleCenterX + vRadius * Math.cos(vAngle), 
      circleCenterY - vRadius * Math.sin(vAngle), 
      '#16a34a', 2, 'ωA');

    // Fasor de Aceleración (desfasado +pi rad) - Rojo
    const aAngle = currentAngle + Math.PI;
    const aRadius = radius * 0.85;
    this.drawArrow(ctx, circleCenterX, circleCenterY, 
      circleCenterX + aRadius * Math.cos(aAngle), 
      circleCenterY - aRadius * Math.sin(aAngle), 
      '#dc2626', 2, 'ω²A');

    // Proyección sobre el eje horizontal / vertical y conexión con la onda seno
    const waveStartX = w * 0.58;
    ctx.strokeStyle = '#c59b27';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(waveStartX, tipY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dibujar onda continua sinusoidal resultante en el semieje derecho
    ctx.save();
    ctx.fillStyle = '#f4ede0';
    ctx.fillRect(waveStartX, 15, w - waveStartX - 15, h - 30);
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.3)';
    ctx.strokeRect(waveStartX, 15, w - waveStartX - 15, h - 30);

    // Eje temporal central de la onda
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.2)';
    ctx.beginPath();
    ctx.moveTo(waveStartX, circleCenterY);
    ctx.lineTo(w - 15, circleCenterY);
    ctx.stroke();

    // Trazado senoidal sincronizado
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const waveWidth = w - waveStartX - 25;
    const step = 2;
    for (let px = 0; px <= waveWidth; px += step) {
      const thetaOffset = (px / waveWidth) * 3 * Math.PI;
      const sy = circleCenterY - radius * Math.sin(currentAngle - thetaOffset);
      if (px === 0) ctx.moveTo(waveStartX + px, sy);
      else ctx.lineTo(waveStartX + px, sy);
    }
    ctx.stroke();

    // Punto trazador instantáneo
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(waveStartX, tipY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * ============================================================================
 * SIMULADOR AVANZADO DE ONDAS ARMÓNICAS VIAJERAS (CUERDA ELÁSTICA)
 * Cinemática Transversal de Partículas, Vectores y Transporte de Energía
 * ============================================================================
 */
class HarmonicWaveLab {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId || 'canvas-harmonic-wave');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Parámetros físicos interactivos
    this.A = 0.08;        // Amplitud (m)
    this.lambda = 1.20;   // Longitud de onda (m)
    this.freq = 1.50;     // Frecuencia (Hz)
    this.tension = 80.0;  // Tensión (N)
    this.mu = 0.04;       // Densidad lineal de masa (kg/m)
    this.direction = 1;   // +1 = hacia +x (derecha), -1 = hacia -x (izquierda)
    this.phi = 0.0;       // Fase inicial (rad)

    // Opciones visuales
    this.showVectors = true;
    this.showParticles = true;
    this.showEnvelope = false;

    // Estado dinámico
    this.t = 0.0;
    this.isPlaying = true;
    this.lastTimestamp = null;

    this.init();
  }

  init() {
    this.setupListeners();
    this.updateDerivedValues();
    requestAnimationFrame((ts) => this.loop(ts));
  }

  setupListeners() {
    // Sliders
    const bindSlider = (id, callback) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', (e) => {
          callback(parseFloat(e.target.value));
          this.updateDerivedValues();
        });
      }
    };

    bindSlider('slider-wave-amp', (v) => {
      this.A = v;
      const el = document.getElementById('val-wave-amp');
      if (el) el.textContent = `${v.toFixed(2)} m`;
    });

    bindSlider('slider-wave-lambda', (v) => {
      this.lambda = v;
      const el = document.getElementById('val-wave-lambda');
      if (el) el.textContent = `${v.toFixed(2)} m`;
    });

    bindSlider('slider-wave-freq', (v) => {
      this.freq = v;
      const el = document.getElementById('val-wave-freq');
      if (el) el.textContent = `${v.toFixed(2)} Hz`;
    });

    bindSlider('slider-wave-tension', (v) => {
      this.tension = v;
      const el = document.getElementById('val-wave-tension');
      if (el) el.textContent = `${v.toFixed(1)} N`;
    });

    // Dirección de propagación (+x / -x)
    const btnDirPos = document.getElementById('btn-wave-dir-pos');
    const btnDirNeg = document.getElementById('btn-wave-dir-neg');
    if (btnDirPos && btnDirNeg) {
      btnDirPos.addEventListener('click', () => {
        this.direction = 1;
        btnDirPos.classList.add('active');
        btnDirNeg.classList.remove('active');
      });
      btnDirNeg.addEventListener('click', () => {
        this.direction = -1;
        btnDirNeg.classList.add('active');
        btnDirPos.classList.remove('active');
      });
    }

    // Checkboxes
    const chkVectors = document.getElementById('chk-wave-vectors');
    if (chkVectors) {
      chkVectors.addEventListener('change', (e) => {
        this.showVectors = e.target.checked;
      });
    }

    const chkParticles = document.getElementById('chk-wave-particles');
    if (chkParticles) {
      chkParticles.addEventListener('change', (e) => {
        this.showParticles = e.target.checked;
      });
    }

    const chkEnvelope = document.getElementById('chk-wave-envelope');
    if (chkEnvelope) {
      chkEnvelope.addEventListener('change', (e) => {
        this.showEnvelope = e.target.checked;
      });
    }

    // Botones de reproducción
    const btnPlay = document.getElementById('btn-wave-play');
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        this.isPlaying = !this.isPlaying;
        btnPlay.classList.toggle('playing', !this.isPlaying);
        btnPlay.innerHTML = this.isPlaying
          ? `<i data-lucide="pause"></i><span>Pausar</span>`
          : `<i data-lucide="play"></i><span>Reanudar</span>`;
        if (window.lucide) lucide.createIcons();
      });
    }

    const btnStep = document.getElementById('btn-wave-step');
    if (btnStep) {
      btnStep.addEventListener('click', () => {
        this.isPlaying = false;
        if (btnPlay) {
          btnPlay.classList.add('playing');
          btnPlay.innerHTML = `<i data-lucide="play"></i><span>Reanudar</span>`;
          if (window.lucide) lucide.createIcons();
        }
        this.t += 0.02;
        this.render();
      });
    }

    const btnReset = document.getElementById('btn-wave-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.t = 0.0;
        this.render();
      });
    }
  }

  updateDerivedValues() {
    this.k = (2 * Math.PI) / this.lambda;
    this.omega = 2 * Math.PI * this.freq;
    this.T = 1 / this.freq;
    this.v = this.lambda * this.freq;
    this.vMax = this.omega * this.A;
    this.aMax = this.omega * this.omega * this.A;
    this.powerAvg = 0.5 * this.mu * this.v * this.omega * this.omega * this.A * this.A;

    // Actualizar telemetría visual
    const updateEl = (id, html) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    };

    updateEl('wave-telem-lambda', `${this.lambda.toFixed(2)} <span class="unit">m</span>`);
    updateEl('wave-telem-k', `${this.k.toFixed(2)} <span class="unit">rad/m</span>`);
    updateEl('wave-telem-freq', `${this.freq.toFixed(2)} <span class="unit">Hz</span>`);
    updateEl('wave-telem-omega', `${this.omega.toFixed(2)} <span class="unit">rad/s</span>`);
    updateEl('wave-telem-v', `${this.v.toFixed(2)} <span class="unit">m/s</span>`);
    updateEl('wave-telem-vmax', `${this.vMax.toFixed(2)} <span class="unit">m/s</span>`);
    updateEl('wave-telem-amax', `${this.aMax.toFixed(2)} <span class="unit">m/s²</span>`);
    updateEl('wave-telem-power', `${this.powerAvg.toFixed(3)} <span class="unit">W</span>`);
  }

  loop(timestamp) {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;

    if (this.isPlaying) {
      this.t += dt;
      this.render();
    }

    requestAnimationFrame((ts) => this.loop(ts));
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const centerY = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Fondo degradado de laboratorio nocturno
    const gradBg = ctx.createLinearGradient(0, 0, 0, h);
    gradBg.addColorStop(0, '#131822');
    gradBg.addColorStop(1, '#0b0e14');
    ctx.fillStyle = gradBg;
    ctx.fillRect(0, 0, w, h);

    // Cuadrícula métrica milimetrada suave
    ctx.strokeStyle = 'rgba(197, 155, 39, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Escalas de renderizado
    // Longitud visual en metros simulados (ej: 4 metros en el ancho del canvas)
    const simulatedLengthMeters = 3.6;
    const pixelsPerMeter = w / simulatedLengthMeters;
    // Escala vertical: 0.15 m equivale a h * 0.38
    const pixelsPerMeterY = (h * 0.38) / 0.15;
    const visualAmp = this.A * pixelsPerMeterY;

    // Envolventes de amplitud (+A y -A)
    if (this.showEnvelope) {
      ctx.strokeStyle = 'rgba(234, 88, 12, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      // Línea +A
      ctx.beginPath();
      ctx.moveTo(0, centerY - visualAmp);
      ctx.lineTo(w, centerY - visualAmp);
      ctx.stroke();
      // Línea -A
      ctx.beginPath();
      ctx.moveTo(0, centerY + visualAmp);
      ctx.lineTo(w, centerY + visualAmp);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(234, 88, 12, 0.7)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`+A = +${this.A.toFixed(2)} m`, 10, centerY - visualAmp - 4);
      ctx.fillText(`-A = -${this.A.toFixed(2)} m`, 10, centerY + visualAmp + 14);
    }

    // Eje de equilibrio (y = 0)
    ctx.strokeStyle = 'rgba(197, 155, 39, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.stroke();

    // Etiqueta del eje de equilibrio
    ctx.fillStyle = 'rgba(197, 155, 39, 0.6)';
    ctx.font = '11px "Outfit", sans-serif';
    ctx.fillText('Posición de equilibrio (y = 0)', w - 170, centerY - 6);

    // Indicador vectorial de la dirección de propagación de la onda v
    const dirArrowY = 28;
    const dirArrowX = w / 2;
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    const dirText = this.direction === 1 
      ? `Velocidad de propagación de onda v = ${this.v.toFixed(2)} m/s (→ Sentido +x)` 
      : `Velocidad de propagación de onda v = ${this.v.toFixed(2)} m/s (← Sentido -x)`;
    ctx.fillText(dirText, dirArrowX, dirArrowY - 8);

    // Flecha de velocidad de fase
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const arrowLen = 60 * this.direction;
    ctx.moveTo(dirArrowX - arrowLen / 2, dirArrowY);
    ctx.lineTo(dirArrowX + arrowLen / 2, dirArrowY);
    ctx.stroke();
    // Cabeza de flecha
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    const headX = dirArrowX + arrowLen / 2;
    ctx.moveTo(headX, dirArrowY - 5);
    ctx.lineTo(headX + 8 * this.direction, dirArrowY);
    ctx.lineTo(headX, dirArrowY + 5);
    ctx.closePath();
    ctx.fill();
    ctx.textAlign = 'left';

    // Función de onda analítica:
    // y(x, t) = A * sin(k * x - dir * omega * t + phi)
    const computeY = (xMeters) => {
      const phase = this.k * xMeters - (this.direction * this.omega * this.t) + this.phi;
      return this.A * Math.sin(phase);
    };

    const computeVy = (xMeters) => {
      // dy/dt = -dir * omega * A * cos(k * x - dir * omega * t + phi)
      const phase = this.k * xMeters - (this.direction * this.omega * this.t) + this.phi;
      return -this.direction * this.omega * this.A * Math.cos(phase);
    };

    const computeAy = (xMeters) => {
      // d2y/dt2 = -omega^2 * y
      return -this.omega * this.omega * computeY(xMeters);
    };

    // Trazado continuo del hilo elástico de la onda con resplandor
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.beginPath();

    const dxStep = 3;
    for (let px = 0; px <= w; px += dxStep) {
      const xMeters = px / pixelsPerMeter;
      const yMeters = computeY(xMeters);
      const py = centerY - yMeters * pixelsPerMeterY;
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    // Partículas discretas marcadas a lo largo de la cuerda
    const numParticles = 14;
    for (let i = 1; i <= numParticles; i++) {
      const px = (i / (numParticles + 1)) * w;
      const xMeters = px / pixelsPerMeter;
      const yMeters = computeY(xMeters);
      const py = centerY - yMeters * pixelsPerMeterY;

      // Línea vertical tenue que evidencia que la partícula NO viaja horizontalmente
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.setLineDash([2, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, centerY - visualAmp);
      ctx.lineTo(px, centerY + visualAmp);
      ctx.stroke();
      ctx.setLineDash([]);

      // Si se activan vectores cinemáticos de partícula
      if (this.showVectors) {
        const vy = computeVy(xMeters);
        const ay = computeAy(xMeters);

        // Vector Velocidad Transversal (Verde Esmeralda #10b981)
        const vyPixelLen = (vy / this.vMax) * 45;
        this.drawVectorArrow(ctx, px, py, px, py - vyPixelLen, '#10b981', 2.2, 'vy');

        // Vector Aceleración Transversal (Rojo Carmesí #f43f5e)
        const ayPixelLen = (ay / this.aMax) * 35;
        this.drawVectorArrow(ctx, px - 6, py, px - 6, py - ayPixelLen, '#f43f5e', 1.8, 'ay');
      }

      // Dibujar esfera de partícula con núcleo brillante
      if (this.showParticles) {
        ctx.save();
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
        ctx.fillStyle = (i % 3 === 0) ? '#ea580c' : '#fbbf24';
        ctx.beginPath();
        ctx.arc(px, py, 6.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();
      }
    }

    // Leyenda de vectores en la esquina inferior izquierda
    if (this.showVectors) {
      ctx.fillStyle = 'rgba(17, 21, 28, 0.75)';
      ctx.fillRect(10, h - 34, 300, 26);
      ctx.strokeStyle = 'rgba(197, 155, 39, 0.3)';
      ctx.strokeRect(10, h - 34, 300, 26);

      // Muestra verde
      ctx.fillStyle = '#10b981';
      ctx.fillRect(20, h - 22, 14, 4);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px "Outfit", sans-serif';
      ctx.fillText('vy (Velocidad Transversal)', 40, h - 18);

      // Muestra roja
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(180, h - 22, 14, 4);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('ay (Aceleración Transversal)', 200, h - 18);
    }
  }

  drawVectorArrow(ctx, fromX, fromY, toX, toY, color, width, label) {
    const len = Math.hypot(toX - fromX, toY - fromY);
    if (len < 3) return; // Vector demasiado pequeño

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLen = 6;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

window.PhysicsLab = PhysicsLab;
window.HarmonicWaveLab = HarmonicWaveLab;
