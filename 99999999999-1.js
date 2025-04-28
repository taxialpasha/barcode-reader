// متغيرات التطبيق
let scannerInitialized = false;
let currentInvestor = null;
let currentCard = null;

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تأكد من وجود عنصر الفيديو
    const videoElement = document.getElementById('scanner-video');
    if (!videoElement) {
        console.error('عنصر الفيديو غير موجود في الصفحة');
    } else {
        console.log('تم العثور على عنصر الفيديو بنجاح');
    }

    // تهيئة الماسح الضوئي
    initBarcodeScanner();

    // إضافة مستمعي الأحداث
    addEventListeners();

    // بدء المسح تلقائيًا بعد تأخير قصير
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
        document.getElementById('camera-select-container').style.display = 'none';
        return;
    }

    // الحصول على قائمة الأجهزة المتاحة
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            // تصفية لأجهزة الفيديو فقط
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            console.log('أجهزة الكاميرا المتاحة:', videoDevices);

            if (videoDevices.length > 0) {
                // عرض حاوية اختيار الكاميرا
                document.getElementById('camera-select-container').style.display = 'flex';

                // الحصول على عنصر الاختيار
                const cameraSelect = document.getElementById('camera-select');

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

                // تحديث حالة الماسح
                updateScannerStatus(`تم العثور على ${videoDevices.length} كاميرا. اختر واحدة للبدء.`);
            } else {
                // إخفاء حاوية اختيار الكاميرا إذا لم تكن هناك أجهزة
                document.getElementById('camera-select-container').style.display = 'none';

                // تحديث حالة الماسح
                updateScannerStatus('لم يتم العثور على كاميرات متاحة.');
                showError('لم يتم العثور على كاميرات متاحة. تأكد من توصيل الكاميرا والسماح للموقع باستخدامها.');
            }
        })
        .catch(error => {
            console.error('خطأ في عرض أجهزة الكاميرا:', error);
            document.getElementById('camera-select-container').style.display = 'none';

            // تحديث حالة الماسح
            updateScannerStatus('فشل في الوصول إلى الكاميرات. تحقق من الأذونات.');
        });
}

/**
 * اختيار كاميرا محددة
 */
function selectCamera() {
    // إيقاف المسح الحالي إذا كان نشطًا
    if (scannerInitialized) {
        Quagga.stop();
        scannerInitialized = false;
    }

    // الحصول على معرف الكاميرا المحدد
    const cameraSelect = document.getElementById('camera-select');
    const deviceId = cameraSelect.value;

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
 * بدء تشغيل الماسح الضوئي
 */
function startScanner() {
    if (scannerInitialized) {
        console.log('الماسح الضوئي يعمل بالفعل');
        return;
    }

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
        });
    } catch (error) {
        console.error('فشلت المحاولة البديلة بشكل غير متوقع:', error);
    }
}

/**
 * ضبط تباين الفيديو
 */
