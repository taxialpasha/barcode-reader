/**
 * وظائف شاشة تسجيل الدخول لتطبيق بطاقة المستثمر
 */

// كائن تسجيل الدخول
const Login = {
    // تهيئة شاشة تسجيل الدخول
    init: function() {
        console.log('تهيئة وظائف تسجيل الدخول...');
        
        // تهيئة مستمعي الأحداث
        this.initEvents();
        
        // تهيئة تنسيق حقول الإدخال
        this.initInputFormatting();
    },
    
    // تهيئة مستمعي الأحداث
    initEvents: function() {
        // مستمع حدث نموذج تسجيل الدخول بالبطاقة
        const cardLoginForm = document.getElementById('card-login-form');
        if (cardLoginForm) {
            cardLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCardLogin();
            });
        }
        
        // مستمع حدث نموذج تسجيل الدخول بالهاتف
        const phoneLoginForm = document.getElementById('phone-login-form');
        if (phoneLoginForm) {
            phoneLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePhoneLogin();
            });
        }
        
        // تبديل تبويبات تسجيل الدخول
        this.initTabToggle();
        
        // مستمع لزر الاتصال بالدعم
        const contactSupportBtn = document.getElementById('contact-support-btn');
        if (contactSupportBtn) {
            contactSupportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof App !== 'undefined' && App.showModal) {
                    App.showModal('support-modal');
                }
            });
        }
    },
    
    // تبديل تبويبات تسجيل الدخول
    initTabToggle: function() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        if (!tabButtons.length) return;
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // تنشيط الزر المحدد
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // عرض المحتوى المناسب
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    },
    
    // تهيئة تنسيق حقول الإدخال
    initInputFormatting: function() {
        // تنسيق إدخال رقم البطاقة
        const cardNumberInput = document.getElementById('card-number');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                // استخدام دالة من card-utils إذا كانت متاحة
                if (typeof CardUtils !== 'undefined') {
                    e.target.value = CardUtils.formatCardNumber(e.target.value);
                } else {
                    // حذف أي شيء غير الأرقام
                    const cleaned = e.target.value.replace(/\D/g, '');
                    
                    // إعادة تنسيق: XXXX XXXX XXXX XXXX
                    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
                    
                    // تحديث القيمة
                    e.target.value = formatted;
                }
            });
        }
        
        // تنسيق إدخال تاريخ الانتهاء
        const cardExpiryInput = document.getElementById('card-expiry');
        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', (e) => {
                // استخدام دالة من card-utils إذا كانت متاحة
                if (typeof CardUtils !== 'undefined') {
                    e.target.value = CardUtils.formatExpiryDate(e.target.value);
                } else {
                    // حذف أي شيء غير الأرقام
                    const cleaned = e.target.value.replace(/\D/g, '');
                    
                    // تنسيق: MM/YY
                    let formatted = cleaned;
                    if (cleaned.length > 2) {
                        formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
                    }
                    
                    // تحديث القيمة
                    e.target.value = formatted;
                }
            });
        }
        
        // التعامل مع حقول PIN
        this.setupPinInputs();
    },
    
    // إعداد حقول إدخال رمز PIN
    setupPinInputs: function() {
        const pinInputs = document.querySelectorAll('.pin-input');
        if (!pinInputs.length) return;
        
        // أضف مستمع لكل حقل
        pinInputs.forEach((input, index) => {
            // عند الكتابة، انتقل إلى الحقل التالي
            input.addEventListener('input', (e) => {
                // التأكد من أن المدخل رقم فقط
                const value = e.target.value.replace(/\D/g, '');
                input.value = value.substring(0, 1);
                
                // إذا تم إدخال رقم، انتقل إلى الحقل التالي
                if (value.length === 1 && index < pinInputs.length - 1) {
                    pinInputs[index + 1].focus();
                }
                
                // تحديث قيمة PIN
                this.updatePinValue();
            });
            
            // عند الضغط على Backspace، انتقل إلى الحقل السابق
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && index > 0 && input.value === '') {
                    pinInputs[index - 1].focus();
                }
            });
        });
    },
    
    // تحديث قيمة PIN
    updatePinValue: function() {
        const pinInputs = document.querySelectorAll('.pin-input');
        const pinValue = Array.from(pinInputs).map(input => input.value).join('');
        
        // تعيين القيمة في حقل مخفي
        const cardPinInput = document.getElementById('card-pin');
        if (cardPinInput) {
            cardPinInput.value = pinValue;
        }
    },
    
    // معالجة تسجيل الدخول برقم البطاقة
    handleCardLogin: function() {
        // الحصول على القيم
        const cardNumber = document.getElementById('card-number').value;
        const cardExpiry = document.getElementById('card-expiry').value;
        
        // التحقق من صحة المدخلات
        if (!cardNumber || !cardExpiry) {
            this.showLoginError('يرجى ملء جميع الحقول المطلوبة');
            return;
        }
        
        // عرض حقل CVV أو PIN للتحقق
        const cvvGroup = document.getElementById('cvv-group');
        const pinGroup = document.getElementById('pin-group');
        
        if (cvvGroup.style.display !== 'none') {
            // التحقق من CVV
            const cardCvv = document.getElementById('card-cvv').value;
            
            if (!cardCvv) {
                this.showLoginError('يرجى إدخال رمز الحماية CVV');
                return;
            }
            
            // إذا كان CVV صحيح، اعرض حقل PIN
            // هنا نستخدم CVV بيانات تجريبية
            if (cardCvv === '123') {
                cvvGroup.style.display = 'none';
                pinGroup.style.display = 'block';
                
                // تركيز على أول حقل PIN
                document.querySelector('.pin-input').focus();
            } else {
                this.showLoginError('رمز الحماية CVV غير صحيح');
            }
        } else {
            // التحقق من PIN
            const cardPin = document.getElementById('card-pin').value;
            
            if (cardPin.length !== 4) {
                this.showLoginError('يرجى إدخال رمز PIN المكون من 4 أرقام');
                return;
            }
            
            // إذا كان PIN صحيح، قم بتسجيل الدخول
            // هنا نستخدم PIN بيانات تجريبية
            if (cardPin === '1234') {
                if (typeof App !== 'undefined') {
                    // استدعاء دالة تسجيل الدخول من كائن التطبيق الرئيسي
                    App.doLogin({
                        loginMethod: 'card',
                        cardNumber: cardNumber
                    });
                } else {
                    alert('تم تسجيل الدخول بنجاح');
                }
            } else {
                this.showLoginError('رمز PIN غير صحيح');
            }
        }
    },
    
    // معالجة تسجيل الدخول برقم الهاتف
    handlePhoneLogin: function() {
        // الحصول على القيم
        const phoneNumber = document.getElementById('phone-number').value;
        const investorName = document.getElementById('investor-name').value;
        
        // التحقق من صحة المدخلات
        if (!phoneNumber || !investorName) {
            this.showLoginError('يرجى ملء جميع الحقول المطلوبة', 'phone-login-error');
            return;
        }
        
        // التحقق من صحة البيانات (بيانات تجريبية)
        if (typeof App !== 'undefined') {
            // استدعاء دالة تسجيل الدخول من كائن التطبيق الرئيسي
            App.doLogin({
                loginMethod: 'phone',
                phoneNumber: phoneNumber,
                name: investorName
            });
        } else {
            alert('تم تسجيل الدخول بنجاح');
        }
    },
    
    // إظهار رسالة خطأ تسجيل الدخول
    showLoginError: function(message, elementId = 'login-error') {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // إخفاء الرسالة بعد 3 ثوان
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 3000);
        }
    }
};

// تهيئة شاشة تسجيل الدخول عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    Login.init();
});