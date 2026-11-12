/**
 * ============================================================================
 * CONTROLADOR PRINCIPAL DE LA APLICACIÓN (SPA / PWA)
 * Cuaderno Digital Interactivo: Física 3 - M.A.S. & Ondas Armónicas
 * Autores: Darlyn Dayana Zapata • Jorge Alejandro Giraldo • Sara Vélez Alzate
 * ============================================================================
 */

class NotebookApp {
  constructor() {
    this.currentPage = 0; // Inicia en Portada (Pág 0)
    this.totalPages = 17; // Páginas 0 a 16
    this.viewMode = 'paginated';

    this.pageTitles = [
      "Portada Editorial",
      "Índice General & Equipo",
      "Mapa Mental Conceptual",
      "Reseña Histórica & Línea de Tiempo",
      "Conceptos Fundamentales & Magnitudes",
      "Ecuación Diferencial del M.A.S.",
      "Cinemática Completa: Demostraciones",
      "Ondas Armónicas & Ec. de d'Alembert",
      "Laboratorio Virtual Interactivo",
      "Plano Cartesiano GeoGebra",
      "Taller de Problemas Resueltos I & II",
      "Taller de Ondas Armónicas",
      "Ejercicios Prácticos de Cátedra & Solver",
      "Glosario Científico Ilustrado",
      "Referencias Bibliográficas APA 7.ª",
      "Efecto Doppler Acústico & Regímenes Supersónicos",
      "Ondas Estacionarias en Cuerdas Tensadas"
    ];

    this.pages = document.querySelectorAll('.notebook-page');
    this.pageIndicator = document.getElementById('dock-page-text');
    this.chapterPreview = document.getElementById('dock-chapter-preview');
    this.sliderScrubber = document.getElementById('dock-page-slider');
    this.sliderTooltip = document.getElementById('dock-slider-tooltip');
    this.btnPrev = document.getElementById('dock-btn-prev');
    this.btnNext = document.getElementById('dock-btn-next');
    this.modalToc = document.getElementById('modal-toc-overlay');
    this.pageSelect = document.getElementById('nav-page-select');
    this.pageCurrentText = document.getElementById('nav-page-current');

    this.init();
  }

  init() {
    this.populatePageSelect();
    this.setupPWA();
    this.setupNavigation();
    this.setupKeyboard();
    this.setupTeamModal();
    this.setupExerciseToggles();
    this.setupFullscreen();
    this.setupGlossaryFilter();
    this.setupGeogebraStyleControls();

    // Renderizar todas las fórmulas matemáticas del documento con KaTeX
    this.renderMath();

    // Actualizar estado inicial
    this.updateNavigationUI();

    // Inicializar módulos secundarios cuando el DOM esté listo
    setTimeout(() => {
      this.initModules();
      this.renderMath(); // Segunda pasada para asegurar KaTeX en todos los componentes
    }, 150);
  }

