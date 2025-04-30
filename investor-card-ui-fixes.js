/**
 * investor-card-ui-fixes.js
 * 
 * Mejoras para la interfaz de usuario de la tarjeta del inversionista
 * Sincroniza la visualización de datos entre la tarjeta y el sistema principal
 */

// Módulo para extender la funcionalidad de la interfaz de usuario de la tarjeta
const InvestorCardUI = (function() {
    // Variables del módulo
    let initialized = false;
    let currentInvestorId = null;
    let transactionsData = [];
    let investmentsData = [];
    let profitsData = [];
    
    // Inicializar el módulo de interfaz
    function initialize() {
        console.log('Inicializando interfaz de tarjeta del inversionista...');
        
        if (initialized) {
            console.log('La interfaz de tarjeta ya está inicializada');
            return;
        }
        
        // Configurar escuchadores de eventos
        setupEventListeners();
        
        // Inicializar animaciones y efectos visuales
        initializeVisualEffects();
        
        // Agregar estilos adicionales
        addAdditionalStyles();
        
        // Comprobar si hay un inversionista actual
        checkCurrentInvestor();
        
        initialized = true;
        console.log('Interfaz de tarjeta del inversionista inicializada con éxito');
    }
    
    // Configurar escuchadores de eventos
    function setupEventListeners() {
        // Escuchar clic en la tarjeta para voltearla
        const card = document.querySelector('.investor-card');
        if (card) {
            card.addEventListener('dblclick', function() {
                this.classList.toggle('flipped');
                
                // Actualizar texto del botón de voltear
                const flipBtn = document.getElementById('flip-card-btn');
                if (flipBtn) {
                    const isFlipped = this.classList.contains('flipped');
                    flipBtn.querySelector('span').textContent = isFlipped ? 'عرض الأمام' : 'عرض الخلف';
                }
            });
        }
        
        // Escuchar clic en los botones de acción de la tarjeta
        const flipCardBtn = document.getElementById('flip-card-btn');
        if (flipCardBtn) {
            flipCardBtn.addEventListener('click', function() {
                const card = document.querySelector('.investor-card');
                if (card) {
                    card.classList.toggle('flipped');
                    this.querySelector('span').textContent = card.classList.contains('flipped') ? 'عرض الأمام' : 'عرض الخلف';
                }
            });
        }
        
        // Botón para mostrar código QR
        const showQrBtn = document.getElementById('show-qr-btn');
        if (showQrBtn) {
            showQrBtn.addEventListener('click', function() {
                // Mostrar modal de QR
                const qrModal = document.getElementById('qr-modal');
                if (qrModal) {
                    qrModal.classList.add('active');
                    
                    // Generar código QR con la información actual
                    generateQRCode();
                }
            });
        }
        
        // Botón para compartir tarjeta
        const shareCardBtn = document.getElementById('share-card-btn');
        if (shareCardBtn) {
            shareCardBtn.addEventListener('click', function() {
                // Mostrar modal de compartir
                const shareModal = document.getElementById('share-modal');
                if (shareModal) {
                    shareModal.classList.add('active');
                    
                    // Preparar contenido para compartir
                    prepareShareContent();
                }
            });
        }
        
        // Cerrar modales al hacer clic en la X o el botón de cerrar
        document.querySelectorAll('.modal-close, .modal-close-btn').forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Escuchar clic en los botones de filtro de transacciones
        document.querySelectorAll('.transaction-filters .filter-btn').forEach(button => {
            button.addEventListener('click', function() {
                // Quitar clase activa de todos los botones
                document.querySelectorAll('.transaction-filters .filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Agregar clase activa al botón actual
                this.classList.add('active');
                
                // Filtrar las transacciones
                const filterType = this.getAttribute('data-filter');
                filterTransactions(filterType);
            });
        });
        
        // Escuchar clic en los botones de la barra de navegación inferior
        document.querySelectorAll('.bottom-navbar .nav-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Quitar clase activa de todos los elementos
                document.querySelectorAll('.bottom-navbar .nav-item').forEach(navItem => {
                    navItem.classList.remove('active');
                });
                
                // Agregar clase activa al elemento actual
                this.classList.add('active');
                
                // Obtener el ID de la sección a mostrar
                const sectionId = this.getAttribute('href').substring(1);
                
                // Mostrar la sección correspondiente
                showSection(sectionId);
            });
        });
        
        // Escuchar eventos del sistema de sincronización si está disponible
        if (window.InvestorCardSync) {
            document.addEventListener(window.InvestorCardSync.EVENTS.SYNC_COMPLETE, function(e) {
                console.log('Sincronización completada, actualizando interfaz...', e.detail);
                refreshUIAfterSync();
            });
            
            document.addEventListener(window.InvestorCardSync.EVENTS.DATA_UPDATED, function(e) {
                console.log('Datos actualizados, actualizando interfaz...', e.detail);
                refreshUIAfterSync();
            });
        }
        
        // Escuchar clic en tarjeta para iniciar modo de edición
        const cardContainer = document.getElementById('card-container');
        if (cardContainer) {
            cardContainer.addEventListener('dblclick', function(e) {
                // Solo permitir doble clic si es en la tarjeta pero no en un botón
                if (e.target.closest('.card-action-btn')) {
                    return;
                }
                
                // Mostrar notificación de modo de vista
                showToast('طريقة العرض', 'انقر مرتين لقلب البطاقة', 'info');
            });
        }
        
        console.log('Escuchadores de eventos configurados');
    }
    
    // Inicializar animaciones y efectos visuales
    function initializeVisualEffects() {
        // Agregar efecto 3D a la tarjeta al mover el mouse
        const card = document.querySelector('.investor-card');
        if (card) {
            card.addEventListener('mousemove', function(e) {
                // Solo aplicar efecto si la tarjeta no está volteada
                if (this.classList.contains('flipped')) {
                    return;
                }
                
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Calcular la rotación basada en la posición del mouse
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateY = ((x - centerX) / centerX) * 5; // Max 5 degrees
                const rotateX = -((y - centerY) / centerY) * 5; // Max 5 degrees
                
                // Aplicar la transformación
                this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });
            
            // Restaurar al dejar de pasar el mouse
            card.addEventListener('mouseleave', function() {
                this.style.transform = '';
            });
        }
        
        // Animaciones para mostrar saldo
        const balanceAmount = document.getElementById('total-balance');
        if (balanceAmount) {
            animateNumber(balanceAmount, 0, extractNumberFromCurrency(balanceAmount.textContent), 1000);
        }
        
        // Animación para la barra de progreso
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            setTimeout(() => {
                const width = progressFill.style.width || '0%';
                progressFill.style.width = '0%';
                setTimeout(() => {
                    progressFill.style.width = width;
                }, 100);
            }, 500);
        }
    }
    
    // Agregar estilos adicionales
    function addAdditionalStyles() {
        // Verificar si ya se han agregado los estilos
        if (document.getElementById('investor-card-additional-styles')) {
            return;
        }
        
        // Crear elemento de estilo
        const styleElement = document.createElement('style');
        styleElement.id = 'investor-card-additional-styles';
        
        // Agregar estilos para efectos visuales mejorados
        styleElement.textContent = `
            .investor-card {
                transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
            }
            
            @keyframes balance-pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            .balance-amount.pulse {
                animation: balance-pulse 0.5s ease;
            }
            
            .progress-fill {
                transition: width 1.5s cubic-bezier(0.22, 1, 0.36, 1);
            }
            
            /* Mejoras de estilo para modales */
            .modal-container {
                transform: translateY(20px);
                opacity: 0;
                transition: transform 0.3s, opacity 0.3s;
            }
            
            .modal.active .modal-container {
                transform: translateY(0);
                opacity: 1;
            }
            
            /* Mejora visual para las tarjetas de estadísticas */
            .stat-card:nth-child(1) .stat-icon {
                color: #2ecc71;
            }
            
            .stat-card:nth-child(2) .stat-icon {
                color: #3498db;
            }
            
            .stat-card:nth-child(3) .stat-icon {
                color: #e74c3c;
            }
            
            /* Mejora para la visualización de actividades */
            @keyframes highlight-new {
                0% { background-color: rgba(52, 152, 219, 0.2); }
                100% { background-color: transparent; }
            }
            
            .data-item.new {
                animation: highlight-new 2s ease;
            }
        `;
        
        // Agregar el estilo al documento
        document.head.appendChild(styleElement);
    }
    
    // Comprobar si hay un inversionista actual
    function checkCurrentInvestor() {
        // Obtener el ID del inversionista actual desde la tarjeta
        const currentCard = window.InvestorCardSystem ? window.InvestorCardSystem.getCurrentCard() : null;
        
        if (currentCard && currentCard.investorId) {
            currentInvestorId = currentCard.investorId;
            
            // Cargar datos del inversionista
            loadInvestorData(currentInvestorId);
        }
    }
    
    // Cargar datos del inversionista
    function loadInvestorData(investorId) {
        if (!investorId) return;
        
        console.log(`Cargando datos del inversionista ${investorId}...`);
        
        // Cargar transacciones
        if (window.transactionsList) {
            transactionsData = window.transactionsList.filter(tx => tx.investorId === investorId);
        } else if (window.transactions) {
            transactionsData = window.transactions.filter(tx => tx.investorId === investorId);
        }
        
        // Cargar inversiones
        const investor = findInvestorById(investorId);
        if (investor && investor.investments) {
            investmentsData = investor.investments;
        }
        
        // Cargar ganancias
        if (window.profitsList) {
            profitsData = window.profitsList.filter(profit => profit.investorId === investorId);
        }
        
        // Actualizar la interfaz con los datos cargados
        updateUI();
    }
    
    // Actualizar la interfaz con los datos del inversionista
    function updateUI() {
        // Actualizar transacciones
        updateTransactionsList();
        
        // Actualizar inversiones
        updateInvestmentsList();
        
        // Actualizar ganancias
        updateProfitsList();
        
        // Actualizar estadísticas
        updateStatistics();
    }
    
    // Actualizar la lista de transacciones
    function updateTransactionsList() {
        const container = document.getElementById('transactions-list');
        if (!container || !transactionsData || !transactionsData.length) return;
        
        // Ordenar transacciones por fecha (más recientes primero)
        const sortedTransactions = [...transactionsData].sort((a, b) => {
            return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
        });
        
        // Generar HTML
        let html = '';
        
        sortedTransactions.forEach(transaction => {
            html += createTransactionItemHTML(transaction);
        });
        
        // Actualizar contenedor
        container.innerHTML = html || '<div class="empty-list">لا توجد عمليات متاحة</div>';
    }
    
    // Crear HTML para un elemento de transacción
    function createTransactionItemHTML(transaction) {
        // Clase CSS según el tipo de transacción
        const typeClass = getTransactionTypeClass(transaction.type);
        
        // Formatear fecha y monto
        const date = formatDate(transaction.date || transaction.createdAt);
        const amount = formatCurrency(transaction.amount);
        
        return `
            <div class="data-item">
                <div class="data-item-header">
                    <div class="data-item-title">${amount}</div>
                    <div class="data-item-badge ${typeClass}">${transaction.type || 'عملية'}</div>
                </div>
                <div class="data-item-details">
                    <div class="data-detail">
                        <div class="data-detail-label">التاريخ</div>
                        <div class="data-detail-value">${date}</div>
                    </div>
                    <div class="data-detail">
                        <div class="data-detail-label">الرصيد بعد العملية</div>
                        <div class="data-detail-value">${formatCurrency(transaction.balanceAfter || 0)}</div>
                    </div>
                    <div class="data-detail">
                        <div class="data-detail-label">ملاحظات</div>
                        <div class="data-detail-value">${transaction.notes || '-'}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Obtener clase CSS para el tipo de transacción
    function getTransactionTypeClass(type) {
        const typeMap = {
            'إيداع': 'badge-success',
            'deposit': 'badge-success',
            'سحب': 'badge-danger',
            'withdraw': 'badge-danger',
            'ربح': 'badge-primary',
            'profit': 'badge-primary',
            'تحويل': 'badge-warning',
            'transfer': 'badge-warning'
        };
        
        return typeMap[type] || 'badge-secondary';
    }
    
    // Filtrar transacciones por tipo
    function filterTransactions(filterType) {
        const items = document.querySelectorAll('#transactions-list .data-item');
        if (!items.length) return;
        
        // Mapear tipos de filtro a textos en árabe
        const typeMap = {
            'deposit': 'إيداع',
            'withdraw': 'سحب',
            'profit': 'ربح'
        };
        
        items.forEach(item => {
            if (filterType === 'all') {
                item.style.display = '';
                return;
            }
            
            const badge = item.querySelector('.data-item-badge');
            if (!badge) {
                item.style.display = 'none';
                return;
            }
            
            const itemType = badge.textContent.trim();
            const filterText = typeMap[filterType] || filterType;
            
            item.style.display = (itemType === filterText) ? '' : 'none';
        });
    }
    
    // Actualizar la lista de inversiones
    function updateInvestmentsList() {
        const container = document.getElementById('investments-list');
        if (!container) return;
        
        // Si no hay inversiones específicas, usar el monto total del inversionista
        if (!investmentsData || !investmentsData.length) {
            const investor = findInvestorById(currentInvestorId);
            if (investor && investor.amount) {
                // Crear una inversión "virtual" con el monto total
                const singleInvestment = {
                    amount: investor.amount,
                    date: investor.joinDate || investor.createdAt,
                    status: 'active'
                };
                
                container.innerHTML = createInvestmentItemHTML(singleInvestment);
                return;
            }
            
            container.innerHTML = '<div class="empty-list">لا توجد استثمارات متاحة</div>';
            return;
        }
        
        // Generar HTML para cada inversión
        let html = '';
        
        investmentsData.forEach(investment => {
            html += createInvestmentItemHTML(investment);
        });
        
        // Actualizar contenedor
        container.innerHTML = html;
    }
    
    // Crear HTML para un elemento de inversión
    function createInvestmentItemHTML(investment) {
        // Obtener tasa de interés de la configuración
        const interestRate = window.systemConfig ? window.systemConfig.interestRate : 17.5;
        
        // Calcular días activos
        const daysActive = calculateInvestmentDays(investment.date);
        
        // Determinar estado
        const isActive = investment.status !== 'inactive';
        const statusClass = isActive ? 'badge-success' : 'badge-warning';
        const statusText = isActive ? 'نشط' : 'غير نشط';
        
        return `
            <div class="data-item">
                <div class="data-item-header">
                    <div class="data-item-title">${formatCurrency(investment.amount)}</div>
                    <div class="data-item-badge ${statusClass}">${statusText}</div>
                </div>
                <div class="data-item-details">
                    <div class="data-detail">
                        <div class="data-detail-label">تاريخ الاستثمار</div>
                        <div class="data-detail-value">${formatDate(investment.date)}</div>
                    </div>
                    <div class="data-detail">
                        <div class="data-detail-label">معدل العائد</div>
                        <div class="data-detail-value">${interestRate}%</div>
                    </div>
                    <div class="data-detail">
                        <div class="data-detail-label">عدد الأيام</div>
                        <div class="data-detail-value">${daysActive} يوم</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Actualizar la lista de ganancias
    function updateProfitsList() {
        const container = document.getElementById('profits-list');
        if (!container) return;
        
        // Si no hay datos de ganancias, generarlos a partir de las transacciones
        if (!profitsData || !profitsData.length) {
            profitsData = generateProfitsFromTransactions();
        }
        
        if (!profitsData || !profitsData.length) {
            container.innerHTML = '<div class="empty-list">لا توجد أرباح متاحة</div>';
            return;
        }
        
        // Ordenar por fecha (más recientes primero)
        const sortedProfits = [...profitsData].sort((a, b) => {
            return new Date(b.dueDate) - new Date(a.dueDate);
        });
        
        // Generar HTML
        let html = '';
        
        sortedProfits.forEach(profit => {
            html += createProfitItemHTML(profit);
        });
        
        // Actualizar contenedor
        container.innerHTML = html;
        
        // Actualizar estadísticas de ganancia
        updateProfitStatistics();
    }
    
    // Generar ganancias a partir de transacciones
    function generateProfitsFromTransactions() {
        // Filtrar transacciones de tipo ganancia
        const profitTransactions = transactionsData.filter(tx => 
            tx.type === 'ربح' || tx.type === 'profit'
        );
        
        if (!profitTransactions.length) {
            return [];
        }
        
        // Convertir transacciones a ganancias
        return profitTransactions.map((tx, index) => ({
            id: `profit-${currentInvestorId}-${index}`,
            investorId: currentInvestorId,
            amount: tx.amount,
            dueDate: tx.date || tx.createdAt,
            paidDate: tx.date || tx.createdAt, // Ya está pagada
            status: 'paid',
            cycle: 'شهرية' // Mensual
        }));
    }
    
    // Crear HTML para un elemento de ganancia
    function createProfitItemHTML(profit) {
        // Determinar estado
        const isPaid = profit.status === 'paid';
        const statusClass = isPaid ? 'badge-success' : 'badge-warning';
        const statusText = isPaid ? 'مدفوع' : 'مستحق';
        
        return `
            <div class="data-item">
                <div class="data-item-header">
                    <div class="data-item-title">${formatCurrency(profit.amount)}</div>
                    <div class="data-item-badge ${statusClass}">${statusText}</div>
                </div>
                <div class="data-item-details">
                    <div class="data-detail">
                        <div class="data-detail-label">تاريخ الاستحقاق</div>
                        <div class="data-detail-value">${formatDate(profit.dueDate)}</div>
                    </div>
                    <div class="data-detail">
                        <div class="data-detail-label">تاريخ الدفع</div>
                        <div class="data-detail-value">${profit.paidDate ? formatDate(profit.paidDate) : '-'}</div>
                    </div>
                    <div class="data-detail">
                        <div class="data-detail-label">الدورة</div>
                        <div class="data-detail-value">${profit.cycle || 'شهرية'}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Actualizar estadísticas de ganancia
    function updateProfitStatistics() {
        // Elementos relevantes
        const elements = {
            totalProfits: document.getElementById('total-received-profits'),
            percentage: document.getElementById('profit-percentage'),
            currentProfit: document.getElementById('current-profit'),
            targetProfit: document.getElementById('target-profit'),
            progressFill: document.querySelector('.progress-fill')
        };
        
        if (!elements.totalProfits) return;
        
        // Calcular ganancias totales recibidas
        const totalReceived = profitsData
            .filter(profit => profit.status === 'paid')
            .reduce((sum, profit) => sum + (profit.amount || 0), 0);
        
        // Obtener monto total invertido
        const investor = findInvestorById(currentInvestorId);
        const totalAmount = investor ? investor.amount || 0 : 0;
        
        // Calcular ganancia mensual objetivo
        const interestRate = window.systemConfig ? window.systemConfig.interestRate : 17.5;
        const monthlyTarget = totalAmount * (interestRate / 100) / 12;
        
        // Calcular ganancia del mes actual
        const currentMonthProfit = calculateCurrentMonthProfit(totalAmount, interestRate);
        
        // Calcular porcentaje completado
        const percentage = monthlyTarget > 0 ? 
                          Math.min(100, Math.floor((currentMonthProfit / monthlyTarget) * 100)) : 
                          0;
        
        // Actualizar elementos
        if (elements.totalProfits) {
            elements.totalProfits.textContent = formatCurrency(totalReceived);
        }
        
        if (elements.percentage) {
            elements.percentage.textContent = `${percentage}%`;
        }
        
        if (elements.currentProfit) {
            elements.currentProfit.textContent = formatCurrency(currentMonthProfit);
        }
        
        if (elements.targetProfit) {
            elements.targetProfit.textContent = formatCurrency(monthlyTarget);
        }
        
        if (elements.progressFill) {
            elements.progressFill.style.width = `${percentage}%`;
        }
    }
    
    // Calcular ganancia del mes actual
    function calculateCurrentMonthProfit(amount, interestRate) {
        // Convertir tasa anual a tasa diaria
        const annualRate = interestRate / 100 || 0.175;
        const dailyRate = annualRate / 365;
        
        // Calcular días transcurridos del mes actual
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const currentDay = Math.min(today.getDate(), daysInMonth);
        
        // Porcentaje del mes transcurrido
        const monthPercentage = currentDay / daysInMonth;
        
        // Ganancia mensual estimada
        const monthlyProfit = amount * annualRate / 12;
        
        // Ganancia acumulada hasta hoy
        return monthlyProfit * monthPercentage;
    }
    
    // Actualizar estadísticas generales
    function updateStatistics() {
        // Elementos para actualizar
        const elements = {
            totalBalance: document.getElementById('total-balance'),
            monthlyProfit: document.getElementById('monthly-profit'),
            investmentDays: document.getElementById('investment-days'),
            nextProfitDate: document.getElementById('next-profit-date'),
            lastUpdate: document.getElementById('last-update-date')
        };
        
        if (!elements.totalBalance) return;
        
        // Obtener inversionista actual
        const investor = findInvestorById(currentInvestorId);
        if (!investor) return;
        
        // Monto total invertido
        const totalAmount = investor.amount || 0;
        
        // Ganancia mensual
        const interestRate = window.systemConfig ? window.systemConfig.interestRate : 17.5;
        const monthlyProfit = totalAmount * (interestRate / 100) / 12;
        
        // Días de inversión
        const joinDate = investor.joinDate || investor.createdAt;
        const daysActive = calculateInvestmentDays(joinDate);
        
        // Fecha del próximo pago
        const nextPayment = calculateNextProfitDate(joinDate);
        
        // Actualizar elementos
        if (elements.totalBalance) {
            const oldValue = extractNumberFromCurrency(elements.totalBalance.textContent);
            if (oldValue !== totalAmount) {
                animateNumber(elements.totalBalance, oldValue, totalAmount, 1000);
                elements.totalBalance.classList.add('pulse');
                setTimeout(() => elements.totalBalance.classList.remove('pulse'), 500);
            } else {
                elements.totalBalance.textContent = formatCurrency(totalAmount);
            }
        }
        
        if (elements.monthlyProfit) {
            elements.monthlyProfit.textContent = formatCurrency(monthlyProfit);
        }
        
        if (elements.investmentDays) {
            elements.investmentDays.textContent = daysActive;
        }
        
        if (elements.nextProfitDate) {
            elements.nextProfitDate.textContent = formatDate(nextPayment);
        }
        
        if (elements.lastUpdate) {
            elements.lastUpdate.textContent = formatRelativeTime(new Date());
        }
    }
    
    // Mostrar una sección específica
    function showSection(sectionId) {
        // Mapear IDs de sección a IDs de pestaña
        const tabMapping = {
            'home': 'investments',
            'transactions': 'transactions',
            'profits': 'profits',
            'profile': 'info'
        };
        
        const tabId = tabMapping[sectionId] || 'investments';
        
        // Activar la pestaña correspondiente
        document.querySelectorAll('.tab-btn').forEach(btn => {
            const isActive = btn.getAttribute('data-tab') === tabId;
            btn.classList.toggle('active', isActive);
        });
        
        // Mostrar el contenido de la pestaña
        document.querySelectorAll('.tab-content').forEach(content => {
            const isActive = content.id === `${tabId}-tab`;
            content.classList.toggle('active', isActive);
        });
    }
    
    // Generar código QR
    function generateQRCode() {
        const qrContainer = document.getElementById('card-qr-code');
        if (!qrContainer) return;
        
        // Obtener tarjeta actual
        const currentCard = window.InvestorCardSystem ? window.InvestorCardSystem.getCurrentCard() : null;
        if (!currentCard) return;
        
        // Datos a incluir en el QR
        const cardData = {
            id: currentCard.id,
            name: currentCard.investorName,
            type: currentCard.cardType,
            expiry: formatExpiryDate(currentCard.expiryDate)
        };
        
        // Convertir a JSON
        const dataString = JSON.stringify(cardData);
        
        // Limpiar contenedor
        qrContainer.innerHTML = '';
        
        // Verificar si existe la librería QRCode
        if (typeof QRCode === 'function') {
            new QRCode(qrContainer, {
                text: dataString,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            // Alternativa usando servicio externo
            const encodedData = encodeURIComponent(dataString);
            qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}" alt="QR Code">`;
        }
    }
    
    // Preparar contenido para compartir
    function prepareShareContent() {
        const shareText = document.getElementById('share-text');
        if (!shareText) return;
        
        // Obtener tarjeta actual
        const currentCard = window.InvestorCardSystem ? window.InvestorCardSystem.getCurrentCard() : null;
        if (!currentCard) return;
        
        // Datos del inversionista
        const investor = findInvestorById(currentInvestorId);
        
        // Crear texto para compartir
        const content = `بطاقة المستثمر
الاسم: ${currentCard.investorName}
نوع البطاقة: ${getCardTypeName(currentCard.cardType)}
رقم البطاقة: ${maskCardNumber(currentCard.cardNumber)}
تاريخ الانتهاء: ${formatExpiryDate(currentCard.expiryDate)}
${investor ? `مبلغ الاستثمار: ${formatCurrency(investor.amount)}` : ''}
${investor ? `الربح الشهري: ${formatCurrency(investor.amount * (window.systemConfig?.interestRate || 17.5) / 100 / 12)}` : ''}

تم إصدار هذه البطاقة من نظام الاستثمار المتكامل
`;
        
        // Actualizar elemento
        shareText.value = content;
        
        // Configurar botones de compartir
        setupShareButtons();
    }
    
    // Configurar botones de compartir
    function setupShareButtons() {
        document.querySelectorAll('.share-option').forEach(button => {
            button.addEventListener('click', function() {
                const method = this.getAttribute('data-method');
                const shareText = document.getElementById('share-text').value;
                
                switch (method) {
                    case 'whatsapp':
                        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                        break;
                    case 'email':
                        window.open(`mailto:?subject=بطاقة المستثمر&body=${encodeURIComponent(shareText)}`, '_blank');
                        break;
                    case 'copy':
                        copyToClipboard(shareText);
                        showToast('تم النسخ', 'تم نسخ بيانات البطاقة إلى الحافظة', 'success');
                        break;
                }
            });
        });
    }
    
    // Ocultar parcialmente el número de tarjeta
    function maskCardNumber(cardNumber) {
        if (!cardNumber) return 'XXXX XXXX XXXX XXXX';
        
        // Eliminar espacios
        const cleanNumber = cardNumber.replace(/\s/g, '');
        
        // Mostrar solo los últimos 4 dígitos
        const lastFour = cleanNumber.slice(-4);
        
        // Formato de tarjeta de crédito
        return `XXXX XXXX XXXX ${lastFour}`;
    }
    
    // Obtener nombre del tipo de tarjeta
    function getCardTypeName(cardType) {
        const cardTypeNames = {
            platinum: 'بلاتينية',
            gold: 'ذهبية',
            premium: 'بريميوم',
            diamond: 'ماسية',
            islamic: 'إسلامية',
            custom: 'مخصصة'
        };
        
        return cardTypeNames[cardType] || 'بلاتينية';
    }
    
    // Formatear fecha (DD/MM/YYYY)
    function formatDate(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            
            if (isNaN(date.getTime())) return '-';
            
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            
            return `${day}/${month}/${year}`;
        } catch (error) {
            return '-';
        }
    }
    
    // Formatear fecha relativa
    function formatRelativeTime(date) {
        if (!date) return '-';
        
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        if (diffMin < 1) {
            return 'الآن';
        } else if (diffMin < 60) {
            return `منذ ${diffMin} دقيقة`;
        } else if (diffHour < 24) {
            return `منذ ${diffHour} ساعة`;
        } else if (diffDay < 7) {
            return `منذ ${diffDay} يوم`;
        } else {
            return formatDate(date);
        }
    }
    
    // Formatear fecha de expiración (MM/YY)
    function formatExpiryDate(dateString) {
        if (!dateString) return 'MM/YY';
        
        try {
            // Si ya está en formato MM/YY
            if (/^\d{2}\/\d{2}$/.test(dateString)) {
                return dateString;
            }
            
            const date = new Date(dateString);
            
            if (isNaN(date.getTime())) return 'MM/YY';
            
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear().toString().slice(2);
            
            return `${month}/${year}`;
        } catch (error) {
            return 'MM/YY';
        }
    }
    
    // Formatear moneda
    function formatCurrency(amount) {
        // Convertir a número
        amount = parseFloat(amount) || 0;
        
        try {
            return new Intl.NumberFormat('ar-IQ', {
                style: 'currency',
                currency: 'IQD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        } catch (error) {
            return `${amount.toLocaleString('ar-IQ')} دينار`;
        }
    }
    
    // Extraer número de texto formateado como moneda
    function extractNumberFromCurrency(text) {
        if (!text) return 0;
        
        // Eliminar todo excepto dígitos, punto y coma
        const cleaned = text.replace(/[^\d.,]/g, '');
        
        // Reemplazar coma por punto si es necesario
        const normalized = cleaned.replace(/,/g, '.');
        
        return parseFloat(normalized) || 0;
    }
    
    // Encontrar inversionista por ID
    function findInvestorById(investorId) {
        if (!investorId) return null;
        
        // Buscar en las listas globales
        if (window.investorsList && Array.isArray(window.investorsList)) {
            return window.investorsList.find(inv => inv.id === investorId) || null;
        }
        
        if (window.investors && Array.isArray(window.investors)) {
            return window.investors.find(inv => inv.id === investorId) || null;
        }
        
        return null;
    }
    
    // Calcular días de inversión
    function calculateInvestmentDays(startDate) {
        if (!startDate) return 0;
        
        try {
            const start = new Date(startDate);
            const today = new Date();
            
            // Diferencia en milisegundos
            const diffTime = today - start;
            
            // Convertir a días
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        } catch (error) {
            return 0;
        }
    }
    
    // Calcular fecha de próximo pago
    function calculateNextProfitDate(startDate) {
        if (!startDate) return new Date();
        
        try {
            const start = new Date(startDate);
            const today = new Date();
            
            // Mismo día del mes
            const paymentDay = start.getDate();
            
            // Crear fecha para el pago del mes actual
            const nextDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);
            
            // Si ya pasamos esa fecha este mes, ir al próximo mes
            if (today.getDate() >= paymentDay) {
                nextDate.setMonth(nextDate.getMonth() + 1);
            }
            
            return nextDate;
        } catch (error) {
            return new Date();
        }
    }
    
    // Actualizar interfaz después de sincronización
    function refreshUIAfterSync() {
        // Verificar si hay cambios en el inversionista actual
        checkCurrentInvestor();
        
        // Actualizar la interfaz
        updateUI();
        
        // Mostrar notificación
        showToast('تم التحديث', 'تم تحديث البيانات بنجاح', 'success');
    }
    
    // Animar conteo de número
    function animateNumber(element, start, end, duration) {
        if (!element) return;
        
        // Para evitar errores
        start = parseFloat(start) || 0;
        end = parseFloat(end) || 0;
        
        // Si no hay diferencia, no animar
        if (start === end) {
            element.textContent = formatCurrency(end);
            return;
        }
        
        // Variables para la animación
        const range = end - start;
        const minFrame = 30;
        let startTime = null;
        
        // Función de animación
        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const currentValue = start + (progress * range);
            
            element.textContent = formatCurrency(currentValue);
            
            if (progress < 1) {
                window.requestAnimationFrame(animate);
            } else {
                element.textContent = formatCurrency(end);
            }
        }
        
        window.requestAnimationFrame(animate);
    }
    
    // Copiar texto al portapapeles
    function copyToClipboard(text) {
        // Crear elemento temporal
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        
        // Seleccionar y copiar
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Error al copiar al portapapeles:', err);
        }
        
        // Eliminar elemento temporal
        document.body.removeChild(textArea);
    }
    
    // Mostrar notificación toast
    function showToast(title, message, type = 'info') {
        const toast = document.getElementById('toast-notification');
        if (!toast) return;
        
        // Configurar contenido
        const toastTitle = toast.querySelector('.toast-title');
        const toastMessage = toast.querySelector('.toast-message');
        const toastIcon = toast.querySelector('.toast-icon i');
        
        if (toastTitle) toastTitle.textContent = title;
        if (toastMessage) toastMessage.textContent = message;
        
        // Configurar icono según tipo
        if (toastIcon) {
            toastIcon.className = ''; // Reset
            
            switch (type) {
                case 'success':
                    toastIcon.className = 'fas fa-check-circle';
                    break;
                case 'warning':
                    toastIcon.className = 'fas fa-exclamation-triangle';
                    break;
                case 'error':
                    toastIcon.className = 'fas fa-times-circle';
                    break;
                default:
                    toastIcon.className = 'fas fa-info-circle';
            }
        }
        
        // Aplicar clase de tipo
        toast.className = 'toast';
        toast.classList.add(`toast-${type}`);
        
        // Mostrar toast
        toast.classList.add('show');
        
        // Configurar cierre automático
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            
            // Eliminar clase después de la animación
            setTimeout(() => {
                toast.classList.remove('hide');
            }, 300);
        }, 3000);
        
        // Manejar clic en botón de cerrar
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.classList.remove('show');
                toast.classList.add('hide');
            });
        }
    }
    
    // API pública
    return {
        initialize,
        updateUI,
        refreshUIAfterSync,
        showToast
    };
})();

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar UI
    InvestorCardUI.initialize();
});