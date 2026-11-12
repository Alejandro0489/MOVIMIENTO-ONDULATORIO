/**
 * ============================================================================
 * RENDERIZADOR CANVAS 2D DE ALTA PRECISIÓN Y CONTROL DE CÁMARA
 * Cuaderno Interactivo de Física III • Universidad
 * 
 * - Coordenadas físicas en metros transformadas a píxeles de pantalla.
 * - Soporte Retina / devicePixelRatio.
 * - Zoom continuo centrado en cursor y paneo ilimitado.
 * - Cuadrícula métrica graduada y escala física.
 * - Trazado limpio de frentes de onda (sólido, discontinuo, punteado).
 * - Envolvente de cono de Mach para M > 1.
 * - Selección de fuentes: Punto emisor, Automóvil y Avión supersónico.
 * - Observador con marcador de muestreo acústico y respuesta visual de recepción.
 * - Inspección interactiva de frentes de onda por clic.
 * - Herramienta de regla métrica interactiva.
 * ============================================================================
 */

import { Vector2D } from './doppler-model.js';

export class DopplerCanvasRenderer {
  constructor(canvas, model) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.model = model;

    // Sistema de cámara y transformación de coordenadas
    // Escala inicial: píxeles por metro
    this.pixelsPerMeter = 1.0;
    this.originX = canvas.width / 2;
    this.originY = canvas.height / 2;

    // Estado visual y de estilo
    this.sourceType = 'point';     // 'point', 'car', 'plane'
    this.waveColor = '#38bdf8';    // Cian moderno de alto contraste
    this.waveWidth = 2.0;          // Grosor en píxeles de pantalla
    this.waveStyle = 'solid';      // 'solid', 'dashed', 'dotted'
    this.enableAttenuation = false; // Atenuación gráfica didáctica
    this.showVectors = true;
    this.showGrid = true;
    this.showWavelengths = true;
    this.trackSource = false;

    // Inspección de frentes y regla métrica
    this.selectedWavefrontId = null;
    this.rulerActive = false;
    this.rulerP1 = null;
    this.rulerP2 = null;

    // Resplandor de recepción en el observador
    this.observerPulseIntensity = 0.0;

    // Control de interacción y arrastre
    this.isDragging = false;
    this.dragTarget = null; // 'source', 'observer', 'pan', 'ruler'
    this.dragStart = { x: 0, y: 0 };
    this.dragWorldStart = { x: 0, y: 0 };

