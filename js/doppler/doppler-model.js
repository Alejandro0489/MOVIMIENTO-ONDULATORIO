/**
 * ============================================================================
 * MOTOR FÍSICO Y MATEMÁTICO DEL EFECTO DOPPLER ACÚSTICO Y SUPERSÓNICO
 * Cuaderno Interactivo de Física III • Universidad
 * 
 * Implementación rigurosa en el Sistema Internacional (SI).
 * Coordenadas físicas en metros, tiempos en segundos, frecuencias en Hertz.
 * Solución exacta de eventos de emisión retardada y recepción analítica.
 * ============================================================================
 */

export class Vector2D {
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

/**
 * Representación inmutable de un frente de onda esférico/circular en el medio.
 * El centro permanece FIJO en el medio en el punto donde la fuente lo emitió:
 *   x_c,n = x_f(t_e,n)
 *   r_n(t) = c * (t - t_e,n)  para t >= t_e,n
 */
export class Wavefront {
  constructor(id, t_e, center) {
    this.id = id;                     // Índice entero n de emisión
    this.t_e = t_e;                   // Instante de emisión en segundos
    this.center = center.clone();     // Posición fija en el medio (Vector2D)
    this.t_r = null;                  // Instante analítico exacto de recepción en el observador
    this.receptionEvaluated = false;  // Bandera de cálculo
  }

  radius(t, c) {
    if (t < this.t_e) return 0;
    return c * (t - this.t_e);
  }

  isEmitted(t) {
    return t >= this.t_e;
  }
}

/**
 * Modelo Físico Completo
 */
export class DopplerModel {
  constructor(config = {}) {
    // Parámetros físicos primarios (SI)
    this.f = config.f !== undefined ? config.f : 2.0;          // Frecuencia emitida (Hz)
    this.c = config.c !== undefined ? config.c : 340.0;        // Rapidez en el medio (m/s)
    
    // Posición y velocidad de la fuente (SI: m, m/s)
    this.sourcePos0 = new Vector2D(config.sourceX0 !== undefined ? config.sourceX0 : -170.0, config.sourceY0 || 0);
    this.sourceVel = new Vector2D(config.sourceVx !== undefined ? config.sourceVx : 0.0, config.sourceVy || 0);

    // Posición y velocidad del observador (SI: m, m/s)
    this.obsPos0 = new Vector2D(config.obsX0 !== undefined ? config.obsX0 : 170.0, config.obsY0 || 0);
    this.obsVel = new Vector2D(config.obsVx !== undefined ? config.obsVx : 0.0, config.obsVy || 0);

    // Control de tiempo físico
    this.simTime = 0.0;                                       // t actual (s)
    this.duration = config.duration !== undefined ? config.duration : 10.0; // t total (s)
    this.durationMode = config.durationMode || 'fixed';       // 'fixed' o 'periods'
    this.numPeriods = config.numPeriods || 20;                 // N en modo períodos
    this.subdivisions = config.subdivisions || 100;           // Subdivisiones por período (20, 50, 100, 200)

    // Trayectorias personalizadas opcionales (función t -> Vector2D)
    this.sourceTrajectoryFn = null;
    this.obsTrajectoryFn = null;

    // Historial y colecciones de eventos
    this.wavefronts = [];
    this.receptions = [];
    this.lastProcessedTime = -0.0001;

    // Inicializar frentes y recepciones precalculadas
    this.rebuildExperiment();
  }

  // Período de emisión
  get T() {
    return this.f > 0 ? 1.0 / this.f : Infinity;
  }

  // Paso manual recomendado: dt = 1 / (subdivisions * f)
  get dtStep() {
    return this.f > 0 ? 1.0 / (this.subdivisions * this.f) : 0.01;
  }

  // Número de Mach de la fuente
  get Mach() {
    return this.c > 0 ? this.sourceVel.mag() / this.c : 0;
  }

  // Semíangulo de Mach en radianes (para Mach > 1)
  get machAngle() {
    const M = this.Mach;
    if (M > 1.0) {
      return Math.asin(1.0 / M);
    }
    return null;
  }

  // Semíangulo de Mach en grados
  get machAngleDeg() {
    const rad = this.machAngle;
    return rad !== null ? (rad * 180.0) / Math.PI : null;
  }

  // Longitud de onda en reposo respecto al medio
  get lambda0() {
    return this.f > 0 ? this.c / this.f : 0;
  }

  // Longitud de onda espacial delante (hacia +x de la velocidad)
  get lambdaFront() {
    if (this.f <= 0) return 0;
    const v = this.sourceVel.mag();
    return Math.max(0, (this.c - v) / this.f);
  }

  // Longitud de onda espacial detrás
  get lambdaBack() {
    if (this.f <= 0) return 0;
    const v = this.sourceVel.mag();
    return (this.c + v) / this.f;
  }

