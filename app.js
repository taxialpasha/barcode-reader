/**
 * نظام بطاقة المستثمر
 * ملف رئيسي لإدارة وظائف التطبيق والتكامل مع Firebase
 */

// ==================== متغيرات عامة ====================
let currentUser = null; // المستخدم الحالي
let investors = []; // قائمة المستثمرين
let cards = []; // قائمة البطاقات
let transactions = []; // قائمة العمليات
let profits = []; // قائمة الأرباح
let isInitialized = false; // حالة تهيئة التطبيق

// ==================== تهيئة Firebase ====================
function initializeFirebase() {
    try {
        // التحقق من تهيئة Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        console.log("تم تهيئة Firebase بنجاح");
        return true;
    } catch (error) {
        console.error("خطأ في تهيئة Firebase:", error);
        showError("حدث خطأ في الاتصال بقاعدة البيانات");
        return false;
    }
}

// ==================== تهيئة التطبيق ====================
function initializeApp() {
    console.log("جاري تهيئة التطبيق...");
    
    // تهيئة Firebase
    if (!initializeFirebase()) {
        console.error("فشل في تهيئة التطبيق بسبب مشكلة في Firebase");
        return;
    }
    
    // التحقق من حالة تسجيل الدخول
    checkAuthState();
    
    // إضافة مستمعي الأحداث
    addEventListeners();
    
    console.log("تمت تهيئة التطبيق بنجاح");
    isInitialized = true;
}

// ==================== مستمعات الأحداث ====================
function addEventListeners() {
    // مستمعات تبديل التبويبات
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // مستمع نموذج تسجيل الدخول باستخدام البطاقة
    const cardLoginForm = document.getElementById('card-login-form');
    if (cardLoginForm) {
        cardLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            loginWithCard();
        });
    }
    
    // مستمع نموذج تسجيل الدخول باستخدام الهاتف
    const phoneLoginForm = document.getElementById('phone-login-form');
    if (phoneLoginForm) {
        phoneLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            loginWithPhone();
        });
    }
    
    // مستمع لزر تسجيل الخروج
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logout();
        });
    }
    
    // مستمع لزر الاتصال بالدعم
    const contactSupportBtn = document.getElementById('contact-support-btn');
    if (contactSupportBtn) {
        contactSupportBtn.addEventListener('click', function() {
            showSupportModal();
        });
    }
    
    // مستمعات أزرار البطاقة
    addCardButtonListeners();
    
    // مستمعات النوافذ المنبثقة
    addModalListeners();
    
    // مستمعات التبويبات في لوحة القيادة
    addDashboardTabListeners();
}

// مستمعات أزرار البطاقة
function addCardButtonListeners() {
    // زر تقليب البطاقة
    const flipCardBtn = document.getElementById('flip-card-btn');
    if (flipCardBtn) {
        flipCardBtn.addEventListener('click', function() {
            const card = document.querySelector('.investor-card');
            card.classList.toggle('flipped');
            
            // تحديث نص الزر
            if (card.classList.contains('flipped')) {
                this.querySelector('span').textContent = 'عرض الأمام';
            } else {
                this.querySelector('span').textContent = 'عرض الخلف';
            }
        });
    }
    
    // زر عرض QR
    const showQrBtn = document.getElementById('show-qr-btn');
    if (showQrBtn) {
        showQrBtn.addEventListener('click', function() {
            showQRModal();
        });
    }
    
    // زر مشاركة البطاقة
    const shareCardBtn = document.getElementById('share-card-btn');
    if (shareCardBtn) {
        shareCardBtn.addEventListener('click', function() {
            showShareModal();
        });
    }
}

// مستمعات النوافذ المنبثقة
function addModalListeners() {
    // إغلاق النوافذ المنبثقة
    document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.parentElement.classList.remove('active');
            }
        });
    });
    
    // أزرار مشاركة البطاقة
    document.querySelectorAll('.share-option').forEach(option => {
        option.addEventListener('click', function() {
            const method = this.getAttribute('data-method');
            shareCard(method);
        });
    });
    
    // زر تعيين الإشعارات كمقروءة
    const markReadBtn = document.getElementById('mark-read-btn');
    if (markReadBtn) {
        markReadBtn.addEventListener('click', function() {
            markAllNotificationsAsRead();
        });
    }
    
    // زر إرسال رسالة الدعم
    const sendSupportMessage = document.getElementById('send-support-message');
    if (sendSupportMessage) {
        sendSupportMessage.addEventListener('click', function() {
            sendSupportRequest();
        });
    }
}

// مستمعات التبويبات في لوحة القيادة
function addDashboardTabListeners() {
    document.querySelectorAll('.bottom-navbar .nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // إزالة الفئة النشطة من جميع العناصر
            document.querySelectorAll('.bottom-navbar .nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            
            // إضافة الفئة النشطة للعنصر الذي تم النقر عليه
            this.classList.add('active');
            
            // تحديد الصفحة المطلوبة
            const targetId = this.getAttribute('href').substring(1);
            
            // تبديل التبويبات في لوحة المعلومات
            if (targetId === 'home') {
                // عرض الصفحة الرئيسية
                document.querySelectorAll('.info-tabs .tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelectorAll('.info-tabs .tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // تنشيط تبويب الاستثمارات
                document.querySelector('.info-tabs .tab-btn[data-tab="investments"]').classList.add('active');
                document.getElementById('investments-tab').classList.add('active');
            } else {
                // تنشيط التبويب المطلوب
                document.querySelectorAll('.info-tabs .tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelectorAll('.info-tabs .tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                const tabBtn = document.querySelector(`.info-tabs .tab-btn[data-tab="${targetId}"]`);
                if (tabBtn) {
                    tabBtn.classList.add('active');
                    document.getElementById(`${targetId}-tab`).classList.add('active');
                }
            }
        });
    });
    
    // مستمعات أزرار التبويبات في قسم المعلومات
    document.querySelectorAll('.info-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // إزالة الفئة النشطة من جميع الأزرار
            document.querySelectorAll('.info-tabs .tab-btn').forEach(tabBtn => {
                tabBtn.classList.remove('active');
            });
            
            // إزالة الفئة النشطة من جميع محتويات التبويبات
            document.querySelectorAll('.info-tabs .tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // إضافة الفئة النشطة للزر الذي تم النقر عليه
            this.classList.add('active');
            
            // إضافة الفئة النشطة لمحتوى التبويب المطلوب
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// ==================== التبويبات ====================
function switchTab(tabId) {
    // إزالة الفئة النشطة من جميع الأزرار
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // إزالة الفئة النشطة من جميع محتويات التبويبات
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // إضافة الفئة النشطة للزر ومحتوى التبويب المطلوب
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`${tabId}-tab`).classList.add('active');
    
    // تنظيف رسائل الخطأ
    document.getElementById('login-error').textContent = '';
    document.getElementById('phone-login-error').textContent = '';
}

// ==================== التحقق من حالة المصادقة ====================
function checkAuthState() {
    // التحقق من وجود بيانات تسجيل الدخول في التخزين المحلي
    const savedUser = localStorage.getItem('investor_auth');
    
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            
            // التحقق من صلاحية البيانات
            if (currentUser && currentUser.id) {
                // تحميل بيانات المستخدم وعرض لوحة القيادة
                loadUserData(currentUser.id)
                    .then(() => {
                        showDashboard();
                    })
                    .catch(error => {
                        console.error("خطأ في تحميل بيانات المستخدم:", error);
                        showLogin();
                    });
                return;
            }
        } catch (error) {
            console.error("خطأ في قراءة بيانات المستخدم المحفوظة:", error);
        }
    }
    
    // إذا لم يتم العثور على بيانات صالحة، عرض شاشة تسجيل الدخول
    showLogin();
}

