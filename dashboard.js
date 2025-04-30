/**
 * وظائف شاشة لوحة التحكم لتطبيق بطاقة المستثمر
 */

// كائن لوحة التحكم
const Dashboard = {
    // متغيرات الحالة
    isCardFlipped: false,
    
    // تهيئة شاشة لوحة التحكم
    init: function() {
        console.log('تهيئة وظائف لوحة التحكم...');
        
        // تهيئة مستمعي الأحداث
        this.initEvents();
        
        // تحديث إشعارات التطبيق
        this.updateNotificationBadge();
        
        // تهيئة مخططات البيانات إذا كان ضرورياً
        this.initCharts();
    },
    
    // تهيئة مستمعي الأحداث
    initEvents: function() {
        // أحداث البطاقة
        this.initCardEvents();
        
        // أحداث التبويبات
        this.initTabEvents();
        
        // أحداث شريط التنقل
        this.initNavEvents();
        
        // أحداث النوافذ المنبثقة
        this.initModalEvents();
    },
    
    // تهيئة أحداث البطاقة
    initCardEvents: function() {
        // تقليب البطاقة
        const flipCardBtn = document.getElementById('flip-card-btn');
        if (flipCardBtn) {
            flipCardBtn.addEventListener('click', () => {
                this.toggleCardFlip();
            });
        }
        
        // عرض رمز QR
        const showQrBtn = document.getElementById('show-qr-btn');
        if (showQrBtn) {
            showQrBtn.addEventListener('click', () => {
                if (typeof App !== 'undefined' && App.showModal) {
                    App.showModal('qr-modal');
                    
                    // إنشاء رمز QR للبطاقة إذا كانت مكتبة QRCode متاحة
                    if (typeof QRCode !== 'undefined') {
                        this.generateCardQR();
                    }
                }
            });
        }
        
        // مشاركة البطاقة
        const shareCardBtn = document.getElementById('share-card-btn');
        if (shareCardBtn) {
            shareCardBtn.addEventListener('click', () => {
                if (typeof App !== 'undefined' && App.showModal) {
                    App.showModal('share-modal');
                }
            });
        }
    },
    
    // تبديل قلب البطاقة
    toggleCardFlip: function() {
        const card = document.querySelector('.investor-card');
        if (!card) return;
        
        // تبديل حالة القلب
        this.isCardFlipped = !this.isCardFlipped;
        
        // تبديل الفئة
        card.classList.toggle('flipped', this.isCardFlipped);
        
        // تحديث نص الزر
        const flipCardBtn = document.getElementById('flip-card-btn');
        if (flipCardBtn) {
            if (this.isCardFlipped) {
                flipCardBtn.innerHTML = '<i class="fas fa-sync-alt"></i><span>عرض الأمام</span>';
            } else {
                flipCardBtn.innerHTML = '<i class="fas fa-sync-alt"></i><span>عرض الخلف</span>';
            }
        }
    },
    
    // إنشاء رمز QR للبطاقة
    generateCardQR: function() {
        const qrContainer = document.getElementById('card-qr-code');
        if (!qrContainer) return;
        
        // مسح المحتوى الحالي
        qrContainer.innerHTML = '';
        
        // الحصول على بيانات البطاقة
        const cardData = this.getCardData();
        
        // إنشاء نص البيانات للرمز
        const qrText = JSON.stringify({
            name: cardData.name,
            number: cardData.maskedNumber,
            expiry: cardData.expiry,
            type: cardData.type
        });
        
        // إنشاء رمز QR
        try {
            new QRCode(qrContainer, {
                text: qrText,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } catch (error) {
            console.error('خطأ في إنشاء رمز QR:', error);
            qrContainer.innerHTML = '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: #f8f9fa;">خطأ في إنشاء الرمز</div>';
        }
    },
    
    // الحصول على بيانات البطاقة
    getCardData: function() {
        // الحصول على بيانات البطاقة من العناصر
        const name = document.getElementById('display-card-name')?.textContent || 'المستثمر';
        const number = document.getElementById('display-card-number')?.textContent || 'XXXX XXXX XXXX XXXX';
        const expiry = document.getElementById('display-card-expiry')?.textContent || 'MM/YY';
        const type = document.querySelector('.card-brand')?.textContent || 'بلاتينية';
        
        // إخفاء بعض الأرقام من رقم البطاقة للأمان
        const maskedNumber = number.replace(/\d(?=\d{4})/g, 'X');
        
        return {
            name,
            number,
            maskedNumber,
            expiry,
            type
        };
    },
    
    // تهيئة أحداث التبويبات
    initTabEvents: function() {
        // مستمع لتبويبات المعلومات
        const infoTabButtons = document.querySelectorAll('.info-tabs .tab-btn');
        infoTabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // تنشيط الزر المحدد
                infoTabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // عرض المحتوى المناسب
                document.querySelectorAll('.info-tabs .tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
        
        // مستمع لأزرار فلترة العمليات
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');
                
                // تنشيط الزر المحدد
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // تطبيق الفلتر
                this.filterTransactions(filter);
            });
        });
    },
    
    // فلترة العمليات
    filterTransactions: function(filter) {
        console.log('تطبيق فلتر العمليات:', filter);
        
        // الحصول على جميع عناصر العمليات
        const transactionItems = document.querySelectorAll('#transactions-list .data-item');
        
        // تطبيق الفلتر
        if (filter === 'all') {
            // إظهار جميع العمليات
            transactionItems.forEach(item => {
                item.style.display = 'block';
            });
        } else {
            // إظهار العمليات المطابقة للفلتر فقط
            transactionItems.forEach(item => {
                const transactionType = item.getAttribute('data-type');
                item.style.display = (transactionType === filter) ? 'block' : 'none';
            });
        }
    },
    
    // تهيئة أحداث شريط التنقل
    initNavEvents: function() {
        // مستمع لزر الإشعارات
        const notificationsBtn = document.getElementById('notifications-btn');
        if (notificationsBtn) {
            notificationsBtn.addEventListener('click', () => {
                if (typeof App !== 'undefined' && App.showModal) {
                    App.showModal('notifications-modal');
                    this.renderNotifications();
                }
            });
        }
        
        // مستمع لزر تسجيل الخروج
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
                    if (typeof App !== 'undefined' && App.logout) {
                        App.logout();
                    }
                }
            });
        }
        
        // مستمع لشريط التنقل السفلي
        const navItems = document.querySelectorAll('.bottom-navbar .nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // تنشيط العنصر المحدد
                navItems.forEach(navItem => navItem.classList.remove('active'));
                item.classList.add('active');
                
                // التنقل إلى التبويب المناسب
                const target = item.getAttribute('href').substring(1);
                
                // تحديد التبويب بناءً على الهدف
                switch (target) {
                    case 'home':
                        // التنقل إلى التبويب الأول
                        document.querySelector('.info-tabs .tab-btn[data-tab="investments"]').click();
                        break;
                    case 'transactions':
                        // التنقل إلى تبويب العمليات
                        document.querySelector('.info-tabs .tab-btn[data-tab="transactions"]').click();
                        break;
                    case 'profits':
                        // التنقل إلى تبويب الأرباح
                        document.querySelector('.info-tabs .tab-btn[data-tab="profits"]').click();
                        break;
                    case 'profile':
                        // التنقل إلى تبويب المعلومات
                        document.querySelector('.info-tabs .tab-btn[data-tab="info"]').click();
                        break;
                }
            });
        });
        
        // مستمع لزر الاتصال بالدعم
        const contactBtn = document.getElementById('contact-btn');
        if (contactBtn) {
            contactBtn.addEventListener('click', () => {
                if (typeof App !== 'undefined' && App.showModal) {
                    App.showModal('support-modal');
                }
            });
        }
    },
    
    // تهيئة أحداث النوافذ المنبثقة
    initModalEvents: function() {
        // مستمع لإغلاق النوافذ المنبثقة
        document.querySelectorAll('.modal-close, .modal-close-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (typeof App !== 'undefined' && App.closeModals) {
                    App.closeModals();
                }
            });
        });
        
        // مستمع للنقر خارج النافذة لإغلاقها
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    if (typeof App !== 'undefined' && App.closeModals) {
                        App.closeModals();
                    }
                }
            });
        });
        
        // مستمع لأزرار خيارات المشاركة
        document.querySelectorAll('.share-option').forEach(option => {
            option.addEventListener('click', () => {
                const method = option.getAttribute('data-method');
                if (typeof App !== 'undefined' && App.shareCard) {
                    App.shareCard(method);
                }
            });
        });
        
        // مستمع لزر حفظ QR
        const saveQrBtn = document.getElementById('save-qr-btn');
        if (saveQrBtn) {
            saveQrBtn.addEventListener('click', () => {
                this.saveQRCode();
            });
        }
        
        // مستمع لزر تعيين الإشعارات كمقروءة
        const markReadBtn = document.getElementById('mark-read-btn');
        if (markReadBtn) {
            markReadBtn.addEventListener('click', () => {
                if (typeof App !== 'undefined' && App.markAllNotificationsAsRead) {
                    App.markAllNotificationsAsRead();
                } else {
                    this.markAllNotificationsAsRead();
                }
            });
        }
        
        // مستمع لزر إرسال رسالة الدعم
        const sendSupportMessageBtn = document.getElementById('send-support-message');
        if (sendSupportMessageBtn) {
            sendSupportMessageBtn.addEventListener('click', () => {
                this.sendSupportMessage();
            });
        }
    },
    
    // حفظ رمز QR كصورة
    saveQRCode: function() {
        const qrContainer = document.getElementById('card-qr-code');
        if (!qrContainer) return;
        
        // الحصول على عنصر الصورة أو canvas داخل الحاوية
        const qrImage = qrContainer.querySelector('img');
        const qrCanvas = qrContainer.querySelector('canvas');
        
        try {
            if (qrCanvas) {
                // إذا كان هناك canvas، استخدم toDataURL
                const dataURL = qrCanvas.toDataURL('image/png');
                this.downloadImage(dataURL, 'card-qr-code.png');
            } else if (qrImage && qrImage.src) {
                // إذا كانت صورة عادية
                this.downloadImage(qrImage.src, 'card-qr-code.png');
            } else {
                throw new Error('لم يتم العثور على صورة الرمز');
            }
        } catch (error) {
            console.error('خطأ في حفظ رمز QR:', error);
            alert('حدث خطأ أثناء محاولة حفظ رمز QR');
        }
    },
    
    // تنزيل صورة
    downloadImage: function(src, filename) {
        const link = document.createElement('a');
        link.href = src;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
        }, 100);
    },
    
    // عرض الإشعارات
    renderNotifications: function() {
        const container = document.getElementById('notifications-list');
        if (!container) return;
        
        // الحصول على بيانات الإشعارات من التطبيق الرئيسي
        const notifications = this.getNotificationsData();
        
        // مسح المحتوى الحالي
        container.innerHTML = '';
        
        // إضافة الإشعارات
        if (notifications.length === 0) {
            container.innerHTML = '<p class="text-center" style="padding: 20px;">لا توجد إشعارات</p>';
            return;
        }
        
        notifications.forEach(notification => {
            // إنشاء عنصر الإشعار
            const notificationItem = document.createElement('div');
            notificationItem.className = `notification-item ${notification.read ? '' : 'unread'}`;
            notificationItem.setAttribute('data-id', notification.id);
            
            // تحديد لون وأيقونة الإشعار
            let iconClass = 'fas fa-bell';
            let iconColor = '#3b82f6';
            
            if (notification.title.includes('أرباح')) {
                iconClass = 'fas fa-coins';
                iconColor = '#10b981';
            } else if (notification.title.includes('سحب')) {
                iconClass = 'fas fa-money-bill-wave';
                iconColor = '#ef4444';
            } else if (notification.title.includes('عرض')) {
                iconClass = 'fas fa-percentage';
                iconColor = '#f59e0b';
            }
            
            // إضافة محتوى الإشعار
            notificationItem.innerHTML = `
                <div class="notification-icon" style="background-color: ${iconColor}20; color: ${iconColor};">
                    <i class="${iconClass}"></i>
                </div>
                <div class="notification-info">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-content">${notification.content}</div>
                    <div class="notification-time">${notification.time}</div>
                </div>
            `;
            
            // إضافة الإشعار إلى القائمة
            container.appendChild(notificationItem);
            
            // مستمع لتعيين الإشعار كمقروء عند النقر
            notificationItem.addEventListener('click', () => {
                this.markNotificationAsRead(notification.id);
            });
        });
    },
    
    // الحصول على بيانات الإشعارات
    getNotificationsData: function() {
        // بيانات الإشعارات التجريبية (يمكن استبدالها ببيانات حقيقية من التطبيق الرئيسي)
        if (typeof App !== 'undefined' && App.appData && App.appData.notifications) {
            return App.appData.notifications;
        }
        
        // بيانات تجريبية
        return [
            {
                id: "n1",
                title: "تحديث أرباح شهرية",
                content: "تم إضافة أرباح شهر أكتوبر إلى حسابك بقيمة 250,000 دينار",
                time: "2023-10-20 10:25",
                read: false
            },
            {
                id: "n2",
                title: "عملية سحب ناجحة",
                content: "تمت عملية السحب بنجاح بقيمة 500,000 دينار من حسابك",
                time: "2023-10-05 15:40",
                read: true
            },
            {
                id: "n3",
                title: "عرض استثماري جديد",
                content: "عرض استثماري جديد متاح في قطاع العقارات بعائد 22% سنوياً",
                time: "2023-09-15 09:30",
                read: true
            }
        ];
    },
    
    // تعيين إشعار كمقروء
    markNotificationAsRead: function(notificationId) {
        // هنا يمكن استدعاء الدالة المقابلة من التطبيق الرئيسي إذا كانت متاحة
        if (typeof App !== 'undefined' && App.markNotificationAsRead) {
            App.markNotificationAsRead(notificationId);
            return;
        }
        
        // البحث عن الإشعار في البيانات التجريبية
        const notifications = this.getNotificationsData();
        const notification = notifications.find(n => n.id === notificationId);
        
        if (notification) {
            notification.read = true;
            
            // تحديث عرض الإشعار
            const notificationElement = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
            if (notificationElement) {
                notificationElement.classList.remove('unread');
            }
            
            // تحديث عدد الإشعارات غير المقروءة
            this.updateNotificationBadge();
        }
    },
    
    // تعيين جميع الإشعارات كمقروءة
    markAllNotificationsAsRead: function() {
        // الحصول على بيانات الإشعارات
        const notifications = this.getNotificationsData();
        
        // تعيين جميع الإشعارات كمقروءة
        notifications.forEach(notification => {
            notification.read = true;
        });
        
        // تحديث عرض الإشعارات
        document.querySelectorAll('.notification-item').forEach(item => {
            item.classList.remove('unread');
        });
        
        // تحديث عدد الإشعارات غير المقروءة
        this.updateNotificationBadge();
        
        // إظهار إشعار
        if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('الإشعارات', 'تم تعيين جميع الإشعارات كمقروءة');
        } else {
            alert('تم تعيين جميع الإشعارات كمقروءة');
        }
    },
    
    // تحديث شارة عدد الإشعارات
    updateNotificationBadge: function() {
        // الحصول على بيانات الإشعارات
        const notifications = this.getNotificationsData();
        
        // حساب عدد الإشعارات غير المقروءة
        const unreadCount = notifications.filter(n => !n.read).length;
        
        // تحديث شارة الإشعارات
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    },
    
    // إرسال رسالة دعم
    sendSupportMessage: function() {
        // الحصول على القيم
        const subject = document.getElementById('support-subject').value;
        const message = document.getElementById('support-message').value;
        
        // التحقق من صحة المدخلات
        if (!subject || !message) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }
        
        // محاكاة إرسال الرسالة
        console.log('إرسال رسالة دعم:', { subject, message });
        
        // إعادة تعيين النموذج
        document.getElementById('support-subject').value = '';
        document.getElementById('support-message').value = '';
        
        // إغلاق النافذة المنبثقة
        if (typeof App !== 'undefined' && App.closeModals) {
            App.closeModals();
        }
        
        // إظهار إشعار
        if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('تم الإرسال', 'تم إرسال رسالتك بنجاح، سنتواصل معك قريباً');
        } else {
            alert('تم إرسال رسالتك بنجاح، سنتواصل معك قريباً');
        }
    },
    
    // تهيئة مخططات البيانات
    initCharts: function() {
        // يمكن إضافة مخططات بيانية هنا إذا لزم الأمر
    }
};

// تهيئة لوحة التحكم عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    Dashboard.init();
});