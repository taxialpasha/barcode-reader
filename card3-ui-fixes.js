/**
 * إصلاحات واجهة بطاقة المستثمر - Investor Card UI Fixes
 * هذا الملف يحتوي على تحسينات وإصلاحات لواجهة بطاقة المستثمر
 * 
 * @version 1.0.0
 */

// تحسينات واجهة بطاقة المستثمر
(function() {
    // تنفيذ الإصلاحات عند تحميل الصفحة
    document.addEventListener('DOMContentLoaded', function() {
        console.log('تطبيق إصلاحات واجهة بطاقة المستثمر...');
        
        // تحسين شكل البطاقة
        enhanceCardDesign();
        
        // تحسين تجربة تسجيل الدخول
        enhanceLoginExperience();
        
        // تحسين التنقل بين التبويبات
        enhanceTabNavigation();
        
        // إضافة التحريك السلس للعناصر
        addSmoothAnimations();
        
        // تحسين تجربة المستخدم على الأجهزة المحمولة
        enhanceMobileExperience();
        
        // إصلاح مشكلات التوافق بين المتصفحات
        fixBrowserCompatibility();
        
        // إضافة مستمع للأحداث الرئيسية
        setupEventHandlers();
        
        console.log('تم تطبيق إصلاحات واجهة بطاقة المستثمر بنجاح');
    });
    
    // تحسين شكل البطاقة
    function enhanceCardDesign() {
        // إضافة تأثيرات ظل وتدرج للبطاقة
        const cardElement = document.querySelector('.investor-card');
        if (cardElement) {
            // إضافة فئة لتحسين الشكل
            cardElement.classList.add('enhanced-card');
            
            // إضافة تأثيرات CSS للبطاقة
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .enhanced-card {
                    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15), 0 5px 15px rgba(0, 0, 0, 0.1);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    backface-visibility: hidden;
                    position: relative;
                    overflow: hidden;
                }
                
                .enhanced-card:before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
                    pointer-events: none;
                    z-index: 1;
                }
                
                .enhanced-card:hover {
                    transform: translateY(-5px) scale(1.02);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2), 0 10px 20px rgba(0, 0, 0, 0.15);
                }
                
                .enhanced-card.flipped .card-front,
                .enhanced-card.flipped .card-back {
                    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15), 0 5px 15px rgba(0, 0, 0, 0.1);
                }
                
                .card-chip {
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                
                .card-chip:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
                }
                
                .card-hologram {
                    animation: hologram-shine 3s infinite ease-in-out;
                    background: linear-gradient(45deg, 
                        rgba(255,255,255,0.1) 0%, 
                        rgba(255,255,255,0.3) 25%, 
                        rgba(255,255,255,0.5) 50%, 
                        rgba(255,255,255,0.3) 75%, 
                        rgba(255,255,255,0.1) 100%);
                    background-size: 200% 200%;
                }
                
                @keyframes hologram-shine {
                    0% { background-position: 0% 0%; opacity: 0.5; }
                    50% { background-position: 100% 100%; opacity: 0.8; }
                    100% { background-position: 0% 0%; opacity: 0.5; }
                }
                
                .card-status-badge {
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                
                .card-qrcode {
                    transition: all 0.3s ease;
                }
                
                .card-qrcode:hover {
                    transform: scale(1.05);
                }
                
                .card-number, .card-name, .card-validity {
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                }
            `;
            
            document.head.appendChild(styleElement);
        }
        
        // تحسين ظهور التفاصيل في البطاقة
        enhanceCardDetails();
    }
    
    // تحسين ظهور التفاصيل في البطاقة
    function enhanceCardDetails() {
        // إضافة تأثير متحرك لرقم البطاقة
        const cardNumber = document.getElementById('display-card-number');
        if (cardNumber) {
            cardNumber.addEventListener('mouseover', function() {
                // إظهار الرقم الكامل عند التمرير فوقه (مع مراعاة الأمان)
                const fullNumber = this.getAttribute('data-full-number');
                if (fullNumber) {
                    const originalNumber = this.textContent;
                    this.textContent = fullNumber;
                    
                    // إعادة الرقم المقنّع عند إزالة المؤشر
                    this.addEventListener('mouseout', function() {
                        this.textContent = originalNumber;
                    }, { once: true });
                }
            });
        }
        
        // تحسين عرض رمز CVV
        const displayCvv = document.getElementById('display-cvv');
        if (displayCvv) {
            // إضافة زر إظهار/إخفاء لرمز CVV
            const cvvContainer = displayCvv.parentElement;
            if (cvvContainer) {
                const toggleButton = document.createElement('button');
                toggleButton.className = 'cvv-toggle';
                toggleButton.innerHTML = '<i class="fas fa-eye"></i>';
                toggleButton.title = 'إظهار/إخفاء رمز CVV';
                
                // حفظ النص الأصلي لـ CVV
                const originalCvv = displayCvv.textContent;
                const actualCvv = originalCvv.replace(/[*]/g, '').trim();
                
                // إخفاء القيمة الأصلية
                if (actualCvv && actualCvv.length === 3 && /^\d{3}$/.test(actualCvv)) {
                    displayCvv.setAttribute('data-cvv', actualCvv);
                    displayCvv.textContent = '***';
                }
                
                // وظيفة إظهار/إخفاء
                toggleButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const savedCvv = displayCvv.getAttribute('data-cvv');
                    if (displayCvv.textContent === '***' && savedCvv) {
                        displayCvv.textContent = savedCvv;
                        toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
                    } else {
                        displayCvv.textContent = '***';
                        toggleButton.innerHTML = '<i class="fas fa-eye"></i>';
                    }
                });
                
                cvvContainer.appendChild(toggleButton);
                
                // إضافة نمط للزر
                const style = document.createElement('style');
                style.textContent = `
                    .cvv-toggle {
                        background: none;
                        border: none;
                        cursor: pointer;
                        margin-left: 5px;
                        color: rgba(255, 255, 255, 0.7);
                        transition: color 0.2s;
                    }
                    
                    .cvv-toggle:hover {
                        color: rgba(255, 255, 255, 1);
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }
    
    // تحسين تجربة تسجيل الدخول
    function enhanceLoginExperience() {
        // إضافة تحقق فوري للإدخال
        addLiveValidation();
        
        // تحسين مدخلات PIN
        enhancePinInputs();
        
        // تحسين مظهر نموذج تسجيل الدخول
        styleLoginForm();
        
        // إضافة تأثير متحرك للانتقال بين التبويبات
        animateTabTransitions();
    }
    
    // إضافة تحقق فوري للإدخال
    function addLiveValidation() {
        // تحقق من رقم البطاقة أثناء الكتابة
        const cardNumberInput = document.getElementById('card-number');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', function() {
                // تنسيق الرقم تلقائياً
                this.value = formatCardNumber(this.value);
                
                // إضافة فئة حالة التحقق
                validateInput(this, /^[\d\s]{19}$/, 'يرجى إدخال 16 رقم');
            });
        }
        
        // تحقق من تاريخ الانتهاء أثناء الكتابة
        const cardExpiryInput = document.getElementById('card-expiry');
        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', function() {
                // تنسيق التاريخ تلقائياً
                this.value = formatExpiryDate(this.value);
                
                // إضافة فئة حالة التحقق
                validateExpiryDate(this);
            });
        }
        
        // تحقق من رمز CVV أثناء الكتابة
        const cardCvvInput = document.getElementById('card-cvv');
        if (cardCvvInput) {
            cardCvvInput.addEventListener('input', function() {
                // قصر الإدخال على الأرقام فقط
                this.value = this.value.replace(/\D/g, '');
                
                // إضافة فئة حالة التحقق
                validateInput(this, /^\d{3}$/, 'يجب إدخال 3 أرقام');
            });
        }
        
        // تحقق من رقم الهاتف أثناء الكتابة
        const phoneNumberInput = document.getElementById('phone-number');
        if (phoneNumberInput) {
            phoneNumberInput.addEventListener('input', function() {
                // قصر الإدخال على الأرقام والرموز المسموح بها
                this.value = this.value.replace(/[^\d+\s()-]/g, '');
                
                // إضافة فئة حالة التحقق
                validateInput(this, /^[\d+\s()-]{10,15}$/, 'يرجى إدخال رقم هاتف صحيح');
            });
        }
        
        // تحقق من اسم المستثمر أثناء الكتابة
        const investorNameInput = document.getElementById('investor-name');
        if (investorNameInput) {
            investorNameInput.addEventListener('input', function() {
                // إضافة فئة حالة التحقق
                validateInput(this, /^[\u0600-\u06FF\s]{3,50}$/, 'يرجى إدخال اسم صحيح باللغة العربية');
            });
        }
    }
    
    // دالة مساعدة للتحقق من الإدخال
    function validateInput(inputElement, pattern, errorMessage) {
        const value = inputElement.value.trim();
        const isValid = pattern.test(value);
        
        // إزالة رسائل الخطأ السابقة
        const existingError = inputElement.parentElement.querySelector('.input-error');
        if (existingError) {
            existingError.remove();
        }
        
        // تحديث فئات التحقق
        inputElement.classList.remove('valid', 'invalid');
        
        if (value === '') {
            // لا شيء للتحقق منه
            return;
        }
        
        if (isValid) {
            inputElement.classList.add('valid');
        } else {
            inputElement.classList.add('invalid');
            
            // إضافة رسالة الخطأ
            const errorElement = document.createElement('div');
            errorElement.className = 'input-error';
            errorElement.textContent = errorMessage;
            inputElement.parentElement.appendChild(errorElement);
        }
    }
    
    // التحقق من تاريخ الانتهاء
    function validateExpiryDate(inputElement) {
        const value = inputElement.value.trim();
        
        // إزالة رسائل الخطأ السابقة
        const existingError = inputElement.parentElement.querySelector('.input-error');
        if (existingError) {
            existingError.remove();
        }
        
        // تحديث فئات التحقق
        inputElement.classList.remove('valid', 'invalid');
        
        if (value === '') {
            // لا شيء للتحقق منه
            return;
        }
        
        // التحقق من التنسيق MM/YY
        if (!/^\d{2}\/\d{2}$/.test(value)) {
            inputElement.classList.add('invalid');
            
            // إضافة رسالة الخطأ
            const errorElement = document.createElement('div');
            errorElement.className = 'input-error';
            errorElement.textContent = 'التنسيق الصحيح: MM/YY';
            inputElement.parentElement.appendChild(errorElement);
            return;
        }
        
        // التحقق من صلاحية الشهر والسنة
        const [month, year] = value.split('/');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100; // آخر رقمين
        const currentMonth = currentDate.getMonth() + 1; // الشهور تبدأ من 0
        const inputMonth = parseInt(month, 10);
        const inputYear = parseInt(year, 10);
        
        // التحقق من أن الشهر بين 1 و 12
        if (inputMonth < 1 || inputMonth > 12) {
            inputElement.classList.add('invalid');
            
            // إضافة رسالة الخطأ
            const errorElement = document.createElement('div');
            errorElement.className = 'input-error';
            errorElement.textContent = 'الشهر يجب أن يكون بين 1 و 12';
            inputElement.parentElement.appendChild(errorElement);
            return;
        }
        
        // التحقق من أن التاريخ لم ينتهِ
        if (inputYear < currentYear || (inputYear === currentYear && inputMonth < currentMonth)) {
            inputElement.classList.add('invalid');
            
            // إضافة رسالة الخطأ
            const errorElement = document.createElement('div');
            errorElement.className = 'input-error';
            errorElement.textContent = 'تاريخ انتهاء البطاقة غير صالح';
            inputElement.parentElement.appendChild(errorElement);
            return;
        }
        
        // البطاقة صالحة
        inputElement.classList.add('valid');
    }
    
    // تنسيق رقم البطاقة
    function formatCardNumber(value) {
        // إزالة جميع المسافات والأحرف غير الرقمية
        const cardNumber = value.replace(/\D/g, '');
        
        // تقسيم الرقم إلى مجموعات من 4 أرقام
        return cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    
    // تنسيق تاريخ الانتهاء
    function formatExpiryDate(value) {
        // إزالة جميع الأحرف غير الرقمية
        const digits = value.replace(/\D/g, '');
        
        if (digits.length > 2) {
            return `${digits.substring(0, 2)}/${digits.substring(2, 4)}`;
        }
        
        return digits;
    }
    
    // تحسين مدخلات PIN
    function enhancePinInputs() {
        const pinInputs = document.querySelectorAll('.pin-input');
        const hiddenPinInput = document.getElementById('card-pin');
        
        if (pinInputs.length === 0) return;
        
        // تحسين أنماط مدخلات PIN
        const style = document.createElement('style');
        style.textContent = `
            .pin-input-container {
                display: flex;
                gap: 8px;
                justify-content: center;
                margin: 10px 0;
            }
            
            .pin-input {
                width: 40px;
                height: 50px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 20px;
                text-align: center;
                background-color: #f8f9fa;
                transition: all 0.2s ease;
            }
            
            .pin-input:focus {
                border-color: #3498db;
                box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.3);
                outline: none;
            }
            
            .pin-input.filled {
                background-color: #e8f4fd;
                border-color: #3498db;
            }
        `;
        document.head.appendChild(style);
        
        // إضافة مستمعات للمدخلات
        pinInputs.forEach((input, index) => {
            // تعليم المدخل كممتلئ عند إدخال قيمة
            input.addEventListener('input', function() {
                // تحديث فئة الامتلاء
                this.classList.toggle('filled', this.value.trim() !== '');
                
                // الانتقال للمدخل التالي إذا تم ملء المدخل الحالي
                if (this.value.length === 1 && index < pinInputs.length - 1) {
                    pinInputs[index + 1].focus();
                }
                
                // تحديث قيمة المدخل المخفي
                updateHiddenPinValue();
            });
            
            // التنقل بين المدخلات باستخدام المفاتيح
            input.addEventListener('keydown', function(e) {
                switch (e.key) {
                    case 'ArrowRight':
                        // الانتقال للمدخل السابق (من اليمين لليسار في العربية)
                        if (index > 0) {
                            pinInputs[index - 1].focus();
                        }
                        break;
                    case 'ArrowLeft':
                        // الانتقال للمدخل التالي (من اليسار لليمين في العربية)
                        if (index < pinInputs.length - 1) {
                            pinInputs[index + 1].focus();
                        }
                        break;
                    case 'Backspace':
                        // مسح المدخل الحالي أو الانتقال للمدخل السابق
                        if (this.value === '' && index > 0) {
                            pinInputs[index - 1].focus();
                        }
                        break;
                }
            });
            
            // يسمح فقط بإدخال الأرقام
            input.addEventListener('input', function() {
                this.value = this.value.replace(/\D/g, '');
            });
        });
        
        // تحديث قيمة المدخل المخفي
        function updateHiddenPinValue() {
            if (!hiddenPinInput) return;
            
            let pin = '';
            pinInputs.forEach(input => {
                pin += input.value;
            });
            
            hiddenPinInput.value = pin;
        }
    }
    
    // تحسين مظهر نموذج تسجيل الدخول
    function styleLoginForm() {
        // إضافة أنماط محسنة لنموذج تسجيل الدخول
        const style = document.createElement('style');
        style.textContent = `
            .login-container {
                animation: fadeIn 0.5s ease-out;
            }
            
            .login-form .form-input {
                transition: all 0.3s ease;
                border: 1px solid #ddd;
            }
            
            .login-form .form-input:focus {
                border-color: #3498db;
                box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.3);
            }
            
            .login-form .form-input.valid {
                border-color: #2ecc71;
                box-shadow: 0 0 0 2px rgba(46, 204, 113, 0.2);
            }
            
            .login-form .form-input.invalid {
                border-color: #e74c3c;
                box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2);
            }
            
            .input-error {
                color: #e74c3c;
                font-size: 0.85rem;
                margin-top: 5px;
                animation: fadeIn 0.3s ease-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .btn {
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .btn:after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 5px;
                height: 5px;
                background: rgba(255, 255, 255, 0.5);
                opacity: 0;
                border-radius: 100%;
                transform: scale(1, 1) translate(-50%, -50%);
                transform-origin: 50% 50%;
            }
            
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            }
            
            .btn:focus:not(:active)::after {
                animation: ripple 1s ease-out;
            }
            
            @keyframes ripple {
                0% {
                    transform: scale(0, 0);
                    opacity: 0.5;
                }
                100% {
                    transform: scale(20, 20);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // إضافة تأثير متحرك للانتقال بين التبويبات
    function animateTabTransitions() {
        // إضافة أنماط للتبويبات
        const style = document.createElement('style');
        style.textContent = `
            .tab-content {
                display: none;
                opacity: 0;
                transform: translateY(10px);
                transition: opacity 0.3s ease, transform 0.3s ease;
            }
            
            .tab-content.active {
                display: block;
                animation: fadeInUp 0.4s forwards;
            }
            
            @keyframes fadeInUp {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .tab-btn {
                position: relative;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .tab-btn:before {
                content: '';
                position: absolute;
                bottom: 0;
                left: 50%;
                width: 0;
                height: 2px;
                background-color: #3498db;
                transition: all 0.3s ease;
                transform: translateX(-50%);
            }
            
            .tab-btn.active:before {
                width: 100%;
            }
            
            .tab-btn:hover:before {
                width: 80%;
            }
        `;
        document.head.appendChild(style);
        
        // إضافة مستمعات للنقر على أزرار التبويب
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                
                // إزالة الفئة النشطة من جميع الأزرار
                tabButtons.forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // إضافة الفئة النشطة للزر الحالي
                this.classList.add('active');
                
                // إخفاء جميع محتويات التبويب
                const tabContents = document.querySelectorAll('.tab-content');
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                
                // إظهار محتوى التبويب المطلوب
                const activeTab = document.getElementById(`${tabId}-tab`);
                if (activeTab) {
                    activeTab.classList.add('active');
                }
            });
        });
    }
    
    // تحسين التنقل بين التبويبات
    function enhanceTabNavigation() {
        // تحسين أنماط التبويبات
        const style = document.createElement('style');
        style.textContent = `
            .info-tabs {
                margin-top: 25px;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            }
            
            .tab-buttons {
                display: flex;
                justify-content: space-around;
                background-color: #f8f9fa;
                border-bottom: 1px solid #eee;
                padding: 0;
                overflow-x: auto;
                white-space: nowrap;
                -webkit-overflow-scrolling: touch;
                position: sticky;
                top: 0;
                z-index: 10;
            }
            
            .tab-btn {
                flex: 1;
                padding: 15px 10px;
                text-align: center;
                background: none;
                border: none;
                cursor: pointer;
                color: #7f8c8d;
                font-weight: 500;
                font-size: 1rem;
                transition: all 0.3s ease;
            }
            
            .tab-btn.active {
                color: #3498db;
                background-color: white;
            }
            
            .tab-btn:not(.active):hover {
                color: #2980b9;
                background-color: rgba(52, 152, 219, 0.05);
            }
            
            .tab-content {
                background-color: white;
                padding: 20px;
                min-height: 300px;
            }
            
            /* إضافة مؤشر للتمرير على التبويبات */
            .tab-buttons::-webkit-scrollbar {
                height: 3px;
            }
            
            .tab-buttons::-webkit-scrollbar-track {
                background: #f8f9fa;
            }
            
            .tab-buttons::-webkit-scrollbar-thumb {
                background-color: #ddd;
                border-radius: 10px;
            }
            
            /* تحسين تخطيط التبويبات على الأجهزة المحمولة */
            @media (max-width: 768px) {
                .tab-btn {
                    padding: 12px 5px;
                    font-size: 0.9rem;
                }
                
                .tab-content {
                    padding: 15px;
                }
            }
        `;
        document.head.appendChild(style);
        
        // تحسين تجربة المستخدم في التبويبات
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        // إضافة مستمعات swipe للتنقل في الأجهزة المحمولة
        if (tabButtons.length > 0) {
            // للتحسين المستقبلي: إضافة دعم swipe للتنقل بين التبويبات
        }
    }
    
    // إضافة التحريك السلس للعناصر
    function addSmoothAnimations() {
        // إضافة أنماط التحريك
        const style = document.createElement('style');
        style.textContent = `
            /* أنماط التحريك لعناصر البيانات */
            .data-item {
                transition: all 0.3s ease;
                animation: fadeInUp 0.5s forwards;
                opacity: 0;
                transform: translateY(20px);
            }
            
            .data-item:nth-child(1) { animation-delay: 0.1s; }
            .data-item:nth-child(2) { animation-delay: 0.2s; }
            .data-item:nth-child(3) { animation-delay: 0.3s; }
            .data-item:nth-child(4) { animation-delay: 0.4s; }
            .data-item:nth-child(5) { animation-delay: 0.5s; }
            
            @keyframes fadeInUp {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* تحسين مظهر العناصر المالية */
            .financial-summary {
                animation: fadeIn 0.6s forwards;
            }
            
            .stat-card {
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .stat-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
            }
            
            .stat-card:after {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                background: linear-gradient(to right, 
                    rgba(255,255,255,0.1) 0%, 
                    rgba(255,255,255,0) 50%, 
                    rgba(255,255,255,0.1) 100%);
                transform: translateX(-100%);
                transition: transform 0.6s ease;
            }
            
            .stat-card:hover:after {
                transform: translateX(100%);
            }
            
            /* تأثير تحميل متموج للعناصر */
            @keyframes shimmer {
                0% {
                    background-position: -1000px 0;
                }
                100% {
                    background-position: 1000px 0;
                }
            }
            
            .loading-shimmer {
                background: linear-gradient(to right, #f5f5f5 8%, #eee 18%, #f5f5f5 33%);
                background-size: 1000px 100%;
                animation: shimmer 2s infinite linear;
            }
        `;
        document.head.appendChild(style);
    }
    
    // تحسين تجربة المستخدم على الأجهزة المحمولة
    function enhanceMobileExperience() {
        // إضافة أنماط خاصة بالأجهزة المحمولة
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                /* تحسين التنقل السفلي */
                .bottom-navbar {
                    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
                    background-color: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }
                
                .nav-item {
                    transition: all 0.3s ease;
                    position: relative;
                }
                
                .nav-item.active {
                    transform: translateY(-5px);
                }
                
                .nav-item.active:before {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    width: 5px;
                    height: 5px;
                    background-color: #3498db;
                    border-radius: 50%;
                    transform: translateX(-50%);
                }
                
                /* تحسين البطاقة للعرض المحمول */
                .investor-card {
                    max-width: 100%;
                    height: 220px;
                }
                
                .card-actions {
                    flex-wrap: wrap;
                }
                
                /* جعل الإحصائيات أكثر قابلية للقراءة */
                .stat-card {
                    min-width: calc(50% - 10px);
                    padding: 15px;
                }
                
                .stat-value {
                    font-size: 1.5rem;
                }
                
                /* تحسين النوافذ المنبثقة */
                .modal-container {
                    width: 95%;
                    max-height: 80vh;
                }
            }
            
            /* دعم الوضع الداكن */
            @media (prefers-color-scheme: dark) {
                body.auto-dark-mode {
                    background-color: #121212;
                    color: #e0e0e0;
                }
                
                body.auto-dark-mode .card-content-area,
                body.auto-dark-mode .info-tabs,
                body.auto-dark-mode .tab-content,
                body.auto-dark-mode .financial-summary,
                body.auto-dark-mode .stat-card,
                body.auto-dark-mode .bottom-navbar {
                    background-color: #1e1e2f;
                    color: #e0e0e0;
                }
                
                body.auto-dark-mode .tab-buttons {
                    background-color: #151520;
                    border-color: #252535;
                }
                
                body.auto-dark-mode .tab-btn:not(.active) {
                    color: #a0a0a0;
                }
                
                body.auto-dark-mode .tab-btn.active {
                    background-color: #1e1e2f;
                    color: #3498db;
                }
            }
        `;
        document.head.appendChild(style);
        
        // إضافة تدعيم للوضع الداكن التلقائي
        checkDarkMode();
        
        // تحسين النوافذ المنبثقة للأجهزة المحمولة
        enhanceMobileModals();
    }
    
    // تحسين النوافذ المنبثقة للأجهزة المحمولة
    function enhanceMobileModals() {
        // إضافة أنماط خاصة بالنوافذ المنبثقة على الأجهزة المحمولة
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .modal-container {
                    border-radius: 20px 20px 0 0;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    top: auto;
                    max-height: 90vh;
                    margin: 0;
                    transform: translateY(100%);
                    transition: transform 0.3s ease;
                    display: flex;
                    flex-direction: column;
                }
                
                .modal-overlay.active .modal-container {
                    transform: translateY(0);
                }
                
                .modal-header {
                    position: relative;
                    padding: 15px;
                    text-align: center;
                }
                
                .modal-header:before {
                    content: '';
                    position: absolute;
                    top: 10px;
                    left: 50%;
                    width: 40px;
                    height: 5px;
                    background-color: #ddd;
                    border-radius: 5px;
                    transform: translateX(-50%);
                }
                
                .modal-close {
                    position: absolute;
                    left: 15px;
                    top: 15px;
                }
                
                .modal-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 15px;
                    -webkit-overflow-scrolling: touch;
                }
                
                /* إضافة المزيد من مساحة التمرير */
                .modal-overlay:after {
                    content: '';
                    display: block;
                    height: 20px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // التحقق من الوضع الداكن وتطبيقه
    function checkDarkMode() {
        // التحقق إذا كان المستخدم يفضل الوضع الداكن
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('auto-dark-mode');
        }
        
        // إضافة مستمع للتغييرات في تفضيلات الوضع
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            document.body.classList.toggle('auto-dark-mode', e.matches);
        });
    }
    
    // إصلاح مشكلات التوافق بين المتصفحات
    function fixBrowserCompatibility() {
        // إضافة أنماط لدعم المتصفحات المختلفة
        const style = document.createElement('style');
        style.textContent = `
            /* إصلاحات للمتصفحات القديمة */
            .card-container {
                display: -webkit-box;
                display: -ms-flexbox;
                display: flex;
                -webkit-box-orient: vertical;
                -webkit-box-direction: normal;
                -ms-flex-direction: column;
                flex-direction: column;
                -webkit-box-align: center;
                -ms-flex-align: center;
                align-items: center;
            }
            
            /* دعم backdrop-filter */
            @supports not (backdrop-filter: blur(10px)) {
                .bottom-navbar {
                    background-color: rgba(255, 255, 255, 0.95);
                }
            }
            
            /* إصلاح للمتصفحات Safari */
            @media not all and (min-resolution:.001dpcm) { 
                @supports (-webkit-appearance:none) {
                    .pin-input {
                        -webkit-appearance: none;
                    }
                }
            }
            
            /* إصلاح للمتصفحات على نظام iOS */
            @supports (-webkit-touch-callout: none) {
                input, button, select, textarea {
                    -webkit-appearance: none;
                    border-radius: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        // إصلاح النقر المتأخر على الأجهزة المحمولة
        document.addEventListener('touchstart', function() {}, {passive: true});
    }
    
    // إضافة مستمع للأحداث الرئيسية
    function setupEventHandlers() {
        // مستمع لحدث تحديث البطاقة
        document.addEventListener('card:updated', function(event) {
            console.log('تم تحديث البطاقة');
            
            if (event.detail && event.detail.card) {
                enhanceCardDesign();
            }
        });
        
        // مستمع للإشعارات المنبثقة
        const toast = document.getElementById('toast-notification');
        if (toast) {
            const closeButton = toast.querySelector('.toast-close');
            if (closeButton) {
                closeButton.addEventListener('click', function() {
                    toast.classList.remove('show');
                });
            }
        }
        
        // مستمع لإظهار الإشعار
        document.addEventListener('show-toast', function(event) {
            if (!toast) return;
            
            const detail = event.detail || {};
            const title = detail.title || 'إشعار';
            const message = detail.message || '';
            const type = detail.type || 'info';
            
            const toastTitle = toast.querySelector('.toast-title');
            const toastMessage = toast.querySelector('.toast-message');
            
            if (toastTitle) toastTitle.textContent = title;
            if (toastMessage) toastMessage.textContent = message;
            
            // إزالة جميع فئات النوع
            toast.classList.remove('toast-info', 'toast-success', 'toast-error', 'toast-warning');
            toast.classList.add(`toast-${type}`);
            
            // إظهار الإشعار
            toast.classList.add('show');
            
            // إخفاء الإشعار تلقائياً بعد فترة
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        });
    }
})();