// ==================== تسجيل الدخول باستخدام البطاقة ====================
function loginWithCard() {
    console.log("محاولة تسجيل الدخول باستخدام البطاقة...");
    
    // الحصول على بيانات الإدخال
    const cardNumber = document.getElementById('card-number').value.trim();
    const cardExpiry = document.getElementById('card-expiry').value.trim();
    const cardCVV = document.getElementById('card-cvv').value.trim();
    
    // التحقق من إدخال جميع البيانات المطلوبة
    if (!cardNumber || !cardExpiry || !cardCVV) {
        showError("الرجاء إدخال جميع البيانات المطلوبة", "login-error");
        return;
    }
    
    // تنسيق رقم البطاقة للمقارنة
    const formattedCardNumber = formatCardNumber(cardNumber);
    
    // التحقق من صحة تنسيق تاريخ الانتهاء
    if (!isValidExpiryDate(cardExpiry)) {
        showError("تنسيق تاريخ الانتهاء غير صحيح، يجب أن يكون بتنسيق MM/YY", "login-error");
        return;
    }
    
    // إظهار مؤشر التحميل
    showLoading('card-login-btn');
    
    // البحث عن البطاقة في Firebase
    const db = firebase.database();
    db.ref('investor_cards').orderByChild('cardNumber').equalTo(formattedCardNumber).once('value')
        .then(snapshot => {
            // إزالة مؤشر التحميل
            hideLoading('card-login-btn');
            
            if (snapshot.exists()) {
                let cardFound = false;
                let isValid = false;
                let userId = null;
                
                snapshot.forEach(childSnapshot => {
                    const card = childSnapshot.val();
                    cardFound = true;
                    
                    // التحقق من تاريخ الانتهاء
                    const expiryParts = cardExpiry.split('/');
                    const cardExpiryMonth = parseInt(expiryParts[0]);
                    const cardExpiryYear = parseInt('20' + expiryParts[1]);
                    
                    const dbExpiryDate = new Date(card.expiryDate);
                    const dbExpiryMonth = dbExpiryDate.getMonth() + 1; // الشهور تبدأ من 0
                    const dbExpiryYear = dbExpiryDate.getFullYear();
                    
                    const expiryMatches = (cardExpiryMonth === dbExpiryMonth && cardExpiryYear === dbExpiryYear);
                    
                    // التحقق من رمز CVV
                    const cvvMatches = (card.cvv === cardCVV);
                    
                    if (expiryMatches && cvvMatches) {
                        isValid = true;
                        userId = card.investorId;
                    }
                });
                
                if (!cardFound) {
                    showError("رقم البطاقة غير موجود", "login-error");
                } else if (!isValid) {
                    showError("بيانات البطاقة غير صحيحة، تحقق من تاريخ الانتهاء ورمز الحماية", "login-error");
                } else {
                    // التحقق من حالة البطاقة
                    db.ref(`investor_cards/${snapshot.key}`).once('value')
                        .then(cardSnapshot => {
                            const cardData = cardSnapshot.val();
                            
                            if (cardData.status !== 'active') {
                                showError("هذه البطاقة موقوفة أو منتهية الصلاحية", "login-error");
                                return;
                            }
                            
                            // التحقق من PIN إذا كان مطلوبًا
                            if (cardData.features && cardData.features.enablePin) {
                                // إظهار حقل PIN
                                document.getElementById('cvv-group').style.display = 'none';
                                document.getElementById('pin-group').style.display = 'block';
                                
                                // تركيز على أول حقل PIN
                                document.querySelector('.pin-input').focus();
                                
                                // إضافة مستمعات لحقول PIN
                                setupPinInputs(cardData, userId);
                            } else {
                                // تسجيل الدخول مباشرة إذا لم يكن مطلوبًا PIN
                                authorizeUser(userId);
                            }
                        });
                }
            } else {
                showError("رقم البطاقة غير موجود", "login-error");
            }
        })
        .catch(error => {
            hideLoading('card-login-btn');
            console.error("خطأ في البحث عن البطاقة:", error);
            showError("حدث خطأ أثناء محاولة تسجيل الدخول", "login-error");
        });
}

// إعداد حقول رمز PIN
function setupPinInputs(card, userId) {
    const pinInputs = document.querySelectorAll('.pin-input');
    const pinFieldsContainer = document.getElementById('pin-group');
    const hiddenPinInput = document.getElementById('card-pin');
    
    // تعيين التركيز على الحقل الأول
    pinInputs[0].focus();
    
    // إزالة مستمعات الأحداث السابقة
    pinInputs.forEach(input => {
        input.value = '';
        input.removeEventListener('input', handlePinInput);
        input.removeEventListener('keydown', handlePinKeyDown);
    });
    
    // إضافة مستمعات الأحداث
    pinInputs.forEach((input, index) => {
        input.addEventListener('input', handlePinInput);
        input.addEventListener('keydown', handlePinKeyDown);
    });
    
    // معالجة إدخال PIN
    function handlePinInput(e) {
        const input = e.target;
        const value = input.value;
        
        // التحقق من أن الإدخال رقم فقط
        if (!/^\d*$/.test(value)) {
            input.value = '';
            return;
        }
        
        // الانتقال إلى الحقل التالي إذا تم إدخال رقم
        if (value && input.nextElementSibling && input.nextElementSibling.classList.contains('pin-input')) {
            input.nextElementSibling.focus();
        }
        
        // تجميع قيم PIN
        const pin = Array.from(pinInputs).map(inp => inp.value).join('');
        hiddenPinInput.value = pin;
        
        // التحقق من إكمال جميع الأرقام
        if (pin.length === 4) {
            // التحقق من صحة PIN
            if (pin === card.pin) {
                // تسجيل الدخول
                authorizeUser(userId);
            } else {
                showError("رمز PIN غير صحيح", "login-error");
                
                // مسح الحقول وإعادة التركيز على الحقل الأول
                pinInputs.forEach(inp => {
                    inp.value = '';
                });
                pinInputs[0].focus();
            }
        }
    }
    
    // معالجة ضغطات المفاتيح
    function handlePinKeyDown(e) {
        // إذا تم الضغط على مفتاح Backspace والحقل فارغ، انتقل إلى الحقل السابق
        if (e.key === 'Backspace' && !e.target.value) {
            if (e.target.previousElementSibling && e.target.previousElementSibling.classList.contains('pin-input')) {
                e.target.previousElementSibling.focus();
            }
        }
    }
}

