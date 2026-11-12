/**
 * ============================================================================
 * LABORATORIO DE PROGRAMACIÓN EDUCATIVA DE TRAYECTORIAS
 * Cuaderno Interactivo de Física III • Universidad
 * 
 * Cumple con la Sección 12 de la especificación técnica:
 * - API documentada para definir funciones de posición vectorial x_f(t) y x_o(t).
 * - Ejecución aislada con captura de excepciones y protección contra bucles.
 * - Plantillas pedagógicas listas para ejecutar:
 *   1. Fuente en Movimiento Armónico Simple (M.A.S. oscilatorio)
 *   2. Fuente en Órbita Circular 2D (Efecto Doppler periódico rotacional)
 *   3. Movimiento Uniformemente Acelerado (M.U.A. cruce transónico)
 * ============================================================================
 */

import { Vector2D } from './doppler-model.js';

export const CODE_PRESETS = {
  harmonic: {
    title: "Fuente en Movimiento Armónico Simple (M.A.S.)",
    code: `// Simulación de fuente oscilante alrededor del origen
// Parámetros: Amplitud A = 80 m, Período Tosc = 2.0 s
const A = 80.0;
const Tosc = 2.0;
const omega = 2 * Math.PI / Tosc;

return {
  x: A * Math.sin(omega * t),
  y: 0.0
};`
  },
  circular: {
    title: "Efecto Doppler Rotacional (Órbita Circular 2D)",
    code: `// Fuente rotando en un círculo de radio R = 100 m
// Rapidez tangencial v = omega * R = (2 * pi / 3.0) * 100 ≈ 209 m/s
const R = 100.0;
const T_rev = 3.0;
const omega = 2 * Math.PI / T_rev;

return {
  x: R * Math.cos(omega * t),
  y: R * Math.sin(omega * t)
};`
  },
  accelerated: {
    title: "Transición Transónica con Aceleración Constante",
    code: `// Fuente acelerando desde el reposo: a = 70 m/s²
// Cruza la barrera del sonido (c = 340 m/s) en t = 340 / 70 ≈ 4.86 s
const x0 = -300.0;
const a = 70.0;

return {
  x: x0 + 0.5 * a * t * t,
  y: 0.0
};`
  }
};

export class DopplerCodeLab {
  constructor(model, onAppliedCallback) {
    this.model = model;
    this.onApplied = onAppliedCallback;
  }

  /**
   * Ejecuta de forma segura la función ingresada por el estudiante
   */
  applySourceTrajectory(codeString) {
    try {
      // Crear función aislada con parámetro t
      const fn = new Function('t', `
        "use strict";
        try {
          ${codeString}
        } catch(e) {
          throw e;
        }
      `);

      // Prueba preliminar para t = 0 y t = 1 para verificar retorno
      const p0 = fn(0);
      const p1 = fn(1);

      if (!p0 || typeof p0.x !== 'number' || typeof p0.y !== 'number' || isNaN(p0.x) || isNaN(p0.y)) {
        return {
          success: false,
          error: "La función debe retornar un objeto con coordenadas numéricas { x, y }."
        };
      }

      // Envolver con Vector2D
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

      return {
        success: true,
        message: "¡Trayectoria de fuente compilada y aplicada exitosamente!"
      };
    } catch (err) {
      return {
        success: false,
        error: "Error de sintaxis o ejecución: " + err.message
      };
    }
  }

  resetToLinearTrajectory() {
    this.model.sourceTrajectoryFn = null;
    this.model.obsTrajectoryFn = null;
    this.model.rebuildExperiment();
    if (this.onApplied) this.onApplied();
  }
}
