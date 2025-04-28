/**
 * قم بنسخ هذا الكود بالكامل واستبداله بملف JavaScript الخاص بك
 * 99999999999-1.js
 */

// متغيرات التطبيق
let scannerInitialized = false;
let currentInvestor = null;
let currentCard = null;

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة الماسح الضوئي
    initBarcodeScanner();
    
    // إضافة مستمعي الأحداث
    addEventListeners();
    
    // تأخير بدء المسح قليلاً للتأكد من تحميل كل شيء
    setTimeout(() => {
        startScanner();
    }, 500);
});

/**
 * تهيئة ماسح الباركود
 */
function initBarcodeScanner() {
    if (typeof Quagga === 'undefined') {
        console.error('مكتبة Quagga غير متاحة');
        showError('لم يتم تحميل مكتبة Quagga بشكل صحيح. يرجى تحديث الصفحة أو التحقق من اتصال الإنترنت.');
        return;
    }
    
    // إعداد زر بدء المسح
    const startScannerBtn = document.getElementById('start-scan-btn');
    if (startScannerBtn) {
        startScannerBtn.addEventListener('click', startScanner);
    }
    
    // إعداد زر تبديل الكاميرا
    const toggleCameraBtn = document.getElementById('toggle-camera-btn');
    if (toggleCameraBtn) {
        toggleCameraBtn.addEventListener('click', toggleCamera);
    }
    
    // إعداد زر تشغيل/إيقاف الفلاش
    const toggleFlashBtn = document.getElementById('toggle-flash-btn');
    if (toggleFlashBtn) {
        toggleFlashBtn.addEventListener('click', toggleFlash);
    }
    
    // إعداد زر الإدخال اليدوي
    const manualEntryBtn = document.getElementById('manual-entry-btn');
    if (manualEntryBtn) {
        manualEntryBtn.addEventListener('click', handleManualEntry);
    }
    
    // إعداد زر الطباعة
    const printDetailsBtn = document.getElementById('print-details-btn');
    if (printDetailsBtn) {
        printDetailsBtn.addEventListener('click', printInvestorDetails);
    }
    
    // إعداد زر تحديث الكاميرات
    const refreshCamerasBtn = document.getElementById('refresh-cameras-btn');
    if (refreshCamerasBtn) {
        refreshCamerasBtn.addEventListener('click', populateCameraSelect);
    }
    
    // إعداد قائمة اختيار الكاميرا
    const cameraSelect = document.getElementById('camera-select');
    if (cameraSelect) {
        cameraSelect.addEventListener('change', selectCamera);
    }
    
    // إعداد ضبط التباين
    const contrastControl = document.getElementById('contrast-control');
    if (contrastControl) {
        contrastControl.addEventListener('input', adjustContrast);
    }
    
    // إعداد زر المساعدة
    const cameraHelpBtn = document.getElementById('camera-help-btn');
    if (cameraHelpBtn) {
        cameraHelpBtn.addEventListener('click', toggleCameraHelp);
    }
    
    // التحقق من وجود API الكاميرا في المتصفح
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('المتصفح لا يدعم API الكاميرا');
        showError('المتصفح الخاص بك لا يدعم الوصول إلى الكاميرا. يرجى تجربة متصفح آخر مثل Chrome أو Firefox.');
        return;
    }
    
    // تعبئة قائمة الكاميرات المتاحة
    populateCameraSelect();
    
    // تحديث حالة الماسح
    updateScannerStatus('جاهز للمسح. انقر على "بدء المسح" للبدء.');
}

/**
 * تعبئة قائمة الكاميرات المتاحة
 */
