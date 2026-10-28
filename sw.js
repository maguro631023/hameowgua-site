/* 哈喵呱 Service Worker — 版本 1.5 */
const VERSION = '1.5';
const CACHE = 'hameowgua-' + VERSION;
const CORE = ['./', 'index.html', 'courses.html', 'contact.html', 'manifest.webmanifest',
  'assets/style.css?v=' + VERSION, 'assets/site.js?v=' + VERSION, 'config.js?v=' + VERSION,
  'assets/img/qr.svg', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('hameowgua-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;               // 外部資源（Botpress、Drive、字型）不攔截
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('.html');
  const isVersion = url.pathname.endsWith('version.json');
  if (isVersion) return;                                     // 版本檔一律走網路
  if (isPage) {                                              // 頁面：網路優先，離線時用快取
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {   // 靜態資源：快取優先
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
    return r;
  })));
});
