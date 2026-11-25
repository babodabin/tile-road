// 성과 길 — 오프라인 캐시
// 버전은 index.html의 APP_VERSION 한 곳에만 있다: 등록 주소 sw.js?v=… 에서 받아 쓴다
const CACHE = 'tileroad-' + (new URL(self.location.href).searchParams.get('v') || '0');
const CORE = ['./index.html','./manifest.json','./icon-180.png','./icon-192.png','./icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // 같은 주소(babodabin.github.io)의 다른 앱 캐시는 건드리지 않는다
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('tileroad-') && key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // 화면은 항상 새 버전을 먼저 받고, 안 되면 캐시
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request.url, { cache: 'no-cache' }) // 브라우저가 들고 있는 옛 파일 말고 서버에 새로 확인
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 글꼴 등 나머지는 캐시 먼저, 없으면 받아서 저장
  event.respondWith(
    caches.match(event.request).then(hit => hit || fetch(event.request).then(response => {
      if (response.ok || response.type === 'opaque') {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
