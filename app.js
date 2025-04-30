// ================= Firebase Authentication & Database Module =================
// هذا الملف يحتوي على الوظائف المتعلقة بالتحقق من المستخدمين وقاعدة البيانات

const InvestorCardFirebase = (function() {
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

    // معرف المستخدم الذي يحتوي على بطاقات المستثمرين
    // تم إضافة هذا المعرف بناءً على الرابط المقدم
    const INVESTOR_CARDS_USER_ID = "b7XlRaRqUEX2X6SdnF9fyV5SPi83";

    // متغيرات النظام
    let isInitialized = false;
    let firebaseInstance = null;
    let currentUserData = null;
    let currentCardData = null;
    
    // تهيئة Firebase
    function initializeFirebase() {
        return new Promise((resolve, reject) => {
            if (isInitialized) {
                resolve(true);
                return;
            }
            
            try {
                if (typeof firebase !== 'undefined') {
                    // تهيئة التطبيق إذا لم تكن مهيأة بالفعل
                    if (!firebase.apps.length) {
                        firebase.initializeApp(firebaseConfig);
                    } else {
                        firebase.app(); // استخدام التطبيق المُهيأ مسبقاً
                    }
                    
                    firebaseInstance = firebase;
                    isInitialized = true;
                    console.log('تم تهيئة Firebase بنجاح');
                    resolve(true);
                } else {
                    console.error('مكتبة Firebase غير متوفرة');
                    reject(new Error('مكتبة Firebase غير متوفرة'));
                }
            } catch (error) {
                console.error('خطأ في تهيئة Firebase:', error);
                reject(error);
            }
        });
    }
    
    // البحث عن بطاقة باستخدام رقم البطاقة و CVV
    function findCardByCredentials(cardNumber, cvv) {
        return new Promise((resolve, reject) => {
            if (!isInitialized) {
                reject(new Error('يجب تهيئة Firebase أولاً'));
                return;
            }
            
            // تنظيف رقم البطاقة من المسافات
            const cleanCardNumber = cardNumber.replace(/\s/g, '');
            
            console.log('البحث عن البطاقة في قاعدة البيانات:', cleanCardNumber);
            
            // استخدام المسار المحدد للمستثمرين بناءً على معرف المستخدم المحدد
            const dbRef = firebase.database().ref(`/users/${INVESTOR_CARDS_USER_ID}/investor_cards`);
            
            // استعلام مباشر للبطاقات
            dbRef.once('value')
                .then(snapshot => {
                    let foundCard = null;
                    
                    // البحث عبر بطاقات المستثمرين
                    snapshot.forEach(cardSnapshot => {
                        const card = cardSnapshot.val();
                        const cardKey = cardSnapshot.key;
                        
                        // تنظيف رقم البطاقة المخزنة من المسافات للمقارنة
                        const storedCardNumber = (card.cardNumber || '').toString().replace(/\s/g, '');
                        const storedCVV = (card.cvv || '').toString();
                        
                        console.log(`مقارنة: ${storedCardNumber} مع ${cleanCardNumber}, CVV: ${storedCVV} مع ${cvv}`);
                        
                        // التحقق من تطابق البيانات
                        if (storedCardNumber === cleanCardNumber && storedCVV === cvv) {
                            foundCard = { 
                                ...card, 
                                userKey: INVESTOR_CARDS_USER_ID,
                                cardKey: cardKey 
                            };
                            console.log('تم العثور على البطاقة:', foundCard);
                            return true; // للخروج من forEach
                        }
                    });
                    
                    if (foundCard) {
                        // البحث عن المستثمر المرتبط بالبطاقة (إذا كان موجوداً)
                        let investorData = null;
                        
                        // الحصول على بيانات المستثمر
                        if (foundCard.investorId) {
                            return firebase.database().ref(`/users/${INVESTOR_CARDS_USER_ID}/investors/${foundCard.investorId}`).once('value')
                                .then(investorSnapshot => {
                                    if (investorSnapshot.exists()) {
                                        investorData = investorSnapshot.val();
                                    }
                                    
                                    // الحصول على المعاملات المالية (إذا كانت موجودة)
                                    return firebase.database().ref(`/users/${INVESTOR_CARDS_USER_ID}/transactions`).once('value');
                                })
                                .then(transactionsSnapshot => {
                                    let transactions = [];
                                    
                                    if (transactionsSnapshot.exists()) {
                                        const allTransactions = transactionsSnapshot.val();
                                        
                                        // تصفية المعاملات الخاصة بالمستثمر
                                        if (allTransactions && typeof allTransactions === 'object') {
                                            Object.keys(allTransactions).forEach(transKey => {
                                                const transaction = allTransactions[transKey];
                                                if (transaction.investorId === foundCard.investorId) {
                                                    transactions.push({
                                                        ...transaction,
                                                        id: transKey
                                                    });
                                                }
                                            });
                                            
                                            // ترتيب المعاملات من الأحدث للأقدم
                                            transactions.sort((a, b) => {
                                                return new Date(b.date || 0) - new Date(a.date || 0);
                                            });
                                        }
                                    }
                                    
                                    // تخزين البيانات في المتغيرات العامة
                                    currentCardData = foundCard;
                                    currentUserData = {
                                        investor: investorData,
                                        transactions: transactions
                                    };
                                    
                                    // إرجاع النتيجة
                                    return {
                                        success: true,
                                        card: foundCard,
                                        investor: investorData,
                                        transactions: transactions
                                    };
                                });
                        } else {
                            // إذا لم يكن هناك معرف مستثمر مرتبط بالبطاقة
                            currentCardData = foundCard;
                            currentUserData = {
                                investor: null,
                                transactions: []
                            };
                            
                            // إرجاع النتيجة
                            return {
                                success: true,
                                card: foundCard,
                                investor: null,
                                transactions: []
                            };
                        }
                    } else {
                        // إذا لم يتم العثور على البطاقة
                        return {
                            success: false,
                            message: 'بيانات البطاقة غير صحيحة'
                        };
                    }
                })
                .then(result => {
                    resolve(result);
                })
                .catch(error => {
                    console.error('خطأ في البحث عن البطاقة:', error);
                    reject(error);
                });
        });
    }

    // البحث عن بطاقة باستخدام معرف البطاقة (للاستخدام مع الباركود)
    function findCardById(cardId) {
        return new Promise((resolve, reject) => {
            if (!isInitialized) {
                reject(new Error('يجب تهيئة Firebase أولاً'));
                return;
            }
            
            console.log('البحث عن البطاقة بالمعرف:', cardId);
            
            // استخدام المسار المحدد للمستثمرين
            const dbRef = firebase.database().ref(`/users/${INVESTOR_CARDS_USER_ID}/investor_cards/${cardId}`);
            
            // استعلام مباشر للبطاقة
            dbRef.once('value')
                .then(snapshot => {
                    if (snapshot.exists()) {
                        const card = snapshot.val();
                        const foundCard = { 
                            ...card, 
                            userKey: INVESTOR_CARDS_USER_ID,
                            cardKey: cardId 
                        };
                        
                        console.log('تم العثور على البطاقة:', foundCard);
                        
                        // البحث عن المستثمر المرتبط بالبطاقة (إذا كان موجوداً)
                        let investorData = null;
                        
                        // الحصول على بيانات المستثمر
                        if (foundCard.investorId) {
                            return firebase.database().ref(`/users/${INVESTOR_CARDS_USER_ID}/investors/${foundCard.investorId}`).once('value')
                                .then(investorSnapshot => {
                                    if (investorSnapshot.exists()) {
                                        investorData = investorSnapshot.val();
                                    }
                                    
                                    // الحصول على المعاملات المالية (إذا كانت موجودة)
                                    return firebase.database().ref(`/users/${INVESTOR_CARDS_USER_ID}/transactions`).once('value');
                                })
                                .then(transactionsSnapshot => {
                                    let transactions = [];
                                    
                                    if (transactionsSnapshot.exists()) {
                                        const allTransactions = transactionsSnapshot.val();
                                        
                                        // تصفية المعاملات الخاصة بالمستثمر
                                        if (allTransactions && typeof allTransactions === 'object') {
                                            Object.keys(allTransactions).forEach(transKey => {
                                                const transaction = allTransactions[transKey];
                                                if (transaction.investorId === foundCard.investorId) {
                                                    transactions.push({
                                                        ...transaction,
                                                        id: transKey
                                                    });
                                                }
                                            });
                                            
                                            // ترتيب المعاملات من الأحدث للأقدم
                                            transactions.sort((a, b) => {
                                                return new Date(b.date || 0) - new Date(a.date || 0);
                                            });
                                        }
                                    }
                                    
                                    // تخزين البيانات في المتغيرات العامة
                                    currentCardData = foundCard;
                                    currentUserData = {
                                        investor: investorData,
                                        transactions: transactions
                                    };
                                    
                                    // إرجاع النتيجة
                                    return {
                                        success: true,
                                        card: foundCard,
                                        investor: investorData,
                                        transactions: transactions,
                                        requiresPin: foundCard.features && foundCard.features.enablePin && foundCard.pin
                                    };
                                });
                        } else {
                            // إذا لم يكن هناك معرف مستثمر مرتبط بالبطاقة
                            currentCardData = foundCard;
                            currentUserData = {
                                investor: null,
                                transactions: []
                            };
                            
                            // إرجاع النتيجة
                            return {
                                success: true,
                                card: foundCard,
                                investor: null,
                                transactions: [],
                                requiresPin: foundCard.features && foundCard.features.enablePin && foundCard.pin
                            };
                        }
                    } else {
                        // إذا لم يتم العثور على البطاقة
                        return {
                            success: false,
                            message: 'لم يتم العثور على البطاقة'
                        };
                    }
                })
                .then(result => {
                    resolve(result);
                })
                .catch(error => {
                    console.error('خطأ في البحث عن البطاقة:', error);
                    reject(error);
                });
        });
    }
    
    // التحقق من رمز PIN للبطاقة
    function verifyCardPin(cardId, pin) {
        return new Promise((resolve, reject) => {
            if (!isInitialized) {
                reject(new Error('يجب تهيئة Firebase أولاً'));
                return;
            }
            
            if (!currentCardData || currentCardData.cardKey !== cardId) {
                reject(new Error('يجب تحميل بيانات البطاقة أولاً'));
                return;
            }
            
            // التحقق من الرمز
            if (currentCardData.pin === pin) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }
    
    // الحصول على بيانات البطاقة الحالية
    function getCurrentCardData() {
        return currentCardData;
    }
    
    // الحصول على بيانات المستخدم الحالي
    function getCurrentUserData() {
        return currentUserData;
    }
    
    // تسجيل الخروج
    function logout() {
        currentCardData = null;
        currentUserData = null;
    }
    
    // الحصول على صورة البطاقة حسب نوعها
    function getCardTypeStyle(cardType) {
        const cardTypes = {
            'platinum': {
                backgroundColor: '#303030',
                textColor: '#ffffff',
                chipColor: '#FFD700',
                name: 'بلاتينية'
            },
            'gold': {
                backgroundColor: '#D4AF37',
                textColor: '#000000',
                chipColor: '#ffffff',
                name: 'ذهبية'
            },
            'premium': {
                backgroundColor: '#1F3A5F',
                textColor: '#ffffff',
                chipColor: '#C0C0C0',
                name: 'بريميوم'
            },
            'diamond': {
                backgroundColor: '#16213E',
                textColor: '#ffffff',
                chipColor: '#B9F2FF',
                name: 'ماسية'
            },
            'islamic': {
                backgroundColor: '#006B3C',
                textColor: '#ffffff',
                chipColor: '#F8C300',
                name: 'إسلامية'
            },
            'custom': {
                backgroundColor: '#3498db',
                textColor: '#ffffff',
                chipColor: '#C0C0C0',
                name: 'مخصصة'
            }
        };
        
        return cardTypes[cardType] || cardTypes.premium;
    }
    
    // التسجيل للاستماع إلى تغييرات بيانات البطاقة
    function subscribeToCardChanges(cardId, userKey, callback) {
        if (!isInitialized || !cardId || !userKey) {
            return null;
        }
        
        const cardRef = firebase.database().ref(`/users/${userKey}/investor_cards/${cardId}`);
        
        cardRef.on('value', snapshot => {
            const updatedCardData = snapshot.val();
            if (updatedCardData) {
                currentCardData = {
                    ...updatedCardData,
                    userKey: userKey,
                    cardKey: cardId
                };
                
                if (typeof callback === 'function') {
                    callback(currentCardData);
                }
            }
        });
        
        // إرجاع مرجع للإلغاء الاشتراك لاحقاً
        return cardRef;
    }
    
    // إلغاء الاشتراك
    function unsubscribeFromChanges(reference) {
        if (reference) {
            reference.off();
        }
    }
    
    // الحصول على مرجع قاعدة البيانات
    function getDatabaseRef(path) {
        if (!isInitialized) {
            console.error('يجب تهيئة Firebase أولاً');
            return null;
        }
        
        return firebase.database().ref(path);
    }
    
    // التحقق مما إذا كان المستخدم مسجل الدخول
    function isUserLoggedIn() {
        return currentCardData !== null;
    }
    
    // واجهة برمجة التطبيق العامة
    return {
        initialize: initializeFirebase,
        findCardByCredentials: findCardByCredentials,
        findCardById: findCardById,
        verifyCardPin: verifyCardPin,
        getCurrentCardData: getCurrentCardData,
        getCurrentUserData: getCurrentUserData,
        getCardTypeStyle: getCardTypeStyle,
        logout: logout,
        subscribeToCardChanges: subscribeToCardChanges,
        unsubscribeFromChanges: unsubscribeFromChanges,
        getDatabaseRef: getDatabaseRef,
        isUserLoggedIn: isUserLoggedIn
    };
})();

// ================= Main Application Module =================
// هذا الملف يحتوي على المنطق الرئيسي للتطبيق

const InvestorCardApp = (function() {
    // متغيرات التطبيق
    let cardSubscription = null;
    let currentPage = 'auth';
    let qrScanner = null;
    
    // تهيئة التطبيق
    function initialize() {
        // تهيئة Firebase
        InvestorCardFirebase.initialize()
            .then(() => {
                console.log('تم تهيئة التطبيق بنجاح');
                setupEventListeners();
                checkLoggedInState();
            })
            .catch(error => {
                console.error('خطأ في تهيئة التطبيق:', error);
                showToast('خطأ في التهيئة', 'حدث خطأ أثناء تهيئة التطبيق', 'error');
            });
    }
    
    // تهيئة مستمعي الأحداث
    function setupEventListeners() {
        // مستمع نموذج تسجيل الدخول
        const authForm = document.getElementById('auth-form');
        if (authForm) {
            authForm.addEventListener('submit', handleLogin);
        }
        
        // مستمع تدوير البطاقة
        const flipCardBtn = document.getElementById('flip-card-btn');
        if (flipCardBtn) {
            flipCardBtn.addEventListener('click', () => {
                const card = document.getElementById('investor-card');
                if (card) {
                    card.classList.toggle('flipped');
                }
            });
        }
        
        // مستمع لمسح QR Code
        const scanQrBtn = document.getElementById('scan-qr-btn');
        if (scanQrBtn) {
            scanQrBtn.addEventListener('click', openQRScanner);
        }
        
        // مستمع إغلاق QR Scanner
        const closeScanner = document.getElementById('close-scanner');
        if (closeScanner) {
            closeScanner.addEventListener('click', () => {
                document.getElementById('qr-scanner').classList.remove('active');
                stopQrScanner(); // إضافة وظيفة إيقاف الماسح
            });
        }
        
        // مستمع لأزرار القائمة السفلية
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', handleTabChange);
        });
        
        // مستمع لفلاتر العمليات
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', handleTransactionFilter);
        });
        
        // مستمعي صفحة الملف الشخصي
        document.querySelectorAll('.profile-tab').forEach(tab => {
            tab.addEventListener('click', handleProfileTabChange);
        });
        
        // مستمع زر تسجيل الخروج
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', showLogoutConfirmation);
        }
        
        // مستمع تأكيد تسجيل الخروج
        const confirmLogout = document.getElementById('confirm-logout');
        if (confirmLogout) {
            confirmLogout.addEventListener('click', handleLogout);
        }
        
        // مستمع إلغاء تسجيل الخروج
        const cancelLogout = document.getElementById('cancel-logout');
        if (cancelLogout) {
            cancelLogout.addEventListener('click', () => {
                document.getElementById('logout-confirmation').classList.remove('active');
            });
        }
        
        // مستمع زر المشاركة
        const shareBtn = document.getElementById('share-card-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', handleShare);
        }
        
        // مستمع زر عرض QR Code
        const showQrBtn = document.getElementById('show-qr-btn');
        if (showQrBtn) {
            showQrBtn.addEventListener('click', handleShowQR);
        }
        
        // مستمع تبديل الوضع الداكن
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            // تحقق من الإعدادات المحفوظة
            const isDarkMode = localStorage.getItem('darkMode') === 'true';
            darkModeToggle.checked = isDarkMode;
            
            if (isDarkMode) {
                document.body.classList.add('dark-mode');
            }
            
            darkModeToggle.addEventListener('change', function() {
                document.body.classList.toggle('dark-mode', this.checked);
                localStorage.setItem('darkMode', this.checked);
            });
        }
        
        // مستمع لنموذج إدخال PIN
        document.addEventListener('submit', function(e) {
            if (e.target.id === 'pin-form') {
                e.preventDefault();
                const pinInput = document.getElementById('card-pin-input');
                if (pinInput) {
                    verifyPinAndLogin(pinInput.value);
                }
            }
        });
    }
    
    // التحقق من حالة تسجيل الدخول
    function checkLoggedInState() {
        // التحقق من وجود بيانات بطاقة محفوظة
        const savedCardNumber = localStorage.getItem('savedCardNumber');
        const savedCardCVV = localStorage.getItem('savedCardCVV');
        
        if (savedCardNumber && savedCardCVV) {
            // محاولة تسجيل الدخول تلقائياً
            showLoading(true);
            loginWithCredentials(savedCardNumber, savedCardCVV, true)
                .catch(error => {
                    console.error('فشل تسجيل الدخول التلقائي:', error);
                    navigateToPage('auth');
                })
                .finally(() => {
                    showLoading(false);
                });
        } else {
            navigateToPage('auth');
        }
    }
    
    // معالجة تسجيل الدخول
    function handleLogin(e) {
        e.preventDefault();
        
        const cardNumber = document.getElementById('card-number').value;
        const cvv = document.getElementById('cvv').value;
        const rememberMe = document.getElementById('remember-me').checked;
        
        // التحقق من صحة البيانات
        let isValid = true;
        
        if (!cardNumber) {
            document.getElementById('card-number-error').textContent = 'يرجى إدخال رقم البطاقة';
            isValid = false;
        } else {
            document.getElementById('card-number-error').textContent = '';
        }
        
        if (!cvv) {
            document.getElementById('cvv-error').textContent = 'يرجى إدخال رمز التحقق';
            isValid = false;
        } else {
            document.getElementById('cvv-error').textContent = '';
        }
        
        if (isValid) {
            // إظهار مؤشر التحميل
            showLoading(true);
            
            // محاولة تسجيل الدخول
            loginWithCredentials(cardNumber, cvv, rememberMe)
                .finally(() => {
                    showLoading(false);
                });
        }
    }
    
    // تسجيل الدخول باستخدام البيانات
    function loginWithCredentials(cardNumber, cvv, rememberMe) {
        return InvestorCardFirebase.findCardByCredentials(cardNumber, cvv)
            .then(result => {
                if (result.success) {
                    // حفظ البيانات في التخزين المحلي إذا تم تحديد "تذكرني"
                    if (rememberMe) {
                        localStorage.setItem('savedCardNumber', cardNumber);
                        localStorage.setItem('savedCardCVV', cvv);
                    }
                    
                    // الاشتراك في تحديثات البطاقة
                    subscribeToCardUpdates(result.card);
                    
                    // تحديث واجهة المستخدم
                    updateUIWithCardData(result.card);
                    updateUIWithInvestorData(result.investor);
                    updateUIWithTransactions(result.transactions);
                    
                    // إظهار إشعار نجاح
                    showToast('تم تسجيل الدخول', 'تم التحقق من البطاقة بنجاح', 'success');
                    
                    // الانتقال إلى الصفحة الرئيسية
                    navigateToPage('dashboard');
                    activateTab('dashboard');
                    
                    return result;
                } else {
                    // إظهار رسالة الخطأ
                    document.getElementById('card-number-error').textContent = result.message || 'بيانات غير صحيحة';
                    throw new Error(result.message || 'بيانات غير صحيحة');
                }
            })
            .catch(error => {
                console.error('خطأ في تسجيل الدخول:', error);
                showToast('خطأ في تسجيل الدخول', error.message || 'حدث خطأ أثناء محاولة تسجيل الدخول', 'error');
                throw error;
            });
    }
    
    // تسجيل الدخول باستخدام معرف البطاقة (للباركود)
    function loginWithCardId(cardId) {
        showLoading(true);
        
        return InvestorCardFirebase.findCardById(cardId)
            .then(result => {
                if (result.success) {
                    // التحقق مما إذا كانت البطاقة تتطلب رمز PIN
                    if (result.requiresPin) {
                        // إظهار نموذج إدخال PIN
                        showLoading(false);
                        showPinEntryForm(cardId);
                        return { pendingPin: true };
                    }
                    
                    // إذا لم تكن تتطلب PIN، قم بتسجيل الدخول مباشرة
                    // الاشتراك في تحديثات البطاقة
                    subscribeToCardUpdates(result.card);
                    
                    // تحديث واجهة المستخدم
                    updateUIWithCardData(result.card);
                    updateUIWithInvestorData(result.investor);
                    updateUIWithTransactions(result.transactions);
                    
                    // إظهار إشعار نجاح
                    showToast('تم تسجيل الدخول', 'تم التحقق من البطاقة بنجاح', 'success');
                    
                    // الانتقال إلى الصفحة الرئيسية
                    navigateToPage('dashboard');
                    activateTab('dashboard');
                    
                    return result;
                } else {
                    // إظهار رسالة الخطأ
                    showToast('خطأ في المصادقة', result.message || 'لم يتم العثور على البطاقة', 'error');
                    throw new Error(result.message || 'لم يتم العثور على البطاقة');
                }
            })
            .catch(error => {
                console.error('خطأ في تسجيل الدخول بمعرف البطاقة:', error);
                showToast('خطأ في تسجيل الدخول', error.message || 'حدث خطأ أثناء محاولة تسجيل الدخول', 'error');
                throw error;
            })
            .finally(() => {
                showLoading(false);
            });
    }
    
    // عرض نموذج إدخال PIN
    function showPinEntryForm(cardId) {
        // إنشاء عنصر نموذج PIN
        const pinFormOverlay = document.createElement('div');
        pinFormOverlay.className = 'confirmation-dialog active';
        pinFormOverlay.id = 'pin-overlay';
        
        pinFormOverlay.innerHTML = `
            <div class="confirmation-content">
                <div class="confirmation-title">إدخال رمز PIN</div>
                <p>يرجى إدخال رمز PIN للوصول إلى البطاقة</p>
                <form id="pin-form">
                    <div style="margin: 20px 0;">
                        <input type="password" id="card-pin-input" placeholder="أدخل رمز PIN"
                               style="width: 100%; padding: 15px; border-radius: 10px; border: 1px solid #ddd; text-align: center; font-size: 20px;"
                               pattern="[0-9]*" inputmode="numeric" maxlength="4" autocomplete="off" required>
                    </div>
                    <div class="confirmation-actions">
                        <button type="button" class="btn btn-outline" id="cancel-pin-btn">إلغاء</button>
                        <button type="submit" class="btn btn-primary">تأكيد</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(pinFormOverlay);
        
        // التركيز على حقل الإدخال
        document.getElementById('card-pin-input').focus();
        
        // مستمع لزر الإلغاء
        document.getElementById('cancel-pin-btn').addEventListener('click', function() {
            pinFormOverlay.remove();
            navigateToPage('auth');
        });
        
        // حفظ معرف البطاقة في عنصر النموذج للاستخدام لاحقاً
        pinFormOverlay.setAttribute('data-card-id', cardId);
    }
    
    // التحقق من رمز PIN وتسجيل الدخول
    function verifyPinAndLogin(pin) {
        const pinOverlay = document.getElementById('pin-overlay');
        if (!pinOverlay) return;
        
        const cardId = pinOverlay.getAttribute('data-card-id');
        if (!cardId) {
            pinOverlay.remove();
            return;
        }
        
        // إظهار مؤشر التحميل
        showLoading(true);
        
        // التحقق من رمز PIN
        InvestorCardFirebase.verifyCardPin(cardId, pin)
            .then(isValid => {
                if (isValid) {
                    // PIN صحيح، استمر في تسجيل الدخول
                    const card = InvestorCardFirebase.getCurrentCardData();
                    const userData = InvestorCardFirebase.getCurrentUserData();
                    
                    // الاشتراك في تحديثات البطاقة
                    subscribeToCardUpdates(card);
                    
                    // تحديث واجهة المستخدم
                    updateUIWithCardData(card);
                    updateUIWithInvestorData(userData.investor);
                    updateUIWithTransactions(userData.transactions);
                    
                    // إظهار إشعار نجاح
                    showToast('تم تسجيل الدخول', 'تم التحقق من البطاقة بنجاح', 'success');
                    
                    // إزالة نموذج PIN
                    pinOverlay.remove();
                    
                    // الانتقال إلى الصفحة الرئيسية
                    navigateToPage('dashboard');
                    activateTab('dashboard');
                } else {
                    // PIN غير صحيح
                    const pinInput = document.getElementById('card-pin-input');
                    pinInput.value = '';
                    pinInput.focus();
                    
                    // إضافة تأثير الاهتزاز للإشارة إلى الخطأ
                    pinInput.classList.add('shake');
                    setTimeout(() => {
                        pinInput.classList.remove('shake');
                    }, 500);
                    
                    showToast('رمز غير صحيح', 'الرجاء التحقق من رمز PIN وإعادة المحاولة', 'error');
                }
            })
            .catch(error => {
                console.error('خطأ في التحقق من رمز PIN:', error);
                showToast('خطأ في التحقق', 'حدث خطأ أثناء التحقق من الرمز', 'error');
            })
            .finally(() => {
                showLoading(false);
            });
    }
    
    // الاشتراك في تحديثات البطاقة
    function subscribeToCardUpdates(card) {
        // إلغاء الاشتراك السابق إذا وجد
        if (cardSubscription) {
            InvestorCardFirebase.unsubscribeFromChanges(cardSubscription);
        }
        
        // الاشتراك في تحديثات البطاقة الجديدة
        cardSubscription = InvestorCardFirebase.subscribeToCardChanges(
            card.cardKey,
            card.userKey,
            updatedCard => {
                // تحديث واجهة المستخدم عند تغيير البيانات
                updateUIWithCardData(updatedCard);
            }
        );
    }
    
    // تحديث واجهة المستخدم ببيانات البطاقة
    function updateUIWithCardData(card) {
        if (!card) return;
        
        // الحصول على أنماط البطاقة
        const cardStyle = InvestorCardFirebase.getCardTypeStyle(card.cardType);
        
        // تحديث عناصر البطاقة
        const investorCard = document.getElementById('investor-card');
        
        if (investorCard) {
            // تحديث لون وخلفية البطاقة
            investorCard.style.backgroundColor = cardStyle.backgroundColor;
            investorCard.style.color = cardStyle.textColor;
            
            // إضافة فئة نوع البطاقة
            investorCard.className = 'investor-card';
            investorCard.classList.add(card.cardType);
        }
        
        // تحديث بيانات البطاقة
        setElementText('card-brand', cardStyle.name);
        setElementText('card-number-display', formatCardNumber(card.cardNumber));
        setElementText('card-name', card.investorName || 'المستثمر');
        setElementText('card-phone', card.investorPhone || '');
        
        // تنسيق تاريخ الانتهاء
        const expiryDate = new Date(card.expiryDate);
        const expiryFormatted = `${(expiryDate.getMonth() + 1).toString().padStart(2, '0')}/${expiryDate.getFullYear().toString().slice(2)}`;
        setElementText('card-expiry', expiryFormatted);
        
        // تحديث CVV (إظهار النجوم بدلاً من القيمة الفعلية)
        setElementText('card-cvv-display', '***');
        
        // تحديث رمز QR
        updateQRCode(card.id || card.cardKey);
    }
    
    // تحديث واجهة المستخدم ببيانات المستثمر
    function updateUIWithInvestorData(investor) {
        if (!investor) return;
        
        // تحديث بيانات التفاصيل
        const cardData = InvestorCardFirebase.getCurrentCardData();
        
        // حساب الرصيد والأرباح
        const totalBalance = investor.amount || 0;
        const profitRate = (investor.profitRate || 17.5) / 100;
        const monthlyProfit = Math.round(totalBalance * profitRate / 12);
        
        // تحديث إحصائيات الرصيد والأرباح
        setElementText('total-balance', formatCurrency(totalBalance));
        setElementText('total-profit', formatCurrency(monthlyProfit));
        
        // تحديث صفحة التفاصيل
        updateDetailsPage(investor, cardData);
        
        // تحديث صفحة الملف الشخصي
        updateProfilePage(investor, cardData);
        
        // إنشاء الرسوم البيانية
        createCharts(investor);
    }
    
    // تحديث واجهة المستخدم بالمعاملات
    function updateUIWithTransactions(transactions) {
        if (!transactions || !Array.isArray(transactions)) {
            transactions = [];
        }
        
        // تحديث العمليات الحديثة في الصفحة الرئيسية
        const recentTransactionsContainer = document.getElementById('recent-transactions');
        if (recentTransactionsContainer) {
            // فرز المعاملات حسب التاريخ (من الأحدث للأقدم)
            const sortedTransactions = [...transactions].sort((a, b) => {
                return new Date(b.date || 0) - new Date(a.date || 0);
            });
            
            // أخذ أحدث 3 معاملات
            const recentTransactions = sortedTransactions.slice(0, 3);
            
            // تفريغ الحاوية
            recentTransactionsContainer.innerHTML = '';
            
            // إضافة المعاملات
            if (recentTransactions.length > 0) {
                recentTransactions.forEach(transaction => {
                    const transactionItem = document.createElement('div');
                    transactionItem.className = 'transaction-item';
                    transactionItem.innerHTML = `
                        <div class="transaction-icon ${transaction.type || 'deposit'}">
                            <i class="fas fa-${getTransactionIcon(transaction.type)}"></i>
                        </div>
                        <div class="transaction-details">
                            <div class="transaction-title">${getTransactionTitle(transaction.type)}</div>
                            <div class="transaction-date">${formatDate(transaction.date)}</div>
                        </div>
                        <div class="transaction-amount ${transaction.type || 'deposit'}">${formatTransactionAmount(transaction.amount, transaction.type)}</div>
                    `;
                    recentTransactionsContainer.appendChild(transactionItem);
                });
            } else {
                recentTransactionsContainer.innerHTML = '<div class="empty-state">لا توجد معاملات حديثة</div>';
            }
        }
        
        // تحديث صفحة العمليات
        updateTransactionsPage(transactions);
    }
    
    // تحديث صفحة التفاصيل
    function updateDetailsPage(investor, card) {
        if (!investor || !card) return;
        
        // تحديث بيانات المستثمر
        setElementText('profile-name', investor.name || card.investorName || 'المستثمر');
        
        // حساب الأرباح
        const totalBalance = investor.amount || 0;
        const profitRate = (investor.profitRate || 17.5) / 100;
        const monthlyProfit = Math.round(totalBalance * profitRate / 12);
        const yearlyProfit = monthlyProfit * 12;
        
        // تحديث الإحصائيات في صفحة التفاصيل
        const detailContainers = document.querySelectorAll('.detail-container');
        
        if (detailContainers.length >= 2) {
            // تحديث البيانات الشخصية
            detailContainers[0].innerHTML = `
                <div class="detail-item">
                    <div class="detail-label">الاسم</div>
                    <div class="detail-value">${investor.name || card.investorName || 'المستثمر'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">رقم الهاتف</div>
                    <div class="detail-value">${investor.phone || card.investorPhone || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">البريد الإلكتروني</div>
                    <div class="detail-value">${investor.email || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">تاريخ الاشتراك</div>
                    <div class="detail-value">${formatDate(investor.joinDate || card.createdAt)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">رقم البطاقة</div>
                    <div class="detail-value">${formatCardNumber(card.cardNumber)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">تاريخ الانتهاء</div>
                    <div class="detail-value">${formatDate(card.expiryDate)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">نوع البطاقة</div>
                    <div class="detail-value">${InvestorCardFirebase.getCardTypeStyle(card.cardType).name}</div>
                </div>
            `;
            
            // تحديث البيانات المالية
            detailContainers[1].innerHTML = `
                <div class="detail-item">
                    <div class="detail-label">إجمالي الاستثمار</div>
                    <div class="detail-value">${formatCurrency(totalBalance)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">العائد الشهري</div>
                    <div class="detail-value">${formatCurrency(monthlyProfit)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">نسبة الربح</div>
                    <div class="detail-value">${(investor.profitRate || 17.5)}%</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">العائد السنوي</div>
                    <div class="detail-value">${formatCurrency(yearlyProfit)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">تاريخ آخر الأرباح</div>
                    <div class="detail-value">${formatDate(investor.lastProfitDate || new Date())}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">تاريخ الأرباح القادمة</div>
                    <div class="detail-value">${formatNextProfitDate(investor.lastProfitDate)}</div>
                </div>
            `;
        }
    }
    
    // تحديث صفحة العمليات
    function updateTransactionsPage(transactions) {
        if (!transactions || !Array.isArray(transactions)) {
            transactions = [];
        }
        
        const allTransactionsContainer = document.getElementById('all-transactions');
        if (!allTransactionsContainer) return;
        
        // تنظيم المعاملات حسب الشهر
        const transactionsByMonth = {};
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const month = date.getMonth();
            const year = date.getFullYear();
            const monthKey = `${year}-${month}`;
            
            if (!transactionsByMonth[monthKey]) {
                transactionsByMonth[monthKey] = [];
            }
            
            transactionsByMonth[monthKey].push(transaction);
        });
        
        // فرز الأشهر تنازلياً
        const sortedMonths = Object.keys(transactionsByMonth).sort((a, b) => {
            const [yearA, monthA] = a.split('-').map(Number);
            const [yearB, monthB] = b.split('-').map(Number);
            
            if (yearA !== yearB) {
                return yearB - yearA;
            }
            return monthB - monthA;
        });
        
        // تفريغ الحاوية
        allTransactionsContainer.innerHTML = '';
        
        // إنشاء قسم لكل شهر
        if (sortedMonths.length > 0) {
            sortedMonths.forEach(monthKey => {
                const [year, month] = monthKey.split('-').map(Number);
                const monthName = getMonthName(month);
                
                // إضافة فاصل الشهر
                const monthSeparator = document.createElement('div');
                monthSeparator.className = 'month-separator';
                monthSeparator.textContent = `${monthName} ${year}`;
                allTransactionsContainer.appendChild(monthSeparator);
                
                // فرز المعاملات داخل الشهر حسب التاريخ
                const monthTransactions = transactionsByMonth[monthKey].sort((a, b) => {
                    return new Date(b.date) - new Date(a.date);
                });
                
                // إضافة المعاملات
                monthTransactions.forEach(transaction => {
                    const transactionItem = document.createElement('div');
                    transactionItem.className = 'transaction-item';
                    transactionItem.setAttribute('data-type', transaction.type || 'deposit');
                    
                    transactionItem.innerHTML = `
                        <div class="transaction-icon ${transaction.type || 'deposit'}">
                            <i class="fas fa-${getTransactionIcon(transaction.type)}"></i>
                        </div>
                        <div class="transaction-details">
                            <div class="transaction-title">${getTransactionTitle(transaction.type)}</div>
                            <div class="transaction-date">${formatDate(transaction.date)}</div>
                        </div>
                        <div class="transaction-amount ${transaction.type || 'deposit'}">${formatTransactionAmount(transaction.amount, transaction.type)}</div>
                    `;
                    
                    allTransactionsContainer.appendChild(transactionItem);
                });
            });
        } else {
            // رسالة عند عدم وجود معاملات
            allTransactionsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exchange-alt empty-icon"></i>
                    <p class="empty-title">لا توجد معاملات</p>
                    <p class="empty-description">ستظهر هنا سجل معاملاتك المالية</p>
                </div>
            `;
        }
    }
    
    // تحديث صفحة الملف الشخصي
    function updateProfilePage(investor, card) {
        if (!investor || !card) return;
        
        // تحديث بيانات المستثمر
        setElementText('profile-name', investor.name || card.investorName || 'المستثمر');
        
        // تحديث الصورة الرمزية (الأحرف الأولى من الاسم)
        const profileAvatar = document.querySelector('.profile-avatar');
        if (profileAvatar) {
            const name = investor.name || card.investorName || 'المستثمر';
            profileAvatar.textContent = getInitials(name);
        }
        
        // تحديث تاريخ الاشتراك
        const profileDetails = document.querySelector('.profile-details');
        if (profileDetails) {
            profileDetails.textContent = `مستثمر منذ ${formatDate(investor.joinDate || card.createdAt, 'month-year')}`;
        }
        
        // تحديث بيانات قسم المعلومات الشخصية
        const personalInfoSection = document.getElementById('personal-info-section');
        if (personalInfoSection) {
            const detailContainer = personalInfoSection.querySelector('.detail-container');
            if (detailContainer) {
                detailContainer.innerHTML = `
                    <div class="detail-item">
                        <div class="detail-label">الاسم الكامل</div>
                        <div class="detail-value">${investor.name || card.investorName || 'المستثمر'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">رقم الهاتف</div>
                        <div class="detail-value">${investor.phone || card.investorPhone || '-'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">البريد الإلكتروني</div>
                        <div class="detail-value">${investor.email || '-'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">العنوان</div>
                        <div class="detail-value">${investor.address || '-'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">تاريخ الميلاد</div>
                        <div class="detail-value">${formatDate(investor.birthDate) || '-'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">رقم البطاقة الشخصية</div>
                        <div class="detail-value">${investor.idNumber || '-'}</div>
                    </div>
                `;
            }
        }
    }
    
    // إنشاء الرسوم البيانية
    function createCharts(investor) {
        if (!investor) return;
        
        try {
            // رسم بياني لتطور الاستثمار
            createInvestmentChart(investor);
            
            // رسم بياني للأرباح
            createProfitsChart(investor);
        } catch (error) {
            console.error('خطأ في إنشاء الرسوم البيانية:', error);
        }
    }
    
    // إنشاء رسم بياني لتطور الاستثمار
    function createInvestmentChart(investor) {
        const chartCanvas = document.getElementById('investment-chart');
        if (!chartCanvas || typeof Chart === 'undefined') return;
        
        // إزالة الرسم البياني السابق إذا وجد
        if (window.investmentChart) {
            window.investmentChart.destroy();
        }
        
        // الحصول على معاملات المستثمر
        const transactions = InvestorCardFirebase.getCurrentUserData()?.transactions || [];
        
        // إنشاء بيانات لـ 6 أشهر للرسم البياني
        const months = [];
        const balanceData = [];
        const profitData = [];
        
        // تاريخ البداية (6 أشهر للخلف)
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 5);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        
        // إنشاء البيانات الشهرية
        let currentBalance = investor.amount || 0;
        const monthlyProfitRate = (investor.profitRate || 17.5) / 100 / 12;
        
        for (let i = 0; i < 6; i++) {
            const date = new Date(startDate);
            date.setMonth(startDate.getMonth() + i);
            
            const monthName = getMonthName(date.getMonth());
            months.push(monthName);
            
            // حساب الأرباح الشهرية
            const monthlyProfit = Math.round(currentBalance * monthlyProfitRate);
            profitData.push(monthlyProfit);
            
            // إضافة الرصيد الشهري
            balanceData.push(currentBalance);
            
            // زيادة الرصيد بالأرباح للشهر التالي (تبسيط)
            currentBalance += monthlyProfit;
        }
        
        // إنشاء الرسم البياني
        window.investmentChart = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'الرصيد الكلي',
                    data: balanceData,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'الأرباح الشهرية',
                    data: profitData,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                family: "'Tajawal', sans-serif"
                            }
                        }
                    },
                    tooltip: {
                        bodyFont: {
                            family: "'Tajawal', sans-serif"
                        },
                        titleFont: {
                            family: "'Tajawal', sans-serif"
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: {
                                family: "'Tajawal', sans-serif"
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                family: "'Tajawal', sans-serif"
                            }
                        }
                    }
                }
            }
        });
    }
    
    // إنشاء رسم بياني للأرباح
    function createProfitsChart(investor) {
        const chartCanvas = document.getElementById('profits-chart');
        if (!chartCanvas || !investor || typeof Chart === 'undefined') return;
        
        // إزالة الرسم البياني السابق إذا وجد
        if (window.profitsChart) {
            window.profitsChart.destroy();
        }
        
        // إنشاء بيانات لـ 6 أشهر للرسم البياني
        const months = [];
        const profitData = [];
        
        // تاريخ البداية (6 أشهر للخلف)
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 5);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        
        // إنشاء البيانات الشهرية
        let currentBalance = investor.amount || 0;
        const monthlyProfitRate = (investor.profitRate || 17.5) / 100 / 12;
        
        let cumulativeProfit = 0;
        
        for (let i = 0; i < 6; i++) {
            const date = new Date(startDate);
            date.setMonth(startDate.getMonth() + i);
            
            const monthName = getMonthName(date.getMonth());
            months.push(monthName);
            
            // حساب الأرباح الشهرية
            const monthlyProfit = Math.round(currentBalance * monthlyProfitRate);
            cumulativeProfit += monthlyProfit;
            
            // إضافة الأرباح التراكمية
            profitData.push(cumulativeProfit);
            
            // زيادة الرصيد بالأرباح للشهر التالي (تبسيط)
            currentBalance += monthlyProfit;
        }
        
        // إنشاء الرسم البياني
        window.profitsChart = new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'الأرباح التراكمية',
                    data: profitData,
                    backgroundColor: 'rgba(46, 204, 113, 0.7)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                family: "'Tajawal', sans-serif"
                            }
                        }
                    },
                    tooltip: {
                        bodyFont: {
                            family: "'Tajawal', sans-serif"
                        },
                        titleFont: {
                            family: "'Tajawal', sans-serif"
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: {
                                family: "'Tajawal', sans-serif"
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                family: "'Tajawal', sans-serif"
                            }
                        }
                    }
                }
            }
        });
    }
    
    // تحديث رمز QR
    function updateQRCode(cardId) {
        try {
            const qrCodeContainer = document.getElementById('card-qr-code');
            if (qrCodeContainer && typeof QRCode !== 'undefined') {
                // مسح المحتوى الحالي
                qrCodeContainer.innerHTML = '';
                
                // إنشاء رمز QR جديد
                new QRCode(qrCodeContainer, {
                    text: cardId || "INV-CARD-DEFAULT",
                    width: 70,
                    height: 70,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        } catch (error) {
            console.error('خطأ في إنشاء QR Code:', error);
        }
    }
    
    // فتح ماسح QR
    function openQRScanner() {
        const qrScanner = document.getElementById('qr-scanner');
        if (qrScanner) {
            qrScanner.classList.add('active');
            
            // تهيئة ماسح الباركود
            initQrScanner();
        }
    }
    
    // تهيئة ماسح الباركود
    function initQrScanner() {
        // إذا كان الماسح مهيأ بالفعل، لا تعيد التهيئة
        if (qrScanner) {
            return;
        }
        
        // التحقق من وجود مكتبة Html5Qrcode
        if (typeof Html5Qrcode === 'undefined') {
            // إضافة مكتبة Html5Qrcode
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/html5-qrcode@2.3.8/dist/html5-qrcode.min.js';
            script.onload = () => {
                setupQrScanner();
            };
            script.onerror = () => {
                console.error('فشل تحميل مكتبة مسح الباركود');
                showToast('خطأ في تحميل المكتبة', 'فشل تحميل مكتبة مسح الباركود', 'error');
            };
            document.head.appendChild(script);
        } else {
            setupQrScanner();
        }
    }
    
    // إعداد ماسح الباركود
    function setupQrScanner() {
        try {
            // إيقاف أي ماسح قديم
            if (qrScanner) {
                qrScanner.stop();
            }
            
            // تهيئة الماسح الجديد
            qrScanner = new Html5Qrcode("qr-scanner-area");
            
            // بدء المسح
            qrScanner.start(
                { facingMode: "environment" }, // استخدام الكاميرا الخلفية
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                // نجاح المسح
                (decodedText) => {
                    // إيقاف الماسح بعد النجاح
                    qrScanner.stop();
                    
                    // تشغيل صوت النجاح
                    playSuccessSound();
                    
                    // الاهتزاز عند النجاح
                    if ('vibrate' in navigator) {
                        navigator.vibrate(200);
                    }
                    
                    // إغلاق نافذة المسح
                    document.getElementById('qr-scanner').classList.remove('active');
                    
                    // تسجيل الدخول باستخدام معرف البطاقة
                    loginWithCardId(decodedText);
                },
                // خطأ عند المسح (نتجاهله، سيستمر المسح)
                (errorMessage) => {
                    // لا نفعل شيئاً عند الخطأ - نترك المسح مستمراً
                }
            ).catch((err) => {
                console.error('خطأ في بدء المسح:', err);
                showToast('خطأ في بدء المسح', 'تأكد من السماح بالوصول إلى الكاميرا', 'error');
            });
        } catch (error) {
            console.error('خطأ في إعداد ماسح الباركود:', error);
            showToast('خطأ في الماسح', 'حدث خطأ أثناء إعداد ماسح الباركود', 'error');
        }
    }
    
    // إيقاف ماسح الباركود
    function stopQrScanner() {
        if (qrScanner) {
            qrScanner.stop()
                .then(() => {
                    console.log('تم إيقاف ماسح الباركود');
                })
                .catch(error => {
                    console.error('خطأ في إيقاف ماسح الباركود:', error);
                });
            qrScanner = null;
        }
    }
    
    // تشغيل صوت النجاح
    function playSuccessSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = 1000;
            gainNode.gain.value = 0.3;
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
            }, 300);
        } catch (error) {
            console.error('خطأ في تشغيل الصوت:', error);
        }
    }
    
    // معالجة تغيير علامة التبويب
    function handleTabChange(e) {
        e.preventDefault();
        
        // الحصول على الصفحة المطلوبة
        const pageId = this.getAttribute('data-page');
        
        // التحقق من تسجيل الدخول للصفحات المحمية
        if (pageId !== 'auth' && !InvestorCardFirebase.isUserLoggedIn()) {
            showToast('يرجى تسجيل الدخول', 'قم بتسجيل الدخول للوصول إلى هذه الصفحة', 'warning');
            return;
        }
        
        // تنشيط علامة التبويب وتحديث الصفحة
        activateTab(pageId);
        navigateToPage(pageId);
    }
    
    // معالجة فلترة المعاملات
    function handleTransactionFilter() {
        // إزالة الفئة النشطة من جميع الأزرار
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // إضافة الفئة النشطة للزر المحدد
        this.classList.add('active');
        
        // تنفيذ الفلترة
        const filter = this.getAttribute('data-filter');
        
        // تطبيق الفلتر على العناصر
        const allTransactions = document.querySelectorAll('#all-transactions .transaction-item');
        allTransactions.forEach(item => {
            if (filter === 'all') {
                item.style.display = 'flex';
            } else {
                const transactionType = item.getAttribute('data-type');
                item.style.display = (transactionType === filter) ? 'flex' : 'none';
            }
        });
        
        // أظهر/أخفِ عناصر فاصل الشهر حسب الحاجة
        const monthSeparators = document.querySelectorAll('.month-separator');
        if (filter === 'all') {
            monthSeparators.forEach(sep => sep.style.display = 'block');
        } else {
            monthSeparators.forEach((sep, index) => {
                // تحقق ما إذا كان هناك عنصر مرئي بعد هذا الفاصل وقبل الفاصل التالي
                let hasVisibleTransaction = false;
                let current = sep.nextElementSibling;
                
                while (current && !current.classList.contains('month-separator')) {
                    if (current.style.display !== 'none') {
                        hasVisibleTransaction = true;
                        break;
                    }
                    current = current.nextElementSibling;
                }
                
                sep.style.display = hasVisibleTransaction ? 'block' : 'none';
            });
        }
    }
    
    // معالجة تغيير علامة تبويب الملف الشخصي
    function handleProfileTabChange() {
        // إزالة الفئة النشطة من جميع علامات التبويب
        document.querySelectorAll('.profile-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // إضافة الفئة النشطة للعلامة المحددة
        this.classList.add('active');
        
        // إخفاء جميع الأقسام
        document.querySelectorAll('.profile-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // إظهار القسم المناسب
        const sectionId = this.getAttribute('data-section') + '-section';
        document.getElementById(sectionId).classList.add('active');
    }
    
    // إظهار تأكيد تسجيل الخروج
    function showLogoutConfirmation() {
        const logoutConfirmation = document.getElementById('logout-confirmation');
        if (logoutConfirmation) {
            logoutConfirmation.classList.add('active');
        }
    }
    
    // معالجة تسجيل الخروج
    function handleLogout() {
        // تسجيل الخروج من النظام
        InvestorCardFirebase.logout();
        
        // إلغاء الاشتراك في تحديثات البطاقة
        if (cardSubscription) {
            InvestorCardFirebase.unsubscribeFromChanges(cardSubscription);
            cardSubscription = null;
        }
        
        // إزالة البيانات المحفوظة
        localStorage.removeItem('savedCardNumber');
        localStorage.removeItem('savedCardCVV');
        
        // إغلاق نافذة التأكيد
        document.getElementById('logout-confirmation').classList.remove('active');
        
        // إظهار إشعار
        showToast('تم تسجيل الخروج', 'تم تسجيل الخروج بنجاح', 'info');
        
        // العودة إلى شاشة تسجيل الدخول
        navigateToPage('auth');
        
        // إعادة تعيين حقول النموذج
        if (document.getElementById('card-number')) {
            document.getElementById('card-number').value = '';
        }
        if (document.getElementById('cvv')) {
            document.getElementById('cvv').value = '';
        }
        if (document.getElementById('remember-me')) {
            document.getElementById('remember-me').checked = false;
        }
        
        // إزالة أي رسائل خطأ
        if (document.getElementById('card-number-error')) {
            document.getElementById('card-number-error').textContent = '';
        }
        if (document.getElementById('cvv-error')) {
            document.getElementById('cvv-error').textContent = '';
        }
    }
    
    // معالجة مشاركة البطاقة
    function handleShare() {
        // الحصول على بيانات البطاقة
        const card = InvestorCardFirebase.getCurrentCardData();
        if (!card) return;
        
        // التحقق من دعم واجهة مشاركة الويب
        if (navigator.share) {
            navigator.share({
                title: 'بطاقة المستثمر',
                text: `بطاقة المستثمر الخاصة بي - ${card.investorName}`,
                url: window.location.href
            })
            .then(() => {
                showToast('تمت المشاركة', 'تمت مشاركة معلومات البطاقة بنجاح', 'success');
            })
            .catch((error) => {
                console.error('خطأ في المشاركة:', error);
                showShareFallback(card);
            });
        } else {
            showShareFallback(card);
        }
    }
    
    // إظهار بديل المشاركة
    function showShareFallback(card) {
        const shareModal = document.createElement('div');
        shareModal.className = 'confirmation-dialog active';
        shareModal.innerHTML = `
            <div class="confirmation-content">
                <div class="confirmation-title">مشاركة بطاقة المستثمر</div>
                <div style="margin: 15px 0; text-align: center;">
                    <button class="btn btn-outline share-whatsapp" style="width: 100%; margin-bottom: 10px;">
                        <i class="fab fa-whatsapp" style="margin-left: 8px; color: #25d366;"></i>
                        <span>واتساب</span>
                    </button>
                    <button class="btn btn-outline share-email" style="width: 100%; margin-bottom: 10px;">
                        <i class="fas fa-envelope" style="margin-left: 8px; color: #007aff;"></i>
                        <span>البريد الإلكتروني</span>
                    </button>
                    <button class="btn btn-outline share-copy" style="width: 100%;">
                        <i class="fas fa-copy" style="margin-left: 8px; color: #3498db;"></i>
                        <span>نسخ المعلومات</span>
                    </button>
                </div>
                <div class="confirmation-actions">
                    <button class="btn btn-outline close-share-modal">إلغاء</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(shareModal);
        
        // مستمع لزر واتساب
        shareModal.querySelector('.share-whatsapp').addEventListener('click', function() {
            const text = `بطاقة المستثمر الخاصة بي - ${card.investorName}\nرقم البطاقة: ${formatCardNumber(card.cardNumber)}\nتاريخ الانتهاء: ${formatDate(card.expiryDate)}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            shareModal.remove();
        });
        
        // مستمع للبريد الإلكتروني
        shareModal.querySelector('.share-email').addEventListener('click', function() {
            const subject = `بطاقة المستثمر - ${card.investorName}`;
            const body = `بطاقة المستثمر الخاصة بي\n\nالاسم: ${card.investorName}\nرقم البطاقة: ${formatCardNumber(card.cardNumber)}\nتاريخ الانتهاء: ${formatDate(card.expiryDate)}`;
            window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            shareModal.remove();
        });
        
        // مستمع لنسخ المعلومات
        shareModal.querySelector('.share-copy').addEventListener('click', function() {
            const text = `بطاقة المستثمر الخاصة بي\n\nالاسم: ${card.investorName}\nرقم البطاقة: ${formatCardNumber(card.cardNumber)}\nتاريخ الانتهاء: ${formatDate(card.expiryDate)}`;
            
            // نسخ النص إلى الحافظة
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            // إظهار إشعار
            showToast('تم النسخ', 'تم نسخ معلومات البطاقة إلى الحافظة', 'success');
            
            // إغلاق النافذة
            shareModal.remove();
        });
        
        // مستمع لزر الإغلاق
        shareModal.querySelector('.close-share-modal').addEventListener('click', function() {
            shareModal.remove();
        });
    }
    
    // معالجة عرض QR Code
    function handleShowQR() {
        // الحصول على معرف البطاقة
        const card = InvestorCardFirebase.getCurrentCardData();
        if (!card) return;
        
        // إنشاء نافذة منبثقة لعرض رمز QR
        const qrModal = document.createElement('div');
        qrModal.className = 'confirmation-dialog active';
        qrModal.innerHTML = `
            <div class="confirmation-content" style="text-align: center;">
                <div class="confirmation-title">رمز QR الخاص بالبطاقة</div>
                <div style="margin: 20px 0; background-color: #fff; padding: 15px; border-radius: 10px; display: inline-block;">
                    <div id="qr-modal-code" style="width: 200px; height: 200px;"></div>
                </div>
                <div style="margin-bottom: 15px; color: #7f8c8d; font-size: 0.9rem;">
                    يمكنك مشاركة هذا الرمز لتسهيل عملية الدفع
                </div>
                <div class="confirmation-actions">
                    <button class="btn btn-primary close-qr-modal">إغلاق</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(qrModal);
        
        // إنشاء رمز QR في النافذة المنبثقة
        try {
            if (typeof QRCode !== 'undefined') {
                new QRCode(document.getElementById('qr-modal-code'), {
                    text: card.id || card.cardKey || "INV-CARD-DEFAULT",
                    width: 200,
                    height: 200,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        } catch (error) {
            console.error('خطأ في إنشاء QR Code:', error);
        }
        
        // مستمع لزر الإغلاق
        qrModal.querySelector('.close-qr-modal').addEventListener('click', function() {
            qrModal.remove();
        });
    }
    
    // تنشيط علامة تبويب
    function activateTab(pageId) {
        // إزالة الفئة النشطة من جميع علامات التبويب
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // إضافة الفئة النشطة للعلامة المناسبة
        const activeTab = document.querySelector(`.tab-item[data-page="${pageId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }
    
    // الانتقال إلى صفحة
    function navigateToPage(pageId) {
        // تحديث الصفحة الحالية
        currentPage = pageId;
        
        // إخفاء جميع الصفحات
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // إظهار الصفحة المطلوبة
        const pageElement = document.getElementById(`${pageId}-page`);
        if (pageElement) {
            pageElement.classList.add('active');
        }
    }
    
    // إظهار/إخفاء مؤشر التحميل
    function showLoading(show) {
        // البحث عن عنصر التحميل أو إنشائه
        let loadingOverlay = document.getElementById('loading-overlay');
        
        if (show) {
            if (!loadingOverlay) {
                loadingOverlay = document.createElement('div');
                loadingOverlay.id = 'loading-overlay';
                loadingOverlay.className = 'loading-overlay';
                loadingOverlay.innerHTML = '<div class="spinner"></div>';
                document.body.appendChild(loadingOverlay);
            }
            loadingOverlay.style.display = 'flex';
        } else if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
    
    // إظهار إشعار
    function showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        
        if (!toastContainer) return;
        
        // إنشاء عنصر الإشعار
        const toast = document.createElement('div');
        toast.className = 'toast';
        
        // تحديد أيقونة حسب النوع
        let icon = '';
        switch (type) {
            case 'success':
                icon = '<i class="fas fa-check-circle toast-icon success"></i>';
                break;
            case 'error':
                icon = '<i class="fas fa-times-circle toast-icon error"></i>';
                break;
            case 'warning':
                icon = '<i class="fas fa-exclamation-triangle toast-icon warning"></i>';
                break;
            default:
                icon = '<i class="fas fa-info-circle toast-icon info"></i>';
                break;
        }
        
        // إضافة المحتوى
        toast.innerHTML = `
            ${icon}
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        // إضافة إلى الحاوية
        toastContainer.appendChild(toast);
        
        // إظهار الإشعار (تأخير قليلاً لإضافة تأثير الحركة)
        setTimeout(() => {
            toast.classList.add('active');
        }, 10);
        
        // إضافة مستمع لزر الإغلاق
        toast.querySelector('.toast-close').addEventListener('click', () => {
            closeToast(toast);
        });
        
        // إغلاق تلقائي بعد 5 ثوانٍ
        setTimeout(() => {
            closeToast(toast);
        }, 5000);
    }
    
  // إغلاق إشعار
    function closeToast(toast) {
        toast.classList.remove('active');
        
        // إزالة بعد انتهاء الحركة
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
    
    // ================== وظائف المساعدة ==================
    
    // تنسيق رقم البطاقة
    function formatCardNumber(cardNumber) {
        if (!cardNumber) return 'XXXX XXXX XXXX XXXX';
        
        // إزالة جميع المسافات
        const cleaned = cardNumber.toString().replace(/\s/g, '');
        
        // إضافة مسافات كل 4 أرقام
        return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    
    // تنسيق المبلغ المالي
    function formatCurrency(amount) {
        if (amount === null || amount === undefined) return '-';
        
        // تنسيق المبلغ بالدينار العراقي
        const formatter = new Intl.NumberFormat('ar-IQ', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        
        return formatter.format(amount);
    }
    
    // تنسيق التاريخ
    function formatDate(dateStr, format = 'full') {
        if (!dateStr) return '-';
        
        try {
            const date = new Date(dateStr);
            
            if (isNaN(date.getTime())) return '-';
            
            if (format === 'month-year') {
                return `${getMonthName(date.getMonth())} ${date.getFullYear()}`;
            }
            
            const day = date.getDate().toString().padStart(2, '0');
            const month = getMonthName(date.getMonth());
            const year = date.getFullYear();
            
            return `${day} ${month} ${year}`;
        } catch (error) {
            console.error('خطأ في تنسيق التاريخ:', error);
            return dateStr;
        }
    }
    
    // الحصول على اسم الشهر
    function getMonthName(monthIndex) {
        const months = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        
        return months[monthIndex] || '';
    }
    
    // حساب تاريخ الأرباح القادم
    function formatNextProfitDate(lastProfitDate) {
        if (!lastProfitDate) {
            // إذا لم يكن هناك تاريخ سابق، استخدم اليوم
            const today = new Date();
            // ضبط التاريخ على 15 من الشهر التالي
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);
            return formatDate(nextMonth);
        }
        
        // الحصول على تاريخ آخر ربح
        const lastDate = new Date(lastProfitDate);
        
        // تحديد تاريخ الربح التالي (15 من الشهر التالي)
        const nextDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 15);
        
        return formatDate(nextDate);
    }
    
    // الحصول على الأحرف الأولى من الاسم
    function getInitials(name) {
        if (!name) return '';
        
        const parts = name.split(' ');
        if (parts.length === 1) return parts[0].charAt(0);
        
        // الحرف الأول من الاسم الأول والأخير
        return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
    }
    
    // الحصول على أيقونة المعاملة
    function getTransactionIcon(type) {
        switch (type) {
            case 'deposit': return 'arrow-down';
            case 'withdraw': return 'arrow-up';
            case 'profit': return 'chart-line';
            case 'transfer': return 'exchange-alt';
            default: return 'money-bill-wave';
        }
    }
    
    // الحصول على عنوان المعاملة
    function getTransactionTitle(type) {
        switch (type) {
            case 'deposit': return 'إيداع إلى الحساب';
            case 'withdraw': return 'سحب من الحساب';
            case 'profit': return 'أرباح شهرية';
            case 'transfer': return 'تحويل';
            default: return 'معاملة مالية';
        }
    }
    
    // تنسيق مبلغ المعاملة
    function formatTransactionAmount(amount, type) {
        if (amount === null || amount === undefined) return '-';
        
        const prefix = type === 'withdraw' ? '-' : '+';
        return `${prefix}${formatCurrency(amount)} د.ع`;
    }
    
    // تعيين نص للعنصر
    function setElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }
    
    // واجهة برمجة التطبيق العامة
    return {
        initialize,
        showToast,
        navigateToPage,
        loginWithCardId
    };
})();

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // إضافة نمط CSS للتأثير الاهتزازي عند إدخال PIN خاطئ
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
    `;
    document.head.appendChild(style);
    
    InvestorCardApp.initialize();
});