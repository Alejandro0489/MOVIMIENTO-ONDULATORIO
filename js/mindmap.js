/**
 * ============================================================================
 * MAPA MENTAL CONCEPTUAL INTERACTIVO EN SVG
 * Unidad Temática: Movimiento Oscilatorio y Ondulatorio
 * Cuaderno Digital Interactivo: Física 3
 * ============================================================================
 */

class ConceptMindMap {
  constructor(svgId, cardId) {
    const el = document.getElementById(svgId);
    if (!el) return;

    if (el.tagName.toLowerCase() !== 'svg') {
      let childSvg = el.querySelector('svg');
      if (!childSvg) {
        childSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        childSvg.setAttribute('class', 'mindmap-svg');
        childSvg.setAttribute('viewBox', '0 0 900 520');
        childSvg.setAttribute('width', '100%');
        childSvg.setAttribute('height', '100%');
        el.appendChild(childSvg);
      }
      this.svg = childSvg;
    } else {
      this.svg = el;
    }

    this.card = document.getElementById(cardId);

    this.scale = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;

    this.nodesData = [
      {
        id: 'root',
        title: 'Movimiento Oscilatorio & Ondulatorio',
        category: 'root',
        x: 450,
        y: 260,
        r: 44,
        color: '#c59b27',
        textColor: '#120e06',
        desc: 'Núcleo temático de la unidad. Estudio de sistemas que experimentan fuerzas restauradoras y oscilaciones periódicas en torno a posiciones de equilibrio estable.',
        formula: 'F = -kx \\implies m\\frac{d^2x}{dt^2} + kx = 0',
        page: 5
      },
      // Rama 1: Cinemática
      {
        id: 'cinematica',
        parent: 'root',
        title: 'Cinemática del M.A.S.',
        category: 'branch',
        x: 180,
        y: 130,
        r: 32,
        color: '#2563eb',
        textColor: '#ffffff',
        desc: 'Ecuaciones temporales de posición, velocidad y aceleración armónica con relaciones de fase de π/2 y π.',
        formula: 'x(t) = A\\cos(\\omega t + \\phi)',
        page: 7
      },
      {
        id: 'velocidad',
        parent: 'cinematica',
        title: 'Velocidad y Aceleración',
        category: 'leaf',
        x: 80,
        y: 60,
        r: 25,
        color: '#16a34a',
        textColor: '#ffffff',
        desc: 'La velocidad adelanta en π/2 a la posición, y la aceleración se opone exactamente al desplazamiento.',
        formula: 'v_{\\max} = A\\omega, \\quad a_{\\max} = A\\omega^2',
        page: 7
      },
      // Rama 2: Dinámica
      {
        id: 'dinamica',
        parent: 'root',
        title: 'Dinámica & Ecuación Dif.',
        category: 'branch',
        x: 720,
        y: 130,
        r: 32,
        color: '#8b5a2b',
        textColor: '#ffffff',
        desc: 'Formulación newtoniana del oscilador armónico y resolución de la EDO lineal de segundo orden.',
        formula: '\\ddot{x} + \\omega_0^2 x = 0',
        page: 6
      },
      {
        id: 'hooke',
        parent: 'dinamica',
        title: 'Ley de Hooke',
        category: 'leaf',
        x: 840,
        y: 60,
        r: 25,
        color: '#7a1f29',
        textColor: '#ffffff',
        desc: 'Fuerza restauradora proporcional a la deformación y opuesta al sentido del movimiento.',
        formula: 'F_r = -k\\Delta x',
        page: 6
      },
      // Rama 3: Sistemas Físicos
      {
        id: 'sistemas',
        parent: 'root',
        title: 'Sistemas Físicos',
        category: 'branch',
        x: 180,
        y: 390,
        r: 32,
        color: '#d97706',
        textColor: '#ffffff',
        desc: 'Modelos reales: oscilador masa-resorte y péndulo simple con aproximación de pequeñas oscilaciones.',
        formula: 'T = 2\\pi\\sqrt{\\frac{m}{k}}, \\quad T = 2\\pi\\sqrt{\\frac{L}{g}}',
        page: 10
      },
      {
        id: 'pendulo',
        parent: 'sistemas',
        title: 'Péndulo Simple',
        category: 'leaf',
        x: 80,
        y: 460,
        r: 25,
        color: '#b45309',
        textColor: '#ffffff',
        desc: 'Masa suspendida de un hilo inextensible. Isocronismo para ángulos menores a 10 grados.',
        formula: '\\omega = \\sqrt{g/L}',
        page: 10
      },
      // Rama 4: Energía
      {
        id: 'energia',
        parent: 'root',
        title: 'Conservación de Energía',
        category: 'branch',
        x: 720,
        y: 390,
        r: 32,
        color: '#7c3aed',
        textColor: '#ffffff',
        desc: 'Intercambio armónico continuo entre energía potencial elástica y cinética.',
        formula: 'E = \\frac{1}{2}kA^2 = \\text{constante}',
        page: 7
      },
      {
        id: 'fasores',
        parent: 'energia',
        title: 'Fasores y Ondas',
        category: 'leaf',
        x: 840,
        y: 460,
        r: 25,
        color: '#0d6966',
        textColor: '#ffffff',
        desc: 'Vectores giratorios en el plano complejo y su proyección sinusoidal en tiempo real.',
        formula: 'v = \\lambda f',
        page: 10
      },
      // Rama 5: Ondas Armónicas (NUEVA RAMA CLAVE)
      {
        id: 'ondas',
        parent: 'root',
        title: 'Ondas Armónicas',
        category: 'branch',
        x: 450,
        y: 85,
        r: 34,
        color: '#0284c7',
        textColor: '#ffffff',
        desc: 'Propagación continua de perturbaciones sinusoidales en medios elásticos continuos sin transporte neto de masa.',
        formula: 'y(x,t) = A\\sin(kx - \\omega t + \\phi)',
        page: 8
      },
      {
        id: 'dalembert',
        parent: 'ondas',
        title: 'Ecuación de Onda',
        category: 'leaf',
        x: 320,
        y: 30,
        r: 25,
        color: '#0369a1',
        textColor: '#ffffff',
        desc: 'Ecuación diferencial unidimensional de d\'Alembert que vincula curvatura espacial y aceleración temporal.',
        formula: '\\frac{\\partial^2 y}{\\partial x^2} = \\frac{1}{v^2}\\frac{\\partial^2 y}{\\partial t^2}',
        page: 8
      },
      {
        id: 'cinematica-onda',
        parent: 'ondas',
        title: 'Cinemática Transversal',
        category: 'leaf',
        x: 580,
        y: 30,
        r: 25,
        color: '#0ea5e9',
        textColor: '#ffffff',
        desc: 'M.A.S. vertical de las partículas (vy, ay) perpendicular al avance horizontal de la onda con rapidez constante v.',
        formula: 'v_y = -\\omega A\\cos(\\theta), \\quad v = \\lambda f',
        page: 8
      },
      {
        id: 'potencia-onda',
        parent: 'ondas',
        title: 'Potencia & Energía',
        category: 'leaf',
        x: 450,
        y: 20,
        r: 23,
        color: '#0284c7',
        textColor: '#ffffff',
        desc: 'Transporte de energía elástica y cinética. La potencia media es proporcional al cuadrado de la amplitud y frecuencia.',
        formula: 'P_{\\text{prom}} = \\frac{1}{2}\\mu v\\omega^2 A^2',
        page: 8
      }
    ];

    this.init();
  }

