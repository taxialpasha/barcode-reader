/**
 * نظام بطاقات المستثمرين - Investor Card System (النسخة المحدثة 2.0)
 * 
 * يتيح إنشاء وإدارة بطاقات للمستثمرين في نظام الاستثمار المتكامل
 * البطاقات تشبه بطاقات الماستر كارد وتعمل عن طريق الباركود
 * النسخة المحدثة: تم إضافة مزايا متقدمة وأنواع بطاقات متعددة
 */

// كائن نظام بطاقات المستثمرين
const InvestorCardSystem = (function() {
    // متغيرات النظام
    let initialized = false;
    let investors = [];
    let cards = [];
    let activities = []; // سجل الأنشطة
    let databaseRef = null;
    let settings = {}; // إعدادات النظام
    let currentCardId = null; // معرف البطاقة الحالية المعروضة
    let isDarkMode = false; // حالة الوضع الداكن
    let currentView = 'all-cards'; // نوع العرض الحالي
    let scanner = null; // ماسح الباركود
    let stats = {}; // إحصائيات البطاقات
    
    // أنواع البطاقات المتاحة
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
    
    // تهيئة النظام
    function initialize() {
        console.log('تهيئة نظام بطاقات المستثمرين...');
        
        if (initialized) {
            console.log('نظام البطاقات مهيأ بالفعل');
            return Promise.resolve(true);
        }
        
        // تحميل الإعدادات
        loadSettings();
        
        // إضافة أنماط CSS
        addCardStyles();
        
        // التحقق من وضع الثيم
        checkDarkMode();
        
        // إنشاء صفحات البطاقات المختلفة
        createCardPages();
        
        // إضافة أزرار في القائمة الجانبية
        addSidebarButtons();
        
        // تهيئة مستمعي الأحداث
        initEventListeners();
        
        // تهيئة الاتصال بقاعدة البيانات
        return initializeDatabase()
            .then(() => {
                // جلب البيانات الأولية
                return loadData();
            })
            .then(() => {
                // تحديث الإحصائيات
                updateCardStats();
                
                initialized = true;
                console.log('تم تهيئة نظام بطاقات المستثمرين بنجاح');
                
                // إرسال حدث تهيئة
                document.dispatchEvent(new CustomEvent('investor-cards:initialized'));
                
                return true;
            })
            .catch(error => {
                console.error('خطأ في تهيئة نظام بطاقات المستثمرين:', error);
                return false;
            });
    }
    
    // تحميل إعدادات النظام
    function loadSettings() {
        try {
            const savedSettings = localStorage.getItem('card_system_settings');
            if (savedSettings) {
                settings = JSON.parse(savedSettings);
                console.log('تم تحميل إعدادات نظام البطاقات');
            } else {
                // الإعدادات الافتراضية
                settings = {
                    defaultCardType: 'platinum',
                    defaultExpiryYears: 3,
                    enableQrCode: true,
                    enableHologram: true,
                    enableChip: true,
                    autoBackup: true,
                    backupInterval: 'daily',
                    cardPrintSize: 'standard',
                    cardPrintOrientation: 'portrait',
                    darkMode: false,
                    scannerPreferredCamera: 'environment', // أو 'user' للكاميرا الأمامية
                    securePIN: false,
                    dateFormat: 'MM/YY',
                    // ألوان البطاقة المخصصة
                    customCardColor: '#3498db',
                    customTextColor: '#ffffff',
                    customLogoColor: '#ffffff',
                    customChipColor: '#C0C0C0'
                };
                saveSettings();
            }
            
            // تطبيق إعدادات الوضع الداكن
            isDarkMode = settings.darkMode || false;
        } catch (error) {
            console.error('خطأ في تحميل إعدادات نظام البطاقات:', error);
            settings = {
                defaultCardType: 'platinum',
                defaultExpiryYears: 3,
                enableQrCode: true,
                darkMode: false
            };
        }
    }
    
    // حفظ إعدادات النظام
    function saveSettings() {
        try {
            localStorage.setItem('card_system_settings', JSON.stringify(settings));
            console.log('تم حفظ إعدادات نظام البطاقات');
        } catch (error) {
            console.error('خطأ في حفظ إعدادات نظام البطاقات:', error);
        }
    }
    
    // التحقق من وضع الثيم
    function checkDarkMode() {
        isDarkMode = settings.darkMode || false;
        
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
    
    // تبديل وضع الثيم
    function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        settings.darkMode = isDarkMode;
        saveSettings();
        
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        document.dispatchEvent(new CustomEvent('theme:change', {
            detail: { isDarkMode }
        }));
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
        
        // إضافة أنماط CSS
        styleElement.textContent = `
            /* أنماط صفحة البطاقات */
            #investor-cards-page, #active-cards-page, #expired-cards-page, #barcode-scanner-page, #card-details-page, #new-card-page, #card-stats-page {
                padding: 20px;
                direction: rtl;
            }
            
            .card-content-area {
                background-color: #f8f9fa;
                border-radius: 10px;
                padding: 20px;
                overflow-y: auto;
            }
            
            /* أنماط الوضع الداكن */
            body.dark-mode .card-content-area {
                background-color: #1e1e2f;
                color: #e0e0e0;
            }
            
            body.dark-mode .card-form-container,
            body.dark-mode .investor-details,
            body.dark-mode .barcode-scanner {
                background-color: #252538;
                color: #e0e0e0;
            }
            
            body.dark-mode .card-form-title,
            body.dark-mode .investor-details-title,
            body.dark-mode .info-title {
                color: #e0e0e0;
            }
            
            body.dark-mode .card-form-input {
                background-color: #1e1e2f;
                border-color: #3a3a5c;
                color: #e0e0e0;
            }
            
            body.dark-mode .info-message {
                background-color: #252538;
                color: #e0e0e0;
            }
            
            body.dark-mode .card-option-btn,
            body.dark-mode .scanner-controls .btn-outline {
                background-color: #2c2c44;
                border-color: #3a3a5c;
                color: #e0e0e0;
            }
            
            /* أنماط نموذج إنشاء البطاقة */
            .card-form-container {
                background-color: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
                margin-bottom: 20px;
                max-width: 800px;
                margin: 0 auto;
            }
            
            .card-form-title {
                font-size: 1.4rem;
                margin-bottom: 20px;
                color: #2c3e50;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            }
            
            .card-form-group {
                margin-bottom: 20px;
            }
            
            .card-form-label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: #2c3e50;
            }
            
            body.dark-mode .card-form-label {
                color: #e0e0e0;
            }
            
            .card-form-input {
                width: 100%;
                padding: 12px 15px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 1rem;
                transition: border-color 0.2s;
            }
            
            .card-form-input:focus {
                border-color: #3498db;
                outline: none;
            }
            
            .card-type-options {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                margin-top: 10px;
            }
            
            .card-type-option {
                display: flex;
                align-items: center;
                cursor: pointer;
                padding: 10px 15px;
                background-color: #f8f9fa;
                border: 1px solid #ddd;
                border-radius: 6px;
                transition: all 0.2s ease;
            }
            
            body.dark-mode .card-type-option {
                background-color: #252538;
                border-color: #3a3a5c;
            }
            
            .card-type-option:hover {
                background-color: #e9ecef;
            }
            
            body.dark-mode .card-type-option:hover {
                background-color: #2c2c44;
            }
            
            .card-type-option.selected {
                background-color: #3498db;
                color: white;
                border-color: #3498db;
            }
            
            .card-type-option input {
                margin-left: 8px;
            }
            
            .card-form-actions {
                margin-top: 30px;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            /* أنماط البطاقة */
            .investor-card {
                width: 390px;
                height: 245px;
                border-radius: 15px;
                background-color: #101a2c;
                color: white;
                padding: 25px;
                position: relative;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
                margin: 0 auto 30px;
                overflow: hidden;
                transition: transform 0.3s ease;
                perspective: 1000px;
            }
            
            .investor-card:hover {
                transform: translateY(-5px);
            }
            
            .investor-card.flipped .card-inner {
                transform: rotateY(180deg);
            }
            
            .card-inner {
                width: 100%;
                height: 100%;
                position: relative;
                transition: transform 0.8s;
                transform-style: preserve-3d;
            }
            
            .card-front, .card-back {
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                backface-visibility: hidden;
            }
            
            .card-back {
                transform: rotateY(180deg);
                background-color: inherit;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            
            .card-brand {
                position: absolute;
                top: 20px;
                right: 25px;
                font-size: 1.2rem;
                font-weight: 700;
                letter-spacing: 1px;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }
            
            .card-logo {
                position: absolute;
                top: 20px;
                left: 25px;
                display: flex;
                gap: 5px;
            }
            
            .card-logo-circle {
                width: 30px;
                height: 30px;
                border-radius: 50%;
            }
            
            .card-logo-circle.red {
                background: #eb001b;
            }
            
            .card-logo-circle.yellow {
                background: #f79e1b;
                opacity: 0.8;
                margin-right: -15px;
            }
            
            .card-chip {
                position: absolute;
                top: 80px;
                right: 50px;
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
            
            .card-qrcode {
                width: 80px;
                height: 80px;
                background-color: #f8f9fa;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-top: 15px;
                margin-left: auto;
                overflow: hidden;
            }
            
            .card-qrcode img, .card-qrcode canvas {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
            
            .card-number {
                position: absolute;
                bottom: 80px;
                width: 100%;
                left: 0;
                padding: 0 25px;
                font-size: 1.5rem;
                letter-spacing: 2px;
                text-align: center;
                color: white;
                font-family: 'Courier New', monospace;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }
            
            .card-details {
                position: absolute;
                bottom: 25px;
                width: 100%;
                left: 0;
                padding: 0 25px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
            }
            
            .card-validity {
                font-size: 0.9rem;
                display: flex;
                flex-direction: column;
            }
            
            .card-valid-text {
                font-size: 0.7rem;
                opacity: 0.7;
                margin-bottom: 3px;
            }
            
            .card-name {
                font-size: 1rem;
                text-align: right;
                text-transform: uppercase;
                font-family: 'Arial', sans-serif;
                letter-spacing: 1px;
            }
            
            /* CVV على ظهر البطاقة */
            .card-back-strip {
                width: 100%;
                height: 40px;
                background-color: rgba(0, 0, 0, 0.8);
                margin: 20px 0;
                position: relative;
            }
            
            .card-cvv {
                position: absolute;
                right: 20px;
                bottom: -25px;
                background-color: white;
                color: black;
                padding: 5px 15px;
                border-radius: 4px;
                font-size: 0.9rem;
                font-family: 'Courier New', monospace;
            }
            
            .card-issuer-info {
                margin-top: 30px;
                font-size: 0.8rem;
                text-align: center;
                opacity: 0.7;
            }
            
            /* أنماط قائمة البطاقات */
            .cards-collection {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                margin-top: 20px;
                justify-content: center;
            }
            
            .card-preview {
                width: 320px;
                height: 180px;
                border-radius: 12px;
                background-color: #101a2c;
                color: white;
                padding: 15px;
                position: relative;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
                cursor: pointer;
                transition: transform 0.3s ease;
                overflow: hidden;
                margin-bottom: 20px;
            }
            
            .card-preview:hover {
                transform: translateY(-3px);
            }
            
            .card-preview .card-brand {
                font-size: 1rem;
            }
            
            .card-preview .card-logo-circle {
                width: 20px;
                height: 20px;
            }
            
            .card-preview .card-number {
                font-size: 1rem;
                bottom: 50px;
            }
            
            .card-preview .card-details {
                bottom: 15px;
            }
            
            .card-preview .card-name {
                font-size: 0.8rem;
            }
            
            .card-preview .card-qrcode {
                width: 50px;
                height: 50px;
                margin-top: 25px;
            }
            
            .card-preview .card-chip {
                width: 35px;
                height: 28px;
                top: 60px;
                right: 40px;
            }
            
            .card-preview .card-hologram {
                width: 40px;
                height: 40px;
                bottom: 40px;
                left: 30px;
            }
            
            /* أنماط لتعديل البطاقة */
            .card-options {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 10px;
                margin: 20px 0;
            }
            
            .card-option-btn {
                padding: 10px 15px;
                background-color: #f8f9fa;
                border: 1px solid #ddd;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s ease;
            }
            
            .card-option-btn:hover {
                background-color: #e9ecef;
            }
            
            .card-option-btn.primary {
                background-color: #3498db;
                color: white;
                border-color: #3498db;
            }
            
            .card-option-btn.primary:hover {
                background-color: #2980b9;
            }
            
            .card-option-btn.success {
                background-color: #2ecc71;
                color: white;
                border-color: #27ae60;
            }
            
            .card-option-btn.success:hover {
                background-color: #27ae60;
            }
            
            .card-option-btn.warning {
                background-color: #f39c12;
                color: white;
                border-color: #e67e22;
            }
            
            .card-option-btn.warning:hover {
                background-color: #e67e22;
            }
            
            .card-option-btn.danger {
                background-color: #e74c3c;
                color: white;
                border-color: #e74c3c;
            }
            
            .card-option-btn.danger:hover {
                background-color: #c0392b;
            }
            
            /* أنماط تفاصيل المستثمر */
            .investor-details {
                background-color: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
                margin-top: 30px;
            }
            
            .investor-details-title {
                font-size: 1.2rem;
                margin-bottom: 15px;
                color: #2c3e50;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            }
            
            .investor-detail-item {
                display: flex;
                margin-bottom: 12px;
            }
            
            .investor-detail-label {
                width: 160px;
                font-weight: 500;
                color: #2c3e50;
            }
            
            body.dark-mode .investor-detail-label {
                color: #e0e0e0;
            }
            
            .investor-detail-value {
                flex: 1;
            }
            
            .transactions-summary {
                margin-top: 15px;
            }
            
            .transaction-list {
                margin-top: 15px;
                border: 1px solid #eee;
                border-radius: 6px;
                overflow: hidden;
            }
            
            body.dark-mode .transaction-list {
                border-color: #3a3a5c;
            }
            
            .transaction-list table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .transaction-list th {
                background-color: #f8f9fa;
                padding: 12px 15px;
                text-align: right;
                font-weight: 500;
            }
            
            body.dark-mode .transaction-list th {
                background-color: #252538;
            }
            
            .transaction-list td {
                padding: 12px 15px;
                border-top: 1px solid #eee;
            }
            
            body.dark-mode .transaction-list td {
                border-color: #3a3a5c;
            }
            
            .transaction-list tr:hover td {
                background-color: #f8f9fa;
            }
            
            body.dark-mode .transaction-list tr:hover td {
                background-color: #252538;
            }
            
            /* أنماط لقارئ الباركود */
            .barcode-scanner {
                width: 100%;
                max-width: 500px;
                margin: 0 auto;
                padding: 20px;
                background-color: white;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            }
            
            .scanner-header {
                margin-bottom: 20px;
                text-align: center;
            }
            
            .scanner-title {
                font-size: 1.4rem;
                margin-bottom: 10px;
                color: #2c3e50;
            }
            
            body.dark-mode .scanner-title {
                color: #e0e0e0;
            }
            
            .scanner-description {
                color: #7f8c8d;
                font-size: 0.9rem;
            }
            
            body.dark-mode .scanner-description {
                color: #aaaaaa;
            }
            
            .scanner-container {
                position: relative;
                width: 100%;
                height: 300px;
                overflow: hidden;
                border-radius: 8px;
                background-color: #2c3e50;
                margin-bottom: 20px;
            }
            
            .scanner-container video {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .scan-region-highlight {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 200px;
                height: 200px;
                transform: translate(-50%, -50%);
                border: 2px solid #3498db;
                box-shadow: 0 0 0 5000px rgba(0, 0, 0, 0.3);
                border-radius: 8px;
            }
            
            .scanner-controls {
                display: flex;
                justify-content: space-between;
                margin-top: 15px;
            }
            
            .scanner-options {
                margin-top: 20px;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 6px;
                border: 1px solid #eee;
            }
            
            body.dark-mode .scanner-options {
                background-color: #252538;
                border-color: #3a3a5c;
            }
            
            .scanner-option-title {
                font-weight: 500;
                margin-bottom: 10px;
                color: #2c3e50;
            }
            
            body.dark-mode .scanner-option-title {
                color: #e0e0e0;
            }
            
            .scanner-option-item {
                margin-bottom: 10px;
            }
            
            .scan-result {
                margin-top: 20px;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 6px;
                border: 1px solid #eee;
            }
            
            body.dark-mode .scan-result {
                background-color: #252538;
                border-color: #3a3a5c;
            }
            
            .scan-result-title {
                font-weight: 500;
                margin-bottom: 10px;
                color: #2c3e50;
            }
            
            body.dark-mode .scan-result-title {
                color: #e0e0e0;
            }
            
            .scan-result-data {
                word-break: break-all;
            }
            
            /* أنماط الإحصائيات */
            .stats-section {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .stat-card {
                flex: 1;
                min-width: 200px;
                background-color: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
                transition: transform 0.3s ease;
            }
            
            body.dark-mode .stat-card {
                background-color: #252538;
            }
            
            .stat-card:hover {
                transform: translateY(-5px);
            }
            
            .stat-value {
                font-size: 2rem;
                font-weight: 700;
                margin-bottom: 5px;
                color: #3498db;
            }
            
            .stat-label {
                font-size: 1rem;
                color: #7f8c8d;
            }
            
            body.dark-mode .stat-label {
                color: #aaaaaa;
            }
            
            .chart-container {
                width: 100%;
                height: 300px;
                background-color: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
                margin-bottom: 20px;
            }
            
            body.dark-mode .chart-container {
                background-color: #252538;
            }
            
            .chart-title {
                font-size: 1.2rem;
                margin-bottom: 15px;
                color: #2c3e50;
            }
            
            body.dark-mode .chart-title {
                color: #e0e0e0;
            }
            
            /* أنماط المعلومات */
            .info-message {
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 6px;
                margin-bottom: 20px;
                border-right: 4px solid #3498db;
            }
            
            .info-title {
                font-weight: 500;
                margin-bottom: 5px;
                color: #2c3e50;
            }
            
            .info-text {
                color: #7f8c8d;
                font-size: 0.9rem;
            }
            
            body.dark-mode .info-text {
                color: #aaaaaa;
            }
            
            /* أنماط للنوافذ المنبثقة */
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
            
            /* أنماط سجل الأنشطة */
            .activity-list {
                margin-top: 20px;
                border: 1px solid #eee;
                border-radius: 6px;
                overflow: hidden;
            }
            
            body.dark-mode .activity-list {
                border-color: #3a3a5c;
            }
            
            .activity-list-item {
                padding: 12px 15px;
                border-bottom: 1px solid #eee;
                display: flex;
                align-items: center;
            }
            
            body.dark-mode .activity-list-item {
                border-color: #3a3a5c;
            }
            
            .activity-list-item:last-child {
                border-bottom: none;
            }
            
            .activity-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: #f8f9fa;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: 15px;
            }
            
            body.dark-mode .activity-icon {
                background-color: #252538;
            }
            
            .activity-icon i {
                font-size: 1.2rem;
                color: #3498db;
            }
            
            .activity-details {
                flex: 1;
            }
            
            .activity-title {
                font-weight: 500;
                margin-bottom: 5px;
                color: #2c3e50;
            }
            
            body.dark-mode .activity-title {
                color: #e0e0e0;
            }
            
            .activity-time {
                font-size: 0.8rem;
                color: #7f8c8d;
            }
            
            body.dark-mode .activity-time {
                color: #aaaaaa;
            }
            
            .activity-meta {
                color: #7f8c8d;
                font-size: 0.9rem;
            }
            
            body.dark-mode .activity-meta {
                color: #aaaaaa;
            }
            
            /* أنماط للجدول العام */
            .data-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                background-color: white;
                border-radius: 6px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            }
            
            body.dark-mode .data-table {
                background-color: #252538;
                color: #e0e0e0;
            }
            
            .data-table th {
                background-color: #f8f9fa;
                padding: 12px 15px;
                text-align: right;
                font-weight: 500;
                color: #2c3e50;
            }
            
            body.dark-mode .data-table th {
                background-color: #1e1e2f;
                color: #e0e0e0;
            }
            
            .data-table td {
                padding: 12px 15px;
                border-top: 1px solid #eee;
            }
            
            body.dark-mode .data-table td {
                border-color: #3a3a5c;
            }
            
            .data-table tr:hover td {
                background-color: #f8f9fa;
            }
            
            body.dark-mode .data-table tr:hover td {
                background-color: #222233;
            }
            
            /* كلاسات مساعدة */
            .text-center {
                text-align: center;
            }
            
            .mb-10 {
                margin-bottom: 10px;
            }
            
            .mb-20 {
                margin-bottom: 20px;
            }
            
            .mt-20 {
                margin-top: 20px;
            }
            
            .flex {
                display: flex;
            }
            
            .flex-wrap {
                flex-wrap: wrap;
            }
            
            .gap-10 {
                gap: 10px;
            }
            
            .gap-20 {
                gap: 20px;
            }
            
            .justify-center {
                justify-content: center;
            }
            
            .justify-between {
                justify-content: space-between;
            }
            
            .items-center {
                align-items: center;
            }
            
            .hidden {
                display: none !important;
            }
            
            /* أنماط الخيارات المبسطة */
            .settings-list {
                margin-top: 20px;
            }
            
            .settings-item {
                padding: 15px;
                border-bottom: 1px solid #eee;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            body.dark-mode .settings-item {
                border-color: #3a3a5c;
            }
            
            .settings-item:last-child {
                border-bottom: none;
            }
            
            .settings-label {
                font-weight: 500;
                color: #2c3e50;
            }
            
            body.dark-mode .settings-label {
                color: #e0e0e0;
            }
            
            .settings-description {
                font-size: 0.9rem;
                color: #7f8c8d;
                margin-top: 5px;
            }
            
            body.dark-mode .settings-description {
                color: #aaaaaa;
            }
            
            /* أنماط زر الإضافة العائم */
            .add-card-fab {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background-color: #3498db;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                cursor: pointer;
                transition: background-color 0.3s ease, transform 0.3s ease;
                z-index: 100;
            }
            
            .add-card-fab:hover {
                background-color: #2980b9;
                transform: translateY(-3px);
            }
            
            .add-card-fab i {
                font-size: 24px;
            }
            
            /* بالوضع الداكن */
            body.dark-mode .add-card-fab {
                background-color: #3498db;
            }
            
            body.dark-mode .add-card-fab:hover {
                background-color: #2980b9;
            }
        `;
        
        // إضافة العنصر إلى head
        document.head.appendChild(styleElement);
        
        console.log('تم إضافة أنماط CSS للبطاقات');
    }
    
    // إنشاء صفحات البطاقات المختلفة
    function createCardPages() {
        // التحقق مما إذا كانت الصفحات موجودة بالفعل
        if (document.getElementById('investor-cards-page')) {
            return;
        }
        
        // إنشاء صفحة كل البطاقات
        createAllCardsPage();
        
        // إنشاء صفحة البطاقات النشطة
        createActiveCardsPage();
        
        // إنشاء صفحة البطاقات المنتهية
        createExpiredCardsPage();
        
        // إنشاء صفحة مسح الباركود
        createBarcodeScannerPage();
        
        // إنشاء صفحة تفاصيل البطاقة
        createCardDetailsPage();
        
        // إنشاء صفحة إنشاء بطاقة جديدة
        createNewCardPage();
        
        // إنشاء صفحة إحصائيات البطاقات
        createCardStatsPage();
        
        console.log('تم إنشاء صفحات بطاقات المستثمرين');
    }
    
    // إنشاء صفحة كل البطاقات
    function createAllCardsPage() {
        // إنشاء عنصر الصفحة
        const pageElement = document.createElement('div');
        pageElement.id = 'investor-cards-page';
        pageElement.className = 'page'; // فئة صفحات التطبيق
        
        // إنشاء محتوى الصفحة
        pageElement.innerHTML = `
            <div class="header">
                <button class="toggle-sidebar">
                    <i class="fas fa-bars"></i>
                </button>
                <h1 class="page-title">بطاقات المستثمرين</h1>
                <div class="header-actions">
                    <div class="search-box">
                        <input class="search-input" id="cards-search" placeholder="بحث عن بطاقة..." type="text" />
                        <i class="fas fa-search search-icon"></i>
                    </div>
                    <button class="btn btn-primary" id="create-card-btn">
                        <i class="fas fa-plus"></i>
                        <span>إنشاء بطاقة جديدة</span>
                    </button>
                </div>
            </div>
            
            <div class="card-content-area">
                <div class="info-message">
                    <div class="info-title">بطاقات المستثمرين</div>
                    <div class="info-text">هنا يمكنك عرض وإدارة بطاقات جميع المستثمرين في النظام.</div>
                </div>
                
                <div class="flex justify-between items-center mb-20">
                    <div class="flex gap-10">
                        <button class="btn btn-sm btn-outline" id="cards-filter-all">الكل</button>
                        <button class="btn btn-sm btn-outline" id="cards-filter-platinum">بلاتينية</button>
                        <button class="btn btn-sm btn-outline" id="cards-filter-gold">ذهبية</button>
                        <button class="btn btn-sm btn-outline" id="cards-filter-premium">بريميوم</button>
                        <button class="btn btn-sm btn-outline" id="cards-filter-other">أخرى</button>
                    </div>
                    <div class="flex gap-10">
                        <button class="btn btn-sm btn-outline" id="cards-sort-recent">
                            <i class="fas fa-clock"></i>
                            <span>الأحدث</span>
                        </button>
                        <button class="btn btn-sm btn-outline" id="cards-sort-name">
                            <i class="fas fa-sort-alpha-down"></i>
                            <span>الاسم</span>
                        </button>
                    </div>
                </div>
                
                <div class="cards-collection" id="cards-container">
                    <!-- سيتم ملؤها ديناميكياً -->
                </div>
                
                <div class="text-center mt-20" id="no-cards-message" style="display: none;">
                    <i class="fas fa-credit-card" style="font-size: 3rem; color: #ddd; margin-bottom: 15px;"></i>
                    <p>لا توجد بطاقات متاحة</p>
                    <button class="btn btn-primary mt-10" id="add-first-card-btn">
                        <i class="fas fa-plus"></i>
                        <span>إنشاء بطاقة جديدة</span>
                    </button>
                </div>
            </div>
            
            <div class="add-card-fab" id="add-card-fab" title="إنشاء بطاقة جديدة">
                <i class="fas fa-plus"></i>
            </div>
        `;
        
        // إضافة الصفحة إلى الـ main-content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(pageElement);
        } else {
            console.error('لم يتم العثور على عنصر main-content');
        }
    }
    
    // إنشاء صفحة البطاقات النشطة
    function createActiveCardsPage() {
        // إنشاء عنصر الصفحة
        const pageElement = document.createElement('div');
        pageElement.id = 'active-cards-page';
        pageElement.className = 'page'; // فئة صفحات التطبيق
        
        // إنشاء محتوى الصفحة
        pageElement.innerHTML = `
            <div class="header">
                <button class="toggle-sidebar">
                    <i class="fas fa-bars"></i>
                </button>
                <h1 class="page-title">البطاقات النشطة</h1>
                <div class="header-actions">
                    <div class="search-box">
                        <input class="search-input" id="active-cards-search" placeholder="بحث عن بطاقة نشطة..." type="text" />
                        <i class="fas fa-search search-icon"></i>
                    </div>
                    <button class="btn btn-primary" id="create-card-btn-active">
                        <i class="fas fa-plus"></i>
                        <span>إنشاء بطاقة جديدة</span>
                    </button>
                </div>
            </div>
            
            <div class="card-content-area">
                <div class="info-message">
                    <div class="info-title">البطاقات النشطة</div>
                    <div class="info-text">عرض البطاقات الصالحة والتي لم تنتهي صلاحيتها بعد.</div>
                </div>
                
                <div class="flex justify-between items-center mb-20">
                    <div class="flex gap-10">
                        <button class="btn btn-sm btn-outline" id="active-cards-filter-all">الكل</button>
                        <button class="btn btn-sm btn-outline" id="active-cards-filter-platinum">بلاتينية</button>
                        <button class="btn btn-sm btn-outline" id="active-cards-filter-gold">ذهبية</button>
                        <button class="btn btn-sm btn-outline" id="active-cards-filter-premium">بريميوم</button>
                    </div>
                    <div class="flex gap-10">
                        <button class="btn btn-sm btn-outline" id="active-cards-sort-recent">
                            <i class="fas fa-clock"></i>
                            <span>الأحدث</span>
                        </button>
                        <button class="btn btn-sm btn-outline" id="active-cards-sort-expiry">
                            <i class="fas fa-calendar-alt"></i>
                            <span>تاريخ الانتهاء</span>
                        </button>
                    </div>
                </div>
                
                <div class="cards-collection" id="active-cards-container">
                    <!-- سيتم ملؤها ديناميكياً -->
                </div>
                
                <div class="text-center mt-20" id="no-active-cards-message" style="display: none;">
                    <i class="fas fa-credit-card" style="font-size: 3rem; color: #ddd; margin-bottom: 15px;"></i>
                    <p>لا توجد بطاقات نشطة متاحة</p>
                    <button class="btn btn-primary mt-10" id="add-first-active-card-btn">
                        <i class="fas fa-plus"></i>
                        <span>إنشاء بطاقة جديدة</span>
                    </button>
                </div>
            </div>
            
            <div class="add-card-fab" id="add-card-fab-active" title="إنشاء بطاقة جديدة">
                <i class="fas fa-plus"></i>
            </div>
        `;
        
        // إضافة الصفحة إلى الـ main-content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(pageElement);
        } else {
            console.error('لم يتم العثور على عنصر main-content');
        }
    }
    
    // إنشاء صفحة البطاقات المنتهية
    function createExpiredCardsPage() {
        // إنشاء عنصر الصفحة
        const pageElement = document.createElement('div');
        pageElement.id = 'expired-cards-page';
        pageElement.className = 'page'; // فئة صفحات التطبيق
        
        // إنشاء محتوى الصفحة
        pageElement.innerHTML = `
            <div class="header">
                <button class="toggle-sidebar">
                    <i class="fas fa-bars"></i>
                </button>
                <h1 class="page-title">البطاقات المنتهية</h1>
                <div class="header-actions">
                    <div class="search-box">
                        <input class="search-input" id="expired-cards-search" placeholder="بحث عن بطاقة منتهية..." type="text" />
                        <i class="fas fa-search search-icon"></i>
                    </div>
                    <button class="btn btn-warning" id="renew-all-expired-btn">
                        <i class="fas fa-sync-alt"></i>
                        <span>تجديد الكل</span>
                    </button>
                </div>
            </div>
            
            <div class="card-content-area">
                <div class="info-message">
                    <div class="info-title">البطاقات المنتهية</div>
                    <div class="info-text">عرض البطاقات التي انتهت صلاحيتها وتحتاج إلى تجديد.</div>
                </div>
                
                <div class="flex justify-between items-center mb-20">
                    <div class="flex gap-10">
                        <button class="btn btn-sm btn-outline" id="expired-cards-filter-all">الكل</button>
                        <button class="btn btn-sm btn-outline" id="expired-cards-filter-inactive">موقوفة</button>
                        <button class="btn btn-sm btn-outline" id="expired-cards-filter-expired">منتهية الصلاحية</button>
                    </div>
                    <div class="flex gap-10">
                        <button class="btn btn-sm btn-outline" id="expired-cards-sort-recent">
                            <i class="fas fa-clock"></i>
                            <span>الأحدث</span>
                        </button>
                        <button class="btn btn-sm btn-outline" id="expired-cards-sort-expiry">
                            <i class="fas fa-calendar-alt"></i>
                            <span>تاريخ الانتهاء</span>
                        </button>
                    </div>
                </div>
                
                <div class="cards-collection" id="expired-cards-container">
                    <!-- سيتم ملؤها ديناميكياً -->
                </div>
                
                <div class="text-center mt-20" id="no-expired-cards-message" style="display: none;">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: #2ecc71; margin-bottom: 15px;"></i>
                    <p>لا توجد بطاقات منتهية الصلاحية</p>
                </div>
            </div>
        `;
        
        // إضافة الصفحة إلى الـ main-content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(pageElement);
        } else {
            console.error('لم يتم العثور على عنصر main-content');
        }
    }
    
    // إنشاء صفحة مسح الباركود
    function createBarcodeScannerPage() {
        // إنشاء عنصر الصفحة
        const pageElement = document.createElement('div');
        pageElement.id = 'barcode-scanner-page';
        pageElement.className = 'page'; // فئة صفحات التطبيق
        
        // إنشاء محتوى الصفحة
        pageElement.innerHTML = `
            <div class="header">
                <button class="toggle-sidebar">
                    <i class="fas fa-bars"></i>
                </button>
                <h1 class="page-title">مسح باركود البطاقة</h1>
                <div class="header-actions">
                    <button class="btn btn-outline" id="toggle-camera-btn">
                        <i class="fas fa-camera"></i>
                        <span>تبديل الكاميرا</span>
                    </button>
                </div>
            </div>
            
            <div class="card-content-area">
                <div class="barcode-scanner">
                    <div class="scanner-header">
                        <h2 class="scanner-title">مسح باركود البطاقة</h2>
                        <p class="scanner-description">قم بتوجيه كاميرا الجهاز نحو باركود البطاقة للقراءة</p>
                    </div>
                    
                    <div class="scanner-container" id="scanner-container">
                        <video id="scanner-video"></video>
                        <div class="scan-region-highlight"></div>
                    </div>
                    
                    <div class="scanner-controls">
                        <button class="btn btn-primary" id="start-scanner">بدء المسح</button>
                        <button class="btn btn-outline" id="stop-scanner" disabled>إيقاف المسح</button>
                    </div>
                    
                    <div class="scanner-options">
                        <div class="scanner-option-title">خيارات المسح</div>
                        <div class="scanner-option-item">
                            <div class="form-check">
                                <input type="checkbox" id="scanner-beep" checked>
                                <label for="scanner-beep">صوت تنبيه عند المسح</label>
                            </div>
                        </div>
                        <div class="scanner-option-item">
                            <div class="form-check">
                                <input type="checkbox" id="scanner-vibrate" checked>
                                <label for="scanner-vibrate">اهتزاز عند المسح</label>
                            </div>
                        </div>
                        <div class="scanner-option-item">
                            <div class="form-check">
                                <input type="checkbox" id="scanner-auto-redirect" checked>
                                <label for="scanner-auto-redirect">انتقال تلقائي لتفاصيل البطاقة</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="scan-result hidden" id="scan-result">
                        <div class="scan-result-title">نتيجة المسح:</div>
                        <div class="scan-result-data" id="scan-result-data"></div>
                        <div class="mt-10">
                            <button class="btn btn-primary" id="goto-scanned-card">عرض البطاقة</button>
                            <button class="btn btn-outline" id="clear-scan-result">مسح النتيجة</button>
                        </div>
                    </div>
                </div>
                
                <div class="info-message mt-20">
                    <div class="info-title">كيفية استخدام الماسح</div>
                    <div class="info-text">
                        <ol style="padding-right: 20px;">
                            <li>اضغط على زر "بدء المسح"</li>
                            <li>وجه الكاميرا نحو QR كود الموجود على البطاقة</li>
                            <li>انتظر حتى يتم مسح الرمز تلقائياً</li>
                            <li>سيتم عرض معلومات البطاقة بعد المسح</li>
                        </ol>
                    </div>
                </div>
            </div>
        `;
        
        // إضافة الصفحة إلى الـ main-content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(pageElement);
        } else {
            console.error('لم يتم العثور على عنصر main-content');
        }
    }
    
    // إنشاء صفحة تفاصيل البطاقة
    function createCardDetailsPage() {
        // إنشاء عنصر الصفحة
        const pageElement = document.createElement('div');
        pageElement.id = 'card-details-page';
        pageElement.className = 'page'; // فئة صفحات التطبيق
        
        // إنشاء محتوى الصفحة
        pageElement.innerHTML = `
            <div class="header">
                <button class="toggle-sidebar">
                    <i class="fas fa-bars"></i>
                </button>
                <h1 class="page-title">تفاصيل البطاقة</h1>
                <div class="header-actions">
                    <button class="btn btn-outline" id="back-to-cards">
                        <i class="fas fa-arrow-right"></i>
                        <span>العودة للبطاقات</span>
                    </button>
                </div>
            </div>
            
            <div class="card-content-area">
                <div class="investor-card-container text-center" id="card-details-container">
                    <!-- سيتم ملؤها ديناميكياً بمعلومات البطاقة -->
                </div>
                
                <div class="card-options">
                    <button class="card-option-btn" id="flip-card-btn">
                        <i class="fas fa-sync-alt"></i>
                        <span>عرض الخلف</span>
                    </button>
                    <button class="card-option-btn" id="print-card-btn">
                        <i class="fas fa-print"></i>
                        <span>طباعة البطاقة</span>
                    </button>
                    <button class="card-option-btn" id="share-card-btn">
                        <i class="fas fa-share-alt"></i>
                        <span>مشاركة</span>
                    </button>
                    <button class="card-option-btn primary" id="edit-card-btn">
                        <i class="fas fa-edit"></i>
                        <span>تعديل البطاقة</span>
                    </button>
                    <button class="card-option-btn danger" id="deactivate-card-btn">
                        <i class="fas fa-times-circle"></i>
                        <span>إيقاف البطاقة</span>
                    </button>
                </div>
                
                <div class="flex gap-20 mt-20">
                    <div class="investor-details" style="flex: 1;">
                        <h3 class="investor-details-title">تفاصيل المستثمر</h3>
                        <div id="investor-details-container">
                            <!-- سيتم ملؤها ديناميكياً بمعلومات المستثمر -->
                        </div>
                    </div>
                    
                    <div class="investor-details" style="flex: 1;">
                        <h3 class="investor-details-title">سجل أنشطة البطاقة</h3>
                        <div id="card-activities-container">
                            <!-- سيتم ملؤها ديناميكياً بسجل الأنشطة -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // إضافة الصفحة إلى الـ main-content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(pageElement);
        } else {
            console.error('لم يتم العثور على عنصر main-content');
        }
    }
    
    // إنشاء صفحة إنشاء بطاقة جديدة
    function createNewCardPage() {
        // إنشاء عنصر الصفحة
        const pageElement = document.createElement('div');
        pageElement.id = 'new-card-page';
        pageElement.className = 'page'; // فئة صفحات التطبيق
        
        // إنشاء محتوى الصفحة
        pageElement.innerHTML = `
            <div class="header">
                <button class="toggle-sidebar">
                    <i class="fas fa-bars"></i>
                </button>
                <h1 class="page-title">إنشاء بطاقة جديدة</h1>
                <div class="header-actions">
                    <button class="btn btn-outline" id="back-to-cards-from-new">
                        <i class="fas fa-arrow-right"></i>
                        <span>العودة للبطاقات</span>
                    </button>
                </div>
            </div>
            
            <div class="card-content-area">
                <div class="flex gap-20">
                    <div class="card-form-container" style="flex: 2;">
                        <h2 class="card-form-title">إنشاء بطاقة مستثمر جديدة</h2>
                        
                        <form id="create-card-form">
                            <div class="card-form-group">
                                <label class="card-form-label">اسم المستثمر</label>
                                <select class="card-form-input" id="investor-select" required>
                                    <option value="">اختر المستثمر</option>
                                    <!-- سيتم ملؤها ديناميكياً -->
                                </select>
                            </div>
                            
                            <div class="card-form-group">
                                <label class="card-form-label">رقم الجوال</label>
                                <input type="tel" class="card-form-input" id="investor-phone" readonly>
                            </div>
                            
                            <div class="card-form-group">
                                <label class="card-form-label">نوع البطاقة</label>
                                <div class="card-type-options">
                                    <label class="card-type-option" data-card-type="platinum">
                                        <input type="radio" name="card-type" value="platinum" checked>
                                        <span>بلاتينية</span>
                                    </label>
                                    <label class="card-type-option" data-card-type="gold">
                                        <input type="radio" name="card-type" value="gold">
                                        <span>ذهبية</span>
                                    </label>
                                    <label class="card-type-option" data-card-type="premium">
                                        <input type="radio" name="card-type" value="premium">
                                        <span>بريميوم</span>
                                    </label>
                                    <label class="card-type-option" data-card-type="diamond">
                                        <input type="radio" name="card-type" value="diamond">
                                        <span>ماسية</span>
                                    </label>
                                    <label class="card-type-option" data-card-type="islamic">
                                        <input type="radio" name="card-type" value="islamic">
                                        <span>إسلامية</span>
                                    </label>
                                    <label class="card-type-option" data-card-type="custom">
                                        <input type="radio" name="card-type" value="custom">
                                        <span>مخصصة</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="card-form-group hidden" id="custom-card-options">
                                <label class="card-form-label">خيارات البطاقة المخصصة</label>
                                <div class="flex gap-10 flex-wrap">
                                    <div style="flex: 1;">
                                        <label class="card-form-label">لون البطاقة</label>
                                        <input type="color" class="card-form-input" id="custom-card-color" value="#3498db">
                                    </div>
                                    <div style="flex: 1;">
                                        <label class="card-form-label">لون النص</label>
                                        <input type="color" class="card-form-input" id="custom-text-color" value="#ffffff">
                                    </div>
                                    <div style="flex: 1;">
                                        <label class="card-form-label">لون الشريحة</label>
                                        <input type="color" class="card-form-input" id="custom-chip-color" value="#C0C0C0">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card-form-group">
                                <label class="card-form-label">تاريخ الإنتهاء</label>
                                <input type="date" class="card-form-input" id="expiry-date" required>
                            </div>
                            
                            <div class="card-form-group">
                                <label class="card-form-label">خيارات متقدمة</label>
                                <div class="flex gap-10 flex-wrap">
                                    <div class="form-check">
                                        <input type="checkbox" id="enable-qrcode" checked>
                                        <label for="enable-qrcode">تفعيل QR Code</label>
                                    </div>
                                    <div class="form-check">
                                        <input type="checkbox" id="enable-hologram" checked>
                                        <label for="enable-hologram">تفعيل الهولوغرام</label>
                                    </div>
                                    <div class="form-check">
                                        <input type="checkbox" id="enable-chip" checked>
                                        <label for="enable-chip">تفعيل الشريحة</label>
                                    </div>
                                    <div class="form-check">
                                        <input type="checkbox" id="enable-pin">
                                        <label for="enable-pin">تأمين البطاقة برمز PIN</label>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card-form-group hidden" id="pin-options">
                                <label class="card-form-label">رمز PIN (4 أرقام)</label>
                                <input type="password" class="card-form-input" id="card-pin" pattern="[0-9]{4}" minlength="4" maxlength="4" placeholder="أدخل 4 أرقام">
                            </div>
                            
                            <div class="card-form-actions">
                                <button type="button" class="btn btn-outline" id="cancel-create-card">إلغاء</button>
                                <button type="submit" class="btn btn-primary" id="save-card-btn">معالجة البطاقة</button>
                            </div>
                        </form>
                    </div>
                    
                    <div style="flex: 1;">
                        <div class="card-preview-container" style="position: sticky; top: 20px;">
                            <h3 class="mb-10 text-center">معاينة البطاقة</h3>
                            <div id="card-preview">
                                <!-- سيتم ملؤها ديناميكياً بمعاينة البطاقة -->
                            </div>
                            <div class="text-center mt-10">
                                <button class="btn btn-sm btn-outline" id="flip-preview-card">
                                    <i class="fas fa-sync-alt"></i>
                                    <span>عرض الخلف</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // إضافة الصفحة إلى الـ main-content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(pageElement);
        } else {
            console.error('لم يتم العثور على عنصر main-content');
        }
    }
    
    // إنشاء صفحة إحصائيات البطاقات
    function createCardStatsPage() {
        // إنشاء عنصر الصفحة
        const pageElement = document.createElement('div');
        pageElement.id = 'card-stats-page';
        pageElement.className = 'page'; // فئة صفحات التطبيق
        
        // إنشاء محتوى الصفحة
        pageElement.innerHTML = `
            <div class="header">
                <button class="toggle-sidebar">
                    <i class="fas fa-bars"></i>
                </button>
                <h1 class="page-title">إحصائيات البطاقات</h1>
                <div class="header-actions">
                    <button class="btn btn-outline" id="export-stats-btn">
                        <i class="fas fa-download"></i>
                        <span>تصدير الإحصائيات</span>
                    </button>
                    <button class="btn btn-primary" id="refresh-stats-btn">
                        <i class="fas fa-sync-alt"></i>
                        <span>تحديث</span>
                    </button>
                </div>
            </div>
            
            <div class="card-content-area">
                <div class="info-message">
                    <div class="info-title">إحصائيات البطاقات</div>
                    <div class="info-text">عرض إحصائيات وتحليلات بطاقات المستثمرين في النظام.</div>
                </div>
                
                <div class="stats-section">
                    <div class="stat-card">
                        <div class="stat-value" id="total-cards-stat">0</div>
                        <div class="stat-label">إجمالي البطاقات</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="active-cards-stat">0</div>
                        <div class="stat-label">البطاقات النشطة</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="expired-cards-stat">0</div>
                        <div class="stat-label">البطاقات المنتهية</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="avg-card-age-stat">0</div>
                        <div class="stat-label">متوسط عمر البطاقة (أيام)</div>
                    </div>
                </div>
                
                <div class="flex gap-20 flex-wrap">
                    <div class="chart-container" style="flex: 1; min-width: 300px;">
                        <div class="chart-title">توزيع البطاقات حسب النوع</div>
                        <canvas id="card-types-chart"></canvas>
                    </div>
                    
                    <div class="chart-container" style="flex: 1; min-width: 300px;">
                        <div class="chart-title">حالة البطاقات</div>
                        <canvas id="card-status-chart"></canvas>
                    </div>
                </div>
                
                <div class="chart-container">
                    <div class="chart-title">تطور البطاقات عبر الزمن</div>
                    <canvas id="cards-growth-chart"></canvas>
                </div>
                
                <div class="investor-details mt-20">
                    <h3 class="investor-details-title">أنشطة البطاقات الأخيرة</h3>
                    <div class="activity-list" id="recent-activities-container">
                        <!-- سيتم ملؤها ديناميكياً بأنشطة البطاقات -->
                    </div>
                </div>
            </div>
        `;
        
        // إضافة الصفحة إلى الـ main-content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(pageElement);
        } else {
            console.error('لم يتم العثور على عنصر main-content');
        }
    }
    
    // إضافة أزرار في القائمة الجانبية
    function addSidebarButtons() {
        // التحقق من وجود زر القائمة مسبقاً
        if (document.querySelector('a.nav-link[data-page="investor-cards"]')) {
            return;
        }
        
        // العثور على عنصر القائمة
        const navList = document.querySelector('.nav-list');
        if (!navList) {
            console.error('لم يتم العثور على قائمة التنقل');
            return;
        }
        
        // العثور على زر الإعدادات لإضافة الأزرار قبله
        const settingsItem = document.querySelector('.nav-link[data-page="settings"]')?.parentElement;
        
        // إنشاء عنصر الفاصل
        const separator = document.createElement('div');
        separator.className = 'nav-separator';
        separator.innerHTML = '<span>بطاقات المستثمرين</span>';
        
        // إضافة الفاصل إلى القائمة
        if (settingsItem) {
            navList.insertBefore(separator, settingsItem);
        } else {
            navList.appendChild(separator);
        }
        
        // إضافة زر كل البطاقات
        const cardsItem = addNavItem(navList, 'investor-cards', 'كل البطاقات', 'fas fa-credit-card');
        
        // إضافة زر البطاقات النشطة
        const activeCardsItem = addNavItem(navList, 'active-cards', 'البطاقات النشطة', 'fas fa-check-circle');
        
        // إضافة زر البطاقات المنتهية
        const expiredCardsItem = addNavItem(navList, 'expired-cards', 'البطاقات المنتهية', 'fas fa-calendar-times');
        
        // إضافة زر مسح الباركود
        const barcodeItem = addNavItem(navList, 'barcode-scanner', 'مسح باركود', 'fas fa-qrcode');
        
        // إضافة زر إنشاء بطاقة جديدة
        const newCardItem = addNavItem(navList, 'new-card', 'إنشاء بطاقة جديدة', 'fas fa-plus-circle');
        
        // إضافة زر إحصائيات البطاقات
        const statsItem = addNavItem(navList, 'card-stats', 'إحصائيات البطاقات', 'fas fa-chart-pie');
        
        // ترتيب العناصر
        if (settingsItem) {
            // إضافة العناصر قبل زر الإعدادات
            navList.insertBefore(cardsItem, settingsItem);
            navList.insertBefore(activeCardsItem, settingsItem);
            navList.insertBefore(expiredCardsItem, settingsItem);
            navList.insertBefore(barcodeItem, settingsItem);
            navList.insertBefore(newCardItem, settingsItem);
            navList.insertBefore(statsItem, settingsItem);
        }
        
        console.log('تم إضافة أزرار بطاقات المستثمرين إلى القائمة الجانبية');
    }
    
    // إضافة عنصر إلى القائمة الجانبية
    function addNavItem(navList, pageId, title, iconClass) {
        // إنشاء عنصر القائمة
        const navItem = document.createElement('li');
        navItem.className = 'nav-item';
        
        // إنشاء الرابط
        const navLink = document.createElement('a');
        navLink.className = 'nav-link';
        navLink.href = '#';
        navLink.setAttribute('data-page', pageId);
        
        // إضافة المحتوى
        navLink.innerHTML = `
            <div class="nav-icon">
                <i class="${iconClass}"></i>
            </div>
            <span>${title}</span>
        `;
        
        // إضافة مستمع النقر
        navLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // إزالة الفئة النشطة من جميع الروابط
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            // إضافة الفئة النشطة للرابط الحالي
            this.classList.add('active');
            
            // إخفاء جميع الصفحات
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            // إظهار الصفحة المطلوبة
            const targetPage = document.getElementById(`${pageId}-page`);
            if (targetPage) {
                targetPage.classList.add('active');
                
                // تحديث العرض حسب الصفحة
                switch (pageId) {
                    case 'investor-cards':
                        currentView = 'all';
                        renderCards('all');
                        break;
                    case 'active-cards':
                        currentView = 'active';
                        renderCards('active');
                        break;
                    case 'expired-cards':
                        currentView = 'expired';
                        renderCards('expired');
                        break;
                    case 'barcode-scanner':
                        currentView = 'scanner';
                        initBarcodeScanner();
                        break;
                    case 'new-card':
                        currentView = 'new';
                        updateInvestorSelect();
                        updateCardPreview();
                        break;
                    case 'card-stats':
                        currentView = 'stats';
                        renderCardStats();
                        break;
                }
            }
        });
        
        // إضافة الرابط إلى عنصر القائمة
        navItem.appendChild(navLink);
        
        // إضافة عنصر القائمة إلى القائمة
        navList.appendChild(navItem);
        
        return navItem;
    }
    
    // تهيئة مستمعي الأحداث
    function initEventListeners() {
        console.log('تهيئة مستمعي الأحداث لنظام البطاقات...');
        
        // مستمع لزر إنشاء بطاقة جديدة
        document.querySelectorAll('#create-card-btn, #create-card-btn-active, #add-card-fab, #add-card-fab-active, #add-first-card-btn, #add-first-active-card-btn').forEach(btn => {
            if (btn) {
                btn.addEventListener('click', function() {
                    // تحديث قائمة المستثمرين
                    updateInvestorSelect();
                    
                    // تعيين تاريخ انتهاء افتراضي
                    const expiryDateInput = document.getElementById('expiry-date');
                    if (expiryDateInput) {
                        const defaultExpiryYears = settings.defaultExpiryYears || 3;
                        const currentDate = new Date();
                        currentDate.setFullYear(currentDate.getFullYear() + defaultExpiryYears);
                        
                        // تنسيق التاريخ بالشكل YYYY-MM-DD
                        const year = currentDate.getFullYear();
                        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                        const day = String(currentDate.getDate()).padStart(2, '0');
                        
                        expiryDateInput.value = `${year}-${month}-${day}`;
                    }
                    
                    // تحديث معاينة البطاقة
                    updateCardPreview();
                    
                    // التنقل إلى صفحة إنشاء بطاقة جديدة
                    const newCardLink = document.querySelector('a.nav-link[data-page="new-card"]');
                    if (newCardLink) {
                        newCardLink.click();
                    }
                });
            }
        });
        
        // مستمع لتغيير اختيار المستثمر
        const investorSelect = document.getElementById('investor-select');
        if (investorSelect) {
            investorSelect.addEventListener('change', function() {
                const selectedInvestorId = this.value;
                if (selectedInvestorId) {
                    // البحث عن المستثمر
                    const investor = investors.find(inv => inv.id === selectedInvestorId);
                    if (investor) {
                        // تعبئة بيانات المستثمر
                        document.getElementById('investor-phone').value = investor.phone || '';
                        
                        // تحديث معاينة البطاقة
                        updateCardPreview();
                    }
                } else {
                    // مسح حقول المستثمر
                    document.getElementById('investor-phone').value = '';
                }
            });
        }
        
        // مستمع لتغيير نوع البطاقة
        document.querySelectorAll('input[name="card-type"]').forEach(radio => {
            radio.addEventListener('change', function() {
                // إظهار/إخفاء خيارات البطاقة المخصصة
                const customCardOptions = document.getElementById('custom-card-options');
                if (customCardOptions) {
                    customCardOptions.classList.toggle('hidden', this.value !== 'custom');
                }
                
                // تحديث فئة الخيار المحدد
                document.querySelectorAll('.card-type-option').forEach(option => {
                    option.classList.toggle('selected', option.querySelector('input').checked);
                });
                
                // تحديث معاينة البطاقة
                updateCardPreview();
            });
        });
        
        // مستمع للتغييرات في خيارات البطاقة المخصصة
        document.querySelectorAll('#custom-card-color, #custom-text-color, #custom-chip-color').forEach(input => {
            if (input) {
                input.addEventListener('input', updateCardPreview);
            }
        });
        
        // مستمع للتغييرات في الخيارات المتقدمة
        document.querySelectorAll('#enable-qrcode, #enable-hologram, #enable-chip, #enable-pin').forEach(checkbox => {
            if (checkbox) {
                checkbox.addEventListener('change', function() {
                    // إظهار/إخفاء خيارات PIN
                    if (checkbox.id === 'enable-pin') {
                        const pinOptions = document.getElementById('pin-options');
                        if (pinOptions) {
                            pinOptions.classList.toggle('hidden', !this.checked);
                        }
                    }
                    
                    // تحديث معاينة البطاقة
                    updateCardPreview();
                });
            }
        });
        
        // مستمع لزر إلغاء إنشاء البطاقة
        const cancelCreateCardBtn = document.getElementById('cancel-create-card');
        if (cancelCreateCardBtn) {
            cancelCreateCardBtn.addEventListener('click', function() {
                // العودة إلى صفحة كل البطاقات
                const allCardsLink = document.querySelector('a.nav-link[data-page="investor-cards"]');
                if (allCardsLink) {
                    allCardsLink.click();
                }
                
                // إعادة تعيين نموذج إنشاء البطاقة
                document.getElementById('create-card-form').reset();
            });
        }
        
        // مستمع لزر العودة إلى البطاقات
        document.querySelectorAll('#back-to-cards, #back-to-cards-from-new').forEach(btn => {
            if (btn) {
                btn.addEventListener('click', function() {
                    // العودة إلى صفحة كل البطاقات
                    const allCardsLink = document.querySelector('a.nav-link[data-page="investor-cards"]');
                    if (allCardsLink) {
                        allCardsLink.click();
                    }
                });
            }
        });
        
        // مستمع لإرسال نموذج إنشاء البطاقة
        const createCardForm = document.getElementById('create-card-form');
        if (createCardForm) {
            createCardForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // الحصول على بيانات النموذج
                const investorId = document.getElementById('investor-select').value;
                const cardType = document.querySelector('input[name="card-type"]:checked').value;
                const expiryDate = document.getElementById('expiry-date').value;
                
                if (!investorId || !cardType || !expiryDate) {
                    alert('يرجى ملء جميع الحقول المطلوبة');
                    return;
                }
                
                // خيارات متقدمة
                const enableQrCode = document.getElementById('enable-qrcode').checked;
                const enableHologram = document.getElementById('enable-hologram').checked;
                const enableChip = document.getElementById('enable-chip').checked;
                const enablePin = document.getElementById('enable-pin').checked;
                
                // ألوان البطاقة المخصصة
                let customColors = null;
                if (cardType === 'custom') {
                    customColors = {
                        cardColor: document.getElementById('custom-card-color').value,
                        textColor: document.getElementById('custom-text-color').value,
                        chipColor: document.getElementById('custom-chip-color').value
                    };
                }
                
                // رمز PIN (إذا كان مفعلاً)
                let pin = null;
                if (enablePin) {
                    pin = document.getElementById('card-pin').value;
                    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
                        alert('يرجى إدخال رمز PIN مكون من 4 أرقام');
                        return;
                    }
                }
                
                // إنشاء البطاقة
                createCard(investorId, cardType, expiryDate, {
                    enableQrCode,
                    enableHologram,
                    enableChip,
                    enablePin,
                    pin,
                    customColors
                });
            });
        }
        
        // مستمع لتقليب بطاقة المعاينة
        const flipPreviewCardBtn = document.getElementById('flip-preview-card');
        if (flipPreviewCardBtn) {
            flipPreviewCardBtn.addEventListener('click', function() {
                const previewCard = document.querySelector('#card-preview .investor-card');
                if (previewCard) {
                    previewCard.classList.toggle('flipped');
                    
                    // تحديث نص الزر
                    const isFlipped = previewCard.classList.contains('flipped');
                    this.innerHTML = isFlipped ?
                        '<i class="fas fa-sync-alt"></i><span>عرض الأمام</span>' :
                        '<i class="fas fa-sync-alt"></i><span>عرض الخلف</span>';
                }
            });
        }
        
        // مستمع لتقليب بطاقة التفاصيل
        const flipCardBtn = document.getElementById('flip-card-btn');
        if (flipCardBtn) {
            flipCardBtn.addEventListener('click', function() {
                const card = document.querySelector('#card-details-container .investor-card');
                if (card) {
                    card.classList.toggle('flipped');
                    
                    // تحديث نص الزر
                    const isFlipped = card.classList.contains('flipped');
                    this.innerHTML = isFlipped ?
                        '<i class="fas fa-sync-alt"></i><span>عرض الأمام</span>' :
                        '<i class="fas fa-sync-alt"></i><span>عرض الخلف</span>';
                }
            });
        }
        
        // مستمعات أحداث لأزرار الماسح الضوئي
        const startScannerBtn = document.getElementById('start-scanner');
        if (startScannerBtn) {
            startScannerBtn.addEventListener('click', function() {
                startBarcodeScanner();
            });
        }
        
        const stopScannerBtn = document.getElementById('stop-scanner');
        if (stopScannerBtn) {
            stopScannerBtn.addEventListener('click', function() {
                stopBarcodeScanner();
            });
        }
        
        const toggleCameraBtn = document.getElementById('toggle-camera-btn');
        if (toggleCameraBtn) {
            toggleCameraBtn.addEventListener('click', function() {
                toggleScannerCamera();
            });
        }
        
        const clearScanResultBtn = document.getElementById('clear-scan-result');
        if (clearScanResultBtn) {
            clearScanResultBtn.addEventListener('click', function() {
                const scanResult = document.getElementById('scan-result');
                if (scanResult) {
                    scanResult.classList.add('hidden');
                }
                document.getElementById('scan-result-data').textContent = '';
            });
        }
        
        const gotoScannedCardBtn = document.getElementById('goto-scanned-card');
        if (gotoScannedCardBtn) {
            gotoScannedCardBtn.addEventListener('click', function() {
                const scanResultData = document.getElementById('scan-result-data').textContent;
                if (scanResultData) {
                    showCardDetails(scanResultData);
                }
            });
        }
        
        // مستمع لأزرار عرض تفاصيل البطاقة
        document.addEventListener('click', function(e) {
            const cardPreview = e.target.closest('.card-preview');
            if (cardPreview) {
                const cardId = cardPreview.getAttribute('data-card-id');
                if (cardId) {
                    showCardDetails(cardId);
                }
            }
        });
        
        // مستمع لزر طباعة البطاقة
        const printCardBtn = document.getElementById('print-card-btn');
        if (printCardBtn) {
            printCardBtn.addEventListener('click', function() {
                const cardId = this.getAttribute('data-card-id');
                if (cardId) {
                    printCard(cardId);
                }
            });
        }
        
        // مستمع لزر مشاركة البطاقة
        const shareCardBtn = document.getElementById('share-card-btn');
        if (shareCardBtn) {
            shareCardBtn.addEventListener('click', function() {
                const cardId = this.getAttribute('data-card-id');
                if (cardId) {
                    shareCard(cardId);
                }
            });
        }
        
        // مستمع لزر تعديل البطاقة
        const editCardBtn = document.getElementById('edit-card-btn');
        if (editCardBtn) {
            editCardBtn.addEventListener('click', function() {
                const cardId = this.getAttribute('data-card-id');
                if (cardId) {
                    editCard(cardId);
                }
            });
        }
        
        // مستمع لزر إيقاف البطاقة
        const deactivateCardBtn = document.getElementById('deactivate-card-btn');
        if (deactivateCardBtn) {
            deactivateCardBtn.addEventListener('click', function() {
                const cardId = this.getAttribute('data-card-id');
                if (cardId) {
                    toggleCardStatus(cardId);
                }
            });
        }
        
        // مستمع لزر تجديد كل البطاقات المنتهية
        const renewAllExpiredBtn = document.getElementById('renew-all-expired-btn');
        if (renewAllExpiredBtn) {
            renewAllExpiredBtn.addEventListener('click', function() {
                renewAllExpiredCards();
            });
        }
        
        // مستمع لأزرار فلترة البطاقات
        document.querySelectorAll('[id^="cards-filter-"], [id^="active-cards-filter-"], [id^="expired-cards-filter-"]').forEach(btn => {
            if (btn) {
                btn.addEventListener('click', function() {
                    // تحديد فئة الزر النشط
                    const filterGroup = this.id.startsWith('cards-filter') ? 'cards-filter' : 
                                        this.id.startsWith('active-cards-filter') ? 'active-cards-filter' : 
                                        'expired-cards-filter';
                    
                    // إزالة الفئة النشطة من كل الأزرار في المجموعة
                    document.querySelectorAll(`[id^="${filterGroup}-"]`).forEach(button => {
                        button.classList.remove('active');
                    });
                    
                    // إضافة الفئة النشطة للزر الحالي
                    this.classList.add('active');
                    
                    // تحديد نوع الفلتر
                    const filterType = this.id.replace(`${filterGroup}-`, '');
                    
                    // تحديث عرض البطاقات حسب الفلتر
                    if (filterGroup === 'cards-filter') {
                        renderCards('all', filterType);
                    } else if (filterGroup === 'active-cards-filter') {
                        renderCards('active', filterType);
                    } else {
                        renderCards('expired', filterType);
                    }
                });
            }
        });
        
        // مستمع لأزرار ترتيب البطاقات
        document.querySelectorAll('[id$="-sort-recent"], [id$="-sort-name"], [id$="-sort-expiry"]').forEach(btn => {
            if (btn) {
                btn.addEventListener('click', function() {
                    // تحديد مجموعة الترتيب
                    const sortGroup = this.id.includes('cards-sort') ? 'cards-sort' : 
                                      this.id.includes('active-cards-sort') ? 'active-cards-sort' : 
                                      'expired-cards-sort';
                    
                    // إزالة الفئة النشطة من كل الأزرار في المجموعة
                    document.querySelectorAll(`[id^="${sortGroup.split('-')[0]}"][id$="-${sortGroup.split('-')[1]}"]`).forEach(button => {
                        button.classList.remove('active');
                    });
                    
                    // إضافة الفئة النشطة للزر الحالي
                    this.classList.add('active');
                    
                    // تحديد نوع الترتيب
                    const sortType = this.id.split('-').pop();
                    
                    // تحديث عرض البطاقات حسب الترتيب
                    if (sortGroup === 'cards-sort') {
                        setSortOrder('all', sortType);
                        renderCards('all');
                    } else if (sortGroup === 'active-cards-sort') {
                        setSortOrder('active', sortType);
                        renderCards('active');
                    } else {
                        setSortOrder('expired', sortType);
                        renderCards('expired');
                    }
                });
            }
        });
        
        // مستمع لحقول البحث
        document.querySelectorAll('#cards-search, #active-cards-search, #expired-cards-search').forEach(searchInput => {
            if (searchInput) {
                searchInput.addEventListener('input', function() {
                    const searchText = this.value.trim();
                    const searchType = this.id.split('-')[0];
                    
                    // تحديث العرض مع البحث
                    if (searchType === 'cards') {
                        renderCards('all', null, searchText);
                    } else if (searchType === 'active') {
                        renderCards('active', null, searchText);
                    } else {
                        renderCards('expired', null, searchText);
                    }
                });
            }
        });
        
        // مستمع لزر تحديث الإحصائيات
        const refreshStatsBtn = document.getElementById('refresh-stats-btn');
        if (refreshStatsBtn) {
            refreshStatsBtn.addEventListener('click', function() {
                updateCardStats();
                renderCardStats();
            });
        }
        
        // مستمع لزر تصدير الإحصائيات
        const exportStatsBtn = document.getElementById('export-stats-btn');
        if (exportStatsBtn) {
            exportStatsBtn.addEventListener('click', function() {
                exportCardStats();
            });
        }
        
        console.log('تم تهيئة مستمعي الأحداث لنظام البطاقات');
    }
    
    // تهيئة الاتصال بقاعدة البيانات
    function initializeDatabase() {
        console.log('تهيئة الاتصال بقاعدة البيانات...');
        
        return new Promise((resolve, reject) => {
            try {
                // التحقق من وجود Firebase
                if (typeof firebase === 'undefined') {
                    console.warn('لم يتم العثور على Firebase، سيتم استخدام التخزين المحلي فقط');
                    resolve(true);
                    return;
                }
                
                // التحقق من وجود قاعدة البيانات
                if (!firebase.database) {
                    console.warn('لم يتم العثور على Firebase Database، سيتم استخدام التخزين المحلي فقط');
                    resolve(true);
                    return;
                }
                
                // الحصول على مرجع قاعدة البيانات
                databaseRef = firebase.database();
                
                // التحقق من المستخدم الحالي
                const currentUser = firebase.auth().currentUser;
                if (!currentUser) {
                    console.warn('المستخدم غير مسجل الدخول، سيتم استخدام التخزين المحلي فقط');
                    
                    // إضافة مستمع لتغيير حالة المستخدم
                    firebase.auth().onAuthStateChanged(user => {
                        if (user) {
                            console.log('تم تسجيل الدخول، سيتم مزامنة البيانات مع Firebase');
                            // حاول مزامنة البيانات المحلية مع Firebase
                            syncLocalDataWithFirebase();
                        }
                    });
                    
                    resolve(true);
                    return;
                }
                
                console.log('تم تهيئة الاتصال بقاعدة البيانات بنجاح');
                resolve(true);
            } catch (error) {
                console.error('خطأ في تهيئة الاتصال بقاعدة البيانات:', error);
                resolve(true); // نستمر بالتهيئة حتى مع وجود خطأ
            }
        });
    }
    
    // مزامنة البيانات المحلية مع Firebase
    function syncLocalDataWithFirebase() {
        if (!databaseRef || !firebase.auth().currentUser) return;
        
        const userId = firebase.auth().currentUser.uid;
        
        // تحقق مما إذا كانت هناك بيانات في Firebase
        databaseRef.ref(`users/${userId}/investor_cards`).once('value')
            .then(snapshot => {
                const firebaseCards = snapshot.val();
                
                if (firebaseCards) {
                    // إذا كانت هناك بيانات في Firebase، نقارنها مع البيانات المحلية
                    const firebaseCardsArray = Object.values(firebaseCards);
                    
                    if (cards.length === 0) {
                        // إذا لم تكن هناك بيانات محلية، نستخدم بيانات Firebase
                        cards = firebaseCardsArray;
                        saveCardsToLocalStorage();
                        console.log('تم مزامنة البيانات من Firebase إلى التخزين المحلي');
                    } else {
                        // إذا كانت هناك بيانات محلية، نقوم بالدمج
                        mergeDatabases(firebaseCardsArray);
                    }
                } else if (cards.length > 0) {
                    // إذا لم تكن هناك بيانات في Firebase ولكن هناك بيانات محلية، نرفعها إلى Firebase
                    saveCardsToFirebase()
                        .then(() => {
                            console.log('تم رفع البيانات المحلية إلى Firebase');
                        });
                }
            })
            .catch(error => {
                console.error('خطأ في مزامنة البيانات مع Firebase:', error);
            });
    }
    
    // دمج قواعد البيانات المحلية وFirebase
    function mergeDatabases(firebaseCards) {
        // تعيين معرفات لمقارنتها
        const localIds = cards.map(card => card.id);
        const firebaseIds = firebaseCards.map(card => card.id);
        
        // إضافة البطاقات الجديدة من Firebase التي لا توجد محلياً
        firebaseCards.forEach(firebaseCard => {
            if (!localIds.includes(firebaseCard.id)) {
                cards.push(firebaseCard);
            }
        });
        
        // إضافة البطاقات المحلية التي لا توجد في Firebase
        const cardsToAdd = cards.filter(localCard => !firebaseIds.includes(localCard.id));
        
        // تحديث البطاقات في Firebase إذا كانت هناك إضافات
        if (cardsToAdd.length > 0) {
            saveCardsToFirebase()
                .then(() => {
                    console.log('تم تحديث Firebase بالبطاقات المحلية الجديدة');
                });
        }
        
        // تحديث التخزين المحلي
        saveCardsToLocalStorage();
        console.log('تم دمج البيانات بين التخزين المحلي وFirebase');
    }
    
    // تحميل البيانات
    function loadData() {
        console.log('تحميل بيانات المستثمرين والبطاقات...');
        
        // تحميل المستثمرين من التخزين المحلي أو window.investors
        loadInvestors();
        
        // تحميل البطاقات من التخزين المحلي
        loadCardsFromLocalStorage();
        
        // تحميل سجل الأنشطة
        loadActivities();
        
        // تحميل البطاقات من Firebase إذا كان متاحاً
        if (databaseRef && firebase.auth().currentUser) {
            const userId = firebase.auth().currentUser.uid;
            
            return databaseRef.ref(`users/${userId}/investor_cards`)
                .once('value')
                .then(snapshot => {
                    const cardsData = snapshot.val();
                    if (cardsData) {
                        // دمج البيانات من Firebase مع البيانات المحلية
                        const firebaseCards = Object.values(cardsData);
                        mergeDatabases(firebaseCards);
                        console.log(`تم تحميل ${firebaseCards.length} بطاقة من قاعدة البيانات`);
                    }
                    
                    return true;
                })
                .catch(error => {
                    console.error('خطأ في تحميل البطاقات من قاعدة البيانات:', error);
                    return true; // نستمر حتى مع وجود خطأ
                });
        } else {
            return Promise.resolve(true);
        }
    }
    
    // تحميل المستثمرين
    function loadInvestors() {
        // أولاً، نحاول الحصول على المستثمرين من window.investors
        if (window.investors && Array.isArray(window.investors) && window.investors.length > 0) {
            investors = window.investors;
            console.log(`تم تحميل ${investors.length} مستثمر من window.investors`);
            return;
        }
        
        // ثانياً، نحاول التحميل من التخزين المحلي
        try {
            const savedInvestors = localStorage.getItem('investors');
            if (savedInvestors) {
                investors = JSON.parse(savedInvestors);
                console.log(`تم تحميل ${investors.length} مستثمر من التخزين المحلي`);
            }
        } catch (error) {
            console.error('خطأ في تحميل بيانات المستثمرين من التخزين المحلي:', error);
        }
    }
    
    // تحميل البطاقات من التخزين المحلي
    function loadCardsFromLocalStorage() {
        try {
            const savedCards = localStorage.getItem('investor_cards');
            if (savedCards) {
                cards = JSON.parse(savedCards);
                console.log(`تم تحميل ${cards.length} بطاقة من التخزين المحلي`);
            }
        } catch (error) {
            console.error('خطأ في تحميل بيانات البطاقات من التخزين المحلي:', error);
        }
    }
    
    // تحميل سجل الأنشطة
    function loadActivities() {
        try {
            const savedActivities = localStorage.getItem('card_activities');
            if (savedActivities) {
                activities = JSON.parse(savedActivities);
                console.log(`تم تحميل ${activities.length} نشاط من التخزين المحلي`);
            }
        } catch (error) {
            console.error('خطأ في تحميل سجل الأنشطة من التخزين المحلي:', error);
        }
    }
    
    // حفظ البطاقات في التخزين المحلي
    function saveCardsToLocalStorage() {
        try {
            localStorage.setItem('investor_cards', JSON.stringify(cards));
            console.log('تم حفظ البطاقات في التخزين المحلي');
            return true;
        } catch (error) {
            console.error('خطأ في حفظ البطاقات في التخزين المحلي:', error);
            return false;
        }
    }
    
    // حفظ البطاقات في Firebase
    function saveCardsToFirebase() {
        if (!databaseRef || !firebase.auth().currentUser) {
            return Promise.resolve(false);
        }
        
        const userId = firebase.auth().currentUser.uid;
        
        // تحويل المصفوفة إلى كائن مفهرس
        const cardsObject = {};
        cards.forEach(card => {
            cardsObject[card.id] = card;
        });
        
        return databaseRef.ref(`users/${userId}/investor_cards`)
            .set(cardsObject)
            .then(() => {
                console.log('تم حفظ البطاقات في قاعدة البيانات');
                return true;
            })
            .catch(error => {
                console.error('خطأ في حفظ البطاقات في قاعدة البيانات:', error);
                return false;
            });
    }
    
    // حفظ سجل الأنشطة
    function saveActivities() {
        try {
            localStorage.setItem('card_activities', JSON.stringify(activities));
            return true;
        } catch (error) {
            console.error('خطأ في حفظ سجل الأنشطة:', error);
            return false;
        }
    }
    
    // إضافة نشاط جديد
    function addActivity(cardId, action, details = {}) {
        const card = cards.find(c => c.id === cardId);
        if (!card) return;
        
        const activity = {
            id: Date.now().toString(),
            cardId: cardId,
            investorId: card.investorId,
            action: action, // 'create', 'edit', 'deactivate', 'activate', 'renew', 'scan'
            details: details,
            timestamp: new Date().toISOString()
        };
        
        activities.unshift(activity); // إضافة في بداية المصفوفة
        
        // الحفاظ على الحد الأقصى للأنشطة (100 نشاط)
        if (activities.length > 100) {
            activities = activities.slice(0, 100);
        }
        
        // حفظ الأنشطة
        saveActivities();
        
        return activity;
    }
    
    // تحديث قائمة المستثمرين في نموذج إنشاء البطاقة
    function updateInvestorSelect() {
        const select = document.getElementById('investor-select');
        if (!select) return;
        
        // مسح الخيارات الحالية
        select.innerHTML = '<option value="">اختر المستثمر</option>';
        
        // تحميل بيانات المستثمرين المحدثة
        loadInvestors();
        
        // إضافة خيارات المستثمرين
        investors.forEach(investor => {
            // التحقق مما إذا كان للمستثمر بطاقة نشطة بالفعل
            const hasActiveCard = cards.some(card => 
                card.investorId === investor.id && 
                card.status === 'active' && 
                new Date(card.expiryDate) > new Date()
            );
            
            const option = document.createElement('option');
            option.value = investor.id;
            option.textContent = `${investor.name} ${investor.phone ? `(${investor.phone})` : ''}`;
            
            // تعطيل الخيار إذا كان للمستثمر بطاقة نشطة
            if (hasActiveCard) {
                option.disabled = true;
                option.textContent += ' - لديه بطاقة نشطة';
            }
            
            select.appendChild(option);
        });
    }
    
    // تحديث معاينة البطاقة
    function updateCardPreview() {
        const previewContainer = document.getElementById('card-preview');
        if (!previewContainer) return;
        
        // الحصول على بيانات النموذج
        const investorId = document.getElementById('investor-select').value;
        const cardType = document.querySelector('input[name="card-type"]:checked')?.value || settings.defaultCardType;
        
        // البحث عن المستثمر
        const investor = investors.find(inv => inv.id === investorId);
        
        // إعداد الاسم ورقم الهاتف
        const investorName = investor ? investor.name : 'اسم المستثمر';
        const investorPhone = investor ? investor.phone : '';
        
        // إنشاء رقم بطاقة للمعاينة
        const cardNumber = '5XXX XXXX XXXX 1234';
        
        // تاريخ الانتهاء
        const expiryDate = document.getElementById('expiry-date')?.value || '';
        let expiryMonth = '12';
        let expiryYear = '99';
        
        if (expiryDate) {
            const date = new Date(expiryDate);
            expiryMonth = String(date.getMonth() + 1).padStart(2, '0');
            expiryYear = date.getFullYear().toString().slice(2);
        }
        
        // الخيارات المتقدمة
        const enableQrCode = document.getElementById('enable-qrcode')?.checked ?? true;
        const enableHologram = document.getElementById('enable-hologram')?.checked ?? true;
        const enableChip = document.getElementById('enable-chip')?.checked ?? true;
        
        // ضبط أنماط البطاقة حسب النوع
        let cardStyle = '';
        let cardBrandText = 'MASTERCARD';
        
        switch (cardType) {
            case 'platinum':
                cardStyle = `background-color: ${CARD_TYPES.platinum.color}; color: ${CARD_TYPES.platinum.textColor};`;
                cardBrandText = 'بلاتينية';
                break;
            case 'gold':
                cardStyle = `background-color: ${CARD_TYPES.gold.color}; color: ${CARD_TYPES.gold.textColor};`;
                cardBrandText = 'ذهبية';
                break;
            case 'premium':
                cardStyle = `background-color: ${CARD_TYPES.premium.color}; color: ${CARD_TYPES.premium.textColor};`;
                cardBrandText = 'بريميوم';
                break;
            case 'diamond':
                cardStyle = `background-color: ${CARD_TYPES.diamond.color}; color: ${CARD_TYPES.diamond.textColor};`;
                cardBrandText = 'ماسية';
                break;
            case 'islamic':
                cardStyle = `background-color: ${CARD_TYPES.islamic.color}; color: ${CARD_TYPES.islamic.textColor};`;
                cardBrandText = 'إسلامية';
                break;
            case 'custom':
                const customCardColor = document.getElementById('custom-card-color')?.value || '#3498db';
                const customTextColor = document.getElementById('custom-text-color')?.value || '#ffffff';
                cardStyle = `background-color: ${customCardColor}; color: ${customTextColor};`;
                cardBrandText = 'مخصصة';
                break;
        }
        
        // إنشاء HTML للمعاينة
        previewContainer.innerHTML = `
            <div class="investor-card" style="${cardStyle}">
                <div class="card-inner">
                    <div class="card-front">
                        <div class="card-brand">${cardBrandText}</div>
                        <div class="card-logo">
                            <div class="card-logo-circle red"></div>
                            <div class="card-logo-circle yellow"></div>
                        </div>
                        
                        ${enableChip ? `
                        <div class="card-chip">
                            <div class="chip-line"></div>
                            <div class="chip-line"></div>
                            <div class="chip-line"></div>
                            <div class="chip-line"></div>
                            <div class="chip-line"></div>
                            <div class="chip-line"></div>
                            <div class="chip-line"></div>
                        </div>
                        ` : ''}
                        
                        ${enableHologram ? `<div class="card-hologram"></div>` : ''}
                        
                        ${enableQrCode ? `
                        <div class="card-qrcode">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=preview" alt="QR Code">
                        </div>
                        ` : ''}
                        
                        <div class="card-number">${cardNumber}</div>
                        <div class="card-details">
                            <div class="card-validity">
                                <div class="card-valid-text">VALID THRU</div>
                                <div>${expiryMonth}/${expiryYear}</div>
                            </div>
                            <div class="card-name">${investorName}</div>
                        </div>
                    </div>
                    
                    <div class="card-back">
                        <div class="card-back-strip"></div>
                        <div class="card-cvv">CVV: 123</div>
                        <div class="card-issuer-info">
                            نظام الاستثمار المتكامل<br>
                            بطاقة المستثمر<br>
                            ${investorPhone ? investorPhone : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // إنشاء بطاقة جديدة
    function createCard(investorId, cardType, expiryDate, options = {}) {
        console.log(`إنشاء بطاقة جديدة للمستثمر ${investorId} من نوع ${cardType}`);
        
        // البحث عن المستثمر
        const investor = investors.find(inv => inv.id === investorId);
        if (!investor) {
            alert('لم يتم العثور على المستثمر');
            return;
        }
        
        // التحقق مما إذا كان للمستثمر بطاقة نشطة بالفعل
        const existingActiveCard = cards.find(card => 
            card.investorId === investorId && 
            card.status === 'active' && 
            new Date(card.expiryDate) > new Date()
        );
        
        if (existingActiveCard) {
            alert('هذا المستثمر لديه بطاقة نشطة بالفعل');
            return;
        }
        
        // إنشاء رقم بطاقة فريد
        const cardNumber = generateCardNumber();
        
        // رقم CVV عشوائي (3 أرقام)
        const cvv = Math.floor(100 + Math.random() * 900).toString();
        
        // إنشاء كائن البطاقة
        const newCard = {
            id: Date.now().toString(),
            investorId: investorId,
            investorName: investor.name,
            investorPhone: investor.phone || '',
            cardNumber: cardNumber,
            cvv: cvv,
            cardType: cardType,
            expiryDate: expiryDate,
            createdAt: new Date().toISOString(),
            status: 'active',
            lastUsed: null,
            lastRenewed: null,
            features: {
                enableQrCode: options.enableQrCode !== undefined ? options.enableQrCode : true,
                enableHologram: options.enableHologram !== undefined ? options.enableHologram : true,
                enableChip: options.enableChip !== undefined ? options.enableChip : true,
                enablePin: options.enablePin || false
            }
        };
        
        // إضافة رمز PIN إذا كان مفعلاً
        if (options.enablePin && options.pin) {
            newCard.pin = options.pin;
        }
        
        // إضافة ألوان مخصصة إذا كان النوع مخصصاً
        if (cardType === 'custom' && options.customColors) {
            newCard.customColors = options.customColors;
        }
        
        // إضافة البطاقة إلى المصفوفة
        cards.push(newCard);
        
        // إضافة نشاط الإنشاء
        addActivity(newCard.id, 'create', {
            cardType: cardType,
            expiryDate: expiryDate
        });
        
        // حفظ البطاقات
        const savedLocally = saveCardsToLocalStorage();
        
        // حفظ في Firebase إذا كان متاحاً
        saveCardsToFirebase()
            .then(savedToFirebase => {
                if (savedLocally || savedToFirebase) {
                    // تحديث الإحصائيات
                    updateCardStats();
                    
                    alert('تم إنشاء البطاقة بنجاح');
                    
                    // إعادة تعيين النموذج
                    document.getElementById('create-card-form').reset();
                    
                    // العودة إلى صفحة كل البطاقات وعرض البطاقة الجديدة
                    showCardDetails(newCard.id);
                } else {
                    alert('حدث خطأ أثناء حفظ البطاقة');
                }
            });
    }
    
    // إنشاء رقم بطاقة فريد
    function generateCardNumber() {
        // توليد رقم بطاقة عشوائي يتوافق مع خوارزمية لوهن
        let cardNumber = '';
        
        // البداية برقم 5 للماستر كارد
        cardNumber += '5';
        
        // توليد 14 رقم عشوائي
        for (let i = 0; i < 14; i++) {
            cardNumber += Math.floor(Math.random() * 10).toString();
        }
        
        // حساب رقم التحقق باستخدام خوارزمية لون
        const checkDigit = getLuhnCheckDigit(cardNumber);
        
        // إضافة رقم التحقق
        cardNumber += checkDigit;
        
        // تنسيق الرقم
        return `${cardNumber.substring(0, 4)} ${cardNumber.substring(4, 8)} ${cardNumber.substring(8, 12)} ${cardNumber.substring(12, 16)}`;
    }
    
    // حساب رقم التحقق باستخدام خوارزمية لون
    function getLuhnCheckDigit(partialCardNumber) {
        // إزالة المسافات
        const number = partialCardNumber.replace(/\s/g, '');
        
        let sum = 0;
        let shouldDouble = false;
        
        // المرور على الأرقام من اليمين إلى اليسار
        for (let i = number.length - 1; i >= 0; i--) {
            let digit = parseInt(number.charAt(i));
            
            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        
        // حساب رقم التحقق
        return ((Math.floor(sum / 10) + 1) * 10 - sum) % 10;
    }
    
    // ضبط طريقة الترتيب
    let sortOrders = {
        all: 'recent',
        active: 'recent',
        expired: 'recent'
    };
    
    function setSortOrder(viewType, sortType) {
        sortOrders[viewType] = sortType;
    }
    
    // عرض البطاقات
    function renderCards(type = 'all', filter = null, searchText = '') {
        console.log(`عرض البطاقات من نوع: ${type}، فلتر: ${filter}، بحث: ${searchText}`);
        
        let containerSelector;
        let filteredCards;
        const currentDate = new Date();
        
        // فلترة البطاقات حسب النوع
        switch (type) {
            case 'active':
                containerSelector = '#active-cards-container';
                filteredCards = cards.filter(card => 
                    card.status === 'active' && new Date(card.expiryDate) >= currentDate
                );
                break;
            case 'expired':
                containerSelector = '#expired-cards-container';
                filteredCards = cards.filter(card => 
                    card.status === 'inactive' || new Date(card.expiryDate) < currentDate
                );
                break;
            case 'all':
            default:
                containerSelector = '#cards-container';
                filteredCards = [...cards];
                break;
        }
        
        // فلترة إضافية حسب الفلتر المحدد
        if (filter && filter !== 'all') {
            switch (filter) {
                case 'platinum':
                case 'gold':
                case 'premium':
                case 'diamond':
                case 'islamic':
                case 'custom':
                    filteredCards = filteredCards.filter(card => card.cardType === filter);
                    break;
                case 'other':
                    // أنواع البطاقات الأخرى غير الرئيسية
                    filteredCards = filteredCards.filter(card => 
                        card.cardType !== 'platinum' && 
                        card.cardType !== 'gold' && 
                        card.cardType !== 'premium'
                    );
                    break;
                case 'inactive':
                    filteredCards = filteredCards.filter(card => card.status === 'inactive');
                    break;
                case 'expired':
                    filteredCards = filteredCards.filter(card => new Date(card.expiryDate) < currentDate);
                    break;
            }
        }
        
        // فلترة حسب نص البحث
        if (searchText) {
            const searchLower = searchText.toLowerCase();
            filteredCards = filteredCards.filter(card => 
                card.investorName.toLowerCase().includes(searchLower) ||
                card.cardNumber.replace(/\s/g, '').includes(searchLower) ||
                (card.investorPhone && card.investorPhone.includes(searchLower))
            );
        }
        
        // ترتيب البطاقات
        const sortType = sortOrders[type] || 'recent';
        
        switch (sortType) {
            case 'recent':
                filteredCards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'name':
                filteredCards.sort((a, b) => a.investorName.localeCompare(b.investorName));
                break;
            case 'expiry':
                filteredCards.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
                break;
        }
        
        const container = document.querySelector(containerSelector);
        const noCardsMessage = document.getElementById(`no-${type === 'all' ? '' : type + '-'}cards-message`);
        
        if (!container) return;
        
        // مسح المحتوى الحالي
        container.innerHTML = '';
        
        // إظهار رسالة إذا لم تكن هناك بطاقات
        if (filteredCards.length === 0) {
            if (noCardsMessage) {
                noCardsMessage.style.display = 'block';
            } else {
                container.innerHTML = '<div class="text-center">لا توجد بطاقات</div>';
            }
            return;
        } else if (noCardsMessage) {
            noCardsMessage.style.display = 'none';
        }
        
        // إضافة البطاقات
        filteredCards.forEach(card => {
            const isExpired = new Date(card.expiryDate) < currentDate;
            const isActive = card.status === 'active';
            
            const cardElement = document.createElement('div');
            cardElement.className = 'card-preview';
            cardElement.setAttribute('data-card-id', card.id);
            
            // تحديد أنماط البطاقة حسب النوع
            let cardStyle = '';
            let textColor = '#ffffff';
            let cardBrandText = 'MASTERCARD';
            
            switch (card.cardType) {
                case 'platinum':
                    cardStyle = `background-color: ${CARD_TYPES.platinum.color};`;
                    textColor = CARD_TYPES.platinum.textColor;
                    cardBrandText = 'بلاتينية';
                    break;
                case 'gold':
                    cardStyle = `background-color: ${CARD_TYPES.gold.color};`;
                    textColor = CARD_TYPES.gold.textColor;
                    cardBrandText = 'ذهبية';
                    break;
                case 'premium':
                    cardStyle = `background-color: ${CARD_TYPES.premium.color};`;
                    textColor = CARD_TYPES.premium.textColor;
                    cardBrandText = 'بريميوم';
                    break;
                case 'diamond':
                    cardStyle = `background-color: ${CARD_TYPES.diamond.color};`;
                    textColor = CARD_TYPES.diamond.textColor;
                    cardBrandText = 'ماسية';
                    break;
                case 'islamic':
                    cardStyle = `background-color: ${CARD_TYPES.islamic.color};`;
                    textColor = CARD_TYPES.islamic.textColor;
                    cardBrandText = 'إسلامية';
                    break;
                case 'custom':
                    if (card.customColors) {
                        cardStyle = `background-color: ${card.customColors.cardColor};`;
                        textColor = card.customColors.textColor;
                    } else {
                        cardStyle = `background-color: ${CARD_TYPES.custom.color};`;
                        textColor = CARD_TYPES.custom.textColor;
                    }
                    cardBrandText = 'مخصصة';
                    break;
            }
            
            cardElement.style = cardStyle;
            
            const expiryMonth = new Date(card.expiryDate).getMonth() + 1;
            const expiryYear = new Date(card.expiryDate).getFullYear().toString().slice(2);
            const expiryFormatted = `${expiryMonth}/${expiryYear}`;
            
            cardElement.innerHTML = `
                <div class="card-brand" style="color: ${textColor};">${cardBrandText}</div>
                <div class="card-logo">
                    <div class="card-logo-circle red"></div>
                    <div class="card-logo-circle yellow"></div>
                </div>
                
                ${card.features?.enableChip !== false ? `
                <div class="card-chip">
                    <div class="chip-line"></div>
                    <div class="chip-line"></div>
                    <div class="chip-line"></div>
                    <div class="chip-line"></div>
                    <div class="chip-line"></div>
                    <div class="chip-line"></div>
                    <div class="chip-line"></div>
                </div>
                ` : ''}
                
                ${card.features?.enableHologram !== false ? `<div class="card-hologram"></div>` : ''}
                
                ${card.features?.enableQrCode !== false ? `
                <div class="card-qrcode">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${card.id}" alt="QR Code">
                </div>
                ` : ''}
                
                <div class="card-number" style="color: ${textColor};">${card.cardNumber.slice(-8).padStart(16, 'X')}</div>
                <div class="card-details">
                    <div class="card-validity" style="color: ${textColor};">
                        <div class="card-valid-text">VALID</div>
                        <div>${expiryFormatted}</div>
                    </div>
                    <div class="card-name" style="color: ${textColor};">${card.investorName}</div>
                </div>
            `;
            
            // إضافة فئة للبطاقات المنتهية أو غير النشطة
            if (isExpired || !isActive) {
                cardElement.style.opacity = '0.7';
                cardElement.style.filter = 'grayscale(0.5)';
                
                // إضافة علامة منتهية أو موقوفة
                const badge = document.createElement('div');
                badge.style.position = 'absolute';
                badge.style.top = '10px';
                badge.style.right = '10px';
                badge.style.background = isActive ? '#e74c3c' : '#f39c12';
                badge.style.color = 'white';
                badge.style.padding = '2px 6px';
                badge.style.borderRadius = '3px';
                badge.style.fontSize = '8px';
                badge.style.zIndex = '10';
                badge.textContent = isActive ? 'منتهية' : 'موقوفة';
                cardElement.appendChild(badge);
            }
            
            container.appendChild(cardElement);
        });
    }
    
    // عرض تفاصيل البطاقة
    function showCardDetails(cardId) {
        console.log(`عرض تفاصيل البطاقة: ${cardId}`);
        
        // البحث عن البطاقة
        const card = cards.find(c => c.id === cardId);
        if (!card) {
            alert('لم يتم العثور على البطاقة');
            return;
        }
        
        // حفظ معرف البطاقة الحالية
        currentCardId = cardId;
        
        // البحث عن المستثمر
        const investor = investors.find(inv => inv.id === card.investorId);
        
        // إضافة نشاط المشاهدة
        addActivity(cardId, 'view');
        
        // التنقل إلى صفحة تفاصيل البطاقة
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        const cardDetailsPage = document.getElementById('card-details-page');
        if (!cardDetailsPage) return;
        
        cardDetailsPage.classList.add('active');
        
        // إزالة الفئة النشطة من جميع الروابط في القائمة
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // تحديث العنوان في شريط العنوان
        const pageTitle = cardDetailsPage.querySelector('.page-title');
        if (pageTitle) {
            pageTitle.textContent = `بطاقة ${card.investorName}`;
        }
        
        // الحصول على حاويات التفاصيل
        const cardDetailsContainer = document.getElementById('card-details-container');
        const investorDetailsContainer = document.getElementById('investor-details-container');
        const cardActivitiesContainer = document.getElementById('card-activities-container');
        
        if (!cardDetailsContainer || !investorDetailsContainer || !cardActivitiesContainer) return;
        
        // تحديد أنماط البطاقة حسب النوع
        let cardStyle = '';
        let textColor = '#ffffff';
        let cardBrandText = 'MASTERCARD';
        let chipColor = '#FFD700';
        
        switch (card.cardType) {
            case 'platinum':
                cardStyle = `background-color: ${CARD_TYPES.platinum.color};`;
                textColor = CARD_TYPES.platinum.textColor;
                chipColor = CARD_TYPES.platinum.chipColor;
                cardBrandText = 'بلاتينية';
                break;
            case 'gold':
                cardStyle = `background-color: ${CARD_TYPES.gold.color};`;
                textColor = CARD_TYPES.gold.textColor;
                chipColor = CARD_TYPES.gold.chipColor;
                cardBrandText = 'ذهبية';
                break;
            case 'premium':
                cardStyle = `background-color: ${CARD_TYPES.premium.color};`;
                textColor = CARD_TYPES.premium.textColor;
                chipColor = CARD_TYPES.premium.chipColor;
                cardBrandText = 'بريميوم';
                break;
            case 'diamond':
                cardStyle = `background-color: ${CARD_TYPES.diamond.color};`;
                textColor = CARD_TYPES.diamond.textColor;
                chipColor = CARD_TYPES.diamond.chipColor;
                cardBrandText = 'ماسية';
                break;
            case 'islamic':
                cardStyle = `background-color: ${CARD_TYPES.islamic.color};`;
                textColor = CARD_TYPES.islamic.textColor;
                chipColor = CARD_TYPES.islamic.chipColor;
                cardBrandText = 'إسلامية';
                break;
            case 'custom':
                if (card.customColors) {
                    cardStyle = `background-color: ${card.customColors.cardColor};`;
                    textColor = card.customColors.textColor;
                    chipColor = card.customColors.chipColor;
                } else {
                    cardStyle = `background-color: ${CARD_TYPES.custom.color};`;
                    textColor = CARD_TYPES.custom.textColor;
                    chipColor = CARD_TYPES.custom.chipColor;
                }
                cardBrandText = 'مخصصة';
                break;
        }
        
        const expiryMonth = new Date(card.expiryDate).getMonth() + 1;
        const expiryYear = new Date(card.expiryDate).getFullYear().toString().slice(2);
        const expiryFormatted = `${expiryMonth}/${expiryYear}`;
        const isExpired = new Date(card.expiryDate) < new Date();
        const isActive = card.status === 'active';
        
        // ملء معلومات البطاقة
        cardDetailsContainer.innerHTML = `
            <div class="investor-card" style="${cardStyle}" id="card-for-print">
                <div class="card-inner">
                    <div class="card-front">
                        <div class="card-brand" style="color: ${textColor};">${cardBrandText}</div>
                        <div class="card-logo">
                            <div class="card-logo-circle red"></div>
                            <div class="card-logo-circle yellow"></div>
                        </div>
                        
                        ${card.features?.enableChip !== false ? `
                        <div class="card-chip" style="background: linear-gradient(135deg, ${chipColor}88 0%, ${chipColor} 50%, ${chipColor}88 100%);">
                            <div class="chip-line"></div>
                            <div class="chip-line"></div>
                            <div class="chip-line"></div>
                            <div class="chip-line"></div>
                            <div class="chip-line"></div>
                            <div class="chip-line"></div>
                            <div class="chip-line"></div>
                        </div>
                        ` : ''}
                        
                        ${card.features?.enableHologram !== false ? `<div class="card-hologram"></div>` : ''}
                        
                        ${card.features?.enableQrCode !== false ? `
                        <div class="card-qrcode">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${card.id}" alt="QR Code">
                        </div>
                        ` : ''}
                        
                        <div class="card-number" style="color: ${textColor};">${card.cardNumber}</div>
                        <div class="card-details">
                            <div class="card-validity" style="color: ${textColor};">
                                <div class="card-valid-text">VALID THRU</div>
                                <div>${expiryFormatted}</div>
                            </div>
                            <div class="card-name" style="color: ${textColor};">${card.investorName}</div>
                        </div>
                        
                        ${isExpired || !isActive ? `
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); border: 5px solid #e74c3c; padding: 10px; font-size: 1.5rem; color: #e74c3c; font-weight: bold; border-radius: 10px; background-color: rgba(255,255,255,0.3);">
                            ${isActive ? 'منتهية الصلاحية' : 'موقوفة'}
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="card-back" style="${cardStyle}">
                        <div class="card-back-strip"></div>
                        <div class="card-cvv">CVV: ${card.cvv || '***'}</div>
                        <div class="card-issuer-info" style="color: ${textColor};">
                            نظام الاستثمار المتكامل<br>
                            بطاقة المستثمر<br>
                            ${card.investorPhone ? card.investorPhone : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // تخزين معرف البطاقة في أزرار التحكم
        document.getElementById('print-card-btn').setAttribute('data-card-id', card.id);
        document.getElementById('share-card-btn').setAttribute('data-card-id', card.id);
        document.getElementById('edit-card-btn').setAttribute('data-card-id', card.id);
        document.getElementById('deactivate-card-btn').setAttribute('data-card-id', card.id);
        
        // تحديث نص زر التعطيل بناءً على حالة البطاقة
        const deactivateBtn = document.getElementById('deactivate-card-btn');
        if (card.status === 'active') {
            deactivateBtn.innerHTML = '<i class="fas fa-times-circle"></i><span>إيقاف البطاقة</span>';
            deactivateBtn.classList.add('danger');
            deactivateBtn.classList.remove('primary');
        } else {
            deactivateBtn.innerHTML = '<i class="fas fa-check-circle"></i><span>تفعيل البطاقة</span>';
            deactivateBtn.classList.add('primary');
            deactivateBtn.classList.remove('danger');
        }
        
        // ملء معلومات المستثمر
        let investorDetails = '';
        
        if (investor) {
            // معلومات المستثمر الأساسية
            investorDetails += `
                <div class="investor-detail-item">
                    <div class="investor-detail-label">الاسم</div>
                    <div class="investor-detail-value">${investor.name}</div>
                </div>
                <div class="investor-detail-item">
                    <div class="investor-detail-label">رقم الهاتف</div>
                    <div class="investor-detail-value">${investor.phone || '-'}</div>
                </div>
                <div class="investor-detail-item">
                    <div class="investor-detail-label">العنوان</div>
                    <div class="investor-detail-value">${investor.address || '-'}</div>
                </div>
                <div class="investor-detail-item">
                    <div class="investor-detail-label">رقم البطاقة الشخصية</div>
                    <div class="investor-detail-value">${investor.cardNumber || '-'}</div>
                </div>
                <div class="investor-detail-item">
                    <div class="investor-detail-label">تاريخ الانضمام</div>
                    <div class="investor-detail-value">${formatDate(investor.joinDate || investor.createdAt || '-')}</div>
                </div>
                <div class="investor-detail-item">
                    <div class="investor-detail-label">إجمالي الاستثمار</div>
                    <div class="investor-detail-value">${formatCurrency(investor.amount)}</div>
                </div>
            `;
            
            // معلومات الاستثمارات والأرباح
            const totalProfit = calculateInvestorProfit(investor.id);
            
            investorDetails += `
                <div class="investor-detail-item">
                    <div class="investor-detail-label">الربح الشهري المتوقع</div>
                    <div class="investor-detail-value">${formatCurrency(totalProfit)}</div>
                </div>
            `;
            
            // معلومات البطاقة
            investorDetails += `
                <div class="investor-detail-item">
                    <div class="investor-detail-label">نوع البطاقة</div>
                    <div class="investor-detail-value">${CARD_TYPES[card.cardType]?.name || card.cardType}</div>
                </div>
                <div class="investor-detail-item">
                    <div class="investor-detail-label">تاريخ إصدار البطاقة</div>
                    <div class="investor-detail-value">${formatDate(card.createdAt)}</div>
                </div>
                <div class="investor-detail-item">
                    <div class="investor-detail-label">تاريخ انتهاء الصلاحية</div>
                    <div class="investor-detail-value">${formatDate(card.expiryDate)}</div>
                </div>
                <div class="investor-detail-item">
                    <div class="investor-detail-label">حالة البطاقة</div>
                    <div class="investor-detail-value">
                        ${getCardStatusBadge(card)}
                    </div>
                </div>
            `;
            
            // ميزات البطاقة
            investorDetails += `
                <div class="investor-detail-item">
                    <div class="investor-detail-label">ميزات البطاقة</div>
                    <div class="investor-detail-value">
                        <div class="flex flex-wrap gap-10">
                            ${card.features?.enableQrCode !== false ? '<span class="badge badge-success">رمز QR</span>' : ''}
                            ${card.features?.enableHologram !== false ? '<span class="badge badge-info">هولوغرام</span>' : ''}
                            ${card.features?.enableChip !== false ? '<span class="badge badge-primary">شريحة</span>' : ''}
                            ${card.features?.enablePin ? '<span class="badge badge-warning">رمز PIN</span>' : ''}
                        </div>
                    </div>
                </div>
            `;
            
            // القيمة المضافة للبطاقة
            const cardBenefits = CARD_TYPES[card.cardType]?.benefits || [];
            if (cardBenefits.length > 0) {
                investorDetails += `
                    <div class="investor-detail-item">
                        <div class="investor-detail-label">مزايا البطاقة</div>
                        <div class="investor-detail-value">
                            <ul style="padding-right: 20px; margin: 0;">
                                ${cardBenefits.map(benefit => `<li>${benefit}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `;
            }
            
            // ملخص العمليات
            investorDetails += `
                <div class="transactions-summary">
                    <h4>آخر العمليات</h4>
                    <div class="transaction-list">
                        <table>
                            <thead>
                                <tr>
                                    <th>التاريخ</th>
                                    <th>نوع العملية</th>
                                    <th>المبلغ</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            // البحث عن عمليات المستثمر
            const investorTransactions = window.transactions ? window.transactions.filter(tr => tr.investorId === investor.id) : [];
            
            if (investorTransactions.length > 0) {
                // عرض آخر 5 عمليات
                const recentTransactions = investorTransactions
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 5);
                
                recentTransactions.forEach(transaction => {
                    investorDetails += `
                        <tr>
                            <td>${formatDate(transaction.date)}</td>
                            <td>${getTransactionTypeText(transaction.type)}</td>
                            <td>${formatCurrency(transaction.amount)}</td>
                        </tr>
                    `;
                });
            } else {
                investorDetails += `
                    <tr>
                        <td colspan="3" class="text-center">لا توجد عمليات</td>
                    </tr>
                `;
            }
            
            investorDetails += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } else {
            investorDetails = '<div class="text-center">لم يتم العثور على معلومات المستثمر</div>';
        }
        
        // ملء حاوية معلومات المستثمر
        investorDetailsContainer.innerHTML = investorDetails;
        
        // ملء سجل أنشطة البطاقة
        const cardActivities = activities.filter(activity => activity.cardId === card.id);
        let activitiesHTML = '';
        
        if (cardActivities.length > 0) {
            cardActivities.forEach(activity => {
                activitiesHTML += `
                    <div class="activity-list-item">
                        <div class="activity-icon">
                            <i class="${getActivityIcon(activity.action)}"></i>
                        </div>
                        <div class="activity-details">
                            <div class="activity-title">${getActivityText(activity.action)}</div>
                            <div class="activity-meta">${formatDateTime(activity.timestamp)}</div>
                        </div>
                    </div>
                `;
            });
        } else {
            activitiesHTML = '<div class="text-center">لا توجد أنشطة مسجلة</div>';
        }
        
        cardActivitiesContainer.innerHTML = activitiesHTML;
    }
    
    // تنسيق التاريخ
    function formatDate(dateString) {
        if (!dateString || dateString === '-') return '-';
        
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
        } catch {
            return dateString;
        }
    }
    
    // تنسيق التاريخ والوقت
    function formatDateTime(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        } catch {
            return dateString;
        }
    }
    
    // تنسيق العملة
    function formatCurrency(amount) {
        if (amount === undefined || amount === null) return '-';
        
        try {
            // التحقق من وجود دالة تنسيق العملة في التطبيق الرئيسي
            if (typeof window.formatCurrency === 'function') {
                return window.formatCurrency(amount);
            }
            
            // تنسيق افتراضي
            const formatter = new Intl.NumberFormat('ar-IQ', {
                style: 'currency',
                currency: 'IQD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
            
            return formatter.format(amount);
        } catch {
            return `${amount} دينار`;
        }
    }
    
    // الحصول على نص نوع العملية
    function getTransactionTypeText(type) {
        switch (type) {
            case 'deposit': return 'إيداع';
            case 'withdraw': return 'سحب';
            case 'profit': return 'ربح';
            case 'transfer': return 'تحويل';
            default: return type;
        }
    }
    
    // الحصول على علامة حالة البطاقة
    function getCardStatusBadge(card) {
        const isExpired = new Date(card.expiryDate) < new Date();
        const isActive = card.status === 'active';
        
        if (!isActive) {
            return '<span class="badge badge-warning">موقوفة</span>';
        } else if (isExpired) {
            return '<span class="badge badge-danger">منتهية الصلاحية</span>';
        } else {
            return '<span class="badge badge-success">نشطة</span>';
        }
    }
    
    // الحصول على أيقونة النشاط
    function getActivityIcon(action) {
        switch (action) {
            case 'create': return 'fas fa-plus-circle';
            case 'edit': return 'fas fa-edit';
            case 'deactivate': return 'fas fa-times-circle';
            case 'activate': return 'fas fa-check-circle';
            case 'renew': return 'fas fa-sync-alt';
            case 'scan': return 'fas fa-qrcode';
            case 'view': return 'fas fa-eye';
            default: return 'fas fa-info-circle';
        }
    }
    
    // الحصول على نص النشاط
    function getActivityText(action) {
        switch (action) {
            case 'create': return 'إنشاء البطاقة';
            case 'edit': return 'تعديل البطاقة';
            case 'deactivate': return 'إيقاف البطاقة';
            case 'activate': return 'تفعيل البطاقة';
            case 'renew': return 'تجديد البطاقة';
            case 'scan': return 'مسح البطاقة';
            case 'view': return 'مشاهدة البطاقة';
            default: return 'نشاط آخر';
        }
    }
    
    // حساب الربح الشهري للمستثمر
    function calculateInvestorProfit(investorId) {
        // البحث عن المستثمر
        const investor = investors.find(inv => inv.id === investorId);
        if (!investor) return 0;
        
        // حساب الربح الشهري بناءً على البيانات الموجودة في التطبيق الرئيسي
        // إذا كانت دالة calculateMonthlyProfits موجودة، نستخدمها
        if (typeof window.calculateMonthlyProfits === 'function') {
            return window.calculateMonthlyProfits(investorId);
        }
        
        // وإلا نحاول حساب الربح بناءً على البيانات المتاحة
        let totalProfit = 0;
        
        if (investor.investments && Array.isArray(investor.investments)) {
            investor.investments.forEach(investment => {
                // حساب الربح بناءً على نسبة الفائدة في الإعدادات
                const interestRate = window.settings ? window.settings.interestRate / 100 : 0.175; // نسبة افتراضية 17.5%
                totalProfit += investment.amount * interestRate;
            });
        } else if (investor.amount) {
            // إذا لم تكن هناك استثمارات محددة، نستخدم المبلغ الإجمالي
            const interestRate = window.settings ? window.settings.interestRate / 100 : 0.175;
            totalProfit = investor.amount * interestRate;
        }
        
        return totalProfit;
    }
    
    // طباعة البطاقة
    function printCard(cardId) {
        // البحث عن البطاقة
        const card = cards.find(c => c.id === cardId);
        if (!card) return;
        
        // إنشاء نافذة الطباعة
        const printWindow = window.open('', '_blank');
        
        // تحديد أنماط البطاقة حسب النوع
        let cardStyle = '';
        let textColor = '#ffffff';
        let cardBrandText = 'MASTERCARD';
        let chipColor = '#FFD700';
        
        switch (card.cardType) {
            case 'platinum':
                cardStyle = `background-color: ${CARD_TYPES.platinum.color};`;
                textColor = CARD_TYPES.platinum.textColor;
                chipColor = CARD_TYPES.platinum.chipColor;
                cardBrandText = 'بلاتينية';
                break;
            case 'gold':
                cardStyle = `background-color: ${CARD_TYPES.gold.color};`;
                textColor = CARD_TYPES.gold.textColor;
                chipColor = CARD_TYPES.gold.chipColor;
                cardBrandText = 'ذهبية';
                break;
            case 'premium':
                cardStyle = `background-color: ${CARD_TYPES.premium.color};`;
                textColor = CARD_TYPES.premium.textColor;
                chipColor = CARD_TYPES.premium.chipColor;
                cardBrandText = 'بريميوم';
                break;
            case 'diamond':
                cardStyle = `background-color: ${CARD_TYPES.diamond.color};`;
                textColor = CARD_TYPES.diamond.textColor;
                chipColor = CARD_TYPES.diamond.chipColor;
                cardBrandText = 'ماسية';
                break;
            case 'islamic':
                cardStyle = `background-color: ${CARD_TYPES.islamic.color};`;
                textColor = CARD_TYPES.islamic.textColor;
                chipColor = CARD_TYPES.islamic.chipColor;
                cardBrandText = 'إسلامية';
                break;
            case 'custom':
                if (card.customColors) {
                    cardStyle = `background-color: ${card.customColors.cardColor};`;
                    textColor = card.customColors.textColor;
                    chipColor = card.customColors.chipColor;
                } else {
                    cardStyle = `background-color: ${CARD_TYPES.custom.color};`;
                    textColor = CARD_TYPES.custom.textColor;
                    chipColor = CARD_TYPES.custom.chipColor;
                }
                cardBrandText = 'مخصصة';
                break;
        }
        
        const expiryMonth = new Date(card.expiryDate).getMonth() + 1;
        const expiryYear = new Date(card.expiryDate).getFullYear().toString().slice(2);
        const expiryFormatted = `${expiryMonth}/${expiryYear}`;
        
        // إنشاء محتوى نافذة الطباعة
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>طباعة بطاقة المستثمر</title>
                <style>
                    @media print {
                        @page {
                            size: ${settings.cardPrintSize === 'standard' ? '100mm 60mm' : '85.6mm 54mm'};
                            margin: 0;
                        }
                    }
                    
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #f8f9fa;
                    }
                    
                    .print-instructions {
                        margin-bottom: 20px;
                        text-align: center;
                    }
                    
                    .print-button {
                        padding: 10px 20px;
                        background-color: #3498db;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        margin-bottom: 20px;
                    }
                    
                    .print-options {
                        display: flex;
                        justify-content: center;
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    
                    .print-option {
                        padding: 8px 15px;
                        background-color: #f8f9fa;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        cursor: pointer;
                    }
                    
                    .print-option.active {
                        background-color: #3498db;
                        color: white;
                    }
                    
                    .card-container {
                        width: ${settings.cardPrintSize === 'standard' ? '390px' : '330px'};
                        height: ${settings.cardPrintSize === 'standard' ? '245px' : '210px'};
                        overflow: hidden;
                        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
                        border-radius: 15px;
                        transform-style: preserve-3d;
                        perspective: 1000px;
                    }
                    
                    .card-inner {
                        width: 100%;
                        height: 100%;
                        position: relative;
                        transform-style: preserve-3d;
                        transition: transform 0.6s;
                    }
                    
                    .card-inner.flipped {
                        transform: rotateY(180deg);
                    }
                    
                    .card-front, .card-back {
                        width: 100%;
                        height: 100%;
                        position: absolute;
                        top: 0;
                        left: 0;
                        backface-visibility: hidden;
                        ${cardStyle}
                    }
                    
                    .card-back {
                        transform: rotateY(180deg);
                    }
                    
                    .card-brand {
                        position: absolute;
                        top: 20px;
                        right: 25px;
                        font-size: 1.4rem;
                        font-weight: 700;
                        letter-spacing: 1px;
                        color: ${textColor};
                    }
                    
                    .card-logo {
                        position: absolute;
                        top: 20px;
                        left: 25px;
                        display: flex;
                        gap: 5px;
                    }
                    
                    .card-logo-circle {
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                    }
                    
                    .card-logo-circle.red {
                        background: #eb001b;
                    }
                    
                    .card-logo-circle.yellow {
                        background: #f79e1b;
                        opacity: 0.8;
                        margin-right: -15px;
                    }
                    
                    .card-chip {
                        position: absolute;
                        top: 80px;
                        right: 50px;
                        width: 50px;
                        height: 40px;
                        background: linear-gradient(135deg, ${chipColor}88 0%, ${chipColor} 50%, ${chipColor}88 100%);
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
                        opacity: 0.7;
                    }
                    
                    .card-qrcode {
                        width: 80px;
                        height: 80px;
                        background-color: #f8f9fa;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-top: 15px;
                        margin-left: auto;
                        overflow: hidden;
                    }
                    
                    .card-qrcode img {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                    }
                    
                    .card-number {
                        position: absolute;
                        bottom: 80px;
                        width: 100%;
                        left: 0;
                        padding: 0 25px;
                        font-size: 1.5rem;
                        letter-spacing: 2px;
                        text-align: center;
                        color: ${textColor};
                        font-family: 'Courier New', monospace;
                    }
                    
                    .card-details {
                        position: absolute;
                        bottom: 25px;
                        width: 100%;
                        left: 0;
                        padding: 0 25px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                    }
                    
                    .card-validity {
                        font-size: 0.9rem;
                        display: flex;
                        flex-direction: column;
                        color: ${textColor};
                    }
                    
                    .card-valid-text {
                        font-size: 0.7rem;
                        opacity: 0.7;
                        margin-bottom: 3px;
                    }
                    
                    .card-name {
                        font-size: 1rem;
                        text-align: right;
                        text-transform: uppercase;
                        color: ${textColor};
                    }
                    
                    .card-back-strip {
                        width: 100%;
                        height: 40px;
                        background-color: rgba(0, 0, 0, 0.8);
                        margin: 20px 0;
                        position: relative;
                    }
                    
                    .card-cvv {
                        position: absolute;
                        right: 20px;
                        bottom: -25px;
                        background-color: white;
                        color: black;
                        padding: 5px 15px;
                        border-radius: 4px;
                        font-size: 0.9rem;
                        font-family: 'Courier New', monospace;
                    }
                    
                    .card-issuer-info {
                        margin-top: 70px;
                        font-size: 0.8rem;
                        text-align: center;
                        opacity: 0.7;
                        color: ${textColor};
                    }
                    
                    @media print {
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="no-print print-instructions">
                    <h2>طباعة بطاقة المستثمر</h2>
                    <p>اضبط إعدادات الطباعة واضغط على زر الطباعة لطباعة البطاقة.</p>
                    
                    <div class="print-options">
                        <div class="print-option active" data-show="front">الوجه الأمامي</div>
                        <div class="print-option" data-show="back">الوجه الخلفي</div>
                        <div class="print-option" data-show="both">الوجهان</div>
                    </div>
                    
                    <button class="print-button" id="print-btn">طباعة</button>
                </div>
                
                <div class="card-container">
                    <div class="card-inner" id="card-inner">
                        <div class="card-front">
                            <div class="card-brand">${cardBrandText}</div>
                            <div class="card-logo">
                                <div class="card-logo-circle red"></div>
                                <div class="card-logo-circle yellow"></div>
                            </div>
                            
                            ${card.features?.enableChip !== false ? `
                            <div class="card-chip">
                                <div class="chip-line"></div>
                                <div class="chip-line"></div>
                                <div class="chip-line"></div>
                                <div class="chip-line"></div>
                                <div class="chip-line"></div>
                                <div class="chip-line"></div>
                                <div class="chip-line"></div>
                            </div>
                            ` : ''}
                            
                            ${card.features?.enableHologram !== false ? `<div class="card-hologram"></div>` : ''}
                            
                            ${card.features?.enableQrCode !== false ? `
                            <div class="card-qrcode">
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${card.id}" alt="QR Code">
                            </div>
                            ` : ''}
                            
                            <div class="card-number">${card.cardNumber}</div>
                            <div class="card-details">
                                <div class="card-validity">
                                    <div class="card-valid-text">VALID THRU</div>
                                    <div>${expiryFormatted}</div>
                                </div>
                                <div class="card-name">${card.investorName}</div>
                            </div>
                        </div>
                        
                        <div class="card-back">
                            <div class="card-back-strip"></div>
                            <div class="card-cvv">CVV: ${card.cvv || '***'}</div>
                            <div class="card-issuer-info">
                                نظام الاستثمار المتكامل<br>
                                بطاقة المستثمر<br>
                                ${card.investorPhone ? card.investorPhone : ''}
                            </div>
                        </div>
                    </div>
                </div>
                
                <script>
                    // خيارات الطباعة
                    document.querySelectorAll('.print-option').forEach(option => {
                        option.addEventListener('click', function() {
                            // إزالة الفئة النشطة من جميع الخيارات
                            document.querySelectorAll('.print-option').forEach(opt => {
                                opt.classList.remove('active');
                            });
                            
                            // إضافة الفئة النشطة للخيار المحدد
                            this.classList.add('active');
                            
                            // تحديث البطاقة حسب الخيار
                            const showOption = this.getAttribute('data-show');
                            const cardInner = document.getElementById('card-inner');
                            
                            if (showOption === 'front') {
                                cardInner.classList.remove('flipped');
                            } else if (showOption === 'back') {
                                cardInner.classList.add('flipped');
                            } else {
                                // للطباعة على الوجهين، سيتم طباعة نسختين
                                cardInner.classList.remove('flipped');
                            }
                        });
                    });
                    
                    // زر الطباعة
                    document.getElementById('print-btn').addEventListener('click', function() {
                        const showOption = document.querySelector('.print-option.active').getAttribute('data-show');
                        
                        if (showOption === 'both') {
                            // طباعة الوجهين
                            const originalHTML = document.body.innerHTML;
                            
                            // طباعة الوجه الأمامي
                            document.getElementById('card-inner').classList.remove('flipped');
                            setTimeout(() => {
                                window.print();
                                
                                // انتظار قليلاً ثم طباعة الوجه الخلفي
                                setTimeout(() => {
                                    document.getElementById('card-inner').classList.add('flipped');
                                    setTimeout(() => {
                                        window.print();
                                    }, 500);
                                }, 1000);
                            }, 500);
                        } else {
                            // طباعة وجه واحد
                            window.print();
                        }
                    });
                    
                    // طباعة تلقائية بعد التحميل مباشرة
                    window.addEventListener('load', function() {
                        // تأخير الطباعة قليلاً للتأكد من تحميل الصفحة بشكل كامل
                        setTimeout(function() {
                            window.print();
                        }, 1000);
                    });
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        // إضافة نشاط الطباعة
        addActivity(cardId, 'print');
        
        return true;
    }
    
    // مشاركة البطاقة
    function shareCard(cardId) {
        // البحث عن البطاقة
        const card = cards.find(c => c.id === cardId);
        if (!card) return;
        
        // إنشاء نافذة منبثقة للمشاركة
        const container = document.createElement('div');
        container.className = 'modal-overlay active';
        container.id = 'share-card-modal';
        
        // تحديد بيانات البطاقة للمشاركة
        const cardData = {
            name: card.investorName,
            phone: card.investorPhone,
            cardNumber: card.cardNumber.slice(-8).padStart(16, 'X'), // إخفاء جزء من الرقم
            expiry: `${new Date(card.expiryDate).getMonth() + 1}/${new Date(card.expiryDate).getFullYear().toString().slice(2)}`,
            type: CARD_TYPES[card.cardType]?.name || card.cardType
        };
        
        container.innerHTML = `
            <div class="modal animate__animated animate__fadeInUp">
                <div class="modal-header">
                    <h3 class="modal-title">مشاركة بطاقة</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="text-center mb-20">
                        <div style="margin: 0 auto; width: 150px; height: 150px; background-color: white; padding: 10px; border-radius: 10px;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify(cardData))}" alt="QR Code" style="width: 100%; height: 100%;">
                        </div>
                        <p class="mt-10">امسح هذا الكود لمشاركة بيانات البطاقة</p>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">نص للنسخ</label>
                        <textarea class="form-input" rows="4" id="share-text" readonly>اسم المستثمر: ${card.investorName}
رقم البطاقة: ${card.cardNumber.slice(-8).padStart(16, 'X')}
تاريخ الانتهاء: ${new Date(card.expiryDate).getMonth() + 1}/${new Date(card.expiryDate).getFullYear().toString().slice(2)}
نوع البطاقة: ${CARD_TYPES[card.cardType]?.name || card.cardType}</textarea>
                    </div>
                    
                    <div class="flex justify-center gap-10 mt-20">
                        <button class="btn btn-primary" id="copy-text-btn">
                            <i class="fas fa-copy"></i>
                            <span>نسخ النص</span>
                        </button>
                        
                        <button class="btn btn-success" id="download-qr-btn">
                            <i class="fas fa-download"></i>
                            <span>تنزيل QR</span>
                        </button>
                        
                        <button class="btn btn-outline" id="send-email-btn">
                            <i class="fas fa-envelope"></i>
                            <span>إرسال بالبريد</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // إضافة النافذة إلى الصفحة
        document.body.appendChild(container);
        
        // إضافة مستمعي الأحداث
        const closeButtons = container.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                container.remove();
            });
        });
        
        // مستمع لزر نسخ النص
        const copyTextBtn = container.querySelector('#copy-text-btn');
        if (copyTextBtn) {
            copyTextBtn.addEventListener('click', function() {
                const textarea = document.getElementById('share-text');
                textarea.select();
                document.execCommand('copy');
                
                // تغيير النص للتأكيد
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i><span>تم النسخ</span>';
                
                // إعادة النص الأصلي بعد ثانيتين
                setTimeout(() => {
                    this.innerHTML = originalText;
                }, 2000);
            });
        }
        
        // مستمع لزر تنزيل QR
        const downloadQrBtn = container.querySelector('#download-qr-btn');
        if (downloadQrBtn) {
            downloadQrBtn.addEventListener('click', function() {
                const qrImage = container.querySelector('img');
                if (qrImage && qrImage.src) {
                    const link = document.createElement('a');
                    link.href = qrImage.src;
                    link.download = `بطاقة_${card.investorName.replace(/\s+/g, '_')}.png`;
                    link.click();
                }
            });
        }
        
        // مستمع لزر إرسال البريد
        const sendEmailBtn = container.querySelector('#send-email-btn');
        if (sendEmailBtn) {
            sendEmailBtn.addEventListener('click', function() {
                const subject = `بطاقة المستثمر - ${card.investorName}`;
                const body = document.getElementById('share-text').value;
                
                window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            });
        }
        
        // إضافة نشاط المشاركة
        addActivity(cardId, 'share');
        
        return true;
    }
    
    // تعديل البطاقة
    function editCard(cardId) {
        // البحث عن البطاقة
        const card = cards.find(c => c.id === cardId);
        if (!card) return;
        
        // إنشاء نافذة تعديل البطاقة
        const container = document.createElement('div');
        container.className = 'modal-overlay active';
        container.id = 'edit-card-modal';
        
        // إعداد قائمة أنواع البطاقات
        let cardTypeOptions = '';
        Object.keys(CARD_TYPES).forEach(type => {
            const isSelected = card.cardType === type;
            cardTypeOptions += `
                <label class="card-type-option ${isSelected ? 'selected' : ''}" data-card-type="${type}">
                    <input type="radio" name="edit-card-type" value="${type}" ${isSelected ? 'checked' : ''}>
                    <span>${CARD_TYPES[type].name}</span>
                </label>
            `;
        });
        
        container.innerHTML = `
            <div class="modal animate__animated animate__fadeInUp">
                <div class="modal-header">
                    <h3 class="modal-title">تعديل بطاقة</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="edit-card-form">
                        <div class="form-group">
                            <label class="form-label">رقم البطاقة</label>
                            <input type="text" class="form-input" id="edit-card-number" value="${card.cardNumber}" readonly>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">تاريخ الإنتهاء</label>
                            <input type="date" class="form-input" id="edit-expiry-date" value="${card.expiryDate}" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">نوع البطاقة</label>
                            <div class="card-type-options">
                                ${cardTypeOptions}
                            </div>
                        </div>
                        
                        <div class="form-group ${card.cardType !== 'custom' ? 'hidden' : ''}" id="edit-custom-card-options">
                            <label class="form-label">خيارات البطاقة المخصصة</label>
                            <div class="flex gap-10 flex-wrap">
                                <div style="flex: 1;">
                                    <label class="form-label">لون البطاقة</label>
                                    <input type="color" class="form-input" id="edit-custom-card-color" value="${card.customColors?.cardColor || '#3498db'}">
                                </div>
                                <div style="flex: 1;">
                                    <label class="form-label">لون النص</label>
                                    <input type="color" class="form-input" id="edit-custom-text-color" value="${card.customColors?.textColor || '#ffffff'}">
                                </div>
                                <div style="flex: 1;">
                                    <label class="form-label">لون الشريحة</label>
                                    <input type="color" class="form-input" id="edit-custom-chip-color" value="${card.customColors?.chipColor || '#C0C0C0'}">
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">خيارات متقدمة</label>
                            <div class="flex gap-10 flex-wrap">
                                <div class="form-check">
                                    <input type="checkbox" id="edit-enable-qrcode" ${card.features?.enableQrCode !== false ? 'checked' : ''}>
                                    <label for="edit-enable-qrcode">تفعيل QR Code</label>
                                </div>
                                <div class="form-check">
                                    <input type="checkbox" id="edit-enable-hologram" ${card.features?.enableHologram !== false ? 'checked' : ''}>
                                    <label for="edit-enable-hologram">تفعيل الهولوغرام</label>
                                </div>
                                <div class="form-check">
                                    <input type="checkbox" id="edit-enable-chip" ${card.features?.enableChip !== false ? 'checked' : ''}>
                                    <label for="edit-enable-chip">تفعيل الشريحة</label>
                                </div>
                                <div class="form-check">
                                    <input type="checkbox" id="edit-enable-pin" ${card.features?.enablePin ? 'checked' : ''}>
                                    <label for="edit-enable-pin">تأمين البطاقة برمز PIN</label>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group ${card.features?.enablePin ? '' : 'hidden'}" id="edit-pin-options">
                            <label class="form-label">رمز PIN (4 أرقام)</label>
                            <input type="password" class="form-input" id="edit-card-pin" pattern="[0-9]{4}" minlength="4" maxlength="4" placeholder="أدخل 4 أرقام" value="${card.pin || ''}">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline modal-close-btn">إلغاء</button>
                    <button class="btn btn-primary" id="save-edit-card-btn">حفظ التغييرات</button>
                </div>
            </div>
        `;
        
        // إضافة النافذة إلى الصفحة
        document.body.appendChild(container);
        
        // مستمع لتغيير نوع البطاقة
        const cardTypeRadios = container.querySelectorAll('input[name="edit-card-type"]');
        cardTypeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                // إظهار/إخفاء خيارات البطاقة المخصصة
                const customCardOptions = document.getElementById('edit-custom-card-options');
                if (customCardOptions) {
                    customCardOptions.classList.toggle('hidden', this.value !== 'custom');
                }
                
                // تحديث فئة الخيار المحدد
                container.querySelectorAll('.card-type-option').forEach(option => {
                    option.classList.toggle('selected', option.querySelector('input').checked);
                });
            });
        });
        
        // مستمع لخيار تفعيل PIN
        const enablePinCheckbox = container.querySelector('#edit-enable-pin');
        if (enablePinCheckbox) {
            enablePinCheckbox.addEventListener('change', function() {
                const pinOptions = document.getElementById('edit-pin-options');
                if (pinOptions) {
                    pinOptions.classList.toggle('hidden', !this.checked);
                }
            });
        }
        
        // إضافة مستمعي الأحداث
        const closeButtons = container.querySelectorAll('.modal-close, .modal-close-btn');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                container.remove();
            });
        });
        
        // مستمع حدث حفظ التغييرات
        const saveButton = container.querySelector('#save-edit-card-btn');
        if (saveButton) {
            saveButton.addEventListener('click', function() {
                // الحصول على البيانات المعدلة
                const expiryDate = container.querySelector('#edit-expiry-date').value;
                const cardType = container.querySelector('input[name="edit-card-type"]:checked').value;
                
                // خيارات متقدمة
                const enableQrCode = container.querySelector('#edit-enable-qrcode').checked;
                const enableHologram = container.querySelector('#edit-enable-hologram').checked;
                const enableChip = container.querySelector('#edit-enable-chip').checked;
                const enablePin = container.querySelector('#edit-enable-pin').checked;
                
                // التحقق من التاريخ
                if (!expiryDate) {
                    alert('يرجى إدخال تاريخ انتهاء صالح');
                    return;
                }
                
                // إعدادات المزايا
                const features = {
                    enableQrCode,
                    enableHologram,
                    enableChip,
                    enablePin
                };
                
                // تحديث البطاقة
                card.cardType = cardType;
                card.expiryDate = expiryDate;
                card.features = features;
                
                // تحديث رمز PIN
                if (enablePin) {
                    const pinInput = container.querySelector('#edit-card-pin');
                    const pin = pinInput.value;
                    
                    if (pin && pin.length === 4 && /^\d{4}$/.test(pin)) {
                        card.pin = pin;
                    } else if (!card.pin) {
                        alert('يرجى إدخال رمز PIN مكون من 4 أرقام');
                        return;
                    }
                } else {
                    // إزالة رمز PIN إذا تم إلغاء تفعيله
                    delete card.pin;
                }
                
                // تحديث ألوان البطاقة المخصصة
                if (cardType === 'custom') {
                    card.customColors = {
                        cardColor: container.querySelector('#edit-custom-card-color').value,
                        textColor: container.querySelector('#edit-custom-text-color').value,
                        chipColor: container.querySelector('#edit-custom-chip-color').value
                    };
                }
                
                // إضافة نشاط التعديل
                addActivity(card.id, 'edit', {
                    cardType,
                    expiryDate
                });
                
                // حفظ التغييرات
                saveCardsToLocalStorage();
                saveCardsToFirebase()
                    .then(success => {
                        if (success) {
                            alert('تم تحديث البطاقة بنجاح');
                            
                            // إغلاق النافذة
                            container.remove();
                            
                            // تحديث عرض تفاصيل البطاقة
                            showCardDetails(card.id);
                        } else {
                            alert('حدث خطأ أثناء حفظ التغييرات');
                        }
                    });
            });
        }
        
        return true;
    }
    
    // تغيير حالة البطاقة (تفعيل/إيقاف)
    function toggleCardStatus(cardId) {
        // البحث عن البطاقة
        const card = cards.find(c => c.id === cardId);
        if (!card) return;
        
        if (card.status === 'active') {
            // طلب تأكيد إيقاف البطاقة
            if (confirm('هل أنت متأكد من رغبتك في إيقاف هذه البطاقة؟')) {
                card.status = 'inactive';
                
                // إضافة نشاط التعطيل
                addActivity(cardId, 'deactivate');
                
                // حفظ التغييرات
                saveCardsToLocalStorage();
                saveCardsToFirebase()
                    .then(success => {
                        if (success) {
                            alert('تم إيقاف البطاقة بنجاح');
                            
                            // تحديث عرض تفاصيل البطاقة
                            showCardDetails(cardId);
                            
                            // تحديث الإحصائيات
                            updateCardStats();
                        } else {
                            alert('حدث خطأ أثناء حفظ التغييرات');
                        }
                    });
            }
        } else {
            // طلب تأكيد تفعيل البطاقة
            if (confirm('هل تريد تفعيل هذه البطاقة؟')) {
                card.status = 'active';
                
                // إضافة نشاط التفعيل
                addActivity(cardId, 'activate');
                
                // حفظ التغييرات
                saveCardsToLocalStorage();
                saveCardsToFirebase()
                    .then(success => {
                        if (success) {
                            alert('تم تفعيل البطاقة بنجاح');
                            
                            // تحديث عرض تفاصيل البطاقة
                            showCardDetails(cardId);
                            
                            // تحديث الإحصائيات
                            updateCardStats();
                        } else {
                            alert('حدث خطأ أثناء حفظ التغييرات');
                        }
                    });
            }
        }
    }
    
    // تجديد جميع البطاقات المنتهية
    function renewAllExpiredCards() {
        const currentDate = new Date();
        
        // البحث عن البطاقات المنتهية
        const expiredCards = cards.filter(card => 
            new Date(card.expiryDate) < currentDate && card.status === 'active'
        );
        
        if (expiredCards.length === 0) {
            alert('لا توجد بطاقات منتهية لتجديدها');
            return;
        }
        
        // طلب تأكيد التجديد
        if (!confirm(`هل تريد تجديد ${expiredCards.length} بطاقة منتهية؟`)) {
            return;
        }
        
        // تاريخ انتهاء الصلاحية الجديد (بعد عدد سنوات محدد في الإعدادات)
        const defaultExpiryYears = settings.defaultExpiryYears || 3;
        const newExpiryDate = new Date(currentDate);
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + defaultExpiryYears);
        
        // تحديث البطاقات المنتهية
        let renewedCount = 0;
        
        expiredCards.forEach(card => {
            card.expiryDate = newExpiryDate.toISOString().split('T')[0];
            card.lastRenewed = new Date().toISOString();
            
            // إضافة نشاط التجديد
            addActivity(card.id, 'renew', {
                oldExpiryDate: card.expiryDate,
                newExpiryDate: newExpiryDate.toISOString().split('T')[0]
            });
            
            renewedCount++;
        });
        
        // حفظ التغييرات
        saveCardsToLocalStorage();
        saveCardsToFirebase()
            .then(success => {
                if (success) {
                    alert(`تم تجديد ${renewedCount} بطاقة بنجاح`);
                    
                    // تحديث العرض
                    if (currentView === 'expired') {
                        renderCards('expired');
                    }
                    
                    // تحديث الإحصائيات
                    updateCardStats();
                } else {
                    alert('حدث خطأ أثناء حفظ التغييرات');
                }
            });
    }
    
    // Reemplaza la función initBarcodeScanner con esta versión mejorada
