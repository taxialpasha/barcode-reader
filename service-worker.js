/**
 * Service Worker لتطبيق بطاقة المستثمر
 * يدعم وضع عدم الاتصال وتخزين التطبيق مؤقتاً
 */

// اسم التخزين المؤقت ورقم الإصدار
const CACHE_NAME = 'investor-card-cache-v1';

// قائمة الملفات التي سيتم تخزينها مؤقتاً
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/app.js',
    '/card-utils.js',
    '/animation.js',
    '/manifest.json',
    '/js/firebase-config.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap',
    'https://cdn.jsdelivr.net/npm/qrcode@1.5.0/build/qrcode.min.js'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
    console.log('تثبيت Service Worker...');
    
    // تأجيل الحدث حتى يتم الانتهاء من التخزين المؤقت
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('تم فتح التخزين المؤقت');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('تم تخزين جميع الموارد مؤقتاً');
                return self.skipWaiting();
            })
    );
});

// تنشيط Service Worker
self.addEventListener('activate', event => {
    console.log('تنشيط Service Worker...');
    
    // تأجيل الحدث حتى يتم الانتهاء من تنظيف التخزين المؤقت
    event.waitUntil(
        // حذف التخزين المؤقت القديم
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('حذف التخزين المؤقت القديم:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('Service Worker نشط الآن');
            return self.clients.claim();
        })
    );
});

// استجابة لطلبات الشبكة
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // إرجاع النسخة المخزنة مؤقتاً إذا وجدت
                if (response) {
                    return response;
                }
                
                // إذا لم تكن النسخة المخزنة مؤقتاً متوفرة، قم بطلب البيانات من الشبكة
                return fetch(event.request)
                    .then(networkResponse => {
                        // التأكد من أن الاستجابة صالحة
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        // نسخ الاستجابة لأننا سنستخدمها مرتين
                        const responseToCache = networkResponse.clone();
                        
                        // فتح التخزين المؤقت وتخزين الاستجابة الجديدة
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return networkResponse;
                    })
                    .catch(error => {
                        // في حالة فشل الاتصال بالشبكة، يمكننا إرجاع صفحة خطأ بدلاً
                        console.error('فشل طلب الشبكة:', error);
                        
                        // يمكن إرجاع صفحة خطأ في وضع عدم الاتصال
                        // return caches.match('/offline.html');
                    });
            })
    );
});

// التعامل مع الإشعارات Push
self.addEventListener('push', event => {
    console.log('تم استلام إشعار:', event.data.text());
    
    const data = JSON.parse(event.data.text());
    
    const options = {
        body: data.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        dir: 'rtl',
        vibrate: [100, 50, 100],
        data: {
            url: data.url
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// التعامل مع النقر على الإشعارات
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});