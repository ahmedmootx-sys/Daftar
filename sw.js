const CACHE = 'daftar-v1';
const ASSETS = ['./', './index.html', './app.js', './styles.css', './manifest.json', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  // تجاهل الموارد الخارجية (مثل خطوط Google) — مرّرها عادي
  if(url.origin !== self.location.origin) return;
  // الشبكة أولاً، ومع فشلها ارجع للكاش (لدعم العرض بدون إنترنت)
  e.respondWith(
    fetch(req).then(res => {
      if(res && res.status === 200 && res.type === 'basic'){
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone));
      }
      return res;
    }).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if(list.length){ list[0].focus(); }
      else { clients.openWindow('./'); }
    })
  );
});