function populateCameraSelect() {
    // تحديث حالة الماسح
    updateScannerStatus('جاري البحث عن الكاميرات المتاحة...');
    
    // التحقق من دعم enumerateDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.error('المتصفح لا يدعم enumerateDevices');
        const cameraSelectContainer = document.getElementById('camera-select-container');
        if (cameraSelectContainer) {
            cameraSelectContainer.style.display = 'none';
        }
        return;
    }
    
    // الحصول على قائمة الأجهزة المتاحة
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            // تصفية لأجهزة الفيديو فقط
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            console.log('أجهزة الكاميرا المتاحة:', videoDevices);
            
            const cameraSelectContainer = document.getElementById('camera-select-container');
            if (videoDevices.length > 0 && cameraSelectContainer) {
                // عرض حاوية اختيار الكاميرا
                cameraSelectContainer.style.display = 'flex';
                
                // الحصول على عنصر الاختيار
                const cameraSelect = document.getElementById('camera-select');
                if (cameraSelect) {
                    // حفظ القيمة المحددة حاليًا إن وجدت
                    const currentValue = cameraSelect.value;
                    
                    // مسح الخيارات الحالية
                    cameraSelect.innerHTML = '';
                    
                    // إضافة خيار افتراضي
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.text = '-- اختر الكاميرا --';
                    cameraSelect.appendChild(defaultOption);
                    
                    // إضافة كل جهاز كاميرا كخيار
                    videoDevices.forEach(device => {
                        const option = document.createElement('option');
                        option.value = device.deviceId;
                        
                        // محاولة الحصول على اسم مفيد للكاميرا
                        let label = device.label || `كاميرا ${videoDevices.indexOf(device) + 1}`;
                        
                        // تمييز الكاميرا الأمامية والخلفية
                        if (label.toLowerCase().includes('front')) {
                            label += ' (أمامية)';
                        } else if (label.toLowerCase().includes('back') || label.toLowerCase().includes('rear')) {
                            label += ' (خلفية)';
                        }
                        
                        option.text = label;
                        cameraSelect.appendChild(option);
                    });
                    
                    // إعادة تحديد القيمة السابقة إن وجدت
                    if (currentValue) {
                        cameraSelect.value = currentValue;
                    }
                }
                
                // تحديث حالة الماسح
                updateScannerStatus(`تم العثور على ${videoDevices.length} كاميرا. اختر واحدة للبدء.`);
            } else {
                // إخفاء حاوية اختيار الكاميرا إذا لم تكن هناك أجهزة
                if (cameraSelectContainer) {
                    cameraSelectContainer.style.display = 'none';
                }
                
                // تحديث حالة الماسح
                updateScannerStatus('لم يتم العثور على كاميرات متاحة.');
                showError('لم يتم العثور على كاميرات متاحة. تأكد من توصيل الكاميرا والسماح للموقع باستخدامها.');
            }
        })
        .catch(error => {
            console.error('خطأ في عرض أجهزة الكاميرا:', error);
            const cameraSelectContainer = document.getElementById('camera-select-container');
            if (cameraSelectContainer) {
                cameraSelectContainer.style.display = 'none';
            }
            
            // تحديث حالة الماسح
            updateScannerStatus('فشل في الوصول إلى الكاميرات. تحقق من الأذونات.');
        });
}

// تكملة الدوال من الجزء السابق

/**
 * اختيار كاميرا محددة (تكملة)
 */
function selectCamera() {
    // إيقاف المسح الحالي إذا كان نشطًا
    if (scannerInitialized) {
        Quagga.stop();
        scannerInitialized = false;
    }
    
    // الحصول على معرف الكاميرا المحدد
    const cameraSelect = document.getElementById('camera-select');
    const deviceId = cameraSelect ? cameraSelect.value : '';
    
    if (!deviceId) {
        // لم يتم اختيار كاميرا
        updateScannerStatus('يرجى اختيار كاميرا للمتابعة.');
        return;
    }
    
    // تحديث حالة الماسح
    updateScannerStatus('جاري تهيئة الكاميرا المحددة...');
    
    // بدء المسح بالكاميرا المحددة
    startScannerWithDeviceId(deviceId);
}

/**
 * بدء المسح باستخدام كاميرا محددة
 */
function startScannerWithDeviceId(deviceId) {
    if (scannerInitialized) {
        Quagga.stop();
        scannerInitialized = false;
    }
    
    console.log('بدء المسح باستخدام الكاميرا:', deviceId);
    
    // إعادة تعيين نتيجة المسح
    const resultElement = document.getElementById('scan-result');
    if (resultElement) {
        resultElement.textContent = '';
        resultElement.className = 'scan-result';
        resultElement.style.display = 'none';
    }
    
    // استخدام المعرف المباشر للفيديو
    const targetElement = document.getElementById('scanner-video');
    if (!targetElement) {
        console.error('لم يتم العثور على عنصر الفيديو');
        return;
    }
    
    // تحديد قارئات الرموز المتوافقة
    const compatibleReaders = ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "code_93_reader", "i2of5_reader", "2of5_reader", "codabar_reader"];
    
    // تكوين الماسح مع معرف الجهاز المحدد
    const config = {
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: targetElement,
            constraints: {
                deviceId: { exact: deviceId },
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 }
            },
            area: {
                top: "20%",
                right: "0%",
                left: "0%",
                bottom: "20%"
            }
        },
        locator: {
            patchSize: "medium",
            halfSample: true
        },
        numOfWorkers: navigator.hardwareConcurrency ? Math.min(navigator.hardwareConcurrency, 4) : 2,
        frequency: 10,
        decoder: {
            readers: compatibleReaders,
            multiple: false,
            debug: {
                drawBoundingBox: true,
                showFrequency: true,
                drawScanline: true,
                showPattern: true
            }
        },
        locate: true
    };
    
    // تهيئة Quagga مع الإعدادات الجديدة
    try {
        Quagga.init(config, (err) => {
            if (err) {
                console.error('خطأ في تهيئة Quagga:', err);
                updateScannerStatus('فشل في تهيئة الكاميرا. حاول مرة أخرى أو اختر كاميرا مختلفة.');
                return;
            }
            
            console.log('تم تهيئة Quagga بنجاح');
            
            // بدء المسح
            Quagga.start();
            scannerInitialized = true;
            
            // تسجيل مستمعي الأحداث
            Quagga.onDetected(onBarcodeDetected);
            Quagga.onProcessed(onBarcodeProcessed);
            
            // تحديث حالة الماسح
            updateScannerStatus('الماسح جاهز. ضع الباركود في منطقة المسح.');
            
            // ضبط عرض الفيديو
            adjustVideoDisplay();
        });
    } catch (error) {
        console.error('حدث خطأ أثناء تهيئة الماسح الضوئي:', error);
        updateScannerStatus('حدث خطأ غير متوقع في تهيئة الماسح الضوئي.');
    }
}

/**
 * ضبط تباين الفيديو
 */
function adjustContrast() {
    const contrastValue = document.getElementById('contrast-control')?.value || 100;
    const video = document.getElementById('scanner-video');
    
    if (video) {
        video.style.filter = `contrast(${contrastValue}%)`;
        console.log(`تم ضبط التباين إلى ${contrastValue}%`);
    }
}

/**
 * إظهار/إخفاء قسم المساعدة
 */
function toggleCameraHelp() {
    const helpContent = document.getElementById('camera-help-content');
    if (helpContent) {
        if (helpContent.classList.contains('visible')) {
            helpContent.classList.remove('visible');
        } else {
            helpContent.classList.add('visible');
        }
    }
}

/**
 * عرض رسالة خطأ
 */
function showError(message) {
    const resultElement = document.getElementById('scan-result');
    if (resultElement) {
        resultElement.textContent = message;
        resultElement.className = 'scan-result error';
        resultElement.style.display = 'block';
    }
}

/**
 * تحديث حالة الماسح
 */
function updateScannerStatus(message) {
    const statusText = document.getElementById('scanner-status-text');
    if (statusText) {
        statusText.textContent = message;
    } else {
        // إذا لم يتم العثور على عنصر حالة الماسح، نعرض رسالة في عنصر النتيجة
        const resultElement = document.getElementById('scan-result');
        if (resultElement) {
            resultElement.textContent = message;
            resultElement.className = 'scan-result';
            resultElement.style.display = 'block';
        }
    }
}

/**
 * إضافة مستمعي الأحداث
 */