  // Duración total calculada según el modo
  getTotalDuration() {
    if (this.durationMode === 'periods') {
      return this.f > 0 ? this.numPeriods / this.f : this.duration;
    }
    return this.duration;
  }

  // Posición de la fuente en cualquier tiempo t
  getSourcePos(t) {
    if (this.sourceTrajectoryFn) {
      return this.sourceTrajectoryFn(t);
    }
    return this.sourcePos0.add(this.sourceVel.mult(t));
  }

  // Velocidad instantánea de la fuente en tiempo t
  getSourceVel(t) {
    if (this.sourceTrajectoryFn) {
      const dt = 1e-4;
      const p1 = this.sourceTrajectoryFn(t - dt);
      const p2 = this.sourceTrajectoryFn(t + dt);
      return p2.sub(p1).div(2 * dt);
    }
    return this.sourceVel.clone();
  }

  // Posición del observador en cualquier tiempo t
  getObsPos(t) {
    if (this.obsTrajectoryFn) {
      return this.obsTrajectoryFn(t);
    }
    return this.obsPos0.add(this.obsVel.mult(t));
  }

  // Velocidad instantánea del observador en tiempo t
  getObsVel(t) {
    if (this.obsTrajectoryFn) {
      const dt = 1e-4;
      const p1 = this.obsTrajectoryFn(t - dt);
      const p2 = this.obsTrajectoryFn(t + dt);
      return p2.sub(p1).div(2 * dt);
    }
    return this.obsVel.clone();
  }

  /**
   * Reconstruye de manera completamente determinista todas las emisiones del experimento.
   * La primera emisión ocurre exactamente en t = 0 (n = 0).
   * t_e,n = n / f
   */
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

      // Calcular instante exacto de recepción en el observador
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

    // Ordenar recepciones cronológicamente por t_r
    this.receptions.sort((a, b) => a.t_r - b.t_r);

    // Calcular intervalos entre recepciones sucesivas y frecuencia empírica medida
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

  /**
   * Calcula analíticamente el instante exacto t_r en que el frente emitido en t_e
   * intersecta al observador en movimiento.
   *
   * Ecuación: || x_o(t_r) - x_c || = c * (t_r - t_e)  con t_r >= t_e
   */
  calculateAnalyticalReception(wf) {
    const t_e = wf.t_e;
    const xc = wf.center;
    const c = this.c;

    // Si hay trayectoria personalizada, resolver por método numérico de bisección
    if (this.obsTrajectoryFn) {
      return this.solveReceptionNumerically(wf);
    }

    // Movimiento Rectilíneo Uniforme del observador:
    // x_o(t) = x_o0 + v_o * t
    // x_o(t) - x_c = (x_o0 - x_c) + v_o * t
    // Sea D = x_o0 - x_c.
    // || D + v_o * t_r ||^2 = c^2 * (t_r - t_e)^2
    // Desarrollando:
    // (v_o^2 - c^2) * t_r^2 + 2 * (D . v_o + c^2 * t_e) * t_r + (D^2 - c^2 * t_e^2) = 0
    const D = this.obsPos0.sub(xc);
    const vo = this.obsVel;

    const A = vo.magSq() - c * c;
    const B = 2.0 * (D.dot(vo) + c * c * t_e);
    const C = D.magSq() - c * c * t_e * t_e;

    // Caso A == 0 (|vo| == c)
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

    // Tomar la raíz física válida (primer cruce hacia adelante)
    validRoots.sort((a, b) => a - b);
    return validRoots[0];
  }

  /**
   * Resuelve numéricamente ||x_o(t) - x_c|| - c*(t - t_e) = 0 para trayectorias arbitrarias
   */
  solveReceptionNumerically(wf) {
    const t_e = wf.t_e;
    const xc = wf.center;
    const c = this.c;
    const totalT = this.getTotalDuration() * 1.5;

    const f = (t) => {
      const pos = this.getObsPos(t);
      return pos.dist(xc) - c * (t - t_e);
    };

    let tA = t_e;
    let tB = totalT;
    let valA = f(tA);
    let valB = f(tB);

    if (valA === 0) return t_e;

    // Búsqueda de cambio de signo en pasos finos
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

    // Bisección fina
    for (let iter = 0; iter < 40; iter++) {
      const mid = 0.5 * (tA + tB);
      const valMid = f(mid);
      if (Math.abs(valMid) < 1e-9 || Math.abs(tB - tA) < 1e-7) {
        return mid;
      }
      if (f(tA) * valMid < 0) {
        tB = mid;
      } else {
        tA = mid;
      }
    }

    return 0.5 * (tA + tB);
  }