// ==================== تسجيل الدخول باستخدام الهاتف ====================
function loginWithPhone() {
    console.log("محاولة تسجيل الدخول باستخدام الهاتف...");
    
    // الحصول على بيانات الإدخال
    const phoneNumber = document.getElementById('phone-number').value.trim();
    const investorName = document.getElementById('investor-name').value.trim();
    
    // التحقق من إدخال جميع البيانات المطلوبة
    if (!phoneNumber || !investorName) {
        showError("الرجاء إدخال جميع البيانات المطلوبة", "phone-login-error");
        return;
    }
    
    // إظهار مؤشر التحميل
    showLoading('phone-login-btn');
    
    // البحث عن المستثمر في Firebase
    const db = firebase.database();
    db.ref('investors').orderByChild('phone').equalTo(phoneNumber).once('value')
        .then(snapshot => {
            // إزالة مؤشر التحميل
            hideLoading('phone-login-btn');
            
            if (snapshot.exists()) {
                let investorFound = false;
                let userId = null;
                
                snapshot.forEach(childSnapshot => {
                    const investor = childSnapshot.val();
                    
                    // التحقق من تطابق الاسم (بشكل تقريبي)
                    if (investor.name && 
                        (investor.name.includes(investorName) || 
                         investorName.includes(investor.name) || 
                         investor.name.toLowerCase() === investorName.toLowerCase())) {
                        investorFound = true;
                        userId = childSnapshot.key;
                    }
                });
                
                if (investorFound && userId) {
                    // تسجيل الدخول
                    authorizeUser(userId);
                } else {
                    showError("الاسم غير مطابق للرقم المدخل", "phone-login-error");
                }
            } else {
                showError("رقم الهاتف غير مسجل في النظام", "phone-login-error");
            }
        })
        .catch(error => {
            hideLoading('phone-login-btn');
            console.error("خطأ في البحث عن المستثمر:", error);
            showError("حدث خطأ أثناء محاولة تسجيل الدخول", "phone-login-error");
        });
}

// ==================== تفويض المستخدم ====================
function authorizeUser(userId) {
    console.log("تفويض المستخدم:", userId);
    
    // تحميل بيانات المستخدم
    loadUserData(userId)
        .then(investorData => {
            // حفظ بيانات المستخدم في التخزين المحلي
            currentUser = {
                id: userId,
                name: investorData.name,
                phone: investorData.phone
            };
            
            localStorage.setItem('investor_auth', JSON.stringify(currentUser));
            
            // عرض لوحة القيادة
            showDashboard();
            
            // تسجيل وقت آخر تسجيل دخول
            updateLastLogin(userId);
        })
        .catch(error => {
            console.error("خطأ في تحميل بيانات المستخدم:", error);
            showError("حدث خطأ أثناء تحميل بيانات المستخدم", "login-error");
        });
}

// تحديث وقت آخر تسجيل دخول
function updateLastLogin(userId) {
    const db = firebase.database();
    const lastLoginDate = new Date().toISOString();
    
    db.ref(`investors/${userId}/lastLogin`).set(lastLoginDate)
        .catch(error => {
            console.error("خطأ في تحديث وقت آخر تسجيل دخول:", error);
        });
}

// ==================== تسجيل الخروج ====================
function logout() {
    // حذف بيانات المستخدم من التخزين المحلي
    localStorage.removeItem('investor_auth');
    
    // إعادة تعيين المتغيرات
    currentUser = null;
    investors = [];
    cards = [];
    transactions = [];
    profits = [];
    
    // عرض شاشة تسجيل الدخول
    showLogin();
}

// ==================== تحميل بيانات المستخدم ====================
function loadUserData(userId) {
    console.log("تحميل بيانات المستخدم:", userId);
    
    const db = firebase.database();
    
    // تحميل بيانات المستثمر
    return db.ref(`investors/${userId}`).once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                throw new Error("لم يتم العثور على بيانات المستثمر");
            }
            
            const investorData = snapshot.val();
            investorData.id = userId;
            
            // تخزين بيانات المستثمر
            investors = [investorData];
            
            // تحميل بطاقة المستثمر
            return db.ref('investor_cards').orderByChild('investorId').equalTo(userId).once('value');
        })
        .then(snapshot => {
            // تخزين بيانات البطاقة
            cards = [];
            
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const card = childSnapshot.val();
                    card.id = childSnapshot.key;
                    cards.push(card);
                });
            }
            
            // تحميل عمليات المستثمر
            return db.ref('transactions').orderByChild('investorId').equalTo(userId).once('value');
        })
        .then(snapshot => {
            // تخزين بيانات العمليات
            transactions = [];
            
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const transaction = childSnapshot.val();
                    transaction.id = childSnapshot.key;
                    transactions.push(transaction);
                });
                
                // ترتيب العمليات حسب التاريخ (الأحدث أولاً)
                transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
            
            // تحميل أرباح المستثمر
            return db.ref('profits').orderByChild('investorId').equalTo(userId).once('value');
        })
        .then(snapshot => {
            // تخزين بيانات الأرباح
            profits = [];
            
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const profit = childSnapshot.val();
                    profit.id = childSnapshot.key;
                    profits.push(profit);
                });
                
                // ترتيب الأرباح حسب تاريخ الاستحقاق
                profits.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
            }
            
            // تحميل الإشعارات (إذا كانت موجودة)
            return loadNotifications(userId);
        })
        .then(() => {
            return investors[0]; // إرجاع بيانات المستثمر للمعالجة اللاحقة
        });
}

// تحميل الإشعارات
function loadNotifications(userId) {
    const db = firebase.database();
    
    return db.ref('notifications').orderByChild('investorId').equalTo(userId).once('value')
        .then(snapshot => {
            // تهيئة مصفوفة الإشعارات إذا لم تكن موجودة
            if (!window.notifications) {
                window.notifications = [];
            }
            
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const notification = childSnapshot.val();
                    notification.id = childSnapshot.key;
                    window.notifications.push(notification);
                });
                
                // ترتيب الإشعارات حسب التاريخ (الأحدث أولاً)
                window.notifications.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // تحديث عداد الإشعارات
                updateNotificationBadge();
            }
            
            return true;
        });
}

// تحديث عداد الإشعارات
function updateNotificationBadge() {
    const unreadCount = window.notifications ? 
        window.notifications.filter(notification => !notification.read).length : 0;
    
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
}

