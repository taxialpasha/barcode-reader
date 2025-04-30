/**
 * card-firebase-connector-updated.js
 * 
 * نظام ربط بطاقات المستثمرين مع Firebase
 * تم تحديثه لحل مشاكل التوثيق ودعم الاستخدام بدون حساب
 * 
 * @version 1.1.0
 */

// كائن إدارة بطاقات المستثمر
const InvestorCardSystem = (function() {
    // متغيرات النظام
    let initialized = false;
    let currentUser = null;
    let currentCard = null;
    let userInvestorCards = [];
    let investorsList = [];
    let databaseRef = null;
    let authSubscription = null;
    let isLoggedIn = false;
    let isLoading = false;
    let userUID = null; // معرف المستخدم الحالي (إذا كان متاحًا)
    
    // ثوابت النظام
    const LOCAL_STORAGE_KEYS = {
        CARDS: 'investor_cards',
        CURRENT_USER: 'current_user',
        CURRENT_CARD: 'current_card',
        LAST_SYNC: 'last_sync_time'
    };
    
    // معلومات أنواع البطاقات
    const CARD_TYPES = {
        platinum: {
            name: 'بلاتينية',
            color: '#303030',
            textColor: '#ffffff',
            logoColor: '#ffffff',
            chipColor: '#FFD700',
            benefits: ['تأمين سفر', 'خدمة عملاء VIP', 'نقاط مضاعفة']
        },
        gold: {
            name: 'ذهبية',
            color: '#D4AF37',
            textColor: '#000000',
            logoColor: '#ffffff',
            chipColor: '#ffffff',
            benefits: ['نقاط مكافآت', 'خصومات خاصة', 'تأمين مشتريات']
        },
        premium: {
            name: 'بريميوم',
            color: '#1F3A5F',
            textColor: '#ffffff',
            logoColor: '#ffffff',
            chipColor: '#C0C0C0',
            benefits: ['مكافآت مشتريات', 'خدمة عملاء على مدار الساعة']
        },
        diamond: {
            name: 'ماسية',
            color: '#16213E',
            textColor: '#ffffff',
            logoColor: '#ffffff',
            chipColor: '#B9F2FF',
            benefits: ['امتيازات حصرية', 'خدمة شخصية', 'رصيد سفر سنوي']
        },
        islamic: {
            name: 'إسلامية',
            color: '#006B3C',
            textColor: '#ffffff',
            logoColor: '#ffffff',
            chipColor: '#F8C300',
            benefits: ['متوافقة مع الشريعة', 'مزايا عائلية']
        },
        custom: {
            name: 'مخصصة',
            color: '#3498db',
            textColor: '#ffffff',
            logoColor: '#ffffff',
            chipColor: '#C0C0C0',
            benefits: ['قابلة للتخصيص']
        }
    };

    // معرف المستخدم الثابت للاستخدام بدون تسجيل دخول
    const DEFAULT_USER_ID = 'b7XlRaRqUEX2X6SdnF9fyV5SPi83'; // استخدم المعرف الموجود في الروابط

    // تهيئة النظام
    function initialize() {
        console.log('تهيئة نظام بطاقات المستثمرين...');
        
        if (initialized) {
            console.log('نظام البطاقات مهيأ بالفعل');
            return Promise.resolve(true);
        }
        
        // تهيئة Firebase إذا لم تكن مهيأة بالفعل
        initializeFirebase();
        
        // إضافة أنماط CSS
        addCardStyles();
        
        // إنشاء مستمعات الأحداث
        setupEventListeners();
        
        // تحميل البيانات المخزنة محليًا
        loadLocalData();
        
        // التحقق من حالة تسجيل الدخول
        return checkAuthState()
            .then(() => {
                // تحميل البيانات من Firebase أو التخزين المحلي
                return loadCardsData();
            })
            .then(() => {
                console.log('تم تهيئة نظام بطاقات المستثمرين بنجاح');
                initialized = true;
                return true;
            })
            .catch(error => {
                console.error('خطأ في تهيئة نظام بطاقات المستثمرين:', error);
                
                // في حالة الخطأ، سنحاول تحميل البيانات من التخزين المحلي
                userInvestorCards = getCardsFromLocalStorage();
                console.log(`تم تحميل ${userInvestorCards.length} بطاقة من التخزين المحلي`);
                
                initialized = true;
                return true;
            });
    }

    // تهيئة Firebase
    function initializeFirebase() {
        try {
            // التحقق من وجود Firebase
            if (typeof firebase === 'undefined') {
                console.error('Firebase غير متوفر، تأكد من تضمين مكتبات Firebase');
                return false;
            }
            
            // تهيئة Firebase إذا لم تكن مهيأة بالفعل
            if (!firebase.apps.length) {
                // استخدام التكوين من النافذة إذا كان متاحًا
                const config = window.firebaseConfig || {
                    apiKey: "AIzaSyDGpAHia_wEmrhnmYjrPf1n1TrAzwEMiAI",
                    authDomain: "messageemeapp.firebaseapp.com",
                    databaseURL: "https://messageemeapp-default-rtdb.firebaseio.com",
                    projectId: "messageemeapp",
                    storageBucket: "messageemeapp.appspot.com",
                    messagingSenderId: "255034474844",
                    appId: "1:255034474844:web:5e3b7a6bc4b2fb94cc4199"
                };
                
                firebase.initializeApp(config);
            }
            
            // الحصول على مراجع Firebase
            databaseRef = firebase.database();
            return true;
        } catch (error) {
            console.error('خطأ في تهيئة Firebase:', error);
            return false;
        }
    }

    // التحقق من حالة تسجيل الدخول
    function checkAuthState() {
        return new Promise((resolve) => {
            // إزالة المستمع السابق إذا وجد
            if (authSubscription) {
                authSubscription();
            }
            
            // إنشاء مستمع جديد
            authSubscription = firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    // المستخدم مسجل الدخول
                    currentUser = user;
                    userUID = user.uid;
                    isLoggedIn = true;
                    console.log('تم تسجيل الدخول كـ:', user.email || user.uid);
                    
                    // تحديث واجهة المستخدم
                    updateUIForLoggedInUser(user);
                } else {
                    // المستخدم غير مسجل الدخول
                    currentUser = null;
                    isLoggedIn = false;
                    
                    // استخدام معرف المستخدم الافتراضي للقراءة فقط
                    userUID = DEFAULT_USER_ID;
                    console.log('لم يتم تسجيل الدخول، استخدام وضع القراءة فقط');
                    
                    // تحديث واجهة المستخدم
                    updateUIForLoggedOutUser();
                }
                
                // حفظ معلومات المستخدم محليًا
                saveUserToLocalStorage();
                
                resolve(isLoggedIn);
            });
        });
    }

    // تحميل البيانات من التخزين المحلي
    function loadLocalData() {
        // محاولة استرداد بيانات المستخدم
        try {
            const userData = localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
            if (userData) {
                const parsedData = JSON.parse(userData);
                
                // تعيين معرف المستخدم من التخزين المحلي إذا لم يكن متاحًا
                if (!userUID && parsedData.uid) {
                    userUID = parsedData.uid;
                }
            }
        } catch (error) {
            console.error('خطأ في تحميل بيانات المستخدم من التخزين المحلي:', error);
        }
        
        // محاولة استرداد البطاقة الحالية
        try {
            const cardData = localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_CARD);
            if (cardData) {
                currentCard = JSON.parse(cardData);
            }
        } catch (error) {
            console.error('خطأ في تحميل بيانات البطاقة من التخزين المحلي:', error);
        }
    }

    // حفظ معلومات المستخدم في التخزين المحلي
    function saveUserToLocalStorage() {
        if (currentUser) {
            try {
                const userData = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName,
                    lastLogin: new Date().toISOString()
                };
                
                localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));
            } catch (error) {
                console.error('خطأ في حفظ بيانات المستخدم في التخزين المحلي:', error);
            }
        } else {
            // إذا لم يكن هناك مستخدم حالي، نحفظ المعرف الافتراضي
            try {
                const userData = {
                    uid: userUID,
                    lastLogin: new Date().toISOString(),
                    isGuest: true
                };
                
                localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));
            } catch (error) {
                console.error('خطأ في حفظ بيانات المستخدم الافتراضي في التخزين المحلي:', error);
            }
        }
    }

    // حفظ البطاقة الحالية في التخزين المحلي
    function saveCurrentCardToLocalStorage() {
        if (currentCard) {
            try {
                localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_CARD, JSON.stringify(currentCard));
            } catch (error) {
                console.error('خطأ في حفظ بيانات البطاقة في التخزين المحلي:', error);
            }
        }
    }

    // تحميل البطاقات من Firebase
    function loadCardsData() {
        if (isLoading) {
            return Promise.resolve(userInvestorCards);
        }

        isLoading = true;
        console.log('جاري تحميل بطاقات المستثمرين...');

        // استخدام معرف المستخدم المسجل أو الافتراضي
        const uid = userUID || DEFAULT_USER_ID;

        // مسار البطاقات في Firebase
        const cardsPath = `users/${uid}/investor_cards`;

        return databaseRef.ref(cardsPath).once('value')
            .then(snapshot => {
                const cardsData = snapshot.val();
                
                if (cardsData) {
                    // تحويل البيانات إلى مصفوفة
                    userInvestorCards = Object.values(cardsData);
                    console.log(`تم تحميل ${userInvestorCards.length} بطاقة من Firebase`);
                    
                    // تحديث التخزين المحلي
                    saveCardsToLocalStorage(userInvestorCards);
                    
                    // تحديث وقت آخر تزامن
                    localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
                    
                    return loadInvestorsData().then(() => userInvestorCards);
                } else {
                    console.log('لا توجد بطاقات في Firebase، جاري محاولة التحميل من التخزين المحلي.');
                    
                    // محاولة استرداد البطاقات من التخزين المحلي
                    userInvestorCards = getCardsFromLocalStorage();
                    
                    return loadInvestorsData().then(() => userInvestorCards);
                }
            })
            .catch(error => {
                console.error('خطأ في تحميل البطاقات من Firebase:', error);
                
                // استرداد البطاقات من التخزين المحلي
                userInvestorCards = getCardsFromLocalStorage();
                
                return Promise.resolve(userInvestorCards);
            })
            .finally(() => {
                isLoading = false;
            });
    }

    // تحميل بيانات المستثمرين
    function loadInvestorsData() {
        if (!userUID) {
            console.log('معرف المستخدم غير متوفر، لا يمكن تحميل بيانات المستثمرين');
            return Promise.resolve([]);
        }

        console.log('جاري تحميل بيانات المستثمرين...');

        // مسار المستثمرين في Firebase
        const investorsPath = `users/${userUID}/investors`;

        return databaseRef.ref(investorsPath).once('value')
            .then(snapshot => {
                const investorsData = snapshot.val();
                
                if (investorsData) {
                    // تحويل البيانات إلى مصفوفة
                    investorsList = Object.values(investorsData);
                    console.log(`تم تحميل ${investorsList.length} مستثمر من Firebase`);
                    
                    // ربط بيانات المستثمرين بالبطاقات
                    linkInvestorsToCards();
                    
                    return investorsList;
                } else {
                    console.log('لا توجد بيانات للمستثمرين في Firebase');
                    
                    // محاولة استرداد المستثمرين من النافذة العامة
                    if (window.investors && Array.isArray(window.investors)) {
                        investorsList = window.investors;
                        console.log(`تم تحميل ${investorsList.length} مستثمر من النافذة العامة`);
                        
                        // ربط بيانات المستثمرين بالبطاقات
                        linkInvestorsToCards();
                    }
                    
                    return investorsList;
                }
            })
            .catch(error => {
                console.error('خطأ في تحميل بيانات المستثمرين:', error);
                
                // محاولة استرداد المستثمرين من النافذة العامة
                if (window.investors && Array.isArray(window.investors)) {
                    investorsList = window.investors;
                    console.log(`تم تحميل ${investorsList.length} مستثمر من النافذة العامة`);
                    
                    // ربط بيانات المستثمرين بالبطاقات
                    linkInvestorsToCards();
                }
                
                return investorsList;
            });
    }

    // ربط بيانات المستثمرين بالبطاقات
    function linkInvestorsToCards() {
        if (!userInvestorCards.length || !investorsList.length) {
            return;
        }

        userInvestorCards.forEach(card => {
            if (card.investorId) {
                const investor = investorsList.find(inv => inv.id === card.investorId);
                if (investor) {
                    card.investorData = investor;
                }
            }
        });

        console.log('تم ربط بيانات المستثمرين بالبطاقات');
    }

    // جلب البطاقات من التخزين المحلي
    function getCardsFromLocalStorage() {
        try {
            const cardsData = localStorage.getItem(LOCAL_STORAGE_KEYS.CARDS);
            
            if (cardsData) {
                return JSON.parse(cardsData);
            }
            
            return [];
        } catch (error) {
            console.error('خطأ في قراءة البطاقات من التخزين المحلي:', error);
            return [];
        }
    }

    // حفظ البطاقات في التخزين المحلي
    function saveCardsToLocalStorage(cards) {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEYS.CARDS, JSON.stringify(cards));
            console.log('تم حفظ البطاقات في التخزين المحلي');
            return true;
        } catch (error) {
            console.error('خطأ في حفظ البطاقات في التخزين المحلي:', error);
            return false;
        }
    }

    // تسجيل الدخول برقم البطاقة وتاريخ الانتهاء
    function loginWithCard(cardNumber, expiryDate, cvv) {
        return new Promise((resolve, reject) => {
            if (isLoading) {
                return reject(new Error('جاري معالجة العملية السابقة، يرجى الانتظار'));
            }

            isLoading = true;
            console.log('جاري التحقق من بيانات البطاقة...');

            // إزالة المسافات من رقم البطاقة
            cardNumber = cardNumber.replace(/\s+/g, '');

            // التحقق من صحة بيانات الإدخال
            if (!cardNumber || !expiryDate) {
                isLoading = false;
                return reject(new Error('يرجى إدخال جميع البيانات المطلوبة'));
            }

            // تنسيق تاريخ الانتهاء
            const formattedExpiry = formatExpiryDate(expiryDate);

            // البحث أولاً في التخزين المحلي
            let localCards = getCardsFromLocalStorage();

            // البحث عن البطاقة المطابقة
            let matchingCard = localCards.find(card => {
                const cardNum = card.cardNumber.replace(/\s+/g, '');
                const expiry = formatExpiryDate(card.expiryDate);
                return cardNum === cardNumber && expiry === formattedExpiry;
            });

            if (matchingCard) {
                console.log('تم العثور على البطاقة في التخزين المحلي');
                
                // التحقق من رمز CVV إذا كان موجوداً
                if (cvv && matchingCard.cvv && cvv !== matchingCard.cvv) {
                    isLoading = false;
                    return reject(new Error('رمز الحماية (CVV) غير صحيح'));
                }
                
                // تعيين البطاقة الحالية
                currentCard = matchingCard;
                saveCurrentCardToLocalStorage();
                
                // تحديث واجهة المستخدم
                displayCardDetails(matchingCard);
                
                isLoading = false;
                return resolve(matchingCard);
            }

            // إذا لم يتم العثور محلياً، نبحث في Firebase
            loadCardsFromFirebase(cardNumber, formattedExpiry, cvv)
                .then(card => {
                    if (card) {
                        // تم العثور على البطاقة
                        currentCard = card;
                        saveCurrentCardToLocalStorage();
                        
                        // إضافة البطاقة للتخزين المحلي
                        if (!localCards.some(c => c.id === card.id)) {
                            localCards.push(card);
                            saveCardsToLocalStorage(localCards);
                        }
                        
                        // تحديث واجهة المستخدم
                        displayCardDetails(card);
                        
                        isLoading = false;
                        resolve(card);
                    } else {
                        isLoading = false;
                        reject(new Error('بيانات البطاقة غير صحيحة. يرجى التحقق والمحاولة مرة أخرى.'));
                    }
                })
                .catch(error => {
                    console.error('خطأ في البحث عن البطاقة في Firebase:', error);
                    isLoading = false;
                    reject(new Error('فشل التحقق من بيانات البطاقة. يرجى المحاولة مرة أخرى.'));
                });
        });
    }

    // البحث عن البطاقة في Firebase
    function loadCardsFromFirebase(cardNumber, expiryDate, cvv) {
        // نستخدم المعرف الافتراضي للبحث
        const uid = DEFAULT_USER_ID;
        const cardsPath = `users/${uid}/investor_cards`;

        return databaseRef.ref(cardsPath).once('value')
            .then(snapshot => {
                const cardsData = snapshot.val();
                
                if (!cardsData) {
                    return null;
                }
                
                // البحث عن البطاقة المطابقة
                for (const cardId in cardsData) {
                    const card = cardsData[cardId];
                    const cardNum = card.cardNumber?.replace(/\s+/g, '') || '';
                    const expiry = formatExpiryDate(card.expiryDate);
                    
                    if (cardNum === cardNumber && expiry === expiryDate) {
                        // التحقق من رمز CVV إذا كان موجوداً
                        if (cvv && card.cvv && cvv !== card.cvv) {
                            continue;
                        }
                        
                        console.log('تم العثور على البطاقة في Firebase');
                        return card;
                    }
                }
                
                return null;
            });
    }

    // تسجيل الدخول برقم الهاتف واسم المستثمر
    function loginWithPhone(phoneNumber, investorName) {
        return new Promise((resolve, reject) => {
            if (isLoading) {
                return reject(new Error('جاري معالجة العملية السابقة، يرجى الانتظار'));
            }

            isLoading = true;
            console.log('جاري التحقق من بيانات المستثمر...');

            // التحقق من صحة بيانات الإدخال
            if (!phoneNumber || !investorName) {
                isLoading = false;
                return reject(new Error('يرجى إدخال جميع البيانات المطلوبة'));
            }

            // البحث عن المستثمر
            findInvestorByPhoneAndName(phoneNumber, investorName)
                .then(investor => {
                    if (investor) {
                        // البحث عن بطاقة المستثمر
                        return findCardByInvestorId(investor.id)
                            .then(card => {
                                if (card) {
                                    // تعيين البطاقة الحالية
                                    currentCard = card;
                                    saveCurrentCardToLocalStorage();
                                    
                                    // تحديث واجهة المستخدم
                                    displayCardDetails(card);
                                    
                                    isLoading = false;
                                    resolve(card);
                                } else {
                                    isLoading = false;
                                    reject(new Error('لم يتم العثور على بطاقة لهذا المستثمر'));
                                }
                            });
                    } else {
                        isLoading = false;
                        reject(new Error('لم يتم العثور على مستثمر بهذه البيانات'));
                    }
                })
                .catch(error => {
                    console.error('خطأ في البحث عن المستثمر:', error);
                    isLoading = false;
                    reject(new Error('فشل التحقق من بيانات المستثمر. يرجى المحاولة مرة أخرى.'));
                });
        });
    }

    // البحث عن مستثمر بواسطة رقم الهاتف والاسم
    function findInvestorByPhoneAndName(phone, name) {
        return new Promise((resolve) => {
            // البحث في القائمة المحلية أولاً
            const localInvestor = investorsList.find(inv => 
                inv.phone === phone && 
                inv.name.toLowerCase().includes(name.toLowerCase())
            );
            
            if (localInvestor) {
                return resolve(localInvestor);
            }
            
            // البحث في Firebase
            const uid = DEFAULT_USER_ID;
            const investorsPath = `users/${uid}/investors`;
            
            databaseRef.ref(investorsPath).once('value')
                .then(snapshot => {
                    const investorsData = snapshot.val();
                    
                    if (!investorsData) {
                        return resolve(null);
                    }
                    
                    // البحث عن المستثمر المطابق
                    for (const investorId in investorsData) {
                        const investor = investorsData[investorId];
                        
                        if (investor.phone === phone && 
                            investor.name.toLowerCase().includes(name.toLowerCase())) {
                            return resolve(investor);
                        }
                    }
                    
                    resolve(null);
                })
                .catch(error => {
                    console.error('خطأ في البحث عن المستثمر في Firebase:', error);
                    resolve(null);
                });
        });
    }

    // البحث عن بطاقة بواسطة معرف المستثمر
    function findCardByInvestorId(investorId) {
        return new Promise((resolve) => {
            // البحث في القائمة المحلية أولاً
            const localCard = userInvestorCards.find(card => card.investorId === investorId);
            
            if (localCard) {
                return resolve(localCard);
            }
            
            // البحث في Firebase
            const uid = DEFAULT_USER_ID;
            const cardsPath = `users/${uid}/investor_cards`;
            
            databaseRef.ref(cardsPath).once('value')
                .then(snapshot => {
                    const cardsData = snapshot.val();
                    
                    if (!cardsData) {
                        return resolve(null);
                    }
                    
                    // البحث عن البطاقة المطابقة
                    for (const cardId in cardsData) {
                        const card = cardsData[cardId];
                        
                        if (card.investorId === investorId) {
                            return resolve(card);
                        }
                    }
                    
                    resolve(null);
                })
                .catch(error => {
                    console.error('خطأ في البحث عن البطاقة في Firebase:', error);
                    resolve(null);
                });
        });
    }

    // إضافة أنماط CSS للبطاقات
    function addCardStyles() {
        // التحقق من وجود عنصر الأنماط مسبقاً
        if (document.getElementById('investor-card-styles')) {
            return;
        }
        
        // إنشاء عنصر النمط
        const styleElement = document.createElement('style');
        styleElement.id = 'investor-card-styles';
        
        // إضافة الأنماط CSS
        styleElement.textContent = `
            /* أنماط النظام */
            .investor-card-container {
                perspective: 1000px;
                width: 100%;
                max-width: 400px;
                margin: 0 auto;
            }
            
            .investor-card {
                width: 100%;
                height: 240px;
                position: relative;
                transition: transform 0.6s;
                transform-style: preserve-3d;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            }
            
            .investor-card.flipped {
                transform: rotateY(180deg);
            }
            
            .card-front, .card-back {
                position: absolute;
                width: 100%;
                height: 100%;
                backface-visibility: hidden;
                border-radius: 16px;
                padding: 20px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .card-back {
                transform: rotateY(180deg);
            }
            
            .card-brand {
                text-align: right;
                font-size: 1.2rem;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .card-logo {
                position: absolute;
                top: 20px;
                left: 20px;
                display: flex;
            }
            
            .card-logo-circle {
                width: 30px;
                height: 30px;
                border-radius: 50%;
            }
            
            .card-logo-circle.red {
                background-color: #eb001b;
            }
            
            .card-logo-circle.yellow {
                background-color: #f79e1b;
                margin-right: -15px;
            }
            
            .card-number {
                font-size: 1.4rem;
                letter-spacing: 2px;
                text-align: center;
                margin-top: 40px;
                font-family: monospace;
            }
            
            .card-details {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin-top: auto;
            }
            
            .card-validity {
                text-transform: uppercase;
                font-size: 0.8rem;
            }
            
            .card-valid-text {
                font-size: 0.6rem;
                opacity: 0.8;
            }
            
            .card-name {
                text-align: right;
                font-size: 1rem;
                text-transform: uppercase;
            }
            
            .card-chip {
                position: absolute;
                top: 70px;
                right: 40px;
                width: 50px;
                height: 40px;
                background: linear-gradient(135deg, #c9a851 0%, #ffd700 50%, #c9a851 100%);
                border-radius: 6px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                overflow: hidden;
            }
            
            .chip-line {
                position: absolute;
                height: 1.5px;
                background-color: rgba(0, 0, 0, 0.3);
                width: 100%;
            }
            
            .chip-line:nth-child(1) { top: 8px; }
            .chip-line:nth-child(2) { top: 16px; }
            .chip-line:nth-child(3) { top: 24px; }
            .chip-line:nth-child(4) { top: 32px; }
            
            .chip-line:nth-child(5) {
                height: 100%;
                width: 1.5px;
                left: 12px;
            }
            
            .chip-line:nth-child(6) {
                height: 100%;
                width: 1.5px;
                left: 24px;
            }
            
            .chip-line:nth-child(7) {
                height: 100%;
                width: 1.5px;
                left: 36px;
            }
            
            .card-hologram {
                position: absolute;
                width: 60px;
                height: 60px;
                bottom: 50px;
                left: 40px;
                background: linear-gradient(45deg, 
                    rgba(255,255,255,0.1) 0%, 
                    rgba(255,255,255,0.3) 25%, 
                    rgba(255,255,255,0.5) 50%, 
                    rgba(255,255,255,0.3) 75%, 
                    rgba(255,255,255,0.1) 100%);
                border-radius: 50%;
                animation: hologram-animation 3s infinite linear;
                opacity: 0.7;
            }
            
            @keyframes hologram-animation {
                0% { 
                    background-position: 0% 0%;
                }
                100% { 
                    background-position: 100% 100%;
                }
            }
            
            .card-back-strip {
                width: 100%;
                height: 40px;
                background-color: #333;
                margin: 20px 0;
            }
            
            .card-cvv {
                background-color: white;
                color: black;
                display: inline-block;
                padding: 5px 10px;
                font-size: 0.9rem;
                margin-top: 10px;
                border-radius: 4px;
                font-family: monospace;
            }
            
            .card-issuer-info {
                text-align: center;
                margin-top: 40px;
                font-size: 0.8rem;
                opacity: 0.8;
            }
            
            /* أنماط للـ QR */
            .card-qr-container {
                position: absolute;
                bottom: 50px;
                right: 30px;
                width: 80px;
                height: 80px;
                background-color: white;
                padding: 5px;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .card-qr-container img, .card-qr-container canvas {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
            
            /* أنماط الناقذة المنبثقة */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            
            .modal-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            
            .modal {
                background-color: white;
                border-radius: 12px;
                max-width: 90%;
                width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                display: flex;
                flex-direction: column;
            }
            
            .modal-header {
                padding: 15px 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-title {
                font-size: 1.2rem;
                font-weight: bold;
                margin: 0;
            }
            
            .modal-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #666;
                transition: color 0.2s;
            }
            
            .modal-close:hover {
                color: #333;
            }
            
            .modal-body {
                padding: 20px;
                flex: 1;
                overflow-y: auto;
            }
            
            .modal-footer {
                padding: 15px 20px;
                border-top: 1px solid #eee;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            /* أنماط حالة البطاقة */
            .card-status-badge {
                position: absolute;
                top: 20px;
                left: 70px;
                padding: 5px 10px;
                border-radius: 30px;
                font-size: 0.8rem;
                font-weight: bold;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                z-index: 10;
            }
            
            .card-status-badge.success {
                background-color: #2ecc71;
                color: white;
            }
            
            .card-status-badge.warning {
                background-color: #f39c12;
                color: white;
            }
            
            .card-status-badge.danger {
                background-color: #e74c3c;
                color: white;
            }
        `;
        
        // إضافة العنصر إلى head
        document.head.appendChild(styleElement);
        
        console.log('تم إضافة أنماط CSS للبطاقات');
    }

    // إنشاء مستمعات الأحداث
    function setupEventListeners() {
        console.log('إعداد مستمعات الأحداث لنظام البطاقات...');

        // مستمع لنموذج تسجيل الدخول بالبطاقة
        const cardLoginForm = document.getElementById('card-login-form');
        if (cardLoginForm) {
            cardLoginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const cardNumber = document.getElementById('card-number').value;
                const cardExpiry = document.getElementById('card-expiry').value;
                const cardCvv = document.getElementById('card-cvv').value;
                
                // تعطيل الزر أثناء المعالجة
                const loginBtn = document.getElementById('card-login-btn');
                if (loginBtn) {
                    loginBtn.disabled = true;
                    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>جاري التحقق...</span>';
                }
                
                // مسح رسائل الخطأ السابقة
                const errorElement = document.getElementById('login-error');
                if (errorElement) {
                    errorElement.textContent = '';
                    errorElement.style.display = 'none';
                }
                
                // محاولة تسجيل الدخول
                loginWithCard(cardNumber, cardExpiry, cardCvv)
                    .then(card => {
                        console.log('تم تسجيل الدخول بنجاح');
                        
                        // إخفاء شاشة تسجيل الدخول
                        const loginScreen = document.getElementById('login-screen');
                        if (loginScreen) {
                            loginScreen.style.display = 'none';
                        }
                        
                        // عرض الصفحة الرئيسية
                        const cardDashboard = document.getElementById('card-dashboard');
                        if (cardDashboard) {
                            cardDashboard.style.display = 'flex';
                        }
                    })
                    .catch(error => {
                        console.error('خطأ في تسجيل الدخول بالبطاقة:', error);
                        
                        // عرض رسالة الخطأ
                        if (errorElement) {
                            errorElement.textContent = error.message;
                            errorElement.style.display = 'block';
                        }
                    })
                    .finally(() => {
                        // إعادة تفعيل الزر
                        if (loginBtn) {
                            loginBtn.disabled = false;
                            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>تسجيل الدخول</span>';
                        }
                    });
            });
        }

        // مستمع لنموذج تسجيل الدخول بالهاتف
        const phoneLoginForm = document.getElementById('phone-login-form');
        if (phoneLoginForm) {
            phoneLoginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const phoneNumber = document.getElementById('phone-number').value;
                const investorName = document.getElementById('investor-name').value;
                
                // تعطيل الزر أثناء المعالجة
                const loginBtn = document.getElementById('phone-login-btn');
                if (loginBtn) {
                    loginBtn.disabled = true;
                    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>جاري التحقق...</span>';
                }
                
                // مسح رسائل الخطأ السابقة
                const errorElement = document.getElementById('phone-login-error');
                if (errorElement) {
                    errorElement.textContent = '';
                    errorElement.style.display = 'none';
                }
                
                // محاولة تسجيل الدخول
                loginWithPhone(phoneNumber, investorName)
                    .then(card => {
                        console.log('تم تسجيل الدخول بنجاح');
                        
                        // إخفاء شاشة تسجيل الدخول
                        const loginScreen = document.getElementById('login-screen');
                        if (loginScreen) {
                            loginScreen.style.display = 'none';
                        }
                        
                        // عرض الصفحة الرئيسية
                        const cardDashboard = document.getElementById('card-dashboard');
                        if (cardDashboard) {
                            cardDashboard.style.display = 'flex';
                        }
                    })
                    .catch(error => {
                        console.error('خطأ في تسجيل الدخول بالهاتف:', error);
                        
                        // عرض رسالة الخطأ
                        if (errorElement) {
                            errorElement.textContent = error.message;
                            errorElement.style.display = 'block';
                        }
                    })
                    .finally(() => {
                        // إعادة تفعيل الزر
                        if (loginBtn) {
                            loginBtn.disabled = false;
                            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>تسجيل الدخول</span>';
                        }
                    });
            });
        }

        // مستمع لأزرار التبويب
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // إزالة الفئة النشطة من جميع الأزرار
                tabButtons.forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // إضافة الفئة النشطة للزر الحالي
                this.classList.add('active');
                
                // الحصول على معرف التبويب
                const tabId = this.getAttribute('data-tab');
                
                // إخفاء جميع محتويات التبويب
                const tabContents = document.querySelectorAll('.tab-content');
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                
                // عرض محتوى التبويب المطلوب
                const activeTab = document.getElementById(`${tabId}-tab`);
                if (activeTab) {
                    activeTab.classList.add('active');
                }
                
                // مسح رسائل الخطأ
                const errorElements = document.querySelectorAll('.error-message');
                errorElements.forEach(element => {
                    element.textContent = '';
                    element.style.display = 'none';
                });
            });
        });

        // مستمع لزر تسجيل الخروج
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                // تنفيذ تسجيل الخروج
                logout();
            });
        }

        // مستمع لزر قلب البطاقة
        const flipCardBtn = document.getElementById('flip-card-btn');
        if (flipCardBtn) {
            flipCardBtn.addEventListener('click', function() {
                const card = document.querySelector('.investor-card');
                if (card) {
                    card.classList.toggle('flipped');
                    
                    // تغيير نص الزر
                    const isFlipped = card.classList.contains('flipped');
                    this.querySelector('span').textContent = isFlipped ? 'عرض الأمام' : 'عرض الخلف';
                }
            });
        }

        // مستمع لزر عرض رمز QR
        const showQrBtn = document.getElementById('show-qr-btn');
        if (showQrBtn) {
            showQrBtn.addEventListener('click', function() {
                const qrModal = document.getElementById('qr-modal');
                if (qrModal) {
                    qrModal.classList.add('active');
                    
                    // إنشاء رمز QR للبطاقة الحالية
                    generateQRCodeForCurrentCard();
                }
            });
        }

        // مستمع لزر مشاركة البطاقة
        const shareCardBtn = document.getElementById('share-card-btn');
        if (shareCardBtn) {
            shareCardBtn.addEventListener('click', function() {
                const shareModal = document.getElementById('share-modal');
                if (shareModal) {
                    shareModal.classList.add('active');
                    
                    // تحضير محتوى المشاركة
                    prepareShareContent();
                }
            });
        }

        // مستمع لأزرار الإغلاق في النوافذ المنبثقة
        const closeButtons = document.querySelectorAll('.modal-close, .modal-close-btn');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal-overlay');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // مستمع لزر الاتصال بالدعم
        const contactSupportBtn = document.getElementById('contact-support-btn');
        if (contactSupportBtn) {
            contactSupportBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                const supportModal = document.getElementById('support-modal');
                if (supportModal) {
                    supportModal.classList.add('active');
                }
            });
        }

        // مستمع التنسيق التلقائي لرقم البطاقة
        const cardNumberInput = document.getElementById('card-number');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', function() {
                this.value = formatCardNumber(this.value);
            });
        }

        // مستمع التنسيق التلقائي لتاريخ الانتهاء
        const cardExpiryInput = document.getElementById('card-expiry');
        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', function() {
                this.value = formatInputExpiryDate(this.value);
            });
        }

        console.log('تم إعداد مستمعات الأحداث بنجاح');
    }

    // تنسيق رقم البطاقة أثناء الإدخال
    function formatCardNumber(value) {
        // إزالة جميع المسافات والأحرف غير الرقمية
        const cardNumber = value.replace(/\D/g, '');
        
        // تقسيم الرقم إلى مجموعات من 4 أرقام
        return cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
    }

    // تنسيق تاريخ الانتهاء أثناء الإدخال (MM/YY)
    function formatInputExpiryDate(value) {
        // إزالة الأحرف غير الرقمية
        const expiry = value.replace(/\D/g, '');
        
        if (expiry.length > 2) {
            return `${expiry.substring(0, 2)}/${expiry.substring(2, 4)}`;
        } else {
            return expiry;
        }
    }

    // تنسيق تاريخ الانتهاء (MM/YY)
    function formatExpiryDate(dateString) {
        // إذا كان بالتنسيق MM/YY مباشرة
        if (/^\d{2}\/\d{2}$/.test(dateString)) {
            return dateString;
        }
        
        try {
            const date = new Date(dateString);
            
            if (isNaN(date.getTime())) {
                return '12/99'; // قيمة افتراضية في حالة الخطأ
            }
            
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear().toString().slice(2);
            
            return `${month}/${year}`;
        } catch (error) {
            console.error('خطأ في تنسيق تاريخ الانتهاء:', error);
            return '12/99';
        }
    }

    // تحديث واجهة المستخدم للمستخدم المسجل
    function updateUIForLoggedInUser(user) {
        // تغيير اسم المستخدم في الواجهة
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = user.displayName || user.email || 'المستخدم';
        }
        
        // إخفاء شاشة تسجيل الدخول
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) {
            loginScreen.style.display = 'none';
        }
        
        // عرض لوحة البطاقات
        const cardDashboard = document.getElementById('card-dashboard');
        if (cardDashboard) {
            cardDashboard.style.display = 'flex';
        }
        
        // تحديث شارة الإشعارات
        updateNotificationBadge();
    }

    // تحديث واجهة المستخدم للمستخدم غير المسجل
    function updateUIForLoggedOutUser() {
        // إذا كان لدينا بطاقة حالية من التخزين المحلي، سنعرضها مباشرة
        if (currentCard) {
            // إخفاء شاشة تسجيل الدخول
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) {
                loginScreen.style.display = 'none';
            }
            
            // عرض لوحة البطاقات
            const cardDashboard = document.getElementById('card-dashboard');
            if (cardDashboard) {
                cardDashboard.style.display = 'flex';
            }
            
            // عرض بيانات البطاقة
            displayCardDetails(currentCard);
        } else {
            // إظهار شاشة تسجيل الدخول
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) {
                loginScreen.style.display = 'flex';
            }
            
            // إخفاء لوحة البطاقات
            const cardDashboard = document.getElementById('card-dashboard');
            if (cardDashboard) {
                cardDashboard.style.display = 'none';
            }
        }
    }

    // تحديث شارة الإشعارات
    function updateNotificationBadge() {
        // الحصول على عدد الإشعارات غير المقروءة
        const unreadCount = getUnreadNotificationsCount();
        
        // تحديث الشارة
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    }

    // الحصول على عدد الإشعارات غير المقروءة
    function getUnreadNotificationsCount() {
        // يمكن تعديل هذه الدالة لجلب الإشعارات الفعلية من النظام
        return 0; // قيمة مبدئية
    }

    // عرض تفاصيل البطاقة
    function displayCardDetails(card) {
        if (!card) {
            console.error('لا توجد بيانات للبطاقة');
            return;
        }
        
        console.log('عرض بيانات البطاقة:', card);
        
        // حفظ البطاقة الحالية
        currentCard = card;
        saveCurrentCardToLocalStorage();
        
        // تحديث بيانات البطاقة في الواجهة
        const displayCardNumber = document.getElementById('display-card-number');
        const displayCardExpiry = document.getElementById('display-card-expiry');
        const displayCardName = document.getElementById('display-card-name');
        const displayCvv = document.getElementById('display-cvv');
        const displayPhone = document.getElementById('display-phone');
        const cardStatusBadge = document.getElementById('card-status-badge');
        
        if (displayCardNumber) displayCardNumber.textContent = card.cardNumber || 'XXXX XXXX XXXX XXXX';
        if (displayCardExpiry) displayCardExpiry.textContent = formatExpiryDate(card.expiryDate) || 'MM/YY';
        if (displayCardName) displayCardName.textContent = card.investorName || 'اسم المستثمر';
        if (displayCvv) displayCvv.textContent = card.cvv || '***';
        if (displayPhone) displayPhone.textContent = card.investorPhone || '';
        
        // تحديث حالة البطاقة
        if (cardStatusBadge) {
            const isExpired = new Date(card.expiryDate) < new Date();
            const isActive = card.status === 'active';
            
            if (!isActive) {
                cardStatusBadge.className = 'card-status-badge warning';
                cardStatusBadge.textContent = 'موقوفة';
            } else if (isExpired) {
                cardStatusBadge.className = 'card-status-badge danger';
                cardStatusBadge.textContent = 'منتهية';
            } else {
                cardStatusBadge.className = 'card-status-badge success';
                cardStatusBadge.textContent = 'نشطة';
            }
        }
        
        // تعيين نمط البطاقة حسب النوع
        applyCardStyle(card);
        
        // تحديث معلومات المستثمر
        updateInvestorInfo(card);
        
        // تحديث قوائم البيانات
        updateDataLists(card);
        
        // تحديث اسم المستخدم في الواجهة
        updateUserDisplayName(card.investorName);
    }

    // تطبيق نمط البطاقة
    function applyCardStyle(card) {
        const cardType = card.cardType || 'platinum';
        const cardElement = document.querySelector('.investor-card');
        
        if (!cardElement) return;
        
        // الحصول على معلومات التصميم حسب النوع
        const styleInfo = CARD_TYPES[cardType] || CARD_TYPES.platinum;
        
        // تعيين ألوان البطاقة
        const cardFront = cardElement.querySelector('.card-front');
        const cardBack = cardElement.querySelector('.card-back');
        
        if (cardFront) {
            cardFront.style.backgroundColor = styleInfo.color;
            cardFront.style.color = styleInfo.textColor;
        }
        
        if (cardBack) {
            cardBack.style.backgroundColor = styleInfo.color;
            cardBack.style.color = styleInfo.textColor;
        }
        
        // تعيين لون الشريحة
        const cardChip = cardElement.querySelector('.card-chip');
        if (cardChip) {
            cardChip.style.background = `linear-gradient(135deg, ${styleInfo.chipColor}88 0%, ${styleInfo.chipColor} 50%, ${styleInfo.chipColor}88 100%)`;
        }
        
        // تحديث اسم النوع في البطاقة
        const cardBrand = cardElement.querySelector('.card-brand');
        if (cardBrand) {
            cardBrand.textContent = styleInfo.name;
        }
    }

    // تحديث اسم المستخدم في الواجهة
    function updateUserDisplayName(name) {
        const userNameElement = document.getElementById('user-name');
        const userInitialElement = document.getElementById('user-initial');
        
        if (userNameElement && name) {
            userNameElement.textContent = name;
            
            if (userInitialElement) {
                // وضع الحرف الأول من الاسم
                userInitialElement.textContent = name.charAt(0);
            }
        }
    }

    // تحديث معلومات المستثمر
    function updateInvestorInfo(card) {
        // تحديث معلومات المستثمر في تبويب المعلومات
        const investorFullName = document.getElementById('investor-full-name');
        const investorPhoneNumber = document.getElementById('investor-phone-number');
        const investorAddress = document.getElementById('investor-address');
        const investorJoinDate = document.getElementById('investor-join-date');
        
        if (investorFullName) investorFullName.textContent = card.investorName || '-';
        if (investorPhoneNumber) investorPhoneNumber.textContent = card.investorPhone || '-';
        
        // البحث عن بيانات إضافية للمستثمر
        if (card.investorId) {
            const investor = findInvestorById(card.investorId);
            
            if (investor) {
                if (investorAddress) investorAddress.textContent = investor.address || '-';
                if (investorJoinDate) investorJoinDate.textContent = formatDate(investor.joinDate || investor.createdAt) || '-';
                
                // تحديث الإحصائيات المالية
                updateFinancialStats(investor);
            }
        }
        
        // تحديث معلومات البطاقة
        const cardType = document.getElementById('card-type');
        const cardIssueDate = document.getElementById('card-issue-date');
        const cardExpiryDate = document.getElementById('card-expiry-date');
        const cardStatusInfo = document.getElementById('card-status-badge-info');
        
        if (cardType) cardType.textContent = getCardTypeName(card.cardType) || 'بلاتينية';
        if (cardIssueDate) cardIssueDate.textContent = formatDate(card.createdAt) || '-';
        if (cardExpiryDate) cardExpiryDate.textContent = formatDate(card.expiryDate) || '-';
        
        if (cardStatusInfo) {
            const isExpired = new Date(card.expiryDate) < new Date();
            const isActive = card.status === 'active';
            
            cardStatusInfo.className = 'badge';
            
            if (!isActive) {
                cardStatusInfo.classList.add('badge-warning');
                cardStatusInfo.textContent = 'موقوفة';
            } else if (isExpired) {
                cardStatusInfo.classList.add('badge-danger');
                cardStatusInfo.textContent = 'منتهية';
            } else {
                cardStatusInfo.classList.add('badge-success');
                cardStatusInfo.textContent = 'نشطة';
            }
        }
        
        // تحديث مزايا البطاقة
        const benefitsList = document.getElementById('benefits-list');
        if (benefitsList) {
            const benefits = CARD_TYPES[card.cardType]?.benefits || [];
            
            let html = '';
            
            if (benefits.length > 0) {
                benefits.forEach(benefit => {
                    html += `<li>${benefit}</li>`;
                });
            } else {
                html = '<li>لا توجد مزايا محددة</li>';
            }
            
            benefitsList.innerHTML = html;
        }
    }

    // تحديث الإحصائيات المالية
    function updateFinancialStats(investor) {
        // تحديث الرصيد الإجمالي
        const totalBalance = document.getElementById('total-balance');
        if (totalBalance) {
            totalBalance.textContent = formatCurrency(investor.amount || 0);
        }
        
        // تحديث الربح الشهري
        const monthlyProfit = document.getElementById('monthly-profit');
        if (monthlyProfit) {
            const profit = calculateMonthlyProfit(investor.amount || 0);
            monthlyProfit.textContent = formatCurrency(profit);
        }
        
        // تحديث أيام الاستثمار
        const investmentDays = document.getElementById('investment-days');
        if (investmentDays) {
            const days = calculateInvestmentDays(investor.joinDate || investor.createdAt);
            investmentDays.textContent = days;
        }
        
        // تحديث موعد الربح القادم
        const nextProfitDate = document.getElementById('next-profit-date');
        if (nextProfitDate) {
            const nextDate = calculateNextProfitDate(investor.joinDate || investor.createdAt);
            nextProfitDate.textContent = formatDate(nextDate);
        }
        
        // تحديث تاريخ آخر تحديث
        const lastUpdateDate = document.getElementById('last-update-date');
        if (lastUpdateDate) {
            lastUpdateDate.textContent = formatDate(new Date());
        }
    }

    // تحديث قوائم البيانات
    function updateDataLists(card) {
        // تحديث قائمة الاستثمارات
        updateInvestmentsList(card);
        
        // تحديث قائمة العمليات
        updateTransactionsList(card);
        
        // تحديث قائمة الأرباح
        updateProfitsList(card);
    }

    // تحديث قائمة الاستثمارات
    function updateInvestmentsList(card) {
        const investmentsList = document.getElementById('investments-list');
        if (!investmentsList) return;
        
        let html = '';
        
        if (card.investorId) {
            const investor = findInvestorById(card.investorId);
            
            if (investor && investor.investments && investor.investments.length > 0) {
                // عرض الاستثمارات المتعددة
                investor.investments.forEach(investment => {
                    html += createInvestmentItemHTML(investment);
                });
            } else if (investor && investor.amount) {
                // عرض الاستثمار الإجمالي
                const dummyInvestment = {
                    amount: investor.amount,
                    date: investor.joinDate || investor.createdAt || card.createdAt,
                    status: 'active'
                };
                
                html += createInvestmentItemHTML(dummyInvestment);
            } else {
                html = '<div class="empty-list">لا توجد استثمارات متاحة</div>';
            }
        } else {
            html = '<div class="empty-list">لا توجد استثمارات متاحة</div>';
        }
        
        investmentsList.innerHTML = html;
    }

    // إنشاء HTML لعنصر استثمار
    function createInvestmentItemHTML(investment) {
        const returnRate = 17.5; // نسبة افتراضية
        const daysActive = calculateInvestmentDays(investment.date);
        const statusClass = investment.status === 'active' ? 'badge-success' : 'badge-warning';
        const statusText = investment.status === 'active' ? 'نشط' : 'غير نشط';
        
        return `
            <div class="data-item">
                <div class="data-item-header">
                    <div class="data-item-title">${formatCurrency(investment.amount)}</div>
                    <div class="data-item-badge ${statusClass}">${statusText}</div>
                </div>
                <div class="data-item-details">
                    <div class="data-detail">
                        <div class="data-detail-label">تاريخ الاستثمار</div>
                        <div class="data-detail-value">${formatDate(investment.date)}</div>
                    </div>
                    <div class="data-detail">
                        <div class="data-detail-label">معدل العائد</div>
                        <div class="data-detail-value">${returnRate}%</div>
                    </div>
                    <div class="data-detail">
                        <div class="data-detail-label">عدد الأيام</div>
                        <div class="data-detail-value">${daysActive} يوم</div>
                    </div>
                </div>
            </div>
        `;
    }

    // تحديث قائمة العمليات
    function updateTransactionsList(card) {
        const transactionsList = document.getElementById('transactions-list');
        if (!transactionsList) return;
        
        let html = '';
        
        if (card.investorId) {
            const transactions = getInvestorTransactions(card.investorId);
            
            if (transactions && transactions.length > 0) {
                transactions.forEach(transaction => {
                    html += createTransactionItemHTML(transaction);
                });
            } else {
                html = '<div class="empty-list">لا توجد عمليات متاحة</div>';
            }
        } else {
            html = '<div class="empty-list">لا توجد عمليات متاحة</div>';
        }
        
        transactionsList.innerHTML = html;
    }

    // إنشاء HTML لعنصر عملية
    function createTransactionItemHTML(transaction) {
        const typeClass = getTransactionTypeClass(transaction.type);
        const typeText = getTransactionTypeText(transaction.type);
        
        return `
            <div class="data-item">
                <div class="data-item-header">
                    <div class="data-item-title">${formatCurrency(transaction.amount)}</div>
                    <div class="data-item-badge ${typeClass}">${typeText}</div>
                </div>
                <div class="data-item-details">
                    <div class="data-detail">
                        <div class="data-detail-label">التاريخ</div>
                        <div class="data-detail-value">${formatDate(transaction.date)}</div>
                    </div>
                    <div class="data-detail">
                        <div class="data-detail-label">الرصيد بعد العملية</div>
                        <div class="data-detail-value">${formatCurrency(transaction.balance || 0)}</div>
                    </div>
                    <div class="data-detail">
                        <div class="data-detail-label">ملاحظات</div>
                        <div class="data-detail-value">${transaction.notes || '-'}</div>
                    </div>
                </div>
            </div>
        `;
    }

    // تحديث قائمة الأرباح
    function updateProfitsList(card) {
        const profitsList = document.getElementById('profits-list');
        if (!profitsList) return;
        
        // تحديث إجمالي الأرباح المستلمة
        updateTotalProfits(card.investorId);
        
        let html = '';
        
        if (card.investorId) {
            const profits = getInvestorProfits(card.investorId);
            
            if (profits && profits.length > 0) {
                profits.forEach(profit => {
                    html += createProfitItemHTML(profit);
                });
            } else {
                html = '<div class="empty-list">لا توجد أرباح متاحة</div>';
            }
        } else {
            html = '<div class="empty-list">لا توجد أرباح متاحة</div>';
        }
        
        profitsList.innerHTML = html;
    }

    // إنشاء HTML لعنصر ربح
    function createProfitItemHTML(profit) {
        const statusClass = profit.status === 'paid' ? 'badge-success' : 'badge-warning';
        const statusText = profit.status === 'paid' ? 'مدفوع' : 'مستحق';
        
        return `
            <div class="data-item">
                <div class="data-item-header">
                    <div class="data-item-title">${formatCurrency(profit.amount)}</div>
                    <div class="data-item-badge ${statusClass}">${statusText}</div>
                </div>
                <div class="data-item-details">
                    <div class="data-detail">
                        <div class="data-detail-label">تاريخ الاستحقاق</div>
                        <div class="data-detail-value">${formatDate(profit.dueDate)}</div>
                    </div>
                    <div class="data-detail">
                        <div class="data-detail-label">تاريخ الدفع</div>
                        <div class="data-detail-value">${profit.paidDate ? formatDate(profit.paidDate) : '-'}</div>
                    </div>
                    <div class="data-detail">
                        <div class="data-detail-label">الدورة</div>
                        <div class="data-detail-value">${profit.cycle || 'شهرية'}</div>
                    </div>
                </div>
            </div>
        `;
    }

    // تحديث إجمالي الأرباح
    function updateTotalProfits(investorId) {
        const totalReceivedProfits = document.getElementById('total-received-profits');
        const profitPercentage = document.getElementById('profit-percentage');
        const progressFill = document.querySelector('.progress-fill');
        const currentProfit = document.getElementById('current-profit');
        const targetProfit = document.getElementById('target-profit');
        
        if (!investorId) return;
        
        // الحصول على سجل الأرباح
        const profits = getInvestorProfits(investorId);
        
        // حساب إجمالي الأرباح المستلمة
        const totalPaid = profits
            .filter(profit => profit.status === 'paid')
            .reduce((sum, profit) => sum + profit.amount, 0);
        
        if (totalReceivedProfits) {
            totalReceivedProfits.textContent = formatCurrency(totalPaid);
        }
        
        // الحصول على معلومات المستثمر
        const investor = findInvestorById(investorId);
        
        if (investor) {
            // حساب الربح الحالي والمستهدف
            const currentMonthProfit = calculateCurrentMonthProfit(investor);
            const monthlyTarget = calculateMonthlyProfit(investor.amount || 0);
            
            // حساب النسبة المئوية
            const percentage = monthlyTarget > 0 ? 
                               Math.min(100, Math.floor((currentMonthProfit / monthlyTarget) * 100)) : 
                               0;
            
            // تحديث شريط التقدم
            if (profitPercentage) {
                profitPercentage.textContent = `${percentage}%`;
            }
            
            if (progressFill) {
                progressFill.style.width = `${percentage}%`;
            }
            
            if (currentProfit) {
                currentProfit.textContent = formatCurrency(currentMonthProfit);
            }
            
            if (targetProfit) {
                targetProfit.textContent = formatCurrency(monthlyTarget);
            }
        }
    }

    // إنشاء رمز QR للبطاقة الحالية
    function generateQRCodeForCurrentCard() {
        if (!currentCard) return;
        
        const qrContainer = document.getElementById('card-qr-code');
        if (!qrContainer) return;
        
        // تحضير البيانات للرمز
        const cardData = {
            id: currentCard.id,
            number: currentCard.cardNumber,
            name: currentCard.investorName,
            expiry: formatExpiryDate(currentCard.expiryDate)
        };
        
        // تحويل البيانات إلى سلسلة JSON
        const dataString = JSON.stringify(cardData);
        
        // مسح المحتوى السابق
        qrContainer.innerHTML = '';
        
        // التحقق من وجود مكتبة QRCode
        if (typeof QRCode !== 'undefined') {
            // إنشاء الرمز باستخدام المكتبة
            new QRCode(qrContainer, {
                text: dataString,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            // استخدام خدمة خارجية لإنشاء الرمز
            const encodedData = encodeURIComponent(dataString);
            qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}" alt="QR Code">`;
        }
    }

    // تحضير محتوى المشاركة
    function prepareShareContent() {
        if (!currentCard) return;
        
        const shareText = document.getElementById('share-text');
        if (!shareText) return;
        
        // إنشاء نص المشاركة
        const content = `بطاقة المستثمر
الاسم: ${currentCard.investorName}
رقم البطاقة: ${maskCardNumber(currentCard.cardNumber)}
تاريخ الانتهاء: ${formatExpiryDate(currentCard.expiryDate)}
نوع البطاقة: ${getCardTypeName(currentCard.cardType)}`;
        
        // تعيين النص
        shareText.value = content;
    }

    // إخفاء جزء من رقم البطاقة
    function maskCardNumber(cardNumber) {
        if (!cardNumber) return 'XXXX XXXX XXXX XXXX';
        
        // إخفاء كل الأرقام ما عدا آخر 4
        const parts = cardNumber.split(' ');
        if (parts.length === 4) {
            return `XXXX XXXX XXXX ${parts[3]}`;
        } else {
            // للتنسيقات الأخرى
            const clean = cardNumber.replace(/\s/g, '');
            const lastFour = clean.slice(-4);
            return `XXXX XXXX XXXX ${lastFour}`;
        }
    }

    // تسجيل الخروج
    function logout() {
        // تنفيذ تسجيل الخروج من Firebase إذا كان المستخدم مسجلاً
        if (isLoggedIn) {
            firebase.auth().signOut()
                .then(() => {
                    console.log('تم تسجيل الخروج بنجاح');
                })
                .catch(error => {
                    console.error('خطأ في تسجيل الخروج:', error);
                });
        }
        
        // مسح البيانات المحلية
        currentUser = null;
        isLoggedIn = false;
        
        // مسح البطاقة الحالية
        currentCard = null;
        localStorage.removeItem(LOCAL_STORAGE_KEYS.CURRENT_CARD);
        
        // إظهار شاشة تسجيل الدخول
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) {
            loginScreen.style.display = 'flex';
            
            // مسح حقول النموذج
            const cardLoginForm = document.getElementById('card-login-form');
            const phoneLoginForm = document.getElementById('phone-login-form');
            
            if (cardLoginForm) cardLoginForm.reset();
            if (phoneLoginForm) phoneLoginForm.reset();
            
            // مسح رسائل الخطأ
            const loginError = document.getElementById('login-error');
            const phoneLoginError = document.getElementById('phone-login-error');
            
            if (loginError) {
                loginError.textContent = '';
                loginError.style.display = 'none';
            }
            
            if (phoneLoginError) {
                phoneLoginError.textContent = '';
                phoneLoginError.style.display = 'none';
            }
        }
        
        // إخفاء لوحة البطاقات
        const cardDashboard = document.getElementById('card-dashboard');
        if (cardDashboard) {
            cardDashboard.style.display = 'none';
        }
    }

    // البحث عن مستثمر بواسطة المعرف
    function findInvestorById(investorId) {
        if (!investorId) return null;
        
        // البحث في القائمة المحلية
        return investorsList.find(investor => investor.id === investorId) || null;
    }

    // الحصول على عمليات المستثمر
    function getInvestorTransactions(investorId) {
        if (!investorId) return [];
        
        // محاولة الحصول على العمليات من النافذة العامة
        if (window.transactions && Array.isArray(window.transactions)) {
            return window.transactions.filter(transaction => transaction.investorId === investorId);
        }
        
        // إنشاء عمليات افتراضية
        return generateDummyTransactions(investorId);
    }

    // الحصول على أرباح المستثمر
    function getInvestorProfits(investorId) {
        if (!investorId) return [];
        
        // محاولة الحصول على الأرباح من النافذة العامة
        if (window.profits && Array.isArray(window.profits)) {
            return window.profits.filter(profit => profit.investorId === investorId);
        }
        
        // إنشاء أرباح افتراضية
        return generateDummyProfits(investorId);
    }

    // إنشاء عمليات افتراضية
    function generateDummyTransactions(investorId) {
        const investor = findInvestorById(investorId);
        if (!investor) return [];
        
        const transactions = [];
        const amount = investor.amount || 0;
        
        // تاريخ الانضمام
        const joinDate = new Date(investor.joinDate || investor.createdAt || new Date());
        const today = new Date();
        
        // إضافة عملية الإيداع الأولي
        transactions.push({
            id: `tr-${investorId}-1`,
            investorId: investorId,
            type: 'deposit',
            amount: amount,
            balance: amount,
            date: joinDate.toISOString(),
            notes: 'الإيداع الأولي'
        });
        
        // إضافة عمليات أرباح
        let currentDate = new Date(joinDate);
        currentDate.setMonth(currentDate.getMonth() + 1);
        
        let currentBalance = amount;
        let counter = 2;
        
        // إضافة عمليات لكل شهر حتى اليوم
        while (currentDate < today) {
            // حساب الربح الشهري
            const profit = amount * 0.175 / 12;
            currentBalance += profit;
            
            transactions.push({
                id: `tr-${investorId}-${counter}`,
                investorId: investorId,
                type: 'profit',
                amount: profit,
                balance: currentBalance,
                date: currentDate.toISOString(),
                notes: 'ربح شهري'
            });
            
            // الانتقال للشهر التالي
            currentDate.setMonth(currentDate.getMonth() + 1);
            counter++;
        }
        
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // إنشاء أرباح افتراضية
    function generateDummyProfits(investorId) {
        const investor = findInvestorById(investorId);
        if (!investor) return [];
        
        const profits = [];
        const amount = investor.amount || 0;
        
        // حساب الربح الشهري
        const monthlyProfit = amount * 0.175 / 12;
        
        // تاريخ الانضمام
        const joinDate = new Date(investor.joinDate || investor.createdAt || new Date());
        const today = new Date();
        
        // إنشاء أرباح لكل شهر منذ تاريخ الانضمام
        let currentDate = new Date(joinDate);
        currentDate.setMonth(currentDate.getMonth() + 1);
        
        let counter = 1;
        
        // إضافة عمليات لكل شهر حتى اليوم
        while (currentDate <= today) {
            // حالة الربح (مدفوع أو مستحق)
            const isPaid = currentDate < today;
            
            // تاريخ الدفع (إذا كان مدفوعاً)
            let paidDate = null;
            if (isPaid) {
                paidDate = new Date(currentDate);
                paidDate.setDate(paidDate.getDate() + Math.floor(Math.random() * 3) + 1);
            }
            
            profits.push({
                id: `profit-${investorId}-${counter}`,
                investorId: investorId,
                amount: monthlyProfit,
                dueDate: currentDate.toISOString(),
                paidDate: paidDate ? paidDate.toISOString() : null,
                status: isPaid ? 'paid' : 'pending',
                cycle: 'شهرية'
            });
            
            // الانتقال للشهر التالي
            currentDate.setMonth(currentDate.getMonth() + 1);
            counter++;
        }
        
        return profits.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
    }

    // حساب الربح الشهري
    function calculateMonthlyProfit(amount) {
        // نسبة الربح السنوية 17.5%
        const annualRate = 0.175;
        
        // الربح الشهري
        return amount * annualRate / 12;
    }

    // حساب الربح الحالي للشهر
    function calculateCurrentMonthProfit(investor) {
        const amount = investor.amount || 0;
        
        // نسبة الربح السنوية 17.5%
        const annualRate = 0.175;
        
        // الربح اليومي
        const dailyRate = annualRate / 365;
        
        // الحصول على اليوم الحالي من الشهر
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const currentDay = today.getDate();
        
        // النسبة المئوية من الشهر
        const monthPercentage = currentDay / daysInMonth;
        
        // الربح الحالي
        return amount * annualRate / 12 * monthPercentage;
    }

    // حساب عدد أيام الاستثمار
    function calculateInvestmentDays(startDate) {
        if (!startDate) return 0;
        
        // تحويل إلى كائن تاريخ
        const start = new Date(startDate);
        const today = new Date();
        
        // حساب الفرق بالأيام
        const diffTime = today - start;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }

    // حساب تاريخ الربح التالي
    function calculateNextProfitDate(startDate) {
        if (!startDate) return null;
        
        // تحويل إلى كائن تاريخ
        const start = new Date(startDate);
        const today = new Date();
        
        // يوم الاستحقاق هو نفس يوم البداية في كل شهر
        const profitDay = start.getDate();
        
        // إنشاء تاريخ الاستحقاق التالي
        let nextDate = new Date(today.getFullYear(), today.getMonth(), profitDay);
        
        // إذا كان اليوم الحالي بعد يوم الاستحقاق، ننتقل للشهر التالي
        if (today.getDate() >= profitDay) {
            nextDate.setMonth(nextDate.getMonth() + 1);
        }
        
        return nextDate;
    }

    // تنسيق التاريخ
    function formatDate(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            
            if (isNaN(date.getTime())) return '-';
            
            // تنسيق التاريخ بالصيغة المحلية (DD/MM/YYYY)
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            
            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error('خطأ في تنسيق التاريخ:', error);
            return '-';
        }
    }

    // تنسيق العملة
    function formatCurrency(amount) {
        // التأكد من أن المبلغ رقم
        amount = parseFloat(amount) || 0;
        
        try {
            // استخدام مكتبة تنسيق الأرقام المحلية
            return new Intl.NumberFormat('ar-IQ', {
                style: 'currency',
                currency: 'IQD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        } catch (error) {
            // تنسيق بسيط في حالة الخطأ
            return `${amount.toLocaleString('ar-IQ')} دينار`;
        }
    }

    // الحصول على اسم نوع البطاقة
    function getCardTypeName(cardType) {
        const cardTypeNames = {
            platinum: 'بلاتينية',
            gold: 'ذهبية',
            premium: 'بريميوم',
            diamond: 'ماسية',
            islamic: 'إسلامية',
            custom: 'مخصصة'
        };
        
        return cardTypeNames[cardType] || 'بلاتينية';
    }

    // الحصول على فئة نوع العملية
    function getTransactionTypeClass(type) {
        const typeClasses = {
            deposit: 'badge-success',
            withdraw: 'badge-danger',
            profit: 'badge-primary',
            transfer: 'badge-warning'
        };
        
        return typeClasses[type] || 'badge-secondary';
    }

    // الحصول على نص نوع العملية
    function getTransactionTypeText(type) {
        const typeTexts = {
            deposit: 'إيداع',
            withdraw: 'سحب',
            profit: 'ربح',
            transfer: 'تحويل'
        };
        
        return typeTexts[type] || type;
    }

    // تصدير الواجهة العامة للنظام
    return {
        initialize,
        loginWithCard,
        loginWithPhone,
        logout,
        displayCardDetails,
        getCurrentCard: () => currentCard,
        getAllCards: () => userInvestorCards,
        isLoggedIn: () => isLoggedIn,
        getInvestorById: findInvestorById,
        formatCurrency,
        formatDate,
        getCardTypeName
    };
})();

