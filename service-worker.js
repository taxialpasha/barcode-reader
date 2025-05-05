// Versión del cache
const CACHE_VERSION = 'v1.2';
const CACHE_NAME = 'barcode-reader-cache-' + CACHE_VERSION;

// Archivos a cachear
const filesToCache = [
  '/barcode-reader/',
  '/barcode-reader/index.html',
  '/barcode-reader/manifest.json',
  '/barcode-reader/styles.css',
  '/barcode-reader/app.js',
  '/barcode-reader/offline.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.4/html5-qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.1/chart.min.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js',
  'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fbadge-icon.png?alt=media&token=0e94bd66-c3bb-4ac5-be2c-f406861800e4',
  'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fnotification.mp3?alt=media&token=6f21cd2e-c051-413c-8521-33c36e684a71'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('Instalando Service Worker...');
  
  // Forzar activación inmediata
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cacheando archivos...');
        return cache.addAll(filesToCache);
      })
      .catch(error => {
        console.error('Error al cachear archivos:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('Activando Service Worker...');
  
  // Tomar control inmediatamente
  self.clients.claim();
  
  // Borrar caches antiguos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('barcode-reader-cache-') && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('Eliminando cache antiguo:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Manejo de peticiones
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si se encuentra en caché, devolver respuesta cacheada
        if (response) {
          return response;
        }

        // Si no, buscar en la red
        return fetch(event.request)
          .then(response => {
            // Verificar respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta para guardarla en caché
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.log('Error en fetch:', error);
            
            // Si es una navegación, mostrar página offline
            if (event.request.mode === 'navigate') {
              return caches.match('/barcode-reader/offline.html');
            }
            
            // Para recursos no críticos, devolver una respuesta vacía
            return new Response('', {
              status: 408,
              statusText: 'Request timed out.'
            });
          });
      })
  );
});

// Manejo de notificaciones push
self.addEventListener('push', event => {
  console.log('Recibida notificación push:', event.data ? event.data.text() : 'sin datos');
  
  let notificationData = {
    title: 'قارئ الباركود',
    body: 'هناك تحديث جديد',
    icon: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fbadge-icon.png?alt=media&token=0e94bd66-c3bb-4ac5-be2c-f406861800e4'
  };
  
  if (event.data) {
    try {
      notificationData = JSON.parse(event.data.text());
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }
  
  const options = {
    body: notificationData.body,
    icon: notificationData.icon || 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fbadge-icon.png?alt=media&token=0e94bd66-c3bb-4ac5-be2c-f406861800e4',
    badge: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fbadge-icon.png?alt=media&token=0e94bd66-c3bb-4ac5-be2c-f406861800e4',
    vibrate: [100, 50, 100, 50, 100],
    sound: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fnotification.mp3?alt=media&token=6f21cd2e-c051-413c-8521-33c36e684a71',
    tag: 'barcode-reader-notification',
    renotify: true,
    dir: 'rtl',
    actions: [
      {
        action: 'open',
        title: 'فتح'
      },
      {
        action: 'dismiss',
        title: 'إغلاق'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', event => {
  console.log('Clic en notificación:', event.notification.tag);
  
  event.notification.close();
  
  // Acción al hacer clic
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        // Si ya hay una ventana abierta, enfocarla
        if (windowClients.length > 0) {
          return windowClients[0].focus();
        }
        
        // Si no, abrir una nueva
        return clients.openWindow('/barcode-reader/');
      })
  );
});

// Manejo de mensajes
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});