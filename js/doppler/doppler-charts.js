/**
 * ============================================================================
 * MOTOR DE GRÁFICAS SINCRONIZADAS Y EXPORTACIÓN DE DATOS (CSV / PNG)
 * Cuaderno Interactivo de Física III • Universidad
 * 
 * - Gráficas sincronizadas en tiempo real:
 *   1. Frecuencias (fe emitida, fo teórica y f_medida experimental)
 *   2. Cinemática (posiciones x_f, x_o y distancia de separación d)
 *   3. Diagrama acústico espacio-temporal (x vs t / Rayos de sonido)
 *   4. Intervalos temporales de recepción (Δt_r vs índice de evento)
 * - Cursor temporal sincronizado.
 * - Ejes graduados, unidades y leyenda científica.
 * - Exportación de series temporales completas a CSV y captura gráfica a PNG.
 * ============================================================================
 */

export class DopplerChartsEngine {
  constructor(canvas, model) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.model = model;

    // Tipo de gráfica actual: 'frequency', 'kinematics', 'spacetime', 'intervals'
    this.activeTab = 'frequency';

    this.resize();
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

  setTab(tab) {
    this.activeTab = tab;
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    if (this.activeTab === 'frequency') {
      this.drawFrequencyChart();
    } else if (this.activeTab === 'kinematics') {
      this.drawKinematicsChart();
    } else if (this.activeTab === 'spacetime') {
      this.drawSpacetimeChart();
    } else if (this.activeTab === 'intervals') {
      this.drawIntervalsChart();
    }
  }

  /**
   * 1. Gráfica de Frecuencias: fe vs fo teórica vs f_medida experimental
   */
  drawFrequencyChart() {
    const ctx = this.ctx;
    const totalT = this.model.getTotalDuration();
    const currentT = this.model.simTime;
    const padL = 60, padR = 25, padT = 30, padB = 40;
    const plotW = this.width - padL - padR;
    const plotH = this.height - padT - padB;

    // Calcular rango de frecuencias a graficar
    const fe = this.model.f;
    let maxF = fe * 2.2;
    let minF = 0;

    // Muestrear valores de fo teórica
    const steps = 150;
    const foSamples = [];
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * totalT;
      const theo = this.model.getTheoreticalFrequency(t);
      const val = isFinite(theo.fo) ? Math.max(0, theo.fo) : null;
      foSamples.push({ t, val });
      if (val !== null && val < fe * 5) {
        if (val > maxF) maxF = val;
      }
    }
    maxF = Math.max(maxF * 1.15, fe * 1.5);

    this.drawAxes(padL, padR, padT, padB, plotW, plotH, totalT, minF, maxF, 'Tiempo t (s)', 'Frecuencia f (Hz)');

    // 1. Línea horizontal de fe emitida
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

