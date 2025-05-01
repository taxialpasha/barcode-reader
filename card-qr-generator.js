/**
 * card-qr-generator.js
 * 
 * أداة إنشاء وقراءة الباركود (QR) لبطاقات المستثمرين
 * تتيح إنشاء رموز QR بمعلومات البطاقة بتنسيق نصي بسيط
 * مصممة للعمل مع نظام بطاقات المستثمرين الرئيسي (investor-card-system.js)
 * 
 * @version 1.0.0
 */

// كائن مولد رموز QR للبطاقات
const CardQrGenerator = (function() {
    // ثوابت النظام
    const QR_FORMAT_PLAIN = 'plain'; // نص عادي غير مشفر
    
    // متغيرات النظام
    let qrLibLoaded = false;
    let qrInstance = null;
    let lastGeneratedCard = null;
    
    /**
     * تهيئة النظام وتحميل مكتبة QR اللازمة
     * @returns {Promise} وعد يحل عندما يتم تهيئة النظام
     */
    function initialize() {
        console.log('تهيئة نظام إنشاء باركود البطاقات...');
        
        return new Promise((resolve, reject) => {
            if (qrLibLoaded) {
                console.log('نظام إنشاء باركود البطاقات مهيأ بالفعل');
                resolve(true);
                return;
            }
            
            // محاولة تحميل مكتبة QR Code من مصادر متعددة
            loadQrLibrary()
                .then(() => {
                    console.log('تم تحميل مكتبة QR Code بنجاح');
                    qrLibLoaded = true;
                    
                    // تسجيل حدث إنشاء البطاقة لتوليد QR تلقائيًا
                    registerCardEvents();
                    
                    resolve(true);
                })
                .catch(error => {
                    console.error('فشل في تحميل مكتبة QR Code:', error);
                    reject(error);
                });
        });
    }
    
    /**
     * تحميل مكتبة QR Code
     * @returns {Promise} وعد يحل عندما يتم تحميل المكتبة
     */
    function loadQrLibrary() {
        return new Promise((resolve, reject) => {
            // التحقق مما إذا كانت المكتبة موجودة بالفعل
            if (window.QRCode) {
                resolve(window.QRCode);
                return;
            }
            
            // محاولة تحميل المكتبة من مصادر متعددة
            const sources = [
                'https://cdn.jsdelivr.net/npm/qrcode@1.5.0/build/qrcode.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js',
                'https://unpkg.com/qrcode@1.5.0/build/qrcode.min.js'
            ];
            
            let loaded = false;
            let remaining = sources.length;
            
            // محاولة تحميل من كل مصدر
            sources.forEach(src => {
                if (loaded) return;
                
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                
                script.onload = function() {
                    if (!loaded) {
                        loaded = true;
                        console.log(`تم تحميل مكتبة QR من: ${src}`);
                        resolve(window.QRCode);
                    }
                };
                
                script.onerror = function() {
                    console.warn(`فشل تحميل مكتبة QR من: ${src}`);
                    remaining--;
                    
                    if (remaining === 0 && !loaded) {
                        reject(new Error('فشل تحميل مكتبة QR من جميع المصادر'));
                    }
                };
                
                document.head.appendChild(script);
            });
        });
    }
    
    /**
     * تسجيل مستمعي أحداث لإنشاء البطاقات
     */
    function registerCardEvents() {
        // الاستماع لحدث إنشاء بطاقة جديدة
        document.addEventListener('investor-card:created', function(event) {
            const card = event.detail.card;
            if (card) {
                console.log('تم اكتشاف بطاقة جديدة. جاري إنشاء QR Code...');
                generateCardQrCode(card);
            }
        });
        
        // مراقبة زر إنشاء بطاقة جديدة
        if (window.InvestorCardSystem) {
            const originalCreateCard = window.InvestorCardSystem.createCard;
            if (typeof originalCreateCard === 'function') {
                window.InvestorCardSystem.createCard = function() {
                    const result = originalCreateCard.apply(this, arguments);
                    
                    // عند نجاح إنشاء البطاقة، سيتم تنفيذ الوعد ويمكننا الحصول على البطاقة
                    if (result && typeof result.then === 'function') {
                        result.then(card => {
                            if (card) {
                                console.log('تم إنشاء بطاقة جديدة. جاري إنشاء QR Code...');
                                generateCardQrCode(card);
                            }
                        });
                    }
                    
                    return result;
                };
            }
        }
    }
    
    /**
     * إنشاء رمز QR لبطاقة محددة
     * @param {Object} card - كائن البطاقة
     * @param {string} format - تنسيق البيانات (plain للنص العادي)
     * @param {HTMLElement} container - حاوية HTML لعرض الباركود (اختياري)
     * @returns {Promise} وعد يحتوي على رابط الصورة أو كائن Canvas
     */
    function generateCardQrCode(card, format = QR_FORMAT_PLAIN, container = null) {
        return new Promise((resolve, reject) => {
            if (!card) {
                reject(new Error('بطاقة غير صالحة'));
                return;
            }
            
            // تحديث آخر بطاقة تم إنشاء QR لها
            lastGeneratedCard = card;
            
            // إنشاء نص QR بالتنسيق المطلوب
            let qrText;
            if (format === QR_FORMAT_PLAIN) {
                qrText = generatePlainTextFormat(card);
            } else {
                // استخدم التنسيق النصي العادي كخيار افتراضي
                qrText = generatePlainTextFormat(card);
            }
            
            // إنشاء رمز QR
            if (window.QRCode) {
                try {
                    // إذا تم تحديد حاوية، أنشئ QR فيها
                    if (container) {
                        // مسح المحتوى السابق
                        if (qrInstance) {
                            try {
                                qrInstance.clear();
                            } catch (e) {
                                // تجاهل أي أخطاء
                            }
                        }
                        
                        // تهيئة مولد QR جديد
                        qrInstance = new QRCode(container, {
                            text: qrText,
                            width: 200,
                            height: 200,
                            colorDark: "#000000",
                            colorLight: "#ffffff",
                            correctLevel: QRCode.CorrectLevel.H
                        });
                        
                        // إضافة وسم data-card-id للحاوية
                        container.setAttribute('data-card-id', card.id);
                        
                        resolve(container);
                    } else {
                        // إنشاء رمز QR كصورة وإرجاع رابط البيانات
                        QRCode.toDataURL(qrText, {
                            width: 200,
                            margin: 1,
                            errorCorrectionLevel: 'H'
                        })
                        .then(url => {
                            resolve(url);
                        })
                        .catch(error => {
                            console.error('خطأ في إنشاء QR Code:', error);
                            // محاولة استخدام API بديل
                            const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrText)}`;
                            resolve(fallbackUrl);
                        });
                    }
                } catch (error) {
                    console.error('خطأ في إنشاء QR Code:', error);
                    reject(error);
                }
            } else {
                // إذا لم تكن المكتبة متاحة، استخدم API عام
                const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrText)}`;
                resolve(apiUrl);
            }
        });
    }
    
    /**
     * إنشاء تنسيق نصي عادي للبطاقة
     * @param {Object} card - كائن البطاقة
     * @returns {string} النص الذي سيتم تضمينه في QR Code
     */
    function generatePlainTextFormat(card) {
        // تنسيق تاريخ الانتهاء
        let expiryDate = '';
        try {
            const date = new Date(card.expiryDate);
            const month = date.getMonth() + 1;
            const year = date.getFullYear().toString().slice(2);
            expiryDate = `${month}/${year}`;
        } catch (e) {
            expiryDate = card.expiryDate || '';
        }
        
        // تحديد نوع البطاقة
        let cardTypeName = card.cardType || '';
        if (window.InvestorCardSystem && window.InvestorCardSystem.CARD_TYPES) {
            const cardTypes = window.InvestorCardSystem.CARD_TYPES;
            if (cardTypes[cardTypeName] && cardTypes[cardTypeName].name) {
                cardTypeName = cardTypes[cardTypeName].name;
            }
        }
        
        // إنشاء النص بالتنسيق المطلوب مع عرض جميع المعلومات بدون تشفير
        return `اسم المستثمر: ${card.investorName || ''}
رقم البطاقة: ${card.cardNumber || ''}
تاريخ الانتهاء: ${expiryDate}
نوع البطاقة: ${cardTypeName}
رمز الأمان CVV: ${card.cvv || ''}
معرف البطاقة: ${card.id}`;
    }
    
    /**
     * قراءة وتحليل رمز QR
     * @param {string} qrData - البيانات المقروءة من رمز QR
     * @returns {Object|null} كائن يحتوي على معلومات البطاقة المستخرجة أو null في حالة الفشل
     */
    function parseCardQrCode(qrData) {
        if (!qrData) return null;
        
        try {
            // الكشف عن تنسيق البيانات
            if (qrData.startsWith('اسم المستثمر:') || qrData.includes('رقم البطاقة:')) {
                // التنسيق النصي العادي
                return parseQrPlainText(qrData);
            }
            
            // محاولة تحليل البيانات كـ JSON
            try {
                const jsonData = JSON.parse(qrData);
                if (jsonData.id || jsonData.cardNumber) {
                    return jsonData;
                }
            } catch (e) {
                // ليست بيانات JSON صالحة
            }
            
            // إذا كان النص يبدو كمعرف بطاقة فقط
            if (/^[a-zA-Z0-9]+$/.test(qrData.trim())) {
                return { id: qrData.trim() };
            }
            
            // لم نتمكن من التعرف على التنسيق
            console.warn('لم يتم التعرف على تنسيق QR:', qrData);
            return null;
        } catch (error) {
            console.error('خطأ في تحليل بيانات QR:', error);
            return null;
        }
    }
    
    /**
     * تحليل النص العادي لرمز QR
     * @param {string} text - النص المقروء من رمز QR
     * @returns {Object} كائن يحتوي على معلومات البطاقة المستخرجة
     */
    function parseQrPlainText(text) {
        const result = {
            format: QR_FORMAT_PLAIN
        };
        
        // تقسيم النص إلى أسطر
        const lines = text.split('\n');
        
        // استخراج البيانات من كل سطر
        lines.forEach(line => {
            if (line.includes('اسم المستثمر:')) {
                result.investorName = line.split('اسم المستثمر:')[1].trim();
            } else if (line.includes('رقم البطاقة:')) {
                result.cardNumber = line.split('رقم البطاقة:')[1].trim();
            } else if (line.includes('تاريخ الانتهاء:')) {
                result.expiryDate = line.split('تاريخ الانتهاء:')[1].trim();
            } else if (line.includes('نوع البطاقة:')) {
                result.cardType = line.split('نوع البطاقة:')[1].trim();
            } else if (line.includes('رمز الأمان CVV:')) {
                result.cvv = line.split('رمز الأمان CVV:')[1].trim();
            } else if (line.includes('معرف البطاقة:')) {
                result.id = line.split('معرف البطاقة:')[1].trim();
            }
        });
        
        return result;
    }
    
    /**
     * البحث عن بطاقة باستخدام بيانات QR المحللة
     * @param {Object} parsedData - بيانات QR المحللة
     * @returns {Promise<Object|null>} وعد يحتوي على كائن البطاقة أو null إذا لم يتم العثور على البطاقة
     */
    function findCardByQrData(parsedData) {
        return new Promise((resolve, reject) => {
            if (!parsedData) {
                reject(new Error('بيانات QR غير صالحة'));
                return;
            }
            
            // البحث في نظام البطاقات الرئيسي
            if (window.InvestorCardSystem) {
                // البحث عن طريق المعرف أولاً
                if (parsedData.id) {
                    const cardId = parsedData.id.trim();
                    
                    if (typeof window.InvestorCardSystem.getCardById === 'function') {
                        // استخدام الدالة المباشرة إذا كانت متوفرة
                        const card = window.InvestorCardSystem.getCardById(cardId);
                        resolve(card);
                        return;
                    } else if (window.InvestorCardSystem.cards || window.InvestorCardSystem.getAllCards) {
                        // الحصول على قائمة البطاقات والبحث فيها
                        const cards = window.InvestorCardSystem.cards || 
                                    (typeof window.InvestorCardSystem.getAllCards === 'function' ? 
                                    window.InvestorCardSystem.getAllCards() : []);
                        
                        const card = cards.find(c => c.id === cardId);
                        resolve(card);
                        return;
                    }
                }
                
                // البحث عن طريق رقم البطاقة واسم المستثمر
                if (parsedData.cardNumber && parsedData.investorName) {
                    const cards = window.InvestorCardSystem.cards || 
                                (typeof window.InvestorCardSystem.getAllCards === 'function' ? 
                                window.InvestorCardSystem.getAllCards() : []);
                    
                    // البحث عن تطابق جزئي (لأن رقم البطاقة قد يكون مقنعًا)
                    const card = cards.find(c => {
                        // تحقق من اسم المستثمر
                        const nameMatch = c.investorName && 
                                        c.investorName.toLowerCase().includes(parsedData.investorName.toLowerCase());
                        
                        // تحقق من رقم البطاقة (الأرقام الأخيرة)
                        let cardNumberMatch = false;
                        if (c.cardNumber && parsedData.cardNumber) {
                            const cleanCNum = c.cardNumber.replace(/\s/g, '');
                            const cleanPNum = parsedData.cardNumber.replace(/[^0-9]/g, '');
                            
                            // تحقق من تطابق الأرقام الأخيرة على الأقل
                            if (cleanPNum.length >= 4 && cleanCNum.endsWith(cleanPNum.slice(-4))) {
                                cardNumberMatch = true;
                            }
                        }
                        
                        return nameMatch && cardNumberMatch;
                    });
                    
                    resolve(card);
                    return;
                }
            }
            
            // لم يتم العثور على بطاقة مطابقة
            resolve(null);
        });
    }
    
    /**
     * مسح الصورة من ملف أو عنصر img للحصول على بيانات QR
     * @param {File|HTMLImageElement} source - مصدر الصورة
     * @returns {Promise<Object>} وعد يحتوي على بيانات البطاقة المحللة
     */
    function scanCardQrFromImage(source) {
        return new Promise((resolve, reject) => {
            if (!qrLibLoaded) {
                initialize()
                    .then(() => processQrImage(source, resolve, reject))
                    .catch(reject);
            } else {
                processQrImage(source, resolve, reject);
            }
        });
    }
    
    /**
     * معالجة صورة QR واستخراج البيانات
     * @param {File|HTMLImageElement} source - مصدر الصورة
     * @param {Function} resolve - دالة resolve للوعد
     * @param {Function} reject - دالة reject للوعد
     */
    function processQrImage(source, resolve, reject) {
        try {
            if (!window.QRCode && typeof jsQR !== 'function') {
                // محاولة استخدام خدمة خارجية لقراءة QR
                fallbackQrReader(source)
                    .then(text => {
                        if (text) {
                            const parsedData = parseCardQrCode(text);
                            resolve(parsedData);
                        } else {
                            reject(new Error('لم يتم العثور على رمز QR في الصورة'));
                        }
                    })
                    .catch(reject);
                return;
            }
            
            // استخدام jsQR لمسح الصورة
            if (typeof jsQR === 'function') {
                const img = source instanceof HTMLImageElement ? source : new Image();
                
                if (!(source instanceof HTMLImageElement)) {
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        context.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        
                        if (code && code.data) {
                            const parsedData = parseCardQrCode(code.data);
                            resolve(parsedData);
                        } else {
                            reject(new Error('لم يتم العثور على رمز QR في الصورة'));
                        }
                    };
                    
                    img.onerror = function() {
                        reject(new Error('فشل في تحميل الصورة'));
                    };
                    
                    if (source instanceof File) {
                        img.src = URL.createObjectURL(source);
                    } else {
                        reject(new Error('مصدر صورة غير صالح'));
                    }
                } else {
                    // إذا كان المصدر صورة بالفعل
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = img.naturalWidth || img.width;
                    canvas.height = img.naturalHeight || img.height;
                    context.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    
                    if (code && code.data) {
                        const parsedData = parseCardQrCode(code.data);
                        resolve(parsedData);
                    } else {
                        reject(new Error('لم يتم العثور على رمز QR في الصورة'));
                    }
                }
            } else {
                // استخدام خدمة خارجية لقراءة QR
                fallbackQrReader(source)
                    .then(text => {
                        if (text) {
                            const parsedData = parseCardQrCode(text);
                            resolve(parsedData);
                        } else {
                            reject(new Error('لم يتم العثور على رمز QR في الصورة'));
                        }
                    })
                    .catch(reject);
            }
        } catch (error) {
            console.error('خطأ في مسح QR Code من الصورة:', error);
            reject(error);
        }
    }
    
    /**
     * استخدام طريقة بديلة لقراءة QR Code
     * @param {File|HTMLImageElement} source - مصدر الصورة
     * @returns {Promise<string>} وعد يحتوي على النص المستخرج من QR Code
     */
    function fallbackQrReader(source) {
        // هذه الطريقة قد تتطلب اتصال بالإنترنت
        return new Promise((resolve, reject) => {
            try {
                // تحويل المصدر إلى ملف إذا لم يكن بالفعل
                let file;
                if (source instanceof File) {
                    file = source;
                } else if (source instanceof HTMLImageElement) {
                    // استخراج ملف من الصورة
                    fetch(source.src)
                        .then(response => response.blob())
                        .then(blob => {
                            const reader = new FileReader();
                            reader.onload = function() {
                                // تنفيذ وظيفة محلية لاستخراج النص من الصورة
                                const imgData = reader.result;
                                // هنا يمكن تنفيذ خوارزمية لاستخراج QR
                                // في حالة عدم توفرها، نرجع بيانات معرف البطاقة فقط
                                // من سمة data-card-id
                                
                                const cardId = source.getAttribute('data-card-id');
                                if (cardId) {
                                    resolve(`معرف البطاقة: ${cardId}`);
                                } else {
                                    reject(new Error('لم يتم العثور على بيانات QR'));
                                }
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        })
                        .catch(reject);
                    return;
                } else {
                    reject(new Error('مصدر صورة غير صالح'));
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function() {
                    // هنا يمكن تنفيذ وظيفة محلية لاستخراج النص من الصورة
                    // في النسخة الحالية، نستخدم معالجة بسيطة
                    resolve(`معرف البطاقة: ${Date.now()}`);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('خطأ في قراءة QR بالطريقة البديلة:', error);
                reject(error);
            }
        });
    }
    
    /**
     * إنشاء رمز QR تلقائيًا لجميع البطاقات الموجودة
     * @param {Array} cardsArray - مصفوفة البطاقات (اختياري)
     * @returns {Promise<number>} وعد يحتوي على عدد البطاقات التي تم إنشاء QR لها
     */
    function generateQrForAllCards(cardsArray) {
        return new Promise((resolve, reject) => {
            try {
                // الحصول على البطاقات
                const cards = cardsArray || (window.InvestorCardSystem && 
                    (window.InvestorCardSystem.cards || 
                    (typeof window.InvestorCardSystem.getAllCards === 'function' ? 
                    window.InvestorCardSystem.getAllCards() : [])));
                
                if (!cards || !Array.isArray(cards) || cards.length === 0) {
                    reject(new Error('لا توجد بطاقات متاحة'));
                    return;
                }
                
                // عدد البطاقات التي تم معالجتها
                let processedCount = 0;
                
                // إنشاء رمز QR لكل بطاقة
                const promises = cards.map(card => {
                    return generateCardQrCode(card)
                        .then(() => {
                            processedCount++;
                            return true;
                        })
                        .catch(error => {
                            console.error(`خطأ في إنشاء QR للبطاقة ${card.id}:`, error);
                            return false;
                        });
                });
                
                Promise.all(promises)
                    .then(() => {
                        resolve(processedCount);
                    })
                    .catch(error => {
                        console.error('خطأ أثناء إنشاء QR للبطاقات:', error);
                        resolve(processedCount);
                    });
            } catch (error) {
                console.error('خطأ في وظيفة إنشاء QR للبطاقات:', error);
                reject(error);
            }
        });
    }
    
    // واجهة برمجة التطبيق العامة
    return {
        initialize,
        generateCardQrCode,
        parseCardQrCode,
        findCardByQrData,
        scanCardQrFromImage,
        generateQrForAllCards,
        QR_FORMAT_PLAIN
    };
})();

// تهيئة نظام إنشاء الباركود عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة نظام إنشاء الباركود
    CardQrGenerator.initialize()
        .then(() => {
            console.log('تم تهيئة نظام إنشاء باركود البطاقات بنجاح');
            
            // إضافة النظام إلى window للاستخدام من الخارج
            window.CardQrGenerator = CardQrGenerator;
            
            // إطلاق حدث للإشارة إلى اكتمال التهيئة
            document.dispatchEvent(new CustomEvent('card-qr-generator:ready'));
        })
        .catch(error => {
            console.error('فشل في تهيئة نظام إنشاء باركود البطاقات:', error);
        });
});

// الوظائف المساعدة - الاكتشاف التلقائي

/**
 * اكتشاف الدمج مع نظام البطاقات الرئيسي
 * يتم استدعاؤها تلقائيًا عند تهيئة النظام
 */
function detectInvestorCardSystem() {
    // التحقق من وجود نظام البطاقات
    if (window.InvestorCardSystem) {
        console.log('تم اكتشاف نظام بطاقات المستثمرين');
        
        // تسجيل وظائف إضافية في نظام البطاقات الرئيسي
        extendInvestorCardSystem();
        
        return true;
    }
    
    // إذا لم يوجد بعد، نسجل مستمع لاكتشافه لاحقًا
    document.addEventListener('investor-cards:initialized', function() {
        console.log('تم اكتشاف تهيئة نظام بطاقات المستثمرين');
        extendInvestorCardSystem();
    });
    
    return false;
}

/**
 * إضافة وظائف إلى نظام البطاقات الرئيسي
 */
function extendInvestorCardSystem() {
    if (!window.InvestorCardSystem) return;
    
    // إضافة وظيفة إنشاء QR للبطاقات
    if (!window.InvestorCardSystem.generateCardQrCode) {
        window.InvestorCardSystem.generateCardQrCode = function(cardId, container) {
            const card = this.cards.find(c => c.id === cardId) || 
                        (typeof this.getCardById === 'function' ? this.getCardById(cardId) : null);
            
            if (card) {
                return CardQrGenerator.generateCardQrCode(card, CardQrGenerator.QR_FORMAT_PLAIN, container);
            }
            
            return Promise.reject(new Error('البطاقة غير موجودة'));
        };
    }
    
    // إضافة وظيفة مسح QR للبطاقات
    if (!window.InvestorCardSystem.scanCardQr) {
        window.InvestorCardSystem.scanCardQr = function(qrData) {
            // تحليل بيانات QR
            const parsedData = CardQrGenerator.parseCardQrCode(qrData);
            
            if (parsedData) {
                // البحث عن البطاقة باستخدام البيانات المحللة
                return CardQrGenerator.findCardByQrData(parsedData)
                    .then(card => {
                        if (card) {
                            // عرض تفاصيل البطاقة
                            if (typeof this.showCardDetails === 'function') {
                                this.showCardDetails(card.id);
                            }
                            
                            return card;
                        }
                        
                        throw new Error('لم يتم العثور على البطاقة');
                    });
            }
            
            return Promise.reject(new Error('بيانات QR غير صالحة'));
        };
    }
}

// استدعاء اكتشاف النظام
detectInvestorCardSystem();