// تعيين جميع الإشعارات كمقروءة
function markAllNotificationsAsRead() {
    if (!currentUser || !window.notifications || window.notifications.length === 0) {
        return;
    }
    
    const db = firebase.database();
    const batch = {};
    
    // تحديث حالة الإشعارات في المصفوفة وإعداد عمليات التحديث
    window.notifications.forEach(notification => {
        if (!notification.read) {
            notification.read = true;
            batch[`notifications/${notification.id}/read`] = true;
        }
    });
    
    // إذا لم تكن هناك إشعارات للتحديث
    if (Object.keys(batch).length === 0) {
        return;
    }
    
    // تحديث قاعدة البيانات
    db.ref().update(batch)
        .then(() => {
            console.log("تم تعيين جميع الإشعارات كمقروءة");
            
            // تحديث عداد الإشعارات
            updateNotificationBadge();
            
            // تحديث قائمة الإشعارات
            renderNotifications();
            
            // إظهار إشعار للمستخدم
            showToast('تم تعيين جميع الإشعارات كمقروءة', 'success');
        })
        .catch(error => {
            console.error("خطأ في تحديث حالة الإشعارات:", error);
        });
}

// ==================== عرض لوحة القيادة ====================
function showDashboard() {
    console.log("عرض لوحة القيادة للمستخدم:", currentUser ? currentUser.name : 'غير معروف');
    
    // إخفاء شاشة تسجيل الدخول
    document.getElementById('login-screen').style.display = 'none';
    
    // إظهار لوحة القيادة
    document.getElementById('card-dashboard').style.display = 'block';
    
    // تحديث بيانات المستخدم في الواجهة
    updateUserInterface();
}

// ==================== عرض شاشة تسجيل الدخول ====================
function showLogin() {
    console.log("عرض شاشة تسجيل الدخول");
    
    // إظهار شاشة تسجيل الدخول
    document.getElementById('login-screen').style.display = 'flex';
    
    // إخفاء لوحة القيادة
    document.getElementById('card-dashboard').style.display = 'none';
    
    // إعادة تعيين نماذج تسجيل الدخول
    document.getElementById('card-login-form').reset();
    document.getElementById('phone-login-form').reset();
    
    // إخفاء رسائل الخطأ
    document.getElementById('login-error').textContent = '';
    document.getElementById('phone-login-error').textContent = '';
}

// ==================== تحديث واجهة المستخدم ====================
function updateUserInterface() {
    if (!currentUser || !investors || investors.length === 0) {
        console.error("لا توجد بيانات للمستخدم");
        return;
    }
    
    const investor = investors[0];
    
    // تحديث معلومات المستخدم
    document.getElementById('user-name').textContent = investor.name;
    document.getElementById('user-initial').textContent = investor.name.charAt(0);
    
    // تحديث بيانات البطاقة
    updateCardDisplay();
    
    // تحديث الملخص المالي
    updateFinancialSummary();
    
    // عرض قوائم البيانات
    renderInvestments();
    renderTransactions();
    renderProfits();
    renderInvestorInfo();
    
    // عرض الإشعارات
    renderNotifications();
}

// تحديث عرض البطاقة
function updateCardDisplay() {
    if (!cards || cards.length === 0) {
        console.log("لا توجد بطاقة للمستثمر");
        return;
    }
    
    // استخدام أول بطاقة نشطة أو أحدث بطاقة
    const card = cards.find(c => c.status === 'active') || cards[0];
    const investor = investors[0];
    
    // تحديث معلومات البطاقة
    document.getElementById('display-card-number').textContent = card.cardNumber;
    document.getElementById('display-card-expiry').textContent = formatExpiryDate(card.expiryDate);
    document.getElementById('display-card-name').textContent = investor.name;
    document.getElementById('display-cvv').textContent = card.cvv;
    document.getElementById('display-phone').textContent = investor.phone || '';
    
    // تحديث حالة البطاقة
    updateCardStatus(card);
    
    // تحديث QR Code
    updateCardQRCode(card.id);
}

// تحديث حالة البطاقة
function updateCardStatus(card) {
    const statusBadge = document.getElementById('card-status-badge');
    const currentDate = new Date();
    const expiryDate = new Date(card.expiryDate);
    
    if (card.status !== 'active') {
        statusBadge.textContent = 'موقوفة';
        statusBadge.classList.add('badge-inactive');
        statusBadge.classList.remove('badge-expired', 'badge-active');
    } else if (expiryDate < currentDate) {
        statusBadge.textContent = 'منتهية الصلاحية';
        statusBadge.classList.add('badge-expired');
        statusBadge.classList.remove('badge-inactive', 'badge-active');
    } else {
        statusBadge.textContent = 'نشطة';
        statusBadge.classList.add('badge-active');
        statusBadge.classList.remove('badge-inactive', 'badge-expired');
    }
}