    // 2. Curva de fo teórica
    ctx.save();
    ctx.strokeStyle = '#f59e0b'; // Ámbar
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    for (const pt of foSamples) {
      if (pt.val === null) {
        started = false;
        continue;
      }
      const x = padL + (pt.t / totalT) * plotW;
      const y = padT + plotH - ((pt.val - minF) / (maxF - minF)) * plotH;
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.restore();

    // 3. Puntos discretos de f_medida experimental
    ctx.save();
    for (const rec of this.model.receptions) {
      if (rec.f_measured !== null && isFinite(rec.f_measured) && rec.t_r <= totalT) {
        const x = padL + (rec.t_r / totalT) * plotW;
        const y = padT + plotH - ((rec.f_measured - minF) / (maxF - minF)) * plotH;

        if (y >= padT && y <= padT + plotH) {
          ctx.beginPath();
          ctx.arc(x, y, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ec4899'; // Rosa brillante
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    ctx.restore();

    // Cursor temporal
    this.drawTimeCursor(padL, padT, plotW, plotH, totalT, currentT);

    // Leyenda
    this.drawLegend([
      { label: `fe emitida (${fe.toFixed(1)} Hz)`, color: '#38bdf8', dashed: true },
      { label: 'fo teórica (retardada)', color: '#f59e0b', dashed: false },
      { label: 'f medida (cruces reales)', color: '#ec4899', isPoint: true }
    ], padL + 10, padT + 12);
  }

  /**
   * 2. Gráfica Cinemática: x_f(t), x_o(t) y separación d(t)
   */
  drawKinematicsChart() {
    const ctx = this.ctx;
    const totalT = this.model.getTotalDuration();
    const currentT = this.model.simTime;
    const padL = 60, padR = 25, padT = 30, padB = 40;
    const plotW = this.width - padL - padR;
    const plotH = this.height - padT - padB;

    // Rango espacial
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

    // Curva x_f(t)
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

    // Curva x_o(t)
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

  /**
   * 3. Diagrama Acústico Espacio-Temporal: Trayectorias de rayos de sonido (Minkowski acústico)
   */
  drawSpacetimeChart() {
    const ctx = this.ctx;
    const totalT = this.model.getTotalDuration();
    const currentT = this.model.simTime;
    const padL = 60, padR = 25, padT = 30, padB = 40;
    const plotW = this.width - padL - padR;
    const plotH = this.height - padT - padB;

    const p1 = this.model.getSourcePos(0);
    const p2 = this.model.getSourcePos(totalT);
    const o1 = this.model.getObsPos(0);
    const o2 = this.model.getObsPos(totalT);

    let minX = Math.min(p1.x, p2.x, o1.x, o2.x, 0) - 50;
    let maxX = Math.max(p1.x, p2.x, o1.x, o2.x, 100) + 50;

    this.drawAxes(padL, padR, padT, padB, plotW, plotH, totalT, minX, maxX, 'Tiempo t (s)', 'Posición x (m)');

    // Rayos de emisión hacia recepción
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

        // Punto de emisión y recepción
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
      { label: 'Rayos de onda acústica (te -> tr)', color: '#f59e0b', dashed: false },
      { label: 'Emisión en fuente', color: '#38bdf8', isPoint: true },
      { label: 'Recepción en observador', color: '#ec4899', isPoint: true }
    ], padL + 10, padT + 12);
  }

  /**
   * 4. Intervalos de tiempo entre recepciones consecutivas: Δt_r
   */
  drawIntervalsChart() {
    const ctx = this.ctx;
    const totalT = this.model.getTotalDuration();
    const padL = 60, padR = 25, padT = 30, padB = 40;
    const plotW = this.width - padL - padR;
    const plotH = this.height - padT - padB;

    const data = this.model.receptions.filter(r => r.dt_r !== null && r.t_r <= totalT);
    const maxN = Math.max(10, data.length + 1);

    const T_emit = this.model.T;
    let maxDt = T_emit * 2;
    for (const d of data) {
      if (d.dt_r > maxDt) maxDt = d.dt_r;
    }
    maxDt *= 1.2;

    this.drawAxes(padL, padR, padT, padB, plotW, plotH, maxN, 0, maxDt, 'Número de evento de llegada k', 'Intervalo Δtr (s)');

    // Línea de referencia del período de emisión T
    const yT = padT + plotH - (T_emit / maxDt) * plotH;
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, yT);
    ctx.lineTo(padL + plotW, yT);
    ctx.stroke();
    ctx.restore();

    // Barras o puntos de intervalos
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
      { label: 'Intervalo medido Δtr,k = tr,k - tr,k-1', color: '#10b981', isPoint: true }
    ], padL + 10, padT + 12);
  }

  drawAxes(padL, padR, padT, padB, plotW, plotH, xMax, yMin, yMax, xLabel, yLabel) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.lineWidth = 1;

    // Marco del área gráfica
    ctx.strokeRect(padL, padT, plotW, plotH);

    // Eje X ticks (5 subdivisiones)
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

    // Eje Y ticks (4 subdivisiones)
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

    // Títulos de ejes
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
    ctx.strokeStyle = '#ef4444'; // Línea roja vertical sincronizada
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

  /**
   * Exporta las series temporales físicas y de eventos en formato CSV
   */
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

    // Tabla de eventos discretos de recepción
    rows.push([]);
    rows.push(['# Evento Llegada', 'ID Frente', 'Instante Emision te (s)', 'Instante Llegada tr (s)', 'Tiempo de Vuelo (s)', 'Intervalo Δtr (s)', 'Frecuencia Medida (Hz)']);

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

  /**
   * Exporta la gráfica a PNG
   */
  exportPNG() {
    const dataUrl = this.canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `efecto_doppler_grafica_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }
}
