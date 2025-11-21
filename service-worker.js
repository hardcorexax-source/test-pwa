// Простая, но хорошая заготовка service worker — кеширование ресурсов + offline fallback

const CACHE_NAME = 'demo-pwa-cache-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

// При установке — кешируем core assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
  );
});

// При активизации — чистим старые кеши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE_NAME) return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

// Обработка fetch: стратегия — cache-first для статичных ресурсов,
// network-first для navigation (страниц) с fallback на offline.html
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Для навигации (переход по URL в адресной строке) — network-first
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(networkRes => {
        // обновим кеш навигации
        caches.open(CACHE_NAME).then(cache => cache.put(req, networkRes.clone()));
        return networkRes;
      }).catch(() => {
        return caches.match('/index.html').then(cached => cached || caches.match('/offline.html'));
      })
    );
    return;
  }

  // Для остальных GET — пытаемся найти в кеше, иначе запрос на сеть, иначе fallback
  if (req.method === 'GET') {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(networkRes => {
          // динамически кешируем ответ (по желанию)
          if (networkRes && networkRes.status === 200 && networkRes.type !== 'opaque') {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          }
          return networkRes;
        }).catch(() => {
          // если запрос на картинку/шрифт и оффлайн — можно вернуть placeholder, здесь просто откат
          return caches.match('/offline.html');
        });
      })
    );
  }
});