  init() {
    if (!this.svg.querySelector('#mindmap-viewport-group')) {
      this.render();
    } else {
      this.bindNodeEvents();
    }
    this.setupInteractions();
    // Seleccionar por defecto el nodo raíz para que se muestre información académica inmediatamente
    setTimeout(() => {
      const rootNode = this.nodesData.find(n => n.id === 'root');
      if (rootNode) this.selectNode(rootNode);
    }, 100);
  }

  bindNodeEvents() {
    this.svg.querySelectorAll('.mindmap-node').forEach(el => {
      const id = el.getAttribute('data-id');
      const node = this.nodesData.find(n => n.id === id);
      if (node) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectNode(node);
        });
      }
    });
  }

  zoomIn() {
    this.scale = Math.min(this.scale * 1.25, 2.5);
    this.render();
  }

  zoomOut() {
    this.scale = Math.max(this.scale * 0.8, 0.5);
    this.render();
  }

  resetView() {
    this.scale = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.render();
  }

  render() {
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }

    // Filtro estándar SVG para sombras seguras en todos los navegadores
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'mindmapNodeGlow');
    filter.setAttribute('x', '-40%');
    filter.setAttribute('y', '-40%');
    filter.setAttribute('width', '180%');
    filter.setAttribute('height', '180%');
    const dropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
    dropShadow.setAttribute('dx', '0');
    dropShadow.setAttribute('dy', '4');
    dropShadow.setAttribute('stdDeviation', '4');
    dropShadow.setAttribute('flood-color', '#000000');
    dropShadow.setAttribute('flood-opacity', '0.7');
    filter.appendChild(dropShadow);
    defs.appendChild(filter);
    this.svg.appendChild(defs);

    // Contenedor principal con transformación de Pan & Zoom
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', 'mindmap-viewport-group');
    g.setAttribute('transform', `translate(${this.panX}, ${this.panY}) scale(${this.scale})`);

    // 1. Dibujar Líneas Conectoras (Curvas de Bézier)
    this.nodesData.forEach(node => {
      if (node.parent) {
        const parentNode = this.nodesData.find(n => n.id === node.parent);
        if (parentNode) {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          const dx = (node.x - parentNode.x) * 0.5;
          const d = `M ${parentNode.x} ${parentNode.y} C ${parentNode.x + dx} ${parentNode.y}, ${node.x - dx} ${node.y}, ${node.x} ${node.y}`;
          path.setAttribute('d', d);
          path.setAttribute('stroke', node.color);
          path.setAttribute('stroke-width', '2.5');
          path.setAttribute('stroke-opacity', '0.65');
          path.setAttribute('fill', 'none');
          g.appendChild(path);
        }
      }
    });

    // 2. Dibujar Nodos
    this.nodesData.forEach(node => {
      const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      nodeGroup.setAttribute('class', 'mindmap-node');
      nodeGroup.setAttribute('cursor', 'pointer');
      nodeGroup.setAttribute('data-id', node.id);

      // Círculo exterior (glow/borde)
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', node.x);
      circle.setAttribute('cy', node.y);
      circle.setAttribute('r', node.r);
      circle.setAttribute('fill', node.color);
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', node.category === 'root' ? '3.5' : '2');
      circle.setAttribute('filter', 'url(#mindmapNodeGlow)');

      // Texto de título
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x);
      text.setAttribute('y', node.y + (node.category === 'root' ? 4 : 3));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', node.textColor);
      text.setAttribute('font-size', node.category === 'root' ? '11px' : (node.category === 'branch' ? '10px' : '9px'));
      text.setAttribute('font-weight', '700');
      text.setAttribute('font-family', 'Outfit, sans-serif');
      text.textContent = node.title.split(' ')[0]; // Primera palabra en el nodo

      nodeGroup.appendChild(circle);
      nodeGroup.appendChild(text);

      // Etiqueta completa debajo del nodo
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', node.x);
      label.setAttribute('y', node.y + node.r + 14);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', '#ffffff');
      label.setAttribute('font-size', '11px');
      label.setAttribute('font-weight', '600');
      label.setAttribute('font-family', 'Outfit, sans-serif');
      label.textContent = node.title;
      nodeGroup.appendChild(label);

      // Evento de clic en nodo
      nodeGroup.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectNode(node);
      });

      g.appendChild(nodeGroup);
    });

    this.svg.appendChild(g);
  }

  selectNode(node) {
    if (!this.card) return;
    this.card.classList.add('active');
    this.card.style.display = 'block';
    this.card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <h4 style="font-family:'Cinzel', serif; font-size:1.15rem; color:${node.color}; display:flex; align-items:center; gap:8px;">
          <span style="width:12px; height:12px; border-radius:50%; background:${node.color}; display:inline-block;"></span>
          ${node.title}
        </h4>
        <button id="btn-close-mindmap-card" style="background:none; border:none; color:#f7eedf; cursor:pointer; font-size:1.1rem;">✕</button>
      </div>
      <p style="font-size:0.88rem; color:#d6cbbe; margin-bottom:10px; line-height:1.5;">${node.desc}</p>
      <div style="background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px; border-left:3px solid ${node.color}; font-family:'JetBrains Mono', monospace; font-size:0.9rem; margin-bottom:12px;">
        $$${node.formula}$$
      </div>
      <button class="btn-primary-vintage" style="font-size:0.8rem; padding:6px 14px; width:100%; justify-content:center;" onclick="window.notebookApp.goToPage(${node.page})">
        <span>Explorar en Página ${node.page}</span>
        <i data-lucide="arrow-right"></i>
      </button>
    `;

    document.getElementById('btn-close-mindmap-card')?.addEventListener('click', () => {
      this.card.classList.remove('active');
    });

    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(this.card, {
          delimiters: [{ left: '$$', right: '$$', display: false }],
          throwOnError: false
        });
      } catch(e) { console.warn('KaTeX mindmap card error:', e); }
    }

    if (window.lucide) {
      try { lucide.createIcons(); } catch(e) {}
    }
  }

  setupInteractions() {
    // Pan
    this.svg.addEventListener('mousedown', (e) => {
      this.isPanning = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      this.svg.classList.add('dragging');
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPanning) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      const g = document.getElementById('mindmap-viewport-group');
      if (g) g.setAttribute('transform', `translate(${this.panX}, ${this.panY}) scale(${this.scale})`);
    });

    window.addEventListener('mouseup', () => {
      this.isPanning = false;
      this.svg.classList.remove('dragging');
    });

    // Zoom Buttons
    document.getElementById('btn-mindmap-zoomin')?.addEventListener('click', () => {
      this.scale = Math.min(this.scale * 1.2, 2.5);
      this.render();
    });

    document.getElementById('btn-mindmap-zoomout')?.addEventListener('click', () => {
      this.scale = Math.max(this.scale * 0.8, 0.5);
      this.render();
    });

    document.getElementById('btn-mindmap-reset')?.addEventListener('click', () => {
      this.scale = 1.0;
      this.panX = 0;
      this.panY = 0;
      this.render();
    });
  }
}

window.ConceptMindMap = ConceptMindMap;
if (typeof globalThis !== 'undefined') globalThis.ConceptMindMap = ConceptMindMap;