  renderMath() {
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'svg'],
        throwOnError: false
      });
    }
  }

  populatePageSelect() {
    if (!this.pageSelect) return;
    this.pageSelect.innerHTML = '';
    this.pageTitles.forEach((title, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${idx}. ${title}`;
      this.pageSelect.appendChild(opt);
    });
    this.pageSelect.addEventListener('change', (e) => {
      const page = parseInt(e.target.value, 10);
      if (!isNaN(page)) this.goToPage(page);
    });
  }

  setupPWA() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        reg.update();
        console.log('PWA ServiceWorker activo y actualizado:', reg.scope);
      }).catch((err) => {
        console.log('PWA fallback:', err);
      });
    }
    // Limpiar caches obsoletas para garantizar frescura visual
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          if (key !== 'fisica3-cuaderno-v11-presentation') {
            caches.delete(key);
          }
        });
      });
    }
  }

  setupNavigation() {
    // Botones del dock inferior
    this.btnPrev?.addEventListener('click', () => this.prevPage());
    this.btnNext?.addEventListener('click', () => this.nextPage());

    document.getElementById('nav-btn-prev')?.addEventListener('click', () => this.prevPage());
    document.getElementById('nav-btn-next')?.addEventListener('click', () => this.nextPage());
    document.getElementById('nav-btn-home')?.addEventListener('click', () => this.goToPage(0));
    document.getElementById('dock-btn-home')?.addEventListener('click', () => this.goToPage(0));
    document.getElementById('btn-open-book')?.addEventListener('click', () => this.goToPage(1));

    document.getElementById('dock-btn-toc')?.addEventListener('click', () => this.toggleTocModal(true));
    document.getElementById('btn-close-toc-modal')?.addEventListener('click', () => this.toggleTocModal(false));
    this.modalToc?.addEventListener('click', (e) => {
      if (e.target === this.modalToc) this.toggleTocModal(false);
    });

    // Desplazamiento vertical dentro de la página (viewport de lectura y ventana)
    const scrollUp = () => {
      const vp = document.querySelector('.notebook-viewport');
      if (vp) vp.scrollTo({ top: 0, behavior: 'smooth' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const scrollDown = () => {
      const vp = document.querySelector('.notebook-viewport');
      const maxScroll = vp ? vp.scrollHeight : document.body.scrollHeight;
      if (vp) vp.scrollTo({ top: maxScroll, behavior: 'smooth' });
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    document.getElementById('dock-btn-scroll-top')?.addEventListener('click', scrollUp);
    document.getElementById('dock-btn-scroll-bottom')?.addEventListener('click', scrollDown);
    document.getElementById('btn-scroller-top')?.addEventListener('click', scrollUp);
    document.getElementById('btn-scroller-bottom')?.addEventListener('click', scrollDown);

    // Puntos del riel de scroll lateral derecho
    document.querySelectorAll('.scroller-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        const p = parseInt(dot.getAttribute('data-goto-page'), 10);
        if (!isNaN(p)) this.goToPage(p);
      });
    });

    // Barra deslizadora horizontal inferior (Scrubber)
    if (this.sliderScrubber) {
      this.sliderScrubber.addEventListener('input', (e) => {
        const p = parseInt(e.target.value, 10);
        const pct = (p / (this.totalPages - 1)) * 100;
        this.sliderScrubber.style.background = `linear-gradient(to right, #f59e0b 0%, #f59e0b ${pct}%, rgba(139, 90, 43, 0.35) ${pct}%, rgba(139, 90, 43, 0.35) 100%)`;
        if (this.sliderTooltip) {
          const title = this.pageTitles[p] || `Página ${p}`;
          this.sliderTooltip.textContent = `Pág. ${p}: ${title}`;
          this.sliderTooltip.style.left = `${pct}%`;
          this.sliderTooltip.classList.add('active');
        }
        this.goToPage(p, false);
      });

      this.sliderScrubber.addEventListener('change', () => {
        if (this.sliderTooltip) this.sliderTooltip.classList.remove('active');
      });

      this.sliderScrubber.addEventListener('mouseleave', () => {
        if (this.sliderTooltip) this.sliderTooltip.classList.remove('active');
      });
    }

    // Enlaces directos a páginas
    document.querySelectorAll('[data-page], [data-goto-page]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const p = parseInt(el.getAttribute('data-page') || el.getAttribute('data-goto-page'), 10);
        if (!isNaN(p)) {
          this.goToPage(p);
          this.toggleTocModal(false);
        }
      });
    });
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        this.nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        this.prevPage();
      } else if (e.key === 'Home') {
        this.goToPage(0);
      } else if (e.key === 'End') {
        this.goToPage(this.totalPages - 1);
      } else if (e.key === 'Escape') {
        this.toggleTocModal(false);
        document.getElementById('team-modal')?.classList.remove('active');
      }
    });
  }

  setupTeamModal() {
    const btnOpen = document.getElementById('btn-open-team');
    const btnClose = document.getElementById('btn-close-team');
    const modal = document.getElementById('team-modal');

    btnOpen?.addEventListener('click', () => modal?.classList.add('active'));
    btnClose?.addEventListener('click', () => modal?.classList.remove('active'));
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  setupExerciseToggles() {
    // Acordeones individuales de los 5 ejercicios prácticos
    document.querySelectorAll('.btn-step-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const box = document.getElementById(targetId);
        if (box) {
          const isOpen = box.classList.toggle('active');
          const chevron = btn.querySelector('.chevron-icon');
          if (chevron) {
            chevron.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
          }
        }
      });
    });

    // Botón global para desplegar u ocultar todos los pasos a la vez
    const btnAll = document.getElementById('btn-toggle-all-steps');
    if (btnAll) {
      let allExpanded = false;
      btnAll.addEventListener('click', () => {
        allExpanded = !allExpanded;
        document.querySelectorAll('.step-explanation-box').forEach((box) => {
          box.classList.toggle('active', allExpanded);
        });
        document.querySelectorAll('.btn-step-toggle .chevron-icon').forEach((ch) => {
          ch.style.transform = allExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
        });
        const txt = document.getElementById('text-toggle-all-steps');
        if (txt) {
          txt.textContent = allExpanded ? 'Ocultar todos los Pasos a Paso' : 'Desplegar todos los Pasos a Paso';
        }
      });
    }
  }

  setupFullscreen() {
    const btnFs = document.getElementById('btn-toggle-fullscreen');
    if (!btnFs) return;

    btnFs.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        btnFs.innerHTML = `<i data-lucide="minimize"></i>`;
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        btnFs.innerHTML = `<i data-lucide="maximize"></i>`;
      }
      if (window.lucide) lucide.createIcons();
    });
  }

  goToPage(pageNum, shouldScroll = true) {
    if (pageNum < 0 || pageNum >= this.totalPages) return;
    this.currentPage = pageNum;
    this.pages = document.querySelectorAll('.notebook-page');

    this.pages.forEach((p) => {
      const pId = p.getAttribute('id');
      const targetMatch = pId === `page-${pageNum}`;
      p.classList.toggle('active', targetMatch);
      p.classList.toggle('active-page', targetMatch);
    });

    if (shouldScroll) {
      const vp = document.querySelector('.notebook-viewport');
      if (vp) vp.scrollTo({ top: 0, behavior: 'smooth' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    this.updateNavigationUI();

    // Redimensionar lienzos interactivos según la página
    if (pageNum === 2) {
      if (!window.conceptMindMap && (window.ConceptMindMap || typeof ConceptMindMap !== 'undefined')) {
        const MindMapClass = window.ConceptMindMap || ConceptMindMap;
        window.conceptMindMap = new MindMapClass('mindmap-svg-element', 'mindmap-info-card');
      }
      if (window.conceptMindMap) {
        window.conceptMindMap.render();
        const rootNode = window.conceptMindMap.nodesData.find(n => n.id === 'root');
        if (rootNode) window.conceptMindMap.selectNode(rootNode);
      }
    } else if (pageNum === 8 && window.waveLab) {
      window.waveLab.render();
    } else if (pageNum === 9 && window.geoPlotter) {
      window.geoPlotter.resize();
    } else if (pageNum === 15) {
      if (!window.dopplerApp && window.DopplerApp) {
        window.dopplerApp = new DopplerApp();
      }
      setTimeout(() => {
        if (window.dopplerApp) {
          window.dopplerApp.renderer.resize();
          window.dopplerApp.renderer.fitScene();
          window.dopplerApp.charts.resize();
          window.dopplerApp.updateUiState();
        }
      }, 50);
    } else if (pageNum === 16) {
      if (!window.standingWavesEmbed && window.StandingWavesSimulator) {
        window.standingWavesEmbed = new StandingWavesSimulator({
          prefix: 'embed',
          canvasId: 'embed-canvas-standing-waves',
          isEmbedded: true
        });
      }
      setTimeout(() => {
        if (window.standingWavesEmbed) {
          window.standingWavesEmbed.resizeCanvas();
          window.standingWavesEmbed.render();
        }
      }, 60);
    }

    // Asegurar que KaTeX renderice cualquier ecuación dinámica
    this.renderMath();
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.goToPage(this.currentPage + 1);
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.goToPage(this.currentPage - 1);
    }
  }

  updateNavigationUI() {
    // Barra de progreso de lectura
    const readingBar = document.getElementById('reading-progress-bar');
    if (readingBar) {
      const pct = (this.currentPage / (this.totalPages - 1)) * 100;
      readingBar.style.width = `${pct}%`;
    }

    // Textos de indicador
    if (this.pageIndicator) {
      this.pageIndicator.textContent = this.currentPage === 0
        ? 'Portada Oficial'
        : `Página ${this.currentPage} de ${this.totalPages - 1}`;
    }

    if (this.pageCurrentText) {
      this.pageCurrentText.textContent = this.currentPage === 0
        ? 'Portada'
        : `Pág. ${this.currentPage}`;
    }

    if (this.chapterPreview) {
      this.chapterPreview.textContent = this.pageTitles[this.currentPage] || '';
    }

    // Sincronizar select
    if (this.pageSelect) {
      this.pageSelect.value = this.currentPage;
    }

    // Sincronizar deslizador horizontal
    if (this.sliderScrubber) {
      this.sliderScrubber.value = this.currentPage;
      const pct = (this.currentPage / (this.totalPages - 1)) * 100;
      this.sliderScrubber.style.background = `linear-gradient(to right, #f59e0b 0%, #f59e0b ${pct}%, rgba(139, 90, 43, 0.35) ${pct}%, rgba(139, 90, 43, 0.35) 100%)`;
    }

    // Resaltar número activo en las marcas del deslizador
    document.querySelectorAll('.dock-slider-ticks span').forEach((tick) => {
      const p = parseInt(tick.getAttribute('data-page') || tick.textContent, 10);
      tick.classList.toggle('active', p === this.currentPage);
    });

    // Botones de navegación
    const isFirst = (this.currentPage === 0);
    const isLast = (this.currentPage === this.totalPages - 1);

    if (this.btnPrev) this.btnPrev.disabled = isFirst;
    if (this.btnNext) this.btnNext.disabled = isLast;

    const navPrev = document.getElementById('nav-btn-prev');
    const navNext = document.getElementById('nav-btn-next');
    if (navPrev) navPrev.disabled = isFirst;
    if (navNext) navNext.disabled = isLast;

    // Resaltar en el modal de índice
    document.querySelectorAll('.toc-item').forEach((item) => {
      const p = parseInt(item.getAttribute('data-goto-page'), 10);
      item.classList.toggle('current', p === this.currentPage);
    });

    // Resaltar en el riel de scroll derecho
    document.querySelectorAll('.scroller-dot').forEach((dot) => {
      const p = parseInt(dot.getAttribute('data-goto-page'), 10);
      dot.classList.toggle('active', p === this.currentPage);
    });
  }

  toggleTocModal(open) {
    if (!this.modalToc) return;
    this.modalToc.classList.toggle('active', open);
  }

  setupGlossaryFilter() {
    const input = document.getElementById('glossary-search-input');
    if (!input) return;

    input.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      document.querySelectorAll('.glossary-card').forEach((card) => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? 'block' : 'none';
      });
    });
  }

  setupGeogebraStyleControls() {
    const trigger = document.getElementById('geo-style-trigger');
    const dropdown = document.getElementById('geo-style-dropdown');
    if (trigger && dropdown) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
      });
      document.addEventListener('click', () => dropdown.classList.remove('active'));
      dropdown.addEventListener('click', (e) => e.stopPropagation());
    }

    // Herramientas de barra flotante GeoGebra
    document.querySelectorAll('[data-geo-tool]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-geo-tool]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tool = btn.getAttribute('data-geo-tool');
        if (window.geoPlotter) window.geoPlotter.setTool(tool);
      });
    });

    document.getElementById('geo-btn-zoomin')?.addEventListener('click', () => window.geoPlotter?.zoomIn());
    document.getElementById('geo-btn-zoomout')?.addEventListener('click', () => window.geoPlotter?.zoomOut());
    document.getElementById('geo-btn-reset')?.addEventListener('click', () => window.geoPlotter?.resetView());

    // Swatches de color
    document.querySelectorAll('.color-swatch').forEach((swatch) => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        const color = swatch.getAttribute('data-color');
        const curve = document.getElementById('palette-curve-select')?.value || 'pos';
        if (window.geoPlotter) {
          window.geoPlotter.setCurveStyle(curve, { color });
        }
      });
    });

    // Grosor
    document.getElementById('palette-width-slider')?.addEventListener('input', (e) => {
      const width = parseFloat(e.target.value);
      const curve = document.getElementById('palette-curve-select')?.value || 'pos';
      if (window.geoPlotter) {
        window.geoPlotter.setCurveStyle(curve, { width });
      }
    });

    // Opacidad
    document.getElementById('palette-opacity-slider')?.addEventListener('input', (e) => {
      const opacity = parseFloat(e.target.value);
      const curve = document.getElementById('palette-curve-select')?.value || 'pos';
      if (window.geoPlotter) {
        window.geoPlotter.setCurveStyle(curve, { opacity });
      }
    });

    // Patrón
    document.getElementById('palette-pattern-select')?.addEventListener('change', (e) => {
      const val = e.target.value;
      let dash = [];
      if (val === 'dashed') dash = [8, 6];
      else if (val === 'dotted') dash = [2, 4];
      else if (val === 'dashdot') dash = [10, 4, 2, 4];

      const curve = document.getElementById('palette-curve-select')?.value || 'pos';
      if (window.geoPlotter) {
        window.geoPlotter.setCurveStyle(curve, { dash });
      }
    });
  }

  initModules() {
    // 0. Iconos Lucide Inmediatos
    if (window.lucide) {
      try { lucide.createIcons(); } catch(e) { console.warn('Lucide init:', e); }
    }

    // 1. Motor Cartesiano GeoGebra
    try {
      const GeoClass = window.GeogebraPlotter || (typeof GeogebraPlotter !== 'undefined' ? GeogebraPlotter : null);
      if (document.getElementById('geogebra-main-canvas') && GeoClass) {
        window.geoPlotter = new GeoClass('geogebra-main-canvas', {
          rulerXId: 'ruler-x',
          rulerYId: 'ruler-y',
          tooltipId: 'geo-tooltip'
        });
      }
    } catch(e) { console.warn('GeoGebra init:', e); }

    // 2. Laboratorio Físico 2D Masa-Resorte y Péndulo
    try {
      const PhysClass = window.PhysicsLab || (typeof PhysicsLab !== 'undefined' ? PhysicsLab : null);
      if (PhysClass) {
        window.physicsLab = new PhysClass();
      }
    } catch(e) { console.warn('PhysicsLab init:', e); }

    // 3. Simulador 3D Three.js
    try {
      const ThreeClass = window.ThreeSpringSim || (typeof ThreeSpringSim !== 'undefined' ? ThreeSpringSim : null);
      if (document.getElementById('threejs-spring-container') && ThreeClass) {
        window.threeSpringSim = new ThreeClass('threejs-spring-container');
      }
    } catch(e) { console.warn('ThreeSim init:', e); }

    // 4. Simulador de Onda Armónica Viajera (Cuerda Elástica)
    try {
      const WaveClass = window.HarmonicWaveLab || (typeof HarmonicWaveLab !== 'undefined' ? HarmonicWaveLab : null);
      if (document.getElementById('canvas-harmonic-wave') && WaveClass) {
        window.waveLab = new WaveClass('canvas-harmonic-wave');
      }
    } catch(e) { console.warn('WaveLab init:', e); }

    // 5. Solver Matemático Nerdamer & KaTeX
    try {
      const SolverClass = window.MathSolver || (typeof MathSolver !== 'undefined' ? MathSolver : null);
      if (SolverClass) {
        window.mathSolver = new SolverClass();
      }
    } catch(e) { console.warn('MathSolver init:', e); }

    // 6. Mapa Mental SVG
    try {
      const MindMapClass = window.ConceptMindMap || (typeof ConceptMindMap !== 'undefined' ? ConceptMindMap : null);
      if (document.getElementById('mindmap-interactive-container') && MindMapClass) {
        window.conceptMindMap = new MindMapClass('mindmap-svg-element', 'mindmap-info-card');
      }
    } catch(e) { console.warn('MindMap init:', e); }

    // 7. Segunda pasada de Iconos Lucide
    if (window.lucide) {
      try { lucide.createIcons(); } catch(e) {}
    }

    // 8. Simulador Acústico del Efecto Doppler
    try {
      const DopClass = window.DopplerApp || (typeof DopplerApp !== 'undefined' ? DopplerApp : null);
      if (document.getElementById('doppler-canvas') && DopClass && !window.dopplerApp) {
        window.dopplerApp = new DopClass();
      }
    } catch(e) { console.warn('DopplerApp init:', e); }
  }
}

// Arrancar cuando cargue la ventana
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    window.notebookApp = new NotebookApp();
  });
} else {
  window.notebookApp = new NotebookApp();
}
