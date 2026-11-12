/**
 * ============================================================================
 * 8 ESCENARIOS DE APRENDIZAJE GUIADO CON PREDICCIONES Y COMPROBACIÓN
 * Cuaderno Interactivo de Física III • Universidad
 * 
 * Cada escenario integra:
 * - Objetivo pedagógico.
 * - Configuración física paramétrica exacta.
 * - Pregunta de predicción previa a la simulación.
 * - Procedimiento experimental paso a paso.
 * - Explicación analítica y geométrica de lo observado.
 * - Pregunta de comprobación con retroalimentación instantánea.
 * ============================================================================
 */

export const DOPPLER_SCENARIOS = [
  {
    id: 1,
    title: "1. Fuente y Observador Inmóviles en Reposo",
    tag: "Línea Base",
    objective: "Verificar el régimen estacionario clásico donde los frentes de onda son esféricos concéntricos y la frecuencia percibida coincide exactamente con la emitida (fo = fe).",
    config: {
      f: 2.0,
      c: 340.0,
      sourceX0: -170.0,
      sourceY0: 0.0,
      sourceVx: 0.0,
      sourceVy: 0.0,
      obsX0: 170.0,
      obsY0: 0.0,
      obsVx: 0.0,
      obsVy: 0.0,
      duration: 10.0,
      sourceType: 'point',
      is2D: false
    },
    prediction: {
      question: "Si la fuente y el receptor están ambos en reposo absoluto respecto al medio homogéneo, ¿qué relación existirá entre los frentes y la frecuencia percibida?",
      options: [
        { text: "La frecuencia medida será igual a la emitida (fo = fe = 2 Hz) y los frentes se mantendrán concéntricos.", isCorrect: true, feedback: "¡Correcto! Sin movimiento relativo respecto al medio, la longitud de onda λ0 = c/f es uniforme en todas direcciones y los frentes llegan con un período idéntico T = 1/f = 0.5 s." },
        { text: "La frecuencia aumentará progresivamente a medida que el sonido viaja por el aire.", isCorrect: false, feedback: "Incorrecto. En un medio homogéneo sin dispersión ni atenuación no-lineal, la frecuencia se conserva estrictamente a lo largo de la propagación." },
        { text: "El sonido llegará instantáneamente sin ningún retardo.", isCorrect: false, feedback: "Incorrecto. La perturbación acústica se propaga a rapidez finita c = 340 m/s, requiriendo un tiempo de tránsito t = d/c = 340/340 = 1.0 s para alcanzar al receptor." }
      ]
    },
    procedure: [
      "1. Observa la distancia inicial de 340 m entre la fuente y el observador.",
      "2. Presiona Iniciar (Play). Nota que el primer frente emitido en t = 0 tarda exactamente 1.0 s en llegar al micrófono.",
      "3. Activa los 'Pulsos de audio' y cuenta cómo cada 0.50 s suena un beep uniforme que marca la llegada de un frente.",
      "4. Comprueba en la tabla de mediciones que f_medida = 2.000 Hz."
    ],
    explanation: "Dado que vf = 0 y vo = 0, los vectores velocidad son nulos. La fórmula Doppler fo = fe * (c - n·vo)/(c - n·vf) se reduce idénticamente a fo = fe * (c/c) = fe. En el medio no existe compresión ni rarefacción de frentes: λ = c/fe = 340/2 = 170 m en todas direcciones.",
    quiz: {
      question: "¿Cuánto tiempo transcurre entre la emisión del primer frente en la fuente y su registro en el receptor ubicado a 340 m?",
      options: [
        { text: "1.00 segundo exacto, dado por t = d / c = 340 m / (340 m/s).", isCorrect: true, feedback: "¡Exacto! El retardo físico de propagación en el aire a 20 °C es de 1 segundo para una distancia de 340 metros." },
        { text: "0.50 segundos, equivalente a un período.", isCorrect: false, feedback: "Incorrecto. 0.5 s es el período de oscilación T = 1/f, pero el tiempo de vuelo de la onda depende de la distancia y de c." },
        { text: "0 segundos, la onda se establece instantáneamente.", isCorrect: false, feedback: "Incorrecto. El sonido requiere un soporte material elástico y su rapidez de propagación es finita." }
      ]
    }
  },
  {
    id: 2,
    title: "2. Fuente en Aproximación hacia Receptor Fijo",
    tag: "Acercamiento",
    objective: "Comprender la compresión espacial de los frentes de onda delante de una fuente en movimiento (vf > 0) y el consecuente incremento en la frecuencia percibida.",
    config: {
      f: 2.0,
      c: 340.0,
      sourceX0: -200.0,
      sourceY0: 0.0,
      sourceVx: 68.0, // Mach 0.20
      sourceVy: 0.0,
      obsX0: 140.0,
      obsY0: 0.0,
      obsVx: 0.0,
      obsVy: 0.0,
      duration: 8.0,
      sourceType: 'car',
      is2D: false
    },
    prediction: {
      question: "Al moverse la fuente hacia el observador a 68 m/s (20% de c), ¿qué sucederá con la longitud de onda delante y con la frecuencia recibida?",
      options: [
        { text: "Los frentes se comprimen (λdelante disminuye) y la frecuencia recibida aumenta (fo > fe).", isCorrect: true, feedback: "¡Excelente! La fuente 'persigue' a los frentes que acaba de emitir, reduciendo la distancia entre crestas sucesivas a λ' = (c - vf)/f." },
        { text: "La rapidez del sonido en el aire aumenta a c + vf = 408 m/s.", isCorrect: false, feedback: "¡Error conceptual común! La rapidez de propagación c respecto al medio depende ÚNICAMENTE de las propiedades elásticas e inerciales del medio (aire), NO de la velocidad de la fuente." },
        { text: "La frecuencia disminuye porque la fuente gasta energía en moverse.", isCorrect: false, feedback: "Incorrecto. La compresión de frentes hace que el receptor intercepte más ondas por unidad de tiempo." }
      ]
    },
    procedure: [
      "1. Verifica los parámetros: fe = 2 Hz, c = 340 m/s, vf = +68 m/s (hacia +x).",
      "2. Inicia la simulación y observa la cota verde 'λdelante': verás cómo los círculos están visiblemente apretados hacia la derecha.",
      "3. Observa cómo el observador recibe los pulsos a un ritmo más acelerado que el emitido.",
      "4. Revisa la gráfica de frecuencias: fo teórica = 2 * (340 / (340 - 68)) = 2.50 Hz."
    ],
    explanation: "La longitud de onda delantera se comprime a λdelante = (c - vf)/f = (340 - 68)/2 = 136 m (en reposo era 170 m). Dado que las ondas viajan por el aire hacia el observador en reposo con rapidez c, la frecuencia recibida es fo = c / λdelante = 340 / 136 = 2.50 Hz (+25% de elevación espectral).",
    quiz: {
      question: "Para fe = 2 Hz, c = 340 m/s y vf = 68 m/s, ¿cuál es el valor analítico exacto de fo?",
      options: [
        { text: "fo = 2.50 Hz.", isCorrect: true, feedback: "¡Correcto! fo = fe * c / (c - vf) = 2 * 340 / 272 = 2.50 Hz." },
        { text: "fo = 2.40 Hz.", isCorrect: false, feedback: "Incorrecto. Revisa el cálculo: 340 / (340 - 68) = 340 / 272 = 1.25 -> 2 * 1.25 = 2.50 Hz." },
        { text: "fo = 1.60 Hz.", isCorrect: false, feedback: "Incorrecto. Esa sería una frecuencia disminuida propia del alejamiento." }
      ]
    }
  },
  {
    id: 3,
    title: "3. Fuente en Alejamiento de Receptor Fijo",
    tag: "Alejamiento",
    objective: "Analizar la dilatación espacial de la longitud de onda detrás de una fuente que se aleja y la consecuente caída de la frecuencia percibida (tono más grave).",
    config: {
      f: 2.0,
      c: 340.0,
      sourceX0: 50.0,
      sourceY0: 0.0,
      sourceVx: 68.0, // se aleja del observador situado en x = -150
      sourceVy: 0.0,
      obsX0: -150.0,
      obsY0: 0.0,
      obsVx: 0.0,
      obsVy: 0.0,
      duration: 8.0,
      sourceType: 'car',
      is2D: false
    },
    prediction: {
      question: "Cuando la fuente viaja en sentido contrario al observador, ¿qué efecto se produce en el espaciado de frentes?",
      options: [
        { text: "Los frentes se dilatan (λdetrás aumenta) y el receptor percibe una frecuencia menor (fo < fe).", isCorrect: true, feedback: "¡Exacto! Al alejarse la fuente del observador, cada frente subsiguiente se emite desde una posición más lejana, alargando la distancia entre frentes a λ' = (c + vf)/f." },
        { text: "Los frentes se acumulan formando una onda de choque detrás.", isCorrect: false, feedback: "Incorrecto. La acumulación ocurre hacia adelante cuando vf se aproxima a c, no detrás." },
        { text: "La frecuencia percibida permanece igual a 2 Hz.", isCorrect: false, feedback: "Incorrecto. Hay movimiento relativo alejándose, lo que altera el ritmo de llegada." }
      ]
    },
    procedure: [
      "1. Observa que el receptor está en x = -150 m y la fuente se mueve hacia la derecha (+x), alejándose continuamente.",
      "2. Inicia la simulación y observa la cota 'λdetrás': los frentes están más separados entre sí.",
      "3. Compara el intervalo de tiempo entre recepciones sucesivas: Δtr = 0.60 s (f = 1.667 Hz).",
      "4. Escucha en el audio cómo los beeps suenan más espaciados."
    ],
    explanation: "Al alejarse la fuente a vf = 68 m/s, la longitud de onda en la estela posterior es λdetrás = (c + vf)/f = (340 + 68)/2 = 204 m. Como c = 340 m/s, el receptor percibe fo = c / λdetrás = 340 / 204 ≈ 1.667 Hz. La frecuencia cae en un factor de 272/408 = 0.833.",
    quiz: {
      question: "¿Cuál es la longitud de onda dilatada en la región posterior para c = 340 m/s, fe = 2 Hz y vf = 68 m/s?",
      options: [
        { text: "λdetrás = 204 m.", isCorrect: true, feedback: "¡Excelente! λdetrás = (340 + 68) / 2 = 408 / 2 = 204 m." },
        { text: "λdetrás = 170 m.", isCorrect: false, feedback: "Incorrecto. 170 m es la longitud de onda en reposo λ0 = c/f." },
        { text: "λdetrás = 136 m.", isCorrect: false, feedback: "Incorrecto. 136 m es la longitud comprimida delantera." }
      ]
    }
  },
  {
    id: 4,
    title: "4. Observador en Movimiento hacia Fuente Fija",
    tag: "Observador Móvil",
    objective: "Demostrar que el movimiento del observador NO altera la longitud de onda espacial en el medio, sino la rapidez relativa de intercepción de frentes.",
    config: {
      f: 2.0,
      c: 340.0,
      sourceX0: -150.0,
      sourceY0: 0.0,
      sourceVx: 0.0,
      sourceVy: 0.0,
      obsX0: 170.0,
      obsY0: 0.0,
      obsVx: -68.0, // El observador viaja hacia la izquierda, hacia la fuente
      obsVy: 0.0,
      duration: 6.0,
      sourceType: 'point',
      is2D: false
    },
    prediction: {
      question: "¿Se comprimen los círculos dibujados en el aire cuando es el observador quien se desplaza hacia la fuente estacionaria?",
      options: [
        { text: "No se comprimen: los círculos en el aire son concéntricos y de radio λ0 = 170 m; la mayor frecuencia se debe a la rapidez relativa de encuentro (c + vo).", isCorrect: true, feedback: "¡Brillante distinción fundamental de la física clásica! El medio no sabe quién lo escucha. La fuente inmóvil genera ondas perfectas λ = c/f; el observador se abalanza sobre ellas con rapidez relativa c + vo." },
        { text: "Sí, todos los círculos en el aire se arrugan y se mueven junto con el observador.", isCorrect: false, feedback: "Falso. Los frentes son perturbaciones del medio, independientes del movimiento del observador." },
        { text: "La frecuencia observada es menor porque el observador choca de frente con las ondas.", isCorrect: false, feedback: "Incorrecto. Al ir hacia ellas, las cruza más rápido, aumentando la frecuencia." }
      ]
    },
    procedure: [
      "1. Fíjate en los frentes de onda: son círculos perfectamente concéntricos espaciados cada 170 m.",
      "2. Da Play y observa cómo el sensor se desplaza hacia la izquierda, atravesando frentes.",
      "3. Comprueba el cálculo analítico: fo = fe * (c + vo)/c = 2 * (340 + 68)/340 = 2 * 1.20 = 2.40 Hz.",
      "4. Contrasta con el Escenario 2: ¡nota que 2.40 Hz NO es igual a los 2.50 Hz del Escenario 2 a pesar de tener la misma velocidad relativa de 68 m/s! Esto demuestra la asimetría del efecto Doppler acústico clásico."
    ],
    explanation: "En la acústica clásica el medio constituye un sistema de referencia privilegiado. Cuando se mueve la fuente, cambia la longitud de onda en el medio: fo = fe * c/(c - vf) = 2.50 Hz. Cuando se mueve el observador, la longitud de onda no cambia (λ = 170 m) y la rapidez relativa es c + vo: fo = (c + vo)/λ = 2.40 Hz. Esta asimetría histórica impulsó a Einstein al desarrollo de la relatividad especial.",
    quiz: {
      question: "¿Por qué para una misma rapidez relativa de 68 m/s, fo = 2.40 Hz cuando se mueve el observador, pero fo = 2.50 Hz cuando se mueve la fuente?",
      options: [
        { text: "Porque en acústica clásica las ondas se propagan respecto al medio en reposo: mover la fuente altera λ, mientras que mover el observador altera la rapidez relativa de encuentro.", isCorrect: true, feedback: "¡Perfecto! Has comprendido el núcleo físico de la cinemática ondulatoria en medios materiales." },
        { text: "Es solo un error de redondeo de la calculadora.", isCorrect: false, feedback: "No es error de redondeo, es una consecuencia algebraica de las razones (c+vo)/c vs c/(c-vf)." },
        { text: "Porque el observador tiene menor masa que la fuente emisora.", isCorrect: false, feedback: "Incorrecto. La masa del observador no interviene en la cinemática de ondas." }
      ]
    }
  },
  {
    id: 5,
    title: "5. Observador en Alejamiento de Fuente Fija",
    tag: "Observador Móvil",
    objective: "Analizar el caso en que el receptor huye de las ondas emitidas por una fuente en reposo, reduciendo la rapidez de encuentro a c - vo.",
    config: {
      f: 2.0,
      c: 340.0,
      sourceX0: -150.0,
      sourceY0: 0.0,
      sourceVx: 0.0,
      sourceVy: 0.0,
      obsX0: 50.0,
      obsY0: 0.0,
      obsVx: 68.0, // el observador se aleja hacia +x
      obsVy: 0.0,
      duration: 8.0,
      sourceType: 'point',
      is2D: false
    },
    prediction: {
      question: "Si el receptor se desplaza a 68 m/s alejándose de la fuente en reposo, ¿qué valor registrará?",
      options: [
        { text: "fo = 2 * (340 - 68) / 340 = 1.60 Hz.", isCorrect: true, feedback: "¡Correcto! La rapidez efectiva de captura de crestas es c - vo = 340 - 68 = 272 m/s." },
        { text: "fo = 0 Hz, nunca le llegará ningún sonido.", isCorrect: false, feedback: "Incorrecto. Como vo = 68 m/s < c = 340 m/s, las ondas viajan más rápido que el receptor y eventualmente lo alcanzan." },
        { text: "fo = 1.667 Hz.", isCorrect: false, feedback: "Cuidado: 1.667 Hz era el caso de fuente alejándose (fe * c / (c + vf) = 2 * 340/408). Aquí el observador es quien se mueve: 2 * 272/340 = 1.60 Hz." }
      ]
    },
    procedure: [
      "1. Verifica que la fuente emite desde posición fija x = -150 m.",
      "2. El observador arranca en x = 50 m y se mueve hacia la derecha con vo = +68 m/s.",
      "3. Inicia la simulación: observa cómo las ondas alcanzan al sensor con menor frecuencia.",
      "4. Verifica en la gráfica de frecuencias el valor constante fo = 1.60 Hz."
    ],
    explanation: "La rapidez con que las ondas sobrepasan al receptor es v_rel = c - vo = 340 - 68 = 272 m/s. Al dividir por la longitud de onda invariable λ0 = 170 m, se obtiene fo = 272 / 170 = 1.60 Hz.",
    quiz: {
      question: "¿Qué ocurriría teóricamente si el observador se alejara a la misma velocidad que el sonido (vo = c = 340 m/s)?",
      options: [
        { text: "La frecuencia observada caería a fo = 0 Hz (las ondas viajarían a su lado sin ser cruzadas).", isCorrect: true, feedback: "¡Exacto! Si vo = c, el observador viaja sobre una misma cresta y nunca cruza frentes sucesivos." },
        { text: "La frecuencia se volvería infinita.", isCorrect: false, feedback: "Incorrecto. El infinito ocurre cuando la fuente se mueve hacia adelante a Mach 1 (denominador nulo)." },
        { text: "Escucharía un tono agudo ensordecedor.", isCorrect: false, feedback: "Incorrecto. No habría variación periódica de presión en su tímpano." }
      ]
    }
  },
  {
    id: 6,
    title: "6. Movimiento Conjunto con Separación Fija (vf = vo)",
    tag: "Tándem",
    objective: "Comprobar que cuando la fuente y el observador se mueven en la misma dirección y a la misma velocidad, la frecuencia recibida es exactamente igual a la emitida (fo = fe).",
    config: {
      f: 2.0,
      c: 340.0,
      sourceX0: -200.0,
      sourceY0: 0.0,
      sourceVx: 68.0,
      sourceVy: 0.0,
      obsX0: 100.0,
      obsY0: 0.0,
      obsVx: 68.0,
      obsVy: 0.0,
      duration: 8.0,
      sourceType: 'car',
      is2D: false
    },
    prediction: {
      question: "Si la fuente y el observador viajan ambos hacia la derecha a 68 m/s, manteniendo su separación fija en 300 m, ¿cuál será la frecuencia registrada?",
      options: [
        { text: "fo = fe = 2.0 Hz. La compresión de onda por la fuente se cancela con la 'huida' del receptor.", isCorrect: true, feedback: "¡Exacto! Aunque el patrón de ondas en el aire está asimétrico (comprimido hacia adelante), el observador se aleja de ellas a la misma tasa, compensando exactamente el efecto: (c - v)/(c - v) = 1." },
        { text: "fo = 2.5 Hz debido al avance de la fuente.", isCorrect: false, feedback: "Incorrecto. El observador no está quieto, también viaja a la misma velocidad." },
        { text: "fo = 1.6 Hz debido al avance del observador.", isCorrect: false, feedback: "Incorrecto. Ambos efectos ocurren en sentidos opuestos y se cancelan mutuamente." }
      ]
    },
    procedure: [
      "1. Observa que ambos móviles tienen vf = vo = 68 m/s.",
      "2. Inicia la simulación: ambos se desplazan juntos preservando la distancia de 300 m.",
      "3. Fíjate en los frentes de onda: delante de la fuente están comprimidos (λ = 136 m).",
      "4. Comprueba que el observador, al navegar en esa zona comprimida a 68 m/s, cruza las ondas a fo = (340 - 68) / 136 = 272 / 136 = 2.000 Hz."
    ],
    explanation: "Aplicando la fórmula general con vf = vo = v: fo = fe * (c - v)/(c - v) = fe * 1 = 2.0 Hz. Físicamente: la fuente acorta la longitud de onda en un factor (c - v)/c, pero la velocidad relativa del receptor es (c - v). El cociente da exactamente c/λ0 = fe.",
    quiz: {
      question: "¿Se cumple esta igualdad fo = fe para cualquier velocidad subsónica mientras vf = vo?",
      options: [
        { text: "Sí, siempre que el movimiento sea colineal en el mismo sentido y subsónico (vf = vo < c).", isCorrect: true, feedback: "¡Correcto! En cualquier medio homogéneo en régimen subsónico en tándem, no hay corrimiento neto de frecuencia." },
        { text: "No, solo funciona si la velocidad es 0.", isCorrect: false, feedback: "Incorrecto. Funciona para cualquier velocidad subsónica constante compartida." },
        { text: "No, depende de la temperatura del aire.", isCorrect: false, feedback: "Incorrecto. La velocidad c se cancela en la razón." }
      ]
    }
  },
  {
    id: 7,
    title: "7. Paso Lateral Bidimensional (Efecto Doppler 2D)",
    tag: "Geometría 2D",
    objective: "Estudiar la variación continua y suave de frecuencia cuando la fuente pasa cerca de un observador desplazado lateralmente (yo ≠ yf), deduciendo el vector unitario retardado n.",
    config: {
      f: 2.0,
      c: 340.0,
      sourceX0: -250.0,
      sourceY0: 0.0,
      sourceVx: 100.0,
      sourceVy: 0.0,
      obsX0: 0.0,
      obsY0: 80.0, // Desplazado 80 metros en el eje Y
      obsVx: 0.0,
      obsVy: 0.0,
      duration: 6.0,
      sourceType: 'car',
      is2D: true
    },
    prediction: {
      question: "Cuando la fuente pasa de largo frente a un observador que está en la acera a 80 metros, ¿cómo evoluciona la frecuencia percibida en el tiempo?",
      options: [
        { text: "Comienza en un valor alto constante, luego hace una transición suave decreciente al pasar cerca, y termina en un valor bajo constante.", isCorrect: true, feedback: "¡Excelente! Este es el clásico sonido '¡ñeeee-ooooom!' de una ambulancia o auto de carreras. El factor de proyección n·vf varía suavemente con el coseno del ángulo." },
        { text: "La frecuencia salta instantáneamente de golpe sin ninguna transición suave.", isCorrect: false, feedback: "Incorrecto. El salto abrupto solo ocurriría si el observador estuviera exactamente en la línea de colisión (y = 0)." },
        { text: "La frecuencia permanece siempre constante.", isCorrect: false, feedback: "Incorrecto. La dirección del vector de onda respecto a la velocidad cambia continuamente." }
      ]
    },
    procedure: [
      "1. Observa el plano 2D: la fuente avanza por el eje X (y = 0) y el micrófono está arriba en (0, 80 m).",
      "2. Inicia la simulación y observa la curva en la gráfica de frecuencias.",
      "3. Nota cómo la curva desciende suavemente a través del punto de aproximación mínima retardada.",
      "4. En la modalidad de audio tonal, escucha cómo la altura tonal cae de agudo a grave con glissando continuo."
    ],
    explanation: "El término relevante es el producto escalar n · vf = vf * cos(θ_retardado). Lejos a la izquierda, θ ≈ 0 y fo ≈ fe * c/(c - vf) (agudo). En el instante en que el frente emitido con θ = 90° llega al observador, n · vf = 0 y fo = fe. Lejos a la derecha, θ ≈ 180° y fo ≈ fe * c/(c + vf) (grave).",
    quiz: {
      question: "En el instante en que el frente de onda recibido fue emitido perpendicularmente a la trayectoria de la fuente (cos θ = 0), ¿cuánto vale la frecuencia observada?",
      options: [
        { text: "fo = fe (la frecuencia observada es exactamente la frecuencia propia emitida).", isCorrect: true, feedback: "¡Correcto! Cuando la velocidad es perpendicular a la línea de visión retardada, la componente radial Doppler se anula en la física clásica." },
        { text: "fo = 0 Hz.", isCorrect: false, feedback: "Incorrecto. No se hace cero, se iguala a la emitida." },
        { text: "fo = infinito.", isCorrect: false, feedback: "Incorrecto. La frecuencia es completamente regular." }
      ]
    }
  },
  {
    id: 8,
    title: "8. Regímenes Sónico y Supersónico (Mach 1 y Mach 1.5)",
    tag: "Supersónico",
    objective: "Explorar la barrera acústica en M = 1 y la formación del cono de Mach envolvente para M > 1, calculando el semíangulo μ = arcsin(1/M) y el estampido sónico.",
    config: {
      f: 2.5,
      c: 340.0,
      sourceX0: -280.0,
      sourceY0: 0.0,
      sourceVx: 510.0, // Mach 1.5 (510 / 340 = 1.5)
      sourceVy: 0.0,
      obsX0: 0.0,
      obsY0: 100.0,
      obsVx: 0.0,
      obsVy: 0.0,
      duration: 3.5,
      sourceType: 'plane',
      is2D: true
    },
    prediction: {
      question: "Para una aeronave volando a Mach 1.5 (vf = 510 m/s > c), ¿qué escucha el observador antes de que la envolvente de choque lo alcance?",
      options: [
        { text: "Silencio absoluto (zona de calma). Ninguna onda acústica puede adelantarse a la fuente supersónica; el sonido llega solo tras el cruce del cono de Mach.", isCorrect: true, feedback: "¡Exactamente! Fuera del cono de Mach no hay frentes de onda. El observador no oye nada hasta que el frente de choque tangente (estampido sónico) cruza su posición." },
        { text: "Un tono muy agudo que aumenta continuamente.", isCorrect: false, feedback: "Incorrecto. Las ondas no pueden propagarse por delante de la aeronave supersónica." },
        { text: "El sonido de la aeronave invertido hacia atrás.", isCorrect: false, feedback: "La inversión temporal de llegada ocurre dentro de la región perturbada, no en la zona de silencio previo." }
      ]
    },
    procedure: [
      "1. Observa el avión supersónico configurado a vf = 510 m/s (Mach 1.50).",
      "2. Nota las dos líneas rojas de choque que forman el cono de Mach con semíangulo μ = arcsin(1 / 1.5) = arcsin(0.6667) ≈ 41.8°.",
      "3. Inicia la simulación: observa que el avión viaja más rápido que sus propias ondas.",
      "4. Fíjate en el instante exacto en que la línea roja del frente de choque toca el micrófono: ¡en ese instante preciso se dispara la sonificación del estampido sónico!"
    ],
    explanation: "Para M > 1, la fuente supera la rapidez de propagación del medio. Todos los frentes esféricos emitidos en el pasado quedan contenidos dentro de una superficie cónica tangente cuya envolvente forma un ángulo μ = arcsin(1/M) con la trayectoria. El paso de esta superficie sobre un observador genera una discontinuidad abrupta de presión conocida como estampido sónico.",
    quiz: {
      question: "Para una velocidad de Mach 2.0 (el doble de la velocidad del sonido), ¿cuánto vale el semíangulo de Mach μ?",
      options: [
        { text: "μ = arcsin(1 / 2.0) = arcsin(0.5) = 30.0°.", isCorrect: true, feedback: "¡Perfecto! Para Mach 2, el semíangulo del cono de Mach es exactamente 30 grados." },
        { text: "μ = 45.0°.", isCorrect: false, feedback: "Incorrecto. 45° correspondería a Mach = 1 / sin(45°) ≈ 1.414 (raíz de 2)." },
        { text: "μ = 60.0°.", isCorrect: false, feedback: "Incorrecto. Revisa la fórmula: sin(μ) = 1/M -> sin(μ) = 0.5 -> μ = 30°." }
      ]
    }
  }
];
