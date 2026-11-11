// Minimal lightweight Service Worker for PWA installability across all modern browsers
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Listener to invalidate and clear caches on command
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});

// Network-first pass-through so all dynamic Inertia requests, sessions, and CSRF tokens remain fresh.
// Explicitly bypass cache for all attendance portal requests and administration endpoints.
self.addEventListener('fetch', (event) => {
    // 1. NEVER intercept non-GET requests (POST, PUT, PATCH, DELETE, etc.)
    // Lets the browser natively process form submissions, file uploads, and mutations.
    if (event.request.method !== 'GET') {
        return;
    }

    // 2. NEVER intercept Inertia or AJAX requests to preserve headers, sessions, and redirects
    if (event.request.headers.has('X-Inertia') || event.request.headers.has('X-Requested-With')) {
        return;
    }

    // 3. Completely bypass administrative and backend routes
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/super-admin') || url.pathname.startsWith('/store')) {
        return;
    }

    // 4. Dedicated handling for attendance portal requests (fresh network requests)
    if (url.pathname.startsWith('/attendance')) {
        event.respondWith(fetch(event.request, { cache: 'no-store' }));
        return;
    }

    // 5. Default network pass-through for other static resources
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

