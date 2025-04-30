/**
 * تكوين Firebase للتطبيق
 * قم بتحديث هذه المعلومات بمعلومات مشروع Firebase الخاص بك
 */

// تكوين Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDGpAHia_wEmrhnmYjrPf1n1TrAzwEMiAI",
                    authDomain: "messageemeapp.firebaseapp.com",
                    databaseURL: "https://messageemeapp-default-rtdb.firebaseio.com",
                    projectId: "messageemeapp",
                    storageBucket: "messageemeapp.appspot.com",
                    messagingSenderId: "255034474844",
                    appId: "1:255034474844:web:5e3b7a6bc4b2fb94cc4199"
                };

// تهيئة Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// تصدير المتغيرات المستخدمة
const db = firebase.database();
const auth = firebase.auth();

// وظائف مساعدة للتعامل مع قاعدة البيانات
const firebaseHelpers = {
    // الحصول على بيانات بطاقة المستثمر
    getInvestorCardData: function(userId) {
        return db.ref(`users/${userId}/card`).once('value')
            .then(snapshot => snapshot.val());
    },
    
    // تحديث بيانات بطاقة المستثمر
    updateInvestorCardData: function(userId, cardData) {
        return db.ref(`users/${userId}/card`).update(cardData);
    },
    
    // الحصول على معاملات المستخدم
    getUserTransactions: function(userId) {
        return db.ref(`users/${userId}/transactions`).orderByChild('date').once('value')
            .then(snapshot => {
                const transactions = [];
                snapshot.forEach(child => {
                    transactions.unshift({
                        id: child.key,
                        ...child.val()
                    });
                });
                return transactions;
            });
    },
    
    // الحصول على استثمارات المستخدم
    getUserInvestments: function(userId) {
        return db.ref(`users/${userId}/investments`).once('value')
            .then(snapshot => {
                const investments = [];
                snapshot.forEach(child => {
                    investments.push({
                        id: child.key,
                        ...child.val()
                    });
                });
                return investments;
            });
    },
    
    // الحصول على أرباح المستخدم
    getUserProfits: function(userId) {
        return db.ref(`users/${userId}/profits`).orderByChild('date').once('value')
            .then(snapshot => {
                const profits = [];
                snapshot.forEach(child => {
                    profits.unshift({
                        id: child.key,
                        ...child.val()
                    });
                });
                return profits;
            });
    },
    
    // الحصول على إشعارات المستخدم
    getUserNotifications: function(userId) {
        return db.ref(`users/${userId}/notifications`).orderByChild('date').once('value')
            .then(snapshot => {
                const notifications = [];
                snapshot.forEach(child => {
                    notifications.unshift({
                        id: child.key,
                        ...child.val()
                    });
                });
                return notifications;
            });
    },
    
    // تعيين جميع إشعارات المستخدم كمقروءة
    markAllNotificationsAsRead: function(userId) {
        return db.ref(`users/${userId}/notifications`).once('value')
            .then(snapshot => {
                const updates = {};
                snapshot.forEach(child => {
                    updates[`${child.key}/read`] = true;
                });
                return db.ref(`users/${userId}/notifications`).update(updates);
            });
    },
    
    // إرسال رسالة دعم
    sendSupportMessage: function(userId, subject, message) {
        const supportRef = db.ref('support').push();
        return supportRef.set({
            userId: userId,
            subject: subject,
            message: message,
            date: new Date().toISOString(),
            status: 'pending'
        });
    }
};

// تصدير المتغيرات والوظائف
window.firebaseDb = db;
window.firebaseAuth = auth;
window.firebaseHelpers = firebaseHelpers;