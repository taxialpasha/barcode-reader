/**
 * app.js
 * Main application script for Investor Card System
 * Handles UI interactions, animations, and integrates with Firebase connector
 * 
 * @version 2.0.0
 */

// Application namespace
const App = (function() {
    // Private variables
    let currentScreen = null;
    let isInitialized = false;
    let isFirstLoad = true;
    
    // DOM elements cache
    const screens = {
        splash: document.getElementById('splash-screen'),
        login: document.getElementById('login-screen'),
        dashboard: document.getElementById('card-dashboard')
    };
    
    // Public methods
    return {
        /**
         * Initialize the application
         * @returns {Promise} Resolves when initialization is complete
         */
        init: function() {
            if (isInitialized) {
                console.log('Application already initialized');
                return Promise.resolve(true);
            }
            
            console.log('Initializing application...');
            
            // Register service worker for PWA
            this.registerServiceWorker();
            
            // Initialize event listeners
            this.setupEventListeners();
            
            // Show splash screen on first load
            if (isFirstLoad) {
                this.showScreen('splash');
                
                // Simulate loading progress
                this.updateLoadingProgress(0);
                
                return new Promise((resolve) => {
                    // Simulate loading time and progress updates
                    let progress = 0;
                    const interval = setInterval(() => {
                        progress += 5;
                        this.updateLoadingProgress(progress);
                        
                        if (progress >= 100) {
                            clearInterval(interval);
                            
                            // Initialize InvestorCardSystem
                            InvestorCardSystem.initialize()
                                .then(() => {
                                    console.log('Investor Card System initialized successfully');
                                    
                                    // Check if we have saved card data
                                    const currentCard = InvestorCardSystem.getCurrentCard();
                                    
                                    // Delay to show complete loading state
                                    setTimeout(() => {
                                        // Show appropriate screen
                                        if (currentCard) {
                                            this.showScreen('dashboard');
                                        } else {
                                            this.showScreen('login');
                                        }
                                        
                                        isInitialized = true;
                                        isFirstLoad = false;
                                        resolve(true);
                                    }, 500);
                                })
                                .catch(error => {
                                    console.error('Error initializing Investor Card System:', error);
                                    this.showScreen('login');
                                    isInitialized = true;
                                    isFirstLoad = false;
                                    resolve(false);
                                });
                        }
                    }, 50);
                });
            } else {
                // Not first load, initialize directly
                return InvestorCardSystem.initialize()
                    .then(() => {
                        console.log('Investor Card System initialized successfully');
                        
                        // Check saved card data
                        const currentCard = InvestorCardSystem.getCurrentCard();
                        
                        // Show appropriate screen
                        if (currentCard) {
                            this.showScreen('dashboard');
                        } else {
                            this.showScreen('login');
                        }
                        
                        isInitialized = true;
                        return true;
                    })
                    .catch(error => {
                        console.error('Error initializing Investor Card System:', error);
                        this.showScreen('login');
                        isInitialized = true;
                        return false;
                    });
            }
        },
        
        /**
         * Register service worker for PWA functionality
         */
        registerServiceWorker: function() {
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                    navigator.serviceWorker.register('service-worker.js')
                        .then(function(registration) {
                            console.log('ServiceWorker registered successfully:', registration.scope);
                        })
                        .catch(function(error) {
                            console.error('ServiceWorker registration failed:', error);
                        });
                });
            }
        },
        
        /**
         * Set up all event listeners for the application
         */
        setupEventListeners: function() {
            console.log('Setting up event listeners...');
            
            // Tab navigation
            const tabButtons = document.querySelectorAll('.tab-btn');
            tabButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const targetTab = e.currentTarget.getAttribute('data-tab');
                    this.switchTab(button, targetTab);
                });
            });
            
            // Bottom navigation
            const navItems = document.querySelectorAll('.bottom-navbar .nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Remove active class from all nav items
                    navItems.forEach(navItem => navItem.classList.remove('active'));
                    
                    // Add active class to clicked item
                    item.classList.add('active');
                    
                    // Get the target section from href
                    const targetSection = item.getAttribute('href').substring(1);
                    
                    // Handle navigation based on target
                    this.handleNavigation(targetSection);
                });
            });
            
            // Card login form
            const cardLoginForm = document.getElementById('card-login-form');
            if (cardLoginForm) {
                cardLoginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleCardLogin();
                });
            }
            
            // Phone login form
            const phoneLoginForm = document.getElementById('phone-login-form');
            if (phoneLoginForm) {
                phoneLoginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handlePhoneLogin();
                });
            }
            
            // Logout button
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    this.handleLogout();
                });
            }
            
            // Notification button
            const notificationsBtn = document.getElementById('notifications-btn');
            if (notificationsBtn) {
                notificationsBtn.addEventListener('click', () => {
                    this.showModal('notifications-modal');
                });
            }
            
            // PIN input handling
            const pinInputs = document.querySelectorAll('.pin-input');
            pinInputs.forEach((input, index) => {
                // Auto-focus next input on entry
                input.addEventListener('input', () => {
                    if (input.value.length === 1 && index < pinInputs.length - 1) {
                        pinInputs[index + 1].focus();
                    }
                    
                    // Update hidden PIN field
                    this.updatePINValue();
                });
                
                // Handle backspace to go to previous input
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
                        pinInputs[index - 1].focus();
                    }
                });
            });
            
            // Card action buttons
            const flipCardBtn = document.getElementById('flip-card-btn');
            if (flipCardBtn) {
                flipCardBtn.addEventListener('click', () => {
                    this.flipCard();
                });
            }
            
            const showQrBtn = document.getElementById('show-qr-btn');
            if (showQrBtn) {
                showQrBtn.addEventListener('click', () => {
                    this.showModal('qr-modal');
                    this.generateQRCode();
                });
            }
            
            const shareCardBtn = document.getElementById('share-card-btn');
            if (shareCardBtn) {
                shareCardBtn.addEventListener('click', () => {
                    this.showModal('share-modal');
                    this.prepareShareContent();
                });
            }
            
            // Modal close buttons
            const modalCloseButtons = document.querySelectorAll('.modal-close, .modal-close-btn');
            modalCloseButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const modal = e.target.closest('.modal');
                    if (modal) {
                        this.hideModal(modal.id);
                    }
                });
            });
            
            // Modal overlays (click to close)
            const modalOverlays = document.querySelectorAll('.modal-overlay');
            modalOverlays.forEach(overlay => {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        const modal = overlay.closest('.modal');
                        if (modal) {
                            this.hideModal(modal.id);
                        }
                    }
                });
            });
            
            // Share options
            const shareOptions = document.querySelectorAll('.share-option');
            shareOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    const method = e.currentTarget.getAttribute('data-method');
                    this.handleShare(method);
                });
            });
            
            // Support contact button
            const contactSupportBtn = document.getElementById('contact-support-btn');
            if (contactSupportBtn) {
                contactSupportBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showModal('support-modal');
                });
            }
            
            // Send support message button
            const sendSupportMessageBtn = document.getElementById('send-support-message');
            if (sendSupportMessageBtn) {
                sendSupportMessageBtn.addEventListener('click', () => {
                    this.handleSupportMessage();
                });
            }
            
            // Transaction filters
            const filterButtons = document.querySelectorAll('.filter-btn');
            filterButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    // Remove active class from all filter buttons
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    
                    // Add active class to clicked button
                    button.classList.add('active');
                    
                    // Get filter value
                    const filter = button.getAttribute('data-filter');
                    
                    // Apply filter
                    this.filterTransactions(filter);
                });
            });
            
            // Mark all notifications as read button
            const markReadBtn = document.getElementById('mark-read-btn');
            if (markReadBtn) {
                markReadBtn.addEventListener('click', () => {
                    this.markAllNotificationsAsRead();
                });
            }
            
            // Save QR code button
            const saveQrBtn = document.getElementById('save-qr-btn');
            if (saveQrBtn) {
                saveQrBtn.addEventListener('click', () => {
                    this.saveQRCode();
                });
            }
            
            // Format card number input (add spaces)
            const cardNumberInput = document.getElementById('card-number');
            if (cardNumberInput) {
                cardNumberInput.addEventListener('input', (e) => {
                    e.target.value = this.formatCardNumber(e.target.value);
                });
            }
            
            // Format card expiry input (add slash)
            const cardExpiryInput = document.getElementById('card-expiry');
            if (cardExpiryInput) {
                cardExpiryInput.addEventListener('input', (e) => {
                    e.target.value = this.formatExpiryDate(e.target.value);
                });
            }
            
            console.log('Event listeners set up successfully');
        },
        
        /**
         * Show the specified screen and hide others
         * @param {string} screenName - Name of the screen to show ('splash', 'login', or 'dashboard')
         */
        showScreen: function(screenName) {
            if (!screens[screenName]) {
                console.error(`Screen "${screenName}" not found`);
                return;
            }
            
            console.log(`Switching to ${screenName} screen`);
            
            // Hide all screens
            Object.values(screens).forEach(screen => {
                if (screen) {
                    screen.style.display = 'none';
                }
            });
            
            // Show the requested screen
            screens[screenName].style.display = 'flex';
            currentScreen = screenName;
            
            // Perform any screen-specific initialization
            this.initScreen(screenName);
        },
        
        /**
         * Initialize screen-specific content and functionality
         * @param {string} screenName - Name of the screen to initialize
         */
        initScreen: function(screenName) {
            switch (screenName) {
                case 'dashboard':
                    // Update the investor card display
                    this.updateCardDisplay();
                    
                    // Update financial information
                    this.updateFinancialInfo();
                    
                    // Load lists data
                    this.loadInvestments();
                    this.loadTransactions();
                    this.loadProfits();
                    
                    // Update notification badge
                    this.updateNotificationBadge();
                    break;
                    
                case 'login':
                    // Reset login forms
                    this.resetLoginForms();
                    break;
                    
                // Add other screen initializations as needed
            }
        },
        
        /**
         * Reset login forms
         */
        resetLoginForms: function() {
            const cardLoginForm = document.getElementById('card-login-form');
            const phoneLoginForm = document.getElementById('phone-login-form');
            
            if (cardLoginForm) cardLoginForm.reset();
            if (phoneLoginForm) phoneLoginForm.reset();
            
            // Hide error messages
            const errorElements = document.querySelectorAll('.error-message');
            errorElements.forEach(element => {
                element.textContent = '';
                element.style.display = 'none';
            });
        },
        
        /**
         * Handle card login form submission
         */
        handleCardLogin: function() {
            const cardNumber = document.getElementById('card-number').value;
            const cardExpiry = document.getElementById('card-expiry').value;
            const cardCvv = document.getElementById('card-cvv').value;
            const loginBtn = document.getElementById('card-login-btn');
            const errorElement = document.getElementById('login-error');
            
            // Validate inputs
            if (!cardNumber || !cardExpiry) {
                if (errorElement) {
                    errorElement.textContent = 'يرجى إدخال جميع البيانات المطلوبة';
                    errorElement.style.display = 'block';
                }
                return;
            }
            
            // Show loading state
            if (loginBtn) {
                loginBtn.disabled = true;
                const originalBtnHtml = loginBtn.innerHTML;
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>جاري التحقق...</span>';
            }
            
            // Hide error message
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
            
            // Attempt login
            InvestorCardSystem.loginWithCard(cardNumber, cardExpiry, cardCvv)
                .then(card => {
                    console.log('Login successful');
                    
                    // Switch to dashboard
                    this.showScreen('dashboard');
                })
                .catch(error => {
                    console.error('Card login error:', error);
                    
                    // Show error message
                    if (errorElement) {
                        errorElement.textContent = error.message || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.';
                        errorElement.style.display = 'block';
                    }
                })
                .finally(() => {
                    // Restore button state
                    if (loginBtn) {
                        loginBtn.disabled = false;
                        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>تسجيل الدخول</span>';
                    }
                });
        },
        
        /**
         * Handle phone login form submission
         */
        handlePhoneLogin: function() {
            const phoneNumber = document.getElementById('phone-number').value;
            const investorName = document.getElementById('investor-name').value;
            const loginBtn = document.getElementById('phone-login-btn');
            const errorElement = document.getElementById('phone-login-error');
            
            // Validate inputs
            if (!phoneNumber || !investorName) {
                if (errorElement) {
                    errorElement.textContent = 'يرجى إدخال جميع البيانات المطلوبة';
                    errorElement.style.display = 'block';
                }
                return;
            }
            
            // Show loading state
            if (loginBtn) {
                loginBtn.disabled = true;
                const originalBtnHtml = loginBtn.innerHTML;
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>جاري التحقق...</span>';
            }
            
            // Hide error message
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
            
            // Attempt login
            InvestorCardSystem.loginWithPhone(phoneNumber, investorName)
                .then(card => {
                    console.log('Phone login successful');
                    
                    // Switch to dashboard
                    this.showScreen('dashboard');
                })
                .catch(error => {
                    console.error('Phone login error:', error);
                    
                    // Show error message
                    if (errorElement) {
                        errorElement.textContent = error.message || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.';
                        errorElement.style.display = 'block';
                    }
                })
                .finally(() => {
                    // Restore button state
                    if (loginBtn) {
                        loginBtn.disabled = false;
                        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>تسجيل الدخول</span>';
                    }
                });
        },
        
        /**
         * Handle logout action
         */
        handleLogout: function() {
            InvestorCardSystem.logout();
            this.showScreen('login');
        },
        
        /**
         * Switch between tabs
         * @param {HTMLElement} activeButton - The tab button that was clicked
         * @param {string} tabId - ID of the tab to activate
         */
        switchTab: function(activeButton, tabId) {
            // Get all tab buttons in the same group
            const tabContainer = activeButton.closest('.tabs, .info-tabs');
            if (!tabContainer) return;
            
            const buttons = tabContainer.querySelectorAll('.tab-btn');
            const contents = document.querySelectorAll(`#${tabId}-tab, [id$="-tab"]`);
            
            // Remove active class from all buttons
            buttons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            activeButton.classList.add('active');
            
            // Hide all content panels
            contents.forEach(content => content.classList.remove('active'));
            
            // Show target content panel
            const targetContent = document.getElementById(`${tabId}-tab`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        },
        
        /**
         * Handle bottom navigation actions
         * @param {string} targetSection - The section to navigate to
         */
        handleNavigation: function(targetSection) {
            switch (targetSection) {
                case 'home':
                    // Already on dashboard, show main tab
                    const homeTabBtn = document.querySelector('.info-tabs .tab-btn[data-tab="investments"]');
                    if (homeTabBtn) this.switchTab(homeTabBtn, 'investments');
                    break;
                    
                case 'transactions':
                    // Switch to transactions tab
                    const transactionsTabBtn = document.querySelector('.info-tabs .tab-btn[data-tab="transactions"]');
                    if (transactionsTabBtn) this.switchTab(transactionsTabBtn, 'transactions');
                    break;
                    
                case 'profits':
                    // Switch to profits tab
                    const profitsTabBtn = document.querySelector('.info-tabs .tab-btn[data-tab="profits"]');
                    if (profitsTabBtn) this.switchTab(profitsTabBtn, 'profits');
                    break;
                    
                case 'profile':
                    // Switch to info tab
                    const infoTabBtn = document.querySelector('.info-tabs .tab-btn[data-tab="info"]');
                    if (infoTabBtn) this.switchTab(infoTabBtn, 'info');
                    break;
            }
        },
        
        /**
         * Update loading progress for splash screen
         * @param {number} percentage - Loading progress percentage (0-100)
         */
        updateLoadingProgress: function(percentage) {
            const progressBar = document.querySelector('.loading-progress');
            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
            }
        },
        
        /**
         * Update card display with current card information
         */
        updateCardDisplay: function() {
            const card = InvestorCardSystem.getCurrentCard();
            if (!card) return;
            
            // Update card information in the UI
            const cardNumber = document.getElementById('display-card-number');
            const cardExpiry = document.getElementById('display-card-expiry');
            const cardName = document.getElementById('display-card-name');
            const cardCvv = document.getElementById('display-cvv');
            const cardPhone = document.getElementById('display-phone');
            
            if (cardNumber) cardNumber.textContent = this.formatCardNumber(card.cardNumber) || 'XXXX XXXX XXXX XXXX';
            if (cardExpiry) cardExpiry.textContent = card.expiryDate || 'MM/YY';
            if (cardName) cardName.textContent = card.investorName || 'اسم المستثمر';
            if (cardCvv) cardCvv.textContent = card.cvv || '***';
            if (cardPhone) cardPhone.textContent = card.investorPhone || '';
            
            // Update card type/styling
            this.applyCardStyle(card.cardType || 'platinum');
            
            // Update card status badge
            this.updateCardStatus(card);
            
            // Update user name
            const userName = document.getElementById('user-name');
            const userInitial = document.getElementById('user-initial');
            
            if (userName) userName.textContent = card.investorName || 'المستثمر';
            if (userInitial && card.investorName) userInitial.textContent = card.investorName.charAt(0);
        },
        
        /**
         * Apply card styling based on type
         * @param {string} cardType - Type of card (platinum, gold, etc.)
         */
        applyCardStyle: function(cardType) {
            const cardFront = document.querySelector('.card-front');
            const cardBack = document.querySelector('.card-back');
            const cardBrand = document.querySelector('.card-brand');
            
            if (!cardFront || !cardBack) return;
            
            // Remove all card type classes
            const cardTypes = ['platinum', 'gold', 'premium', 'diamond', 'islamic'];
            cardTypes.forEach(type => {
                cardFront.classList.remove(type);
                cardBack.classList.remove(type);
            });
            
            // Add specific card type class
            cardFront.classList.add(cardType);
            cardBack.classList.add(cardType);
            
            // Update card brand name
            if (cardBrand) {
                const cardTypeNames = {
                    platinum: 'بلاتينية',
                    gold: 'ذهبية',
                    premium: 'بريميوم',
                    diamond: 'ماسية',
                    islamic: 'إسلامية',
                    custom: 'مخصصة'
                };
                
                cardBrand.textContent = cardTypeNames[cardType] || 'بلاتينية';
            }
        },
        
        /**
         * Update card status badge
         * @param {Object} card - Card object
         */
        updateCardStatus: function(card) {
            const statusBadge = document.getElementById('card-status-badge');
            if (!statusBadge) return;
            
            // Check if card is expired
            const isExpired = new Date(card.expiryDate) < new Date();
            const isActive = card.status === 'active';
            
            // Update badge style and text
            statusBadge.className = 'card-status-badge';
            
            if (!isActive) {
                statusBadge.classList.add('badge-warning');
                statusBadge.textContent = 'موقوفة';
            } else if (isExpired) {
                statusBadge.classList.add('badge-danger');
                statusBadge.textContent = 'منتهية';
            } else {
                statusBadge.classList.add('badge-success');
                statusBadge.textContent = 'نشطة';
            }
        },
        
        /**
         * Update financial information in the dashboard
         */
        updateFinancialInfo: function() {
            const card = InvestorCardSystem.getCurrentCard();
            if (!card) return;
            
            let investor = null;
            
            // Get the investor data
            if (card.investorId) {
                investor = InvestorCardSystem.getInvestorById(card.investorId);
            }
            
            if (!investor) return;
            
            // Update balance
            const totalBalance = document.getElementById('total-balance');
            if (totalBalance) {
                totalBalance.textContent = InvestorCardSystem.formatCurrency(investor.amount || 0);
            }
            
            // Update monthly profit
            const monthlyProfit = document.getElementById('monthly-profit');
            if (monthlyProfit) {
                // Calculate monthly profit (simplified example)
                const profit = (investor.amount || 0) * 0.015; // 1.5% monthly return
                monthlyProfit.textContent = InvestorCardSystem.formatCurrency(profit);
            }
            
            // Update investment days
            const investmentDays = document.getElementById('investment-days');
            if (investmentDays) {
                // Calculate days since investment
                const joinDate = new Date(investor.joinDate || investor.createdAt || new Date());
                const today = new Date();
                const diffTime = today - joinDate;
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                investmentDays.textContent = diffDays;
            }
            
            // Update next profit date
            const nextProfitDate = document.getElementById('next-profit-date');
            if (nextProfitDate) {
                // Calculate next profit date (usually monthly)
                const joinDate = new Date(investor.joinDate || investor.createdAt || new Date());
                const today = new Date();
                
                // Next profit is on the same day of the month
                const nextDate = new Date(today.getFullYear(), today.getMonth() + (today.getDate() >= joinDate.getDate() ? 1 : 0), joinDate.getDate());
                
                nextProfitDate.textContent = InvestorCardSystem.formatDate(nextDate);
            }
            
            // Update last update date
            const lastUpdateDate = document.getElementById('last-update-date');
            if (lastUpdateDate) {
                lastUpdateDate.textContent = InvestorCardSystem.formatDate(new Date());
            }
        },
        
        /**
         * Load investments data into the UI
         */
        loadInvestments: function() {
            const card = InvestorCardSystem.getCurrentCard();
            if (!card) return;
            
            const investmentsList = document.getElementById('investments-list');
            if (!investmentsList) return;
            
            let html = '';
            
            if (card.investorId) {
                const investor = InvestorCardSystem.getInvestorById(card.investorId);
                
                if (investor && investor.investments && investor.investments.length > 0) {
                    // Multiple investments
                    investor.investments.forEach(investment => {
                        html += this.createInvestmentHTML(investment);
                    });
                } else if (investor && investor.amount) {
                    // Single investment
                    const investment = {
                        amount: investor.amount,
                        date: investor.joinDate || investor.createdAt || card.createdAt,
                        status: 'active'
                    };
                    
                    html += this.createInvestmentHTML(investment);
                } else {
                    html = '<div class="empty-list">لا توجد استثمارات متاحة</div>';
                }
            } else {
                html = '<div class="empty-list">لا توجد استثمارات متاحة</div>';
            }
            
            investmentsList.innerHTML = html;
        },
        
        /**
         * Create HTML for an investment item
         * @param {Object} investment - Investment object
         * @returns {string} HTML for the investment item
         */
        createInvestmentHTML: function(investment) {
            // Calculate return rate (simplified example)
            const annualRate = 18; // 18% annual return
            const statusClass = investment.status === 'active' ? 'badge-success' : 'badge-warning';
            const statusText = investment.status === 'active' ? 'نشط' : 'غير نشط';
            
            // Calculate days since investment
            const investmentDate = new Date(investment.date);
            const today = new Date();
            const diffTime = today - investmentDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            return `
                <div class="data-item">
                    <div class="data-item-header">
                        <div class="data-item-title">${InvestorCardSystem.formatCurrency(investment.amount)}</div>
                        <div class="data-item-badge ${statusClass}">${statusText}</div>
                    </div>
                    <div class="data-item-details">
                        <div class="data-detail">
                            <div class="data-detail-label">تاريخ الاستثمار</div>
                            <div class="data-detail-value">${InvestorCardSystem.formatDate(investment.date)}</div>
                        </div>
                        <div class="data-detail">
                            <div class="data-detail-label">معدل العائد السنوي</div>
                            <div class="data-detail-value">${annualRate}%</div>
                        </div>
                        <div class="data-detail">
                            <div class="data-detail-label">الربح الشهري المتوقع</div>
                            <div class="data-detail-value">${InvestorCardSystem.formatCurrency(investment.amount * annualRate / 100 / 12)}</div>
                        </div>
                        <div class="data-detail">
                            <div class="data-detail-label">عدد الأيام</div>
                            <div class="data-detail-value">${diffDays} يوم</div>
                        </div>
                    </div>
                </div>
            `;
        },
        
        /**
         * Load transactions data into the UI
         */
        loadTransactions: function() {
            const card = InvestorCardSystem.getCurrentCard();
            if (!card) return;
            
            const transactionsList = document.getElementById('transactions-list');
            if (!transactionsList) return;
            
            // Get transactions from InvestorCardSystem
            const transactions = this.getTransactions(card.investorId);
            
            let html = '';
            
            if (transactions && transactions.length > 0) {
                transactions.forEach(transaction => {
                    html += this.createTransactionHTML(transaction);
                });
            } else {
                html = '<div class="empty-list">لا توجد عمليات متاحة</div>';
            }
            
            transactionsList.innerHTML = html;
            
            // Store transactions data for filtering
            transactionsList.dataset.transactions = JSON.stringify(transactions);
        },
        
        /**
         * Get transactions for an investor
         * @param {string} investorId - ID of the investor
         * @returns {Array} Array of transaction objects
         */
        getTransactions: function(investorId) {
            if (!investorId) return [];
            
            // Implementation will depend on your data structure
            // This is a placeholder that would typically call the InvestorCardSystem
            // For demo purposes, we'll generate sample data
            
            // Try to get from InvestorCardSystem first
            const investor = InvestorCardSystem.getInvestorById(investorId);
            if (!investor) return [];
            
            const transactions = [];
            const amount = investor.amount || 0;
            const joinDate = new Date(investor.joinDate || investor.createdAt || new Date());
            const today = new Date();
            
            // Initial deposit
            transactions.push({
                id: `tr-${investorId}-1`,
                type: 'deposit',
                amount: amount,
                date: joinDate.toISOString(),
                balance: amount,
                notes: 'الإيداع الأولي'
            });
            
            // Generate monthly profit transactions
            let currentDate = new Date(joinDate);
            currentDate.setMonth(currentDate.getMonth() + 1);
            
            let currentBalance = amount;
            let counter = 2;
            
            while (currentDate < today) {
                // Monthly profit (1.5% per month)
                const profit = amount * 0.015;
                currentBalance += profit;
                
                transactions.push({
                    id: `tr-${investorId}-${counter}`,
                    type: 'profit',
                    amount: profit,
                    date: currentDate.toISOString(),
                    balance: currentBalance,
                    notes: 'ربح شهري'
                });
                
                currentDate.setMonth(currentDate.getMonth() + 1);
                counter++;
            }
            
            // Sort by date, newest first
            return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        },
        
        /**
         * Create HTML for a transaction item
         * @param {Object} transaction - Transaction object
         * @returns {string} HTML for the transaction item
         */
        createTransactionHTML: function(transaction) {
            const typeClasses = {
                deposit: 'badge-success',
                withdraw: 'badge-danger',
                profit: 'badge-primary',
                transfer: 'badge-warning'
            };
            
            const typeTexts = {
                deposit: 'إيداع',
                withdraw: 'سحب',
                profit: 'ربح',
                transfer: 'تحويل'
            };
            
            const typeClass = typeClasses[transaction.type] || 'badge-secondary';
            const typeText = typeTexts[transaction.type] || transaction.type;
            
            return `
                <div class="data-item" data-type="${transaction.type}">
                    <div class="data-item-header">
                        <div class="data-item-title">${InvestorCardSystem.formatCurrency(transaction.amount)}</div>
                        <div class="data-item-badge ${typeClass}">${typeText}</div>
                    </div>
                    <div class="data-item-details">
                        <div class="data-detail">
                            <div class="data-detail-label">التاريخ</div>
                            <div class="data-detail-value">${InvestorCardSystem.formatDate(transaction.date)}</div>
                        </div>
                        <div class="data-detail">
                            <div class="data-detail-label">الرصيد بعد العملية</div>
                            <div class="data-detail-value">${InvestorCardSystem.formatCurrency(transaction.balance || 0)}</div>
                        </div>
                        <div class="data-detail">
                            <div class="data-detail-label">ملاحظات</div>
                            <div class="data-detail-value">${transaction.notes || '-'}</div>
                        </div>
                    </div>
                </div>
            `;
        },
        
        /**
         * Filter transactions by type
         * @param {string} filter - Type to filter by ('all', 'deposit', 'withdraw', 'profit')
         */
        filterTransactions: function(filter) {
            const transactionsList = document.getElementById('transactions-list');
            if (!transactionsList) return;
            
            // Get stored transactions data
            let transactions = [];
            try {
                transactions = JSON.parse(transactionsList.dataset.transactions || '[]');
            } catch (error) {
                console.error('Error parsing transactions data:', error);
                return;
            }
            
            // Filter transactions
            let filteredTransactions = transactions;
            if (filter !== 'all') {
                filteredTransactions = transactions.filter(transaction => transaction.type === filter);
            }
            
            // Generate HTML for filtered transactions
            let html = '';
            if (filteredTransactions.length > 0) {
                filteredTransactions.forEach(transaction => {
                    html += this.createTransactionHTML(transaction);
                });
            } else {
                html = '<div class="empty-list">لا توجد عمليات متاحة لهذا النوع</div>';
            }
            
            transactionsList.innerHTML = html;
        },
        
        /**
         * Load profits data into the UI
         */
        loadProfits: function() {
            const card = InvestorCardSystem.getCurrentCard();
            if (!card) return;
            
            const profitsList = document.getElementById('profits-list');
            if (!profitsList) return;
            
            // Get profits from InvestorCardSystem or generate sample data
            const profits = this.getProfits(card.investorId);
            
            let html = '';
            
            if (profits && profits.length > 0) {
                profits.forEach(profit => {
                    html += this.createProfitHTML(profit);
                });
            } else {
                html = '<div class="empty-list">لا توجد أرباح متاحة</div>';
            }
            
            profitsList.innerHTML = html;
            
            // Update the profit summary
            this.updateProfitSummary(card.investorId, profits);
        },
        
        /**
         * Get profits for an investor
         * @param {string} investorId - ID of the investor
         * @returns {Array} Array of profit objects
         */
        getProfits: function(investorId) {
            if (!investorId) return [];
            
            // Implementation will depend on your data structure
            // This is a placeholder that would typically call the InvestorCardSystem
            // For demo purposes, we'll generate sample data
            
            const investor = InvestorCardSystem.getInvestorById(investorId);
            if (!investor) return [];
            
            const profits = [];
            const amount = investor.amount || 0;
            const monthlyProfit = amount * 0.015; // 1.5% monthly return
            const joinDate = new Date(investor.joinDate || investor.createdAt || new Date());
            const today = new Date();
            
            // Generate monthly profit entries
            let currentDate = new Date(joinDate);
            currentDate.setMonth(currentDate.getMonth() + 1);
            
            let counter = 1;
            
            while (currentDate <= today) {
                const isPaid = currentDate < today;
                
                let paidDate = null;
                if (isPaid) {
                    paidDate = new Date(currentDate);
                    paidDate.setDate(paidDate.getDate() + Math.floor(Math.random() * 3) + 1); // 1-3 days after due date
                }
                
                profits.push({
                    id: `profit-${investorId}-${counter}`,
                    amount: monthlyProfit,
                    dueDate: currentDate.toISOString(),
                    paidDate: paidDate ? paidDate.toISOString() : null,
                    status: isPaid ? 'paid' : 'pending',
                    cycle: 'شهرية'
                });
                
                currentDate.setMonth(currentDate.getMonth() + 1);
                counter++;
            }
            
            // Sort by date, newest first
            return profits.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
        },
        
        /**
         * Create HTML for a profit item
         * @param {Object} profit - Profit object
         * @returns {string} HTML for the profit item
         */
        createProfitHTML: function(profit) {
            const statusClass = profit.status === 'paid' ? 'badge-success' : 'badge-warning';
            const statusText = profit.status === 'paid' ? 'مدفوع' : 'مستحق';
            
            return `
                <div class="data-item">
                    <div class="data-item-header">
                        <div class="data-item-title">${InvestorCardSystem.formatCurrency(profit.amount)}</div>
                        <div class="data-item-badge ${statusClass}">${statusText}</div>
                    </div>
                    <div class="data-item-details">
                        <div class="data-detail">
                            <div class="data-detail-label">تاريخ الاستحقاق</div>
                            <div class="data-detail-value">${InvestorCardSystem.formatDate(profit.dueDate)}</div>
                        </div>
                        <div class="data-detail">
                            <div class="data-detail-label">تاريخ الدفع</div>
                            <div class="data-detail-value">${profit.paidDate ? InvestorCardSystem.formatDate(profit.paidDate) : '-'}</div>
                        </div>
                        <div class="data-detail">
                            <div class="data-detail-label">الدورة</div>
                            <div class="data-detail-value">${profit.cycle || 'شهرية'}</div>
                        </div>
                    </div>
                </div>
            `;
        },
        
        /**
         * Update profit summary in the UI
         * @param {string} investorId - ID of the investor
         * @param {Array} profits - Array of profit objects
         */
        updateProfitSummary: function(investorId, profits) {
            // Calculate total received profits
            const totalReceived = profits
                .filter(profit => profit.status === 'paid')
                .reduce((sum, profit) => sum + profit.amount, 0);
            
            // Update total received amount
            const totalReceivedElement = document.getElementById('total-received-profits');
            if (totalReceivedElement) {
                totalReceivedElement.textContent = InvestorCardSystem.formatCurrency(totalReceived);
            }
            
            // Calculate current month progress
            const investor = InvestorCardSystem.getInvestorById(investorId);
            if (!investor) return;
            
            const amount = investor.amount || 0;
            const monthlyTarget = amount * 0.015; // 1.5% monthly return
            // Calculate progress based on current day of month
            const today = new Date();
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const currentDay = today.getDate();
            const progress = (currentDay / daysInMonth) * 100;
            const currentMonthProfit = (monthlyTarget * currentDay) / daysInMonth;
            
            // Update progress bar
            const progressFill = document.querySelector('.progress-fill');
            const progressPercentage = document.getElementById('profit-percentage');
            const currentProfitElement = document.getElementById('current-profit');
            const targetProfitElement = document.getElementById('target-profit');
            
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (progressPercentage) progressPercentage.textContent = `${Math.round(progress)}%`;
            if (currentProfitElement) currentProfitElement.textContent = InvestorCardSystem.formatCurrency(currentMonthProfit);
            if (targetProfitElement) targetProfitElement.textContent = InvestorCardSystem.formatCurrency(monthlyTarget);
        },
        
        /**
         * Update notification badge with unread count
         */
        updateNotificationBadge: function() {
            const badge = document.querySelector('.notification-badge');
            if (!badge) return;
            
            // Get notifications
            const notifications = this.getNotifications();
            
            // Count unread
            const unreadCount = notifications.filter(notif => !notif.read).length;
            
            // Update badge
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        },
        
        /**
         * Get notifications
         * @returns {Array} Array of notification objects
         */
        getNotifications: function() {
            // This is a placeholder that would typically fetch from backend
            // For demo purposes, we'll generate sample data
            
            return [
                {
                    id: 'notif-1',
                    title: 'تم إضافة الربح الشهري',
                    message: 'تم إضافة الربح الشهري إلى حسابك',
                    time: '2023-09-01T10:00:00',
                    type: 'profit',
                    read: true
                },
                {
                    id: 'notif-2',
                    title: 'تحديث بيانات البطاقة',
                    message: 'تم تحديث بيانات بطاقتك بنجاح',
                    time: '2023-09-15T14:30:00',
                    type: 'card',
                    read: false
                },
                {
                    id: 'notif-3',
                    title: 'عرض خاص للمستثمرين',
                    message: 'استفد من العرض الخاص للمستثمرين لفترة محدودة',
                    time: '2023-09-20T09:15:00',
                    type: 'promo',
                    read: false
                }
            ];
        },
        
        /**
         * Mark all notifications as read
         */
        markAllNotificationsAsRead: function() {
            const notifications = this.getNotifications();
            
            // Mark all as read
            notifications.forEach(notif => {
                notif.read = true;
            });
            
            // Update UI
            this.updateNotificationBadge();
            
            // Refresh notifications list if visible
            const notificationsList = document.getElementById('notifications-list');
            if (notificationsList && notificationsList.closest('.modal.active')) {
                this.loadNotifications();
            }
        },
        
        /**
         * Load notifications into the UI
         */
        loadNotifications: function() {
            const notificationsList = document.getElementById('notifications-list');
            if (!notificationsList) return;
            
            const notifications = this.getNotifications();
            
            let html = '';
            
            if (notifications && notifications.length > 0) {
                notifications.forEach(notification => {
                    html += this.createNotificationHTML(notification);
                });
            } else {
                html = '<div class="empty-list">لا توجد إشعارات</div>';
            }
            
            notificationsList.innerHTML = html;
        },
        
        /**
         * Create HTML for a notification item
         * @param {Object} notification - Notification object
         * @returns {string} HTML for the notification item
         */
        createNotificationHTML: function(notification) {
            const readClass = notification.read ? '' : 'unread';
            
            // Format the time
            const notifTime = new Date(notification.time);
            const timeString = InvestorCardSystem.formatDate(notifTime);
            
            // Icon based on type
            let iconClass = 'fa-bell';
            if (notification.type === 'profit') iconClass = 'fa-coins';
            else if (notification.type === 'card') iconClass = 'fa-credit-card';
            else if (notification.type === 'promo') iconClass = 'fa-tag';
            
            return `
                <div class="notification-item ${readClass}" data-id="${notification.id}">
                    <div class="notification-icon">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notification.title}</div>
                        <div class="notification-message">${notification.message}</div>
                        <div class="notification-time">${timeString}</div>
                    </div>
                </div>
            `;
        },
        
        /**
         * Flip the card (show front/back)
         */
        flipCard: function() {
            const card = document.querySelector('.investor-card');
            const flipButton = document.getElementById('flip-card-btn');
            
            if (!card || !flipButton) return;
            
            // Toggle flipped class
            card.classList.toggle('flipped');
            
            // Update button text
            const isFlipped = card.classList.contains('flipped');
            const buttonText = flipButton.querySelector('span');
            
            if (buttonText) {
                buttonText.textContent = isFlipped ? 'عرض الأمام' : 'عرض الخلف';
            }
        },
        
        /**
         * Generate QR code for the card
         */
        generateQRCode: function() {
            const card = InvestorCardSystem.getCurrentCard();
            if (!card) return;
            
            const qrContainer = document.getElementById('card-qr-code');
            if (!qrContainer) return;
            
            // Clear previous content
            qrContainer.innerHTML = '';
            
            // Prepare data for QR code
            const cardData = {
                id: card.id,
                number: card.cardNumber,
                name: card.investorName,
                expiry: card.expiryDate
            };
            
            const dataString = JSON.stringify(cardData);
            
            // Check if QRCode library is available
            if (typeof QRCode !== 'undefined') {
                new QRCode(qrContainer, {
                    text: dataString,
                    width: 200,
                    height: 200,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            } else {
                // Fallback to an external service
                const encodedData = encodeURIComponent(dataString);
                qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}" alt="QR Code">`;
            }
        },
        
        /**
         * Save the QR code as an image
         */
        saveQRCode: function() {
            const qrContainer = document.getElementById('card-qr-code');
            if (!qrContainer) return;
            
            const canvas = qrContainer.querySelector('canvas');
            const img = qrContainer.querySelector('img');
            
            if (canvas) {
                // Try to save canvas as image
                try {
                    const link = document.createElement('a');
                    link.download = 'investor-card-qr.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                } catch (error) {
                    console.error('Error saving QR code:', error);
                    alert('لا يمكن حفظ الصورة. يرجى المحاولة مرة أخرى لاحقاً.');
                }
            } else if (img) {
                // Try to save image
                try {
                    const link = document.createElement('a');
                    link.download = 'investor-card-qr.png';
                    link.href = img.src;
                    link.click();
                } catch (error) {
                    console.error('Error saving QR code image:', error);
                    alert('لا يمكن حفظ الصورة. يرجى المحاولة مرة أخرى لاحقاً.');
                }
            }
        },
        
        /**
         * Prepare content for sharing
         */
        prepareShareContent: function() {
            const card = InvestorCardSystem.getCurrentCard();
            if (!card) return;
            
            const shareText = document.getElementById('share-text');
            if (!shareText) return;
            
            // Mask card number for security
            const maskedNumber = this.maskCardNumber(card.cardNumber);
            
            // Create share text
            const content = `بطاقة المستثمر
الاسم: ${card.investorName}
رقم البطاقة: ${maskedNumber}
تاريخ الانتهاء: ${card.expiryDate}
نوع البطاقة: ${this.getCardTypeName(card.cardType)}`;
            
            shareText.value = content;
        },
        
        /**
         * Mask card number for security
         * @param {string} cardNumber - Full card number
         * @returns {string} Masked card number
         */
        maskCardNumber: function(cardNumber) {
            if (!cardNumber) return 'XXXX XXXX XXXX XXXX';
            
            // Format and mask card number
            const formattedNumber = this.formatCardNumber(cardNumber);
            const parts = formattedNumber.split(' ');
            
            if (parts.length === 4) {
                return `XXXX XXXX XXXX ${parts[3]}`;
            } else {
                // For other formats
                return 'XXXX XXXX XXXX XXXX';
            }
        },
        
        /**
         * Get card type display name
         * @param {string} cardType - Type of card
         * @returns {string} Display name for the card type
         */
        getCardTypeName: function(cardType) {
            const cardTypeNames = {
                platinum: 'بلاتينية',
                gold: 'ذهبية',
                premium: 'بريميوم',
                diamond: 'ماسية',
                islamic: 'إسلامية',
                custom: 'مخصصة'
            };
            
            return cardTypeNames[cardType] || 'بلاتينية';
        },
        
        /**
         * Handle share action
         * @param {string} method - Sharing method (whatsapp, email, copy)
         */
        handleShare: function(method) {
            const shareText = document.getElementById('share-text');
            if (!shareText) return;
            
            const content = shareText.value;
            
            switch (method) {
                case 'whatsapp':
                    // Open WhatsApp with pre-filled text
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(content)}`;
                    window.open(whatsappUrl, '_blank');
                    break;
                    
                case 'email':
                    // Open email client with pre-filled content
                    const emailUrl = `mailto:?subject=بطاقة المستثمر&body=${encodeURIComponent(content)}`;
                    window.location.href = emailUrl;
                    break;
                    
                case 'copy':
                    // Copy to clipboard
                    shareText.select();
                    shareText.setSelectionRange(0, 99999);
                    
                    try {
                        document.execCommand('copy');
                        alert('تم نسخ النص إلى الحافظة');
                    } catch (error) {
                        console.error('Error copying text:', error);
                        
                        // Try modern clipboard API
                        if (navigator.clipboard) {
                            navigator.clipboard.writeText(content)
                                .then(() => alert('تم نسخ النص إلى الحافظة'))
                                .catch(err => {
                                    console.error('Error copying text with Clipboard API:', err);
                                    alert('فشل نسخ النص. يرجى المحاولة مرة أخرى.');
                                });
                        } else {
                            alert('فشل نسخ النص. يرجى المحاولة مرة أخرى.');
                        }
                    }
                    break;
            }
        },
        
        /**
         * Handle support message submission
         */
        handleSupportMessage: function() {
            const subject = document.getElementById('support-subject').value;
            const message = document.getElementById('support-message').value;
            
            if (!subject || !message) {
                alert('يرجى إدخال الموضوع والرسالة');
                return;
            }
            
            // This would typically send a request to the backend
            // For demo purposes, we'll just show a success message
            alert('تم إرسال رسالتك بنجاح. سيتم التواصل معك قريباً.');
            
            // Close modal
            this.hideModal('support-modal');
            
            // Reset form
            document.getElementById('support-subject').value = '';
            document.getElementById('support-message').value = '';
        },
        
        /**
         * Show a modal
         * @param {string} modalId - ID of the modal to show
         */
        showModal: function(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) return;
            
            // Show modal
            modal.classList.add('active');
            
            // Perform modal-specific initializations
            switch (modalId) {
                case 'notifications-modal':
                    this.loadNotifications();
                    break;
                    
                case 'qr-modal':
                    this.generateQRCode();
                    break;
                    
                case 'share-modal':
                    this.prepareShareContent();
                    break;
            }
        },
        
        /**
         * Hide a modal
         * @param {string} modalId - ID of the modal to hide
         */
        hideModal: function(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) return;
            
            // Hide modal
            modal.classList.remove('active');
        },
        
        /**
         * Format card number with spaces
         * @param {string} value - Card number to format
         * @returns {string} Formatted card number
         */
        formatCardNumber: function(value) {
            if (!value) return '';
            
            // Remove non-digit characters
            const cardNumber = value.replace(/\D/g, '');
            
            // Add a space after every 4 digits
            return cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
        },
        
        /**
         * Format expiry date (MM/YY)
         * @param {string} value - Expiry date to format
         * @returns {string} Formatted expiry date
         */
        formatExpiryDate: function(value) {
            if (!value) return '';
            
            // Remove non-digit characters
            const expiry = value.replace(/\D/g, '');
            
            // Format as MM/YY
            if (expiry.length > 2) {
                return `${expiry.substring(0, 2)}/${expiry.substring(2, 4)}`;
            }
            
            return expiry;
        },
        
        /**
         * Update PIN value from individual inputs
         */
        updatePINValue: function() {
            const pinInputs = document.querySelectorAll('.pin-input');
            const pinField = document.getElementById('card-pin');
            
            if (!pinField) return;
            
            // Combine PIN inputs
            let pin = '';
            pinInputs.forEach(input => {
                pin += input.value;
            });
            
            pinField.value = pin;
        }
    };
})();

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Start application initialization
    App.init();
});

// Helper for handling Firebase errors
window.resetInvestorCardSystemState = function() {
    if (window.InvestorCardSystem) {
        // Reset loading state
        window.InvestorCardSystem.isLoading = false;
        console.log('InvestorCardSystem loading state reset');
        
        // Hide error messages
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });
        
        // Hide reset button
        const resetBtn = document.getElementById('reset-login-state');
        if (resetBtn) {
            resetBtn.style.display = 'none';
        }
        
        return true;
    }
    
    return false;
};

/**
 * إضافة أكواد معالجة تحميل صور QR من الجهاز
 * أضف هذا الكود في وظيفة setupEventListeners في ملف app.js
 */

// أزرار تبديل وضع المسح (كاميرا/ملف)
const cameraScanBtn = document.getElementById('camera-scan-btn');
const fileScanBtn = document.getElementById('file-scan-btn');
if (cameraScanBtn && fileScanBtn) {
    cameraScanBtn.addEventListener('click', () => {
        this.switchScanMode('camera');
    });
    
    fileScanBtn.addEventListener('click', () => {
        this.switchScanMode('file');
    });
}

// أزرار تحميل الملفات
const browseFileBtn = document.getElementById('browse-file-btn');
const qrFileInput = document.getElementById('qr-file-input');
if (browseFileBtn && qrFileInput) {
    browseFileBtn.addEventListener('click', () => {
        qrFileInput.click();
    });
    
    qrFileInput.addEventListener('change', (e) => {
        this.handleQRFileSelected(e);
    });
}

// زر مسح الملف المحدد
const scanSelectedFileBtn = document.getElementById('scan-selected-file-btn');
if (scanSelectedFileBtn) {
    scanSelectedFileBtn.addEventListener('click', () => {
        this.scanSelectedQRFile();
    });
}

/**
 * أضف هذه الدوال في كائن App (قبل return)
 */

/**
 * تبديل وضع المسح بين الكاميرا وتحميل الملفات
 * @param {string} mode - وضع المسح: 'camera' أو 'file'
 */
switchScanMode: function(mode) {
    const cameraScanBtn = document.getElementById('camera-scan-btn');
    const fileScanBtn = document.getElementById('file-scan-btn');
    const cameraScanContainer = document.getElementById('camera-scan-container');
    const fileScanContainer = document.getElementById('file-scan-container');
    const resultsContainer = document.getElementById('qr-reader-results');
    
    if (!cameraScanBtn || !fileScanBtn || !cameraScanContainer || !fileScanContainer) {
        return;
    }
    
    // إعادة تعيين نتائج المسح
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }
    
    // إيقاف الماسح الحالي إذا كان قيد التشغيل
    if (this.currentQrScanner) {
        this.currentQrScanner.stop()
            .then(() => console.log('تم إيقاف قارئ QR الحالي'))
            .catch(err => console.error('خطأ في إيقاف قارئ QR:', err));
        this.currentQrScanner = null;
    }
    
    if (mode === 'camera') {
        // تنشيط وضع الكاميرا
        cameraScanBtn.classList.add('active');
        fileScanBtn.classList.remove('active');
        
        cameraScanContainer.classList.remove('hidden');
        fileScanContainer.classList.add('hidden');
        
        // إعادة تشغيل ماسح الكاميرا
        this.initQRScanner();
    } else if (mode === 'file') {
        // تنشيط وضع تحميل الملفات
        fileScanBtn.classList.add('active');
        cameraScanBtn.classList.remove('active');
        
        fileScanContainer.classList.remove('hidden');
        cameraScanContainer.classList.add('hidden');
        
        // إعادة تعيين حقل تحميل الملفات
        const qrFileInput = document.getElementById('qr-file-input');
        if (qrFileInput) {
            qrFileInput.value = '';
        }
        
        // إخفاء معلومات الملف المحدد
        const selectedFileInfo = document.getElementById('selected-file-info');
        if (selectedFileInfo) {
            selectedFileInfo.classList.add('hidden');
        }
        
        // مسح معاينة الصورة
        const previewContainer = document.querySelector('.selected-image-preview');
        if (previewContainer) {
            previewContainer.innerHTML = '';
        }
    }
},

/**
 * معالجة اختيار ملف صورة QR
 * @param {Event} event - حدث تغيير ملف الإدخال
 */
handleQRFileSelected: function(event) {
    const resultsContainer = document.getElementById('qr-reader-results');
    const selectedFileInfo = document.getElementById('selected-file-info');
    const selectedFileName = document.querySelector('.selected-file-name');
    const previewContainer = document.querySelector('.selected-image-preview');
    
    if (!event.target.files || !event.target.files.length) {
        return;
    }
    
    // الحصول على الملف المحدد
    const file = event.target.files[0];
    
    // التحقق من أن الملف صورة
    if (!file.type.match('image.*')) {
        if (resultsContainer) {
            resultsContainer.innerHTML = '<p class="scan-error">يرجى اختيار ملف صورة صالح.</p>';
        }
        return;
    }
    
    // عرض معلومات الملف المحدد
    if (selectedFileInfo && selectedFileName) {
        selectedFileInfo.classList.remove('hidden');
        selectedFileName.innerHTML = `<i class="fas fa-file-image"></i> ${file.name}`;
    }
    
    // إنشاء معاينة للصورة
    if (previewContainer) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            previewContainer.innerHTML = `<img src="${e.target.result}" alt="معاينة صورة QR">`;
        };
        
        reader.readAsDataURL(file);
    }
    
    // إعادة تعيين نتائج المسح
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }
},

/**
 * مسح ملف صورة QR المحدد
 */
scanSelectedQRFile: function() {
    const qrFileInput = document.getElementById('qr-file-input');
    const resultsContainer = document.getElementById('qr-reader-results');
    
    if (!qrFileInput || !qrFileInput.files || !qrFileInput.files.length) {
        if (resultsContainer) {
            resultsContainer.innerHTML = '<p class="scan-error">يرجى اختيار ملف صورة أولاً.</p>';
        }
        return;
    }
    
    const file = qrFileInput.files[0];
    
    if (resultsContainer) {
        resultsContainer.innerHTML = '<p>جاري مسح الصورة...</p>';
    }
    
    // استخدام Html5Qrcode لقراءة الصورة
    const html5QrCode = new Html5Qrcode("qr-reader");
    
    // قراءة الملف
    html5QrCode.scanFile(file, true)
        .then(decodedText => {
            // تم مسح الرمز بنجاح
            this.onQRCodeScanned(decodedText);
        })
        .catch(error => {
            // خطأ في مسح الرمز
            console.error("خطأ في مسح ملف QR:", error);
            if (resultsContainer) {
                resultsContainer.innerHTML = '<p class="scan-error">لم يتم العثور على رمز QR في الصورة. يرجى التأكد من اختيار صورة واضحة تحتوي على رمز QR.</p>';
            }
        });
},

/**
 * تعديل دالة showQRScanner لإعداد الواجهة
 */
showQRScanner: function() {
    // عرض المودال
    this.showModal('qr-scanner-modal');
    
    // تنشيط وضع الكاميرا افتراضياً
    this.switchScanMode('camera');
},

/**
 * تعديل دالة initQRScanner لتحسين الأداء
 */
initQRScanner: function() {
    // التحقق من وجود الماسح والمكتبة
    const qrReader = document.getElementById('qr-reader');
    const resultsContainer = document.getElementById('qr-reader-results');
    
    if (!qrReader || typeof Html5Qrcode === 'undefined') {
        if (resultsContainer) {
            resultsContainer.innerHTML = '<p class="scan-error">لا يمكن تهيئة قارئ QR. تأكد من السماح بالوصول للكاميرا.</p>';
        }
        return;
    }
    
    // تفريغ نتائج سابقة
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }
    
    // التحقق من أن العنصر فارغ قبل التهيئة
    if (qrReader.childElementCount > 0) {
        qrReader.innerHTML = '';
    }
    
    // إنشاء كائن قارئ QR
    const html5QrCode = new Html5Qrcode("qr-reader");
    
    // تخزين مرجع القارئ الحالي (لإيقافه لاحقاً)
    this.currentQrScanner = html5QrCode;
    
    // خيارات المسح
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
    };
    
    // التحقق من وجود كاميرات
    Html5Qrcode.getCameras()
        .then(cameras => {
            if (cameras && cameras.length) {
                // اختيار الكاميرا الخلفية إذا وجدت
                let cameraId = cameras[0].id;
                
                // البحث عن الكاميرا الخلفية
                const backCamera = cameras.find(camera => 
                    camera.label.toLowerCase().includes('back') || 
                    camera.label.toLowerCase().includes('خلفية')
                );
                
                if (backCamera) {
                    cameraId = backCamera.id;
                }
                
                // بدء المسح بالكاميرا
                return html5QrCode.start(
                    cameraId,
                    config,
                    this.onQRCodeScanned.bind(this),
                    this.onQRScanError.bind(this)
                );
            } else {
                // لا توجد كاميرات متاحة
                throw new Error('لم يتم العثور على كاميرات');
            }
        })
        .catch(err => {
            console.error('خطأ في تهيئة الكاميرا:', err);
            
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <p class="scan-error">تعذر الوصول إلى الكاميرا. ${err.message || ''}.</p>
                    <p class="mt-sm">يمكنك استخدام خيار تحميل صورة بدلاً من ذلك.</p>
                `;
            }
            
            // التبديل إلى وضع تحميل الملفات
            this.switchScanMode('file');
        });
    
    // إيقاف القارئ عند إغلاق المودال
    const modalClose = document.querySelector('#qr-scanner-modal .modal-close');
    const modalCloseBtn = document.querySelector('#qr-scanner-modal .modal-close-btn');
    const modalOverlay = document.querySelector('#qr-scanner-modal .modal-overlay');
    
    const stopScannerFn = () => {
        if (this.currentQrScanner) {
            this.currentQrScanner.stop()
                .then(() => console.log('تم إيقاف قارئ QR'))
                .catch(err => console.error('خطأ في إيقاف قارئ QR:', err));
            this.currentQrScanner = null;
        }
    };
    
    if (modalClose) {
        modalClose.addEventListener('click', stopScannerFn, { once: true });
    }
    
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', stopScannerFn, { once: true });
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                stopScannerFn();
            }
        }, { once: true });
    }
}