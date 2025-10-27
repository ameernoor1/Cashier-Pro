self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('cashier-pro-v1').then(cache => {
      return cache.addAll([
        '/',
        '/landing.html',
        '/register.html',
        '/index.html',
        '/admin.html',
        '/firebase-config.js',
        '/subscription-manager.js',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