// تلقائي: تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة نظام بطاقات المستثمرين
    InvestorCardSystem.initialize()
        .then(success => {
            console.log('تم تهيئة نظام بطاقات المستثمرين بنجاح');
        })
        .catch(error => {
            console.error('حدث خطأ أثناء تهيئة نظام بطاقات المستثمرين:', error);
        });
});


// En el sistema principal (InvestmentSystem)
function shareDataWithCardSystem() {
    // Compartir inversionistas
    window.investors = this.getAllInvestors();
    
    // Compartir transacciones
    window.transactions = this.getAllTransactions();
    
    // Compartir configuración
    window.systemConfig = this.getConfig();
    
    // Notificar que los datos están disponibles
    document.dispatchEvent(new CustomEvent('main-system:data-shared'));
  }
  
  // Llamar a esta función cuando se actualicen los datos

  // En investor-card-integration.js
document.addEventListener('main-system:data-shared', function() {
    console.log('Datos del sistema principal compartidos, actualizando...');
    
    if (window.InvestorCardSync) {
      window.InvestorCardSync.performFullSync()
        .then(() => {
          console.log('Sincronización completada después de actualización de datos');
        });
    }
  });


  // Agregar al módulo InvestorCardUI
function initializeCharts() {
    // Verificar si Chart.js está disponible
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js no está disponible, los gráficos no se mostrarán');
      return;
    }
    
    // Crear contenedores para los gráficos
    const profitsTab = document.getElementById('profits-tab');
    if (profitsTab) {
      const chartContainer = document.createElement('div');
      chartContainer.className = 'chart-container';
      chartContainer.innerHTML = '<canvas id="profits-chart"></canvas>';
      profitsTab.insertBefore(chartContainer, profitsTab.firstChild);
    }
    
    // Inicializar gráfico de ganancias
    createProfitsChart();
    
    // Inicializar gráfico de transacciones
    createTransactionsChart();
  }
  
  // Crear gráfico de ganancias
  function createProfitsChart() {
    const canvas = document.getElementById('profits-chart');
    if (!canvas) return;
    
    // Procesar datos de ganancias
    const labels = [];
    const data = [];
    
    profitsData.slice(0, 6).reverse().forEach(profit => {
      const date = new Date(profit.dueDate);
      labels.push(`${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`);
      data.push(profit.amount);
    });
    
    // Crear gráfico
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'الأرباح الشهرية',
          data: data,
          backgroundColor: 'rgba(52, 152, 219, 0.5)',
          borderColor: 'rgba(52, 152, 219, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }