/**
 * تكوين Firebase لتطبيق بطاقة المستثمر
 * استبدل هذه البيانات ببيانات مشروعك الخاص على Firebase
 */

// تهيئة Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAFPT-VVuK5x7U4FwLS4h6SrtQHCEGSPS0",
    authDomain: "messageemeapp.firebaseapp.com",
    databaseURL: "https://messageemeapp-default-rtdb.firebaseio.com",
    projectId: "messageemeapp",
    storageBucket: "messageemeapp.appspot.com",
    messagingSenderId: "905897132808",
    appId: "1:905897132808:web:3a8f394ef1a88f6ac7e80f"
  };
  
  // كائن خدمات Firebase
  const FirebaseService = {
    database: null,
    auth: null,
    userId: "b7XlRaRqUEX2X6SdnF9fyV5SPi83", // معرف المستخدم المطلوب
    
    // تهيئة Firebase
    initialize: function() {
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        
        this.database = firebase.database();
        this.auth = firebase.auth();
        
        console.log('تم تهيئة Firebase بنجاح');
        return true;
      } catch (error) {
        console.error('خطأ في تهيئة Firebase:', error);
        return false;
      }
    },
    
    // جلب معلومات البطاقة المحددة
    getCardById: function(cardId) {
      return new Promise((resolve, reject) => {
        if (!this.database) {
          return reject(new Error('قاعدة البيانات غير متاحة'));
        }
        
        const cardRef = this.database.ref(`users/${this.userId}/investor_cards/${cardId}`);
        
        cardRef.once('value')
          .then(snapshot => {
            if (snapshot.exists()) {
              const cardData = snapshot.val();
              console.log('تم جلب بيانات البطاقة بنجاح:', cardData);
              resolve(cardData);
            } else {
              console.error('البطاقة غير موجودة');
              reject(new Error('البطاقة غير موجودة'));
            }
          })
          .catch(error => {
            console.error('خطأ في جلب بيانات البطاقة:', error);
            reject(error);
          });
      });
    },
    
    // جلب جميع البطاقات للمستخدم
    getAllCards: function() {
      return new Promise((resolve, reject) => {
        if (!this.database) {
          return reject(new Error('قاعدة البيانات غير متاحة'));
        }
        
        const cardsRef = this.database.ref(`users/${this.userId}/investor_cards`);
        
        cardsRef.once('value')
          .then(snapshot => {
            if (snapshot.exists()) {
              const cardsData = snapshot.val();
              // تحويل البيانات من كائن إلى مصفوفة
              const cardsArray = Object.keys(cardsData).map(key => {
                return { ...cardsData[key], id: key };
              });
              
              console.log(`تم جلب ${cardsArray.length} بطاقة بنجاح`);
              resolve(cardsArray);
            } else {
              console.log('لا توجد بطاقات للمستخدم');
              resolve([]);
            }
          })
          .catch(error => {
            console.error('خطأ في جلب البطاقات:', error);
            reject(error);
          });
      });
    },
    
    // تحديث بيانات التطبيق بالمعلومات من قاعدة البيانات
    updateAppData: function(app) {
      return new Promise((resolve, reject) => {
        const cardId = '1745970634374'; // معرف البطاقة المطلوبة
        
        this.getCardById(cardId)
          .then(cardData => {
            // تحديث معلومات البطاقة في التطبيق
            app.appData.card = {
              number: cardData.cardNumber,
              expiry: this.formatExpiryDate(cardData.expiryDate),
              cvv: cardData.cvv,
              pin: cardData.pin,
              type: this.translateCardType(cardData.cardType),
              issueDate: this.formatDate(cardData.createdAt),
              status: cardData.status
            };
            
            // تحديث معلومات المستخدم
            app.appData.user = {
              id: cardData.investorId,
              name: cardData.investorName,
              initial: this.getInitials(cardData.investorName),
              phone: cardData.investorPhone,
              address: "العراق، بغداد",
              joinDate: this.formatDate(cardData.createdAt)
            };
            
            console.log('تم تحديث بيانات التطبيق بنجاح');
            
            // تحديث واجهة المستخدم إذا كان المستخدم مسجل الدخول بالفعل
            if (app.isAuthenticated && app.currentScreen === 'card-dashboard') {
              app.updateCardData();
              app.updateUserInfo();
            }
            
            resolve(cardData);
          })
          .catch(error => {
            console.error('خطأ في تحديث بيانات التطبيق:', error);
            reject(error);
          });
      });
    },
    
    // تنسيق تاريخ الانتهاء إلى صيغة MM/YY
    formatExpiryDate: function(dateStr) {
      try {
        const date = new Date(dateStr);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        return `${month}/${year}`;
      } catch (e) {
        return "12/30"; // قيمة افتراضية
      }
    },
    
    // تنسيق التاريخ
    formatDate: function(dateStr) {
      try {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      } catch (e) {
        return dateStr;
      }
    },
    
    // الحصول على الأحرف الأولى من الاسم
    getInitials: function(name) {
      if (!name) return 'م';
      return name.charAt(0);
    },
    
    // ترجمة نوع البطاقة
    translateCardType: function(type) {
      const cardTypes = {
        'platinum': 'بلاتينية',
        'gold': 'ذهبية',
        'premium': 'بريميوم',
        'diamond': 'ماسية',
        'islamic': 'إسلامية',
        'custom': 'مخصصة'
      };
      
      return cardTypes[type] || type;
    }
  };
  
  // تهيئة Firebase عند تحميل الملف
  if (typeof firebase !== 'undefined') {
    FirebaseService.initialize();
  } else {
    console.warn('Firebase غير متاح، سيتم استخدام البيانات المحلية فقط');
  }
  
  // إتاحة الكائن للاستخدام الخارجي
  window.FirebaseService = FirebaseService;