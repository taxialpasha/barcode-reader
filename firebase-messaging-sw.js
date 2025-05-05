// ملف Firebase Cloud Messaging Service Worker

// استيراد مكتبات Firebase الأساسية (يجب أن تكون بهذا الترتيب)
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// تكوين Firebase
firebase.initializeApp({
  apiKey: "AIzaSyDGpAHia_wEmrhnmYjrPf1n1TrAzwEMiAI",
  authDomain: "messageemeapp.firebaseapp.com",
  databaseURL: "https://messageemeapp-default-rtdb.firebaseio.com",
  projectId: "messageemeapp",
  storageBucket: "messageemeapp.appspot.com",
  messagingSenderId: "255034474844",
  appId: "1:255034474844:web:5e3b7a6bc4b2fb94cc4199"
});

// تهيئة Firebase Messaging
const messaging = firebase.messaging();

// معالجة رسائل الخلفية
messaging.onBackgroundMessage((payload) => {
  console.log('تم استلام رسالة في الخلفية:', payload);
  
  // تخصيص الإشعار
  const notificationTitle = payload.notification.title || 'تطبيق بطاقة المستثمر';
  const notificationOptions = {
    body: payload.notification.body || 'هناك تحديث جديد',
    icon: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fbadge-icon.png?alt=media&token=0e94bd66-c3bb-4ac5-be2c-f406861800e4',
    badge: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fbadge-icon.png?alt=media&token=0e94bd66-c3bb-4ac5-be2c-f406861800e4',
    vibrate: [100, 50, 100, 50, 100], // نمط الاهتزاز
    sound: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fnotification.mp3?alt=media&token=6f21cd2e-c051-413c-8521-33c36e684a71', // صوت الإشعار
    data: payload.data || {},
    tag: 'investor-app-notification',
    renotify: true,
    actions: [
      {
        action: 'open',
        title: 'فتح'
      },
      {
        action: 'dismiss',
        title: 'إغلاق'
      }
    ],
    dir: 'rtl',
  };
  
  // عرض الإشعار
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// معالجة النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  console.log('تم النقر على إشعار FCM:', event.notification.tag);
  
  // إغلاق الإشعار
  event.notification.close();
  
  // اتخاذ إجراء بناءً على الزر الذي تم النقر عليه
  if (event.action === 'open') {
    // فتح نافذة التطبيق عند النقر على "فتح"
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        // إذا كان التطبيق مفتوحاً، قم بالتركيز عليه
        if (windowClients.length > 0) {
          return windowClients[0].focus();
        }
        // وإلا، افتح نافذة جديدة
        return clients.openWindow('/');
      })
    );
  }
});