function addEventListeners() {
    // إضافة المزيد من مستمعي الأحداث إذا لزم الأمر
    const uploadBarcodeBtn = document.getElementById('upload-barcode-btn');
    const barcodeImageInput = document.getElementById('barcode-image-input');

    if (uploadBarcodeBtn && barcodeImageInput) {
        uploadBarcodeBtn.addEventListener('click', () => {
            barcodeImageInput.click();
        });

        barcodeImageInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const image = new Image();
                    image.src = e.target.result;
                    image.onload = function() {
                        Quagga.decodeSingle({
                            src: image.src,
                            numOfWorkers: 0, // Use 0 for synchronous processing
                            decoder: {
                                readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "code_93_reader", "i2of5_reader", "2of5_reader", "codabar_reader"]
                            },
                        }, function(result) {
                            if (result && result.codeResult) {
                                onBarcodeDetected(result);
                            } else {
                                alert('لم يتمكن من قراءة الباركود من الصورة.');
                            }
                        });
                    };
                };
                reader.readAsDataURL(file);
            }
        });
    } else {
        console.error('Elements for barcode upload are missing in the DOM.');
    }

    // Ensure camera-select-container exists before accessing its style
    const cameraSelectContainer = document.getElementById('camera-select-container');
    if (cameraSelectContainer) {
        cameraSelectContainer.style.display = 'none';
    } else {
        console.error('Element camera-select-container is missing in the DOM.');
    }
}

/**
 * بدء تشغيل الماسح الضوئي
 */
function startScanner() {
    if (scannerInitialized) {
        console.log('الماسح الضوئي يعمل بالفعل');
        return;
    }
    
    // محاولة إصلاح أي مشاكل في عرض الماسح
    tryToFixScanner();
    
    console.log('جاري تهيئة الماسح الضوئي...');
    
    // إعادة تعيين نتيجة المسح
    const resultElement = document.getElementById('scan-result');
    if (resultElement) {
        resultElement.textContent = '';
        resultElement.className = 'scan-result';
        resultElement.style.display = 'none';
    }
    
    // استخدام المعرف المباشر للفيديو بدلاً من querySelector
    const targetElement = document.getElementById('scanner-video');
    if (!targetElement) {
        console.error('لم يتم العثور على عنصر الفيديو: scanner-video');
        return;
    }
    
    // تحديد قارئات الرموز المتوافقة
    const compatibleReaders = ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "code_93_reader", "i2of5_reader", "2of5_reader", "codabar_reader"];
    
    // تحديد ما إذا كان الجهاز هو كمبيوتر مكتبي أو جهاز محمول
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // تكوين مختلف للكمبيوتر المكتبي
    const config = {
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: targetElement,
            constraints: {
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                aspectRatio: { min: 1, max: 2 },
                facingMode: isMobile ? "environment" : "user" // استخدام الكاميرا الخلفية للأجهزة المحمولة
            },
            area: { // تعريف منطقة المسح في المنتصف
                top: "20%",
                right: "0%",
                left: "0%",
                bottom: "20%"
            }
        },
        locator: {
            patchSize: "medium",
            halfSample: true
        },
        numOfWorkers: navigator.hardwareConcurrency ? Math.min(navigator.hardwareConcurrency, 4) : 2,
        frequency: 10,
        decoder: {
            readers: compatibleReaders,
            multiple: false,
            debug: {
                drawBoundingBox: true,
                showFrequency: true,
                drawScanline: true,
                showPattern: true
            }
        },
        locate: true
    };
    
    try {
        // طلب الأذونات أولاً
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                // أغلق الدفق فورًا - نحن فقط نتحقق من الأذونات
                stream.getTracks().forEach(track => track.stop());
                
                // الآن نبدأ Quagga
                Quagga.init(config, (err) => {
                    if (err) {
                        console.error('خطأ في تهيئة Quagga:', err);
                        if (resultElement) {
                            resultElement.textContent = 'حدث خطأ في تهيئة الماسح الضوئي: ' + err.message || err;
                            resultElement.classList.add('error');
                            resultElement.style.display = 'block';
                            
                            // محاولة استخدام إعدادات أقل تقييدًا
                            setTimeout(() => {
                                tryAlternativeConfig();
                            }, 1000);
                        }
                        return;
                    }
                    
                    console.log('تم تهيئة Quagga بنجاح');
                    
                    Quagga.start();
                    scannerInitialized = true;
                    
                    Quagga.onDetected(onBarcodeDetected);
                    Quagga.onProcessed(onBarcodeProcessed);
                    
                    // تحسين عرض عنصر الفيديو
                    adjustVideoDisplay();
                    
                    // التحقق من حالة الفيديو بعد التهيئة
                    setTimeout(() => {
                        checkVideoInitialization();
                    }, 1000);
                });
            })
            .catch(function(error) {
                console.error('تم رفض أذونات الكاميرا:', error);
                if (resultElement) {
                    resultElement.textContent = 'يرجى السماح بالوصول إلى الكاميرا للمسح الضوئي';
                    resultElement.classList.add('error');
                    resultElement.style.display = 'block';
                }
            });
    } catch (error) {
        console.error('حدث خطأ أثناء تهيئة الماسح الضوئي:', error);
        if (resultElement) {
            resultElement.textContent = 'حدث خطأ غير متوقع في تهيئة الماسح الضوئي';
            resultElement.classList.add('error');
            resultElement.style.display = 'block';
        }
    }
}


/**
 * محاولة استخدام إعدادات بديلة للماسح الضوئي
 */
function tryAlternativeConfig() {
    console.log('محاولة استخدام إعدادات بديلة للماسح...');
    
    const resultElement = document.getElementById('scan-result');
    if (resultElement) {
        resultElement.textContent = 'محاولة استخدام إعدادات بديلة...';
        resultElement.className = 'scan-result';
        resultElement.style.display = 'block';
    }
    
    const targetElement = document.getElementById('scanner-video');
    
    // إعدادات أقل تقييدًا للكاميرا
    const simpleConfig = {
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: targetElement,
            constraints: {
                width: 640,
                height: 480,
                facingMode: "user" // استخدام الكاميرا الأمامية
            }
        },
        locator: {
            patchSize: "large",
            halfSample: true
        },
        numOfWorkers: 1,
        frequency: 5,
        decoder: {
            readers: ["code_128_reader", "ean_reader"]
        },
        locate: true
    };
    
    try {
        Quagga.init(simpleConfig, (err) => {
            if (err) {
                console.error('فشلت المحاولة البديلة:', err);
                if (resultElement) {
                    resultElement.textContent = 'فشل الاتصال بالكاميرا. يرجى التأكد من تمكين الكاميرا وإعطاء الإذن.';
                    resultElement.classList.add('error');
                }
                return;
            }
            
            console.log('تم تهيئة الإعدادات البديلة بنجاح');
            
            Quagga.start();
            scannerInitialized = true;
            
            Quagga.onDetected(onBarcodeDetected);
            Quagga.onProcessed(onBarcodeProcessed);
            
            if (resultElement) {
                resultElement.textContent = 'تم الاتصال بالكاميرا. يمكنك مسح الباركود الآن.';
                resultElement.className = 'scan-result success';
                setTimeout(() => {
                    resultElement.style.display = 'none';
                }, 2000);
            }
            
            // تحسين عرض عنصر الفيديو
            adjustVideoDisplay();
            
            // التحقق من حالة الفيديو بعد التهيئة
            setTimeout(() => {
                checkVideoInitialization();
            }, 1000);
        });
    } catch (error) {
        console.error('فشلت المحاولة البديلة بشكل غير متوقع:', error);
    }
}

/**
 * ضبط عرض الفيديو للحصول على أفضل تجربة
 */
