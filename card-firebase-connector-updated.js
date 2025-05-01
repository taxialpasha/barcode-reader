/**
 * card-firebase-connector-updated.js
 * 
 * نظام ربط بطاقات المستثمرين مع Firebase
 * تم تحديثه لحل مشاكل التوثيق ودعم الاستخدام بدون حساب
 * تم إصلاح الأخطاء وتحسين الأداء
 * تحسين البحث عبر مسارات متعددة
 * 
 * @version 3.0.0
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
        LAST_SYNC: 'last_sync_time',
        INVESTORS: 'investors_data',
        TRANSACTIONS: 'transactions_data',
        PROFITS: 'profits_data'
    };
    
    // معلومات أنواع البطاقات
    const CARD_TYPES = {
        platinum: {
            name: 'بلاتينية',
            color: '#303030',
            textColor: '#ffffff',
            logoColor: '#ffffff',
            chipColor: '#FFD700',
            benefits: ['تأمين سفر شامل', 'خدمة عملاء VIP على مدار الساعة', 'نقاط مضاعفة على المشتريات', 'دخول مجاني لصالات VIP بالمطارات']
        },
        gold: {
            name: 'ذهبية',
            color: '#D4AF37',
            textColor: '#000000',
            logoColor: '#ffffff',
            chipColor: '#ffffff',
            benefits: ['نقاط مكافآت على المشتريات', 'خصومات خاصة لدى الشركاء', 'تأمين مشتريات لمدة عام', 'خدمة العملاء المميزة']
        },
        premium: {
            name: 'بريميوم',
            color: '#1F3A5F',
            textColor: '#ffffff',
            logoColor: '#ffffff',
            chipColor: '#C0C0C0',
            benefits: ['مكافآت مشتريات مميزة', 'خدمة عملاء على مدار الساعة', 'تحويلات مجانية', 'خصومات لدى الشركاء المعتمدين']
        },
        diamond: {
            name: 'ماسية',
            color: '#16213E',
            textColor: '#ffffff',
            logoColor: '#ffffff',
            chipColor: '#B9F2FF',
            benefits: ['امتيازات حصرية', 'خدمة شخصية على مدار الساعة', 'رصيد سفر سنوي', 'تأمين شامل للعائلة']
        },
        islamic: {
            name: 'إسلامية',
            color: '#006B3C',
            textColor: '#ffffff',
            logoColor: '#ffffff',
            chipColor: '#F8C300',
            benefits: ['متوافقة مع الشريعة الإسلامية', 'خدمات عائلية', 'استشارات استثمارية متخصصة', 'أولوية في تحويل الأرباح']
        },
        custom: {
            name: 'مخصصة',
            color: '#3498db',
            textColor: '#ffffff',
            logoColor: '#ffffff',
            chipColor: '#C0C0C0',
            benefits: ['قابلة للتخصيص حسب احتياجاتك', 'مزايا مخصصة', 'خدمة مخصصة']
        }
    };

    // معرفات المستخدمين المعروفة - يتم البحث في جميعها
    // تم تعديلها لتشمل قائمة معرفات المستخدمين التي سيتم البحث فيها
    const KNOWN_USER_IDS = [
        'XgaPOacU8WfTZ4KeBPOcquLaK4j2',
        'b7XlRaRqUEX2X6SdnF9fyV5SPi83',
        '9VxpBQmjkBTw3NcKxKQNuFXrE4y1',
        'JzGdF8Kt7QsZ2cxpWYLuV5ArN6m4',
        'P3qHnRtM5bXj8VwEgFkYd2ZsL7a9'
    ];

    // تهيئة النظام
    function initialize() {
        console.log('تهيئة نظام بطاقات المستثمرين...');
        
        // إعادة تعيين حالة التحميل عند بدء التشغيل
        isLoading = false;
        
        if (initialized) {
            console.log('نظام البطاقات مهيأ بالفعل');
            return Promise.resolve(true);
        }
        
        // تهيئة Firebase إذا لم تكن مهيأة بالفعل
        if (!initializeFirebase()) {
            return Promise.reject(new Error('فشل في تهيئة Firebase'));
        }
        
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
                investorsList = getInvestorsFromLocalStorage();
                console.log(`تم تحميل ${userInvestorCards.length} بطاقة و ${investorsList.length} مستثمر من التخزين المحلي`);
                
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
                    
                    // استخدام معرف المستخدم الافتراضي للقراءة فقط - سنبحث في كل المسارات المعروفة
                    userUID = null;
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
        
        // محاولة استرداد المستثمرين
        try {
            const investorsData = localStorage.getItem(LOCAL_STORAGE_KEYS.INVESTORS);
            if (investorsData) {
                investorsList = JSON.parse(investorsData);
            }
        } catch (error) {
            console.error('خطأ في تحميل بيانات المستثمرين من التخزين المحلي:', error);
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

    // حفظ المستثمرين في التخزين المحلي
    function saveInvestorsToLocalStorage() {
        if (investorsList && investorsList.length > 0) {
            try {
                localStorage.setItem(LOCAL_STORAGE_KEYS.INVESTORS, JSON.stringify(investorsList));
            } catch (error) {
                console.error('خطأ في حفظ بيانات المستثمرين في التخزين المحلي:', error);
            }
        }
    }

    // تحميل البطاقات من Firebase
    function loadCardsData() {
        if (isLoading) {
            console.log('جاري تحميل البيانات بالفعل، يرجى الانتظار...');
            return Promise.resolve(userInvestorCards);
        }

        isLoading = true;
        console.log('جاري تحميل بطاقات المستثمرين...');

        // نبدأ بالبطاقات المخزنة محليًا
        userInvestorCards = getCardsFromLocalStorage();

        // استخدام معرف المستخدم المسجل أو البحث في كل المسارات المعروفة
        const userIdsToSearch = userUID ? [userUID, ...KNOWN_USER_IDS] : KNOWN_USER_IDS;
        
        // مصفوفة للوعود
        const promises = userIdsToSearch.map(uid => {
            const cardsPath = `users/${uid}/investor_cards`;
            console.log(`البحث في المسار: ${cardsPath}`);
            
            return databaseRef.ref(cardsPath).once('value')
                .then(snapshot => {
                    const cardsData = snapshot.val();
                    if (cardsData) {
                        console.log(`تم العثور على بطاقات في المسار: ${cardsPath}`);
                        // إضافة البطاقات إلى المصفوفة
                        const newCards = Object.values(cardsData);
                        
                        // دمج البطاقات مع تجنب التكرار
                        newCards.forEach(card => {
                            if (!userInvestorCards.some(existingCard => existingCard.id === card.id)) {
                                userInvestorCards.push(card);
                            }
                        });
                    }
                    return null;
                })
                .catch(error => {
                    console.error(`خطأ في تحميل البطاقات من المسار ${cardsPath}:`, error);
                    return null;
                });
        });

        // البحث في مسار المستخدمين للحصول على جميع البطاقات (تحديث جديد)
        const usersPath = 'users';
        promises.push(
            databaseRef.ref(usersPath).once('value')
                .then(snapshot => {
                    const usersData = snapshot.val();
                    if (usersData) {
                        console.log('تم العثور على بيانات المستخدمين، جاري البحث عن البطاقات...');
                        
                        // البحث عن البطاقات في كل مستخدم
                        Object.keys(usersData).forEach(uid => {
                            if (usersData[uid] && usersData[uid].investor_cards) {
                                const userCards = Object.values(usersData[uid].investor_cards);
                                
                                // دمج البطاقات مع تجنب التكرار
                                userCards.forEach(card => {
                                    if (!userInvestorCards.some(existingCard => existingCard.id === card.id)) {
                                        userInvestorCards.push(card);
                                    }
                                });
                            }
                        });
                    }
                    return null;
                })
                .catch(error => {
                    console.error('خطأ في البحث في مسار المستخدمين:', error);
                    return null;
                })
        );

        return Promise.all(promises)
            .then(() => {
                console.log(`تم تحميل ${userInvestorCards.length} بطاقة إجمالاً`);
                
                // تحديث التخزين المحلي
                saveCardsToLocalStorage(userInvestorCards);
                
                // تحديث وقت آخر تزامن
                localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
                
                return loadInvestorsData();
            })
            .then(() => {
                isLoading = false;
                return userInvestorCards;
            })
            .catch(error => {
                console.error('خطأ في تحميل البطاقات:', error);
                isLoading = false;
                return userInvestorCards;
            });
    }

    // تحميل بيانات المستثمرين
    function loadInvestorsData() {
        console.log('جاري تحميل بيانات المستثمرين...');

        // مصفوفة للوعود
        const promises = [];
        
        // البحث في معرفات المستخدمين المعروفة
        KNOWN_USER_IDS.forEach(uid => {
            const investorsPath = `users/${uid}/investors/data`;
            
            promises.push(
                databaseRef.ref(investorsPath).once('value')
                    .then(snapshot => {
                        const investorsData = snapshot.val();
                        
                        if (investorsData) {
                            console.log(`تم العثور على مستثمرين في المسار: ${investorsPath}`);
                            // إضافة المستثمرين إلى المصفوفة
                            const newInvestors = Object.values(investorsData);
                            
                            // دمج المستثمرين مع تجنب التكرار
                            newInvestors.forEach(investor => {
                                if (!investorsList.some(existingInvestor => existingInvestor.id === investor.id)) {
                                    investorsList.push(investor);
                                }
                            });
                        }
                        return null;
                    })
                    .catch(error => {
                        console.error(`خطأ في تحميل المستثمرين من المسار ${investorsPath}:`, error);
                        return null;
                    })
            );
        });

        // البحث في مسار المستخدمين للحصول على جميع المستثمرين (تحديث جديد)
        const usersPath = 'users';
        promises.push(
            databaseRef.ref(usersPath).once('value')
                .then(snapshot => {
                    const usersData = snapshot.val();
                    if (usersData) {
                        console.log('تم العثور على بيانات المستخدمين، جاري البحث عن المستثمرين...');
                        
                        // البحث عن المستثمرين في كل مستخدم
                        Object.keys(usersData).forEach(uid => {
                            if (usersData[uid] && usersData[uid].investors && usersData[uid].investors.data) {
                                const userInvestors = Object.values(usersData[uid].investors.data);
                                
                                // دمج المستثمرين مع تجنب التكرار
                                userInvestors.forEach(investor => {
                                    if (!investorsList.some(existingInvestor => existingInvestor.id === investor.id)) {
                                        investorsList.push(investor);
                                    }
                                });
                            }
                        });
                    }
                    return null;
                })
                .catch(error => {
                    console.error('خطأ في البحث في مسار المستخدمين:', error);
                    return null;
                })
        );

        return Promise.all(promises)
            .then(() => {
                console.log(`تم تحميل ${investorsList.length} مستثمر إجمالاً`);
                
                // محاولة استرداد المستثمرين من النافذة العامة إذا لم نجد أي مستثمرين
                if (investorsList.length === 0 && window.investors && Array.isArray(window.investors)) {
                    investorsList = window.investors;
                    console.log(`تم تحميل ${investorsList.length} مستثمر من النافذة العامة`);
                }
                
                // حفظ المستثمرين في التخزين المحلي
                saveInvestorsToLocalStorage();
                
                // ربط بيانات المستثمرين بالبطاقات
                linkInvestorsToCards();
                
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

    // جلب المستثمرين من التخزين المحلي
    function getInvestorsFromLocalStorage() {
        try {
            const investorsData = localStorage.getItem(LOCAL_STORAGE_KEYS.INVESTORS);
            
            if (investorsData) {
                return JSON.parse(investorsData);
            }
            
            return [];
        } catch (error) {
            console.error('خطأ في قراءة المستثمرين من التخزين المحلي:', error);
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
            try {
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
                    const cardNum = card.cardNumber?.replace(/\s+/g, '') || '';
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
                searchCardsInAllPaths(cardNumber, formattedExpiry, cvv)
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
            } catch (error) {
                console.error('خطأ غير متوقع في loginWithCard:', error);
                isLoading = false;
                reject(new Error('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'));
            }
        });
    }

    // البحث عن البطاقة في جميع المسارات المعروفة
    function searchCardsInAllPaths(cardNumber, expiryDate, cvv) {
        console.log(`البحث عن البطاقة رقم: ${cardNumber} | تاريخ الانتهاء: ${expiryDate}`);
        
        // مصفوفة للوعود
        const promises = [];
        
 // البحث في معرفات المستخدمين المعروفة
        KNOWN_USER_IDS.forEach(uid => {
            promises.push(loadCardsFromFirebasePath(uid, cardNumber, expiryDate, cvv));
        });
        
        // البحث في مسار المستخدمين للحصول على جميع البطاقات (تحديث جديد)
        promises.push(
            databaseRef.ref('users').once('value')
                .then(snapshot => {
                    const usersData = snapshot.val();
                    if (!usersData) {
                        console.log('لا توجد بيانات مستخدمين متاحة');
                        return null;
                    }
                    
                    // البحث في كل مستخدم
                    for (const uid in usersData) {
                        if (usersData[uid] && usersData[uid].investor_cards) {
                            const cardsData = usersData[uid].investor_cards;
                            
                            // البحث عن البطاقة المطابقة
                            for (const cardId in cardsData) {
                                const card = cardsData[cardId];
                                const cardNum = card.cardNumber?.replace(/\s+/g, '') || '';
                                const expiry = formatExpiryDate(card.expiryDate);
                                
                                if (cardNum === cardNumber && expiry === expiryDate) {
                                    // التحقق من رمز CVV إذا كان موجوداً
                                    if (cvv && card.cvv && cvv !== card.cvv) {
                                        console.log('رمز CVV غير متطابق');
                                        continue;
                                    }
                                    
                                    console.log(`تم العثور على البطاقة في مسار المستخدم: ${uid}`);
                                    return card;
                                }
                            }
                        }
                    }
                    
                    return null;
                })
                .catch(error => {
                    console.error('خطأ في البحث في مسار المستخدمين:', error);
                    return null;
                })
        );
        
        return Promise.all(promises)
            .then(results => {
                // البحث عن أول بطاقة تم العثور عليها
                for (const card of results) {
                    if (card) {
                        return card;
                    }
                }
                return null;
            });
    }

    // البحث عن البطاقة في مسار محدد
    function loadCardsFromFirebasePath(uid, cardNumber, expiryDate, cvv) {
        const cardsPath = `users/${uid}/investor_cards`;
        console.log(`البحث في المسار: ${cardsPath}`);

        return databaseRef.ref(cardsPath).once('value')
            .then(snapshot => {
                const cardsData = snapshot.val();
                
                if (!cardsData) {
                    console.log(`لا توجد بطاقات في المسار: ${cardsPath}`);
                    return null;
                }
                
                console.log(`تم العثور على بيانات في المسار: ${cardsPath}`);
                
                // البحث عن البطاقة المطابقة
                for (const cardId in cardsData) {
                    const card = cardsData[cardId];
                    const cardNum = card.cardNumber?.replace(/\s+/g, '') || '';
                    const expiry = formatExpiryDate(card.expiryDate);
                    
                    console.log(`مقارنة: ${cardNum} مع ${cardNumber} | ${expiry} مع ${expiryDate}`);
                    
                    if (cardNum === cardNumber && expiry === expiryDate) {
                        // التحقق من رمز CVV إذا كان موجوداً
                        if (cvv && card.cvv && cvv !== card.cvv) {
                            console.log('رمز CVV غير متطابق');
                            continue;
                        }
                        
                        console.log(`تم العثور على البطاقة في المسار: ${cardsPath}`);
                        return card;
                    }
                }
                
                console.log(`لم يتم العثور على بطاقة مطابقة في المسار: ${cardsPath}`);
                return null;
            })
            .catch(error => {
                console.error(`خطأ في البحث عن البطاقة في المسار ${cardsPath}:`, error);
                return null;
            });
    }

    // تسجيل الدخول برقم الهاتف واسم المستثمر
    function loginWithPhone(phoneNumber, investorName) {
        return new Promise((resolve, reject) => {
            try {
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
            } catch (error) {
                console.error('خطأ غير متوقع في loginWithPhone:', error);
                isLoading = false;
                reject(new Error('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'));
            }
        });
    }

    // البحث عن مستثمر بواسطة رقم الهاتف والاسم
    function findInvestorByPhoneAndName(phone, name) {
        console.log(`البحث عن مستثمر برقم الهاتف: ${phone} | والاسم: ${name}`);
        
        return new Promise((resolve) => {
            // البحث في القائمة المحلية أولاً
            const localInvestor = investorsList.find(inv => 
                inv.phone === phone && 
                inv.name.toLowerCase().includes(name.toLowerCase())
            );
            
            if (localInvestor) {
                console.log('تم العثور على المستثمر في القائمة المحلية');
                return resolve(localInvestor);
            }
            
            // مصفوفة للوعود
            const promises = [];
            
            // البحث في معرفات المستخدمين المعروفة
            KNOWN_USER_IDS.forEach(uid => {
                const investorsPath = `users/${uid}/investors/data`;
                
                promises.push(
                    databaseRef.ref(investorsPath).once('value')
                        .then(snapshot => {
                            const investorsData = snapshot.val();
                            
                            if (!investorsData) {
                                return null;
                            }
                            
                            // البحث عن المستثمر المطابق
                            for (const investorId in investorsData) {
                                const investor = investorsData[investorId];
                                
                                if (investor.phone === phone && 
                                    investor.name.toLowerCase().includes(name.toLowerCase())) {
                                    console.log(`تم العثور على المستثمر في المسار: ${investorsPath}`);
                                    return investor;
                                }
                            }
                            
                            return null;
                        })
                        .catch(error => {
                            console.error(`خطأ في البحث عن المستثمر في المسار ${investorsPath}:`, error);
                            return null;
                        })
                );
            });
            
            // البحث في مسار المستخدمين للحصول على جميع المستثمرين (تحديث جديد)
            promises.push(
                databaseRef.ref('users').once('value')
                    .then(snapshot => {
                        const usersData = snapshot.val();
                        if (!usersData) {
                            return null;
                        }
                        
                        // البحث في كل مستخدم
                        for (const uid in usersData) {
                            if (usersData[uid] && usersData[uid].investors && usersData[uid].investors.data) {
                                const investorsData = usersData[uid].investors.data;
                                
                                // البحث عن المستثمر المطابق
                                for (const investorId in investorsData) {
                                    const investor = investorsData[investorId];
                                    
                                    if (investor.phone === phone && 
                                        investor.name.toLowerCase().includes(name.toLowerCase())) {
                                        console.log(`تم العثور على المستثمر في مسار المستخدم: ${uid}`);
                                        return investor;
                                    }
                                }
                            }
                        }
                        
                        return null;
                    })
                    .catch(error => {
                        console.error('خطأ في البحث في مسار المستخدمين:', error);
                        return null;
                    })
            );
            
            Promise.all(promises)
                .then(results => {
                    // البحث عن أول مستثمر تم العثور عليه
                    for (const investor of results) {
                        if (investor) {
                            return resolve(investor);
                        }
                    }
                    
                    console.log('لم يتم العثور على مستثمر مطابق');
                    resolve(null);
                })
                .catch(error => {
                    console.error('خطأ في البحث عن المستثمر:', error);
                    resolve(null);
                });
        });
    }

    // البحث عن بطاقة بواسطة معرف المستثمر
    function findCardByInvestorId(investorId) {
        console.log(`البحث عن بطاقة للمستثمر: ${investorId}`);
        
        return new Promise((resolve) => {
            // البحث في القائمة المحلية أولاً
            const localCard = userInvestorCards.find(card => card.investorId === investorId);
            
            if (localCard) {
                console.log('تم العثور على البطاقة في القائمة المحلية');
                return resolve(localCard);
            }
            
            // مصفوفة للوعود
            const promises = [];
            
            // البحث في معرفات المستخدمين المعروفة
            KNOWN_USER_IDS.forEach(uid => {
                const cardsPath = `users/${uid}/investor_cards`;
                
                promises.push(
                    databaseRef.ref(cardsPath).once('value')
                        .then(snapshot => {
                            const cardsData = snapshot.val();
                            
                            if (!cardsData) {
                                return null;
                            }
                            
                            // البحث عن البطاقة المطابقة
                            for (const cardId in cardsData) {
                                const card = cardsData[cardId];
                                
                                if (card.investorId === investorId) {
                                    console.log(`تم العثور على البطاقة في المسار: ${cardsPath}`);
                                    return card;
                                }
                            }
                            
                            return null;
                        })
                        .catch(error => {
                            console.error(`خطأ في البحث عن البطاقة في المسار ${cardsPath}:`, error);
                            return null;
                        })
                );
            });
            
            // البحث في مسار المستخدمين للحصول على جميع البطاقات (تحديث جديد)
            promises.push(
                databaseRef.ref('users').once('value')
                    .then(snapshot => {
                        const usersData = snapshot.val();
                        if (!usersData) {
                            return null;
                        }
                        
                        // البحث في كل مستخدم
                        for (const uid in usersData) {
                            if (usersData[uid] && usersData[uid].investor_cards) {
                                const cardsData = usersData[uid].investor_cards;
                                
                                // البحث عن البطاقة المطابقة
                                for (const cardId in cardsData) {
                                    const card = cardsData[cardId];
                                    
                                    if (card.investorId === investorId) {
                                        console.log(`تم العثور على البطاقة في مسار المستخدم: ${uid}`);
                                        return card;
                                    }
                                }
                            }
                        }
                        
                        return null;
                    })
                    .catch(error => {
                        console.error('خطأ في البحث في مسار المستخدمين:', error);
                        return null;
                    })
            );
            
            Promise.all(promises)
                .then(results => {
                    // البحث عن أول بطاقة تم العثور عليها
                    for (const card of results) {
                        if (card) {
                            return resolve(card);
                        }
                    }
                    
                    console.log('لم يتم العثور على بطاقة مطابقة');
                    resolve(null);
                })
                .catch(error => {
                    console.error('خطأ في البحث عن البطاقة:', error);
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
            /* أنماط النظام - تم تحديثها للإصدار الجديد */
            /* تم نقل أنماط البطاقات إلى ملف styles.css الرئيسي */
        `;
        
        // إضافة العنصر إلى head
        document.head.appendChild(styleElement);
        
        console.log('تم إضافة أنماط CSS للبطاقات');
    }

    // إنشاء مستمعات الأحداث
    function setupEventListeners() {
        console.log('إعداد مستمعات الأحداث لنظام البطاقات...');

        // إنشاء زر إعادة ضبط حالة النظام
        const resetButton = document.createElement('button');
        resetButton.id = 'reset-system-state-btn';
        resetButton.style.display = 'none';
        resetButton.addEventListener('click', () => {
            isLoading = false;
            console.log('تم إعادة تعيين حالة التحميل');
        });
        
        // إضافة الزر إلى الصفحة بشكل مخفي
        document.body.appendChild(resetButton);

        console.log('تم إعداد مستمعات الأحداث بنجاح');
    }

    // تحديث واجهة المستخدم للمستخدم المسجل
    function updateUIForLoggedInUser(user) {
        // سيتم تنفيذه من قبل ملف app.js
        console.log('تم تحديث واجهة المستخدم للمستخدم المسجل');
    }

    // تحديث واجهة المستخدم للمستخدم غير المسجل
    function updateUIForLoggedOutUser() {
        // إذا كان لدينا بطاقة حالية من التخزين المحلي، سنعرضها مباشرة
        if (currentCard) {
            console.log('تم العثور على بطاقة محفوظة، سيتم عرضها');
            // سيتم تنفيذه من قبل ملف app.js
        } else {
            console.log('لم يتم العثور على بطاقة محفوظة، سيتم عرض شاشة تسجيل الدخول');
            // سيتم تنفيذه من قبل ملف app.js
        }
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
        
        // ستتم معالجة عرض البطاقة في ملف app.js
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
        
        // سيتم تنفيذ تحديث واجهة المستخدم في ملف app.js
    }

    // البحث عن مستثمر بواسطة المعرف
    function findInvestorById(investorId) {
        if (!investorId) return null;
        
        // البحث في القائمة المحلية
        return investorsList.find(investor => investor.id === investorId) || null;
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
        const cardTypeInfo = CARD_TYPES[cardType];
        return cardTypeInfo ? cardTypeInfo.name : 'بلاتينية';
    }

    // الحصول على مزايا البطاقة
    function getCardBenefits(cardType) {
        const cardTypeInfo = CARD_TYPES[cardType];
        return cardTypeInfo ? cardTypeInfo.benefits : CARD_TYPES.platinum.benefits;
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
        getCardTypeName,
        getCardBenefits,
        CARD_TYPES
    };
})();

// تلقائي: تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // سيتم استدعاء تهيئة النظام من خلال ملف app.js
    console.log('تم تحميل وحدة ربط البطاقات مع Firebase');
});

// إضافة دالة إعادة تعيين حالة النظام إلى النافذة العامة
window.resetInvestorCardSystemState = function() {
    if (window.InvestorCardSystem) {
        // إعادة تعيين حالة التحميل
        window.InvestorCardSystem.isLoading = false;
        console.log('تمت إعادة تعيين حالة التحميل');
        
        return true;
    }
    
    return false;
};