const FILES_TO_CACHE = [
    '/',
    '/index.html',
    'index.js',
    'styles.css',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'manifest.webmanifest'
];
const STATIC_CACHE = 'static-cache-v1';
const DATA_CACHE = 'data-cache-v1';

self.addEventListener('install', (evt) => {
    evt.waitUntil(
        caches.open(STATIC_CACHE).then(cache => cache.addAll(FILES_TO_CACHE))
    );
    evt.waitUntil(
        caches.open(DATA_CACHE).then(cache => cache.add("/api/transaction"))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== STATIC_CACHE && key !== DATA_CACHE) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
    if (evt.request.url.includes('/api/')) {
        evt.respondWith(
            caches.open(DATA_CACHE).then(cache => {
                return fetch(evt.request)
                    .then(response => {
                        console.log("caching: " + evt.request.url);
                        cache.put(evt.request.url, response.clone());
                        return response;
                    })
                    .catch(err => {
                        console.log("returning from cache: " + evt.request.url);
                        return cache.match(evt.request);
                    })
            })
                .catch(err => console.log(err))
        );
        return;
    } else {
        evt.respondWith(
            caches.open(STATIC_CACHE).then(cache => {
                console.log("returning from cache: " + evt.request.url);
                return cache.match(evt.request).then(response => {
                    return response || fetch(evt.request);
                });
            })
        );
    }
})
