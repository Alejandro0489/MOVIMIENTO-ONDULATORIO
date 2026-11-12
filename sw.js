// Service Worker para Cuaderno Digital Interactivo: Física 3
const CACHE_NAME = 'fisica3-cuaderno-v11-presentation';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './doppler.html',
  './ondas-cuerdas.html',
  './manifest.json',
  './css/main.css',
  './css/notebook.css',
  './css/geogebra.css',
  './css/simulations.css',
  './css/components.css',
  './css/doppler.css',
  './css/standing-waves.css',
  './js/app.js',
  './js/geogebra-canvas.js',
  './js/simulations.js',
  './js/three-sim.js',
  './js/math-solver.js',
  './js/mindmap.js',
  './js/timeline.js',
  './js/standing-waves.js',
  './js/doppler.js',
  './Imagenes/Portada.webp',
  './Imagenes/Hojas.webp',
  './vendor/katex.min.css',
  './vendor/katex.min.js',
  './vendor/auto-render.min.js',
  './vendor/nerdamer.core.js',
  './vendor/Algebra.js',
  './vendor/Calculus.js',
  './vendor/Solve.js',
  './vendor/three.min.js',
  './vendor/lucide.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Cache install fallback:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Eliminando cache antigua:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network First strategy: Siempre busca la versión más reciente en disco/red
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
