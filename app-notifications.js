// تسجيل Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('تم تسجيل Service Worker بنجاح:', registration.scope);
                
                // تحديث Service Worker عند وجود تحديث جديد
                registration.onupdatefound = () => {
                    const installingWorker = registration.installing;
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                console.log('يوجد محتوى جديد متاح. يرجى تحديث الصفحة.');
                                
                                showNotification('info', 'تحديث متاح', 'يوجد إصدار جديد من التطبيق. اضغط هنا للتحديث.', () => {
                                    window.location.reload();
                                });
                            } else {
                                console.log('تم تخزين المحتوى مسبقاً.');
                            }
                        }
                    };
                };
                
                // تسجيل للإشعارات
                initializeNotifications(registration);
            })
            .catch(error => {
                console.error('فشل تسجيل Service Worker:', error);
            });
    });
}

// متغيرات الإشعارات
let pushSubscription = null;
let notificationsEnabled = false;

// زر تثبيت التطبيق
let deferredPrompt;
let installButton = null;

// تهيئة الإشعارات
function initializeNotifications(registration) {
    // التحقق من دعم الإشعارات
    if (!('Notification' in window)) {
        console.log('هذا المتصفح لا يدعم الإشعارات');
        return;
    }
    
    // إضافة زر تثبيت التطبيق في نهاية الصفحة (إذا لم يكن موجوداً بالفعل)
    addInstallButton();
    
    // استرجاع حالة الإشعارات من التخزين المحلي
    notificationsEnabled = localStorage.getItem('notifications_enabled') !== 'false';
    
    // تحديث واجهة الإشعارات
    updateNotificationsUI();
    
    // طلب إذن الإشعارات إذا كانت مفعلة
    if (notificationsEnabled) {
        requestNotificationPermission();
    }
    
    // الاشتراك في الإشعارات إذا تم منح الإذن
    if (Notification.permission === 'granted') {
        subscribeForPushNotifications(registration);
    }
}

// طلب إذن الإشعارات
function requestNotificationPermission() {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            console.log('تم منح إذن الإشعارات');
            // تفعيل اهتزاز الجهاز عند استلام الإشعار (إذا كان مدعوماً)
            if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
            }
            
            // الاشتراك في الإشعارات
            if (navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then(registration => {
                    subscribeForPushNotifications(registration);
                });
            }
        } else {
            console.log('تم رفض إذن الإشعارات');
            notificationsEnabled = false;
            localStorage.setItem('notifications_enabled', 'false');
            updateNotificationsUI();
        }
    });
}

// الاشتراك في إشعارات Push
function subscribeForPushNotifications(registration) {
    // التحقق من دعم الإشعارات
    if (!('PushManager' in window)) {
        console.log('هذا المتصفح لا يدعم إشعارات Push');
        return;
    }
    
    // استرجاع الاشتراك الحالي، أو إنشاء اشتراك جديد إذا لم يكن موجوداً
    registration.pushManager.getSubscription()
        .then(subscription => {
            if (subscription) {
                console.log('تم العثور على اشتراك موجود');
                pushSubscription = subscription;
                return subscription;
            }
            
            console.log('إنشاء اشتراك جديد');
            // المفتاح العام للتشفير
            const vapidPublicKey = 'BOprwpGjEzqKXKBwttfg0_cOPRbIHE9zfL9F0tQWTJLKnVJcYUKv61YSZDVqzYCu5I7X6etM7VTXZp2vw0IzNxw';
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
            
            return registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
        })
        .then(subscription => {
            if (subscription) {
                pushSubscription = subscription;
                // إرسال الاشتراك إلى الخادم
                sendSubscriptionToServer(subscription);
            }
        })
        .catch(error => {
            console.error('فشل الاشتراك في إشعارات Push:', error);
        });
}

// إرسال اشتراك الإشعارات إلى الخادم
function sendSubscriptionToServer(subscription) {
    // يجب تنفيذ هذه الوظيفة لإرسال معلومات الاشتراك إلى الخادم
    // هذا المثال هو عملية وهمية لأغراض العرض فقط
    console.log('إرسال معلومات الاشتراك إلى الخادم:', subscription);
    
    // في الواقع، ستقوم بإرسال الاشتراك إلى خادمك:
    /*
    fetch('/api/push-subscriptions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            subscription: subscription,
            userId: currentUser.uid // معرف المستخدم الحالي
        })
    });
    */
}

