// Simulate browser environment to test all scripts loading in order
const fs = require('fs');

const virtualWindow = {
  document: {
    addEventListener: () => {},
    getElementById: (id) => {
      return {
        tagName: id.includes('svg') ? 'svg' : 'DIV',
        querySelector: () => null,
        appendChild: () => {},
        removeChild: () => {},
        firstChild: null,
        setAttribute: () => {},
        getAttribute: () => '',
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        addEventListener: () => {},
        style: {}
      };
    },
    createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, style: {} }),
    createElementNS: (ns, tag) => ({
      tagName: tag,
      setAttribute: () => {},
      appendChild: () => {},
      removeChild: () => {},
      firstChild: null,
      addEventListener: () => {},
      style: {}
    }),
    querySelectorAll: () => []
  },
  addEventListener: () => {},
  scrollTo: () => {}
};

global.window = virtualWindow;
global.document = virtualWindow.document;

const scripts = [
  'js/geogebra-canvas.js',
  'js/simulations.js',
  'js/three-sim.js',
  'js/math-solver.js',
  'js/mindmap.js',
  'js/timeline.js',
  'js/doppler.js',
  'js/standing-waves.js',
  'js/app.js'
];

for (const s of scripts) {
  try {
    const code = fs.readFileSync(s, 'utf8');
    eval(code);
    console.log(`[PASS] ${s} evaluated successfully.`);
  } catch (err) {
    console.error(`[FAIL] ${s}:`, err);
  }
}

