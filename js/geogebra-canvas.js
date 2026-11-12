/**
 * ============================================================================
 * MOTOR DE PLANOS CARTESIANOS INTERACTIVOS (ESTILO GEOGEBRA)
 * Cuaderno Digital Interactivo: Física 3 - Movimiento Ondulatorio
 * ============================================================================
 */

class GeogebraPlotter {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.wrapper = this.canvas.parentElement;

    // Opciones y configuración
    this.options = Object.assign({
      xMin: -0.5,
      xMax: 6.5,
      yMin: -3.5,
      yMax: 3.5,
      aspectRatioLocked: false,
      enableRulers: true,
      rulerXId: 'ruler-x',
      rulerYId: 'ruler-y',
      tooltipId: 'geo-tooltip',
      defaultA: 1.5,
      defaultOmega: 2.0,
      defaultPhi: 0.0
    }, options);

    // Estado de vista
    this.initialBounds = {
      xMin: this.options.xMin,
      xMax: this.options.xMax,
      yMin: this.options.yMin,
      yMax: this.options.yMax
    };

    this.xMin = this.initialBounds.xMin;
    this.xMax = this.initialBounds.xMax;
    this.yMin = this.initialBounds.yMin;
    this.yMax = this.initialBounds.yMax;

    // Parámetros físicos dinámicos
    this.params = {
      A: this.options.defaultA,
      omega: this.options.defaultOmega,
      phi: this.options.defaultPhi,
      tCurrent: 0.0
    };

    // Estilos de curvas
    this.curveStyles = {
      pos: {
        visible: true,
        name: 'Elongación x(t)',
        color: '#2563eb',
        width: 3.0,
        opacity: 0.95,
        dash: [] // sólido
      },
      vel: {
        visible: true,
        name: 'Velocidad v(t)',
        color: '#16a34a',
        width: 2.5,
        opacity: 0.85,
        dash: [6, 4] // segmentado
      },
      acc: {
        visible: true,
        name: 'Aceleración a(t)',
        color: '#dc2626',
        width: 2.5,
        opacity: 0.85,
        dash: [2, 4] // punteado
      }
    };

    // Herramienta activa: 'pan', 'select', 'measure'
    this.activeTool = 'pan';
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.probePoint = null; // Punto de inspección activo

