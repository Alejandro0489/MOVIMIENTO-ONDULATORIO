/**
 * ============================================================================
 * LÍNEA DE TIEMPO HISTÓRICA & RESEÑA INTRODUCTORIA
 * Evolución de la Física de las Oscilaciones y Ondas
 * Cuaderno Digital Interactivo: Física 3
 * ============================================================================
 */

class HistoryTimeline {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.milestones = [
      {
        year: '1602',
        scientist: 'Galileo Galilei (1564–1642)',
        discovery: 'Isocronismo del Péndulo Simple',
        context: 'Catedral de Pisa y Universidad de Padua',
        impact: 'Galileo observó que el tiempo de oscilación de una lámpara suspendida de una gran cadena era independiente de la amplitud de su oscilación (para arcos reducidos), descubriendo que el periodo depende únicamente de la longitud de la cuerda.',
        quote: '«El movimiento de un péndulo de igual longitud ocurre con el mismo ritmo en arcos grandes y pequeños.»',
        icon: 'clock'
      },
      {
        year: '1673',
        scientist: 'Christiaan Huygens (1629–1695)',
        discovery: 'Horologium Oscillatorium & Péndulo Cicloidal',
        context: 'Academia Real de Ciencias de París',
        impact: 'Perfeccionó el reloj de péndulo mecánico dotándolo de una precisión cronométrica sin precedentes para la navegación marítima y dedujo formalmente que la curva verdaderamente tautócrona es la cicloide, no el círculo.',
        quote: '«La regularidad del tiempo exige que la oscilación sea rigurosamente independiente del arco de caída.»',
        icon: 'compass'
      },
      {
        year: '1676',
        scientist: 'Robert Hooke (1635–1703)',
        discovery: 'Ley de Elasticidad: Ut tensio, sic vis',
        context: 'Royal Society de Londres',
        impact: 'Formuló mediante un anagrama latino («ceiiinosssttuv») la proporcionalidad directa entre la fuerza restauradora ejercida por un cuerpo elástico y su alargamiento relativo, sentando la base física del oscilador armónico simple: F = -kx.',
        quote: '«Ut tensio, sic vis: como la extensión, así es la fuerza.»',
        icon: 'maximize-2'
      },
      {
        year: '1687',
        scientist: 'Isaac Newton (1642–1727)',
        discovery: 'Principia Mathematica & Dinámica Ondulatoria',
        context: 'Trinity College, Cambridge',
        impact: 'Unificó la mecánica clásica con las leyes del movimiento y la gravitación universal. En la Proposición 47 del Libro II analizó por primera vez la propagación de ondas elásticas en medios fluidos y calculó la velocidad del sonido.',
        quote: '«A cada acción se opone siempre una reacción igual y contraria.»',
        icon: 'book-open'
      },
      {
        year: '1739',
        scientist: 'Leonhard Euler (1707–1783)',
        discovery: 'Solución Analítica de la Ecuación Diferencial del M.A.S.',
        context: 'Academia de San Petersburgo',
        impact: 'Euler introdujo la notación moderna del cálculo y resolvió sistemáticamente la ecuación diferencial lineal ordinaria m·d²x/dt² + kx = 0 utilizando exponenciales imaginarias y la relación de Euler e^(iθ) = cos θ + i sen θ.',
        quote: '«El análisis infinitesimal transforma los enigmas de la vibración en la pura armonía de las funciones circulares.»',
        icon: 'feather'
      },
      {
        year: '1746',
        scientist: 'Jean le Rond d\'Alembert (1717–1783)',
        discovery: 'Ecuación Diferencial General de Onda Unidimensional',
        context: 'Academia de Ciencias de Berlín y París',
        impact: 'Formuló por primera vez la ecuación diferencial en derivadas parciales fundamental ∂²y/∂x² = (1/v²)∂²y/∂t² para cuerdas vibrantes elásticas y dedujo su solución analítica universal en términos de dos ondas viajeras opuestas f(x - vt) + g(x + vt).',
        quote: '«La propagación del movimiento a lo largo de un hilo sonoro obedece a una ley diferencial de armonía invariable.»',
        icon: 'activity'
      },
      {
        year: '1753',
        scientist: 'Daniel Bernoulli (1700–1782)',
        discovery: 'Principio de Superposición y Ondas Armónicas Senoidales',
        context: 'Universidad de Basilea',
        impact: 'Propuso que cualquier movimiento vibratorio de una cuerda no es más que la superposición armónica simultánea de infinitos modos normales de oscilación sinusoidales puros, anticipando en medio siglo el teorema de Fourier.',
        quote: '«Todos los movimientos complejos del sonido resultan de la coexistencia pacífica de ondas armónicas puras.»',
        icon: 'music'
      },
      {
        year: '1822',
        scientist: 'Jean-Baptiste Joseph Fourier (1768–1830)',
        discovery: 'Análisis Armónico y Series de Fourier',
        context: 'Institut de France, París',
        impact: 'Demostró en su célebre tratado «Théorie analytique de la chaleur» que cualquier función periódica, sin importar su forma arbitraria, puede descomponerse en una suma infinita de funciones armónicas puras (senos y cosenos).',
        quote: '«El estudio profundo de la naturaleza es la fuente más fecunda de los descubrimientos matemáticos.»',
        icon: 'activity'
      },
      {
        year: '1887',
        scientist: 'Heinrich Hertz (1857–1894)',
        discovery: 'Confirmación Experimental de las Ondas Electromagnéticas',
        context: 'Instituto Tecnológico de Karlsruhe',
        impact: 'Construyó el primer oscilador y resonador de chispas de alta frecuencia, logrando producir, propagar, reflejar, refractar y polarizar ondas electromagnéticas en el espacio libre, demostrando experimentalmente la teoría ondulatoria de Maxwell.',
        quote: '«Los experimentos demuestran que las ondas electromagnéticas comparten todas las propiedades de las ondas luminosas.»',
        icon: 'radio'
      }
    ];

    this.render();
  }

  render() {
    let html = '<div class="timeline-stream">';
    this.milestones.forEach(m => {
      html += `
        <div class="timeline-milestone-card">
          <div class="milestone-pin"></div>
          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px;">
            <span class="milestone-year">${m.year}</span>
            <span class="badge badge-blue" style="font-size:0.7rem;">${m.context}</span>
          </div>
          <div class="milestone-author">${m.scientist}</div>
          <div style="font-weight:700; color:var(--accent-bronze); font-size:0.9rem; margin-bottom:8px;">${m.discovery}</div>
          <p style="font-size:0.9rem; color:var(--ink-secondary); line-height:1.6;">${m.impact}</p>
          <div class="milestone-quote">${m.quote}</div>
        </div>
      `;
    });
    html += '</div>';

    this.container.innerHTML = html;
  }
}

window.HistoryTimeline = HistoryTimeline;