function adjustVideoDisplay() {
    const video = document.getElementById('scanner-video');
    if (!video) {
        console.error('لم يتم العثور على عنصر الفيديو للضبط');
        return;
    }
    
    try {
        // التأكد من أن الفيديو يملأ الحاوية
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        
        // إضافة مستمع لحدث loadedmetadata للتأكد من أبعاد الفيديو الصحيحة
        video.addEventListener('loadedmetadata', function() {
            console.log('تم تحميل بيانات الفيديو (Metadata)');
            console.log('أبعاد الفيديو:', video.videoWidth, 'x', video.videoHeight);
            
            // ضبط منطقة المسح بناءً على أبعاد الفيديو الفعلية
            const scannerRegion = document.getElementById('barcode-scanner-region');
            if (scannerRegion) {
                // ضبط نسبة العرض إلى الارتفاع للحاوية لتتطابق مع الفيديو
                const videoAspect = video.videoWidth / video.videoHeight;
                if (videoAspect > 1) {
                    // فيديو عرضي
                    scannerRegion.style.height = '300px';
                } else {
                    // فيديو رأسي أو مربع
                    scannerRegion.style.height = '400px';
                }
                
                console.log('تم ضبط أبعاد منطقة المسح بناءً على نسبة العرض إلى الارتفاع:', videoAspect);
            }
            
            // إضافة معالج بصري لمنطقة المسح
            enhanceScannerVisuals();
        });
        
        // تحسين مظهر الفيديو وربما تطبيق بعض المرشحات للتعرف على الباركود بشكل أفضل
        video.style.filter = 'contrast(1.1)'; // زيادة طفيفة في التباين
        
        console.log('تم ضبط عرض الفيديو بنجاح');
    } catch (error) {
        console.error('خطأ أثناء ضبط عرض الفيديو:', error);
    }
}

/**
 * تحسين الجوانب المرئية لماسح الباركود
 */
function enhanceScannerVisuals() {
    try {
        // تحسين مظهر منطقة المسح
        const scannerRegion = document.getElementById('barcode-scanner-region');
        if (scannerRegion) {
            // إضافة إطار مميز
            scannerRegion.style.border = '2px solid #3b82f6';
            scannerRegion.style.borderRadius = '8px';
            scannerRegion.style.overflow = 'hidden';
        }
        
        // تحديث حالة الماسح ليعرف المستخدم أن الكاميرا تعمل الآن
        const resultElement = document.getElementById('scan-result');
        if (resultElement) {
            resultElement.textContent = 'الكاميرا جاهزة. ضع الباركود في منطقة المسح.';
            resultElement.className = 'scan-result success';
            resultElement.style.display = 'block';
            
            // إخفاء الرسالة بعد فترة قصيرة
            setTimeout(() => {
                resultElement.style.display = 'none';
            }, 3000);
        }
        
        console.log('تم تحسين مظهر الماسح البصري');
    } catch (error) {
        console.error('خطأ أثناء تحسين مظهر الماسح:', error);
    }
}

/**
 * التحقق من صحة تهيئة الفيديو والكاميرا
 * دالة تشخيصية للمساعدة في اكتشاف المشكلات
 */
function checkVideoInitialization() {
    const video = document.getElementById('scanner-video');
    if (!video) {
        console.error('خطأ: عنصر الفيديو غير موجود في الصفحة');
        return false;
    }
    
    if (!video.srcObject) {
        console.warn('تحذير: لم يتم تعيين srcObject للفيديو');
    }
    
    // التحقق من أبعاد الفيديو
    console.log('أبعاد عنصر الفيديو:', video.offsetWidth, 'x', video.offsetHeight);
    console.log('أبعاد الفيديو الفعلية (إذا كانت متاحة):', video.videoWidth, 'x', video.videoHeight);
    
    // حالة الفيديو
    console.log('حالة الفيديو:', {
        paused: video.paused,
        ended: video.ended,
        muted: video.muted,
        volume: video.volume,
        playbackRate: video.playbackRate
    });
    
    // التحقق من الأنماط
    console.log('أنماط الفيديو:', {
        width: video.style.width,
        height: video.style.height,
        objectFit: video.style.objectFit,
        display: window.getComputedStyle(video).display
    });
    
    return true;
}

/**
 * محاولة تشخيص وإصلاح مشاكل الماسح الضوئي
 */
function tryToFixScanner() {
    // محاولة تشخيص وإصلاح مشاكل الماسح الضوئي
    const video = document.getElementById('scanner-video');
    const scannerRegion = document.getElementById('barcode-scanner-region');
    
    if (!video || !scannerRegion) {
        console.error('عناصر الفيديو أو منطقة المسح غير موجودة');
        return false;
    }
    
    // التأكد من أن منطقة المسح مرئية
    scannerRegion.style.display = 'block';
    scannerRegion.style.visibility = 'visible';
    
    // التأكد من أن الفيديو مرئي
    video.style.display = 'block';
    video.style.visibility = 'visible';
    
    // تحسين عرض الفيديو
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    
    console.log('تم محاولة إصلاح مشاكل عرض الماسح الضوئي');
    return true;
}

