/**
 * card-ui-fixes.js
 * 
 * ملف تصحيح مشاكل واجهة المستخدم لبطاقات المستثمرين
 * معالجة مشاكل التنسيق وتفعيل أزرار الشريط الجانبي
 * 
 * @version 1.0.0
 */

// تنفيذ الإصلاحات بعد تحميل الصفحة بالكامل
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة نظام إصلاح واجهة المستخدم
    CardUIFixes.initialize();
});

// كائن إصلاح واجهة المستخدم
const CardUIFixes = (function() {
    // تهيئة الإصلاحات
    function initialize() {
        console.log('تهيئة إصلاحات واجهة المستخدم لنظام البطاقات...');
        
        // إضافة الأنماط المصححة
        addFixedStyles();
        
        // تفعيل أزرار الشريط الجانبي
        setupSidebarButtons();
        
        // إصلاح مشاكل التنسيق في الواجهة الرئيسية
        fixMainInterface();
        
        // تفعيل أزرار التبويب
        setupTabButtons();
        
        // إصلاح عرض البطاقة
        fixCardDisplay();
        
        // تحسين توافق الهاتف المحمول
        improveResponsiveness();
        
        console.log('تم تهيئة إصلاحات واجهة المستخدم بنجاح');
    }

    // إضافة الأنماط المصححة
    function addFixedStyles() {
        // التحقق من وجود عنصر الأنماط المصححة مسبقاً
        if (document.getElementById('card-ui-fixes-styles')) {
            return;
        }
        
        // إنشاء عنصر النمط
        const styleElement = document.createElement('style');
        styleElement.id = 'card-ui-fixes-styles';
        
        // إضافة الأنماط المصححة
        styleElement.textContent = `
            /* إصلاحات عامة للواجهة */
            body {
                overflow-x: hidden;
            }
            
            /* إصلاح تخطيط الصفحة الرئيسية */
            .layout {
                display: flex;
                flex-direction: row;
                height: 100vh;
                width: 100%;
                overflow: hidden;
            }
            
            /* إصلاح الشريط الجانبي */
            .sidebar {
                width: 260px;
                height: 100%;
                background-color: #fff;
                border-left: 1px solid #eee;
                overflow-y: auto;
                transition: transform 0.3s ease;
                z-index: 100;
                position: fixed;
                right: 0;
                top: 0;
                bottom: 0;
            }
            
            /* الشريط الجانبي في الوضع المخفي */
            .sidebar.collapsed {
                transform: translateX(260px);
            }
            
            /* إصلاح المحتوى الرئيسي */
            .main-content {
                flex: 1;
                height: 100%;
                overflow-y: auto;
                margin-right: 260px;
                transition: margin-right 0.3s ease;
            }
            
            /* المحتوى الرئيسي عند طي الشريط الجانبي */
            .main-content.expanded {
                margin-right: 0;
            }
            
            /* إصلاح تنسيق صفحة تسجيل الدخول */
            #login-screen {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 20px;
                background-color: #f8f9fa;
            }
            
            .login-container {
                width: 100%;
                max-width: 450px;
                background-color: #fff;
                border-radius: 12px;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
                padding: 30px;
                direction: rtl;
            }
            
            /* إصلاح تنسيق لوحة البطاقة */
            #card-dashboard {
                display: flex;
                flex-direction: column;
                height: 100vh;
                overflow: hidden;
            }
            
            .top-navbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background-color: #fff;
                border-bottom: 1px solid #eee;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
                z-index: 10;
            }
            
            .dashboard-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            /* إصلاح تنسيق عرض البطاقة */
            .card-container {
                padding: 20px;
                background-color: #f8f9fa;
                border-radius: 12px;
                margin-bottom: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .investor-card {
                width: 100%;
                max-width: 400px;
                height: 240px;
                transition: transform 0.6s;
                transform-style: preserve-3d;
                position: relative;
                margin-bottom: 20px;
            }
            
            .card-actions {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-top: 15px;
                width: 100%;
                max-width: 400px;
            }
            
            .card-action-btn {
                padding: 8px 15px;
                border-radius: 6px;
                border: 1px solid #ddd;
                background-color: #fff;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
                transition: all 0.2s;
                flex: 1;
            }
            
            .card-action-btn:hover {
                background-color: #f0f0f0;
            }
            
            /* إصلاح تنسيق الملخص المالي */
            .financial-summary {
                padding: 20px;
                background-color: #fff;
                border-radius: 12px;
                margin-bottom: 20px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            }
            
            .balance-card {
                background-color: #f8f9fa;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 20px;
            }
            
            .stats-container {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 15px;
                margin-top: 20px;
            }
            
            .stat-card {
                background-color: #fff;
                border-radius: 10px;
                padding: 15px;
                display: flex;
                align-items: center;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }
            
            /* إصلاح تنسيق التبويبات */
            .info-tabs {
                padding: 20px;
                background-color: #fff;
                border-radius: 12px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            }
            
            .tab-buttons {
                display: flex;
                border-bottom: 1px solid #eee;
                margin-bottom: 20px;
                overflow-x: auto;
                scrollbar-width: none;
            }
            
            .tab-buttons::-webkit-scrollbar {
                display: none;
            }
            
            .tab-btn {
                padding: 10px 20px;
                border: none;
                background: none;
                font-weight: 500;
                color: #777;
                cursor: pointer;
                white-space: nowrap;
            }
            
            .tab-btn.active {
                color: #3b82f6;
                border-bottom: 2px solid #3b82f6;
            }
            
            .tab-content {
                display: none;
            }
            
            .tab-content.active {
                display: block;
            }
            
            /* إصلاح تنسيق قوائم البيانات */
            .data-list {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .data-item {
                background-color: #f8f9fa;
                border-radius: 10px;
                padding: 15px;
                border: 1px solid #eee;
            }
            
            .data-item-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            
            .data-item-title {
                font-weight: 600;
                font-size: 1.1rem;
            }
            
            .data-item-badge {
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 500;
                background-color: #e0e0e0;
            }
            
            .badge-success {
                background-color: #c8f7c5;
                color: #0d6832;
            }
            
            .badge-warning {
                background-color: #ffeeba;
                color: #856404;
            }
            
            .badge-danger {
                background-color: #f8d7da;
                color: #721c24;
            }
            
            .badge-primary {
                background-color: #d4edff;
                color: #004085;
            }
            
            .data-item-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                gap: 10px;
            }
            
            .data-detail-label {
                font-size: 0.85rem;
                color: #777;
                margin-bottom: 3px;
            }
            
            .data-detail-value {
                font-weight: 500;
            }
            
            /* إصلاح تنسيق الشريط السفلي */
            .bottom-navbar {
                display: flex;
                justify-content: space-between;
                padding: 10px 20px;
                background-color: #fff;
                border-top: 1px solid #eee;
                position: sticky;
                bottom: 0;
                z-index: 10;
            }
            
            .nav-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-decoration: none;
                color: #666;
                padding: 8px 0;
                flex: 1;
                font-size: 0.85rem;
            }
            
            .nav-item i {
                font-size: 1.2rem;
                margin-bottom: 5px;
            }
            
            .nav-item.active {
                color: #3b82f6;
            }
            
            /* إصلاح النوافذ المنبثقة */
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                overflow-y: auto;
                align-items: center;
                justify-content: center;
            }
            
            .modal.active {
                display: flex;
            }
            
            .modal-container {
                background-color: #fff;
                border-radius: 12px;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            }
            
            .modal-header {
                padding: 15px 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-body {
                padding: 20px;
            }
            
            .modal-footer {
                padding: 15px 20px;
                border-top: 1px solid #eee;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            /* تحسينات للهاتف المحمول */
            @media (max-width: 768px) {
                .sidebar {
                    transform: translateX(260px);
                    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
                }
                
                .sidebar.active {
                    transform: translateX(0);
                }
                
                .main-content {
                    margin-right: 0;
                }
                
                .top-navbar {
                    padding: 10px 15px;
                }
                
                .stats-container {
                    grid-template-columns: 1fr;
                }
                
                .card-actions {
                    flex-direction: column;
                }
                
                .tab-buttons {
                    gap: 0;
                }
                
                .tab-btn {
                    padding: 10px 15px;
                    font-size: 0.9rem;
                }
            }
        `;
        
        // إضافة العنصر إلى head
        document.head.appendChild(styleElement);
        
        console.log('تمت إضافة الأنماط المصححة');
    }

    // إعداد أزرار الشريط الجانبي
    function setupSidebarButtons() {
        // تفعيل زر تبديل الشريط الجانبي
        const toggleSidebarButtons = document.querySelectorAll('.toggle-sidebar');
        
        toggleSidebarButtons.forEach(button => {
            button.addEventListener('click', function() {
                const sidebar = document.querySelector('.sidebar');
                const mainContent = document.querySelector('.main-content');
                
                if (sidebar && mainContent) {
                    sidebar.classList.toggle('collapsed');
                    mainContent.classList.toggle('expanded');
                }
            });
        });
        
        // تفعيل أزرار التنقل في الشريط الجانبي
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // إزالة الفئة النشطة من جميع الروابط
                navLinks.forEach(navLink => {
                    navLink.classList.remove('active');
                });
                
                // إضافة الفئة النشطة للرابط الحالي
                this.classList.add('active');
                
                // الحصول على معرف الصفحة
                const pageId = this.getAttribute('data-page');
                
                if (pageId) {
                    // إخفاء جميع الصفحات
                    document.querySelectorAll('.page').forEach(page => {
                        page.classList.remove('active');
                    });
                    
                    // إظهار الصفحة المطلوبة
                    const targetPage = document.getElementById(`${pageId}-page`);
                    if (targetPage) {
                        targetPage.classList.add('active');
                    }
                }
                
                // إخفاء الشريط الجانبي في الهاتف المحمول بعد النقر
                if (window.innerWidth <= 768) {
                    const sidebar = document.querySelector('.sidebar');
                    if (sidebar) {
                        sidebar.classList.remove('active');
                    }
                }
            });
        });
        
        // تفعيل زر تسجيل الخروج
        const logoutBtn = document.getElementById('logout-btn');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
                    // إذا كان هناك دالة logout في نظام البطاقات
                    if (window.InvestorCardSystem && typeof window.InvestorCardSystem.logout === 'function') {
                        window.InvestorCardSystem.logout();
                    } else {
                        // الانتقال إلى صفحة تسجيل الدخول
                        const loginScreen = document.getElementById('login-screen');
                        const cardDashboard = document.getElementById('card-dashboard');
                        
                        if (loginScreen && cardDashboard) {
                            loginScreen.style.display = 'flex';
                            cardDashboard.style.display = 'none';
                        }
                    }
                }
            });
        }
        
        console.log('تم تفعيل أزرار الشريط الجانبي');
    }

    // إصلاح واجهة المستخدم الرئيسية
    function fixMainInterface() {
        // إصلاح عناصر اسم المستخدم والترحيب
        const userNameElement = document.getElementById('user-name');
        const userInitialElement = document.getElementById('user-initial');
        
        if (userNameElement && !userNameElement.textContent.trim()) {
            userNameElement.textContent = 'المستثمر';
        }
        
        if (userInitialElement && !userInitialElement.textContent.trim()) {
            userInitialElement.textContent = 'م';
        }
        
        // إصلاح شارة الإشعارات
        const notificationBadge = document.getElementById('notification-badge');
        
        if (notificationBadge && !notificationBadge.textContent.trim()) {
            notificationBadge.textContent = '0';
        }
        
        // ضبط عرض الصفحة الرئيسية
        const loginScreen = document.getElementById('login-screen');
        const cardDashboard = document.getElementById('card-dashboard');
        
        // التحقق من حالة تسجيل الدخول عن طريق وجود معلومات البطاقة
        const hasCardInfo = document.getElementById('display-card-number') && 
                           document.getElementById('display-card-number').textContent !== 'XXXX XXXX XXXX XXXX';
        
        if (loginScreen && cardDashboard) {
            if (hasCardInfo) {
                loginScreen.style.display = 'none';
                cardDashboard.style.display = 'flex';
            } else {
                loginScreen.style.display = 'flex';
                cardDashboard.style.display = 'none';
            }
        }
        
        console.log('تم إصلاح واجهة المستخدم الرئيسية');
    }

    // إعداد أزرار التبويب
    function setupTabButtons() {
        // تفعيل أزرار التبويب في صفحة تسجيل الدخول
        const loginTabButtons = document.querySelectorAll('.login-container .tab-btn');
        
        loginTabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // إزالة الفئة النشطة من جميع الأزرار
                loginTabButtons.forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // إضافة الفئة النشطة للزر الحالي
                this.classList.add('active');
                
                // الحصول على معرف التبويب
                const tabId = this.getAttribute('data-tab');
                
                if (tabId) {
                    // إخفاء جميع محتويات التبويب
                    const tabContents = document.querySelectorAll('.login-container .tab-content');
                    tabContents.forEach(content => {
                        content.classList.remove('active');
                    });
                    
                    // إظهار محتوى التبويب المطلوب
                    const targetTab = document.getElementById(`${tabId}-tab`);
                    if (targetTab) {
                        targetTab.classList.add('active');
                    }
                }
                
                // مسح رسائل الخطأ
                const errorMessages = document.querySelectorAll('.error-message');
                errorMessages.forEach(message => {
                    message.textContent = '';
                    message.style.display = 'none';
                });
            });
        });
        
        // تفعيل أزرار التبويب في لوحة البطاقة
        const dashboardTabButtons = document.querySelectorAll('.info-tabs .tab-btn');
        
        dashboardTabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // إزالة الفئة النشطة من جميع الأزرار
                dashboardTabButtons.forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // إضافة الفئة النشطة للزر الحالي
                this.classList.add('active');
                
                // الحصول على معرف التبويب
                const tabId = this.getAttribute('data-tab');
                
                if (tabId) {
                    // إخفاء جميع محتويات التبويب
                    const tabContents = document.querySelectorAll('.info-tabs .tab-content');
                    tabContents.forEach(content => {
                        content.classList.remove('active');
                    });
                    
                    // إظهار محتوى التبويب المطلوب
                    const targetTab = document.getElementById(`${tabId}-tab`);
                    if (targetTab) {
                        targetTab.classList.add('active');
                    }
                }
            });
        });
        
        // تفعيل أزرار الشريط السفلي
        const bottomNavItems = document.querySelectorAll('.bottom-navbar .nav-item');
        
        bottomNavItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                // إزالة الفئة النشطة من جميع العناصر
                bottomNavItems.forEach(navItem => {
                    navItem.classList.remove('active');
                });
                
                // إضافة الفئة النشطة للعنصر الحالي
                this.classList.add('active');
                
                // الحصول على معرف الهدف
                const targetId = this.getAttribute('href').replace('#', '');
                
                // تفعيل التبويب المناسب
                if (targetId) {
                    const tabButton = document.querySelector(`.info-tabs .tab-btn[data-tab="${targetId}"]`);
                    if (tabButton) {
                        tabButton.click();
                    }
                }
            });
        });
        
        console.log('تم تفعيل أزرار التبويب');
    }

    // إصلاح عرض البطاقة
    function fixCardDisplay() {
        // تفعيل زر قلب البطاقة
        const flipCardBtn = document.getElementById('flip-card-btn');
        
        if (flipCardBtn) {
            flipCardBtn.addEventListener('click', function() {
                const card = document.querySelector('.investor-card');
                
                if (card) {
                    card.classList.toggle('flipped');
                    
                    // تحديث نص الزر
                    const isFlipped = card.classList.contains('flipped');
                    const btnText = this.querySelector('span');
                    
                    if (btnText) {
                        btnText.textContent = isFlipped ? 'عرض الأمام' : 'عرض الخلف';
                    }
                }
            });
        }
        
        // تفعيل زر عرض QR
        const showQrBtn = document.getElementById('show-qr-btn');
        
        if (showQrBtn) {
            showQrBtn.addEventListener('click', function() {
                const qrModal = document.getElementById('qr-modal');
                
                if (qrModal) {
                    qrModal.classList.add('active');
                    
                    // إنشاء QR Code إذا كان متاحاً
                    if (typeof QRCode !== 'undefined') {
                        const cardId = this.getAttribute('data-card-id') || '';
                        const cardNumber = document.getElementById('display-card-number')?.textContent || '';
                        
                        // تحضير بيانات QR
                        const qrData = cardId || cardNumber;
                        
                        // إنشاء رمز QR
                        const qrContainer = document.getElementById('card-qr-code');
                        
                        if (qrContainer) {
                            qrContainer.innerHTML = '';
                            
                            try {
                                new QRCode(qrContainer, {
                                    text: qrData,
                                    width: 200,
                                    height: 200,
                                    colorDark: '#000000',
                                    colorLight: '#ffffff',
                                    correctLevel: QRCode.CorrectLevel.H
                                });
                            } catch (error) {
                                console.warn('خطأ في إنشاء رمز QR:', error);
                                
                                // استخدام خدمة خارجية لإنشاء رمز QR
                                qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}" alt="QR Code">`;
                            }
                        }
                    }
                }
            });
        }
        
        // تفعيل زر مشاركة البطاقة
        const shareCardBtn = document.getElementById('share-card-btn');
        
        if (shareCardBtn) {
            shareCardBtn.addEventListener('click', function() {
                const shareModal = document.getElementById('share-modal');
                
                if (shareModal) {
                    shareModal.classList.add('active');
                    
                    // تحضير نص المشاركة
                    const cardName = document.getElementById('display-card-name')?.textContent || 'اسم المستثمر';
                    const cardNumber = document.getElementById('display-card-number')?.textContent || '';
                    const cardExpiry = document.getElementById('display-card-expiry')?.textContent || '';
                    
                    // تعيين نص المشاركة
                    const shareText = document.getElementById('share-text');
                    
                    if (shareText) {
                        shareText.value = `بطاقة المستثمر
الاسم: ${cardName}
رقم البطاقة: ${maskCardNumber(cardNumber)}
تاريخ الانتهاء: ${cardExpiry}`;
                    }
                }
            });
        }
        
        // تفعيل أزرار إغلاق النوافذ المنبثقة
        const modalCloseButtons = document.querySelectorAll('.modal-close, .modal-close-btn');
        
        modalCloseButtons.forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        console.log('تم إصلاح عرض البطاقة');
    }

    // تحسين التوافق مع الهاتف المحمول
    function improveResponsiveness() {
        // تفعيل تبديل وضع الشريط الجانبي للهاتف المحمول
        const toggleSidebar = function() {
            const sidebar = document.querySelector('.sidebar');
            
            if (sidebar) {
                sidebar.classList.toggle('active');
            }
        };
        
        // إضافة مستمع للنقر خارج الشريط الجانبي لإغلاقه
        document.addEventListener('click', function(e) {
            const sidebar = document.querySelector('.sidebar');
            const toggleButtons = document.querySelectorAll('.toggle-sidebar');
            
            // التحقق من أن النقر ليس على الشريط الجانبي ولا على زر التبديل
            if (sidebar && sidebar.classList.contains('active') && window.innerWidth <= 768) {
                let clickedInside = false;
                
                // التحقق من أن النقر ليس داخل الشريط الجانبي
                if (sidebar.contains(e.target)) {
                    clickedInside = true;
                }
                
                // التحقق من أن النقر ليس على أحد أزرار التبديل
                toggleButtons.forEach(button => {
                    if (button.contains(e.target)) {
                        clickedInside = true;
                    }
                });
                
                // إغلاق الشريط الجانبي إذا كان النقر خارجه
                if (!clickedInside) {
                    sidebar.classList.remove('active');
                }
            }
        });
        
        // تعديل العرض عند تغيير حجم النافذة
        window.addEventListener('resize', function() {
            const sidebar = document.querySelector('.sidebar');
            
            if (sidebar) {
                if (window.innerWidth > 768) {
                    sidebar.classList.remove('active');
                    sidebar.classList.remove('collapsed');
                }
            }
        });
        
        // إضافة مستمع للمس للتمرير في التبويبات على الهاتف المحمول
        const tabButtonsContainer = document.querySelectorAll('.tab-buttons');
        
        tabButtonsContainer.forEach(container => {
            let isScrolling = false;
            let startX;
            let scrollLeft;
            
            container.addEventListener('touchstart', function(e) {
                isScrolling = true;
                startX = e.touches[0].pageX - container.offsetLeft;
                scrollLeft = container.scrollLeft;
            });
            
            container.addEventListener('touchmove', function(e) {
                if (!isScrolling) return;
                
                const x = e.touches[0].pageX - container.offsetLeft;
                const walk = (x - startX) * 1.5;
                container.scrollLeft = scrollLeft - walk;
            });
            
            container.addEventListener('touchend', function() {
                isScrolling = false;
            });
        });
        
        console.log('تم تحسين التوافق مع الهاتف المحمول');
    }

    // تقنيع رقم البطاقة (إخفاء معظم الأرقام)
    function maskCardNumber(cardNumber) {
        if (!cardNumber) return '';
        
        // حذف المسافات
        const digits = cardNumber.replace(/\s/g, '');
        
        // إذا كان الطول أقل من 8، نعيد النص الأصلي
        if (digits.length < 8) return cardNumber;
        
        // إظهار آخر 4 أرقام فقط
        const lastFour = digits.slice(-4);
        const maskedPart = 'X'.repeat(digits.length - 4);
        
        // إعادة تنسيق الرقم مع المسافات
        const formatted = [];
        
        for (let i = 0; i < maskedPart.length; i += 4) {
            formatted.push(maskedPart.slice(i, i + 4));
        }
        
        formatted.push(lastFour);
        
        return formatted.join(' ');
    }

    // تصدير الواجهة العامة
    return {
        initialize
    };
})();