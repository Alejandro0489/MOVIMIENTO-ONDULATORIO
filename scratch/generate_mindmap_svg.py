import json

nodesData = [
  {
    "id": "root",
    "title": "Movimiento Oscilatorio & Ondulatorio",
    "category": "root",
    "x": 450,
    "y": 260,
    "r": 44,
    "color": "#c59b27",
    "textColor": "#120e06",
    "desc": "Núcleo temático de la unidad. Estudio de sistemas que experimentan fuerzas restauradoras y oscilaciones periódicas en torno a posiciones de equilibrio estable.",
    "formula": "F = -kx \\implies m\\frac{d^2x}{dt^2} + kx = 0",
    "page": 5
  },
  {
    "id": "cinematica",
    "parent": "root",
    "title": "Cinemática del M.A.S.",
    "category": "branch",
    "x": 180,
    "y": 130,
    "r": 32,
    "color": "#2563eb",
    "textColor": "#ffffff",
    "desc": "Ecuaciones temporales de posición, velocidad y aceleración armónica con relaciones de fase de π/2 y π.",
    "formula": "x(t) = A\\cos(\\omega t + \\phi)",
    "page": 7
  },
  {
    "id": "velocidad",
    "parent": "cinematica",
    "title": "Velocidad y Aceleración",
    "category": "leaf",
    "x": 80,
    "y": 60,
    "r": 25,
    "color": "#16a34a",
    "textColor": "#ffffff",
    "desc": "La velocidad adelanta en π/2 a la posición, y la aceleración se opone exactamente al desplazamiento.",
    "formula": "v_{\\max} = A\\omega, \\quad a_{\\max} = A\\omega^2",
    "page": 7
  },
  {
    "id": "dinamica",
    "parent": "root",
    "title": "Dinámica & Ecuación Dif.",
    "category": "branch",
    "x": 720,
    "y": 130,
    "r": 32,
    "color": "#8b5a2b",
    "textColor": "#ffffff",
    "desc": "Formulación newtoniana del oscilador armónico y resolución de la EDO lineal de segundo orden.",
    "formula": "\\ddot{x} + \\omega_0^2 x = 0",
    "page": 6
  },
  {
    "id": "hooke",
    "parent": "dinamica",
    "title": "Ley de Hooke",
    "category": "leaf",
    "x": 840,
    "y": 60,
    "r": 25,
    "color": "#7a1f29",
    "textColor": "#ffffff",
    "desc": "Fuerza restauradora proporcional a la deformación y opuesta al sentido del movimiento.",
    "formula": "F_r = -k\\Delta x",
    "page": 6
  },
  {
    "id": "sistemas",
    "parent": "root",
    "title": "Sistemas Físicos",
    "category": "branch",
    "x": 180,
    "y": 390,
    "r": 32,
    "color": "#d97706",
    "textColor": "#ffffff",
    "desc": "Modelos reales: oscilador masa-resorte y péndulo simple con aproximación de pequeñas oscilaciones.",
    "formula": "T = 2\\pi\\sqrt{\\frac{m}{k}}, \\quad T = 2\\pi\\sqrt{\\frac{L}{g}}",
    "page": 10
  },
  {
    "id": "pendulo",
    "parent": "sistemas",
    "title": "Péndulo Simple",
    "category": "leaf",
    "x": 80,
    "y": 460,
    "r": 25,
    "color": "#b45309",
    "textColor": "#ffffff",
    "desc": "Masa suspendida de un hilo inextensible. Isocronismo para ángulos menores a 10 grados.",
    "formula": "\\omega = \\sqrt{g/L}",
    "page": 10
  },
  {
    "id": "energia",
    "parent": "root",
    "title": "Conservación de Energía",
    "category": "branch",
    "x": 720,
    "y": 390,
    "r": 32,
    "color": "#7c3aed",
    "textColor": "#ffffff",
    "desc": "Intercambio armónico continuo entre energía potencial elástica y cinética.",
    "formula": "E = \\frac{1}{2}kA^2 = \\text{constante}",
    "page": 7
  },
  {
    "id": "fasores",
    "parent": "energia",
    "title": "Fasores y Ondas",
    "category": "leaf",
    "x": 840,
    "y": 460,
    "r": 25,
    "color": "#0d6966",
    "textColor": "#ffffff",
    "desc": "Vectores giratorios en el plano complejo y su proyección sinusoidal en tiempo real.",
    "formula": "v = \\lambda f",
    "page": 10
  },
  {
    "id": "ondas",
    "parent": "root",
    "title": "Ondas Armónicas",
    "category": "branch",
    "x": 450,
    "y": 85,
    "r": 34,
    "color": "#0284c7",
    "textColor": "#ffffff",
    "desc": "Propagación continua de perturbaciones sinusoidales en medios elásticos continuos sin transporte neto de masa.",
    "formula": "y(x,t) = A\\sin(kx - \\omega t + \\phi)",
    "page": 8
  },
  {
    "id": "dalembert",
    "parent": "ondas",
    "title": "Ecuación de Onda",
    "category": "leaf",
    "x": 320,
    "y": 30,
    "r": 25,
    "color": "#0369a1",
    "textColor": "#ffffff",
    "desc": "Ecuación diferencial unidimensional de d'Alembert que vincula curvatura espacial y aceleración temporal.",
    "formula": "\\frac{\\partial^2 y}{\\partial x^2} = \\frac{1}{v^2}\\frac{\\partial^2 y}{\\partial t^2}",
    "page": 8
  },
  {
    "id": "cinematica-onda",
    "parent": "ondas",
    "title": "Cinemática Transversal",
    "category": "leaf",
    "x": 580,
    "y": 30,
    "r": 25,
    "color": "#0ea5e9",
    "textColor": "#ffffff",
    "desc": "M.A.S. vertical de las partículas (vy, ay) perpendicular al avance horizontal de la onda con rapidez constante v.",
    "formula": "v_y = -\\omega A\\cos(\\theta), \\quad v = \\lambda f",
    "page": 8
  },
  {
    "id": "potencia-onda",
    "parent": "ondas",
    "title": "Potencia & Energía",
    "category": "leaf",
    "x": 450,
    "y": 20,
    "r": 23,
    "color": "#0284c7",
    "textColor": "#ffffff",
    "desc": "Transporte de energía elástica y cinética. La potencia media es proporcional al cuadrado de la amplitud y frecuencia.",
    "formula": "P_{\\text{prom}} = \\frac{1}{2}\\mu v\\omega^2 A^2",
    "page": 8
  }
]