    this.initEvents();
    this.resize();
    this.fitScene();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);

    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
  }

  // Conversión: Metro (Mundo) -> Píxel (Pantalla)
  worldToScreen(wx, wy) {
    return {
      x: this.originX + wx * this.pixelsPerMeter,
      y: this.originY - wy * this.pixelsPerMeter
    };
  }

  // Conversión: Píxel (Pantalla) -> Metro (Mundo)
  screenToWorld(sx, sy) {
    return {
      x: (sx - this.originX) / this.pixelsPerMeter,
      y: -(sy - this.originY) / this.pixelsPerMeter
    };
  }

  triggerReceptionPulse() {
    this.observerPulseIntensity = 1.0;
  }

  /**
   * Ajusta la vista para encuadrar la fuente, el observador y los frentes
   */
  fitScene() {
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

  /**
   * Restaura la vista inicial
   */
  resetView() {
    this.pixelsPerMeter = 1.0;
    this.originX = this.width / 2;
    this.originY = this.height / 2;
    this.fitScene();
  }

  initEvents() {
    // Zoom con rueda centrado en el puntero
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

    // Puntero mouse/touch
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

    // Clic simple para seleccionar frentes de onda
    this.canvas.addEventListener('click', (e) => {
      if (this.rulerActive) return;
      const pos = getPos(e);
      this.handleSelectWavefront(pos);
    });
  }

  handlePointerDown(pos, button) {
    const world = this.screenToWorld(pos.x, pos.y);
    this.dragStart = { ...pos };
    this.dragWorldStart = { ...world };

    // Regla de medición activa
    if (this.rulerActive) {
      if (!this.rulerP1 || (this.rulerP1 && this.rulerP2)) {
        this.rulerP1 = new Vector2D(world.x, world.y);
        this.rulerP2 = null;
      } else {
        this.rulerP2 = new Vector2D(world.x, world.y);
      }
      return;
    }

    // Botón secundario o central -> Paneo
    if (button === 1 || button === 2) {
      this.isDragging = true;
      this.dragTarget = 'pan';
      return;
    }

    // Comprobar si se tocó la Fuente o el Observador
    const srcPos = this.model.getSourcePos(this.model.simTime);
    const obsPos = this.model.getObsPos(this.model.simTime);

    const distSrc = Math.hypot(world.x - srcPos.x, world.y - srcPos.y);
    const distObs = Math.hypot(world.x - obsPos.x, world.y - obsPos.y);

    const hitThreshold = 30 / this.pixelsPerMeter;

    if (distSrc < hitThreshold) {
      this.isDragging = true;
      this.dragTarget = 'source';
    } else if (distObs < hitThreshold) {
      this.isDragging = true;
      this.dragTarget = 'observer';
    } else {
      // Arrastrar fondo para desplazar (pan)
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
    let minErr = 15 / this.pixelsPerMeter; // Margen de selección en metros

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

  /**
   * Bucle principal de dibujo
   */
  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const t = this.model.simTime;

    // Actualizar seguimiento de fuente si está activo
    if (this.trackSource) {
      const src = this.model.getSourcePos(t);
      this.originX = w / 2 - src.x * this.pixelsPerMeter;
      this.originY = h / 2 + src.y * this.pixelsPerMeter;
    }

    // Limpiar fondo
    ctx.clearRect(0, 0, w, h);

    // Dibujar cuadrícula y ejes
    if (this.showGrid) {
      this.drawGrid();
    }

    // Dibujar frentes de onda esféricos/circulares
    this.drawWavefronts(t);

    // Dibujar envolvente de Mach (si M > 1)
    if (this.model.Mach > 1.0) {
      this.drawMachCone(t);
    }

    // Dibujar cotas de longitud de onda (lambda delante y detrás)
    if (this.showWavelengths) {
      this.drawWavelengthAnnotations(t);
    }

    // Dibujar Fuente
    this.drawSource(t);

    // Dibujar Observador
    this.drawObserver(t);

    // Dibujar Regla métrica si está activa
    if (this.rulerActive && this.rulerP1) {
      this.drawRuler();
    }

    // Dibujar Escala de referencia métrica
    this.drawScaleBar();

    // Reducir pulso de llegada visual
    if (this.observerPulseIntensity > 0) {
      this.observerPulseIntensity = Math.max(0, this.observerPulseIntensity - 0.05);
    }
  }

  drawGrid() {
    const ctx = this.ctx;
    const ppm = this.pixelsPerMeter;

    // Determinar espaciado métrico agradable según el zoom
    const targetPx = 80;
    const rawStep = targetPx / ppm;
    const power = Math.pow(10, Math.floor(Math.log10(rawStep)));
    let stepMeters = power;
    if (rawStep / power > 5) stepMeters = power * 5;
    else if (rawStep / power > 2) stepMeters = power * 2;

    const stepPx = stepMeters * ppm;

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(120, 140, 170, 0.12)';
    ctx.fillStyle = 'rgba(140, 160, 190, 0.65)';
    ctx.font = '10px "JetBrains Mono", monospace';

    // Líneas verticales
    const startX = this.originX % stepPx;
    for (let x = startX; x <= this.width; x += stepPx) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();

      const worldX = (x - this.originX) / ppm;
      if (Math.abs(worldX) > 1e-4) {
        ctx.fillText(`${Math.round(worldX)}m`, x + 4, this.originY + 14);
      }
    }

    // Líneas horizontales
    const startY = this.originY % stepPx;
    for (let y = startY; y <= this.height; y += stepPx) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();

      const worldY = -(y - this.originY) / ppm;
      if (Math.abs(worldY) > 1e-4) {
        ctx.fillText(`${Math.round(worldY)}m`, this.originX + 4, y - 4);
      }
    }

    // Ejes cartesianos principales
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(180, 200, 230, 0.35)';

    // Eje X
    ctx.beginPath();
    ctx.moveTo(0, this.originY);
    ctx.lineTo(this.width, this.originY);
    ctx.stroke();

    // Eje Y
    ctx.beginPath();
    ctx.moveTo(this.originX, 0);
    ctx.lineTo(this.originX, this.height);
    ctx.stroke();

    // Origen (0,0)
    ctx.fillStyle = 'rgba(240, 210, 150, 0.9)';
    ctx.fillText('0,0', this.originX + 5, this.originY - 5);

    ctx.restore();
  }

  drawWavefronts(t) {
    const ctx = this.ctx;
    const c = this.model.c;
    const maxRadius = c * this.model.getTotalDuration();

    ctx.save();
    ctx.lineWidth = this.waveWidth;

    if (this.waveStyle === 'dashed') {
      ctx.setLineDash([8, 6]);
    } else if (this.waveStyle === 'dotted') {
      ctx.setLineDash([3, 4]);
    } else {
      ctx.setLineDash([]);
    }

    for (const wf of this.model.wavefronts) {
      if (!wf.isEmitted(t)) continue;

      const rMeters = wf.radius(t, c);
      const rPx = rMeters * this.pixelsPerMeter;
      if (rPx <= 0) continue;

      const centerScreen = this.worldToScreen(wf.center.x, wf.center.y);

      // Descartar solo si está completamente fuera del campo de visión extendido
      if (
        centerScreen.x + rPx < -200 ||
        centerScreen.x - rPx > this.width + 200 ||
        centerScreen.y + rPx < -200 ||
        centerScreen.y - rPx > this.height + 200
      ) {
        continue;
      }

      const isSelected = wf.id === this.selectedWavefrontId;

      let alpha = 0.85;
      if (this.enableAttenuation && maxRadius > 0) {
        alpha = Math.max(0.18, 0.9 - 0.75 * (rMeters / maxRadius));
      }

      ctx.beginPath();
      ctx.arc(centerScreen.x, centerScreen.y, rPx, 0, Math.PI * 2);

      if (isSelected) {
        ctx.strokeStyle = '#f59e0b'; // Ámbar brillante para frente inspeccionado
        ctx.lineWidth = this.waveWidth + 2;
      } else {
        ctx.strokeStyle = this.waveColor;
        ctx.lineWidth = this.waveWidth;
      }

      ctx.globalAlpha = isSelected ? 1.0 : alpha;
      ctx.stroke();

      // Si está seleccionado, dibujar marcador del centro de emisión original
      if (isSelected) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(centerScreen.x, centerScreen.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Etiqueta con datos del frente seleccionado
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px "JetBrains Mono", monospace';
        const label = `Frente #${wf.id} | te=${wf.t_e.toFixed(2)}s | r=${rMeters.toFixed(1)}m`;
        ctx.fillText(label, centerScreen.x + 8, centerScreen.y - 8);
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

    // Los dos rayos de la envolvente salen del vértice (fuente) hacia atrás en ángulos:
    // theta1 = vfAngle + Math.PI - mu
    // theta2 = vfAngle + Math.PI + mu
    const lengthMeters = (this.width / this.pixelsPerMeter) * 2;
    const a1 = vfAngle + Math.PI - mu;
    const a2 = vfAngle + Math.PI + mu;

    const p1World = new Vector2D(
      srcPos.x + lengthMeters * Math.cos(a1),
      srcPos.y + lengthMeters * Math.sin(a1)
    );
    const p2World = new Vector2D(
      srcPos.x + lengthMeters * Math.cos(a2),
      srcPos.y + lengthMeters * Math.sin(a2)
    );

    const s1 = this.worldToScreen(p1World.x, p1World.y);
    const s2 = this.worldToScreen(p2World.x, p2World.y);

    ctx.save();
    // Área sombreada del cono de Mach
    ctx.beginPath();
    ctx.moveTo(srcScreen.x, srcScreen.y);
    ctx.lineTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)'; // Rojo tenue
    ctx.fill();

    // Líneas tangentes de choque
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(srcScreen.x, srcScreen.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.strokeStyle = '#ef4444'; // Rojo choque
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();

    // Etiqueta del cono
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
    if (this.model.f <= 0) return;
    const c = this.model.c;
    const vMag = this.model.sourceVel.mag();
    if (vMag >= c) return; // En supersónico los frentes delanteros no forman longitudes subsónicas

    // Encontrar dos frentes emitidos consecutivos para medir longitud de onda
    const emitted = this.model.wavefronts.filter(w => w.isEmitted(t));
    if (emitted.length < 2) return;

    const w1 = emitted[emitted.length - 1]; // más reciente
    const w2 = emitted[emitted.length - 2]; // anterior

    const ctx = this.ctx;
    ctx.save();
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.lineWidth = 1.5;

    // Vector de dirección de movimiento
    const dir = this.model.sourceVel.mag() > 0 ? this.model.sourceVel.normalize() : new Vector2D(1, 0);

    // Punto delantero entre ambos frentes
    const r1 = w1.radius(t, c);
    const r2 = w2.radius(t, c);

    const frontPt1 = w1.center.add(dir.mult(r1));
    const frontPt2 = w2.center.add(dir.mult(r2));

    const sFront1 = this.worldToScreen(frontPt1.x, frontPt1.y);
    const sFront2 = this.worldToScreen(frontPt2.x, frontPt2.y);

    // Cota delantera
    ctx.strokeStyle = '#10b981'; // Verde esmeralda
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(sFront1.x, sFront1.y);
    ctx.lineTo(sFront2.x, sFront2.y);
    ctx.stroke();

    // Ticks en los extremos
    ctx.beginPath();
    ctx.arc(sFront1.x, sFront1.y, 2.5, 0, Math.PI * 2);
    ctx.arc(sFront2.x, sFront2.y, 2.5, 0, Math.PI * 2);
    ctx.fill();

    const lambdaF = this.model.lambdaFront;
    ctx.fillText(`λdelante = ${lambdaF.toFixed(1)}m`, (sFront1.x + sFront2.x) / 2 - 40, sFront1.y - 10);

    ctx.restore();
  }

  drawSource(t) {
    const ctx = this.ctx;
    const pos = this.model.getSourcePos(t);
    const screen = this.worldToScreen(pos.x, pos.y);
    const vel = this.model.getSourceVel(t);

    ctx.save();

    // Vector de velocidad
    if (this.showVectors && vel.mag() > 0.1) {
      this.drawVectorArrow(pos, vel, '#38bdf8', `vf = ${vel.mag().toFixed(1)} m/s`);
    }

    // Dibujo según el sprite seleccionado
    if (this.sourceType === 'car') {
      this.drawCarSprite(screen, vel);
    } else if (this.sourceType === 'plane') {
      this.drawPlaneSprite(screen, vel);
    } else {
      this.drawPointSourceSprite(screen);
    }

    // Etiqueta identificativa
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px "Outfit", sans-serif';
    ctx.fillText('Fuente (S)', screen.x - 28, screen.y + 24);

    ctx.restore();
  }

  drawPointSourceSprite(screen) {
    const ctx = this.ctx;
    // Anillo exterior pulsante
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Núcleo
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#0284c7';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  drawCarSprite(screen, vel) {
    const ctx = this.ctx;
    const angle = vel.mag() > 0.1 ? vel.angle() : 0;

    ctx.save();
    ctx.translate(screen.x, screen.y);
    ctx.rotate(angle);

    // Carrocería
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-16, -9, 32, 18);

    // Cabina
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-6, -7, 16, 14);

    // Ruedas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-12, -11, 8, 3);
    ctx.fillRect(4, -11, 8, 3);
    ctx.fillRect(-12, 8, 8, 3);
    ctx.fillRect(4, 8, 8, 3);

    // Bocina / Emisor
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(16, 0, 4, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    ctx.restore();
  }

  drawPlaneSprite(screen, vel) {
    const ctx = this.ctx;
    const angle = vel.mag() > 0.1 ? vel.angle() : 0;

    ctx.save();
    ctx.translate(screen.x, screen.y);
    ctx.rotate(angle);

    // Fuselaje
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-14, -6);
    ctx.lineTo(-18, 0);
    ctx.lineTo(-14, 6);
    ctx.closePath();
    ctx.fill();

    // Alas delta supersónicas
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(-12, -18);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-12, 18);
    ctx.closePath();
    ctx.fill();

    // Nariz
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(18, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawObserver(t) {
    const ctx = this.ctx;
    const pos = this.model.getObsPos(t);
    const screen = this.worldToScreen(pos.x, pos.y);
    const vel = this.model.getObsVel(t);

    ctx.save();

    // Vector de velocidad del observador
    if (this.showVectors && vel.mag() > 0.1) {
      this.drawVectorArrow(pos, vel, '#ec4899', `vo = ${vel.mag().toFixed(1)} m/s`);
    }

    // Efecto de pulso de recepción acústica
    if (this.observerPulseIntensity > 0) {
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, 16 + 18 * this.observerPulseIntensity, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(236, 72, 153, ${this.observerPulseIntensity})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Icono del observador: Micrófono / Sensor
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(screen.x, screen.y - 4, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#be185d';
    ctx.fillRect(screen.x - 3, screen.y + 3, 6, 9);

    // Base del trípode
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screen.x - 8, screen.y + 16);
    ctx.lineTo(screen.x, screen.y + 12);
    ctx.lineTo(screen.x + 8, screen.y + 16);
    ctx.stroke();

    // Cruz de muestreo exacta
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(screen.x - 5, screen.y - 4);
    ctx.lineTo(screen.x + 5, screen.y - 4);
    ctx.moveTo(screen.x, screen.y - 9);
    ctx.lineTo(screen.x, screen.y + 1);
    ctx.stroke();

    // Etiqueta
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px "Outfit", sans-serif';
    ctx.fillText('Observador (O)', screen.x - 38, screen.y + 30);

    ctx.restore();
  }

  drawVectorArrow(worldOrigin, worldVec, color, label) {
    const ctx = this.ctx;
    const sOrigin = this.worldToScreen(worldOrigin.x, worldOrigin.y);

    // Escalar la longitud gráfica de la flecha
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

    // Línea principal
    ctx.beginPath();
    ctx.moveTo(sOrigin.x, sOrigin.y);
    ctx.lineTo(sEnd.x, sEnd.y);
    ctx.stroke();

    // Cabeza de la flecha
    const headLen = 9;
    const a = Math.atan2(-(sEnd.y - sOrigin.y), sEnd.x - sOrigin.x);
    ctx.beginPath();
    ctx.moveTo(sEnd.x, sEnd.y);
    ctx.lineTo(sEnd.x - headLen * Math.cos(a - Math.PI / 6), sEnd.y + headLen * Math.sin(a - Math.PI / 6));
    ctx.lineTo(sEnd.x - headLen * Math.cos(a + Math.PI / 6), sEnd.y + headLen * Math.sin(a + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Texto de magnitud
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

    // Escala métrica en la esquina inferior izquierda
    const targetPx = 100;
    const barMeters = Math.round(targetPx / ppm);
    const barPx = barMeters * ppm;

    const x = 20;
    const y = this.height - 24;

    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.fillStyle = '#cbd5e1';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + barPx, y);
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x, y + 5);
    ctx.moveTo(x + barPx, y - 5);
    ctx.lineTo(x + barPx, y + 5);
    ctx.stroke();

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`${barMeters} m`, x + barPx / 2 - 12, y - 8);

    ctx.restore();
  }
}