/**
 * تشغيل/إيقاف الفلاش
 */
function toggleFlash() {
    try {
        if (!scannerInitialized) {
            startScanner();
            return;
        }
        
        const track = Quagga.CameraAccess.getActiveTrack();
        if (track && track.getCapabilities && track.getCapabilities().torch) {
            // التحقق من حالة الفلاش الحالية
            const currentTorch = track.getConstraints()?.advanced?.[0]?.torch || false;
            
            // تبديل حالة الفلاش
            track.applyConstraints({
                advanced: [{torch: !currentTorch}]
            })
            .then(() => {
                console.log(`تم ${!currentTorch ? 'تشغيل' : 'إيقاف'} الفلاش`);
                
                // إضافة تأثير بصري لزر الفلاش
                const flashBtn = document.getElementById('toggle-flash-btn');
                if (flashBtn) {
                    if (!currentTorch) {
                        flashBtn.innerHTML = '<i class="fas fa-bolt"></i> إيقاف الفلاش';
                        flashBtn.classList.add('active-flash');
                    } else {
                        flashBtn.innerHTML = '<i class="fas fa-bolt"></i> الفلاش';
                        flashBtn.classList.remove('active-flash');
                    }
                }
            })
            .catch(error => {
                console.error('خطأ في تبديل حالة الفلاش:', error);
            });
        } else {
            console.log('الفلاش غير متاح في هذا الجهاز');
            
            const resultElement = document.getElementById('scan-result');
            if (resultElement) {
                resultElement.textContent = 'الفلاش غير متاح في هذا الجهاز';
                resultElement.classList.add('error');
                resultElement.style.display = 'block';
                
                setTimeout(() => {
                    resultElement.style.display = 'none';
                }, 3000);
            }
        }
    } catch (error) {
        console.error('خطأ في تبديل حالة الفلاش:', error);
    }
}

/**
 * تبديل الكاميرا (الأمامية/الخلفية)
 */