// تحديث QR Code للبطاقة
function updateCardQRCode(cardId) {
    const qrCode = document.querySelector('.card-qrcode img');
    
    if (qrCode) {
        qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${cardId}`;
    }
}

// تحديث الملخص المالي
function updateFinancialSummary() {
    const investor = investors[0];
    
    // حساب الرصيد الإجمالي
    let totalBalance = 0;
    
    if (investor.amount) {
        totalBalance = investor.amount;
    } else if (investor.investments && Array.isArray(investor.investments)) {
        investor.investments.forEach(investment => {
            totalBalance += investment.amount;
        });
    }
    
    // حساب الربح الشهري
    const monthlyProfit = calculateMonthlyProfit(totalBalance);
    
    // حساب عدد أيام الاستثمار
    const investmentDays = calculateInvestmentDays(investor);
    
    // حساب موعد الربح القادم
    const nextProfitDate = calculateNextProfitDate(investor);
    
    // عرض البيانات في الواجهة
    document.getElementById('total-balance').textContent = formatCurrency(totalBalance);
    document.getElementById('monthly-profit').textContent = formatCurrency(monthlyProfit);
    document.getElementById('investment-days').textContent = investmentDays;
    document.getElementById('next-profit-date').textContent = formatDate(nextProfitDate);
    document.getElementById('last-update-date').textContent = formatDate(new Date());
}

// حساب الربح الشهري
function calculateMonthlyProfit(amount) {
    // يمكن تخصيص نسبة الربح حسب الإعدادات
    const interestRate = 0.175; // 17.5%
    return amount * interestRate;
}

// حساب عدد أيام الاستثمار
function calculateInvestmentDays(investor) {
    const startDate = investor.joinDate ? new Date(investor.joinDate) : 
                      investor.createdAt ? new Date(investor.createdAt) : new Date();
    const currentDate = new Date();
    
    const diffTime = Math.abs(currentDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

// حساب موعد الربح القادم
function calculateNextProfitDate(investor) {
    // البحث عن أقرب ربح مستحق
    if (profits && profits.length > 0) {
        const futureProfits = profits.filter(profit => new Date(profit.dueDate) > new Date());
        
        if (futureProfits.length > 0) {
            // ترتيب الأرباح المستقبلية حسب التاريخ
            futureProfits.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
            return futureProfits[0].dueDate;
        }
    }
    
    // إذا لم يتم العثور على أرباح مستقبلية، حساب موعد الربح التالي
    const startDate = investor.joinDate ? new Date(investor.joinDate) : 
                      investor.createdAt ? new Date(investor.createdAt) : new Date();
    
    // حساب موعد الربح التالي (على أساس شهري)
    const nextDate = new Date(startDate);
    while (nextDate <= new Date()) {
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    return nextDate;
}

// عرض قائمة الاستثمارات
function renderInvestments() {
    const investmentsList = document.getElementById('investments-list');
    
    if (!investmentsList) {
        console.error("لم يتم العثور على عنصر قائمة الاستثمارات");
        return;
    }
    
    // مسح المحتوى الحالي
    investmentsList.innerHTML = '';
    
    // التحقق من وجود بيانات
    if (!investors || investors.length === 0) {
        investmentsList.innerHTML = '<div class="empty-list">لا توجد استثمارات</div>';
        return;
    }
    
    const investor = investors[0];
    
    // إذا كان هناك حقل استثمارات
    if (investor.investments && Array.isArray(investor.investments) && investor.investments.length > 0) {
        investor.investments.forEach(investment => {
            const listItem = document.createElement('div');
            listItem.className = 'list-item';
            
            listItem.innerHTML = `
                <div class="list-item-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="list-item-content">
                    <div class="list-item-title">${investment.description || 'استثمار'}</div>
                    <div class="list-item-subtitle">${formatDate(investment.date)}</div>
                </div>
                <div class="list-item-value">${formatCurrency(investment.amount)}</div>
            `;
            
            investmentsList.appendChild(listItem);
        });
    } else if (investor.amount) {
        // إذا كان هناك مبلغ إجمالي فقط
        const listItem = document.createElement('div');
        listItem.className = 'list-item';
        
        listItem.innerHTML = `
            <div class="list-item-icon">
                <i class="fas fa-chart-line"></i>
            </div>
            <div class="list-item-content">
                <div class="list-item-title">استثمار رئيسي</div>
                <div class="list-item-subtitle">${formatDate(investor.joinDate || investor.createdAt)}</div>
            </div>
            <div class="list-item-value">${formatCurrency(investor.amount)}</div>
        `;
        
        investmentsList.appendChild(listItem);
    } else {
        // لا توجد استثمارات
        investmentsList.innerHTML = '<div class="empty-list">لا توجد استثمارات</div>';
    }
}

// عرض قائمة العمليات
function renderTransactions() {
    const transactionsList = document.getElementById('transactions-list');
    
    if (!transactionsList) {
        console.error("لم يتم العثور على عنصر قائمة العمليات");
        return;
    }
    
    // مسح المحتوى الحالي
    transactionsList.innerHTML = '';
    
    // التحقق من وجود بيانات
    if (!transactions || transactions.length === 0) {
        transactionsList.innerHTML = '<div class="empty-list">لا توجد عمليات</div>';
        return;
    }
    
    // تحديد الفلتر الحالي
    const activeFilter = document.querySelector('.transaction-filters .filter-btn.active');
    const filterType = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
    
    // فلترة العمليات
    let filteredTransactions = transactions;
    
    if (filterType !== 'all') {
        filteredTransactions = transactions.filter(transaction => transaction.type === filterType);
    }
    
    // عرض العمليات
    filteredTransactions.forEach(transaction => {
        const listItem = document.createElement('div');
        listItem.className = 'list-item';
        
        // تحديد الأيقونة حسب نوع العملية
        let icon = '';
        let typeClass = '';
        
        switch (transaction.type) {
            case 'deposit':
                icon = 'fa-arrow-down';
                typeClass = 'deposit';
                break;
            case 'withdraw':
                icon = 'fa-arrow-up';
                typeClass = 'withdraw';
                break;
            case 'profit':
                icon = 'fa-coins';
                typeClass = 'profit';
                break;
            default:
                icon = 'fa-exchange-alt';
                typeClass = '';
        }
        
        listItem.innerHTML = `
            <div class="list-item-icon ${typeClass}">
                <i class="fas ${icon}"></i>
            </div>
            <div class="list-item-content">
                <div class="list-item-title">${getTransactionTypeText(transaction.type)}</div>
                <div class="list-item-subtitle">${formatDate(transaction.date)}</div>
            </div>
            <div class="list-item-value ${typeClass}">${formatCurrency(transaction.amount)}</div>
        `;
        
        transactionsList.appendChild(listItem);
    });
    
    // إضافة مستمعات لأزرار الفلترة
    document.querySelectorAll('.transaction-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // إزالة الفئة النشطة من كل الأزرار
            document.querySelectorAll('.transaction-filters .filter-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // إضافة الفئة النشطة للزر الحالي
            this.classList.add('active');
            
            // إعادة عرض العمليات
            renderTransactions();
        });
    });
}

// عرض قائمة الأرباح
function renderProfits() {
    const profitsList = document.getElementById('profits-list');
    const totalReceivedProfits = document.getElementById('total-received-profits');
    
    if (!profitsList || !totalReceivedProfits) {
        console.error("لم يتم العثور على عناصر عرض الأرباح");
        return;
    }
    
    // مسح المحتوى الحالي
    profitsList.innerHTML = '';
    
    // التحقق من وجود بيانات
    if (!profits || profits.length === 0) {
        profitsList.innerHTML = '<div class="empty-list">لا توجد أرباح</div>';
        totalReceivedProfits.textContent = formatCurrency(0);
        updateProfitProgress(0, 0);
        return;
    }
    
    // حساب إجمالي الأرباح المستلمة
    const receivedProfits = profits.filter(profit => profit.status === 'paid');
    let totalReceived = 0;
    
    receivedProfits.forEach(profit => {
        totalReceived += profit.amount;
    });
    
    totalReceivedProfits.textContent = formatCurrency(totalReceived);
    
    // حساب الربح الحالي والمستهدف
    calculateCurrentProfit();
    
    // عرض الأرباح
    profits.forEach(profit => {
        const listItem = document.createElement('div');
        listItem.className = 'list-item';
        
        // تحديد حالة الربح
        let statusClass = '';
        let statusText = '';
        
        switch (profit.status) {
            case 'paid':
                statusClass = 'success';
                statusText = 'تم الدفع';
                break;
            case 'pending':
                statusClass = 'warning';
                statusText = 'قيد الانتظار';
                break;
            case 'due':
                statusClass = 'info';
                statusText = 'مستحق';
                break;
            default:
                statusClass = '';
                statusText = profit.status || 'غير معروف';
        }
        
        listItem.innerHTML = `
            <div class="list-item-icon ${statusClass}">
                <i class="fas fa-coins"></i>
            </div>
            <div class="list-item-content">
                <div class="list-item-title">
                    ${profit.description || 'ربح شهري'}
                    <span class="badge badge-${statusClass}">${statusText}</span>
                </div>
                <div class="list-item-subtitle">${formatDate(profit.dueDate)}</div>
            </div>
            <div class="list-item-value">${formatCurrency(profit.amount)}</div>
        `;
        
        profitsList.appendChild(listItem);
    });
}

// حساب الربح الحالي
function calculateCurrentProfit() {
    const investor = investors[0];
    
    // الحصول على آخر ربح مدفوع
    const lastPaidProfit = profits.find(profit => profit.status === 'paid');
    
    // تاريخ آخر دفع أو تاريخ بدء الاستثمار
    const lastPaymentDate = lastPaidProfit ? new Date(lastPaidProfit.paidDate) : 
                            new Date(investor.joinDate || investor.createdAt);
    
    const currentDate = new Date();
    
    // حساب عدد الأيام منذ آخر دفع
    const diffTime = Math.abs(currentDate - lastPaymentDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // حساب الفترة الكاملة (30 يوم أو الإعداد المحدد)
    const periodDays = 30;
    
    // حساب النسبة المئوية من الفترة
    const percentage = Math.min(100, (diffDays / periodDays) * 100);
    
    // حساب المبلغ الحالي
    const totalBalance = investor.amount || 0;
    const monthlyProfit = calculateMonthlyProfit(totalBalance);
    const currentProfit = (monthlyProfit * diffDays) / periodDays;
    
    // تحديث التقدم في الواجهة
    updateProfitProgress(currentProfit, monthlyProfit, percentage);
}

// تحديث شريط تقدم الربح
function updateProfitProgress(currentProfit, targetProfit, percentage = 0) {
    document.getElementById('profit-percentage').textContent = `${Math.round(percentage)}%`;
    document.getElementById('current-profit').textContent = formatCurrency(currentProfit);
    document.getElementById('target-profit').textContent = formatCurrency(targetProfit);
    document.querySelector('.progress-fill').style.width = `${percentage}%`;
}

// عرض معلومات المستثمر
function renderInvestorInfo() {
    const investor = investors[0];
    
    if (!investor) {
        console.error("لا توجد بيانات للمستثمر");
        return;
    }
    
    // تحديث معلومات المستثمر
    document.getElementById('investor-full-name').textContent = investor.name;
    document.getElementById('investor-phone-number').textContent = investor.phone || '-';
    document.getElementById('investor-address').textContent = investor.address || '-';
    document.getElementById('investor-join-date').textContent = formatDate(investor.joinDate || investor.createdAt);
    
    // تحديث معلومات البطاقة
    if (cards && cards.length > 0) {
        const card = cards[0];
        document.getElementById('card-type').textContent = getCardTypeName(card.cardType);
        document.getElementById('card-issue-date').textContent = formatDate(card.createdAt);
        document.getElementById('card-expiry-date').textContent = formatDate(card.expiryDate);
        
        // تحديث حالة البطاقة
        const statusBadge = document.getElementById('card-status-badge-info');
        if (statusBadge) {
            statusBadge.className = 'badge';
            
            if (card.status !== 'active') {
                statusBadge.textContent = 'موقوفة';
                statusBadge.classList.add('badge-warning');
            } else if (new Date(card.expiryDate) < new Date()) {
                statusBadge.textContent = 'منتهية الصلاحية';
                statusBadge.classList.add('badge-danger');
            } else {
                statusBadge.textContent = 'نشطة';
                statusBadge.classList.add('badge-success');
            }
        }
        
        // عرض مزايا البطاقة
        renderCardBenefits(card);
    }
}

// عرض مزايا البطاقة
function renderCardBenefits(card) {
    const benefitsList = document.getElementById('benefits-list');
    
    if (!benefitsList) {
        console.error("لم يتم العثور على عنصر قائمة المزايا");
        return;
    }
    
    // مسح المحتوى الحالي
    benefitsList.innerHTML = '';
    
    // تحديد مزايا البطاقة حسب النوع
    const benefits = getCardBenefits(card.cardType);
    
    // عرض المزايا
    benefits.forEach(benefit => {
        const listItem = document.createElement('li');
        listItem.textContent = benefit;
        benefitsList.appendChild(listItem);
    });
}

// الحصول على مزايا البطاقة حسب النوع
function getCardBenefits(cardType) {
    switch (cardType) {
        case 'platinum':
            return [
                'تأمين سفر دولي',
                'خدمة عملاء VIP على مدار 24 ساعة',
                'إمكانية سحب نقدي بقيمة أعلى',
                'خصومات لدى الشركاء المميزين',
                'نقاط مكافآت مضاعفة'
            ];
        case 'gold':
            return [
                'تأمين على المشتريات',
                'نقاط مكافآت مميزة',
                'خصومات خاصة في المتاجر المشاركة',
                'خدمة عملاء متميزة'
            ];
        case 'premium':
            return [
                'مكافآت على المشتريات',
                'أولوية في خدمة العملاء',
                'تأمين محدود على المشتريات',
                'خصومات لدى شركاء محددين'
            ];
        case 'diamond':
            return [
                'امتيازات حصرية',
                'خدمة شخصية مخصصة',
                'تأمين شامل على المشتريات والسفر',
                'رصيد سفر سنوي',
                'دخول مجاني إلى صالات المطارات',
                'مساعد شخصي على مدار الساعة'
            ];
        case 'islamic':
            return [
                'متوافقة مع الشريعة الإسلامية',
                'مزايا عائلية',
                'خدمات استشارية مالية إسلامية',
                'برنامج خيري للتبرعات',
                'تأمين تكافلي على المشتريات'
            ];
        case 'custom':
        default:
            return [
                'تأمين على المشتريات',
                'خدمة عملاء متميزة',
                'نظام نقاط المكافآت',
                'خصومات لدى شركاء محددين'
            ];
    }
}

// عرض الإشعارات
function renderNotifications() {
    const notificationsList = document.getElementById('notifications-list');
    
    if (!notificationsList) {
        return;
    }
    
    // مسح المحتوى الحالي
    notificationsList.innerHTML = '';
    
    // التحقق من وجود إشعارات
    if (!window.notifications || window.notifications.length === 0) {
        notificationsList.innerHTML = '<div class="empty-list">لا توجد إشعارات</div>';
        return;
    }
    
    // عرض الإشعارات
    window.notifications.forEach(notification => {
        const listItem = document.createElement('div');
        listItem.className = 'notification-item';
        
        if (!notification.read) {
            listItem.classList.add('unread');
        }
        
        // تحديد الأيقونة حسب نوع الإشعار
        let icon = 'fa-bell';
        
        switch (notification.type) {
            case 'profit':
                icon = 'fa-coins';
                break;
            case 'transaction':
                icon = 'fa-exchange-alt';
                break;
            case 'card':
                icon = 'fa-credit-card';
                break;
            case 'system':
                icon = 'fa-cog';
                break;
        }
        
        listItem.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${formatRelativeTime(notification.date)}</div>
            </div>
            <div class="notification-action">
                <button class="notification-mark-read" data-id="${notification.id}">
                    <i class="fas ${notification.read ? 'fa-check' : 'fa-circle'}"></i>
                </button>
            </div>
        `;
        
        notificationsList.appendChild(listItem);
    });
    
    // إضافة مستمعات لأزرار تعيين كمقروء
    document.querySelectorAll('.notification-mark-read').forEach(btn => {
        btn.addEventListener('click', function() {
            const notificationId = this.getAttribute('data-id');
            markNotificationAsRead(notificationId);
        });
    });
}

