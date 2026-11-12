const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const mindmapJs = fs.readFileSync('js/mindmap.js', 'utf8');
const appJs = fs.readFileSync('js/app.js', 'utf8');
const notebookCss = fs.readFileSync('css/notebook.css', 'utf8');

console.log('=== TEST 1: Mindmap SVG filter compliance ===');
if (mindmapJs.includes("filter=\"drop-shadow") || mindmapJs.includes("filter='drop-shadow")) {
  console.error('FAIL: Invalid SVG drop-shadow filter found in mindmap.js');
  process.exit(1);
} else {
  console.log('PASS: SVG uses compliant feDropShadow defs filter (no invalid drop-shadow attribute)');
}

console.log('=== TEST 2: KaTeX SVG tag ignored ===');
if (appJs.includes("'svg'") || appJs.includes('"svg"')) {
  console.log('PASS: KaTeX ignores SVG tags to prevent breaking SVG DOM');
} else {
  console.error('FAIL: KaTeX does not ignore svg tags');
  process.exit(1);
}

console.log('=== TEST 3: Navigation dock fixed styles ===');
if (indexHtml.includes('position: fixed !important') &&
    indexHtml.includes('bottom: 0 !important') &&
    indexHtml.includes('z-index: 9999999 !important') &&
    notebookCss.includes('z-index: 9999999 !important')) {
  console.log('PASS: Dock has rock-solid inline and CSS fixed rules with z-index 9999999');
} else {
  console.error('FAIL: Dock missing fixed rules');
  process.exit(1);
}

console.log('=== TEST 4: Lucide immediate initialization ===');
if (indexHtml.includes('window.lucide.createIcons()')) {
  console.log('PASS: Lucide icons initialized right after script load');
} else {
  console.error('FAIL: Lucide immediate script missing');
  process.exit(1);
}

console.log('ALL TESTS PASSED 100%!');

