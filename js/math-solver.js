/**
 * ============================================================================
 * MOTOR DIDÁCTICO DE MATEMÁTICAS Y SOLVER SIMBÓLICO CON NERDAMER
 * Rigor Académico y Protocolo Estricto de 5 Pasos
 * Cuaderno Digital Interactivo: Física 3 - Movimiento Ondulatorio
 * ============================================================================
 */

class MathSolver {
  constructor() {
    this.container = document.getElementById('solver-output-container');
    this.init();
  }

  init() {
    // Escuchar botón de resolver
    const btnSolve = document.getElementById('btn-run-solver');
    if (btnSolve) {
      btnSolve.addEventListener('click', () => this.solveInteractiveProblem());
    }

    // Escuchar cambio de tipo de problema para actualizar etiquetas de los campos
    const selType = document.getElementById('solver-problem-type');
    if (selType) {
      selType.addEventListener('change', () => this.updateFormLabels(selType.value));
    }

    // Renderizar expresiones KaTeX iniciales
    this.renderAllMath();
  }

  updateFormLabels(type) {
    const labelM = document.querySelector('label[for="solver-input-m"]') || document.getElementById('solver-input-m')?.previousElementSibling;
    const labelK = document.querySelector('label[for="solver-input-k"]') || document.getElementById('solver-input-k')?.previousElementSibling;
    const labelA = document.querySelector('label[for="solver-input-a"]') || document.getElementById('solver-input-a')?.previousElementSibling;
    const labelT = document.querySelector('label[for="solver-input-t"]') || document.getElementById('solver-input-t')?.previousElementSibling;

    if (type === 'wave') {
      if (labelM) labelM.textContent = 'Frecuencia f (Hz)';
      if (labelK) labelK.textContent = 'Longitud de Onda λ (m)';
      if (labelA) labelA.textContent = 'Amplitud A (m)';
      if (labelT) labelT.textContent = 'Instante temporal t (s)';
      const inpM = document.getElementById('solver-input-m');
      const inpK = document.getElementById('solver-input-k');
      if (inpM) inpM.value = '2.5';
      if (inpK) inpK.value = '1.20';
    } else if (type === 'pendulum') {
      if (labelM) labelM.textContent = 'Longitud del Péndulo L (m)';
      if (labelK) labelK.textContent = 'Aceleración Gravitacional g (m/s²)';
      if (labelA) labelA.textContent = 'Amplitud angular inicial (rad)';
      if (labelT) labelT.textContent = 'Instante temporal t (s)';
      const inpM = document.getElementById('solver-input-m');
      const inpK = document.getElementById('solver-input-k');
      if (inpM) inpM.value = '1.0';
      if (inpK) inpK.value = '9.8';
    } else {
      if (labelM) labelM.textContent = 'Masa inercial m (kg)';
      if (labelK) labelK.textContent = 'Constante elástica k (N/m)';
      if (labelA) labelA.textContent = 'Amplitud A (m)';
      if (labelT) labelT.textContent = 'Instante temporal t (s)';
      const inpM = document.getElementById('solver-input-m');
      const inpK = document.getElementById('solver-input-k');
      if (inpM) inpM.value = '0.5';
      if (inpK) inpK.value = '200';
    }
  }

