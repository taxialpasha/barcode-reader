/**
 * نظام بطاقة المستثمر - الإصدار المحدث
 * تم التحديث: 2025-04-30
 */

// إعداد Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDGpAHia_wEmrhnmYjrPf1n1TrAzwEMiAI",
                    authDomain: "messageemeapp.firebaseapp.com",
                    databaseURL: "https://messageemeapp-default-rtdb.firebaseio.com",
                    projectId: "messageemeapp",
                    storageBucket: "messageemeapp.appspot.com",
                    messagingSenderId: "255034474844",
                    appId: "1:255034474844:web:5e3b7a6bc4b2fb94cc4199"
                };

// قم بتعديل هذا ليناسب بيانات Firebase الخاصة بك
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// الكائن الرئيسي للتطبيق
const InvestorCardApp = {
    // المتغيرات العامة
    currentUser: null,
    db: firebase.database(),
    auth: firebase.auth(),
    cardData: null,
    notificationsCount: 0,
    
    // تهيئة التطبيق
    init: function() {
        this.initEventListeners();
        this.initTabSystem();
        this.showScreen('login-screen');
        
        // إذا كان المستخدم مسجل الدخول مسبقاً
        this.auth.onAuthStateChanged(user => {
            if (user) {
                this.currentUser = user;
                this.loadUserData();
            }
        });
    },
    
    // تسجيل المستمعات للأحداث
    initEventListeners: function() {
        // أحداث تسجيل الدخول
        document.getElementById('card-login-form').addEventListener('submit', e => {
            e.preventDefault();
            this.loginWithCard();
        });
        
        document.getElementById('phone-login-form').addEventListener('submit', e => {
            e.preventDefault();
            this.loginWithPhone();
        });
        
        // أحداث الواجهة
        document.getElementById('flip-card-btn').addEventListener('click', () => this.flipCard());
        document.getElementById('show-qr-btn').addEventListener('click', () => this.showQRModal());
        document.getElementById('share-card-btn').addEventListener('click', () => this.showShareModal());
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        document.getElementById('notifications-btn').addEventListener('click', () => this.showNotificationsModal());
        document.getElementById('contact-support-btn').addEventListener('click', () => this.showSupportModal());
        document.getElementById('contact-btn').addEventListener('click', () => this.showSupportModal());
        
        // معالجة أرقام البطاقة
        const cardNumberInput = document.getElementById('card-number');
        cardNumberInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length > 0) {
                value = value.match(/.{1,4}/g).join(' ');
            }
            this.value = value;
        });
        
        // معالجة تاريخ الانتهاء
        const cardExpiryInput = document.getElementById('card-expiry');
        cardExpiryInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length > 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            this.value = value;
        });
        
        // معالجة إدخال PIN
        const pinInputs = document.querySelectorAll('.pin-input');
        pinInputs.forEach((input, index) => {
            input.addEventListener('input', function() {
                if (this.value && index < pinInputs.length - 1) {
                    pinInputs[index + 1].focus();
                }
                
                let pin = '';
                pinInputs.forEach(input => pin += input.value);
                document.getElementById('card-pin').value = pin;
            });
            
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && !this.value && index > 0) {
                    pinInputs[index - 1].focus();
                }
            });
        });
        
        // معالجات النوافذ المنبثقة
        document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const modalId = this.closest('.modal').id;
                InvestorCardApp.closeModal(modalId);
            });
        });
        
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', function() {
                const modalId = this.closest('.modal').id;
                InvestorCardApp.closeModal(modalId);
            });
        });
        
        // معالجة مشاركة البطاقة
        document.querySelectorAll('.share-option').forEach(option => {
            option.addEventListener('click', function() {
                const method = this.getAttribute('data-method');
                InvestorCardApp.shareCard(method);
            });
        });
        
        // معالجة تصفية المعاملات
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const filter = this.getAttribute('data-filter');
                InvestorCardApp.filterTransactions(filter);
            });
        });
        
        // معالجة علامة قراءة الإشعارات
        document.getElementById('mark-read-btn').addEventListener('click', () => this.markAllNotificationsAsRead());
        
        // معالجة إرسال رسالة الدعم
        document.getElementById('send-support-message').addEventListener('click', () => this.sendSupportMessage());
        
        // معالجة عناصر التنقل - أيقونات جديدة
        document.querySelectorAll('.nav-item').forEach((item, index) => {
            item.addEventListener('click', function() {
                // تعامل مع الأقسام المختلفة حسب الأيقونة التي تم النقر عليها
                switch(index) {
                    case 0: // الرصيد
                        InvestorCardApp.showBalanceInfo();
                        break;
                    case 1: // الإعدادات
                        InvestorCardApp.showSettings();
                        break;
                    case 2: // الربح
                        InvestorCardApp.showProfitInfo();
                        break;
                    case 3: // إيداع
                        InvestorCardApp.showDepositOptions();
                        break;
                    case 4: // إضافة
                        InvestorCardApp.showAddOptions();
                        break;
                    case 5: // تحويل
                        InvestorCardApp.showTransferOptions();
                        break;
                    case 6: // المعاملات
                        InvestorCardApp.showTransactions();
                        break;
                }
            });
        });
        
        // معالجة شريط التنقل السفلي
        document.querySelectorAll('.bottom-navbar .nav-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                document.querySelectorAll('.bottom-navbar .nav-item').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                
                const href = this.getAttribute('href').substring(1);
                InvestorCardApp.navigateTo(href);
            });
        });
    },
    
    // تهيئة نظام التبويبات
    initTabSystem: function() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const tabGroup = this.closest('.tab-buttons');
                const tabsContainer = tabGroup.closest('.tabs') || tabGroup.parentElement;
                
                tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const targetTab = this.getAttribute('data-tab');
                tabsContainer.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.remove('active');
                });
                
                document.getElementById(targetTab + '-tab').classList.add('active');
            });
        });
    },
    
    // إظهار الشاشة المحددة
    showScreen: function(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    },
    
    // تسجيل الدخول باستخدام البطاقة
    loginWithCard: function() {
        const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
        const cardExpiry = document.getElementById('card-expiry').value;
        const cardCVV = document.getElementById('card-cvv').value;
        
        if (!cardNumber || !cardExpiry || !cardCVV) {
            this.showError('login-error', 'يرجى ملء جميع الحقول المطلوبة');
            return;
        }
        
        // في الإصدار النهائي، يجب التحقق من هذه البيانات مع Firebase
        // لغرض العرض التوضيحي، نستخدم بيانات تجريبية
        if (cardNumber === '1234567890123456' && cardExpiry === '12/25' && cardCVV === '123') {
            // إنشاء بيانات تجريبية للبطاقة
            this.cardData = {
                cardNumber: '1234 5678 9012 3456',
                cardHolderName: 'المستثمر',
                cardExpiry: '12/25',
                cardCVV: '123',
                balance: 6900000,
                monthlyProfit: 150000,
                investmentDays: 180,
                nextProfitDate: '15/05/2025',
                cardType: 'بلاتينية',
                cardIssueDate: '01/01/2025',
                cardExpiryDate: '31/12/2025',
                cardStatus: 'نشطة',
                phone: '+964 780 000 0000',
                address: 'بغداد، العراق',
                joinDate: '01/01/2025',
                totalReceivedProfits: 450000,
                currentProfit: 50000,
                targetProfit: 100000,
                profitPercentage: 50
            };
            
            this.loadDashboard();
        } else {
            this.showError('login-error', 'بيانات البطاقة غير صحيحة');
        }
    },
    
    // تسجيل الدخول باستخدام رقم الهاتف
    loginWithPhone: function() {
        const phoneNumber = document.getElementById('phone-number').value;
        const investorName = document.getElementById('investor-name').value;
        
        if (!phoneNumber || !investorName) {
            this.showError('phone-login-error', 'يرجى ملء جميع الحقول المطلوبة');
            return;
        }
        
        // في الإصدار النهائي، يجب التحقق من هذه البيانات مع Firebase
        // لغرض العرض التوضيحي، نستخدم بيانات تجريبية
        if (phoneNumber === '07800000000' && investorName === 'المستثمر') {
            // إنشاء بيانات تجريبية للبطاقة
            this.cardData = {
                cardNumber: '1234 5678 9012 3456',
                cardHolderName: 'المستثمر',
                cardExpiry: '12/25',
                cardCVV: '123',
                balance: 6900000,
                monthlyProfit: 150000,
                investmentDays: 180,
                nextProfitDate: '15/05/2025',
                cardType: 'بلاتينية',
                cardIssueDate: '01/01/2025',
                cardExpiryDate: '31/12/2025',
                cardStatus: 'نشطة',
                phone: '+964 780 000 0000',
                address: 'بغداد، العراق',
                joinDate: '01/01/2025',
                totalReceivedProfits: 450000,
                currentProfit: 50000,
                targetProfit: 100000,
                profitPercentage: 50
            };
            
            this.loadDashboard();
        } else {
            this.showError('phone-login-error', 'بيانات المستخدم غير صحيحة');
        }
    },
    
    // تحميل لوحة البطاقة بعد تسجيل الدخول
    loadDashboard: function() {
        // عرض شاشة البطاقة
        this.showScreen('card-dashboard');
        
        // تحديث بيانات البطاقة في الواجهة
        document.getElementById('user-name').textContent = this.cardData.cardHolderName;
        document.getElementById('user-initial').textContent = this.cardData.cardHolderName.charAt(0);
        
        // تحديث معلومات البطاقة
        document.getElementById('display-card-number').textContent = this.cardData.cardNumber;
        document.getElementById('display-card-name').textContent = this.cardData.cardHolderName;
        document.getElementById('display-card-expiry').textContent = this.cardData.cardExpiry;
        document.getElementById('display-cvv').textContent = this.cardData.cardCVV;
        document.getElementById('display-phone').textContent = this.cardData.phone;
        
        // تحديث معلومات الرصيد والربح
        document.getElementById('total-balance').textContent = this.cardData.balance.toLocaleString() + ' IQD';
        document.getElementById('monthly-profit').textContent = this.cardData.monthlyProfit.toLocaleString() + ' دينار';
        document.getElementById('investment-days').textContent = this.cardData.investmentDays;
        document.getElementById('next-profit-date').textContent = this.cardData.nextProfitDate;
        
        // تحديث معلومات المستثمر
        document.getElementById('investor-full-name').textContent = this.cardData.cardHolderName;
        document.getElementById('investor-phone-number').textContent = this.cardData.phone;
        document.getElementById('investor-address').textContent = this.cardData.address;
        document.getElementById('investor-join-date').textContent = this.cardData.joinDate;
        
        // تحديث معلومات البطاقة
        document.getElementById('card-type').textContent = this.cardData.cardType;
        document.getElementById('card-issue-date').textContent = this.cardData.cardIssueDate;
        document.getElementById('card-expiry-date').textContent = this.cardData.cardExpiryDate;
        
        // تحديث حالة البطاقة
        const cardStatusBadge = document.getElementById('card-status-badge-info');
        cardStatusBadge.textContent = this.cardData.cardStatus;
        
        // تحديث معلومات الربح
        document.getElementById('total-received-profits').textContent = this.cardData.totalReceivedProfits.toLocaleString() + ' دينار';
        document.getElementById('current-profit').textContent = this.cardData.currentProfit.toLocaleString() + ' دينار';
        document.getElementById('target-profit').textContent = this.cardData.targetProfit.toLocaleString() + ' دينار';
        document.getElementById('profit-percentage').textContent = this.cardData.profitPercentage + '%';
        document.querySelector('.progress-fill').style.width = this.cardData.profitPercentage + '%';
        
        // تحديث مزايا البطاقة
        const benefitsList = document.getElementById('benefits-list');
        benefitsList.innerHTML = '';
        const benefits = [
            'عمولات تحويل مخفضة',
            'دعم فني على مدار الساعة',
            'إشعارات فورية للمعاملات',
            'تقارير أرباح مفصلة',
            'خدمة عملاء VIP'
        ];
        
        benefits.forEach(benefit => {
            const li = document.createElement('li');
            li.textContent = benefit;
            benefitsList.appendChild(li);
        });
        
        // تحميل المعاملات (تجريبية)
        this.loadTransactions();
        
        // تحميل الاستثمارات (تجريبية)
        this.loadInvestments();
        
        // تحميل الأرباح (تجريبية)
        this.loadProfits();
        
        // تهيئة QR Code
        this.generateQRCode();
        
        // تحميل الإشعارات (تجريبية)
        this.loadNotifications();
    },
    
    // تحميل المعاملات
    loadTransactions: function() {
        const transactionsList = document.getElementById('transactions-list');
        transactionsList.innerHTML = '';
        
        // معاملات تجريبية
        const transactions = [
            {
                id: 1,
                title: 'إيداع رصيد',
                date: '25/04/2025',
                amount: 1000000,
                type: 'deposit'
            },
            {
                id: 2,
                title: 'سحب رصيد',
                date: '20/04/2025',
                amount: -500000,
                type: 'withdraw'
            },
            {
                id: 3,
                title: 'استلام أرباح',
                date: '15/04/2025',
                amount: 150000,
                type: 'profit'
            },
            {
                id: 4,
                title: 'إيداع رصيد',
                date: '10/04/2025',
                amount: 2000000,
                type: 'deposit'
            },
            {
                id: 5,
                title: 'سحب رصيد',
                date: '05/04/2025',
                amount: -200000,
                type: 'withdraw'
            }
        ];
        
        // إضافة المعاملات إلى القائمة
        transactions.forEach(transaction => {
            const isPositive = transaction.amount > 0;
            
            const item = document.createElement('div');
            item.className = `data-item transaction-item ${transaction.type}`;
            item.innerHTML = `
                <div class="data-item-header">
                    <div class="data-item-title">${transaction.title}</div>
                    <div class="data-item-date">${transaction.date}</div>
                </div>
                <div class="data-item-amount" style="color: ${isPositive ? 'var(--success-color)' : 'var(--danger-color)'}">
                    ${isPositive ? '+' : ''}${transaction.amount.toLocaleString()} دينار
                </div>
            `;
            
            transactionsList.appendChild(item);
        });
    },
    
    // تحميل الاستثمارات
    loadInvestments: function() {
        const investmentsList = document.getElementById('investments-list');
        investmentsList.innerHTML = '';
        
        // استثمارات تجريبية
        const investments = [
            {
                id: 1,
                title: 'استثمار أساسي',
                date: '01/01/2025',
                amount: 5000000,
                profit: 150000,
                profitPercentage: 3
            },
            {
                id: 2,
                title: 'استثمار إضافي',
                date: '15/03/2025',
                amount: 2000000,
                profit: 50000,
                profitPercentage: 2.5
            }
        ];
        
        // إضافة الاستثمارات إلى القائمة
        investments.forEach(investment => {
            const item = document.createElement('div');
            item.className = 'data-item investment-item';
            item.innerHTML = `
                <div class="data-item-header">
                    <div class="data-item-title">${investment.title}</div>
                    <div class="data-item-date">تاريخ البدء: ${investment.date}</div>
                </div>
                <div class="data-item-details">
                    <div>المبلغ: <strong>${investment.amount.toLocaleString()} دينار</strong></div>
                    <div>الربح الشهري: <strong>${investment.profit.toLocaleString()} دينار (${investment.profitPercentage}%)</strong></div>
                </div>
            `;
            
            investmentsList.appendChild(item);
        });
    },
    
    // تحميل الأرباح
    loadProfits: function() {
        const profitsList = document.getElementById('profits-list');
        profitsList.innerHTML = '';
        
        // أرباح تجريبية
        const profits = [
            {
                id: 1,
                title: 'ربح شهر أبريل',
                date: '15/04/2025',
                amount: 150000
            },
            {
                id: 2,
                title: 'ربح شهر مارس',
                date: '15/03/2025',
                amount: 150000
            },
            {
                id: 3,
                title: 'ربح شهر فبراير',
                date: '15/02/2025',
                amount: 150000
            }
        ];
        
        // إضافة الأرباح إلى القائمة
        profits.forEach(profit => {
            const item = document.createElement('div');
            item.className = 'data-item profit-item';
            item.innerHTML = `
                <div class="data-item-header">
                    <div class="data-item-title">${profit.title}</div>
                    <div class="data-item-date">${profit.date}</div>
                </div>
                <div class="data-item-amount" style="color: var(--success-color)">
                    ${profit.amount.toLocaleString()} دينار
                </div>
            `;
            
            profitsList.appendChild(item);
        });
    },
    
    // تحميل الإشعارات
    loadNotifications: function() {
        const notificationsList = document.getElementById('notifications-list');
        notificationsList.innerHTML = '';
        
        // إشعارات تجريبية
        const notifications = [
            {
                id: 1,
                title: 'تم إيداع الربح الشهري',
                message: 'تم إيداع الربح الشهري بقيمة 150,000 دينار في حسابك',
                date: '15/04/2025',
                read: false
            },
            {
                id: 2,
                title: 'عملية سحب ناجحة',
                message: 'تم سحب مبلغ 500,000 دينار من حسابك',
                date: '20/04/2025',
                read: true
            },
            {
                id: 3,
                title: 'عملية إيداع ناجحة',
                message: 'تم إيداع مبلغ 1,000,000 دينار في حسابك',
                date: '25/04/2025',
                read: true
            }
        ];
        
        // حساب الإشعارات غير المقروءة
        this.notificationsCount = notifications.filter(n => !n.read).length;
        document.querySelector('.notification-badge').textContent = this.notificationsCount;
        
        // إضافة الإشعارات إلى القائمة
        notifications.forEach(notification => {
            const item = document.createElement('div');
            item.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
            item.innerHTML = `
                <div class="notification-header">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-date">${notification.date}</div>
                </div>
                <div class="notification-message">${notification.message}</div>
            `;
            
            notificationsList.appendChild(item);
        });
    },
    
    // إنشاء QR Code
    generateQRCode: function() {
        const cardInfo = {
            cardNumber: this.cardData.cardNumber,
            cardHolderName: this.cardData.cardHolderName,
            cardExpiry: this.cardData.cardExpiry
        };
        
        const qrCodeData = JSON.stringify(cardInfo);
        
        QRCode.toCanvas(document.getElementById('card-qr-code'), qrCodeData, {
            width: 200,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
    },
    
    // قلب البطاقة
    flipCard: function() {
        const card = document.querySelector('.investor-card');
        card.classList.toggle('flipped');
        
        const flipBtn = document.getElementById('flip-card-btn');
        if (card.classList.contains('flipped')) {
            flipBtn.querySelector('span').textContent = 'عرض الأمام';
        } else {
            flipBtn.querySelector('span').textContent = 'عرض الخلف';
        }
    },
    
    // إظهار نافذة QR Code
    showQRModal: function() {
        document.getElementById('qr-modal').classList.add('active');
    },
    
    // إظهار نافذة المشاركة
    showShareModal: function() {
        const shareText = `بطاقة المستثمر
الاسم: ${this.cardData.cardHolderName}
رقم البطاقة: ${this.cardData.cardNumber}
الهاتف: ${this.cardData.phone}`;
        
        document.getElementById('share-text').value = shareText;
        document.getElementById('share-modal').classList.add('active');
    },
    
    // إظهار نافذة الإشعارات
    showNotificationsModal: function() {
        document.getElementById('notifications-modal').classList.add('active');
    },
    
    // إظهار نافذة الاتصال بالدعم
    showSupportModal: function() {
        document.getElementById('support-modal').classList.add('active');
    },
    
    // إغلاق النافذة المنبثقة
    closeModal: function(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },
    
    // مشاركة البطاقة
    shareCard: function(method) {
        const shareText = document.getElementById('share-text').value;
        
        switch (method) {
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
                break;
            case 'email':
                window.open(`mailto:?subject=بطاقة المستثمر&body=${encodeURIComponent(shareText)}`);
                break;
            case 'copy':
                navigator.clipboard.writeText(shareText);
                alert('تم نسخ النص إلى الحافظة');
                break;
        }
    },
    
    // تصفية المعاملات
    filterTransactions: function(filter) {
        const items = document.querySelectorAll('.transaction-item');
        
        items.forEach(item => {
            if (filter === 'all' || item.classList.contains(filter)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    // تعيين جميع الإشعارات كمقروءة
    markAllNotificationsAsRead: function() {
        document.querySelectorAll('.notification-item').forEach(item => {
            item.classList.remove('unread');
            item.classList.add('read');
        });
        
        this.notificationsCount = 0;
        document.querySelector('.notification-badge').textContent = this.notificationsCount;
    },
    
    // إرسال رسالة دعم
    sendSupportMessage: function() {
        const subject = document.getElementById('support-subject').value;
        const message = document.getElementById('support-message').value;
        
        if (!subject || !message) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }
        
        // في الإصدار النهائي، يجب إرسال هذه البيانات إلى Firebase
        alert('تم إرسال رسالتك بنجاح. سنرد عليك في أقرب وقت ممكن.');
        
        document.getElementById('support-subject').value = '';
        document.getElementById('support-message').value = '';
        this.closeModal('support-modal');
    },
    
    // عرض رسالة خطأ
    showError: function(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 3000);
    },
    
    // تسجيل الخروج
    logout: function() {
        this.auth.signOut().then(() => {
            this.currentUser = null;
            this.cardData = null;
            this.showScreen('login-screen');
        }).catch(error => {
            console.error('خطأ في تسجيل الخروج:', error);
        });
    },
    
    // تحميل بيانات المستخدم من Firebase
    loadUserData: function() {
        // في الإصدار النهائي، يجب استرداد بيانات المستخدم من Firebase
        // لغرض العرض التوضيحي، نستخدم بيانات تجريبية
        this.cardData = {
            cardNumber: '1234 5678 9012 3456',
            cardHolderName: this.currentUser.displayName || 'المستثمر',
            cardExpiry: '12/25',
            cardCVV: '123',
            balance: 6900000,
            monthlyProfit: 150000,
            investmentDays: 180,
            nextProfitDate: '15/05/2025',
            cardType: 'بلاتينية',
            cardIssueDate: '01/01/2025',
            cardExpiryDate: '31/12/2025',
            cardStatus: 'نشطة',
            phone: this.currentUser.phoneNumber || '+964 780 000 0000',
            address: 'بغداد، العراق',
            joinDate: '01/01/2025',
            totalReceivedProfits: 450000,
            currentProfit: 50000,
            targetProfit: 100000,
            profitPercentage: 50
        };
        
        this.loadDashboard();
    },
    
    // التنقل إلى قسم محدد
    navigateTo: function(section) {
        switch (section) {
            case 'home':
                // إعادة تحميل الشاشة الرئيسية
                break;
            case 'transactions':
                document.querySelector('.tab-btn[data-tab="transactions"]').click();
                break;
            case 'profits':
                document.querySelector('.tab-btn[data-tab="profits"]').click();
                break;
            case 'profile':
                document.querySelector('.tab-btn[data-tab="info"]').click();
                break;
        }
    },
    
    // عرض معلومات الرصيد
    showBalanceInfo: function() {
        alert(`الرصيد الحالي: ${this.cardData.balance.toLocaleString()} دينار`);
    },
    
    // عرض إعدادات البطاقة
    showSettings: function() {
        // تنفيذ إعدادات البطاقة
        alert('صفحة الإعدادات قيد التطوير');
    },
    
    // عرض معلومات الربح
    showProfitInfo: function() {
        document.querySelector('.tab-btn[data-tab="profits"]').click();
        document.querySelector('.info-tabs').classList.remove('hidden-section');
    },
    
    // عرض خيارات الإيداع
    showDepositOptions: function() {
        // تنفيذ خيارات الإيداع
        alert('خيارات الإيداع قيد التطوير');
    },
    
    // عرض خيارات الإضافة
    showAddOptions: function() {
        // تنفيذ خيارات الإضافة
        alert('خيارات الإضافة قيد التطوير');
    },
    
    // عرض خيارات التحويل
    showTransferOptions: function() {
        // تنفيذ خيارات التحويل
        alert('خيارات التحويل قيد التطوير');
    },
    
    // عرض المعاملات
    showTransactions: function() {
        document.querySelector('.tab-btn[data-tab="transactions"]').click();
        document.querySelector('.info-tabs').classList.remove('hidden-section');
    }
};

// تشغيل التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    InvestorCardApp.init();
    
    // للاختبار: تسجيل الدخول تلقائياً (إزالة في الإصدار النهائي)
    // InvestorCardApp.loginWithCard();
});

/**
 * ملف الوظائف المساعدة لتطبيق بطاقة المستثمر
 * يتضمن وظائف مختلفة للتعامل مع واجهة المستخدم وتنسيق البيانات
 */

// كائن الوظائف المساعدة
const InvestorCardUtils = {
    /**
     * تنسيق رقم البطاقة
     * @param {string} cardNumber - رقم البطاقة بدون تنسيق
     * @returns {string} - رقم البطاقة المنسق على شكل XXXX XXXX XXXX XXXX
     */
    formatCardNumber: function(cardNumber) {
        // إزالة المسافات
        const cleaned = cardNumber.replace(/\s+/g, '');
        // إضافة مسافة بعد كل 4 أرقام
        const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
        return formatted;
    },
    
    /**
     * إخفاء جزء من رقم البطاقة للعرض الآمن
     * @param {string} cardNumber - رقم البطاقة
     * @returns {string} - رقم البطاقة مع إخفاء الأرقام الوسطى
     */
    maskCardNumber: function(cardNumber) {
        // إزالة المسافات
        const cleaned = cardNumber.replace(/\s+/g, '');
        
        // إظهار أول 4 وآخر 4 أرقام فقط
        const firstPart = cleaned.substring(0, 4);
        const lastPart = cleaned.substring(cleaned.length - 4);
        const maskedPart = '•••• ••••';
        
        return `${firstPart} ${maskedPart} ${lastPart}`;
    },
    
    /**
     * تنسيق تاريخ الانتهاء
     * @param {string} expiry - تاريخ الانتهاء
     * @returns {string} - تاريخ الانتهاء المنسق على شكل MM/YY
     */
    formatExpiry: function(expiry) {
        // إزالة الأحرف غير الرقمية
        const cleaned = expiry.replace(/\D/g, '');
        
        if (cleaned.length >= 3) {
            const month = cleaned.substring(0, 2);
            const year = cleaned.substring(2, 4);
            return `${month}/${year}`;
        }
        
        return cleaned;
    },
    
    /**
     * التحقق من صحة تاريخ انتهاء البطاقة
     * @param {string} expiry - تاريخ انتهاء البطاقة بتنسيق MM/YY
     * @returns {boolean} - صحة تاريخ الانتهاء
     */
    isValidExpiry: function(expiry) {
        const parts = expiry.split('/');
        if (parts.length !== 2) return false;
        
        const month = parseInt(parts[0], 10);
        const year = parseInt('20' + parts[1], 10);
        
        // التحقق من صحة الشهر (1-12)
        if (month < 1 || month > 12) return false;
        
        // الحصول على التاريخ الحالي
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // getMonth() يبدأ من 0
        
        // التحقق من عدم انتهاء صلاحية البطاقة
        if (year < currentYear) return false;
        if (year === currentYear && month < currentMonth) return false;
        
        return true;
    },
    
    /**
     * تنسيق المبلغ المالي
     * @param {number} amount - المبلغ
     * @param {string} currency - رمز العملة (افتراضياً: دينار)
     * @returns {string} - المبلغ المنسق مع العملة
     */
    formatCurrency: function(amount, currency = 'دينار') {
        return `${amount.toLocaleString()} ${currency}`;
    },
    
    /**
     * تنسيق التاريخ
     * @param {string|Date} date - التاريخ
     * @returns {string} - التاريخ المنسق بتنسيق DD/MM/YYYY
     */
    formatDate: function(date) {
        if (!date) return '-';
        
        let dateObj;
        
        if (typeof date === 'string') {
            // محاولة تحليل التاريخ من النص
            if (date.includes('/')) {
                // إذا كان التاريخ بتنسيق DD/MM/YYYY
                const parts = date.split('/');
                dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else if (date.includes('-')) {
                // إذا كان التاريخ بتنسيق YYYY-MM-DD
                dateObj = new Date(date);
            } else {
                // إذا كان بتنسيق آخر، يفترض أنه معرف وقت Unix أو تنسيق ISO
                dateObj = new Date(date);
            }
        } else if (date instanceof Date) {
            dateObj = date;
        } else {
            return '-';
        }
        
        // التحقق من صحة التاريخ
        if (isNaN(dateObj.getTime())) {
            return '-';
        }
        
        // تنسيق التاريخ
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        
        return `${day}/${month}/${year}`;
    },
    
    /**
     * حساب الفترة بين تاريخين بالأيام
     * @param {string|Date} startDate - تاريخ البداية
     * @param {string|Date} endDate - تاريخ النهاية (افتراضياً: التاريخ الحالي)
     * @returns {number} - عدد الأيام بين التاريخين
     */
    daysBetween: function(startDate, endDate = new Date()) {
        let start = (startDate instanceof Date) ? startDate : new Date(startDate);
        let end = (endDate instanceof Date) ? endDate : new Date(endDate);
        
        // التحويل إلى وقت Unix (ميلي ثانية)
        const startTime = start.getTime();
        const endTime = end.getTime();
        
        // حساب الفرق وتحويله إلى أيام
        const diffTime = Math.abs(endTime - startTime);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    },
    
    /**
     * توليد شفرة QR للبطاقة
     * @param {Object} cardInfo - معلومات البطاقة
     * @param {HTMLElement} element - عنصر HTML لعرض شفرة QR
     * @param {Object} options - خيارات إضافية
     */
    generateQRCode: function(cardInfo, element, options = {}) {
        if (!window.QRCode) {
            console.error('مكتبة QRCode غير متاحة');
            return;
        }
        
        const defaultOptions = {
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        // تحويل كائن معلومات البطاقة إلى نص JSON
        const qrData = JSON.stringify(cardInfo);
        
        try {
            // مسح المحتوى الحالي للعنصر
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
            
            // إنشاء شفرة QR جديدة
            new QRCode(element, {
                text: qrData,
                width: mergedOptions.width,
                height: mergedOptions.height,
                colorDark: mergedOptions.colorDark,
                colorLight: mergedOptions.colorLight,
                correctLevel: mergedOptions.correctLevel
            });
        } catch (error) {
            console.error('خطأ في إنشاء شفرة QR:', error);
        }
    },
    
    /**
     * حفظ شفرة QR كصورة
     * @param {HTMLElement} qrElement - عنصر شفرة QR
     * @param {string} filename - اسم ملف الصورة
     */
    saveQRAsImage: function(qrElement, filename = 'investor-card-qr.png') {
        try {
            // الحصول على عنصر canvas الداخلي
            const canvas = qrElement.querySelector('canvas');
            
            if (!canvas) {
                console.error('عنصر canvas غير موجود');
                return;
            }
            
            // تحويل canvas إلى URL بيانات
            const dataUrl = canvas.toDataURL('image/png');
            
            // إنشاء رابط تنزيل
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = filename;
            document.body.appendChild(link);
            
            // محاكاة النقر على الرابط لبدء التنزيل
            link.click();
            
            // إزالة الرابط من المستند
            document.body.removeChild(link);
        } catch (error) {
            console.error('خطأ في حفظ صورة QR:', error);
            alert('حدث خطأ أثناء حفظ الصورة. يرجى المحاولة مرة أخرى.');
        }
    },
    
    /**
     * التحقق من دعم المتصفح لميزات PWA
     * @returns {Object} - كائن يحتوي على معلومات حول الدعم
     */
    checkPWASupport: function() {
        return {
            serviceWorker: 'serviceWorker' in navigator,
            cacheAPI: 'caches' in window,
            pushManager: 'PushManager' in window,
            notifications: 'Notification' in window,
            share: 'share' in navigator,
            installPrompt: false // يتم تحديثه عبر حدث beforeinstallprompt
        };
    },
    
    /**
     * تنسيق رقم الهاتف
     * @param {string} phoneNumber - رقم الهاتف
     * @returns {string} - رقم الهاتف المنسق
     */
    formatPhoneNumber: function(phoneNumber) {
        // إزالة الأحرف غير الرقمية
        const cleaned = phoneNumber.replace(/\D/g, '');
        
        // تنسيق رقم الهاتف حسب الطول
        if (cleaned.length === 10) {
            // تنسيق أرقام العراق مثل: 075X XXX XXXX
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
        } else if (cleaned.length === 11) {
            // تنسيق أرقام العراق مع الصفر مثل: 075X XXX XXXX
            return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
        } else if (cleaned.length === 13) {
            // تنسيق أرقام العراق مع رمز الدولة مثل: +964 75X XXX XXXX
            return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
        }
        
        // إرجاع الرقم كما هو إذا لم يتوافق مع أي تنسيق معروف
        return phoneNumber;
    },
    
    /**
     * تحويل رقم CVV إلى نجوم
     * @param {string} cvv - رقم CVV
     * @returns {string} - رقم CVV المخفي
     */
    maskCVV: function(cvv) {
        return '•'.repeat(cvv.length);
    },
    
    /**
     * تحميل صورة مستخدم افتراضية بناءً على الحرف الأول من الاسم
     * @param {string} name - اسم المستخدم
     * @returns {string} - لون الخلفية للصورة الافتراضية
     */
    getAvatarColor: function(name) {
        if (!name) return '#3b82f6';
        
        // قائمة الألوان للصور الافتراضية
        const colors = [
            '#3b82f6', // أزرق
            '#10b981', // أخضر
            '#ef4444', // أحمر
            '#f59e0b', // برتقالي
            '#8b5cf6', // بنفسجي
            '#ec4899', // وردي
            '#14b8a6', // فيروزي
            '#f97316', // برتقالي داكن
            '#6366f1'  // أزرق بنفسجي
        ];
        
        // استخدام الحرف الأول من الاسم لاختيار لون
        const charCode = name.charCodeAt(0);
        const colorIndex = charCode % colors.length;
        
        return colors[colorIndex];
    },
    
    /**
     * حساب وتنسيق المدة منذ تاريخ معين
     * @param {string|Date} date - التاريخ
     * @returns {string} - المدة المنسقة (مثل: "منذ 3 أيام")
     */
    timeAgo: function(date) {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        
        // تحويل الفرق إلى ثوانٍ
        const diffSecs = Math.floor(diffMs / 1000);
        
        // تحويل الفرق إلى دقائق
        const diffMins = Math.floor(diffSecs / 60);
        
        // تحويل الفرق إلى ساعات
        const diffHours = Math.floor(diffMins / 60);
        
        // تحويل الفرق إلى أيام
        const diffDays = Math.floor(diffHours / 24);
        
        // تحويل الفرق إلى أسابيع
        const diffWeeks = Math.floor(diffDays / 7);
        
        // تحويل الفرق إلى أشهر
        const diffMonths = Math.floor(diffDays / 30);
        
        // تحويل الفرق إلى سنوات
        const diffYears = Math.floor(diffMonths / 12);
        
        // تنسيق المدة
        if (diffSecs < 60) {
            return 'منذ لحظات';
        } else if (diffMins < 60) {
            return `منذ ${diffMins} ${this.pluralize(diffMins, 'دقيقة', 'دقائق', 'دقيقة')}`;
        } else if (diffHours < 24) {
            return `منذ ${diffHours} ${this.pluralize(diffHours, 'ساعة', 'ساعات', 'ساعة')}`;
        } else if (diffDays < 7) {
            return `منذ ${diffDays} ${this.pluralize(diffDays, 'يوم', 'أيام', 'يوم')}`;
        } else if (diffWeeks < 4) {
            return `منذ ${diffWeeks} ${this.pluralize(diffWeeks, 'أسبوع', 'أسابيع', 'أسبوع')}`;
        } else if (diffMonths < 12) {
            return `منذ ${diffMonths} ${this.pluralize(diffMonths, 'شهر', 'أشهر', 'شهر')}`;
        } else {
            return `منذ ${diffYears} ${this.pluralize(diffYears, 'سنة', 'سنوات', 'سنة')}`;
        }
    },
    
    /**
     * وظيفة مساعدة للصيغة الجمعية باللغة العربية
     * @param {number} count - العدد
     * @param {string} singular - الصيغة المفردة
     * @param {string} plural - الصيغة الجمعية
     * @param {string} dual - صيغة المثنى
     * @returns {string} - الكلمة بالصيغة المناسبة للعدد
     */
    pluralize: function(count, singular, plural, dual) {
        if (count === 1) {
            return singular;
        } else if (count === 2) {
            return dual;
        } else if (count >= 3 && count <= 10) {
            return plural;
        } else {
            return singular;
        }
    },
    
    /**
     * تحويل تاريخ إلى التقويم الهجري
     * @param {string|Date} date - التاريخ الميلادي
     * @returns {string} - التاريخ الهجري
     */
    convertToHijri: function(date) {
        // هذه وظيفة بسيطة لتقريب التاريخ الهجري
        // للحصول على دقة أعلى، يجب استخدام مكتبة متخصصة
        
        const gregorianDate = new Date(date);
        if (isNaN(gregorianDate.getTime())) {
            return '-';
        }
        
        // تحويل إلى عدد الأيام منذ بداية التقويم الميلادي
        const gregorianDays = Math.floor(gregorianDate.getTime() / (1000 * 60 * 60 * 24));
        
        // تقريب عدد الأيام بين بداية التقويم الهجري وبداية التقويم الميلادي
        const hijriOffset = 227015; // تقريبي
        
        // تحويل إلى عدد الأيام منذ بداية التقويم الهجري
        const hijriDays = gregorianDays - hijriOffset;
        
        // تحويل إلى سنوات، أشهر، وأيام
        const hijriYears = Math.floor(hijriDays / 354.367);
        const remainingDays = hijriDays - Math.floor(hijriYears * 354.367);
        
        // حساب الشهر (تقريبي)
        const hijriMonth = Math.min(12, Math.ceil(remainingDays / 29.5));
        
        // حساب اليوم (تقريبي)
        const hijriDay = Math.round(remainingDays - ((hijriMonth - 1) * 29.5));
        
        // أسماء الأشهر الهجرية
        const hijriMonths = [
            'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
            'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
            'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
        ];
        
        return `${hijriDay} ${hijriMonths[hijriMonth - 1]} ${1 + hijriYears}هـ`;
    },
    
    /**
     * إنشاء شفرة ألوان تدرجية لعرض المخططات
     * @param {number} count - عدد الألوان المطلوبة
     * @returns {Array} - مصفوفة الألوان
     */
    generateColorPalette: function(count) {
        const baseColors = [
            '#3b82f6', // أزرق
            '#10b981', // أخضر
            '#ef4444', // أحمر
            '#f59e0b', // برتقالي
            '#8b5cf6', // بنفسجي
            '#ec4899', // وردي
            '#14b8a6', // فيروزي
            '#f97316', // برتقالي داكن
            '#6366f1'  // أزرق بنفسجي
        ];
        
        // إذا كان العدد المطلوب أقل من أو يساوي عدد الألوان الأساسية
        if (count <= baseColors.length) {
            return baseColors.slice(0, count);
        }
        
        // إنشاء ألوان إضافية
        const colors = [...baseColors];
        
        for (let i = baseColors.length; i < count; i++) {
            // استخدام خوارزمية بسيطة لإنشاء ألوان إضافية
            const hue = (i * 137) % 360; // زاوية Hue
            const saturation = 70 + (i % 30); // التشبع
            const lightness = 50 + ((i * 13) % 20); // السطوع
            
            colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        }
        
        return colors;
    }
};

// تصدير الوظائف لاستخدامها في ملفات أخرى
window.InvestorCardUtils = InvestorCardUtils;