function adjustContrast() {
    const contrastValue = document.getElementById('contrast-control').value;
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
 * معالجة الباركود المكتشف
 */
function onBarcodeDetected(result) {
    console.log('تم اكتشاف رمز:', result);

    // التحقق من معدل الثقة في القراءة
    const confidence = result.codeResult.confidence;
    const code = result.codeResult.code;

    // سجل التفاصيل للتشخيص
    console.log(`الرمز: ${code}, الثقة: ${confidence}`);

    // نقبل فقط الباركود بمستوى ثقة أعلى من 75 بالنسبة لأجهزة الكمبيوتر
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const minimumConfidence = isMobile ? 65 : 75; // مستوى ثقة أقل للأجهزة المحمولة

    if (code && confidence > minimumConfidence) {
        // إيقاف المسح بعد اكتشاف الرمز
        Quagga.stop();
        scannerInitialized = false;

        // عرض نتيجة المسح
        const resultElement = document.getElementById('scan-result');
        if (resultElement) {
            resultElement.textContent = `تم العثور على الرمز: ${code} (الثقة: ${confidence.toFixed(1)}%)`;
            resultElement.classList.add('success');
            resultElement.style.display = 'block';
        }

        // تشغيل صوت النجاح إذا كان متاحًا
        playSuccessSound();

        // اهتزاز الجهاز إذا كان مدعومًا (للأجهزة المحمولة)
        if (navigator.vibrate && isMobile) {
            navigator.vibrate(100);
        }

        // البحث عن بيانات المستثمر
        findInvestorByBarcode(code);
    } else if (code) {
        // الباركود تم اكتشافه ولكن مستوى الثقة منخفض - استمر في المسح
        console.log(`تم اكتشاف باركود بمستوى ثقة منخفض: ${confidence}`);

        // يمكن إضافة إشارة بصرية هنا لإظهار أن الماسح اكتشف شيئًا ولكنه يحتاج إلى وضوح أفضل
        const resultElement = document.getElementById('scan-result');
        if (resultElement) {
            resultElement.textContent = `تم اكتشاف رمز - يرجى الإمساك بثبات للحصول على قراءة أفضل`;
            resultElement.className = 'scan-result';
            resultElement.style.display = 'block';

            // إخفاء الرسالة بعد فترة قصيرة
            setTimeout(() => {
                resultElement.style.display = 'none';
            }, 1500);
        }
    }
}

/**
 * تشغيل صوت نجاح عند اكتشاف الباركود
 */
function playSuccessSound() {
    try {
        // إنشاء سياق الصوت
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // إنشاء مذبذب
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // إعداد المذبذب
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(2200, audioContext.currentTime + 0.1);

        // تعديل الصوت للحصول على صفير قصير
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        // توصيل وتشغيل
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
        console.log('لم يتمكن من تشغيل صوت النجاح', error);
    }
}

/**
 * معالجة صور الماسح الضوئي
 */
function onBarcodeProcessed(result) {
    const drawingCtx = Quagga.canvas.ctx.overlay;
    const drawingCanvas = Quagga.canvas.dom.overlay;

    if (result && drawingCtx && drawingCanvas) {
        // مسح المنطقة قبل الرسم
        drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));

        // رسم جميع الصناديق المكتشفة
        if (result.boxes) {
            result.boxes.filter(function(box) {
                return box !== result.box;
            }).forEach(function(box) {
                Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {color: "rgba(0, 255, 0, 0.3)", lineWidth: 2});
            });
        }

        // رسم الصندوق الرئيسي الذي تم اكتشافه بلون مختلف
        if (result.box) {
            Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {color: "rgba(0, 0, 255, 0.7)", lineWidth: 2});
        }

        // رسم خط على الرمز المكتشف
        if (result.codeResult && result.codeResult.code) {
            const confidence = result.codeResult.confidence;

            // تغيير لون الخط بناءً على مستوى الثقة
            let lineColor = "rgba(255, 0, 0, 0.7)"; // أحمر افتراضي

            if (confidence > 90) {
                lineColor = "rgba(0, 255, 0, 0.7)"; // أخضر لمستوى ثقة عالي
            } else if (confidence > 70) {
                lineColor = "rgba(255, 255, 0, 0.7)"; // أصفر لمستوى ثقة متوسط
            }

            Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {color: lineColor, lineWidth: 3});

            // إضافة نص يعرض مستوى الثقة
            if (result.box) {
                drawingCtx.font = "14px Arial";
                drawingCtx.fillStyle = lineColor;
                drawingCtx.fillText(`${confidence.toFixed(1)}%`, result.box[0][0] + 10, result.box[0][1] - 10);
            }
        }

        // رسم مربع التركيز في منتصف المنطقة للمساعدة في التوجيه
        const canvas_width = drawingCanvas.width;
        const canvas_height = drawingCanvas.height;
        const focus_size = Math.min(canvas_width, canvas_height) * 0.6;

        drawingCtx.beginPath();
        drawingCtx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        drawingCtx.lineWidth = 2;
        drawingCtx.rect(
            (canvas_width - focus_size) / 2,
            (canvas_height - focus_size) / 2,
            focus_size,
            focus_size
        );
        drawingCtx.stroke();
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
        });
    } catch (error) {
        console.error('فشلت المحاولة البديلة للكاميرا بشكل غير متوقع:', error);
    }
};

/**
 * البحث عن بيانات المستثمر بواسطة رمز الباركود
 */