function initBarcodeScanner() {
    console.log('تهيئة ماسح الباركود...');
    
    // Intentar usar scanner si ya está en la ventana global
    if (window.Html5QrcodeScanner) {
        console.log('مكتبة مسح الباركود موجودة بالفعل');
        initScannerAfterLoad();
        return;
    }
    
    // Intentar cargar la biblioteca desde múltiples fuentes en orden de preferencia
    const cdnUrls = [
        'https://unpkg.com/html5-qrcode@2.3.8/dist/html5-qrcode.min.js',
        'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/dist/html5-qrcode.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js'
    ];
    
    // Cargar de forma secuencial hasta que una fuente tenga éxito
    loadNextCDN(cdnUrls, 0);
    
    function loadNextCDN(urls, index) {
        if (index >= urls.length) {
            // Si todas las fuentes fallan, usar el fallback
            showScannerError('فشلت جميع محاولات تحميل مكتبة المسح');
            return;
        }
        
        const script = document.createElement('script');
        script.src = urls[index];
        script.async = true;
        
        script.onload = function() {
            console.log('تم تحميل مكتبة مسح الباركود بنجاح من ' + urls[index]);
            // Inicializar el escáner después de cargar
            initScannerAfterLoad();
        };
        
        script.onerror = function() {
            console.warn('فشل تحميل المكتبة من ' + urls[index] + '، جاري المحاولة بمصدر آخر...');
            // Intentar la siguiente fuente
            loadNextCDN(urls, index + 1);
        };
        
        document.head.appendChild(script);
    }
    
    function showScannerError(message) {
        console.error('خطأ في تحميل مكتبة مسح الباركود:', message);
        
        // Mostrar mensaje de error
        const scannerContainer = document.getElementById('scanner-container');
        if (scannerContainer) {
            scannerContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background-color: #f8f9fa; border-radius: 8px; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f39c12; margin-bottom: 15px;"></i>
                    <p style="text-align: center; color: #2c3e50;">${message}</p>
                    <p style="text-align: center; color: #7f8c8d; font-size: 0.9rem; margin-top: 5px;">يمكنك إدخال معرف البطاقة يدويًا بدلاً من المسح</p>
                    <div style="margin-top: 20px; width: 100%; max-width: 300px;">
                        <input type="text" id="manual-card-id" placeholder="أدخل معرف البطاقة" 
                               style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #ddd; margin-bottom: 10px;">
                        <button id="manual-card-submit" class="btn btn-primary" style="width: 100%;">بحث عن البطاقة</button>
                    </div>
                    <button class="btn btn-outline btn-sm mt-10" id="retry-load-scanner">إعادة المحاولة</button>
                </div>
            `;
            
            // Agregar listener para el botón de reintentar
            const retryButton = document.getElementById('retry-load-scanner');
            if (retryButton) {
                retryButton.addEventListener('click', function() {
                    initBarcodeScanner();
                });
            }
            
            // Agregar listener para búsqueda manual
            const manualSubmitButton = document.getElementById('manual-card-submit');
            if (manualSubmitButton) {
                manualSubmitButton.addEventListener('click', function() {
                    const cardId = document.getElementById('manual-card-id').value.trim();
                    if (cardId) {
                        // Buscar tarjeta manualmente
                        const card = cards.find(c => c.id === cardId);
                        if (card) {
                            // Registrar actividad y mostrar detalles
                            addActivity(cardId, 'manual_scan');
                            showCardDetails(cardId);
                        } else {
                            alert('لم يتم العثور على بطاقة بهذا المعرف');
                        }
                    } else {
                        alert('الرجاء إدخال معرف البطاقة');
                    }
                });
            }
        }
    }
}

// También podemos mejorar la implementación del lector cuando la biblioteca se carga correctamente
function initScannerAfterLoad() {
    if (scanner) {
        // Si el escáner ya existe, limpiarlo
        try {
            scanner.clear();
        } catch (error) {
            console.error('خطأ في تنظيف الماسح السابق:', error);
        }
        scanner = null;
    }
    
    // Obtener el contenedor del escáner
    const scannerContainer = document.getElementById('scanner-container');
    if (!scannerContainer) return;
    
    try {
        // Comprobar si la clase Html5QrcodeScanner está disponible
        if (typeof Html5QrcodeScanner !== 'function') {
            throw new Error('مكتبة مسح الباركود غير متوفرة');
        }
        
        // Crear el nuevo escáner
        scanner = new Html5QrcodeScanner(
            "scanner-container",
            {
                fps: 10,
                qrbox: 250,
                rememberLastUsedCamera: true,
                // Opciones adicionales para mejorar la compatibilidad
                showTorchButtonIfSupported: true,
                showZoomSliderIfSupported: true
            },
            false // verbose
        );
        
        // Actualizar el estado de los botones
        updateScannerButtonsState(false);
    } catch (error) {
        console.error('خطأ في تهيئة الماسح:', error);
        
        // Mostrar mensaje de error
        scannerContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background-color: #f8f9fa; border-radius: 8px; padding: 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e74c3c; margin-bottom: 15px;"></i>
                <p style="text-align: center; color: #2c3e50;">حدث خطأ في تهيئة الماسح</p>
                <p style="text-align: center; color: #7f8c8d; font-size: 0.9rem; margin-top: 5px;">${error.message || 'تأكد من السماح بالوصول إلى الكاميرا'}</p>
                <div style="margin-top: 20px; width: 100%; max-width: 300px;">
                    <input type="text" id="manual-card-id" placeholder="أدخل معرف البطاقة" 
                           style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #ddd; margin-bottom: 10px;">
                    <button id="manual-card-submit" class="btn btn-primary" style="width: 100%;">بحث عن البطاقة</button>
                </div>
                <button class="btn btn-outline btn-sm mt-10" id="retry-init-scanner">إعادة المحاولة</button>
            </div>
        `;
        
        // Agregar listener para el botón de reintentar
        const retryButton = document.getElementById('retry-init-scanner');
        if (retryButton) {
            retryButton.addEventListener('click', function() {
                initBarcodeScanner();
            });
        }
        
        // Agregar listener para búsqueda manual
        const manualSubmitButton = document.getElementById('manual-card-submit');
        if (manualSubmitButton) {
            manualSubmitButton.addEventListener('click', function() {
                const cardId = document.getElementById('manual-card-id').value.trim();
                if (cardId) {
                    // Buscar tarjeta manualmente
                    const card = cards.find(c => c.id === cardId);
                    if (card) {
                        // Registrar actividad y mostrar detalles
                        addActivity(cardId, 'manual_scan');
                        showCardDetails(cardId);
                    } else {
                        alert('لم يتم العثور على بطاقة بهذا المعرف');
                    }
                } else {
                    alert('الرجاء إدخال معرف البطاقة');
                }
            });
        }
    }
}
    // تهيئة الماسح بعد تحميل المكتبة
    function initScannerAfterLoad() {
        if (scanner) {
            // إذا كان الماسح موجوداً بالفعل، نقوم بتنظيفه
            try {
                scanner.clear();
            } catch (error) {
                console.error('خطأ في تنظيف الماسح السابق:', error);
            }
            scanner = null;
        }
        
        // الحصول على حاوية الماسح
        const scannerContainer = document.getElementById('scanner-container');
        if (!scannerContainer) return;
        
        try {
            // إنشاء ماسح جديد
            scanner = new Html5QrcodeScanner(
                "scanner-container",
                {
                    fps: 10,
                    qrbox: 250,
                    rememberLastUsedCamera: true,
                    supportedScanTypes: [
                        Html5QrcodeScanType.SCAN_TYPE_CAMERA,
                        Html5QrcodeScanType.SCAN_TYPE_FILE
                    ],
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.QR_CODE,
                        Html5QrcodeSupportedFormats.CODE_39,
                        Html5QrcodeSupportedFormats.CODE_128
                    ]
                },
                false // verbose
            );
            
            // تحديث حالة أزرار الماسح
            updateScannerButtonsState(false);
        } catch (error) {
            console.error('خطأ في تهيئة الماسح:', error);
            
            // إظهار رسالة خطأ
            scannerContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background-color: #f8f9fa; border-radius: 8px; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e74c3c; margin-bottom: 15px;"></i>
                    <p style="text-align: center; color: #2c3e50;">حدث خطأ في تهيئة الماسح</p>
                    <p style="text-align: center; color: #7f8c8d; font-size: 0.9rem; margin-top: 5px;">${error.message || 'حاول مرة أخرى أو تحقق من تكوين الكاميرا'}</p>
                    <button class="btn btn-primary btn-sm mt-10" id="retry-init-scanner">إعادة المحاولة</button>
                </div>
            `;
            
            // إضافة مستمع لزر إعادة المحاولة
            const retryButton = document.getElementById('retry-init-scanner');
            if (retryButton) {
                retryButton.addEventListener('click', function() {
                    initBarcodeScanner();
                });
            }
        }
    }
    
    // بدء المسح
    function startBarcodeScanner() {
        if (!scanner) {
            initBarcodeScanner();
            return;
        }
        
        try {
            scanner.render(
                // نجاح المسح
                result => {
                    // إظهار نتيجة المسح
                    const scanResult = document.getElementById('scan-result');
                    const scanResultData = document.getElementById('scan-result-data');
                    
                    if (scanResult && scanResultData) {
                        scanResult.classList.remove('hidden');
                        scanResultData.textContent = result;
                        
                        // صوت تنبيه إذا كان مفعلاً
                        if (document.getElementById('scanner-beep')?.checked) {
                            playBeepSound();
                        }
                        
                        // اهتزاز إذا كان مفعلاً ومدعوماً
                        if (document.getElementById('scanner-vibrate')?.checked && 'vibrate' in navigator) {
                            navigator.vibrate(200);
                        }
                        
                        // البحث عن البطاقة باستخدام المعرف
                        const card = cards.find(c => c.id === result);
                        
                        // إضافة نشاط المسح
                        if (card) {
                            addActivity(card.id, 'scan');
                            
                            // الانتقال التلقائي إذا كان مفعلاً وتم العثور على البطاقة
                            if (document.getElementById('scanner-auto-redirect')?.checked) {
                                stopBarcodeScanner();
                                
                                // عرض تفاصيل البطاقة
                                showCardDetails(card.id);
                            }
                        }
                    }
                },
                // خطأ في المسح
                error => {
                    if (error !== 'QR code parse error, error = NotFoundException: No MultiFormat Readers were able to detect the code.') {
                        console.error('خطأ في المسح:', error);
                    }
                }
            );
            
            // تحديث حالة الأزرار
            updateScannerButtonsState(true);
        } catch (error) {
            console.error('خطأ في بدء المسح:', error);
            alert('حدث خطأ في بدء المسح: ' + error.message);
        }
    }
    
    // تشغيل صوت تنبيه
    function playBeepSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = 1500;
            gainNode.gain.value = 0.3;
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
            }, 150);
        } catch (error) {
            console.error('خطأ في تشغيل صوت التنبيه:', error);
        }
    }
    
    // إيقاف المسح
    function stopBarcodeScanner() {
        if (!scanner) return;
        
        try {
            scanner.clear();
            
            // تحديث حالة الأزرار
            updateScannerButtonsState(false);
            
            // إعادة تهيئة الماسح
            initScannerAfterLoad();
        } catch (error) {
            console.error('خطأ في إيقاف الماسح:', error);
        }
    }
    
    // تبديل كاميرا الماسح
    function toggleScannerCamera() {
        stopBarcodeScanner();
        
        // تبديل إعدادات الكاميرا المفضلة
        settings.scannerPreferredCamera = settings.scannerPreferredCamera === 'environment' ? 'user' : 'environment';
        saveSettings();
        
        // إعادة تهيئة الماسح مع الإعدادات الجديدة
        setTimeout(() => {
            initBarcodeScanner();
            alert('تم تبديل الكاميرا. الرجاء إعادة المسح.');
        }, 500);
    }
    
    // تحديث حالة أزرار الماسح
    function updateScannerButtonsState(isScanning = false) {
        const startButton = document.getElementById('start-scanner');
        const stopButton = document.getElementById('stop-scanner');
        
        if (startButton && stopButton) {
            startButton.disabled = isScanning;
            stopButton.disabled = !isScanning;
        }
    }
    
    // تحديث إحصائيات البطاقات
    function updateCardStats() {
        const currentDate = new Date();
        
        // إجمالي البطاقات
        const totalCards = cards.length;
        
        // البطاقات النشطة
        const activeCards = cards.filter(card => 
            card.status === 'active' && 
            new Date(card.expiryDate) >= currentDate
        ).length;
        
        // البطاقات المنتهية أو الموقوفة
        const expiredCards = cards.filter(card => 
            card.status === 'inactive' || 
            new Date(card.expiryDate) < currentDate
        ).length;
        
        // متوسط عمر البطاقة (بالأيام)
        let totalCardAgeDays = 0;
        cards.forEach(card => {
            const createdAt = new Date(card.createdAt);
            const ageDays = Math.floor((currentDate - createdAt) / (1000 * 60 * 60 * 24));
            totalCardAgeDays += ageDays;
        });
        const avgCardAge = totalCards > 0 ? Math.floor(totalCardAgeDays / totalCards) : 0;
        
        // توزيع أنواع البطاقات
        const cardTypeDistribution = {};
        Object.keys(CARD_TYPES).forEach(type => {
            cardTypeDistribution[type] = 0;
        });
        
        cards.forEach(card => {
            if (cardTypeDistribution[card.cardType] !== undefined) {
                cardTypeDistribution[card.cardType]++;
            } else {
                cardTypeDistribution.custom++;
            }
        });
        
        // تخزين الإحصائيات
        stats = {
            totalCards,
            activeCards,
            expiredCards,
            avgCardAge,
            cardTypeDistribution,
            lastUpdated: new Date().toISOString()
        };
        
        return stats;
    }
    
    // عرض إحصائيات البطاقات
    function renderCardStats() {
        // تحديث الإحصائيات
        const updatedStats = updateCardStats();
        
        // تحديث القيم في الصفحة
        const totalCardsElement = document.getElementById('total-cards-stat');
        const activeCardsElement = document.getElementById('active-cards-stat');
        const expiredCardsElement = document.getElementById('expired-cards-stat');
        const avgCardAgeElement = document.getElementById('avg-card-age-stat');
        
        if (totalCardsElement) totalCardsElement.textContent = updatedStats.totalCards;
        if (activeCardsElement) activeCardsElement.textContent = updatedStats.activeCards;
        if (expiredCardsElement) expiredCardsElement.textContent = updatedStats.expiredCards;
        if (avgCardAgeElement) avgCardAgeElement.textContent = updatedStats.avgCardAge;
        
        // إنشاء الرسوم البيانية
        renderCardTypeChart();
        renderCardStatusChart();
        renderCardsGrowthChart();
        
        // عرض أحدث الأنشطة
        renderRecentActivities();
    }
    
    // إنشاء رسم بياني لتوزيع أنواع البطاقات
    function renderCardTypeChart() {
        const chartCanvas = document.getElementById('card-types-chart');
        if (!chartCanvas || !window.Chart) return;
        
        // تنظيف أي رسم بياني سابق
        if (window.cardTypeChart) {
            window.cardTypeChart.destroy();
        }
        
        // إعداد البيانات
        const typeLabels = {
            platinum: 'بلاتينية',
            gold: 'ذهبية',
            premium: 'بريميوم',
            diamond: 'ماسية',
            islamic: 'إسلامية',
            custom: 'مخصصة'
        };
        
        const typeColors = {
            platinum: 'rgba(48, 48, 48, 0.7)',
            gold: 'rgba(212, 175, 55, 0.7)',
            premium: 'rgba(31, 58, 95, 0.7)',
            diamond: 'rgba(22, 33, 62, 0.7)',
            islamic: 'rgba(0, 107, 60, 0.7)',
            custom: 'rgba(52, 152, 219, 0.7)'
        };
        
        const typeData = [];
        const labels = [];
        const backgroundColor = [];
        
        Object.keys(stats.cardTypeDistribution).forEach(type => {
            if (stats.cardTypeDistribution[type] > 0) {
                labels.push(typeLabels[type] || type);
                typeData.push(stats.cardTypeDistribution[type]);
                backgroundColor.push(typeColors[type] || 'rgba(52, 152, 219, 0.7)');
            }
        });
        
        // إنشاء الرسم البياني
        window.cardTypeChart = new Chart(chartCanvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: typeData,
                    backgroundColor: backgroundColor,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
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
                }
            }
        });
    }
    
    // إنشاء رسم بياني لحالة البطاقات
    function renderCardStatusChart() {
        const chartCanvas = document.getElementById('card-status-chart');
        if (!chartCanvas || !window.Chart) return;
        
        // تنظيف أي رسم بياني سابق
        if (window.cardStatusChart) {
            window.cardStatusChart.destroy();
        }
        
        const currentDate = new Date();
        
        // إعداد البيانات
        const activeCards = stats.activeCards;
        const expiredCards = cards.filter(card => 
            card.status === 'active' && 
            new Date(card.expiryDate) < currentDate
        ).length;
        const inactiveCards = cards.filter(card => card.status === 'inactive').length;
        
        // إنشاء الرسم البياني
        window.cardStatusChart = new Chart(chartCanvas, {
            type: 'pie',
            data: {
                labels: ['نشطة', 'منتهية الصلاحية', 'موقوفة'],
                datasets: [{
                    data: [activeCards, expiredCards, inactiveCards],
                    backgroundColor: [
                        'rgba(46, 204, 113, 0.7)',
                        'rgba(243, 156, 18, 0.7)',
                        'rgba(231, 76, 60, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
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
                }
            }
        });
    }
    
    // إنشاء رسم بياني لتطور البطاقات
    function renderCardsGrowthChart() {
        const chartCanvas = document.getElementById('cards-growth-chart');
        if (!chartCanvas || !window.Chart || cards.length === 0) return;
        
        // تنظيف أي رسم بياني سابق
        if (window.cardsGrowthChart) {
            window.cardsGrowthChart.destroy();
        }
        
        // إعداد البيانات
        const sortedCards = [...cards].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const cardDates = {};
        
        // تجميع البطاقات حسب الشهر
        sortedCards.forEach(card => {
            const date = new Date(card.createdAt);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!cardDates[monthYear]) {
                cardDates[monthYear] = 0;
            }
            
            cardDates[monthYear]++;
        });
        
        // إعداد البيانات للرسم البياني
        const labels = Object.keys(cardDates);
        const data = [];
        let total = 0;
        
        labels.forEach(date => {
            total += cardDates[date];
            data.push(total);
        });
        
        // إنشاء الرسم البياني
        window.cardsGrowthChart = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: labels.map(formatMonthYear),
                datasets: [{
                    label: 'إجمالي البطاقات',
                    data: data,
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                },
                plugins: {
                    legend: {
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
                }
            }
        });
    }
    
    // تنسيق الشهر والسنة بالعربية
    function formatMonthYear(dateStr) {
        const [year, month] = dateStr.split('-');
        const monthNames = {
            '01': 'يناير',
            '02': 'فبراير',
            '03': 'مارس',
            '04': 'أبريل',
            '05': 'مايو',
            '06': 'يونيو',
            '07': 'يوليو',
            '08': 'أغسطس',
            '09': 'سبتمبر',
            '10': 'أكتوبر',
            '11': 'نوفمبر',
            '12': 'ديسمبر'
        };
        
        return `${monthNames[month]} ${year}`;
    }
    
    // عرض أحدث الأنشطة
    function renderRecentActivities() {
        const activitiesContainer = document.getElementById('recent-activities-container');
        if (!activitiesContainer) return;
        
        // عرض أحدث 10 أنشطة
        const recentActivities = activities.slice(0, 10);
        
        if (recentActivities.length === 0) {
            activitiesContainer.innerHTML = '<div class="text-center">لا توجد أنشطة حديثة</div>';
            return;
        }
        
        let html = '';
        
        recentActivities.forEach(activity => {
            const card = cards.find(c => c.id === activity.cardId);
            
            html += `
                <div class="activity-list-item">
                    <div class="activity-icon">
                        <i class="${getActivityIcon(activity.action)}"></i>
                    </div>
                    <div class="activity-details">
                        <div class="activity-title">
                            ${getActivityText(activity.action)}
                            ${card ? `<span>(${card.investorName})</span>` : ''}
                        </div>
                        <div class="activity-meta">${formatDateTime(activity.timestamp)}</div>
                    </div>
                </div>
            `;
        });
        
        activitiesContainer.innerHTML = html;
    }
    
    // تصدير إحصائيات البطاقات
    function exportCardStats() {
        // تحديث الإحصائيات
        updateCardStats();
        
        // إعداد بيانات التصدير
        const exportData = {
            general: {
                totalCards: stats.totalCards,
                activeCards: stats.activeCards,
                expiredCards: stats.expiredCards,
                avgCardAge: stats.avgCardAge,
                dateExported: new Date().toISOString()
            },
            cardTypeDistribution: stats.cardTypeDistribution,
            cardDetails: cards.map(card => ({
                id: card.id,
                investorName: card.investorName,
                cardType: card.cardType,
                status: card.status,
                createdAt: card.createdAt,
                expiryDate: card.expiryDate
            }))
        };
        
        // تحويل البيانات إلى نص JSON
        const jsonData = JSON.stringify(exportData, null, 2);
        
        // إنشاء ملف للتنزيل
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // إنشاء رابط التنزيل وتفعيله
        const a = document.createElement('a');
        a.href = url;
        a.download = `إحصائيات_البطاقات_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        
        // تنظيف
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
        
        return true;
    }
    
    // إظهار صفحة البطاقات
    function showCardPage() {
        console.log('إظهار صفحة بطاقات المستثمرين...');
        
        // إخفاء جميع الصفحات
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // إظهار صفحة البطاقات
        const cardsPage = document.getElementById('investor-cards-page');
        if (cardsPage) {
            cardsPage.classList.add('active');
            
            // تحديث عرض البطاقات
            renderCards('all');
        }
    }
    
    // تصدير واجهة برمجة التطبيق العامة
    return {
        initialize,
        renderCards,
        showCardDetails,
        printCard,
        createCard,
        showCardPage,
        toggleDarkMode,
        updateCardStats,
        renderCardStats,
        exportCardStats
    };
})();

// تهيئة نظام البطاقات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة نظام البطاقات
    InvestorCardSystem.initialize()
        .then(success => {
            console.log('تم تهيئة نظام بطاقات المستثمرين:', success);
        })
        .catch(error => {
            console.error('خطأ في تهيئة نظام بطاقات المستثمرين:', error);
        });
});

// تصدير النظام للاستخدام الخارجي
window.InvestorCardSystem = InvestorCardSystem;