// اسم التخزين المؤقت
const CACHE_NAME = 'investor-card-app-v1';

// قائمة الملفات للتخزين المؤقت
const filesToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles.css',
  '/app.js',
  'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fbadge-icon.png?alt=media&token=0e94bd66-c3bb-4ac5-be2c-f406861800e4',
  'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fnotification.mp3?alt=media&token=6f21cd2e-c051-413c-8521-33c36e684a71',
  '/offline.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.4/html5-qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.1/chart.min.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  console.log('تثبيت Service Worker...');
  
  // تثبيت بدون انتظار
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('فتح التخزين المؤقت');
        return cache.addAll(filesToCache);
      })
  );
});

// تنشيط Service Worker
self.addEventListener('activate', event => {
  console.log('تنشيط Service Worker...');
  
  // المطالبة بالتحكم فوراً
  self.clients.claim();
  
  // حذف التخزين المؤقت القديم
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('حذف التخزين المؤقت القديم:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
});

// استجابة لطلبات الشبكة
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إرجاع الاستجابة من التخزين المؤقت إذا وجدت
        if (response) {
          return response;
        }

        // نسخ الطلب لأنه يمكن استخدامه مرة واحدة فقط
        return fetch(event.request).then(
          response => {
            // التحقق من أن الاستجابة صالحة
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // نسخ الاستجابة لأنها يمكن استخدامها مرة واحدة فقط
            const responseToCache = response.clone();

            // تخزين الاستجابة في التخزين المؤقت
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // إذا كان الطلب للصفحة الرئيسية، ارجع صفحة offline
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// استقبال الإشعارات
self.addEventListener('push', event => {
  console.log('تم استلام إشعار:', event.data.text());
  
  let notificationData = {};
  
  try {
    notificationData = event.data.json();
  } catch (e) {
    notificationData = {
      title: 'تطبيق بطاقة المستثمر',
      body: event.data.text(),
      icon: '/icons/icon-192x192.png'
    };
  }
  
  const options = {
    body: notificationData.body || 'هناك تحديث جديد',
    icon: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fbadge-icon.png?alt=media&token=0e94bd66-c3bb-4ac5-be2c-f406861800e4',
    badge: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fbadge-icon.png?alt=media&token=0e94bd66-c3bb-4ac5-be2c-f406861800e4',
    vibrate: [100, 50, 100, 50, 100], // نمط الاهتزاز
    sound: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fnotification.mp3?alt=media&token=6f21cd2e-c051-413c-8521-33c36e684a71', // صوت الإشعار
    data: notificationData.data || {},
    actions: notificationData.actions || [
      {
        action: 'open',
        title: 'فتح التطبيق'
      }
    ],
    dir: 'rtl',
    tag: notificationData.tag || 'investor-app-notification',
    renotify: true // إعادة الإشعار حتى لو كان هناك إشعار بنفس العلامة
  };
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// التفاعل مع الإشعار
self.addEventListener('notificationclick', event => {
  console.log('تم النقر على الإشعار:', event.notification.tag);
  
  event.notification.close();
  
  // فتح نافذة التطبيق أو تنشيطها
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        if (windowClients.length > 0) {
          const client = windowClients[0];
          return client.focus();
        }
        return clients.openWindow('/');
      })
  );
});

// معالجة رسائل Firebase Cloud Messaging (FCM)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});