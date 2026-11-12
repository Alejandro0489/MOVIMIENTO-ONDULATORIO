# 📜 Tractatus Physicomathematicus: Cuaderno Interactivo de Física III
### *Movimiento Oscilatorio, Ondas Mecánicas & Efectos Acústicos*

[![Universidad](https://img.shields.io/badge/Universidad-Tecnol%C3%B3gica%20de%20Pereira-gold?style=for-the-badge)](https://www.utp.edu.co/)
[![Cátedra](https://img.shields.io/badge/C%C3%A1tedra-F%C3%ADsica%20III%20%7C%20Ondas-blue?style=for-the-badge)](#)
[![PWA](https://img.shields.io/badge/PWA-Ready%20%26%20Offline-success?style=for-the-badge)](#)
[![Licencia](https://img.shields.io/badge/Norma-APA%207.%C2%AA%20Edici%C3%B3n-brown?style=for-the-badge)](#)

---

## 🏛️ Autores & Créditos Universitarios
Trabajo de cátedra desarrollado para la asignatura de **Física III** en la **Universidad Tecnológica de Pereira (UTP)**:

- ✒️ **Darlyn Dayana Zapata**
- ✒️ **Jorge Alejandro Giraldo**
- ✒️ **Sara Vélez Alzate**

*Facultad de Ciencias Básicas &bull; Departamento de Física &bull; Programa de Ingeniería de Sistemas*

---

## 📖 Descripción General del Proyecto

El **Tractatus Physicomathematicus** es un **cuaderno digital interactivo y plataforma de simulación científica** diseñado bajo la estética editorial de un códice clásico renacentista sobre pergamino milimetrado. 

Combina el **rigor analítico de la física teórica y matemática** (demostraciones formales, deducciones de ecuaciones diferenciales, cálculo de magnitudes) con **motores de simulación interactiva en tiempo real** desarrollados en HTML5 Canvas, WebGL (Three.js) y Web Audio API.

---

## ✨ Características Principales

- 📜 **Estética Editorial Clásica**: Maquetación sobre textura de pergamino de alta definición, tipografías humanísticas (*Cinzel*, *IM Fell English*, *EB Garamond*) y esquemas renacentistas.
- 🧮 **Renderizado Matemático KaTeX**: Cientos de fórmulas matemáticas y ecuaciones diferenciales renderizadas a máxima velocidad y nitidez tipográfica vectorial.
- 🔬 **Simulaciones Físicas en Tiempo Real**:
  - Ondas estacionarias en cuerdas elásticas con condiciones de frontera Dirichlet ($x=0, x=L$).
  - Simulación acústica del Efecto Doppler con regímenes subsónicos, supersónicos (cono de Mach) y síntesis de audio en vivo.
  - Laboratorio 2D/3D (Three.js) de osciladores armónicos acoplados masa-resorte y péndulo simple.
  - Plano cartesiano interactivo de precisión estilo GeoGebra con regla milimétrica y cursores HUD.
- 🧠 **Mapa Mental Conceptual SVG**: Grafo interactivo en árbol con navegación dinámica (*Pan & Zoom*), nodos reactivos y fichas académicas flotantes.
- 📐 **Solver Analítico Nerdamer**: Motor simbólico integrado capaz de despejar cualquier variable física y generar procedimientos paso a paso.
- 🧭 **Consola de Navegación Scrubber**: Barra de desplazamiento y selección de páginas integrada naturalmente al pie de cada hoja, con ticks numéricos y previsualización de capítulos.
- ⚡ **Progressive Web App (PWA)**: Soporte completo offline con Service Worker inteligente y estrategia de caché *Network-First*.

---

## 🗂️ Estructura del Cuaderno (16 Capítulos)

| Pág. | Título del Módulo | Descripción Académica |
| :---: | :--- | :--- |
| **0** | **Portada Oficial** | Arte renacentista original grabado, cuba de ondas de Huygens, fórmulas fundamentales y datos de los autores. |
| **1** | **Índice General & Sumario** | Guía de navegación temática, descripción de los 16 módulos y colofón editorial. |
| **2** | **Mapa Mental Conceptual** | Estructura cognitiva interactiva en SVG con 11 nodos interconectados (M.A.S., Cinemática, Dinámica, Ondas, Energía, d'Alembert). |
| **3** | **Reseña Histórica & Línea de Tiempo** | Cronología interactiva desde Galileo Galilei (1602) y Hooke (1678) hasta Fourier (1822) y el siglo XX. |
| **4** | **Conceptos Fundamentales** | Definición rigurosa de ciclo, periodo ($T$), frecuencia ($f$), frecuencia angular ($\omega$), fase inicial ($\phi$) y amplitud ($A$). |
| **5** | **Ecuación Diferencial del M.A.S.** | Deducción newtoniana formal a partir de la ley de Hooke, resolución de la EDO homogénea de 2.° orden y polinomio característico. |
| **6** | **Cinemática Analítica del M.A.S.** | Ecuaciones horarias de posición $x(t)$, velocidad $v(t)$, aceleración $a(t)$, relaciones de cuadratura de fase y análisis fasorial. |
| **7** | **Ondas Armónicas en Medios Elásticos** | Deducción analítica de la ecuación de onda unidimensional de Jean le Rond d'Alembert ($\frac{\partial^2 y}{\partial x^2} = \frac{1}{v^2}\frac{\partial^2 y}{\partial t^2}$) y potencia media. |
| **8** | **Laboratorio Virtual 2D & 3D** | Experimentación con masa-resorte, péndulo simple, representación 3D con Three.js y tren de ondas sinusoidales viajeras. |
| **9** | **Plano Cartesiano GeoGebra** | Graficador trigonométrico con regla móvil de inspección, cursor de coordenadas, marcadores de crestas y control de paleta cromática. |
| **10** | **Taller de Problemas Resueltos I & II** | Ejercicios tipo examen de M.A.S. con demostraciones completas y cálculo de energías mecánica, cinética y potencial. |
| **11** | **Taller de Problemas: Ondas Armónicas** | Problemas analíticos de ondas viajeras, velocidad de fase, densidad lineal ($\mu$), tensión ($T$) y transporte energético. |
| **12** | **Ejercicios Prácticos & Solver** | Ejercicios seleccionados de cátedra con soluciones paso a paso desplegables y solver de cálculo algebraico instantáneo. |
| **13** | **Glosario Científico Ilustrado** | Diccionario de terminología física y matemática con buscador en vivo en tiempo real. |
| **14** | **Referencias Bibliográficas & Colofón** | Bibliografía normalizada en formato APA 7.ª edición (Serway, Tipler, Halliday, French) y notas de imprenta digital. |
| **15** | **Efecto Doppler Acústico** | Laboratorio dinámico de frentes de onda Doppler 2D, cono de Mach supersónico, oscilograma, espectrograma FFT y síntesis de audio. |
| **16** | **Ondas Estacionarias en Cuerdas Tensadas** | Simulación de modos normales de vibración ($n=1..8$), velocidad ultra lenta configurable ($0.03\times$), oscilograma $y(t)$, telemetría y solver. |

---

## 🔬 Laboratorios Interactivos Especializados

### 1. Ondas Estacionarias en Cuerdas Tensadas ([`ondas-cuerdas.html`](file:///c:/Users/aleja/OneDrive/Documentos/Universidad/S11/FISICA%203/Moviemiento%20ondulario/Libro/ondas-cuerdas.html))
- **Condiciones de Frontera Dirichlet**: Nodos en ambos extremos fijos ($y(0,t) = 0$ y $y(L,t) = 0$).
- **Control de Rapidez Temporal**: Inicia por defecto en **`0.03×`** (ultra lenta) para apreciar la fase de superposición, permitiendo preajustes ($0.05\times, 0.10\times, 0.25\times, 0.50\times, 1.00\times$) o valores arbitrarios ingresados por el usuario.
- **Osciloscopio Virtual en Vivo**: Sonda $y(t)$ arrastrable que muestra el M.A.S. transversal puntual en cualquier punto de la cuerda.
- **Telemetría Científica de 4 Cuadrantes**: Cálculo dinámico de longitudes de onda ($\lambda_n = \frac{2L}{n}$), frecuencias armónicas ($f_n = n \frac{v}{2L}$), rapidez de propagación ($v = \sqrt{T/\mu}$) y energía total constante.
- **Solver Paso a Paso**: Módulo interactivo de despeje de magnitudes con procedimiento analítico y botón para inyectar los resultados en la simulación.
- **4 Retos Didácticos**: Sistema de autoevaluación con cálculo de tensión, densidad, masa y número de nodos.

### 2. Simulador del Efecto Doppler Acústico ([`doppler.html`](file:///c:/Users/aleja/OneDrive/Documentos/Universidad/S11/FISICA%203/Moviemiento%20ondulario/Libro/doppler.html))
- **Cinemática de Frentes de Onda**: Emisión periódica de crestas circulares que se comprimen o dilatan según la velocidad relativa fuente-observador.
- **Cono de Mach & Barrera del Sonido**: Representación visual de frentes de choque cuando la velocidad de la fuente supera la velocidad del sonido ($v_s \ge c = 343\text{ m/s}$).
- **Síntesis de Audio con Web Audio API**: Generación en tiempo real del tono acústico modulado en frecuencia percibido por el observador.
- **8 Escenarios Predefinidos**: Ambulancia acercándose/alejándose, fuente y observador en persecución, observador en movimiento, avión supersónico ($M=1.5$), etc.

---

## ⌨️ Controles & Atajos de Teclado (Modo Presentación)

Diseñado para exposiciones fluidas en proyector o pantalla compartida:

| Tecla / Acción | Función |
| :---: | :--- |
| `→` / `AvPág` | Avanzar a la siguiente página del cuaderno. |
| `←` / `RePág` | Retroceder a la página anterior. |
| `Inicio` (`Home`) | Volver inmediatamente a la **Portada Oficial (Pág. 0)**. |
| `Fin` (`End`) | Saltar al laboratorio de **Ondas Estacionarias (Pág. 16)**. |
| `Espacio` | Pausar o reanudar las simulaciones en vivo. |
| `1` a `8` | Cambiar instantáneamente al modo armónico $n=1..8$ (en cuerdas). |
| `M` | Activar o silenciar el sintetizador de audio. |
| `R` | Reiniciar el tiempo de la simulación ($t = 0\text{ s}$). |
| `Deslizador Scrubber` | Arrastrar libremente la barra inferior para saltar entre páginas de forma continua. |

---

## 🛠️ Tecnologías y Librerías Utilizadas

- **HTML5 Semántico & CSS3 Moderno**: Flexbox, CSS Grid, variables custom (`var(--...)`), glassmorphism y diseño responsivo para pantallas de portátiles, proyectores y tablets.
- **JavaScript Moderno (ES6+)**: Programación orientada a objetos modular (sin dependencias pesadas de frameworks), bucle cinemático con `requestAnimationFrame`.
- **Three.js (WebGL)**: Renderizado volumétrico tridimensional del oscilador armónico elástico.
- **KaTeX v0.16.9**: Motor de maquetación tipográfica de fórmulas matemáticas en LaTeX a 60 FPS.
- **Nerdamer Core**: Álgebra computacional simbólica para despeje de ecuaciones en tiempo de ejecución.
- **Lucide Icons**: Iconografía técnica y científica vectorial.
- **Web Audio API**: Síntesis de ondas acústicas sinusoidales y modulación de frecuencia en tiempo real.
- **PWA Service Worker**: Estrategia *Network-First* con versionado estricto (`v11.0`) para garantizar la carga de archivos actualizados sin problemas de caché.

---

## 🚀 Guía de Instalación y Ejecución Local

El proyecto es completamente autocontenido y no requiere instalación de dependencias vía Node.js ni bases de datos.

### Opción 1: Apertura Directa en el Navegador
1. Clona o descarga este repositorio en tu equipo.
2. Haz doble clic en el archivo [`index.html`](file:///c:/Users/aleja/OneDrive/Documentos/Universidad/S11/FISICA%203/Moviemiento%20ondulario/Libro/index.html) para abrirlo en Google Chrome, Microsoft Edge, Mozilla Firefox o Brave.

### Opción 2: Servidor Local (Recomendado para Service Worker y PWA)
Puedes servir los archivos a través de un servidor HTTP local ligero:

```bash
# Con Python 3
python -m http.server 8000

# O con npx (Node.js)
npx serve .
```

Luego abre tu navegador en `http://localhost:8000`.

### Acceso Directo a los Laboratorios Standalone
Si deseas proyectar o trabajar únicamente en los laboratorios independientes a pantalla completa:
- **Ondas Estacionarias en Cuerdas**: [`ondas-cuerdas.html`](file:///c:/Users/aleja/OneDrive/Documentos/Universidad/S11/FISICA%203/Moviemiento%20ondulario/Libro/ondas-cuerdas.html)
- **Efecto Doppler Acústico**: [`doppler.html`](file:///c:/Users/aleja/OneDrive/Documentos/Universidad/S11/FISICA%203/Moviemiento%20ondulario/Libro/doppler.html)

---

## 📚 Bibliografía de Referencia

1. **Serway, R. A., & Jewett, J. W.** (2018). *Física para ciencias e ingeniería* (Vol. 1, 10.ª ed.). Cengage Learning.
2. **Tipler, P. A., & Mosca, G.** (2010). *Física para la ciencia y la tecnología: Oscilaciones y ondas* (Vol. 1, 6.ª ed.). Editorial Reverté.
3. **Halliday, D., Resnick, R., & Walker, J.** (2014). *Fundamentals of Physics* (10th ed.). John Wiley & Sons.
4. **French, A. P.** (1971). *Vibrations and Waves* (M.I.T. Introductory Physics Series). W. W. Norton & Company.
5. **Young, H. D., & Freedman, R. A.** (2018). *Sears y Zemansky: Física universitaria con física moderna* (Vol. 1, 14.ª ed.). Pearson Educación.

---

<div align="center">
  <sub>Universidad Tecnológica de Pereira &bull; Facultad de Ciencias Básicas &bull; Pereira, Colombia &bull; 2026</sub>
</div>