function findInvestorByBarcode(code) {
    console.log('البحث عن بيانات المستثمر برمز:', code);

    // محاولة استخراج معرف المستثمر من الرمز
    let investorId = '';
    let cardNumber = '';

    if (code.includes('INVESTOR:')) {
        // استخراج معرف المستثمر من الرمز المنسق
        const parts = code.split('|');
        for (const part of parts) {
            if (part.startsWith('INVESTOR:')) {
                investorId = part.replace('INVESTOR:', '');
            }
            if (part.startsWith('CARD:')) {
                cardNumber = part.replace('CARD:', '');
            }
        }
    } else {
        // محاولة استخدام الرمز مباشرة
        investorId = code;
    }

    // محاولة العثور على بيانات المستثمر في المخزن المحلي
    const storedInvestors = getLocalInvestors();
    const storedCards = getLocalCards();

    let investor = null;
    let card = null;

    // البحث عن المستثمر بالمعرف
    if (investorId) {
        investor = storedInvestors.find(inv => inv.id === investorId);
    }

    // البحث عن البطاقة برقم البطاقة أو الرمز الشريطي
    if (cardNumber || code) {
        card = storedCards.find(c => 
            c.cardNumber === cardNumber || 
            c.barcode === code ||
            (c.cardNumber && code.includes(c.cardNumber))
        );

        // إذا وجدنا البطاقة ولم نجد المستثمر، نبحث عن المستثمر بواسطة معرف البطاقة
        if (card && !investor) {
            investor = storedInvestors.find(inv => inv.id === card.investorId);
        }
    }

    // عرض نتيجة البحث
    if (investor) {
        displayInvestorDetails(investor, card);
    } else {
        showNotFound(code);

        // إعادة تشغيل الماسح بعد فترة
        setTimeout(() => {
            startScanner();
        }, 5000);
    }
}

/**
 * عرض تفاصيل المستثمر
 */
function displayInvestorDetails(investor, card) {
    currentInvestor = investor;
    currentCard = card;

    console.log('عرض بيانات المستثمر:', investor);

    // تحديث عناصر واجهة المستخدم
    document.getElementById('investor-name').textContent = investor.name || '-';
    document.getElementById('investor-id').textContent = `معرف المستثمر: ${investor.id}`;
    document.getElementById('investor-phone').textContent = investor.phone || '-';
    document.getElementById('investor-address').textContent = investor.address || '-';
    document.getElementById('investor-email').textContent = investor.email || '-';
    document.getElementById('investor-join-date').textContent = formatDate(investor.joinDate || investor.createdAt);

    // حساب إجمالي الاستثمار والربح
    const totalInvestment = investor.amount || 0;
    document.getElementById('investor-total-investment').textContent = formatCurrency(totalInvestment);

    // حساب الربح المتوقع
    let monthlyProfit = 0;
    if (investor.investments && Array.isArray(investor.investments)) {
        monthlyProfit = investor.investments.reduce((total, inv) => {
            const rate = 0.175; // معدل الربح الشهري الافتراضي (17.5%)
            return total + (inv.amount * rate);
        }, 0);
    } else {
        // استخدام إجمالي الاستثمار لحساب الربح
        monthlyProfit = totalInvestment * 0.175; // 17.5% شهريًا
    }
    document.getElementById('investor-monthly-profit').textContent = formatCurrency(monthlyProfit);

    // تاريخ آخر استثمار
    let lastInvestmentDate = '-';
    if (investor.investments && investor.investments.length > 0) {
        const sortedInvestments = [...investor.investments].sort((a, b) => new Date(b.date) - new Date(a.date));
        lastInvestmentDate = formatDate(sortedInvestments[0].date);
    }
    document.getElementById('investor-last-investment-date').textContent = lastInvestmentDate;

    // حالة المستثمر
    const statusElement = document.getElementById('investor-status');
    statusElement.textContent = investor.active !== false ? 'نشط' : 'غير نشط';
    statusElement.className = 'info-value ' + (investor.active !== false ? 'active' : 'inactive');

    // عرض بيانات البطاقة إذا كانت متاحة
    if (card) {
        // تحويل تاريخ الانتهاء إلى الصيغة المناسبة
        const expiryDate = new Date(card.expiryDate);
        const expMonth = (expiryDate.getMonth() + 1).toString().padStart(2, '0');
        const expYear = expiryDate.getFullYear().toString().substr(2);

        document.getElementById('investor-card-number').textContent = formatCardNumber(card.cardNumber);
        document.getElementById('investor-card-name').textContent = card.englishName || 'INVESTOR NAME';
        document.getElementById('investor-card-expiry').textContent = `VALID ${expMonth}/${expYear}`;

        // تغيير نوع البطاقة (اللون والنمط)
        const cardElement = document.getElementById('investor-card');
        cardElement.className = `investor-card ${card.cardType || 'default'}`;
    }

    // إظهار قسم التفاصيل
    document.getElementById('investor-details').classList.add('active');
}

