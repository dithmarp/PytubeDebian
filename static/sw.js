const CACHE_NAME = 'cache';
const urlsToCache = [
  '/',
  '/static/css/index_id.css',
  '/static/css/index_class.css',
  '/static/css/index_dark-mode.css',
  '/static/css/index_light-mode.css',
  '/static/css/index_system-mode.css',
  '/static/css/index_info_div.css',
  '/static/css/responsive.css',

  '/static/javascript/dark-mode.js',
  '/static/javascript/system-mode.js',
  '/static/javascript/script.js',
  '/static/javascript/events.js',
  '/static/javascript/downloader.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
