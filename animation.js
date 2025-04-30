/**
 * وظائف الرسوم المتحركة والتأثيرات البصرية لتطبيق بطاقة المستثمر
 */

// كائن الرسوم المتحركة
const Animation = {
    // تهيئة الرسوم المتحركة
    init: function() {
        console.log('تهيئة الرسوم المتحركة...');
        
        // تفعيل تأثيرات البطاقة
        this.setupCardEffects();
        
        // تفعيل تأثيرات التمرير
        this.setupScrollEffects();
        
        // تفعيل تأثيرات النقر
        this.setupClickEffects();
    },
    
    // تفعيل تأثيرات البطاقة
    setupCardEffects: function() {
        // تأثير الهولوغرام
        this.setupHologramEffect();
        
        // تأثير البريق على الشريحة
        this.setupChipGlint();
        
        // تأثير نبض الرصيد
        this.setupBalancePulse();
    },
    
    // تأثير الهولوغرام المتحرك
    setupHologramEffect: function() {
        const hologram = document.querySelector('.card-hologram');
        if (!hologram) return;
        
        // تأثير تتبع حركة الماوس
        document.addEventListener('mousemove', function(e) {
            // تنفيذ فقط إذا كانت البطاقة مرئية
            const card = document.querySelector('.investor-card');
            if (!card || !isElementInViewport(card)) return;
            
            // حساب موقع الماوس بالنسبة لنافذة العرض
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;
            
            // تعديل موضع طبقة الضوء
            hologram.style.background = `
                radial-gradient(
                    circle at ${mouseX * 100}% ${mouseY * 100}%,
                    rgba(255, 255, 255, 0.7) 0%,
                    rgba(255, 255, 255, 0) 50%
                )
            `;
        });
        
        // تأثير الدوران للأجهزة المحمولة
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', function(e) {
                // تنفيذ فقط إذا كانت البطاقة مرئية
                const card = document.querySelector('.investor-card');
                if (!card || !isElementInViewport(card)) return;
                
                // الحصول على قيم الميل
                const tiltX = e.beta; // الميل للأمام والخلف (-180 إلى 180)
                const tiltY = e.gamma; // الميل لليسار واليمين (-90 إلى 90)
                
                if (tiltX !== null && tiltY !== null) {
                    // حساب الموضع النسبي من الميل
                    const x = ((tiltY + 90) / 180); // تحويل من -90...90 إلى 0...1
                    const y = ((tiltX + 180) / 360); // تحويل من -180...180 إلى 0...1
                    
                    // تعديل موضع طبقة الضوء
                    hologram.style.background = `
                        radial-gradient(
                            circle at ${x * 100}% ${y * 100}%,
                            rgba(255, 255, 255, 0.7) 0%,
                            rgba(255, 255, 255, 0) 50%
                        )
                    `;
                }
            });
        }
    },
    
    // تأثير بريق على شريحة البطاقة
    setupChipGlint: function() {
        const chip = document.querySelector('.card-chip');
        if (!chip) return;
        
        // إضافة عنصر البريق
        const glint = document.createElement('div');
        glint.className = 'chip-glint';
        glint.style.cssText = `
            position: absolute;
            top: 0;
            left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(
                90deg,
                rgba(255, 255, 255, 0) 0%,
                rgba(255, 255, 255, 0.8) 50%,
                rgba(255, 255, 255, 0) 100%
            );
            transform: skewX(-20deg);
            animation: chip-glint-animation 5s infinite;
        `;
        
        // إضافة العنصر إلى الشريحة
        chip.style.overflow = 'hidden';
        chip.appendChild(glint);
        
        // إضافة أنماط الرسوم المتحركة
        const style = document.createElement('style');
        style.textContent = `
            @keyframes chip-glint-animation {
                0% { left: -100%; }
                20% { left: 200%; }
                100% { left: 200%; }
            }
        `;
        document.head.appendChild(style);
    },
    
    // تأثير نبض بسيط للرصيد
    setupBalancePulse: function() {
        const balanceAmount = document.querySelector('.balance-amount');
        if (!balanceAmount) return;
        
        // إضافة أنماط الرسوم المتحركة
        const style = document.createElement('style');
        style.textContent = `
            @keyframes balance-pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.03); }
                100% { transform: scale(1); }
            }
            
            .balance-pulse {
                animation: balance-pulse 2s infinite;
                transform-origin: center;
                display: inline-block;
            }
        `;
        document.head.appendChild(style);
        
        // تطبيق الفئة عند تحديث الرصيد
        const applyPulseEffect = function() {
            balanceAmount.classList.add('balance-pulse');
            
            // إزالة التأثير بعد فترة
            setTimeout(() => {
                balanceAmount.classList.remove('balance-pulse');
            }, 6000);
        };
        
        // تطبيق عند تحميل الصفحة
        setTimeout(applyPulseEffect, 2000);
        
        // مراقبة التغييرات في محتوى العنصر
        let observer = new MutationObserver(applyPulseEffect);
        observer.observe(balanceAmount, { childList: true });
    },
    
    // تفعيل تأثيرات التمرير
    setupScrollEffects: function() {
        // الحصول على جميع عناصر البيانات
        const dataItems = document.querySelectorAll('.data-item');
        
        // إضافة تأثير ظهور تدريجي عند التمرير
        if (dataItems.length > 0) {
            // إنشاء متتبع التقاطع
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // إضافة فئة الظهور عند الوصول للعنصر
                        entry.target.classList.add('fade-in');
                        // إيقاف متابعة العنصر بعد ظهوره
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                root: null,
                threshold: 0.1, // 10% من العنصر ظاهر
                rootMargin: '0px'
            });
            
            // إضافة أنماط الرسوم المتحركة
            const style = document.createElement('style');
            style.textContent = `
                .data-item {
                    opacity: 0;
                    transform: translateY(20px);
                    transition: opacity 0.5s ease, transform 0.5s ease;
                }
                
                .data-item.fade-in {
                    opacity: 1;
                    transform: translateY(0);
                }
            `;
            document.head.appendChild(style);
            
            // بدء مراقبة العناصر
            dataItems.forEach(item => {
                observer.observe(item);
            });
        }
    },
    
    // تفعيل تأثيرات النقر
    setupClickEffects: function() {
        // تأثير تموج عند النقر
        const buttons = document.querySelectorAll('.btn, .card-action-btn, .nav-item, .share-option');
        
        // إضافة أنماط الرسوم المتحركة
        const style = document.createElement('style');
        style.textContent = `
            @keyframes button-ripple {
                0% {
                    transform: scale(0);
                    opacity: 1;
                }
                100% {
                    transform: scale(1.5);
                    opacity: 0;
                }
            }
            
            .ripple {
                position: absolute;
                border-radius: 50%;
                background-color: rgba(255, 255, 255, 0.4);
                pointer-events: none;
                z-index: 10;
            }
        `;
        document.head.appendChild(style);
        
        // إضافة تأثير التموج لكل زر
        buttons.forEach(button => {
            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            
            button.addEventListener('click', function(e) {
                // إنشاء عنصر التموج
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                
                // حساب الحجم المطلوب (1.5x عرض الزر)
                const size = Math.max(this.offsetWidth, this.offsetHeight) * 1.5;
                ripple.style.width = size + 'px';
                ripple.style.height = size + 'px';
                
                // تحديد موقع النقرة بالنسبة للزر
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // تعيين موقع التموج (مع مراعاة نصف حجم التموج)
                ripple.style.left = (x - size / 2) + 'px';
                ripple.style.top = (y - size / 2) + 'px';
                
                // إضافة التموج إلى الزر
                this.appendChild(ripple);
                
                // إزالة التموج بعد انتهاء الرسم المتحرك
                ripple.style.animation = 'button-ripple 0.6s linear';
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }
};

// دالة مساعدة للتحقق مما إذا كان العنصر مرئياً في نافذة العرض
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// تهيئة الرسوم المتحركة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    Animation.init();
});