  solveInteractiveProblem() {
    const problemType = document.getElementById('solver-problem-type')?.value || 'spring';
    const m = parseFloat(document.getElementById('solver-input-m')?.value || '0.5');
    const k = parseFloat(document.getElementById('solver-input-k')?.value || '200');
    const A = parseFloat(document.getElementById('solver-input-a')?.value || '0.08');
    const tVal = parseFloat(document.getElementById('solver-input-t')?.value || '1.5');

    if (!this.container) return;

    if (problemType === 'spring') {
      this.generateSpringSolution(m, k, A, tVal);
    } else if (problemType === 'pendulum') {
      const L = parseFloat(document.getElementById('solver-input-m')?.value || '1.0');
      const g = 9.8;
      this.generatePendulumSolution(L, g);
    } else if (problemType === 'wave') {
      const f = parseFloat(document.getElementById('solver-input-m')?.value || '2.5');
      const lambda = parseFloat(document.getElementById('solver-input-k')?.value || '1.20');
      const xVal = 0.25;
      this.generateWaveSolution(A, lambda, f, xVal, tVal);
    }

    // Renderizar KaTeX en el contenedor resultante
    if (window.renderMathInElement) {
      window.renderMathInElement(this.container, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    }

    if (window.lucide) lucide.createIcons();
  }

  // Genera el protocolo estricto de 5 pasos para el problema del sistema masa-resorte
  generateSpringSolution(m, k, A, tVal) {
    // Cálculos numéricos y simbólicos con Nerdamer
    let omegaSym = 'sqrt(k/m)';
    let omegaVal = Math.sqrt(k / m);
    let fVal = omegaVal / (2 * Math.PI);
    let TVal = 1 / fVal;
    let vMaxVal = A * omegaVal;
    let aMaxVal = A * omegaVal * omegaVal;
    let xAtT = A * Math.cos(omegaVal * tVal);
    let emecVal = 0.5 * k * A * A;

    // Uso simbólico con Nerdamer si está cargado
    if (window.nerdamer) {
      try {
        const solOmega = nerdamer(`sqrt(${k}/${m})`).evaluate().text();
        if (solOmega) omegaVal = parseFloat(solOmega);
      } catch (e) {
        console.warn('Nerdamer calculation note:', e);
      }
    }

    const html = `
      <div class="exercise-protocol-box" style="margin-top:16px;">
        <div class="exercise-header">
          <div class="exercise-title">
            <i data-lucide="calculator"></i>
            <span>Resolución Formal Paso a Paso: Oscilador Armónico Masa-Resorte</span>
          </div>
          <span class="badge badge-blue">Protocolo Estricto de 5 Pasos</span>
        </div>

        <div class="exercise-statement">
          <strong>Enunciado:</strong> Un cuerpo de masa $m = ${m}\\text{ kg}$ oscila libremente en una superficie horizontal sin fricción conectado a un resorte de constante elástica $k = ${k}\\text{ N/m}$. El sistema se separa de su posición de equilibrio con una amplitud $A = ${A}\\text{ m}$ y se suelta desde el reposo en $t = 0\\text{ s}$ ($\\\\phi = 0$). Calcule: 
          la frecuencia angular ($\\\\omega$), el periodo ($T$), la frecuencia ($f$), la velocidad máxima ($v_{\\\\max}$), la aceleración máxima ($a_{\\\\max}$), la elongación en $t = ${tVal}\\text{ s}$, y la energía mecánica total ($E$).
        </div>

        <div class="exercise-steps-container">
          <!-- PASO 1: IDENTIFICACIÓN DE DATOS (AZUL) -->
          <div class="protocol-step-card step-datos">
            <div class="step-card-header">
              <i data-lucide="check-circle-2"></i>
              <span>Paso 1: Identificación de Datos Conocidos (SI)</span>
            </div>
            <div class="step-card-body">
              <p style="margin-bottom:8px;">Se extraen los parámetros dados por el enunciado expresados rigurosamente en el Sistema Internacional de Unidades (SI):</p>
              <div class="variable-data-grid">
                <div class="var-pill"><span class="step-variable-tag">Masa inercial (m):</span> <strong class="text-datos">${m} kg</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Constante del resorte (k):</span> <strong class="text-datos">${k} N/m</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Amplitud máxima (A):</span> <strong class="text-datos">${A} m</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Fase inicial (\\(\\phi\\)):</span> <strong class="text-datos">0 rad (desde reposo)</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Instante temporal (t):</span> <strong class="text-datos">${tVal} s</strong></div>
              </div>
            </div>
          </div>

          <!-- PASO 2: IDENTIFICACIÓN DE INCÓGNITAS (ROJO) -->
          <div class="protocol-step-card step-incognitas">
            <div class="step-card-header">
              <i data-lucide="help-circle"></i>
              <span>Paso 2: Identificación de Incógnitas a Calcular</span>
            </div>
            <div class="step-card-body">
              <p style="margin-bottom:8px;">Se formalizan las magnitudes desconocidas que deben determinarse analíticamente:</p>
              <div class="variable-data-grid">
                <div class="var-pill"><span class="step-variable-tag">Frecuencia angular:</span> <strong class="text-incognitas">\\(\\omega\\) [rad/s] = ?</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Periodo de oscilación:</span> <strong class="text-incognitas">\\(T\\) [s] = ?</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Frecuencia de oscilación:</span> <strong class="text-incognitas">\\(f\\) [Hz] = ?</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Velocidad máxima:</span> <strong class="text-incognitas">\\(v_{\\max}\\) [m/s] = ?</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Aceleración máxima:</span> <strong class="text-incognitas">\\(a_{\\max}\\) [m/s²] = ?</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Elongación temporal:</span> <strong class="text-incognitas">\\(x(${tVal}\\text{ s})\\) [m] = ?</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Energía mecánica total:</span> <strong class="text-incognitas">\\(E\\) [J] = ?</strong></div>
              </div>
            </div>
          </div>

          <!-- PASO 3: ECUACIONES Y MODELOS FÍSICOS -->
          <div class="protocol-step-card step-modelos">
            <div class="step-card-header">
              <i data-lucide="book-open"></i>
              <span>Paso 3: Ecuaciones y Modelos Físicos Fundamentales</span>
            </div>
            <div class="step-card-body">
              <p>Basados en la solución analítica de la ecuación diferencial del oscilador libre lineal $m\\ddot{x} + kx = 0$:</p>
              $$\\omega = \\sqrt{\\frac{k}{m}}, \\quad f = \\frac{\\omega}{2\\pi}, \\quad T = \\frac{1}{f} = \\frac{2\\pi}{\\omega}$$
              $$v(t) = -A\\omega \\sin(\\omega t + \\phi) \\implies v_{\\max} = A\\omega$$
              $$a(t) = -A\\omega^2 \\cos(\\omega t + \\phi) \\implies a_{\\max} = A\\omega^2$$
              $$x(t) = A \\cos(\\omega t + \\phi), \\quad E = \\frac{1}{2} k A^2$$
            </div>
          </div>

          <!-- PASO 4: CONVERSIÓN, DESPEJE, SUSTITUCIÓN Y RESOLUCIÓN -->
          <div class="protocol-step-card step-despeje">
            <div class="step-card-header">
              <i data-lucide="code"></i>
              <span>Paso 4: Conversión, Despejes Analíticos y Cómputo Paso a Paso</span>
            </div>
            <div class="step-card-body">
              <p><strong>1. Cálculo analítico de la frecuencia angular (\\(\\omega\\)):</strong></p>
              $$\\omega = \\sqrt{\\frac{${k}\\text{ N/m}}{${m}\\text{ kg}}} = \\sqrt{${(k / m).toFixed(2)}} = ${omegaVal.toFixed(3)}\\text{ rad/s}$$
              <div class="resolved-incognita-banner">
                <span class="resolved-title"><i data-lucide="check"></i> Incógnita Resuelta:</span>
                <span class="resolved-formula">\\color{orange}{\\omega = ${omegaVal.toFixed(3)}\\text{ rad/s}}</span>
              </div>

              <p style="margin-top:14px;"><strong>2. Cálculo del periodo (\\(T\\)) y frecuencia (\\(f\\)):</strong></p>
              $$T = \\frac{2\\pi}{\\omega} = \\frac{2\\pi}{${omegaVal.toFixed(3)}} = ${TVal.toFixed(3)}\\text{ s}$$
              $$f = \\frac{1}{T} = \\frac{1}{${TVal.toFixed(3)}} = ${fVal.toFixed(3)}\\text{ Hz}$$
              <div class="resolved-incognita-banner">
                <span class="resolved-title"><i data-lucide="check"></i> Incógnitas Resueltas:</span>
                <span class="resolved-formula">\\color{orange}{T = ${TVal.toFixed(3)}\\text{ s}}, \\quad \\color{orange}{f = ${fVal.toFixed(3)}\\text{ Hz}}</span>
              </div>

              <p style="margin-top:14px;"><strong>3. Valores cinemáticos extremos (\\(v_{\\max}\\) y \\(a_{\\max}\\)):</strong></p>
              $$v_{\\max} = A\\omega = (${A}\\text{ m}) \\cdot (${omegaVal.toFixed(3)}\\text{ rad/s}) = ${vMaxVal.toFixed(3)}\\text{ m/s}$$
              $$a_{\\max} = A\\omega^2 = (${A}\\text{ m}) \\cdot (${omegaVal.toFixed(3)})^2 = ${aMaxVal.toFixed(3)}\\text{ m/s}^2$$
              <div class="resolved-incognita-banner">
                <span class="resolved-title"><i data-lucide="check"></i> Incógnitas Resueltas:</span>
                <span class="resolved-formula">\\color{orange}{v_{\\max} = ${vMaxVal.toFixed(3)}\\text{ m/s}}, \\quad \\color{orange}{a_{\\max} = ${aMaxVal.toFixed(3)}\\text{ m/s}^2}</span>
              </div>

              <p style="margin-top:14px;"><strong>4. Posición en \\(t = ${tVal}\\text{ s}\\) y Energía Mecánica Total (\\(E\\)):</strong></p>
              $$x(${tVal}) = ${A} \\cos(${omegaVal.toFixed(3)} \\cdot ${tVal}) = ${xAtT.toFixed(4)}\\text{ m}$$
              $$E = \\frac{1}{2}(${k}\\text{ N/m})(${A}\\text{ m})^2 = ${emecVal.toFixed(4)}\\text{ J}$$
              <div class="resolved-incognita-banner">
                <span class="resolved-title"><i data-lucide="check"></i> Incógnitas Resueltas:</span>
                <span class="resolved-formula">\\color{orange}{x(${tVal}\\text{ s}) = ${xAtT.toFixed(4)}\\text{ m}}, \\quad \\color{orange}{E = ${emecVal.toFixed(4)}\\text{ J}}</span>
              </div>
            </div>
          </div>

          <!-- PASO 5: VALIDACIÓN Y CONCLUSIONES -->
          <div class="protocol-step-card step-validacion">
            <div class="step-card-header">
              <i data-lucide="award"></i>
              <span>Paso 5: Validación Dimensional, Coherencia Física y Conclusiones</span>
            </div>
            <div class="step-card-body">
              <ul style="padding-left:20px; display:flex; flex-direction:column; gap:6px;">
                <li><strong>Análisis dimensional de \\(\\omega\\):</strong> $[\\sqrt{k/m}] = [(\\text{N}/\\text{m})/\\text{kg}]^{1/2} = [(\\text{kg}\\cdot\\text{m}/\\text{s}^2)/(\\text{m}\\cdot\\text{kg})]^{1/2} = [\\text{s}^{-2}]^{1/2} = \\text{s}^{-1} = \\text{rad/s}$. Dimensionalmente exacto.</li>
                <li><strong>Coherencia de la elongación:</strong> El valor obtenido $|x(${tVal}\\text{ s})| = ${Math.abs(xAtT).toFixed(4)}\\text{ m} \\le A = ${A}\\text{ m}$, lo cual cumple la condición física de acotamiento fundamental $|x(t)| \\le A$.</li>
                <li><strong>Conservación energética:</strong> La energía total calculada de ${emecVal.toFixed(4)}\\text{ J}$ permanece constante en todo instante $t$, distribuyéndose periódicamente entre energía cinética máxima en $x=0$ y energía potencial elástica máxima en $x=\\pm A$.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  generatePendulumSolution(L, g) {
    const omega = Math.sqrt(g / L);
    const T = 2 * Math.PI / omega;
    const f = 1 / T;

    const html = `
      <div class="exercise-protocol-box" style="margin-top:16px;">
        <div class="exercise-header">
          <div class="exercise-title">
            <i data-lucide="calculator"></i>
            <span>Resolución Formal Paso a Paso: Péndulo Simple de Laboratorio</span>
          </div>
          <span class="badge badge-blue">Protocolo Estricto de 5 Pasos</span>
        </div>
        <div class="exercise-statement">
          <strong>Enunciado:</strong> Se construye un péndulo simple con una cuerda inextensible de longitud $L = ${L}\\text{ m}$ en un lugar donde la aceleración gravitacional es $g = ${g}\\text{ m/s}^2$. Para ángulos pequeños ($\\\\theta \\le 10^\\circ$), calcule el periodo $T$, la frecuencia $f$ y la frecuencia angular $\\\\omega$.
        </div>
        <div class="exercise-steps-container">
          <div class="protocol-step-card step-datos">
            <div class="step-card-header"><i data-lucide="check-circle-2"></i><span>Paso 1: Identificación de Datos Conocidos (SI)</span></div>
            <div class="step-card-body">
              <div class="variable-data-grid">
                <div class="var-pill"><span class="step-variable-tag">Longitud de cuerda (L):</span> <strong class="text-datos">${L} m</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Aceleración gravedad (g):</span> <strong class="text-datos">${g} m/s²</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Régimen:</span> <strong class="text-datos">Pequeñas oscilaciones (\\(\\sin\\theta \\approx \\theta\\))</strong></div>
              </div>
            </div>
          </div>
          <div class="protocol-step-card step-incognitas">
            <div class="step-card-header"><i data-lucide="help-circle"></i><span>Paso 2: Identificación de Incógnitas</span></div>
            <div class="step-card-body">
              <div class="variable-data-grid">
                <div class="var-pill"><span class="step-variable-tag">Frecuencia angular:</span> <strong class="text-incognitas">\\(\\omega\\) [rad/s] = ?</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Periodo:</span> <strong class="text-incognitas">\\(T\\) [s] = ?</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Frecuencia:</span> <strong class="text-incognitas">\\(f\\) [Hz] = ?</strong></div>
              </div>
            </div>
          </div>
          <div class="protocol-step-card step-modelos">
            <div class="step-card-header"><i data-lucide="book-open"></i><span>Paso 3: Ecuaciones y Modelos Físicos</span></div>
            <div class="step-card-body">
              $$I\\alpha = \\tau \\implies mL^2 \\frac{d^2\\theta}{dt^2} = -mgL\\sin\\theta \\implies \\frac{d^2\\theta}{dt^2} + \\frac{g}{L}\\theta = 0$$
              $$\\omega = \\sqrt{\\frac{g}{L}}, \\quad T = 2\\pi\\sqrt{\\frac{L}{g}}, \\quad f = \\frac{1}{T}$$
            </div>
          </div>
          <div class="protocol-step-card step-despeje">
            <div class="step-card-header"><i data-lucide="code"></i><span>Paso 4: Conversión, Despejes y Sustitución</span></div>
            <div class="step-card-body">
              $$\\omega = \\sqrt{\\frac{${g}\\text{ m/s}^2}{${L}\\text{ m}}} = ${omega.toFixed(3)}\\text{ rad/s}$$
              <div class="resolved-incognita-banner">
                <span class="resolved-title"><i data-lucide="check"></i> Incógnita Resuelta:</span>
                <span class="resolved-formula">\\color{orange}{\\omega = ${omega.toFixed(3)}\\text{ rad/s}}</span>
              </div>
              $$T = 2\\pi \\sqrt{\\frac{${L}}{${g}}} = ${T.toFixed(3)}\\text{ s}, \\quad f = \\frac{1}{${T.toFixed(3)}} = ${f.toFixed(3)}\\text{ Hz}$$
              <div class="resolved-incognita-banner">
                <span class="resolved-title"><i data-lucide="check"></i> Incógnitas Resueltas:</span>
                <span class="resolved-formula">\\color{orange}{T = ${T.toFixed(3)}\\text{ s}}, \\quad \\color{orange}{f = ${f.toFixed(3)}\\text{ Hz}}</span>
              </div>
            </div>
          </div>
          <div class="protocol-step-card step-validacion">
            <div class="step-card-header"><i data-lucide="award"></i><span>Paso 5: Validación y Conclusiones</span></div>
            <div class="step-card-body">
              <p>Dimensionalmente $[\\sqrt{L/g}] = [\\text{m}/(\\text{m}/\\text{s}^2)]^{1/2} = [\\text{s}^2]^{1/2} = \\text{s}$. Nótese que el periodo es independiente de la masa del cuerpo (Isocronismo descubierto por Galileo Galilei en 1602).</p>
            </div>
          </div>
        </div>
      </div>
    `;
    this.container.innerHTML = html;
  }

  generateWaveSolution(A, lambda, f, xVal, tVal) {
    const k = (2 * Math.PI) / lambda;
    const omega = 2 * Math.PI * f;
    const T = 1 / f;
    const v = lambda * f;
    const phase = k * xVal - omega * tVal;
    const yAtXT = A * Math.sin(phase);
    const vyAtXT = -omega * A * Math.cos(phase);
    const ayAtXT = -omega * omega * yAtXT;
    const vyMax = omega * A;
    const ayMax = omega * omega * A;
    const mu = 0.04; // Densidad lineal estimada (kg/m)
    const powerAvg = 0.5 * mu * v * omega * omega * A * A;

    const html = `
      <div class="exercise-protocol-box" style="margin-top:16px;">
        <div class="exercise-header">
          <div class="exercise-title">
            <i data-lucide="calculator"></i>
            <span>Resolución Formal Paso a Paso: Onda Armónica Viajera Unidimensional</span>
          </div>
          <span class="badge badge-blue">Protocolo Estricto de 5 Pasos</span>
        </div>

        <div class="exercise-statement">
          <strong>Enunciado:</strong> Una onda armónica transversal se propaga hacia el sentido positivo del eje $x$ ($+x$) a lo largo de una cuerda elástica con una amplitud $A = ${A.toFixed(3)}\\text{ m}$, longitud de onda $\\lambda = ${lambda.toFixed(2)}\\text{ m}$ y frecuencia de oscilación $f = ${f.toFixed(2)}\\text{ Hz}$ (asumiendo $\\phi = 0$). Calcule: 
          el número de onda ($k$), la frecuencia angular ($\\omega$), el periodo ($T$), la rapidez de propagación de la fase ($v$), la ecuación general de onda $y(x,t)$, la rapidez transversal máxima ($v_{y,\\max}$), la aceleración transversal máxima ($a_{y,\\max}$), y evalúe la elongación $y$, la velocidad transversal $v_y$ y aceleración transversal $a_y$ en la coordenada $x = ${xVal.toFixed(2)}\\text{ m}$ para el instante $t = ${tVal.toFixed(2)}\\text{ s}$.
        </div>

        <div class="exercise-steps-container">
          <!-- PASO 1: DATOS (AZUL) -->
          <div class="protocol-step-card step-datos">
            <div class="step-card-header"><i data-lucide="check-circle-2"></i><span>Paso 1: Identificación de Datos Conocidos (SI)</span></div>
            <div class="step-card-body">
              <div class="variable-data-grid">
                <div class="var-pill"><span class="step-variable-tag">Amplitud (A):</span> <strong class="text-datos">${A.toFixed(3)} m</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Longitud de onda (\\(\\lambda\\)):</span> <strong class="text-datos">${lambda.toFixed(2)} m</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Frecuencia (f):</span> <strong class="text-datos">${f.toFixed(2)} Hz</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Sentido propagación:</span> <strong class="text-datos">+x (término kx - \\omega t)</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Punto espacial (x):</span> <strong class="text-datos">${xVal.toFixed(2)} m</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Instante temporal (t):</span> <strong class="text-datos">${tVal.toFixed(2)} s</strong></div>
              </div>
            </div>
          </div>

          <!-- PASO 2: INCÓGNITAS (ROJO) -->
          <div class="protocol-step-card step-incognitas">
            <div class="step-card-header"><i data-lucide="help-circle"></i><span>Paso 2: Identificación de Incógnitas a Calcular</span></div>
            <div class="step-card-body">
              <div class="variable-data-grid">
                <div class="var-pill"><span class="step-variable-tag">Número de onda:</span> <strong class="text-incognitas">k [rad/m] = ?</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Frecuencia angular:</span> <strong class="text-incognitas">\\omega [rad/s] = ?</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Periodo temporal:</span> <strong class="text-incognitas">T [s] = ?</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Rapidez de fase:</span> <strong class="text-incognitas">v [m/s] = ?</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Rapidez transv. máx.:</span> <strong class="text-incognitas">v_{y,\\max} [m/s] = ?</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Aceleración transv. máx.:</span> <strong class="text-incognitas">a_{y,\\max} [m/s²] = ?</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Elongación en (${xVal}, ${tVal}):</span> <strong class="text-incognitas">y(${xVal}, ${tVal}) [m] = ?</strong></div>
                <div class="var-pill"><span class="step-variable-tag">Velocidad en (${xVal}, ${tVal}):</span> <strong class="text-incognitas">v_y(${xVal}, ${tVal}) [m/s] = ?</strong></div>
              </div>
            </div>
          </div>

          <!-- PASO 3: MODELOS FÍSICOS -->
          <div class="protocol-step-card step-modelos">
            <div class="step-card-header"><i data-lucide="book-open"></i><span>Paso 3: Ecuaciones y Modelos Físicos Fundamentales</span></div>
            <div class="step-card-body">
              $$k = \\frac{2\\pi}{\\lambda}, \\quad \\omega = 2\\pi f, \\quad T = \\frac{1}{f}, \\quad v = \\lambda f = \\frac{\\omega}{k}$$
              $$y(x,t) = A \\sin(kx - \\omega t), \\quad v_y(x,t) = \\frac{\\partial y}{\\partial t} = -\\omega A \\cos(kx - \\omega t)$$
              $$a_y(x,t) = \\frac{\\partial^2 y}{\\partial t^2} = -\\omega^2 y(x,t), \\quad v_{y,\\max} = \\omega A, \\quad a_{y,\\max} = \\omega^2 A$$
            </div>
          </div>

          <!-- PASO 4: RESOLUCIÓN Y DESPEJE -->
          <div class="protocol-step-card step-despeje">
            <div class="step-card-header"><i data-lucide="code"></i><span>Paso 4: Conversión, Despejes y Cómputo Numérico</span></div>
            <div class="step-card-body">
              <p><strong>1. Parámetros angulares y cinemáticos:</strong></p>
              $$k = \\frac{2\\pi}{${lambda.toFixed(2)}} = ${k.toFixed(3)}\\text{ rad/m}, \\quad \\omega = 2\\pi(${f.toFixed(2)}) = ${omega.toFixed(3)}\\text{ rad/s}$$
              $$T = \\frac{1}{${f.toFixed(2)}} = ${T.toFixed(3)}\\text{ s}, \\quad v = (${lambda.toFixed(2)})(${f.toFixed(2)}) = ${v.toFixed(3)}\\text{ m/s}$$
              <div class="resolved-incognita-banner">
                <span class="resolved-title"><i data-lucide="check"></i> Incógnitas Resueltas:</span>
                <span class="resolved-formula">\\color{orange}{k = ${k.toFixed(3)}\\text{ rad/m}, \\quad \\omega = ${omega.toFixed(3)}\\text{ rad/s}, \\quad v = ${v.toFixed(2)}\\text{ m/s}}</span>
              </div>

              <p style="margin-top:12px;"><strong>2. Extremos cinemáticos transversales:</strong></p>
              $$v_{y,\\max} = \\omega A = (${omega.toFixed(3)})(${A.toFixed(3)}) = ${vyMax.toFixed(3)}\\text{ m/s}$$
              $$a_{y,\\max} = \\omega^2 A = (${omega.toFixed(3)})^2(${A.toFixed(3)}) = ${ayMax.toFixed(2)}\\text{ m/s}^2$$
              <div class="resolved-incognita-banner">
                <span class="resolved-title"><i data-lucide="check"></i> Incógnitas Resueltas:</span>
                <span class="resolved-formula">\\color{orange}{v_{y,\\max} = ${vyMax.toFixed(3)}\\text{ m/s}, \\quad a_{y,\\max} = ${ayMax.toFixed(2)}\\text{ m/s}^2}</span>
              </div>

              <p style="margin-top:12px;"><strong>3. Estado cinemático en $(x = ${xVal.toFixed(2)}\\text{ m}, t = ${tVal.toFixed(2)}\\text{ s})$:</strong></p>
              $$\\theta = (${k.toFixed(3)})(${xVal.toFixed(2)}) - (${omega.toFixed(3)})(${tVal.toFixed(2)}) = ${(k * xVal).toFixed(3)} - ${(omega * tVal).toFixed(3)} = ${phase.toFixed(3)}\\text{ rad}$$
              $$y(${xVal.toFixed(2)}, ${tVal.toFixed(2)}) = ${A.toFixed(3)} \\sin(${phase.toFixed(3)}) = ${yAtXT.toFixed(4)}\\text{ m}$$
              $$v_y(${xVal.toFixed(2)}, ${tVal.toFixed(2)}) = -(${omega.toFixed(3)})(${A.toFixed(3)}) \\cos(${phase.toFixed(3)}) = ${vyAtXT.toFixed(4)}\\text{ m/s}$$
              $$a_y(${xVal.toFixed(2)}, ${tVal.toFixed(2)}) = -(${omega.toFixed(3)})^2(${yAtXT.toFixed(4)}) = ${ayAtXT.toFixed(3)}\\text{ m/s}^2$$
              <div class="resolved-incognita-banner">
                <span class="resolved-title"><i data-lucide="check"></i> Incógnitas Resueltas:</span>
                <span class="resolved-formula">\\color{orange}{y = ${yAtXT.toFixed(4)}\\text{ m}, \\quad v_y = ${vyAtXT.toFixed(3)}\\text{ m/s}, \\quad a_y = ${ayAtXT.toFixed(2)}\\text{ m/s}^2}</span>
              </div>
            </div>
          </div>

          <!-- PASO 5: VALIDACIÓN -->
          <div class="protocol-step-card step-validacion">
            <div class="step-card-header"><i data-lucide="award"></i><span>Paso 5: Validación Dimensional y Conclusiones Físicas</span></div>
            <div class="step-card-body">
              <ul style="padding-left:20px; display:flex; flex-direction:column; gap:6px;">
                <li><strong>Acotamiento de posición y velocidad:</strong> Se verifica que $|y(${xVal}, ${tVal})| = ${Math.abs(yAtXT).toFixed(4)}\\text{ m} \\le A = ${A.toFixed(3)}\\text{ m}$, y que $|v_y| = ${Math.abs(vyAtXT).toFixed(3)}\\text{ m/s} \\le v_{y,\\max} = ${vyMax.toFixed(3)}\\text{ m/s}$. El movimiento es físicamente admisible.</li>
                <li><strong>Cumplimiento de la Ecuación de d'Alembert:</strong> Las derivadas parciales satisfacen rigurosamente $\\frac{\\partial^2 y}{\\partial x^2} = \\frac{1}{v^2} \\frac{\\partial^2 y}{\\partial t^2}$ con $v = ${v.toFixed(2)}\\text{ m/s}$.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }
}

window.MathSolver = MathSolver;