node_dict = {n['id']: n for n in nodesData}

svg_lines = []
svg_lines.append('<defs>')
svg_lines.append('  <filter id="mindmapNodeGlow" x="-40%" y="-40%" width="180%" height="180%">')
svg_lines.append('    <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.7"/>')
svg_lines.append('  </filter>')
svg_lines.append('</defs>')
svg_lines.append('<g id="mindmap-viewport-group" transform="translate(0, 0) scale(1)">')

# Connectors
for n in nodesData:
    if 'parent' in n:
        p = node_dict[n['parent']]
        dx = (n['x'] - p['x']) * 0.5
        d = f"M {p['x']} {p['y']} C {p['x'] + dx} {p['y']}, {n['x'] - dx} {n['y']}, {n['x']} {n['y']}"
        svg_lines.append(f'  <path d="{d}" stroke="{n["color"]}" stroke-width="2.5" stroke-opacity="0.65" fill="none"/>')

# Nodes
for n in nodesData:
    stroke_w = "3.5" if n.get('category') == 'root' else "2"
    fs = "11px" if n.get('category') == 'root' else ("10px" if n.get('category') == 'branch' else "9px")
    first_word = n['title'].split(' ')[0]
    y_adj = 4 if n.get('category') == 'root' else 3
    svg_lines.append(f'  <g class="mindmap-node" cursor="pointer" data-id="{n["id"]}">')
    svg_lines.append(f'    <circle cx="{n["x"]}" cy="{n["y"]}" r="{n["r"]}" fill="{n["color"]}" stroke="#ffffff" stroke-width="{stroke_w}" filter="url(#mindmapNodeGlow)"/>')
    svg_lines.append(f'    <text x="{n["x"]}" y="{n["y"] + y_adj}" text-anchor="middle" dominant-baseline="middle" fill="{n["textColor"]}" font-size="{fs}" font-weight="700" font-family="Outfit, sans-serif">{first_word}</text>')
    svg_lines.append(f'    <text x="{n["x"]}" y="{n["y"] + n["r"] + 14}" text-anchor="middle" fill="#ffffff" font-size="11px" font-weight="600" font-family="Outfit, sans-serif">{n["title"]}</text>')
    svg_lines.append('  </g>')

svg_lines.append('</g>')

svg_content = '\n'.join(svg_lines)
with open('scratch/mindmap_inner.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print('Saved scratch/mindmap_inner.svg with length', len(svg_content))