function toggleCamera() {
    if (!scannerInitialized) {
        startScanner();
        return;
    }
    
    // إظهار رسالة
    const resultElement = document.getElementById('scan-result');
    if (resultElement) {
        resultElement.textContent = 'جاري تبديل الكاميرا...';
        resultElement.className = 'scan-result';
        resultElement.style.display = 'block';
    }
    
    Quagga.stop();
    scannerInitialized = false;
    
    // تبديل الكاميرا الأمامية/الخلفية
    const videoElement = document.getElementById('scanner-video');
    const currentFacingMode = videoElement.getAttribute('data-facing-mode') || 'environment';
    const newFacingMode = currentFacingMode === "environment" ? "user" : "environment";
    
    console.log(`تبديل الكاميرا من ${currentFacingMode} إلى ${newFacingMode}`);
    videoElement.setAttribute('data-facing-mode', newFacingMode);
    
    // تحديد ما إذا كان الجهاز هو كمبيوتر مكتبي أو جهاز محمول
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const config = {
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.getElementById('scanner-video'),
            constraints: {
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                facingMode: newFacingMode,
                aspectRatio: { min: 1, max: 2 }
            },
            area: { // تعريف منطقة المسح في المنتصف
                top: "20%",
                right: "0%",
                left: "0%",
                bottom: "20%"
            }
        },
        locator: {
            patchSize: "medium",
            halfSample: true
        },
        numOfWorkers: navigator.hardwareConcurrency ? Math.min(navigator.hardwareConcurrency, 4) : 2,
        frequency: 10,
        decoder: {
            readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "code_93_reader", "i2of5_reader", "2of5_reader", "codabar_reader"],
            multiple: false
        },
        locate: true
    };
    
    try {
        // التحقق من وجود الكاميرات المتاحة
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                console.log(`تم العثور على ${videoDevices.length} جهاز(أجهزة) كاميرا`);
                
                if (videoDevices.length > 0) {
                    // البدء بتهيئة Quagga مع الإعدادات الجديدة
                    Quagga.init(config, (err) => {
                        if (err) {
                            console.error('خطأ في تهيئة Quagga مع الكاميرا الجديدة:', err);
                            if (resultElement) {
                                resultElement.textContent = 'فشل تبديل الكاميرا: ' + (err.message || 'خطأ غير معروف');
                                resultElement.classList.add('error');
                            }
                            
                            // محاولة استخدام الإعدادات البديلة
                            setTimeout(() => {
                                tryAlternativeCameraConfig(newFacingMode);
                            }, 1000);
                            
                            return;
                        }
                        
                        console.log('تم تبديل الكاميرا بنجاح');
                        Quagga.start();
                        scannerInitialized = true;
                        
                        Quagga.onDetected(onBarcodeDetected);
                        Quagga.onProcessed(onBarcodeProcessed);
                        
                        if (resultElement) {
                            resultElement.textContent = 'تم تبديل الكاميرا بنجاح';
                            resultElement.classList.add('success');
                            setTimeout(() => {
                                resultElement.style.display = 'none';
                            }, 2000);
                        }
                        
                        // تحسين عرض عنصر الفيديو
                        adjustVideoDisplay();
                    });
                } else {
                    console.error('لم يتم العثور على أجهزة كاميرا');
                    if (resultElement) {
                        resultElement.textContent = 'لم يتم العثور على أجهزة كاميرا متاحة';
                        resultElement.classList.add('error');
                    }
                }
            })
            .catch(error => {
                console.error('خطأ في عرض أجهزة الكاميرا:', error);
            });
    } catch (error) {
        console.error('خطأ في تبديل الكاميرا:', error);
        if (resultElement) {
            resultElement.textContent = 'حدث خطأ أثناء محاولة تبديل الكاميرا';
            resultElement.classList.add('error');
        }
    }
}

/**
 * محاولة استخدام إعدادات بديلة للكاميرا
 */
function tryAlternativeCameraConfig(facingMode) {
    console.log('محاولة استخدام إعدادات بديلة للكاميرا...');
    
    const resultElement = document.getElementById('scan-result');
    if (resultElement) {
        resultElement.textContent = 'محاولة استخدام إعدادات بديلة للكاميرا...';
        resultElement.className = 'scan-result';
    }
    
    const targetElement = document.getElementById('scanner-video');
    
    // إعدادات أبسط للكاميرا
    const simpleConfig = {
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: targetElement,
            constraints: {
                width: 640,
                height: 480,
                facingMode: facingMode
            }
        },
        locator: {
            patchSize: "large",
            halfSample: true
        },
        numOfWorkers: 1,
        frequency: 5,
        decoder: {
            readers: ["code_128_reader", "ean_reader"]
        },
        locate: true
    };
    
    try {
        Quagga.init(simpleConfig, (err) => {
            if (err) {
                console.error('فشلت المحاولة البديلة للكاميرا:', err);
                if (resultElement) {
                    resultElement.textContent = 'تعذر استخدام الكاميرا المحددة. يرجى التحقق من إعدادات الكاميرا.';
                    resultElement.classList.add('error');
                }
                return;
            }
            
            console.log('تم تهيئة الإعدادات البديلة للكاميرا بنجاح');
            
            Quagga.start();
            scannerInitialized = true;
            
            Quagga.onDetected(onBarcodeDetected);
            Quagga.onProcessed(onBarcodeProcessed);
            
            if (resultElement) {
                resultElement.textContent = 'تم تبديل الكاميرا بنجاح (باستخدام إعدادات بديلة)';
                resultElement.classList.add('success');
                setTimeout(() => {
                    resultElement.style.display = 'none';
                }, 2000);
            }
            
            // تحسين عرض عنصر الفيديو
            adjustVideoDisplay();
        });
    } catch (error) {
        console.error('فشلت المحاولة البديلة للكاميرا بشكل غير متوقع:', error);
    }
}