  /**
   * Frecuencia teórica instantánea percibida:
   *   f_o = f_e * (c - n . v_o(t_r)) / (c - n . v_f(t_e))
   * Donde:
   *   n = (x_o(t_r) - x_f(t_e)) / || x_o(t_r) - x_f(t_e) ||
   *
   * @param {number} t - Tiempo actual de simulación
   */
  getTheoreticalFrequency(t) {
    if (this.f <= 0) return { fo: 0, status: 'Frecuencia nula' };

    // Si t == 0 y fuente y observador están separados, aún no ha llegado sonido
    const currDist = this.getSourcePos(t).dist(this.getObsPos(t));
    const minDelay = currDist / this.c;

    // Buscar el frente de onda que está cruzando el observador en el instante t
    // o aproximación cuasi-estacionaria si no hay cruce puntual
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

    if (dist < 1e-6) {
      return { fo: this.f, status: 'Coincidencia espacial' };
    }

    const n = xo.sub(xf).normalize(); // Vector unitario retardado
    const vf = this.getSourceVel(t_e);
    const vo = this.getObsVel(t_r);

    const denom = this.c - n.dot(vf);
    const numer = this.c - n.dot(vo);

    if (Math.abs(denom) < 1e-6) {
      return {
        fo: Infinity,
        status: 'Frente sónico coincidente (Singularidad Mach 1)',
        n,
        numer,
        denom
      };
    }

    const foRaw = this.f * (numer / denom);

    if (foRaw < 0) {
      return {
        fo: foRaw,
        status: 'Régimen supersónico (Ondas recibidas en orden inverso)',
        n,
        numer,
        denom
      };
    }

    return {
      fo: foRaw,
      status: 'Régimen acústico ordinario',
      n,
      numer,
      denom
    };
  }

  /**
   * Obtiene la medición independiente de frecuencia a partir de las llegadas
   * físicas acumuladas hasta el tiempo actual t.
   */
  getMeasuredFrequencyAt(t) {
    const pastReceptions = this.receptions.filter(r => r.t_r <= t + 1e-6);

    if (pastReceptions.length < 2) {
      return {
        count: pastReceptions.length,
        status: 'Esperando dos llegadas',
        f_measured: null,
        lastDt: null
      };
    }

    const last = pastReceptions[pastReceptions.length - 1];
    const prev = pastReceptions[pastReceptions.length - 2];
    const dt = last.t_r - prev.t_r;

    if (dt <= 1e-6) {
      return {
        count: pastReceptions.length,
        status: 'Llegada simultánea de frentes (Frente de choque)',
        f_measured: Infinity,
        lastDt: dt
      };
    }

    const f_measured = 1.0 / dt;
    return {
      count: pastReceptions.length,
      status: 'Medición empírica válida',
      f_measured,
      lastDt: dt,
      lastArrival: last.t_r
    };
  }

  /**
   * Detecta si en el intervalo de avance de tiempo [t_prev, t_curr]
   * se produjeron cruces de frentes con el observador.
   */
  getNewArrivals(t_prev, t_curr) {
    const arrivals = [];
    for (const rec of this.receptions) {
      if (rec.t_r > t_prev && rec.t_r <= t_curr + 1e-7) {
        arrivals.push(rec);
      }
    }
    return arrivals;
  }

  /**
   * Detecta si en el intervalo [t_prev, t_curr] la envolvente de Mach (cono de choque)
   * cruzó la posición del observador.
   */
  checkMachEnvelopeCrossing(t_prev, t_curr) {
    if (this.Mach <= 1.0) return false;

    // El cono de Mach tiene vértice en x_f(t) y ángulo mu = asin(1/M)
    // respecto a la dirección contraria a v_f.
    // La distancia de la recta tangente a los frentes de onda en el observador
    const mu = this.machAngle;
    const vfAngle = this.sourceVel.angle();

    const isInsideCone = (t) => {
      const xf = this.getSourcePos(t);
      const xo = this.getObsPos(t);
      const toObs = xo.sub(xf);
      const dist = toObs.mag();
      if (dist < 1e-4) return true;

      // Ángulo entre la dirección de avance de la fuente y el observador
      let angleDiff = Math.atan2(toObs.y, toObs.x) - vfAngle;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      // El cono se extiende hacia atrás (ángulo > pi - mu o < -(pi - mu))
      const backAngle = Math.PI - Math.abs(angleDiff);
      return backAngle <= mu + 1e-3;
    };

    const insidePrev = isInsideCone(t_prev);
    const insideCurr = isInsideCone(t_curr);

    // Cruce si entró al cono en este intervalo
    return !insidePrev && insideCurr;
  }

  /**
   * Avanza el tiempo de simulación y devuelve los eventos ocurridos.
   */
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

  /**
   * Fija el tiempo exactamente al valor solicitado (útil para scrubbers y saltos).
   */
  setTime(t) {
    const totalT = this.getTotalDuration();
    this.simTime = Math.max(0, Math.min(totalT, t));
    return this.simTime;
  }

  /**
   * Reinicia el experimento a t = 0 deterministamente.
   */
  reset() {
    this.simTime = 0.0;
    this.rebuildExperiment();
  }
}