// تحديث واجهة الإشعارات
function updateNotificationsUI() {
    // تحديث مفتاح تبديل الإشعارات في الإعدادات
    const notificationsToggle = document.getElementById('notifications-toggle');
    if (notificationsToggle) {
        notificationsToggle.classList.toggle('active', notificationsEnabled);
    }
}

// إضافة زر تثبيت التطبيق
function addInstallButton() {
    if (!installButton) {
        installButton = document.createElement('button');
        installButton.id = 'install-app-btn';
        installButton.classList.add('install-app-btn');
        installButton.innerHTML = 'تثبيت التطبيق <i class="fas fa-download"></i>';
        installButton.style.display = 'none'; // إخفاء الزر بشكل افتراضي
        
        // إضافة نمط للزر
        const style = document.createElement('style');
        style.textContent = `
            .install-app-btn {
                position: fixed;
                bottom: 80px;
                left: 20px;
                right: 20px;
                background-color: #3498db;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px 20px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                display: none;
                z-index: 1000;
                text-align: center;
                max-width: 200px;
                margin: 0 auto;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
                transition: all 0.3s ease;
            }
            
            .install-app-btn:hover {
                background-color: #2980b9;
            }
            
            .install-app-btn i {
                margin-right: 10px;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(installButton);
        
        // إضافة حدث النقر
        installButton.addEventListener('click', installApp);
    }
}

// معالجة حدث beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
    // منع ظهور نافذة التثبيت التلقائية
    e.preventDefault();
    // تخزين الحدث لاستخدامه لاحقًا
    deferredPrompt = e;
    // إظهار زر التثبيت
    if (installButton) {
        installButton.style.display = 'block';
    }
});

// تثبيت التطبيق
function installApp() {
    if (!deferredPrompt) {
        console.log('لا يمكن تثبيت التطبيق في هذا الوقت');
        return;
    }
    
    // إظهار نافذة التثبيت
    deferredPrompt.prompt();
    
    // انتظار اختيار المستخدم
    deferredPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === 'accepted') {
            console.log('تم قبول تثبيت التطبيق');
            // إخفاء زر التثبيت
            if (installButton) {
                installButton.style.display = 'none';
            }
        } else {
            console.log('تم رفض تثبيت التطبيق');
        }
        
        // إعادة تعيين المتغير
        deferredPrompt = null;
    });
}

// التحويل من Base64 إلى Uint8Array (مطلوب لتشفير VAPID)
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
}

// إرسال إشعار محلي (ليس عبر الخادم)
function sendLocalNotification(title, options) {
    if (!('Notification' in window)) {
        console.log('هذا المتصفح لا يدعم الإشعارات');
        return;
    }
    
    if (Notification.permission !== 'granted') {
        console.log('لم يتم منح إذن الإشعارات');
        return;
    }
    
    // المعلومات الافتراضية للإشعار
    const defaultOptions = {
        body: 'هناك تحديث جديد',
        icon: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fbadge-icon.png?alt=media&token=0e94bd66-c3bb-4ac5-be2c-f406861800e4',
        badge: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fbadge-icon.png?alt=media&token=0e94bd66-c3bb-4ac5-be2c-f406861800e4',
        vibrate: [100, 50, 100, 50, 100], // نمط الاهتزاز
        sound: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fnotification.mp3?alt=media&token=6f21cd2e-c051-413c-8521-33c36e684a71', // صوت الإشعار
        tag: 'investor-app-notification',
        renotify: true,
        dir: 'rtl'
    };
    
    // دمج الخيارات الافتراضية مع الخيارات المرسلة
    const finalOptions = { ...defaultOptions, ...options };
    
    // إنشاء إشعار
    if (navigator.serviceWorker.controller) {
        // إرسال طلب إلى Service Worker لعرض الإشعار
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, finalOptions);
        });
    } else {
        // إنشاء إشعار مباشرة
        new Notification(title, finalOptions);
    }
    
    // تشغيل الاهتزاز (إذا كان مدعوماً)
    if ('vibrate' in navigator) {
        navigator.vibrate(finalOptions.vibrate);
    }
    
    // تشغيل الصوت (إذا كان مدعوماً)
    const audio = new Audio(finalOptions.sound);
    audio.play().catch(e => console.log('فشل تشغيل الصوت:', e));
}

// تعديل وظيفة عرض الإشعارات الحالية في التطبيق لاستخدام الإشعارات المحسنة
function showEnhancedNotification(type, title, message, onClick) {
    // عرض الإشعار داخل التطبيق
    showNotification(type, title, message);
    
    // إرسال إشعار محلي إذا كان التطبيق في الخلفية أو مغلقًا
    if (document.visibilityState !== 'visible' && notificationsEnabled) {
        let icon = 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fbadge-icon.png?alt=media&token=0e94bd66-c3bb-4ac5-be2c-f406861800e4';
        
        // تحديد أيقونة الإشعار بناءً على النوع
        if (type === 'success') {
            icon = 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fbadge-icon.png?alt=media&token=0e94bd66-c3bb-4ac5-be2c-f406861800e4';
        } else if (type === 'error') {
            icon = 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fbadge-icon.png?alt=media&token=0e94bd66-c3bb-4ac5-be2c-f406861800e4';
        } else if (type === 'warning') {
            icon = 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fbadge-icon.png?alt=media&token=0e94bd66-c3bb-4ac5-be2c-f406861800e4';
        }
        
        // إرسال الإشعار
        sendLocalNotification(title, {
            body: message,
            icon: icon,
            data: { type: type, url: window.location.href },
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
        });
    }
}

// استبدال وظيفة عرض الإشعارات الحالية بالوظيفة المحسنة
window.originalShowNotification = window.showNotification;
window.showNotification = showEnhancedNotification;

// تحديث معالجة رسائل Firebase
function initializeFirebaseMessaging() {
    if (!firebase || !firebase.messaging) {
        console.log('Firebase Messaging غير متوفر');
        return;
    }
    
    // الحصول على مثيل من Firebase Messaging
    const messaging = firebase.messaging();
    
    // طلب إذن الإشعارات
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            console.log('تم منح إذن الإشعارات');
            
            // الحصول على رمز التسجيل
            messaging.getToken().then((currentToken) => {
                if (currentToken) {
                    console.log('رمز FCM:', currentToken);
                    // إرسال الرمز إلى الخادم
                    sendFCMTokenToServer(currentToken);
                } else {
                    console.log('لا يمكن الحصول على رمز التسجيل.');
                }
            }).catch((err) => {
                console.log('حدث خطأ أثناء الحصول على رمز التسجيل:', err);
            });
        } else {
            console.log('تم رفض إذن الإشعارات');
        }
    });
    
    // معالجة رسائل الواجهة الأمامية
    messaging.onMessage((payload) => {
        console.log('تم استلام رسالة في الواجهة الأمامية:', payload);
        
        // عرض إشعار للرسالة المستلمة
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fbadge-icon.png?alt=media&token=0e94bd66-c3bb-4ac5-be2c-f406861800e4',
            badge: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%Bص%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fbadge-icon.png?alt=media&token=0e94bd66-c3bb-4ac5-be2c-f406861800e4',
            vibrate: [100, 50, 100, 50, 100],
            sound: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/%D9%85%D9%84%D9%81%20%D8%B5%D9%88%D8%B1%20%D8%AA%D8%B7%D8%A8%D9%82%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%B1%20%D8%B3%D9%85%D8%A7%20%D8%A8%D8%A7%D8%A8%D9%84%2Fnotification.mp3?alt=media&token=6f21cd2e-c051-413c-8521-33c36e684a71',
            data: payload.data
        };
        
        // عرض الإشعار
        sendLocalNotification(notificationTitle, notificationOptions);
    });
}

// إرسال رمز FCM إلى الخادم
function sendFCMTokenToServer(token) {
    // يجب تنفيذ هذه الوظيفة لإرسال رمز FCM إلى الخادم
    console.log('إرسال رمز FCM إلى الخادم:', token);
    
    // في الواقع، ستقوم بإرسال الرمز إلى خادمك:
    /*
    fetch('/api/fcm-tokens', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            token: token,
            userId: currentUser.uid // معرف المستخدم الحالي
        })
    });
    */
}

// تهيئة Firebase Messaging عند تحميل Firebase
document.addEventListener('DOMContentLoaded', () => {
    // تأخير تهيئة Firebase Messaging حتى يتم تحميل Firebase بالكامل
    setTimeout(() => {
        if (typeof firebase !== 'undefined' && firebase.messaging) {
            initializeFirebaseMessaging();
        }
    }, 2000);
});