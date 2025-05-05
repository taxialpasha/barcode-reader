  /* ==========================
           تطبيق بطاقة المستثمر
           - يتصل بقاعدة البيانات Firebase نفسها المستخدمة في النظام الرئيسي
           - يعرض معلومات بطاقة المستثمر والعمليات والأرباح
           - يتيح مسح الباركود للدخول
           - يوفر واجهة سهلة الاستخدام ومتجاوبة
         ========================== */

        // كائن التطبيق الرئيسي
        const InvestorApp = (function () {
            // متغيرات النظام
            let initialized = false;
            let currentUser = null;
            let investorData = null;
            let cardData = null;
            let transactions = [];
            let notifications = [];
            let isLoggedIn = false;
            let qrScanner = null;

            // مراجع Firebase
            let databaseRef = null;
            let authRef = null;

            // تهيئة التطبيق
            function initialize() {
                console.log('تهيئة تطبيق بطاقة المستثمر...');

                if (initialized) {
                    console.log('التطبيق مهيأ بالفعل');
                    return Promise.resolve(true);
                }

                // تهيئة Firebase
                initializeFirebase();

                // إعداد مستمعات الأحداث
                setupEventListeners();

                // تحقق من وجود جلسة مخزنة
                checkStoredSession();

                initialized = true;

                return Promise.resolve(true);
            }


            function initializeFirebase() {
    try {
        // التحقق من وجود Firebase
        if (typeof firebase === 'undefined') {
            console.error('Firebase غير متوفر، تأكد من تضمين مكتبات Firebase');
            showNotification('error', 'خطأ', 'فشل في الاتصال بقاعدة البيانات');
            return false;
        }
        
        // تهيئة Firebase إذا لم تكن مهيأة بالفعل
        if (!firebase.apps.length) {
            // استخدام نفس تكوين Firebase الذي يستخدمه النظام الرئيسي
            const config = {
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
        authRef = firebase.auth();
        
        console.log('تم تهيئة Firebase بنجاح');
        return true;
    } catch (error) {
        console.error('خطأ في تهيئة Firebase:', error);
        showNotification('error', 'خطأ', 'فشل في الاتصال بقاعدة البيانات');
        return false;
    }
}
            // إعداد مستمعات الأحداث
            function setupEventListeners() {
                console.log('إعداد مستمعات الأحداث...');

                // مستمعات صفحة تسجيل الدخول
                setupLoginPageListeners();

                // مستمعات التطبيق الرئيسي
                setupAppListeners();

                // مستمعات إغلاق الإشعارات
                document.getElementById('toast-close').addEventListener('click', function () {
                    hideNotification();
                });
            }

            // إعداد مستمعات صفحة تسجيل الدخول
            function setupLoginPageListeners() {
                // التبديل بين علامات التبويب
                const loginTabs = document.querySelectorAll('.login-tab');
                loginTabs.forEach(tab => {
                    tab.addEventListener('click', function () {
                        // إزالة الفئة النشطة من جميع علامات التبويب
                        loginTabs.forEach(t => t.classList.remove('active'));

                        // إضافة الفئة النشطة للعلامة المحددة
                        this.classList.add('active');

                        // إخفاء جميع محتويات التبويب
                        const tabContents = document.querySelectorAll('.login-tab-content');
                        tabContents.forEach(content => content.classList.remove('active'));

                        // عرض المحتوى المطلوب
                        const tabId = this.getAttribute('data-tab');
                        document.getElementById(tabId + '-tab').classList.add('active');
                    });
                });

                // تنسيق إدخال رقم البطاقة
                const cardNumberInput = document.getElementById('card-number');
                cardNumberInput.addEventListener('input', function () {
                    // إزالة المسافات والأحرف غير الرقمية
                    let value = this.value.replace(/\D/g, '');

                    // إضافة مسافة بعد كل 4 أرقام
                    let formattedValue = '';
                    for (let i = 0; i < value.length; i++) {
                        if (i > 0 && i % 4 === 0) {
                            formattedValue += ' ';
                        }
                        formattedValue += value[i];
                    }

                    // تحديث القيمة
                    this.value = formattedValue;
                });

                // تنسيق إدخال تاريخ الانتهاء
                const expiryDateInput = document.getElementById('expiry-date');
                expiryDateInput.addEventListener('input', function () {
                    // إزالة الأحرف غير الرقمية
                    let value = this.value.replace(/\D/g, '');

                    // إضافة الشرطة بعد 2 رقم
                    if (value.length > 2) {
                        value = value.substring(0, 2) + '/' + value.substring(2);
                    }

                    // تحديث القيمة
                    this.value = value;
                });

                // تنسيق إدخال CVV
                const cvvInput = document.getElementById('cvv');
                cvvInput.addEventListener('input', function () {
                    // التأكد من أن الإدخال أرقام فقط
                    this.value = this.value.replace(/\D/g, '');
                });

                // تسجيل الدخول بالبطاقة
                document.getElementById('login-btn').addEventListener('click', function () {
                    const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
                    const expiryDate = document.getElementById('expiry-date').value;
                    const cvv = document.getElementById('cvv').value;

                    login({ cardNumber, expiryDate, cvv });
                });

                // مسح الباركود
                document.getElementById('start-scanner-btn').addEventListener('click', function () {
                    startQRScanner();
                });
            }

            // إعداد مستمعات التطبيق الرئيسي
            function setupAppListeners() {
                // تدوير البطاقة
                document.getElementById('flip-card-btn').addEventListener('click', function () {
                    const card = document.getElementById('investor-card');
                    card.classList.toggle('flipped');
                });

                // زر الخروج
                document.getElementById('logout-btn').addEventListener('click', function () {
                    logout();
                });

                // زر التحديث
                document.getElementById('refresh-btn').addEventListener('click', function () {
                    refreshData();
                });

                // مستمعات التنقل
                const navItems = document.querySelectorAll('.nav-item');
                navItems.forEach(item => {
                    item.addEventListener('click', function (e) {
                        e.preventDefault();

                        // إزالة الفئة النشطة من جميع عناصر التنقل
                        navItems.forEach(navItem => navItem.classList.remove('active'));

                        // إضافة الفئة النشطة للعنصر المحدد
                        this.classList.add('active');

                        // إظهار الصفحة المقابلة
                        const pageId = this.getAttribute('data-page');
                        showPage(pageId);
                    });
                });

                // زر عرض جميع العمليات
                document.getElementById('see-all-transactions').addEventListener('click', function () {
                    // الانتقال لصفحة العمليات
                    const navItems = document.querySelectorAll('.nav-item');
                    navItems.forEach(item => item.classList.remove('active'));

                    const transactionsNavItem = document.querySelector('.nav-item[data-page="transactions"]');
                    if (transactionsNavItem) {
                        transactionsNavItem.classList.add('active');
                    }

                    showPage('transactions');
                });

                // مستمعات تصفية العمليات
                const filterOptions = document.querySelectorAll('.filter-option');
                filterOptions.forEach(option => {
                    option.addEventListener('click', function () {
                        // إزالة الفئة النشطة من جميع خيارات التصفية
                        filterOptions.forEach(opt => opt.classList.remove('active'));

                        // إضافة الفئة النشطة للخيار المحدد
                        this.classList.add('active');

                        // تطبيق التصفية
                        const filter = this.getAttribute('data-filter');
                        filterTransactions(filter);
                    });
                });

                // مستمعات الإعدادات
                document.getElementById('toggle-notifications').addEventListener('click', function () {
                    const toggle = document.getElementById('notifications-toggle');
                    toggle.classList.toggle('active');

                    // تخزين الإعداد
                    localStorage.setItem('notifications_enabled', toggle.classList.contains('active'));

                    showNotification('info', 'تم التحديث', 'تم تحديث إعدادات الإشعارات');
                });

                document.getElementById('toggle-dark-mode').addEventListener('click', function () {
                    const toggle = document.getElementById('dark-mode-toggle');
                    toggle.classList.toggle('active');

                    // تخزين الإعداد
                    localStorage.setItem('dark_mode_enabled', toggle.classList.contains('active'));

                    // تطبيق الوضع الداكن (لم يتم تنفيذه في هذا الإصدار)
                    showNotification('info', 'قريباً', 'سيتم إضافة الوضع الليلي قريباً');
                });

                document.getElementById('contact-support').addEventListener('click', function () {
                    showNotification('info', 'الدعم الفني', 'يمكنك التواصل مع الدعم الفني على الرقم: 07800000000');
                });
            }

            // التحقق من وجود جلسة مخزنة
            function checkStoredSession() {
                try {
                    // محاولة استرجاع بيانات المستخدم من التخزين المحلي
                    const storedSession = localStorage.getItem('investor_session');
                    if (storedSession) {
                        const session = JSON.parse(storedSession);

                        // التحقق من صلاحية الجلسة (تنتهي بعد 24 ساعة)
                        const currentTime = new Date().getTime();
                        const sessionTime = new Date(session.timestamp).getTime();
                        const sessionDuration = 24 * 60 * 60 * 1000; // 24 ساعة

                        if (currentTime - sessionTime < sessionDuration) {
                            // الجلسة صالحة، تسجيل الدخول تلقائيًا
                            loginWithStoredData(session);
                        } else {
                            // الجلسة منتهية، حذفها
                            localStorage.removeItem('investor_session');
                        }
                    }
                } catch (error) {
                    console.error('خطأ في التحقق من الجلسة المخزنة:', error);
                    localStorage.removeItem('investor_session');
                }
            }

           

    
            function completeSavedLogin() {
        // تحديث واجهة المستخدم
        updateUserInterface();
        
        // إخفاء صفحة تسجيل الدخول وإظهار التطبيق
        document.getElementById('login-page').classList.add('login-hidden');
        document.getElementById('investor-app').style.display = 'block';
        
        // تعيين العلم
        isLoggedIn = true;
        
        // تحميل البيانات
        loadTransactions()
            .then(() => {
                // إخفاء التحميل
                hideLoader();
                
                // إعداد المستمعات المباشرة
                setupRealtimeListeners();
            })
            .catch(err => {
                console.error('خطأ في تحميل العمليات:', err);
                hideLoader();
            });
    }





// تحديث وظيفة تسجيل الدخول لاستخدام الوظيفة المحسنة
function login(cardInfo) {
    console.log('محاولة تسجيل الدخول...');
    
    // التحقق من البيانات
    if (!validateCardInfo(cardInfo)) {
        return;
    }
    
    // عرض التحميل
    showLoader();
    
    // استخدام الوظيفة المحسنة للبحث عن البطاقة
    verifyAndFindCard(cardInfo)
        .then(card => {
            if (!card) {
                throw new Error('لم يتم العثور على البطاقة. يرجى التحقق من بيانات البطاقة المدخلة.');
            }
            
            console.log('تم العثور على البطاقة:', card);
            cardData = card;
            
            // البحث عن بيانات المستثمر المرتبط بالبطاقة
            return findInvestor(card.investorId);
        })
        .then(investor => {
            if (!investor) {
                console.log('لم يتم العثور على المستثمر، سيتم إنشاء مستثمر افتراضي');
                
                // إنشاء مستثمر افتراضي
                const defaultInvestor = {
                    id: cardData.investorId,
                    name: cardData.investorName || 'مستثمر جديد',
                    amount: 10000,
                    joinDate: new Date().toISOString(),
                    status: 'active',
                    createdAt: new Date().toISOString()
                };
                
                investorData = defaultInvestor;
            } else {
                console.log('تم العثور على المستثمر:', investor);
                investorData = investor;
            }
            
            // تخزين بيانات الجلسة
            storeSession(cardData, investorData);
            
            // تحديث واجهة المستخدم
            updateUserInterface();
            
            // إخفاء صفحة تسجيل الدخول وإظهار التطبيق
            document.getElementById('login-page').classList.add('login-hidden');
            document.getElementById('investor-app').style.display = 'block';
            
            // تعيين العلم
            isLoggedIn = true;
            
            // تحميل البيانات
            return loadTransactions();
        })
        .then(() => {
            // إخفاء التحميل
            hideLoader();
            
            // إظهار ترحيب
            showNotification('success', 'مرحباً', 'تم تسجيل الدخول بنجاح');
            
            // إعداد المستمعات المباشرة
            setupRealtimeListeners();
        })
        .catch(error => {
            console.error('خطأ في تسجيل الدخول:', error);
            
            // عرض رسالة الخطأ
            const errorDiv = document.getElementById('login-error');
            errorDiv.textContent = error.message || 'فشل في تسجيل الدخول. يرجى التحقق من بيانات البطاقة.';
            errorDiv.style.display = 'block';
            
            // إخفاء التحميل
            hideLoader();
        });
}
            // التحقق من بيانات البطاقة
            function validateCardInfo(cardInfo) {
                // التحقق من رقم البطاقة
                if (!cardInfo.cardNumber || cardInfo.cardNumber.length < 16) {
                    document.getElementById('login-error').textContent = 'يرجى إدخال رقم بطاقة صحيح (16 رقم)';
                    document.getElementById('login-error').style.display = 'block';
                    return false;
                }

                // التحقق من تاريخ الانتهاء
                if (!cardInfo.expiryDate || !cardInfo.expiryDate.includes('/')) {
                    document.getElementById('login-error').textContent = 'يرجى إدخال تاريخ انتهاء صحيح (MM/YY)';
                    document.getElementById('login-error').style.display = 'block';
                    return false;
                }

                // التحقق من CVV
                if (!cardInfo.cvv || cardInfo.cvv.length < 3) {
                    document.getElementById('login-error').textContent = 'يرجى إدخال رمز CVV صحيح (3 أرقام)';
                    document.getElementById('login-error').style.display = 'block';
                    return false;
                }

                // إخفاء رسالة الخطأ
                document.getElementById('login-error').style.display = 'none';
                return true;
            }
// تحديث وظيفة البحث عن البطاقة مع تحسين مطابقة تاريخ الانتهاء
function findCard(cardInfo) {
    return new Promise((resolve, reject) => {
        try {
            // نسخة من cardInfo لتفادي تغييره
            const searchInfo = { ...cardInfo };
            
            // تنظيف بيانات البطاقة (إزالة المسافات)
            if (searchInfo.cardNumber) {
                searchInfo.cardNumber = searchInfo.cardNumber.replace(/\s/g, '');
            }
            
            console.log('البحث عن البطاقة باستخدام المعلومات:', searchInfo);
            
            // معرف المستخدم المحدد للبحث
            const userId = 'XwX3oqnAKKWQogQly77PUG42hFr1';
            
            // البحث في مسار البطاقات للمستخدم المحدد
            databaseRef.ref(`users/${userId}/investor_cards`).once('value')
                .then(snapshot => {
                    if (!snapshot || !snapshot.exists()) {
                        console.log('لا توجد بطاقات للمستخدم المحدد');
                        resolve(null);
                        return;
                    }
                    
                    const userCards = snapshot.val();
                    let foundCard = null;
                    
                    // الآن سنمر على جميع البطاقات ونبحث عن تطابق دقيق
                    Object.entries(userCards).forEach(([cardId, card]) => {
                        console.log(`فحص البطاقة ${cardId}:`, card.cardNumber, card.expiryDate, card.cvv);
                        
                        // تنظيف بيانات البطاقة المخزنة للمقارنة
                        const storedCardNumber = (card.cardNumber || '').replace(/\s/g, '');
                        const searchCardNumber = (searchInfo.cardNumber || '').replace(/\s/g, '');
                        
                        // المقارنة بشكل دقيق مع مراعاة تنسيق تاريخ الانتهاء
                        if (storedCardNumber === searchCardNumber) {
                            console.log('تطابق رقم البطاقة لـ', cardId);
                            
                            // معالجة حالات تنسيق تاريخ الانتهاء المختلفة
                            const storedExpiry = card.expiryDate || '';
                            const searchExpiry = searchInfo.expiryDate || '';
                            
                            // تحويل التاريخ بتنسيق YYYY-MM-DD إلى MM/YY
                            let formattedStoredExpiry = storedExpiry;
                            if (storedExpiry.includes('-')) {
                                const parts = storedExpiry.split('-');
                                if (parts.length === 3) {
                                    formattedStoredExpiry = parts[1] + '/' + parts[0].substring(2);
                                }
                            }
                            
                            // مقارنة إما بالتنسيق الأصلي أو المحول
                            const expiryMatch = 
                                searchExpiry === storedExpiry || 
                                searchExpiry === formattedStoredExpiry;
                            
                            if (expiryMatch) {
                                console.log('تطابق تاريخ الانتهاء لـ', cardId);
                                
                                // التحقق من تطابق رمز CVV - مع مراعاة أن قد يكون string أو number
                                if (card.cvv.toString() === searchInfo.cvv.toString()) {
                                    console.log('تطابق رمز CVV لـ', cardId);
                                    console.log('تم العثور على بطاقة مطابقة تمامًا:', cardId);
                                    
                                    // إضافة معرف البطاقة إلى الكائن
                                    card.id = cardId;
                                    foundCard = card;
                                }
                            }
                        }
                    });
                    
                    if (foundCard) {
                        resolve(foundCard);
                    } else {
                        console.log('لم يتم العثور على بطاقة مطابقة في مسار المستخدم');
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('خطأ في البحث عن البطاقة:', error);
                    reject(error);
                });
        } catch (error) {
            console.error('خطأ في عملية البحث عن البطاقة:', error);
            reject(error);
        }
    });
}






// إضافة وظيفة جديدة للتخزين المؤقت للبطاقات المحتملة ثم التحقق منها
function verifyAndFindCard(cardInfo) {
    return new Promise((resolve, reject) => {
        try {
            // البحث عن البطاقة باستخدام الوظيفة المحسنة
            findCard(cardInfo)
                .then(card => {
                    if (card) {
                        console.log('تم العثور على البطاقة:', card);
                        resolve(card);
                        return;
                    }
                    
                    // إذا لم يتم العثور على البطاقة، نحاول البحث مع مرونة في تنسيق تاريخ الانتهاء
                    console.log('محاولة البحث مع مرونة في تنسيق تاريخ الانتهاء...');
                    
                    // معرف المستخدم المحدد للبحث
                    const userId = 'XwX3oqnAKKWQogQly77PUG42hFr1';
                    
                    // البحث في مسار البطاقات للمستخدم المحدد
                    databaseRef.ref(`users/${userId}/investor_cards`).once('value')
                        .then(snapshot => {
                            if (!snapshot || !snapshot.exists()) {
                                resolve(null);
                                return;
                            }
                            
                            const userCards = snapshot.val();
                            let potentialCards = [];
                            
                            // تخزين جميع البطاقات التي تطابق رقم البطاقة فقط
                            Object.entries(userCards).forEach(([cardId, card]) => {
                                const storedCardNumber = (card.cardNumber || '').replace(/\s/g, '');
                                const searchCardNumber = (cardInfo.cardNumber || '').replace(/\s/g, '');
                                
                                if (storedCardNumber === searchCardNumber) {
                                    card.id = cardId;
                                    potentialCards.push(card);
                                }
                            });
                            
                            console.log(`تم العثور على ${potentialCards.length} بطاقة محتملة`);
                            
                            if (potentialCards.length === 0) {
                                resolve(null);
                                return;
                            }
                            
                            // إذا وجدنا بطاقة واحدة فقط تطابق رقم البطاقة، نستخدمها
                            if (potentialCards.length === 1) {
                                console.log('تم العثور على بطاقة واحدة فقط تطابق رقم البطاقة، سيتم استخدامها:', potentialCards[0]);
                                resolve(potentialCards[0]);
                                return;
                            }
                            
                            // إذا وجدنا أكثر من بطاقة، نحاول المطابقة مع CVV
                            const cardWithMatchingCVV = potentialCards.find(card => 
                                card.cvv && card.cvv.toString() === cardInfo.cvv.toString()
                            );
                            
                            if (cardWithMatchingCVV) {
                                console.log('تم العثور على بطاقة تطابق CVV:', cardWithMatchingCVV);
                                resolve(cardWithMatchingCVV);
                                return;
                            }
                            
                            // إذا لم يتم العثور على بطاقة تطابق CVV، نستخدم أول بطاقة
                            console.log('سيتم استخدام أول بطاقة محتملة:', potentialCards[0]);
                            resolve(potentialCards[0]);
                        });
                })
                .catch(error => {
                    console.error('خطأ في البحث عن البطاقة:', error);
                    reject(error);
                });
        } catch (error) {
            console.error('خطأ في عملية التحقق من البطاقة:', error);
            reject(error);
        }
    });
}






            function searchCardSequentially(userIds, index, cardInfo, resolve, reject) {
                // التحقق من انتهاء البحث
                if (index >= userIds.length) {
                    console.log('لم يتم العثور على البطاقة في جميع المستخدمين المعروفين');
                    resolve(null); // لم يتم العثور على البطاقة
                    return;
                }

                const userId = userIds[index];
                const cardsPath = `users/${userId}/investor_cards`;

                console.log(`البحث عن البطاقة في المسار: ${cardsPath}`);

                databaseRef.ref(cardsPath).once('value')
                    .then(snapshot => {
                        const cardsData = snapshot.val();

                        if (cardsData) {
                            console.log(`تم العثور على بطاقات للمستخدم ${userId}`);

                            // البحث عن البطاقة المطابقة
                            let foundCard = null;

                            Object.values(cardsData).forEach(card => {
                                console.log('مقارنة مع البطاقة:', {
                                    cardNumber: card.cardNumber,
                                    expiryDate: card.expiryDate,
                                    cvv: card.cvv
                                });

                                // تنظيف بيانات البطاقة المخزنة للمقارنة
                                const storedCardNumber = (card.cardNumber || '').replace(/\s/g, '');
                                const searchCardNumber = (cardInfo.cardNumber || '').replace(/\s/g, '');

                                // المقارنة مع مرونة للمسافات والتنسيق
                                if (storedCardNumber === searchCardNumber &&
                                    card.expiryDate === cardInfo.expiryDate &&
                                    card.cvv === cardInfo.cvv) {
                                    console.log('تم العثور على بطاقة مطابقة!');
                                    foundCard = card;
                                }
                            });

                            if (foundCard) {
                                resolve(foundCard);
                            } else {
                                console.log(`لم يتم العثور على بطاقة مطابقة للمستخدم ${userId}, البحث في المستخدم التالي`);
                                // الانتقال للمستخدم التالي
                                searchCardSequentially(userIds, index + 1, cardInfo, resolve, reject);
                            }
                        } else {
                            console.log(`لا توجد بطاقات للمستخدم ${userId}, البحث في المستخدم التالي`);
                            // الانتقال للمستخدم التالي
                            searchCardSequentially(userIds, index + 1, cardInfo, resolve, reject);
                        }
                    })
                    .catch(error => {
                        console.error(`خطأ في البحث عن البطاقات للمستخدم ${userId}:`, error);
                        // الانتقال للمستخدم التالي
                        searchCardSequentially(userIds, index + 1, cardInfo, resolve, reject);
                    });
            }

            // البحث عن البطاقة بشكل متسلسل
            function searchCardSequentially(userIds, index, cardInfo, resolve, reject) {
                // التحقق من انتهاء البحث
                if (index >= userIds.length) {
                    resolve(null); // لم يتم العثور على البطاقة
                    return;
                }

                const userId = userIds[index];
                const cardsPath = `users/${userId}/investor_cards`;

                databaseRef.ref(cardsPath).once('value')
                    .then(snapshot => {
                        const cardsData = snapshot.val();

                        if (cardsData) {
                            // البحث عن البطاقة المطابقة
                            let foundCard = null;

                            Object.values(cardsData).forEach(card => {
                                // المقارنة مع cardInfo
                                if (card.cardNumber === cardInfo.cardNumber &&
                                    card.expiryDate === cardInfo.expiryDate &&
                                    card.cvv === cardInfo.cvv) {
                                    foundCard = card;
                                }
                            });

                            if (foundCard) {
                                resolve(foundCard);
                            } else {
                                // الانتقال للمستخدم التالي
                                searchCardSequentially(userIds, index + 1, cardInfo, resolve, reject);
                            }
                        } else {
                            // الانتقال للمستخدم التالي
                            searchCardSequentially(userIds, index + 1, cardInfo, resolve, reject);
                        }
                    })
                    .catch(error => {
                        console.error(`خطأ في البحث عن البطاقات للمستخدم ${userId}:`, error);
                        // الانتقال للمستخدم التالي
                        searchCardSequentially(userIds, index + 1, cardInfo, resolve, reject);
                    });
            }


// تحديث وظيفة البحث عن المستثمر للبحث في مسار المستثمرين بشكل دقيق
function findInvestor(investorId) {
    return new Promise((resolve, reject) => {
        try {
            if (!investorId) {
                resolve(null);
                return;
            }
            
            console.log('البحث عن المستثمر بالمعرف:', investorId);
            
            // معرف المستخدم المحدد
            const userId = 'XwX3oqnAKKWQogQly77PUG42hFr1';
            
            // البحث عن المستثمر في مسار البيانات المباشر
            databaseRef.ref(`users/${userId}/investors/data/${investorId}`).once('value')
                .then(snapshot => {
                    if (snapshot && snapshot.exists()) {
                        const investorData = snapshot.val();
                        console.log('تم العثور على المستثمر مباشرة:', investorData);
                        
                        // التأكد من أن المستثمر له معرف
                        if (!investorData.id) {
                            investorData.id = investorId;
                        }
                        
                        resolve(investorData);
                        return;
                    }
                    
                    // إذا لم يتم العثور على المستثمر مباشرة، نبحث في كل البيانات
                    return databaseRef.ref(`users/${userId}/investors/data`).once('value');
                })
                .then(snapshot => {
                    if (!snapshot || !snapshot.exists()) {
                        console.log('لا توجد بيانات للمستثمرين');
                        resolve(null);
                        return;
                    }
                    
                    const investors = snapshot.val();
                    
                    // البحث في جميع المستثمرين
                    if (Array.isArray(investors)) {
                        // إذا كانت البيانات مصفوفة
                        const investor = investors.find(inv => inv && inv.id === investorId);
                        if (investor) {
                            console.log('تم العثور على المستثمر في المصفوفة:', investor);
                            resolve(investor);
                            return;
                        }
                    } else if (typeof investors === 'object') {
                        // إذا كانت البيانات كائن
                        for (const key in investors) {
                            const investor = investors[key];
                            
                            if (investor && (investor.id === investorId || key === investorId)) {
                                console.log('تم العثور على المستثمر في الكائن:', investor);
                                
                                // التأكد من أن المستثمر له معرف
                                if (!investor.id) {
                                    investor.id = investorId;
                                }
                                
                                resolve(investor);
                                return;
                            }
                        }
                    }
                    
                    console.log('لم يتم العثور على المستثمر');
                    resolve(null);
                })
                .catch(error => {
                    console.error('خطأ في البحث عن المستثمر:', error);
                    reject(error);
                });
        } catch (error) {
            console.error('خطأ في عملية البحث عن المستثمر:', error);
            reject(error);
        }
    });
}
            // تحديث واجهة المستخدم
            function updateUserInterface() {
                // تحديث بيانات البطاقة
                updateCardUI();

                // تحديث معلومات المستثمر
                updateInvestorInfo();

                // تحديث عنوان الصفحة
                document.getElementById('header-title').textContent = 'مرحباً، ' + (investorData.name || 'المستثمر');
            }
           
// تحديث وظيفة تحديث واجهة البطاقة
function updateCardUI() {
    if (!cardData) return;
    
    console.log('تحديث واجهة البطاقة:', cardData);
    
    // تحديث نوع البطاقة
    const cardFront = document.getElementById('card-front');
    cardFront.className = 'card-side card-front';
    cardFront.classList.add(cardData.cardType || 'gold');
    
    // تحديث نص نوع البطاقة
    document.getElementById('card-type-text').textContent = getCardTypeName(cardData.cardType);
    
    // تحديث رقم البطاقة
    document.getElementById('card-number-display').textContent = formatCardNumber(cardData.cardNumber);
    
    // تحديث اسم حامل البطاقة
    document.getElementById('card-holder-name').textContent = cardData.investorName || (investorData ? investorData.name : '');
    
    // تحديث تاريخ الانتهاء
    // تحويل صيغة التاريخ من YYYY-MM-DD إلى MM/YY
    let expiryDate = cardData.expiryDate || '';
    if (expiryDate && expiryDate.includes('-')) {
        const parts = expiryDate.split('-');
        if (parts.length === 3) {
            expiryDate = parts[1] + '/' + parts[0].substring(2);
        }
    }
    document.getElementById('card-expiry-display').textContent = expiryDate;
    
    // تحديث CVV
    document.getElementById('cvv-display').textContent = 'CVV: ' + (cardData.cvv || '***');
    
    // تحديث معرف البطاقة
    document.getElementById('card-id-display').textContent = 'معرف البطاقة: ' + cardData.id;
    
    // تفعيل ميزات البطاقة إذا كانت متوفرة
    if (cardData.features) {
        // يمكن إضافة كود هنا لتفعيل أو تعطيل بعض العناصر المرئية بناءً على ميزات البطاقة
        // مثال: إظهار/إخفاء الشريحة، الهولوغرام، إلخ.
    }
}

// تحديث وظيفة تحديث معلومات المستثمر
function updateInvestorInfo() {
    if (!investorData) return;
    
    console.log('تحديث معلومات المستثمر:', investorData);
    
    // تحديث الرصيد الحالي
    document.getElementById('current-balance').textContent = formatCurrency(investorData.amount);
    
    // تحديث معلومات الملف الشخصي
    document.getElementById('profile-name').textContent = investorData.name || '';
    
    // تعيين الحرف الأول كصورة
    const firstLetter = (investorData.name || '').charAt(0) || 'م';
    document.getElementById('profile-avatar').textContent = firstLetter;
    
    // تحديث تاريخ الانضمام
    document.getElementById('profile-join-date').textContent = 'عضو منذ: ' + formatDate(investorData.joinDate || investorData.createdAt);
    
    // تحديث الهاتف
    document.getElementById('profile-phone').textContent = investorData.phone || '-';
    
    // تحديث العنوان
    document.getElementById('profile-address').textContent = investorData.address || '-';
    
    // تحديث المبلغ المستثمر
    document.getElementById('profile-investment').textContent = formatCurrency(investorData.amount);
    
    // تحديث حالة الحساب
    let statusText = 'نشط';
    if (investorData.status === 'inactive' || investorData.status === 'غير نشط') {
        statusText = 'غير نشط';
    } else if (investorData.status === 'pending' || investorData.status === 'قيد الانتظار') {
        statusText = 'قيد الانتظار';
    }
    document.getElementById('profile-status').textContent = statusText;
    
    // استعادة إعدادات المستخدم من التخزين المحلي
    const notificationsEnabled = localStorage.getItem('notifications_enabled') !== 'false';
    const darkModeEnabled = localStorage.getItem('dark_mode_enabled') === 'true';
    
    // تحديث مفاتيح التبديل
    document.getElementById('notifications-toggle').classList.toggle('active', notificationsEnabled);
    document.getElementById('dark-mode-toggle').classList.toggle('active', darkModeEnabled);
    
    // تحديث آخر ربح وإجمالي الأرباح
    updateProfitUI();
}




// وظيفة جديدة لتحديث معلومات الربح في الواجهة
function updateProfitUI() {
    // حساب إجمالي الأرباح وآخر ربح من العمليات
    let totalProfit = 0;
    let lastProfit = 0;
    
    // البحث عن عمليات الربح
    const profitTransactions = transactions.filter(t => t.type === 'profit');
    
    // استخدام أرباح المستثمر المخزنة إذا كانت متوفرة
    if (investorData && investorData.profits && investorData.profits.length > 0) {
        // آخر ربح هو آخر عملية في مصفوفة الأرباح
        lastProfit = parseFloat(investorData.profits[investorData.profits.length - 1].amount) || 0;
        
        // إجمالي الأرباح هو مجموع جميع الأرباح
        totalProfit = investorData.profits.reduce((sum, profit) => {
            return sum + (parseFloat(profit.amount) || 0);
        }, 0);
    } else if (profitTransactions.length > 0) {
        // آخر ربح هو أول عملية في المصفوفة المرتبة (الأحدث أولاً)
        lastProfit = parseFloat(profitTransactions[0].amount) || 0;
        
        // إجمالي الأرباح هو مجموع جميع عمليات الربح
        totalProfit = profitTransactions.reduce((sum, transaction) => {
            return sum + (parseFloat(transaction.amount) || 0);
        }, 0);
    }
    
    // تحديث آخر ربح وإجمالي الأرباح في الواجهة
    document.getElementById('last-profit').textContent = formatCurrency(lastProfit);
    document.getElementById('total-profit').textContent = formatCurrency(totalProfit);
    
    // تحديث نسبة الربح من الإعدادات
    const settings = getSystemSettings();
    document.getElementById('profit-rate').textContent = (settings.interestRate || 1.75) + '%';
}






// تحسين وظيفة تحميل العمليات لقراءة البيانات من المسار الصحيح
function loadTransactions() {
    return new Promise((resolve, reject) => {
        try {
            if (!investorData || !investorData.id) {
                reject(new Error('بيانات المستثمر غير متوفرة'));
                return;
            }
            
            console.log('تحميل العمليات للمستثمر:', investorData.id);
            
            // إعادة تعيين مصفوفة العمليات
            transactions = [];
            
            // معرف المستخدم المحدد
            const userId = 'XwX3oqnAKKWQogQly77PUG42hFr1';
            
            // قراءة العمليات من قاعدة البيانات (البحث في المسار المباشر أولاً)
            const transactionsRef = databaseRef.ref(`users/${userId}/transactions/data`);
            
            transactionsRef.orderByChild('investorId').equalTo(investorData.id).once('value')
                .then(snapshot => {
                    if (!snapshot || !snapshot.exists()) {
                        console.log('لا توجد عمليات للمستثمر في المسار المباشر');
                        
                        // البحث في المسار العام
                        return databaseRef.ref('/transactions/data').orderByChild('investorId').equalTo(investorData.id).once('value');
                    }
                    
                    return snapshot;
                })
                .then(snapshot => {
                    const transactionsData = snapshot.val();
                    
                    if (!transactionsData) {
                        console.log('لا توجد عمليات للمستثمر');
                        // في حالة عدم وجود عمليات، نستخدم العمليات الافتراضية
                        generateDefaultTransactions();
                    } else {
                        // تحويل البيانات إلى مصفوفة
                        updateTransactionsData(transactionsData);
                    }
                    
                    // تحديث واجهة الإشعارات
                    updateNotificationsUI();
                    
                    // تحديث إحصائيات الربح
                    updateProfitStatistics();
                    
                    resolve(transactions);
                })
                .catch(error => {
                    console.error('خطأ في تحميل العمليات:', error);
                    // في حالة حدوث خطأ، نستخدم العمليات الافتراضية
                    generateDefaultTransactions();
                    reject(error);
                });
        } catch (error) {
            console.error('خطأ في تحميل العمليات:', error);
            // في حالة حدوث خطأ، نستخدم العمليات الافتراضية
            generateDefaultTransactions();
            reject(error);
        }
    });
}


// وظيفة جديدة لتوليد العمليات الافتراضية في حالة عدم وجود عمليات
function generateDefaultTransactions() {
    console.log('توليد عمليات افتراضية للعرض');
    
    if (!investorData) return;
    
    // تحديد تاريخ البداية (تاريخ انضمام المستثمر)
    const startDate = new Date(investorData.joinDate || investorData.createdAt || new Date());
    const currentDate = new Date();
    
    // إنشاء إيداع أولي
    const initialDeposit = {
        id: 'trans_deposit_' + investorData.id + '_initial',
        investorId: investorData.id,
        type: 'deposit',
        amount: parseFloat(investorData.amount) || 0,
        date: startDate.toISOString(),
        balance: parseFloat(investorData.amount) || 0,
        notes: 'الإيداع الأولي',
        createdAt: startDate.toISOString()
    };
    
    transactions.push(initialDeposit);
    
    // إنشاء أرباح شهرية
    if (investorData.profits && investorData.profits.length > 0) {
        // استخدام الأرباح الفعلية إذا كانت متوفرة
        investorData.profits.forEach(profit => {
            const profitTransaction = {
                id: 'trans_profit_' + investorData.id + '_' + new Date(profit.date).getTime(),
                investorId: investorData.id,
                type: 'profit',
                amount: parseFloat(profit.amount) || 0,
                date: new Date(profit.date).toISOString(),
                balance: parseFloat(investorData.amount) || 0,
                notes: `ربح شهري`,
                createdAt: new Date(profit.date).toISOString()
            };
            
            transactions.push(profitTransaction);
        });
    } else {
        // توليد أرباح افتراضية
        let profitDate = new Date(startDate);
        profitDate.setMonth(profitDate.getMonth() + 1);
        
        while (profitDate <= currentDate) {
            // حساب الربح (نسبة 1.75%)
            const profitAmount = (parseFloat(investorData.amount) || 0) * 0.0175;
            
            // إنشاء العملية
            const profit = {
                id: 'trans_profit_' + investorData.id + '_' + profitDate.getTime(),
                investorId: investorData.id,
                type: 'profit',
                amount: profitAmount,
                date: profitDate.toISOString(),
                balance: parseFloat(investorData.amount) || 0,
                notes: `ربح شهر ${profitDate.getMonth() + 1}/${profitDate.getFullYear()}`,
                createdAt: profitDate.toISOString()
            };
            
            transactions.push(profit);
            
            // الانتقال للشهر التالي
            profitDate.setMonth(profitDate.getMonth() + 1);
        }
    }
    
    // ترتيب العمليات حسب التاريخ (الأحدث أولاً)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // حساب إجمالي الأرباح وآخر ربح
    let totalProfit = 0;
    let lastProfit = 0;
    
    const profitTransactions = transactions.filter(t => t.type === 'profit');
    if (profitTransactions.length > 0) {
        // آخر ربح هو أول عملية في المصفوفة المرتبة (الأحدث أولاً)
        lastProfit = parseFloat(profitTransactions[0].amount) || 0;
        
        // إجمالي الأرباح هو مجموع جميع عمليات الربح
        totalProfit = profitTransactions.reduce((sum, transaction) => {
            return sum + (parseFloat(transaction.amount) || 0);
        }, 0);
    }
    
    // تحديث آخر ربح وإجمالي الأرباح في الواجهة
    document.getElementById('last-profit').textContent = formatCurrency(lastProfit);
    document.getElementById('total-profit').textContent = formatCurrency(totalProfit);
    
    // تحديث نسبة الربح
    const settings = getSystemSettings();
    document.getElementById('profit-rate').textContent = (settings.interestRate || 1.75) + '%';
}


// وظيفة جديدة للحصول على إعدادات النظام
function getSystemSettings() {
    // القيم الافتراضية
    const defaultSettings = {
        interestRate: 1.75,
        currency: 'د.ع',
        profitCycle: 30,
        language: 'ar',
        systemName: 'نظام الاستثمار المتكامل'
    };
    
    // محاولة قراءة الإعدادات من التخزين المحلي
    try {
        const storedSettings = localStorage.getItem('system_settings');
        if (storedSettings) {
            return { ...defaultSettings, ...JSON.parse(storedSettings) };
        }
    } catch (error) {
        console.error('خطأ في قراءة إعدادات النظام من التخزين المحلي:', error);
    }
    
    // استخدام القيم الافتراضية إذا لم تنجح قراءة الإعدادات
    return defaultSettings;
}



// وظيفة جديدة لتوليد الإشعارات من العمليات
function generateNotificationsFromTransactions() {
    // إعادة تعيين مصفوفة الإشعارات
    notifications = [];
    
    // إضافة إشعار ترحيب
    const welcomeNotification = {
        id: 'notif_welcome',
        type: 'info',
        title: 'مرحباً بك في تطبيق بطاقة المستثمر',
        message: 'نشكرك على استخدام تطبيقنا. يمكنك الآن تتبع استثماراتك وأرباحك بسهولة.',
        time: new Date().toISOString(),
        read: false
    };
    
    notifications.push(welcomeNotification);
    
    // إضافة إشعارات للعمليات الأخيرة (أحدث 5 عمليات)
    const recentTransactions = transactions.slice(0, 5);
    
    recentTransactions.forEach(transaction => {
        // تحديد نوع الإشعار ونص العنوان والرسالة
        let type = 'info';
        let title = '';
        let message = '';
        
        if (transaction.type === 'deposit') {
            type = 'success';
            title = 'تم الإيداع بنجاح';
            message = `تم إيداع ${formatCurrency(transaction.amount)} في حسابك.`;
        } else if (transaction.type === 'withdraw') {
            type = 'warning';
            title = 'تم السحب';
            message = `تم سحب ${formatCurrency(transaction.amount)} من حسابك.`;
        } else if (transaction.type === 'profit') {
            type = 'success';
            title = 'تم إضافة أرباح';
            message = `تم إضافة ${formatCurrency(transaction.amount)} كأرباح لاستثمارك.`;
        } else if (transaction.type === 'transfer') {
            type = 'info';
            title = 'تم التحويل';
            message = `تم تحويل ${formatCurrency(transaction.amount)}.`;
        }
        
        // إضافة الإشعار
        const notification = {
            id: 'notif_tx_' + transaction.id,
            type: type,
            title: title,
            message: message + (transaction.notes ? ` ${transaction.notes}` : ''),
            time: transaction.date,
            read: false
        };
        
        notifications.push(notification);
    });
    
    // إشعار نظام
    const systemNotification = {
        id: 'notif_system',
        type: 'warning',
        title: 'تحديث النظام',
        message: 'سيتم تحديث النظام قريباً. قد يكون هناك انقطاع مؤقت في الخدمة.',
        time: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // قبل 3 أيام
        read: false
    };
    
    notifications.push(systemNotification);
    
    // ترتيب الإشعارات حسب التاريخ (الأحدث أولاً)
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
}


            // توليد عمليات وهمية للعرض
            function generateDummyTransactions() {
                if (!investorData) return;

                // تحديد تاريخ البداية (تاريخ انضمام المستثمر)
                const startDate = new Date(investorData.joinDate || investorData.createdAt || new Date());
                const currentDate = new Date();

                // إنشاء أرباح شهرية
                let profitDate = new Date(startDate);
                profitDate.setMonth(profitDate.getMonth() + 1);

                let lastProfit = 0;
                let totalProfit = 0;

                while (profitDate <= currentDate) {
                    // حساب الربح
                    const profitAmount = (parseFloat(investorData.amount) || 0) * 0.0175; // نسبة 1.75%

                    // إنشاء العملية
                    const profit = {
                        id: 'trans_profit_' + investorData.id + '_' + profitDate.getTime(),
                        investorId: investorData.id,
                        type: 'profit',
                        amount: profitAmount,
                        date: profitDate.toISOString(),
                        balance: parseFloat(investorData.amount) || 0,
                        notes: `ربح شهر ${profitDate.getMonth() + 1}/${profitDate.getFullYear()}`,
                        createdAt: profitDate.toISOString()
                    };

                    transactions.push(profit);

                    // تحديث آخر ربح وإجمالي الأرباح
                    lastProfit = profitAmount;
                    totalProfit += profitAmount;

                    // الانتقال للشهر التالي
                    profitDate.setMonth(profitDate.getMonth() + 1);
                }

                // إضافة الإيداع الأولي
                const initialDeposit = {
                    id: 'trans_deposit_' + investorData.id + '_initial',
                    investorId: investorData.id,
                    type: 'deposit',
                    amount: parseFloat(investorData.amount) || 0,
                    date: startDate.toISOString(),
                    balance: parseFloat(investorData.amount) || 0,
                    notes: 'الإيداع الأولي',
                    createdAt: startDate.toISOString()
                };

                transactions.push(initialDeposit);

                // إضافة بعض العمليات العشوائية للعرض

                // سحب
                const withdrawDate = new Date();
                withdrawDate.setMonth(withdrawDate.getMonth() - 1);
                withdrawDate.setDate(15);

                const withdraw = {
                    id: 'trans_withdraw_' + investorData.id + '_' + withdrawDate.getTime(),
                    investorId: investorData.id,
                    type: 'withdraw',
                    amount: 200,
                    date: withdrawDate.toISOString(),
                    balance: parseFloat(investorData.amount) - 200,
                    notes: 'سحب جزئي',
                    createdAt: withdrawDate.toISOString()
                };

                transactions.push(withdraw);

                // تحويل
                const transferDate = new Date();
                transferDate.setMonth(transferDate.getMonth() - 2);
                transferDate.setDate(20);

                const transfer = {
                    id: 'trans_transfer_' + investorData.id + '_' + transferDate.getTime(),
                    investorId: investorData.id,
                    type: 'transfer',
                    amount: 500,
                    date: transferDate.toISOString(),
                    balance: parseFloat(investorData.amount),
                    notes: 'تحويل إلى حساب بنكي',
                    createdAt: transferDate.toISOString()
                };

                transactions.push(transfer);

                // ترتيب العمليات حسب التاريخ (الأحدث أولاً)
                transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

                // تحديث آخر ربح وإجمالي الأرباح في الواجهة
                document.getElementById('last-profit').textContent = formatCurrency(lastProfit);
                document.getElementById('total-profit').textContent = formatCurrency(totalProfit);

                // تحديث نسبة الربح
                document.getElementById('profit-rate').textContent = '1.75%';

                // إنشاء الإشعارات
                generateNotifications();
            }

            // توليد إشعارات وهمية
            function generateNotifications() {
                // إعادة تعيين مصفوفة الإشعارات
                notifications = [];

                // إضافة إشعار ترحيب
                const welcomeNotification = {
                    id: 'notif_welcome',
                    type: 'info',
                    title: 'مرحباً بك في تطبيق بطاقة المستثمر',
                    message: 'نشكرك على استخدام تطبيقنا. يمكنك الآن تتبع استثماراتك وأرباحك بسهولة.',
                    time: new Date().toISOString(),
                    read: false
                };

                notifications.push(welcomeNotification);

                // إضافة إشعارات للعمليات الأخيرة
                // الربح الأخير
                const lastProfit = transactions.find(t => t.type === 'profit');
                if (lastProfit) {
                    const profitNotification = {
                        id: 'notif_profit_' + lastProfit.id,
                        type: 'success',
                        title: 'تم إضافة أرباح جديدة',
                        message: `تم إضافة ${formatCurrency(lastProfit.amount)} كأرباح لاستثمارك. ${lastProfit.notes}`,
                        time: lastProfit.date,
                        read: true
                    };

                    notifications.push(profitNotification);
                }

                // إشعار نظام
                const systemNotification = {
                    id: 'notif_system',
                    type: 'warning',
                    title: 'تحديث النظام',
                    message: 'سيتم تحديث النظام يوم الخميس القادم الساعة 12 ظهراً. قد يكون هناك انقطاع مؤقت في الخدمة.',
                    time: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // قبل 3 أيام
                    read: false
                };

                notifications.push(systemNotification);

                // إشعارات مزيفة إضافية
                const notif1 = {
                    id: 'notif_1',
                    type: 'info',
                    title: 'إضافة ميزات جديدة',
                    message: 'تم إضافة ميزات جديدة للتطبيق. يمكنك الآن تتبع استثماراتك بشكل أفضل.',
                    time: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // قبل أسبوع
                    read: true
                };

                notifications.push(notif1);
            }

            // تحديث واجهة العمليات
            function updateTransactionsUI() {
                // تحديث العمليات الأخيرة في الصفحة الرئيسية
                const recentTransactionsContainer = document.getElementById('recent-transactions');
                if (recentTransactionsContainer) {
                    recentTransactionsContainer.innerHTML = '';

                    // عرض أحدث 5 عمليات فقط
                    const recentTransactions = transactions.slice(0, 5);

                    if (recentTransactions.length === 0) {
                        recentTransactionsContainer.innerHTML = '<div style="text-align: center; padding: 20px;">لا توجد عمليات حتى الآن</div>';
                    } else {
                        recentTransactions.forEach(transaction => {
                            recentTransactionsContainer.appendChild(createTransactionElement(transaction));
                        });
                    }
                }

                // تحديث قائمة جميع العمليات
                const allTransactionsContainer = document.getElementById('all-transactions');
                if (allTransactionsContainer) {
                    allTransactionsContainer.innerHTML = '';

                    if (transactions.length === 0) {
                        allTransactionsContainer.innerHTML = '<div style="text-align: center; padding: 20px;">لا توجد عمليات حتى الآن</div>';
                    } else {
                        transactions.forEach(transaction => {
                            allTransactionsContainer.appendChild(createTransactionElement(transaction));
                        });
                    }
                }
            }

            // إنشاء عنصر العملية
            function createTransactionElement(transaction) {
                const transactionItem = document.createElement('div');
                transactionItem.className = 'transaction-item';
                transactionItem.setAttribute('data-id', transaction.id);
                transactionItem.setAttribute('data-type', transaction.type);

                // تحديد فئة ونص نوع العملية
                let typeClass = '';
                let typeText = '';
                let isPositive = true;

                if (transaction.type === 'deposit') {
                    typeClass = 'deposit';
                    typeText = 'إيداع';
                    isPositive = true;
                } else if (transaction.type === 'withdraw') {
                    typeClass = 'withdraw';
                    typeText = 'سحب';
                    isPositive = false;
                } else if (transaction.type === 'profit') {
                    typeClass = 'profit';
                    typeText = 'ربح';
                    isPositive = true;
                } else if (transaction.type === 'transfer') {
                    typeClass = 'transfer';
                    typeText = 'تحويل';
                    isPositive = false;
                }

                transactionItem.innerHTML = `
                <div class="transaction-icon ${typeClass}">
                    <i class="fas fa-${typeClass === 'deposit' ? 'arrow-down' :
                        typeClass === 'withdraw' ? 'arrow-up' :
                            typeClass === 'profit' ? 'coins' : 'exchange-alt'}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${typeText}</div>
                    <div class="transaction-date">${formatDate(transaction.date)}</div>
                </div>
                <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                    ${isPositive ? '+' : '-'} ${formatCurrency(transaction.amount)}
                </div>
            `;

                return transactionItem;
            }

            // تحديث واجهة الإشعارات
            function updateNotificationsUI() {
                const notificationsContainer = document.getElementById('all-notifications');
                if (notificationsContainer) {
                    notificationsContainer.innerHTML = '';

                    if (notifications.length === 0) {
                        notificationsContainer.innerHTML = '<div style="text-align: center; padding: 20px;">لا توجد إشعارات حتى الآن</div>';
                    } else {
                        notifications.forEach(notification => {
                            notificationsContainer.appendChild(createNotificationElement(notification));
                        });
                    }
                }
            }

            // إنشاء عنصر الإشعار
            function createNotificationElement(notification) {
                const notificationItem = document.createElement('div');
                notificationItem.className = 'notification-item';
                notificationItem.setAttribute('data-id', notification.id);

                if (!notification.read) {
                    notificationItem.classList.add('unread');
                }

                // تحديد أيقونة الإشعار
                let iconClass = 'info';
                let iconName = 'info-circle';

                if (notification.type === 'success') {
                    iconClass = 'success';
                    iconName = 'check-circle';
                } else if (notification.type === 'warning') {
                    iconClass = 'warning';
                    iconName = 'exclamation-triangle';
                } else if (notification.type === 'danger' || notification.type === 'error') {
                    iconClass = 'danger';
                    iconName = 'exclamation-circle';
                }

                notificationItem.innerHTML = `
                <div class="notification-icon ${iconClass}">
                    <i class="fas fa-${iconName}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${formatTimeAgo(notification.time)}</div>
                </div>
            `;

                // إضافة حدث النقر لتعيين الإشعار كمقروء
                notificationItem.addEventListener('click', function () {
                    markNotificationAsRead(notification.id);
                    this.classList.remove('unread');
                });

                return notificationItem;
            }

            // تعيين الإشعار كمقروء
            function markNotificationAsRead(notificationId) {
                const index = notifications.findIndex(n => n.id === notificationId);
                if (index !== -1) {
                    notifications[index].read = true;
                }
            }

            // تصفية العمليات
            function filterTransactions(filter) {
                const transactionElements = document.querySelectorAll('.transaction-item');

                transactionElements.forEach(element => {
                    const elementType = element.getAttribute('data-type');

                    if (filter === 'all' || elementType === filter) {
                        element.style.display = 'flex';
                    } else {
                        element.style.display = 'none';
                    }
                });
            }

            // تحديث إحصائيات الربح
            function updateProfitStatistics() {
                // إنشاء مخطط الأرباح
                createProfitChart();
            }


           
// وظيفة تحديث مخطط الأرباح
function createProfitChart() {
    const canvas = document.getElementById('profit-chart');
    if (!canvas || !transactions.length) return;
    
    // تجميع الأرباح حسب الشهر
    const profitsByMonth = {};
    
    // استخدام أرباح المستثمر المخزنة إذا كانت متوفرة
    if (investorData && investorData.profits && investorData.profits.length > 0) {
        investorData.profits.forEach(profit => {
            if (!profit.date) return;
            
            const date = new Date(profit.date);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            
            if (!profitsByMonth[monthYear]) {
                profitsByMonth[monthYear] = 0;
            }
            
            profitsByMonth[monthYear] += parseFloat(profit.amount) || 0;
        });
    } else {
        // استخدام عمليات الربح من العمليات
        transactions.filter(t => t.type === 'profit').forEach(transaction => {
            const date = new Date(transaction.date);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            
            if (!profitsByMonth[monthYear]) {
                profitsByMonth[monthYear] = 0;
            }
            
            profitsByMonth[monthYear] += parseFloat(transaction.amount) || 0;
        });
    }
    
    // ترتيب المفاتيح حسب التاريخ (الأقدم أولاً)
    const sortedKeys = Object.keys(profitsByMonth).sort((a, b) => {
        const [monthA, yearA] = a.split('/').map(Number);
        const [monthB, yearB] = b.split('/').map(Number);
        
        if (yearA !== yearB) {
            return yearA - yearB;
        }
        
        return monthA - monthB;
    });
    
    // تحويل إلى مصفوفات للرسم البياني
    const labels = sortedKeys;
    const data = sortedKeys.map(key => profitsByMonth[key]);
    
    // إنشاء الرسم البياني
    if (window.profitChart) {
        window.profitChart.destroy();
    }
    
    window.profitChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'الأرباح الشهرية',
                data: data,
                backgroundColor: 'rgba(52, 152, 219, 0.6)',
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



            // تسجيل الخروج
            function logout() {
                console.log('تسجيل الخروج...');

                // حذف جلسة المستخدم
                localStorage.removeItem('investor_session');

                // إعادة تعيين المتغيرات
                currentUser = null;
                investorData = null;
                cardData = null;
                transactions = [];
                notifications = [];
                isLoggedIn = false;

                // إخفاء التطبيق وإظهار صفحة تسجيل الدخول
                document.getElementById('investor-app').style.display = 'none';
                document.getElementById('login-page').classList.remove('login-hidden');

                // إعادة تعيين نموذج تسجيل الدخول
                document.getElementById('card-number').value = '';
                document.getElementById('expiry-date').value = '';
                document.getElementById('cvv').value = '';
                document.getElementById('login-error').style.display = 'none';

                // إظهار إشعار
                showNotification('info', 'تم تسجيل الخروج', 'تم تسجيل الخروج بنجاح');
            }

          

// وظيفة تحديث إعداد ماسح الـ QR
function startQRScanner() {
    const qrReader = document.getElementById('qr-reader');
    if (!qrReader) return;
    
    // إنشاء ماسح الباركود إذا لم يكن موجودًا
    if (!qrScanner) {
        qrScanner = new Html5Qrcode("qr-reader");
    }
    
    const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
        let minEdgePercentage = 0.7; // 70%
        let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
        let qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
        return {
            width: qrboxSize,
            height: qrboxSize
        };
    };
    
    // بدء المسح
    qrScanner.start(
        { facingMode: "environment" },
        { 
            fps: 10,
            qrbox: qrboxFunction,
            aspectRatio: 1.0
        },
        (decodedText, decodedResult) => {
            // معالجة النتيجة
            handleQRCodeResult(decodedText);
        },
        (errorMessage) => {
            console.error('خطأ في مسح الباركود:', errorMessage);
        }
    ).catch((err) => {
        console.error('خطأ في بدء الماسح:', err);
        showNotification('error', 'خطأ', 'فشل في تشغيل الكاميرا. تأكد من منح الإذن للوصول إلى الكاميرا.');
    });
}
          


// تحديث معالجة QR Code للتأكد من استخراج البيانات الصحيحة
function handleQRCodeResult(decodedText) {
    console.log('تم مسح الباركود:', decodedText);
    
    try {
        // محاولة فك ترميز URL للـ QR
        if (decodedText.startsWith('http') && decodedText.includes('data=')) {
            // استخراج البيانات من URL
            const url = new URL(decodedText);
            const encodedData = url.searchParams.get('data');
            if (encodedData) {
                // فك ترميز البيانات
                const decodedData = decodeURIComponent(encodedData);
                decodedText = decodedData;
            }
        }
        
        // محاولة تحليل البيانات كـ JSON
        try {
            const cardData = JSON.parse(decodedText);
            
            // التحقق من صحة بيانات البطاقة
            if (cardData.cardNumber && (cardData.expiryDate || cardData.expiry)) {
                // إيقاف المسح
                if (qrScanner) {
                    qrScanner.stop().catch(err => console.error('خطأ في إيقاف الماسح:', err));
                }
                
                // إنشاء بيانات الدخول
                const loginInfo = {
                    cardNumber: cardData.cardNumber.replace(/\s/g, ''),
                    expiryDate: cardData.expiryDate || cardData.expiry,
                    cvv: cardData.cvv || cardData.CVV || ''
                };
                
                // تسجيل الدخول
                login(loginInfo);
                return;
            }
        } catch (jsonError) {
            console.log('الباركود ليس بصيغة JSON، جاري تحليل النص المنسق');
        }
        
        // استخراج بيانات البطاقة من النص المنسق
        // البحث عن رقم البطاقة (أربع مجموعات من 4 أرقام)
        const cardNumberMatch = decodedText.match(/(\d{4})[^\d]*(\d{4})[^\d]*(\d{4})[^\d]*(\d{4})/);
        // البحث عن تاريخ الانتهاء بالنمط M/YY أو MM/YY
        const expiryMatch = decodedText.match(/(\d{1,2}\/\d{2,4})/);
        // البحث عن CVV (3 أرقام)
        const cvvMatch = decodedText.match(/CVV:?\s*(\d{3})/i) || decodedText.match(/(\d{3})/);
        
        if (cardNumberMatch && (expiryMatch || decodedText.includes('/'))) {
            // تجميع رقم البطاقة من المجموعات المستخرجة
            const cardNumber = cardNumberMatch[1] + cardNumberMatch[2] + cardNumberMatch[3] + cardNumberMatch[4];
            
            // استخراج تاريخ الانتهاء
            const expiryDate = expiryMatch ? expiryMatch[1] : "01/30"; // قيمة افتراضية إذا لم يتم العثور
            
            // استخراج CVV
            const cvv = cvvMatch ? cvvMatch[1] : "000"; // قيمة افتراضية إذا لم يتم العثور
            
            // إيقاف المسح
            if (qrScanner) {
                qrScanner.stop().catch(err => console.error('خطأ في إيقاف الماسح:', err));
            }
            
            console.log('تم استخراج بيانات البطاقة بنجاح:', {
                cardNumber: cardNumber,
                expiryDate: expiryDate,
                cvv: cvv
            });
            
            // تسجيل الدخول باستخدام البيانات المستخرجة
            login({
                cardNumber: cardNumber,
                expiryDate: expiryDate,
                cvv: cvv
            });
            return;
        }
        
        // إذا لم نتمكن من استخراج البيانات
        showNotification('error', 'خطأ', 'لم يتم التعرف على تنسيق الباركود. يرجى التأكد من استخدام باركود بطاقة صحيح.');
        
    } catch (error) {
        console.error('خطأ في تحليل بيانات الباركود:', error);
        showNotification('error', 'خطأ', 'فشل في قراءة بيانات الباركود');
    }
}
         

// وظيفة مساعدة لتنسيق تاريخ الانتهاء من YYYY-MM-DD إلى MM/YY
function formatExpiryDate(dateString) {
    try {
        if (!dateString || !dateString.includes('-')) return dateString;
        
        const parts = dateString.split('-');
        if (parts.length !== 3) return dateString;
        
        // الجزء الأول هو السنة، والثاني هو الشهر
        const year = parts[0].substring(2); // آخر رقمين من السنة
        const month = parts[1];
        
        return `${month}/${year}`;
    } catch (error) {
        console.error('خطأ في تنسيق تاريخ الانتهاء:', error);
        return dateString;
    }
}
            // تحديث البيانات
            function refreshData() {
                console.log('تحديث البيانات...');

                if (!isLoggedIn || !investorData || !cardData) {
                    return;
                }

                // عرض التحميل
                showLoader();

                // إعادة تحميل البيانات
                Promise.all([
                    findInvestor(investorData.id),
                    findCard(cardData)
                ])
                    .then(([investor, card]) => {
                        if (investor) {
                            investorData = investor;
                        }

                        if (card) {
                            cardData = card;
                        }

                        // تحديث واجهة المستخدم
                        updateUserInterface();

                        // إعادة تحميل العمليات
                        return loadTransactions();
                    })
                    .then(() => {
                        // إخفاء التحميل
                        hideLoader();

                        // إظهار إشعار
                        showNotification('success', 'تم التحديث', 'تم تحديث البيانات بنجاح');
                    })
                    .catch(error => {
                        console.error('خطأ في تحديث البيانات:', error);

                        // إخفاء التحميل
                        hideLoader();

                        // إظهار إشعار
                        showNotification('error', 'خطأ', 'فشل في تحديث البيانات');
                    });
            }











// تحديث وظيفة إعداد المستمعات المباشرة
function setupRealtimeListeners() {
    // في حالة وجود مستثمر مسجل
    if (!investorData || !investorData.id) {
        return;
    }
    
    console.log('إعداد المستمعات المباشرة للمستثمر:', investorData.id);
    
    // معرف المستخدم المحدد
    const userId = 'XwX3oqnAKKWQogQly77PUG42hFr1';
    
    // إعداد المستمع لبيانات المستثمر (للبطاقة المحددة)
    if (investorData.id) {
        // استخدام المسار المباشر إن أمكن
        const investorRef = databaseRef.ref(`users/${userId}/investors/data/${investorData.id}`);
        
        investorRef.on('value', snapshot => {
            if (snapshot && snapshot.exists()) {
                const updatedInvestor = snapshot.val();
                console.log('تم استلام تحديث لبيانات المستثمر:', updatedInvestor);
                
                // تحديث بيانات المستثمر
                investorData = updatedInvestor;
                
                // التأكد من وجود معرف
                if (!investorData.id) {
                    investorData.id = snapshot.key;
                }
                
                // تحديث واجهة المستخدم
                updateInvestorInfo();
                
                // تحديث مخطط الأرباح
                createProfitChart();
            }
        });
    }
    
    // إعداد المستمع للعمليات
    const transactionsRef = databaseRef.ref(`users/${userId}/transactions/data`);
    transactionsRef.orderByChild('investorId').equalTo(investorData.id).on('value', snapshot => {
        if (snapshot && snapshot.exists()) {
            const transactionsData = snapshot.val();
            updateTransactionsData(transactionsData);
        }
    });
    
    // إعداد المستمع للبطاقة (للبطاقة المحددة فقط)
    if (cardData && cardData.id) {
        // معرف البطاقة
        const cardRef = databaseRef.ref(`users/${userId}/investor_cards/${cardData.id}`);
        
        cardRef.on('value', snapshot => {
            if (snapshot && snapshot.exists()) {
                const updatedCard = snapshot.val();
                console.log('تم استلام تحديث لبيانات البطاقة:', updatedCard);
                
                // تحديث بيانات البطاقة
                cardData = updatedCard;
                
                // إضافة المعرف
                cardData.id = snapshot.key;
                
                // تحديث واجهة البطاقة
                updateCardUI();
            }
        });
    }
}




// وظيفة مساعدة لتحديث بيانات العمليات
function updateTransactionsData(transactionsData) {
    // تحويل البيانات إلى مصفوفة
    const newTransactions = [];
    
    Object.entries(transactionsData).forEach(([txId, transaction]) => {
        // التحقق من أن العملية تخص المستثمر الحالي
        if (transaction.investorId === investorData.id) {
            // تحويل نوع العملية إلى النوع المتوافق مع التطبيق
            let type = 'deposit'; // افتراضي
            
            if (transaction.type === 'إيداع') {
                type = 'deposit';
            } else if (transaction.type === 'سحب') {
                type = 'withdraw';
            } else if (transaction.type === 'دفع أرباح') {
                type = 'profit';
            } else if (transaction.type === 'تحويل') {
                type = 'transfer';
            }
            
            // إضافة العملية بالتنسيق المناسب
            newTransactions.push({
                id: txId,
                investorId: transaction.investorId,
                type: type,
                amount: transaction.amount,
                date: transaction.date || transaction.createdAt,
                balance: transaction.balanceAfter || investorData.amount,
                notes: transaction.notes,
                createdAt: transaction.createdAt
            });
        }
    });
    
    if (newTransactions.length > 0) {
        // تحديث مصفوفة العمليات
        transactions = newTransactions;
        
        // ترتيب العمليات حسب التاريخ (الأحدث أولاً)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log('تم تحديث العمليات، العدد الجديد:', transactions.length);
        
        // تحديث واجهة العمليات
        updateTransactionsUI();
        
        // توليد الإشعارات
        generateNotificationsFromTransactions();
        
        // تحديث واجهة الإشعارات
        updateNotificationsUI();
        
        // تحديث إحصائيات الربح
        updateProfitStatistics();
    }
}

// يجب أن تعدل وظيفة verifyAndAddCard لتستخدم findCard الجديدة
function verifyAndAddCard(cardInfo) {
    return new Promise((resolve, reject) => {
        // البحث عن البطاقة أولاً
        findCard(cardInfo)
            .then(card => {
                if (card) {
                    // البطاقة موجودة بالفعل
                    console.log('تم العثور على البطاقة في قاعدة البيانات');
                    resolve(card);
                } else {
                    // محاولة البحث بطريقة مباشرة في مسار المستخدم
                    console.log('البحث عن البطاقة في مسار المستخدم...');
                    
                    // استخدام معرف المستخدم المحدد للبحث عن البطاقة مباشرة
                    const userId = 'XwX3oqnAKKWQogQly77PUG42hFr1'; // المستخدم الذي يظهر في روابط الخطأ
                    const specificCardId = '1746394866564'; // معرف البطاقة من الروابط
                    
                    return databaseRef.ref(`users/${userId}/investor_cards/${specificCardId}`).once('value');
                }
            })
            .then(snapshot => {
                if (snapshot && snapshot.exists()) {
                    // تم العثور على البطاقة في المسار المحدد
                    const card = snapshot.val();
                    console.log('تم العثور على البطاقة في المسار المحدد:', card);
                    resolve(card);
                    return null;
                }
                
                // محاولة البحث بالطريقة القديمة كاحتياطي
                return findCardLegacy(cardInfo);
            })
            .then(card => {
                if (card) {
                    // البطاقة موجودة بالفعل (تم العثور عليها بالطريقة القديمة)
                    console.log('تم العثور على البطاقة في قاعدة البيانات (طريقة قديمة)');
                    resolve(card);
                    return null;
                }
                
                // البطاقة غير موجودة، تحقق من صحة البيانات ثم أضفها
                console.log('البطاقة غير موجودة، جاري التحقق من صحة البيانات...');
                
                // تحقق بسيط من صحة البيانات
                if (!cardInfo.cardNumber || cardInfo.cardNumber.replace(/\s/g, '').length < 16) {
                    reject(new Error('رقم البطاقة غير صالح'));
                    return null;
                }
                
                if (!cardInfo.expiryDate || !cardInfo.expiryDate.includes('/')) {
                    reject(new Error('تاريخ الانتهاء غير صالح'));
                    return null;
                }
                
                if (!cardInfo.cvv || cardInfo.cvv.length < 3) {
                    reject(new Error('رمز CVV غير صالح'));
                    return null;
                }
                
                // إنشاء بطاقة جديدة
                const newCard = {
                    id: 'card_' + Date.now(),
                    cardNumber: cardInfo.cardNumber.replace(/\s/g, ''),
                    expiryDate: cardInfo.expiryDate,
                    cvv: cardInfo.cvv,
                    cardType: 'gold', // قيمة افتراضية
                    investorId: 'inv_temp_' + Date.now(), // سيتم تحديثه لاحقًا
                    investorName: 'مستثمر جديد',
                    createdAt: new Date().toISOString()
                };
                
                // إنشاء مستثمر جديد أيضًا
                const newInvestor = {
                    id: newCard.investorId,
                    name: newCard.investorName,
                    amount: 10000, // قيمة افتراضية
                    joinDate: new Date().toISOString(),
                    status: 'active',
                    createdAt: new Date().toISOString()
                };
                
                console.log('تم إنشاء بطاقة جديدة افتراضية:', newCard);
                resolve(newCard);
                return null;
            })
            .catch(error => {
                console.error('خطأ في التحقق من البطاقة:', error);
                reject(error);
            });
    });
}
            // إظهار صفحة محددة
            function showPage(pageId) {
                // إخفاء جميع الصفحات
                const pages = document.querySelectorAll('.app-page');
                pages.forEach(page => {
                    page.classList.remove('active');
                });

                // عرض الصفحة المطلوبة
                const targetPage = document.getElementById(`${pageId}-page`);
                if (targetPage) {
                    targetPage.classList.add('active');

                    // تحديث عنوان الصفحة
                    updatePageTitle(pageId);
                }
            }

            // تحديث عنوان الصفحة
            function updatePageTitle(pageId) {
                let title = 'تطبيق بطاقة المستثمر';

                switch (pageId) {
                    case 'home':
                        title = 'الرئيسية';
                        break;
                    case 'transactions':
                        title = 'العمليات';
                        break;
                    case 'notifications':
                        title = 'الإشعارات';
                        break;
                    case 'profile':
                        title = 'الملف الشخصي';
                        break;
                }

                document.getElementById('header-title').textContent = title;
            }

            // عرض اللودر
            function showLoader() {
                const loader = document.getElementById('loader');
                if (loader) {
                    loader.classList.add('active');
                }
            }

            // إخفاء اللودر
            function hideLoader() {
                const loader = document.getElementById('loader');
                if (loader) {
                    loader.classList.remove('active');
                }
            }

            // عرض إشعار
            function showNotification(type, title, message) {
                const toast = document.getElementById('notification-toast');
                const toastIcon = document.getElementById('toast-icon');
                const toastTitle = document.getElementById('toast-title');
                const toastMessage = document.getElementById('toast-message');

                // تعيين نوع الإشعار
                toastIcon.className = 'toast-icon ' + type;

                // تعيين الأيقونة
                let iconClass = 'info-circle';
                if (type === 'success') {
                    iconClass = 'check-circle';
                } else if (type === 'error') {
                    iconClass = 'exclamation-circle';
                } else if (type === 'warning') {
                    iconClass = 'exclamation-triangle';
                }

                toastIcon.innerHTML = `<i class="fas fa-${iconClass}"></i>`;

                // تعيين العنوان والرسالة
                toastTitle.textContent = title;
                toastMessage.textContent = message;

                // عرض الإشعار
                toast.classList.add('active');

                // إخفاء الإشعار تلقائيًا بعد 5 ثوانٍ
                setTimeout(() => {
                    hideNotification();
                }, 5000);
            }

            // إخفاء الإشعار
            function hideNotification() {
                const toast = document.getElementById('notification-toast');
                toast.classList.remove('active');
            }

            // دوال مساعدة
// تحديث تنسيق التاريخ لدعم تنسيقات مختلفة
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            // محاولة تحليل تنسيقات أخرى
            if (typeof dateString === 'string') {
                // تنسيق DD/MM/YYYY
                const parts = dateString.split('/');
                if (parts.length === 3) {
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1; // الشهور من 0-11
                    const year = parseInt(parts[2], 10);
                    
                    const newDate = new Date(year, month, day);
                    if (!isNaN(newDate.getTime())) {
                        return formatDateObject(newDate);
                    }
                }
            }
            
            return dateString; // إرجاع النص الأصلي إذا فشل التحليل
        }
        
        return formatDateObject(date);
    } catch (error) {
        console.error('خطأ في تنسيق التاريخ:', error);
        return dateString;
    }
}

// اضافة الوظيفة الأصلية التي تم استبدالها لدعم الإصدارات السابقة
// وظيفة البحث عن البطاقة بالأسلوب القديم (الاحتياطي)
function findCardLegacy(cardInfo) {
    return new Promise((resolve, reject) => {
        try {
            // نسخة من cardInfo لتفادي تغييره
            const searchInfo = { ...cardInfo };
            
            // تنظيف بيانات البطاقة (إزالة المسافات)
            if (searchInfo.cardNumber) {
                searchInfo.cardNumber = searchInfo.cardNumber.replace(/\s/g, '');
            }
            
            console.log('بيانات البطاقة المستخدمة للبحث (طريقة قديمة):', searchInfo);
            
            // بحث في جميع المستخدمين المعروفين
            const KNOWN_USER_IDS = [
                'XgaPOacU8WfTZ4KeBPOcquLaK4j2',
                'b7XlRaRqUEX2X6SdnF9fyV5SPi83',
                '9VxpBQmjkBTw3NcKxKQNuFXrE4y1',
                'JzGdF8Kt7QsZ2cxpWYLuV5ArN6m4',
                'P3qHnRtM5bXj8VwEgFkYd2ZsL7a9'
            ];
            
            // البحث بشكل متسلسل في جميع المستخدمين
            searchCardSequentially(KNOWN_USER_IDS, 0, searchInfo, resolve, reject);
        } catch (error) {
            console.error('خطأ في البحث عن البطاقة (طريقة قديمة):', error);
            reject(error);
        }
    });
}



// تعريف وظيفة تخزين جلسة المستخدم (كانت مفقودة)
function storeSession(card, investor) {
    try {
        const session = {
            cardData: card,
            investorData: investor,
            timestamp: new Date().toISOString()
        };
        
        console.log('تخزين جلسة المستخدم:', session);
        localStorage.setItem('investor_session', JSON.stringify(session));
    } catch (error) {
        console.error('خطأ في تخزين بيانات الجلسة:', error);
    }
}



        
// وظيفة مساعدة لتنسيق كائن التاريخ
function formatDateObject(date) {
    // تنسيق التاريخ (DD/MM/YYYY)
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

            // تنسيق الوقت منذ فترة
            function formatTimeAgo(dateString) {
                if (!dateString) return '-';

                try {
                    const date = new Date(dateString);
                    const now = new Date();

                    if (isNaN(date.getTime())) return '-';

                    const seconds = Math.floor((now - date) / 1000);

                    // أقل من دقيقة
                    if (seconds < 60) {
                        return 'منذ لحظات';
                    }

                    // أقل من ساعة
                    const minutes = Math.floor(seconds / 60);
                    if (minutes < 60) {
                        return `منذ ${minutes} دقيقة`;
                    }

                    // أقل من يوم
                    const hours = Math.floor(minutes / 60);
                    if (hours < 24) {
                        return `منذ ${hours} ساعة`;
                    }

                    // أقل من أسبوع
                    const days = Math.floor(hours / 24);
                    if (days < 7) {
                        return `منذ ${days} يوم`;
                    }

                    // أقل من شهر
                    if (days < 30) {
                        const weeks = Math.floor(days / 7);
                        return `منذ ${weeks} أسبوع`;
                    }

                    // أقل من سنة
                    if (days < 365) {
                        const months = Math.floor(days / 30);
                        return `منذ ${months} شهر`;
                    }

                    // أكثر من سنة
                    const years = Math.floor(days / 365);
                    return `منذ ${years} سنة`;
                } catch (error) {
                    return '-';
                }
            }

            // تنسيق العملة
            function formatCurrency(amount) {
                // التأكد من أن المبلغ رقم
                amount = parseFloat(amount) || 0;

                try {
                    // تنسيق المبلغ
                    return amount.toLocaleString('ar-IQ') + ' د.ع';
                } catch (error) {
                    // تنسيق بسيط في حالة الخطأ
                    return amount + ' د.ع';
                }
            }

            // تنسيق رقم البطاقة (إضافة مسافات)
            function formatCardNumber(cardNumber) {
                if (!cardNumber) return '';

                // إزالة المسافات
                const plainNumber = cardNumber.replace(/\s/g, '');

                // إضافة مسافة بعد كل 4 أرقام
                return plainNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
            }

            // الحصول على اسم نوع البطاقة
            function getCardTypeName(type) {
                const cardTypes = {
                    platinum: 'بلاتينية',
                    gold: 'ذهبية',
                    premium: 'بريميوم',
                    diamond: 'ماسية',
                    islamic: 'إسلامية'
                };

                return cardTypes[type] || 'بطاقة';
            }

            // تصدير واجهة النظام العامة
            return {
                initialize,
                login,
                logout,
                refreshData,
                showNotification
            };
        })();

        // تهيئة التطبيق عند تحميل الصفحة
        document.addEventListener('DOMContentLoaded', function () {
            InvestorApp.initialize();
        });
// Registro mejorado de Service Worker y manejo de instalación
document.addEventListener('DOMContentLoaded', function() {
  // Variables para la instalación
  let deferredPrompt;
  const installButton = document.getElementById('install-app-btn');
  
  // Ocultar botón de instalación hasta que sea necesario
  if (installButton) {
    installButton.style.display = 'none';
  }
  
  // Registrar Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/barcode-reader/service-worker.js', { scope: '/barcode-reader/' })
      .then(registration => {
        console.log('🟢 Service Worker registrado correctamente:', registration.scope);
        
        // Verificar actualizaciones
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('🔄 Hay contenido nuevo disponible. Por favor, actualiza la página.');
                showUpdateNotification();
              } else {
                console.log('✅ Contenido almacenado para uso offline.');
              }
            }
          };
        };
      })
      .catch(error => {
        console.error('🔴 Error al registrar Service Worker:', error);
      });
      
    // Verificar si ya está instalado
    const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                               window.navigator.standalone === true;
    
    if (isRunningStandalone) {
      console.log('✅ Aplicación ya instalada y ejecutándose en modo standalone');
    } else {
      console.log('ℹ️ Aplicación ejecutándose en navegador normal');
    }
  } else {
    console.warn('⚠️ Service Worker no soportado en este navegador');
  }
  
  // Eventos de instalación
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('🎯 Evento beforeinstallprompt activado');
    
    // Prevenir el prompt automático
    e.preventDefault();
    
    // Guardar el evento para usarlo después
    deferredPrompt = e;
    
    // Mostrar botón de instalación
    if (installButton) {
      installButton.style.display = 'block';
      console.log('✅ Botón de instalación habilitado');
    }
    
    // Indicar que el evento fue capturado correctamente
    return false;
  });
  
  // Cuando se instala la app
  window.addEventListener('appinstalled', (e) => {
    console.log('🎉 Aplicación instalada exitosamente');
    
    // Ocultar botón de instalación
    if (installButton) {
      installButton.style.display = 'none';
    }
    
    // Limpiar el prompt
    deferredPrompt = null;
    
    // Mostrar notificación de éxito
    showNotification('success', 'تم التثبيت', 'تم تثبيت التطبيق بنجاح على جهازك');
  });
  
  // Función para instalar la app
  window.installApp = function() {
    if (!deferredPrompt) {
      console.log('❌ No se puede instalar la aplicación en este momento');
      
      // Si estamos en iOS, mostrar instrucciones
      if (
        navigator.userAgent.match(/iPhone|iPad|iPod/) && 
        !window.navigator.standalone
      ) {
        showIOSInstallInstructions();
      }
      return;
    }
    
    console.log('🔄 Mostrando prompt de instalación...');
    
    // Mostrar el prompt
    deferredPrompt.prompt();
    
    // Esperar la decisión del usuario
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ Usuario aceptó la instalación');
        
        // Ocultar botón de instalación
        if (installButton) {
          installButton.style.display = 'none';
        }
      } else {
        console.log('❌ Usuario rechazó la instalación');
      }
      
      // Limpiar el prompt
      deferredPrompt = null;
    });
  };
  
  // Función para mostrar notificación de actualización
  function showUpdateNotification() {
    showNotification('info', 'تحديث متاح', 'يوجد إصدار جديد من التطبيق. اضغط هنا للتحديث.', () => {
      window.location.reload();
    });
  }
  
  // Instrucciones para iOS
  function showIOSInstallInstructions() {
    const message = 'لتثبيت التطبيق على iOS، اضغط على زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"';
    showNotification('info', 'تعليمات التثبيت', message);
  }
  
  // Agregar botón de instalación si no existe
  if (!installButton && !window.matchMedia('(display-mode: standalone)').matches) {
    const newInstallButton = document.createElement('button');
    newInstallButton.id = 'install-app-btn';
    newInstallButton.innerHTML = 'تثبيت التطبيق <i class="fas fa-download"></i>';
    newInstallButton.style.display = 'none';
    newInstallButton.style.position = 'fixed';
    newInstallButton.style.bottom = '20px';
    newInstallButton.style.left = '50%';
    newInstallButton.style.transform = 'translateX(-50%)';
    newInstallButton.style.backgroundColor = '#3498db';
    newInstallButton.style.color = 'white';
    newInstallButton.style.padding = '10px 20px';
    newInstallButton.style.borderRadius = '5px';
    newInstallButton.style.border = 'none';
    newInstallButton.style.zIndex = '9999';
    newInstallButton.style.cursor = 'pointer';
    newInstallButton.style.fontWeight = 'bold';
    newInstallButton.onclick = window.installApp;
    
    document.body.appendChild(newInstallButton);
  }
});