// تعيين إشعار كمقروء
function markNotificationAsRead(notificationId) {
    if (!window.notifications) return;
    
    // البحث عن الإشعار
    const notification = window.notifications.find(n => n.id === notificationId);
    
    if (!notification || notification.read) return;
    
    // تحديث الإشعار محليًا
    notification.read = true;
    
    // تحديث قاعدة البيانات
    const db = firebase.database();
    db.ref(`notifications/${notificationId}/read`).set(true)
        .then(() => {
            console.log("تم تعيين الإشعار كمقروء");
            
            // تحديث واجهة المستخدم
            renderNotifications();
            updateNotificationBadge();
        })
        .catch(error => {
            console.error("خطأ في تحديث حالة الإشعار:", error);
        });
}

// ==================== المشاركة ====================
// عرض نافذة عرض QR
function showQRModal() {
    if (!cards || cards.length === 0) {
        console.error("لا توجد بطاقة للمستثمر");
        return;
    }
    
    const card = cards[0];
    const qrModal = document.getElementById('qr-modal');
    
    if (!qrModal) {
        console.error("لم يتم العثور على نافذة عرض QR");
        return;
    }
    
    // عرض QR Code
    const qrContainer = document.getElementById('card-qr-code');
    
    if (qrContainer) {
        qrContainer.innerHTML = '';
        
        // إنشاء QR Code باستخدام مكتبة QRCode.js
        if (window.QRCode) {
            new QRCode(qrContainer, {
                text: card.id,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            // استخدام API خارجي إذا لم تكن المكتبة متاحة
            const img = document.createElement('img');
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${card.id}`;
            img.alt = "QR Code";
            qrContainer.appendChild(img);
        }
    }
    
    // إضافة مستمع لزر الحفظ
    const saveQrBtn = document.getElementById('save-qr-btn');
    
    if (saveQrBtn) {
        saveQrBtn.onclick = function() {
            saveQRCode();
        };
    }
    
    // عرض النافذة
    qrModal.classList.add('active');
}

// حفظ QR Code كصورة
function saveQRCode() {
    const qrContainer = document.getElementById('card-qr-code');
    
    if (!qrContainer || !qrContainer.querySelector('img')) {
        showToast('لا يمكن حفظ صورة QR Code', 'error');
        return;
    }
    
    // الحصول على الصورة
    const img = qrContainer.querySelector('img');
    
    // إنشاء رابط لتنزيل الصورة
    const link = document.createElement('a');
    link.href = img.src;
    link.download = `qr_code_${currentUser ? currentUser.name.replace(/\s+/g, '_') : 'card'}.png`;
    
    // محاكاة النقر على الرابط
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('تم حفظ صورة QR Code', 'success');
}

// عرض نافذة المشاركة
function showShareModal() {
    if (!cards || cards.length === 0 || !currentUser) {
        console.error("لا توجد بيانات للمشاركة");
        return;
    }
    
    const shareModal = document.getElementById('share-modal');
    
    if (!shareModal) {
        console.error("لم يتم العثور على نافذة المشاركة");
        return;
    }
    
    // إعداد نص المشاركة
    const card = cards[0];
    const investor = investors[0];
    
    const shareText = document.getElementById('share-text');
    if (shareText) {
        shareText.value = `
بطاقة المستثمر

الاسم: ${investor.name}
رقم البطاقة: ${maskCardNumber(card.cardNumber)}
تاريخ الإصدار: ${formatDate(card.createdAt)}
تاريخ الانتهاء: ${formatDate(card.expiryDate)}
نوع البطاقة: ${getCardTypeName(card.cardType)}

نظام الاستثمار المتكامل
        `.trim();
    }
    
    // عرض النافذة
    shareModal.classList.add('active');
}

// مشاركة البطاقة
function shareCard(method) {
    if (!currentUser || !cards || cards.length === 0) {
        showToast('لا توجد بيانات للمشاركة', 'error');
        return;
    }
    
    const shareText = document.getElementById('share-text').value;
    
    switch (method) {
        case 'whatsapp':
            // مشاركة عبر واتساب
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
            break;
        case 'email':
            // مشاركة عبر البريد الإلكتروني
            window.open(`mailto:?subject=بطاقة المستثمر - ${currentUser.name}&body=${encodeURIComponent(shareText)}`, '_blank');
            break;
        case 'copy':
            // نسخ النص
            navigator.clipboard.writeText(shareText)
                .then(() => {
                    showToast('تم نسخ النص بنجاح', 'success');
                })
                .catch(() => {
                    // طريقة بديلة إذا لم تكن clipboard API متاحة
                    const textArea = document.getElementById('share-text');
                    textArea.select();
                    document.execCommand('copy');
                    showToast('تم نسخ النص بنجاح', 'success');
                });
            break;
    }
}

// عرض نافذة الاتصال بالدعم
function showSupportModal() {
    const supportModal = document.getElementById('support-modal');
    
    if (!supportModal) {
        console.error("لم يتم العثور على نافذة الدعم");
        return;
    }
    
    // عرض النافذة
    supportModal.classList.add('active');
}

// إرسال طلب دعم
function sendSupportRequest() {
    const subject = document.getElementById('support-subject').value.trim();
    const message = document.getElementById('support-message').value.trim();
    
    if (!subject || !message) {
        showToast('الرجاء إدخال الموضوع والرسالة', 'error');
        return;
    }
    
    // إظهار مؤشر التحميل
    showLoading('send-support-message');
    
    // حفظ طلب الدعم في قاعدة البيانات
    const db = firebase.database();
    const supportRequest = {
        investorId: currentUser.id,
        investorName: currentUser.name,
        subject: subject,
        message: message,
        date: new Date().toISOString(),
        status: 'new',
        read: false
    };
    
    db.ref('support_requests').push(supportRequest)
        .then(() => {
            hideLoading('send-support-message');
            showToast('تم إرسال طلب الدعم بنجاح', 'success');
            
            // إغلاق النافذة
            document.getElementById('support-modal').classList.remove('active');
            
            // إعادة تعيين النموذج
            document.getElementById('support-subject').value = '';
            document.getElementById('support-message').value = '';
        })
        .catch(error => {
            hideLoading('send-support-message');
            console.error("خطأ في إرسال طلب الدعم:", error);
            showToast('حدث خطأ أثناء إرسال طلب الدعم', 'error');
        });
}

// ==================== وظائف مساعدة ====================
// تنسيق التاريخ
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch (error) {
        return dateString;
    }
}

// تنسيق تاريخ انتهاء البطاقة
function formatExpiryDate(dateString) {
    if (!dateString) return 'MM/YY';
    
    try {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear().toString().slice(2);
        
        return `${month}/${year}`;
    } catch (error) {
        return 'MM/YY';
    }
}

// تنسيق الوقت النسبي
function formatRelativeTime(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffSeconds = Math.floor((now - date) / 1000);
        
        if (diffSeconds < 60) {
            return 'منذ أقل من دقيقة';
        } else if (diffSeconds < 3600) {
            const minutes = Math.floor(diffSeconds / 60);
            return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
        } else if (diffSeconds < 86400) {
            const hours = Math.floor(diffSeconds / 3600);
            return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
        } else if (diffSeconds < 604800) {
            const days = Math.floor(diffSeconds / 86400);
            return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
        } else {
            return formatDate(dateString);
        }
    } catch (error) {
        return dateString;
    }
}

// تنسيق العملة
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0 دينار';
    
    try {
        // تقريب المبلغ لأقرب عدد صحيح
        const roundedAmount = Math.round(amount);
        
        // تنسيق الرقم بالآلاف
        return roundedAmount.toLocaleString('ar-IQ') + ' دينار';
    } catch (error) {
        return amount + ' دينار';
    }
}

// تنسيق رقم البطاقة
function formatCardNumber(cardNumber) {
    // إزالة المسافات
    const number = cardNumber.replace(/\s+/g, '');
    
    // إضافة مسافات كل 4 أرقام
    return number.replace(/(\d{4})(?=\d)/g, '$1 ');
}

// إخفاء أرقام البطاقة
function maskCardNumber(cardNumber) {
    // إزالة المسافات
    const number = cardNumber.replace(/\s+/g, '');
    
    // إبقاء الأرقام الأربعة الأخيرة وإخفاء الباقي
    const masked = 'X'.repeat(number.length - 4) + number.slice(-4);
    
    // إضافة مسافات كل 4 أرقام
    return masked.replace(/(.{4})/g, '$1 ').trim();
}

// التحقق من صحة تنسيق تاريخ الانتهاء
function isValidExpiryDate(expiryDate) {
    // التحقق من التنسيق MM/YY
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        return false;
    }
    
    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // آخر رقمين من السنة
    const currentMonth = currentDate.getMonth() + 1; // الشهور تبدأ من 0
    
    // التحقق من صحة الشهر
    if (parseInt(month) < 1 || parseInt(month) > 12) {
        return false;
    }
    
    // التحقق من صلاحية التاريخ (غير منتهي)
    if (parseInt(year) < currentYear || 
        (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        return false;
    }
    
    return true;
}

// الحصول على نص نوع العملية
function getTransactionTypeText(type) {
    switch (type) {
        case 'deposit':
            return 'إيداع';
        case 'withdraw':
            return 'سحب';
        case 'profit':
            return 'ربح';
        case 'transfer':
            return 'تحويل';
        default:
            return type;
    }
}

// الحصول على اسم نوع البطاقة
function getCardTypeName(cardType) {
    switch (cardType) {
        case 'platinum':
            return 'بلاتينية';
        case 'gold':
            return 'ذهبية';
        case 'premium':
            return 'بريميوم';
        case 'diamond':
            return 'ماسية';
        case 'islamic':
            return 'إسلامية';
        case 'custom':
            return 'مخصصة';
        default:
            return cardType;
    }
}

// إظهار رسالة خطأ
function showError(message, elementId = 'login-error') {
    const errorElement = document.getElementById(elementId);
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // إخفاء الرسالة بعد 5 ثوانٍ
        setTimeout(() => {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }, 5000);
    } else {
        showToast(message, 'error');
    }
}

// إظهار إشعار منبثق
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast-notification');
    
    if (!toast) {
        console.error("لم يتم العثور على عنصر الإشعار المنبثق");
        return;
    }
    
    // تحديد عنوان الإشعار والأيقونة حسب النوع
    let title = 'معلومات';
    let icon = 'fa-info-circle';
    
    switch (type) {
        case 'success':
            title = 'نجاح';
            icon = 'fa-check-circle';
            toast.style.borderRight = '4px solid #2ecc71';
            break;
        case 'error':
            title = 'خطأ';
            icon = 'fa-times-circle';
            toast.style.borderRight = '4px solid #e74c3c';
            break;
        case 'warning':
            title = 'تحذير';
            icon = 'fa-exclamation-triangle';
            toast.style.borderRight = '4px solid #f39c12';
            break;
        default:
            toast.style.borderRight = '4px solid #3498db';
    }
    
    // تحديث محتوى الإشعار
    toast.querySelector('.toast-icon i').className = `fas ${icon}`;
    toast.querySelector('.toast-title').textContent = title;
    toast.querySelector('.toast-message').textContent = message;
    
    // إظهار الإشعار
    toast.classList.add('show');
    
    // إخفاء الإشعار بعد 3 ثوانٍ
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
    
    // إضافة مستمع لزر الإغلاق
    toast.querySelector('.toast-close').onclick = function() {
        toast.classList.remove('show');
    };
}

// إظهار مؤشر التحميل
function showLoading(buttonId) {
    const button = document.getElementById(buttonId);
    
    if (button) {
        // حفظ النص الأصلي
        button.dataset.originalText = button.innerHTML;
        
        // تغيير النص إلى مؤشر التحميل
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>جار التحميل...</span>';
        
        // تعطيل الزر
        button.disabled = true;
    }
}

// إخفاء مؤشر التحميل
function hideLoading(buttonId) {
    const button = document.getElementById(buttonId);
    
    if (button) {
        // استعادة النص الأصلي
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }
        
        // تفعيل الزر
        button.disabled = false;
    }
}

// ==================== تنسيق إدخال بيانات البطاقة ====================
// تنسيق رقم البطاقة أثناء الإدخال
document.getElementById('card-number').addEventListener('input', function(e) {
    // إزالة الأحرف غير الرقمية
    let input = this.value.replace(/\D/g, '');
    
    // تقييد الطول إلى 16 رقمًا
    if (input.length > 16) {
        input = input.slice(0, 16);
    }
    
    // إضافة مسافات بعد كل 4 أرقام
    input = input.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    // تحديث قيمة الحقل
    this.value = input;
});

// تنسيق تاريخ انتهاء الصلاحية أثناء الإدخال
document.getElementById('card-expiry').addEventListener('input', function(e) {
    // إزالة الأحرف غير الرقمية
    let input = this.value.replace(/\D/g, '');
    
    // تقييد الطول إلى 4 أرقام
    if (input.length > 4) {
        input = input.slice(0, 4);
    }
    
    // إضافة / بعد الشهر
    if (input.length > 2) {
        input = input.slice(0, 2) + '/' + input.slice(2);
    }
    
    // تحديث قيمة الحقل
    this.value = input;
    
    // تصحيح قيمة الشهر
    if (input.length >= 2) {
        const month = parseInt(input.slice(0, 2));
        
        if (month > 12) {
            this.value = '12' + (input.length > 2 ? '/' + input.slice(3) : '');
        } else if (month === 0) {
            this.value = '01' + (input.length > 2 ? '/' + input.slice(3) : '');
        }
    }
});

// تنسيق رمز CVV أثناء الإدخال
document.getElementById('card-cvv').addEventListener('input', function(e) {
    // إزالة الأحرف غير الرقمية
    this.value = this.value.replace(/\D/g, '');
    
    // تقييد الطول إلى 3 أرقام
    if (this.value.length > 3) {
        this.value = this.value.slice(0, 3);
    }
});

// ==================== بدء التطبيق ====================
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة التطبيق
    initializeApp();
});