/**
 * عرض رسالة عدم العثور على المستثمر
 */
function showNotFound(code) {
    const resultElement = document.getElementById('scan-result');
    if (resultElement) {
        resultElement.textContent = `لم يتم العثور على مستثمر بالرمز: ${code}`;
        resultElement.classList.remove('success');
        resultElement.classList.add('error');
        resultElement.style.display = 'block';
    }

    // إخفاء تفاصيل المستثمر السابقة
    document.getElementById('investor-details').classList.remove('active');
}

/**
 * طباعة تفاصيل المستثمر
 */
function printInvestorDetails() {
    if (!currentInvestor) {
        return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('يرجى السماح بفتح النوافذ المنبثقة للطباعة');
        return;
    }

    const investor = currentInvestor;
    const card = currentCard;

    // إجمالي الاستثمار والربح
    const totalInvestment = investor.amount || 0;
    let monthlyProfit = totalInvestment * 0.175; // 17.5% شهريًا

    // تاريخ آخر استثمار
    let lastInvestmentDate = '-';
    if (investor.investments && investor.investments.length > 0) {
        const sortedInvestments = [...investor.investments].sort((a, b) => new Date(b.date) - new Date(a.date));
        lastInvestmentDate = formatDate(sortedInvestments[0].date);
    }

    // معلومات البطاقة
    let cardInfo = '';
    if (card) {
        const expiryDate = new Date(card.expiryDate);
        const expMonth = (expiryDate.getMonth() + 1).toString().padStart(2, '0');
        const expYear = expiryDate.getFullYear().toString().substr(2);

        cardInfo = `
            <div class="print-card-info">
                <div class="info-row">
                    <div class="info-label">رقم البطاقة:</div>
                    <div class="info-value">${formatCardNumber(card.cardNumber)}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">تاريخ الإصدار:</div>
                    <div class="info-value">${formatDate(card.createdAt)}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">تاريخ الانتهاء:</div>
                    <div class="info-value">${formatDate(card.expiryDate)}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">نوع البطاقة:</div>
                    <div class="info-value">${getCardTypeArabic(card.cardType)}</div>
                </div>
            </div>
        `;
    }

    // إعداد محتوى صفحة الطباعة
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>بيانات المستثمر - ${investor.name}</title>
            <style>
                body {
                    font-family: Arial, Tahoma, sans-serif;
                    direction: rtl;
                    line-height: 1.6;
                    color: #333;
                    padding: 20px;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #3b82f6;
                }
                .print-title {
                    font-size: 24px;
                    font-weight: bold;
                    margin: 0;
                    color: #1e3a8a;
                }
                .print-date {
                    font-size: 12px;
                    color: #666;
                    margin-top: 5px;
                }
                .print-container {
                    max-width: 800px;
                    margin: 0 auto;
                }
                .print-section {
                    margin-bottom: 20px;
                    padding: 15px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                }
                .print-section-title {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #1e3a8a;
                    border-bottom: 1px solid #e5e7eb;
                    padding-bottom: 5px;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                }
                .info-row {
                    display: flex;
                    margin-bottom: 8px;
                }
                .info-label {
                    font-weight: bold;
                    width: 40%;
                    color: #4b5563;
                }
                .info-value {
                    width: 60%;
                }
                .status-active {
                    color: #10b981;
                    font-weight: bold;
                }
                .status-inactive {
                    color: #ef4444;
                    font-weight: bold;
                }
                .print-footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 12px;
                    color: #6b7280;
                    border-top: 1px solid #e5e7eb;
                    padding-top: 10px;
                }

                @media print {
                    body {
                        padding: 0;
                        margin: 0;
                    }
                    .print-section {
                        break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                <div class="print-header">
                    <h1 class="print-title">بيانات المستثمر</h1>
                    <div class="print-date">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</div>
                </div>

                <div class="print-section">
                    <h2 class="print-section-title">المعلومات الشخصية</h2>
                    <div class="info-grid">
                        <div class="info-row">
                            <div class="info-label">الاسم:</div>
                            <div class="info-value">${investor.name || '-'}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">رقم الهاتف:</div>
                            <div class="info-value">${investor.phone || '-'}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">العنوان:</div>
                            <div class="info-value">${investor.address || '-'}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">البريد الإلكتروني:</div>
                            <div class="info-value">${investor.email || '-'}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">معرف المستثمر:</div>
                            <div class="info-value">${investor.id}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">تاريخ الانضمام:</div>
                            <div class="info-value">${formatDate(investor.joinDate || investor.createdAt)}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">الحالة:</div>
                            <div class="info-value ${investor.active !== false ? 'status-active' : 'status-inactive'}">${investor.active !== false ? 'نشط' : 'غير نشط'}</div>
                        </div>
                    </div>
                </div>

                <div class="print-section">
                    <h2 class="print-section-title">معلومات الاستثمار</h2>
                    <div class="info-grid">
                        <div class="info-row">
                            <div class="info-label">إجمالي الاستثمار:</div>
                            <div class="info-value">${formatCurrency(totalInvestment)}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">الربح الشهري:</div>
                            <div class="info-value">${formatCurrency(monthlyProfit)}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">تاريخ آخر استثمار:</div>
                            <div class="info-value">${lastInvestmentDate}</div>
                        </div>
                    </div>
                </div>

                ${card ? `
                <div class="print-section">
                    <h2 class="print-section-title">معلومات البطاقة</h2>
                    ${cardInfo}
                </div>
                ` : ''}

                <div class="print-footer">
                    تم إنشاء هذا التقرير بواسطة نظام قارئ بطاقات المستثمرين
                </div>
            </div>

            <script>
                // طباعة تلقائية
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `);

    printWindow.document.close();
}

/**
 * الحصول على قائمة المستثمرين من التخزين المحلي
 * @returns {Array} قائمة المستثمرين
 */
function getLocalInvestors() {
    try {
        // محاولة قراءة البيانات من التخزين المحلي
        const investorsData = localStorage.getItem('investors');
        if (investorsData) {
            return JSON.parse(investorsData);
        }

        // عودة بمصفوفة فارغة إذا لم تكن هناك بيانات
        return [];
    } catch (error) {
        console.error('خطأ في قراءة بيانات المستثمرين:', error);
        return [];
    }
}

/**
 * الحصول على قائمة البطاقات من التخزين المحلي
 * @returns {Array} قائمة البطاقات
 */
function getLocalCards() {
    try {
        // محاولة قراءة البيانات من التخزين المحلي
        const cardsData = localStorage.getItem('investorCards');
        if (cardsData) {
            return JSON.parse(cardsData);
        }

        // عودة بمصفوفة فارغة إذا لم تكن هناك بيانات
        return [];
    } catch (error) {
        console.error('خطأ في قراءة بيانات البطاقات:', error);
        return [];
    }
}

/**
 * تنسيق رقم البطاقة للعرض
 * @param {string} cardNumber رقم البطاقة
 * @returns {string} رقم البطاقة المنسق
 */
function formatCardNumber(cardNumber) {
    // التحقق من صحة الرقم
    if (!cardNumber || typeof cardNumber !== 'string') {
        return '•••• •••• •••• ••••';
    }

    // تقسيم الرقم إلى مجموعات من 4 أرقام
    return cardNumber.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * الحصول على اسم نوع البطاقة بالعربية
 * @param {string} cardType نوع البطاقة
 * @returns {string} اسم النوع بالعربية
 */
function getCardTypeArabic(cardType) {
    switch (cardType) {
        case 'default':
            return 'قياسية';
        case 'gold':
            return 'ذهبية';
        case 'platinum':
            return 'بلاتينية';
        case 'premium':
            return 'بريميوم';
        default:
            return cardType || 'قياسية';
    }
}

/**
 * تنسيق التاريخ للعرض
 * @param {string} dateString تاريخ
 * @returns {string} التاريخ المنسق
 */
function formatDate(dateString) {
    if (!dateString) return '-';

    const date = new Date(dateString);

    // التحقق من صحة التاريخ
    if (isNaN(date.getTime())) {
        return dateString;
    }

    // تنسيق التاريخ بالصيغة المحلية
    return date.toLocaleDateString('ar-SA');
}

/**
 * تنسيق المبلغ المالي للعرض
 * @param {number} amount المبلغ
 * @returns {string} المبلغ المنسق
 */
function formatCurrency(amount) {
    if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
    }

    // تنسيق افتراضي
    const formattedAmount = amount.toLocaleString('ar-SA', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
    });

    // إضافة العملة
    return `${formattedAmount} دينار`;
}