    // Reglas y tooltip
    this.rulerX = document.getElementById(this.options.rulerXId);
    this.rulerY = document.getElementById(this.options.rulerYId);
    this.tooltip = document.getElementById(this.options.tooltipId);

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Eventos de interacción de ratón y táctil
    this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
    window.addEventListener('mousemove', (e) => this.onPointerMove(e));
    window.addEventListener('mouseup', (e) => this.onPointerUp(e));

    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    // Touch
    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));

    this.draw();
  }

  resize() {
    const rect = this.wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    this.draw();
  }

  // Conversiones de coordenadas
  worldToScreen(x, y) {
    const sx = ((x - this.xMin) / (this.xMax - this.xMin)) * this.width;
    const sy = this.height - ((y - this.yMin) / (this.yMax - this.yMin)) * this.height;
    return { x: sx, y: sy };
  }

  screenToWorld(sx, sy) {
    const x = this.xMin + (sx / this.width) * (this.xMax - this.xMin);
    const y = this.yMin + ((this.height - sy) / this.height) * (this.yMax - this.yMin);
    return { x, y };
  }

  // Interacción: Ratón
  onPointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (this.activeTool === 'pan') {
      this.isDragging = true;
      this.dragStart = { x: sx, y: sy };
      this.canvas.classList.add('panning');
    } else if (this.activeTool === 'select') {
      const world = this.screenToWorld(sx, sy);
      this.probePoint = world;
      this.updateTooltip(sx, sy, world);
      this.draw();
    }
  }

  onPointerMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (this.isDragging && this.activeTool === 'pan') {
      const dx = sx - this.dragStart.x;
      const dy = sy - this.dragStart.y;

      const worldWidth = this.xMax - this.xMin;
      const worldHeight = this.yMax - this.yMin;

      const deltaX = (dx / this.width) * worldWidth;
      const deltaY = (dy / this.height) * worldHeight;

      this.xMin -= deltaX;
      this.xMax -= deltaX;
      this.yMin += deltaY;
      this.yMax += deltaY;

      this.dragStart = { x: sx, y: sy };
      this.draw();
    } else if (this.activeTool === 'select' && sx >= 0 && sx <= this.width && sy >= 0 && sy <= this.height) {
      const world = this.screenToWorld(sx, sy);
      this.probePoint = world;
      this.updateTooltip(sx, sy, world);
      this.draw();
    }
  }

  onPointerUp() {
    this.isDragging = false;
    this.canvas.classList.remove('panning');
  }

  onWheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 1.12 : 0.89;
    this.zoomAt(sx, sy, zoomFactor);
  }

  onTouchStart(e) {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      this.onPointerDown({ clientX: t.clientX, clientY: t.clientY });
    }
  }

  onTouchMove(e) {
    if (e.touches.length === 1) {
      e.preventDefault();
      const t = e.touches[0];
      this.onPointerMove({ clientX: t.clientX, clientY: t.clientY });
    }
  }

  onTouchEnd() {
    this.onPointerUp();
  }

  zoomAt(sx, sy, factor) {
    const mouseWorld = this.screenToWorld(sx, sy);
    const newWidth = (this.xMax - this.xMin) * factor;
    const newHeight = (this.yMax - this.yMin) * factor;

    const rx = sx / this.width;
    const ry = (this.height - sy) / this.height;

    this.xMin = mouseWorld.x - rx * newWidth;
    this.xMax = this.xMin + newWidth;
    this.yMin = mouseWorld.y - ry * newHeight;
    this.yMax = this.yMin + newHeight;

    this.draw();
  }

  zoomIn() {
    this.zoomAt(this.width / 2, this.height / 2, 0.82);
  }

  zoomOut() {
    this.zoomAt(this.width / 2, this.height / 2, 1.22);
  }

  resetView() {
    this.xMin = this.initialBounds.xMin;
    this.xMax = this.initialBounds.xMax;
    this.yMin = this.initialBounds.yMin;
    this.yMax = this.initialBounds.yMax;
    this.probePoint = null;
    if (this.tooltip) this.tooltip.style.display = 'none';
    this.draw();
  }

  setTool(tool) {
    this.activeTool = tool;
    this.canvas.classList.remove('panning', 'selecting');
    if (tool === 'select') {
      this.canvas.classList.add('selecting');
    }
  }

  updateTooltip(sx, sy, world) {
    if (!this.tooltip) return;
    const t = world.x;
    const { A, omega, phi } = this.params;
    const xVal = A * Math.cos(omega * t + phi);
    const vVal = -A * omega * Math.sin(omega * t + phi);
    const aVal = -A * omega * omega * Math.cos(omega * t + phi);

    this.tooltip.style.display = 'block';
    this.tooltip.style.left = `${sx + 14}px`;
    this.tooltip.style.top = `${sy - 20}px`;
    this.tooltip.innerHTML = `
      <div style="font-weight:700; color:#c59b27; margin-bottom:2px;">t = ${t.toFixed(2)} s</div>
      <div style="color:${this.curveStyles.pos.color}">x(t) = ${xVal.toFixed(3)} m</div>
      <div style="color:${this.curveStyles.vel.color}">v(t) = ${vVal.toFixed(3)} m/s</div>
      <div style="color:${this.curveStyles.acc.color}">a(t) = ${aVal.toFixed(3)} m/s²</div>
    `;
  }

  // =========================================================================
  // DIBUJADO DE CUADRÍCULA MILIMETRADA Y EJES CARTESIANOS
  // =========================================================================
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Fondo papel pergamino milimetrado
    ctx.fillStyle = '#faf5ec';
    ctx.fillRect(0, 0, this.width, this.height);

    const xRange = this.xMax - this.xMin;
    const yRange = this.yMax - this.yMin;

    // Cálculo dinámico del paso de la cuadrícula
    const gridStepX = this.calculateGridStep(xRange);
    const gridStepY = this.calculateGridStep(yRange);

    // Cuadrícula menor (apariencia papel milimetrado)
    const subStepX = gridStepX / 5;
    const subStepY = gridStepY / 5;

    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(180, 140, 100, 0.16)';
    ctx.beginPath();
    const startSubX = Math.floor(this.xMin / subStepX) * subStepX;
    for (let x = startSubX; x <= this.xMax; x += subStepX) {
      const p = this.worldToScreen(x, 0);
      ctx.moveTo(p.x, 0);
      ctx.lineTo(p.x, this.height);
    }
    const startSubY = Math.floor(this.yMin / subStepY) * subStepY;
    for (let y = startSubY; y <= this.yMax; y += subStepY) {
      const p = this.worldToScreen(0, y);
      ctx.moveTo(0, p.y);
      ctx.lineTo(this.width, p.y);
    }
    ctx.stroke();

    // Cuadrícula mayor principal
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(140, 95, 55, 0.32)';
    ctx.beginPath();
    const startMajorX = Math.floor(this.xMin / gridStepX) * gridStepX;
    for (let x = startMajorX; x <= this.xMax; x += gridStepX) {
      const p = this.worldToScreen(x, 0);
      ctx.moveTo(p.x, 0);
      ctx.lineTo(p.x, this.height);
    }
    const startMajorY = Math.floor(this.yMin / gridStepY) * gridStepY;
    for (let y = startMajorY; y <= this.yMax; y += gridStepY) {
      const p = this.worldToScreen(0, y);
      ctx.moveTo(0, p.y);
      ctx.lineTo(this.width, p.y);
    }
    ctx.stroke();

    // Ejes Cartesianos Principales X e Y
    const origin = this.worldToScreen(0, 0);

    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#2b1c12';
    ctx.beginPath();

    // Eje X
    if (origin.y >= 0 && origin.y <= this.height) {
      ctx.moveTo(0, origin.y);
      ctx.lineTo(this.width, origin.y);
    }
    // Eje Y
    if (origin.x >= 0 && origin.x <= this.width) {
      ctx.moveTo(origin.x, 0);
      ctx.lineTo(origin.x, this.height);
    }
    ctx.stroke();

    // Etiquetas y Ticks numéricos
    ctx.fillStyle = '#442e1f';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Ticks en X
    for (let x = startMajorX; x <= this.xMax; x += gridStepX) {
      if (Math.abs(x) < 1e-9) continue;
      const p = this.worldToScreen(x, 0);
      const tickY = Math.min(Math.max(origin.y, 16), this.height - 20);

      ctx.beginPath();
      ctx.moveTo(p.x, tickY - 4);
      ctx.lineTo(p.x, tickY + 4);
      ctx.stroke();

      ctx.fillText(this.formatNumber(x), p.x, tickY + 6);
    }

    // Ticks en Y
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = startMajorY; y <= this.yMax; y += gridStepY) {
      if (Math.abs(y) < 1e-9) continue;
      const p = this.worldToScreen(0, y);
      const tickX = Math.min(Math.max(origin.x, 24), this.width - 24);

      ctx.beginPath();
      ctx.moveTo(tickX - 4, p.y);
      ctx.lineTo(tickX + 4, p.y);
      ctx.stroke();

      ctx.fillText(this.formatNumber(y), tickX - 6, p.y);
    }

    // Flechas y nombres de ejes
    ctx.font = 'bold 12px "Outfit", sans-serif';
    ctx.fillStyle = '#2b1c12';
    ctx.fillText('Tiempo t (s)', this.width - 12, Math.min(Math.max(origin.y - 12, 10), this.height - 30));
    ctx.save();
    ctx.textAlign = 'left';
    ctx.fillText('Magnitud [x, v, a]', Math.min(Math.max(origin.x + 8, 10), this.width - 120), 16);
    ctx.restore();

    // Dibujar Curvas Físicas
    this.drawCurves();

    // Marcador de tiempo instantáneo
    this.drawCurrentTimeMarker();

    // Punto de inspección sonda si existe
    if (this.probePoint) {
      this.drawProbeGuides();
    }
  }

  calculateGridStep(range) {
    const rawStep = range / 8;
    const exponent = Math.floor(Math.log10(rawStep));
    const fraction = rawStep / Math.pow(10, exponent);
    let niceFraction = 1;
    if (fraction >= 1.5 && fraction < 3.5) niceFraction = 2;
    else if (fraction >= 3.5 && fraction < 7.5) niceFraction = 5;
    else if (fraction >= 7.5) niceFraction = 10;
    return niceFraction * Math.pow(10, exponent);
  }

  formatNumber(val) {
    if (Math.abs(val) < 1e-6) return '0';
    if (Math.abs(val) >= 1000 || Math.abs(val) < 0.01) return val.toExponential(1);
    return parseFloat(val.toFixed(2)).toString();
  }

  // Dibujado de las curvas físicas
  drawCurves() {
    const ctx = this.ctx;
    const { A, omega, phi } = this.params;

    // Curva Posición: x(t) = A cos(omega t + phi)
    if (this.curveStyles.pos.visible) {
      this.plotFunction(t => A * Math.cos(omega * t + phi), this.curveStyles.pos);
    }

    // Curva Velocidad: v(t) = -A omega sin(omega t + phi)
    if (this.curveStyles.vel.visible) {
      this.plotFunction(t => -A * omega * Math.sin(omega * t + phi), this.curveStyles.vel);
    }

    // Curva Aceleración: a(t) = -A omega^2 cos(omega t + phi)
    if (this.curveStyles.acc.visible) {
      this.plotFunction(t => -A * omega * omega * Math.cos(omega * t + phi), this.curveStyles.acc);
    }
  }

  plotFunction(fn, style) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.width;
    ctx.globalAlpha = style.opacity;
    ctx.setLineDash(style.dash || []);

    ctx.beginPath();
    let isFirst = true;
    const steps = Math.min(this.width * 1.5, 1200);
    const dt = (this.xMax - this.xMin) / steps;

    for (let i = 0; i <= steps; i++) {
      const t = this.xMin + i * dt;
      const y = fn(t);
      const p = this.worldToScreen(t, y);

      if (isFirst) {
        ctx.moveTo(p.x, p.y);
        isFirst = false;
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  drawCurrentTimeMarker() {
    const ctx = this.ctx;
    const t = this.params.tCurrent;
    if (t < this.xMin || t > this.xMax) return;

    const p = this.worldToScreen(t, 0);
    ctx.save();
    ctx.strokeStyle = '#c59b27';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(p.x, 0);
    ctx.lineTo(p.x, this.height);
    ctx.stroke();
    ctx.restore();

    // Puntos en cada curva activa en tActual
    const { A, omega, phi } = this.params;
    const curves = [
      { style: this.curveStyles.pos, val: A * Math.cos(omega * t + phi) },
      { style: this.curveStyles.vel, val: -A * omega * Math.sin(omega * t + phi) },
      { style: this.curveStyles.acc, val: -A * omega * omega * Math.cos(omega * t + phi) }
    ];

    curves.forEach(c => {
      if (!c.style.visible) return;
      const pt = this.worldToScreen(t, c.val);
      ctx.save();
      ctx.fillStyle = c.style.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.restore();
    });
  }

  drawProbeGuides() {
    const ctx = this.ctx;
    const { x } = this.probePoint;
    if (x < this.xMin || x > this.xMax) return;

    const sp = this.worldToScreen(x, 0);
    ctx.save();
    ctx.strokeStyle = '#736152';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(sp.x, 0);
    ctx.lineTo(sp.x, this.height);
    ctx.stroke();
    ctx.restore();
  }

  // Métodos de control de parámetros en tiempo real
  setParams(A, omega, phi, tCurrent) {
    if (A !== undefined) this.params.A = A;
    if (omega !== undefined) this.params.omega = omega;
    if (phi !== undefined) this.params.phi = phi;
    if (tCurrent !== undefined) this.params.tCurrent = tCurrent;
    this.draw();
  }

  setCurveStyle(curveKey, updates) {
    if (this.curveStyles[curveKey]) {
      Object.assign(this.curveStyles[curveKey], updates);
      this.draw();
    }
  }
}

window.GeogebraPlotter = GeogebraPlotter;
