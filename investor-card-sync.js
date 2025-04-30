/**
 * investor-card-sync.js
 * 
 * Script de integración que sincroniza la tarjeta del inversionista con el sistema principal
 * Conecta las transacciones, ganancias y la información del inversionista entre ambos sistemas
 * 
 * @version 1.0.0
 */

// Módulo de sincronización de la tarjeta del inversionista
const InvestorCardSync = (function() {
    // Variables del sistema
    let initialized = false;
    let mainSystem = null; // Referencia al sistema principal
    let cardSystem = null; // Referencia al sistema de tarjetas
    let configData = {}; // Configuración del sistema
    let syncInterval = null; // Intervalo de sincronización
    
    // Eventos personalizados
    const EVENTS = {
        SYNC_COMPLETE: 'investor-card:sync-complete',
        DATA_UPDATED: 'investor-card:data-updated',
        ERROR: 'investor-card:error'
    };
    
    // Inicializar el módulo de sincronización
    function initialize() {
        console.log('Inicializando sincronización de tarjeta del inversionista...');
        
        if (initialized) {
            console.log('El sistema de sincronización ya está inicializado');
            return Promise.resolve(true);
        }
        
        // Obtener referencia al sistema principal (window.InvestmentSystem) y sistema de tarjetas
        mainSystem = window.InvestmentSystem || null;
        cardSystem = window.InvestorCardSystem || null;
        
        if (!cardSystem) {
            console.error('Error: Sistema de tarjetas no encontrado');
            fireEvent(EVENTS.ERROR, { message: 'Sistema de tarjetas no disponible' });
            return Promise.reject(new Error('Sistema de tarjetas no disponible'));
        }
        
        // Cargar la configuración del sistema
        loadSystemConfig();
        
        // Establecer intervalo de sincronización (cada 5 minutos)
        setupSyncInterval();
        
        // Configurar escuchadores de eventos
        setupEventListeners();
        
        // Realizar la sincronización inicial
        return performFullSync()
            .then(() => {
                initialized = true;
                console.log('Sincronización de tarjeta del inversionista inicializada con éxito');
                return true;
            })
            .catch(error => {
                console.error('Error al inicializar la sincronización:', error);
                fireEvent(EVENTS.ERROR, { message: 'Error al inicializar', error });
                return false;
            });
    }
    
    // Cargar la configuración del sistema principal
    function loadSystemConfig() {
        try {
            // Intentar cargar la configuración desde el sistema principal
            if (mainSystem && mainSystem.getConfig) {
                configData = mainSystem.getConfig() || {};
                console.log('Configuración del sistema cargada desde el sistema principal');
            } else if (window.systemConfig) {
                // Alternativamente, usar la configuración global
                configData = window.systemConfig;
                console.log('Configuración del sistema cargada desde la variable global');
            } else {
                // Valores predeterminados
                configData = {
                    interestRate: 17.5,
                    profitCalculation: 'daily',
                    profitCycle: 30,
                    language: 'ar',
                    systemName: 'نظام الاستثمار المتكامل',
                    reminderDays: 3
                };
                console.log('Usando configuración predeterminada del sistema');
            }
        } catch (error) {
            console.error('Error al cargar la configuración del sistema:', error);
            
            // Valores predeterminados en caso de error
            configData = {
                interestRate: 17.5,
                profitCalculation: 'daily',
                profitCycle: 30,
                language: 'ar',
                systemName: 'نظام الاستثمار المتكامل',
                reminderDays: 3
            };
        }
    }
    
    // Configurar intervalo de sincronización
    function setupSyncInterval() {
        // Limpiar intervalo existente si lo hay
        if (syncInterval) {
            clearInterval(syncInterval);
        }
        
        // Configurar nuevo intervalo (cada 5 minutos)
        syncInterval = setInterval(() => {
            performIncrementalSync()
                .then(result => {
                    if (result && result.updated) {
                        console.log(`Sincronización incremental completada, ${result.updated} elementos actualizados`);
                    }
                })
                .catch(error => {
                    console.error('Error en la sincronización incremental:', error);
                });
        }, 5 * 60 * 1000); // 5 minutos
        
        console.log('Intervalo de sincronización configurado (cada 5 minutos)');
    }
    
    // Configurar escuchadores de eventos
    function setupEventListeners() {
        // Escuchar eventos del sistema principal (si está disponible)
        if (mainSystem && mainSystem.on) {
            // Evento de transacción nueva
            mainSystem.on('transaction:created', data => {
                console.log('Nueva transacción detectada, actualizando datos de tarjeta...');
                syncTransactionsData()
                    .then(() => {
                        updateCardDisplay();
                    })
                    .catch(console.error);
            });
            
            // Evento de actualización de inversión
            mainSystem.on('investment:updated', data => {
                console.log('Inversión actualizada, actualizando datos de tarjeta...');
                syncInvestorsData()
                    .then(() => {
                        updateCardDisplay();
                    })
                    .catch(console.error);
            });
        }
        
        // Escuchar eventos del sistema de tarjetas
        document.addEventListener('investor-cards:initialized', () => {
            performFullSync().catch(console.error);
        });
        
        // Eventos DOM importantes
        document.addEventListener('DOMContentLoaded', () => {
            // Asegurar que la interfaz está actualizada cuando se carga la página
            updateCardUserInterface();
        });
        
        console.log('Escuchadores de eventos configurados');
    }
    
    // Lanzar evento personalizado
    function fireEvent(eventName, data = {}) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }
    
    // Realizar sincronización completa
    function performFullSync() {
        console.log('Iniciando sincronización completa...');
        showSyncIndicator(true);
        
        return Promise.all([
            syncInvestorsData(),
            syncTransactionsData(),
            syncSystemConfig()
        ])
        .then(([investorsResult, transactionsResult, configResult]) => {
            console.log('Sincronización completa finalizada');
            
            // Actualizar la interfaz de usuario con los datos sincronizados
            updateCardUserInterface();
            
            // Notificar que la sincronización está completa
            const result = {
                investors: investorsResult,
                transactions: transactionsResult,
                config: configResult,
                timestamp: new Date().toISOString()
            };
            
            fireEvent(EVENTS.SYNC_COMPLETE, result);
            showSyncIndicator(false);
            
            return result;
        })
        .catch(error => {
            console.error('Error en la sincronización completa:', error);
            showSyncIndicator(false);
            fireEvent(EVENTS.ERROR, { message: 'Error en sincronización completa', error });
            throw error;
        });
    }
    
    // Realizar sincronización incremental (solo datos nuevos)
    function performIncrementalSync() {
        console.log('Iniciando sincronización incremental...');
        
        // Obtener la fecha de la última sincronización
        const lastSync = localStorage.getItem('investor_card_last_sync') || null;
        let updatedCount = 0;
        
        return Promise.all([
            syncTransactionsData(lastSync),
            syncInvestorsData(lastSync)
        ])
        .then(([transactionsResult, investorsResult]) => {
            // Actualizar la marca de tiempo de la última sincronización
            localStorage.setItem('investor_card_last_sync', new Date().toISOString());
            
            updatedCount = (transactionsResult.updated || 0) + (investorsResult.updated || 0);
            
            if (updatedCount > 0) {
                // Solo actualizar la UI si hay cambios
                updateCardUserInterface();
                fireEvent(EVENTS.DATA_UPDATED, { transactions: transactionsResult, investors: investorsResult });
            }
            
            return { updated: updatedCount, timestamp: new Date().toISOString() };
        })
        .catch(error => {
            console.error('Error en la sincronización incremental:', error);
            fireEvent(EVENTS.ERROR, { message: 'Error en sincronización incremental', error });
            throw error;
        });
    }
    
    // Sincronizar datos de inversionistas
    function syncInvestorsData(since = null) {
        return new Promise((resolve, reject) => {
            try {
                let investors = [];
                let updated = 0;
                
                // Obtener inversionistas del sistema principal
                if (mainSystem && mainSystem.getInvestors) {
                    investors = mainSystem.getInvestors(since) || [];
                    console.log(`Obtenidos ${investors.length} inversionistas del sistema principal`);
                } else if (window.investors && Array.isArray(window.investors)) {
                    // Alternativamente, usar datos globales
                    investors = window.investors;
                    console.log(`Obtenidos ${investors.length} inversionistas de la variable global`);
                } else {
                    console.warn('No se encontraron datos de inversionistas para sincronizar');
                }
                
                // Si no hay datos, resolver sin cambios
                if (!investors.length) {
                    return resolve({ status: 'success', updated: 0 });
                }
                
                // Sincronizar con el sistema de tarjetas
                // Esto depende de la implementación del sistema de tarjetas
                // Aquí asumimos que existe una forma de actualizar los datos
                if (window.investorsList) {
                    // Actualizar la lista global
                    const existingIds = window.investorsList.map(inv => inv.id);
                    
                    investors.forEach(investor => {
                        if (!existingIds.includes(investor.id)) {
                            window.investorsList.push(investor);
                            updated++;
                        } else {
                            // Actualizar inversor existente
                            const index = window.investorsList.findIndex(inv => inv.id === investor.id);
                            if (index !== -1) {
                                window.investorsList[index] = { ...window.investorsList[index], ...investor };
                                updated++;
                            }
                        }
                    });
                    
                    console.log(`Sincronizados ${updated} inversionistas con el sistema de tarjetas`);
                } else {
                    // Si no hay una lista global, simplemente guardar los datos para tenerlos disponibles
                    window.investorsList = investors;
                    updated = investors.length;
                    console.log(`Creada lista global con ${updated} inversionistas`);
                }
                
                resolve({ status: 'success', updated });
            } catch (error) {
                console.error('Error al sincronizar datos de inversionistas:', error);
                reject(error);
            }
        });
    }
    
    // Sincronizar datos de transacciones
    function syncTransactionsData(since = null) {
        return new Promise((resolve, reject) => {
            try {
                let transactions = [];
                let updated = 0;
                
                // Obtener transacciones del sistema principal
                if (mainSystem && mainSystem.getTransactions) {
                    transactions = mainSystem.getTransactions(since) || [];
                    console.log(`Obtenidas ${transactions.length} transacciones del sistema principal`);
                } else if (window.transactions && Array.isArray(window.transactions)) {
                    // Alternativamente, usar datos globales
                    transactions = window.transactions;
                    console.log(`Obtenidas ${transactions.length} transacciones de la variable global`);
                    
                    // Filtrar por fecha si es necesario
                    if (since) {
                        const sinceDate = new Date(since);
                        transactions = transactions.filter(tx => {
                            const txDate = new Date(tx.createdAt || tx.date);
                            return txDate > sinceDate;
                        });
                        console.log(`Filtradas a ${transactions.length} transacciones desde ${since}`);
                    }
                } else {
                    console.warn('No se encontraron datos de transacciones para sincronizar');
                }
                
                // Si no hay datos, resolver sin cambios
                if (!transactions.length) {
                    return resolve({ status: 'success', updated: 0 });
                }
                
                // Sincronizar con el sistema de tarjetas
                if (window.transactionsList) {
                    // Actualizar la lista global
                    const existingIds = window.transactionsList.map(tx => tx.id);
                    
                    transactions.forEach(transaction => {
                        if (!existingIds.includes(transaction.id)) {
                            window.transactionsList.push(transaction);
                            updated++;
                        } else {
                            // Actualizar transacción existente
                            const index = window.transactionsList.findIndex(tx => tx.id === transaction.id);
                            if (index !== -1) {
                                window.transactionsList[index] = { ...window.transactionsList[index], ...transaction };
                                updated++;
                            }
                        }
                    });
                    
                    console.log(`Sincronizadas ${updated} transacciones con el sistema de tarjetas`);
                } else {
                    // Si no hay una lista global, simplemente guardar los datos
                    window.transactionsList = transactions;
                    updated = transactions.length;
                    console.log(`Creada lista global con ${updated} transacciones`);
                }
                
                resolve({ status: 'success', updated });
            } catch (error) {
                console.error('Error al sincronizar datos de transacciones:', error);
                reject(error);
            }
        });
    }
    
    // Sincronizar configuración del sistema
    function syncSystemConfig() {
        return new Promise((resolve) => {
            try {
                // Ya tenemos la configuración cargada, solo actualizamos la global
                window.systemConfig = configData;
                
                console.log('Configuración del sistema sincronizada');
                resolve({ status: 'success' });
            } catch (error) {
                console.error('Error al sincronizar configuración del sistema:', error);
                resolve({ status: 'error', error });
            }
        });
    }
    
    // Actualizar la interfaz de usuario de la tarjeta
    function updateCardUserInterface() {
        console.log('Actualizando interfaz de usuario de la tarjeta...');
        
        // Mostrar indicador de carga
        showLoadingIndicator(true);
        
        try {
            // Actualizar visualización de la tarjeta
            updateCardDisplay();
            
            // Actualizar estadísticas financieras
            updateFinancialStats();
            
            // Actualizar listas de datos (transacciones, inversiones, ganancias)
            updateDataLists();
            
            console.log('Interfaz de usuario de la tarjeta actualizada con éxito');
        } catch (error) {
            console.error('Error al actualizar la interfaz de usuario:', error);
        } finally {
            // Ocultar indicador de carga
            showLoadingIndicator(false);
        }
    }
    
    // Actualizar visualización de la tarjeta
    function updateCardDisplay() {
        // Comprobar si tenemos una tarjeta actual
        const currentCard = cardSystem.getCurrentCard ? cardSystem.getCurrentCard() : null;
        
        if (!currentCard) {
            console.warn('No hay tarjeta actual para actualizar');
            return;
        }
        
        // Actualizar datos de la tarjeta en la interfaz
        updateCardInfo(currentCard);
        
        // Si tenemos ID de inversionista, actualizar sus datos
        if (currentCard.investorId) {
            updateInvestorInfo(currentCard.investorId);
        }
    }
    
    // Actualizar información de la tarjeta en la interfaz
    function updateCardInfo(card) {
        // Elementos DOM clave para la tarjeta
        const elements = {
            cardNumber: document.getElementById('display-card-number'),
            cardExpiry: document.getElementById('display-card-expiry'),
            cardName: document.getElementById('display-card-name'),
            cardCvv: document.getElementById('display-cvv'),
            cardPhone: document.getElementById('display-phone'),
            cardStatus: document.getElementById('card-status-badge'),
            cardBrand: document.querySelector('.card-brand'),
            cardType: document.getElementById('card-type')
        };
        
        // Actualizar los elementos si existen
        if (elements.cardNumber) elements.cardNumber.textContent = card.cardNumber || 'XXXX XXXX XXXX XXXX';
        if (elements.cardExpiry) elements.cardExpiry.textContent = formatExpiryDate(card.expiryDate) || 'MM/YY';
        if (elements.cardName) elements.cardName.textContent = card.investorName || 'اسم المستثمر';
        if (elements.cardCvv) elements.cardCvv.textContent = card.cvv || '***';
        if (elements.cardPhone) elements.cardPhone.textContent = card.investorPhone || '';
        
        // Actualizar estado de la tarjeta
        if (elements.cardStatus) {
            const isExpired = new Date(card.expiryDate) < new Date();
            const isActive = card.status === 'active';
            
            if (!isActive) {
                elements.cardStatus.className = 'card-status-badge warning';
                elements.cardStatus.textContent = 'موقوفة';
            } else if (isExpired) {
                elements.cardStatus.className = 'card-status-badge danger';
                elements.cardStatus.textContent = 'منتهية';
            } else {
                elements.cardStatus.className = 'card-status-badge success';
                elements.cardStatus.textContent = 'نشطة';
            }
        }
        
        // Actualizar tipo de tarjeta
        const cardTypeName = getCardTypeName(card.cardType);
        if (elements.cardBrand) elements.cardBrand.textContent = cardTypeName;
        if (elements.cardType) elements.cardType.textContent = cardTypeName;
        
        // Actualizar el estilo de la tarjeta según su tipo
        applyCardStyle(card);
    }
    
    // Actualizar información del inversionista
    function updateInvestorInfo(investorId) {
        // Buscar al inversionista
        const investor = findInvestorById(investorId);
        if (!investor) {
            console.warn(`No se encontró información para el inversionista ID: ${investorId}`);
            return;
        }
        
        // Elementos DOM para la información del inversionista
        const elements = {
            investorName: document.getElementById('investor-full-name'),
            investorPhone: document.getElementById('investor-phone-number'),
            investorAddress: document.getElementById('investor-address'),
            investorJoinDate: document.getElementById('investor-join-date'),
            cardIssueDate: document.getElementById('card-issue-date'),
            cardExpiryDate: document.getElementById('card-expiry-date'),
            userName: document.getElementById('user-name'),
            userInitial: document.getElementById('user-initial')
        };
        
        // Actualizar los elementos si existen
        if (elements.investorName) elements.investorName.textContent = investor.name || '-';
        if (elements.investorPhone) elements.investorPhone.textContent = investor.phone || '-';
        if (elements.investorAddress) elements.investorAddress.textContent = investor.address || '-';
        if (elements.investorJoinDate) elements.investorJoinDate.textContent = formatDate(investor.joinDate || investor.createdAt) || '-';
        
        // Actualizar nombre de usuario en la interfaz
        if (elements.userName) elements.userName.textContent = investor.name || 'المستثمر';
        if (elements.userInitial && investor.name) elements.userInitial.textContent = investor.name.charAt(0);
        
        // La tarjeta actual para las fechas
        const currentCard = cardSystem.getCurrentCard ? cardSystem.getCurrentCard() : null;
        
        if (currentCard) {
            if (elements.cardIssueDate) elements.cardIssueDate.textContent = formatDate(currentCard.createdAt) || '-';
            if (elements.cardExpiryDate) elements.cardExpiryDate.textContent = formatDate(currentCard.expiryDate) || '-';
        }
    }
    
    // Actualizar estadísticas financieras
    function updateFinancialStats() {
        // La tarjeta actual
        const currentCard = cardSystem.getCurrentCard ? cardSystem.getCurrentCard() : null;
        if (!currentCard || !currentCard.investorId) {
            console.warn('No hay tarjeta actual o ID de inversionista para actualizar estadísticas');
            return;
        }
        
        // Buscar al inversionista
        const investor = findInvestorById(currentCard.investorId);
        if (!investor) {
            console.warn(`No se encontró información para el inversionista ID: ${currentCard.investorId}`);
            return;
        }
        
        // Elementos DOM para las estadísticas financieras
        const elements = {
            totalBalance: document.getElementById('total-balance'),
            monthlyProfit: document.getElementById('monthly-profit'),
            investmentDays: document.getElementById('investment-days'),
            nextProfitDate: document.getElementById('next-profit-date'),
            lastUpdateDate: document.getElementById('last-update-date'),
            totalReceivedProfits: document.getElementById('total-received-profits'),
            profitPercentage: document.getElementById('profit-percentage'),
            currentProfit: document.getElementById('current-profit'),
            targetProfit: document.getElementById('target-profit')
        };
        
        // Calcular valores
        const totalAmount = investor.amount || 0;
        const monthlyProfitAmount = calculateMonthlyProfit(totalAmount);
        const investmentDaysCount = calculateInvestmentDays(investor.joinDate || investor.createdAt);
        const nextProfitDateTime = calculateNextProfitDate(investor.joinDate || investor.createdAt);
        
        // Calcular ganancias recibidas y actuales
        const { receivedProfits, currentMonthProfit } = calculateProfitStats(currentCard.investorId);
        
        // Calcular porcentaje de ganancia del mes actual
        const profitPercent = monthlyProfitAmount > 0 ? 
                             Math.min(100, Math.floor((currentMonthProfit / monthlyProfitAmount) * 100)) : 
                             0;
        
        // Actualizar los elementos si existen
        if (elements.totalBalance) elements.totalBalance.textContent = formatCurrency(totalAmount);
        if (elements.monthlyProfit) elements.monthlyProfit.textContent = formatCurrency(monthlyProfitAmount);
        if (elements.investmentDays) elements.investmentDays.textContent = investmentDaysCount;
        if (elements.nextProfitDate) elements.nextProfitDate.textContent = formatDate(nextProfitDateTime);
        if (elements.lastUpdateDate) elements.lastUpdateDate.textContent = formatDate(new Date());
        
        // Actualizar información de ganancias
        if (elements.totalReceivedProfits) elements.totalReceivedProfits.textContent = formatCurrency(receivedProfits);
        if (elements.profitPercentage) elements.profitPercentage.textContent = `${profitPercent}%`;
        if (elements.currentProfit) elements.currentProfit.textContent = formatCurrency(currentMonthProfit);
        if (elements.targetProfit) elements.targetProfit.textContent = formatCurrency(monthlyProfitAmount);
        
        // Actualizar barra de progreso
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${profitPercent}%`;
        }
    }
    
    // Actualizar listas de datos (transacciones, inversiones, ganancias)
    function updateDataLists() {
        // La tarjeta actual
        const currentCard = cardSystem.getCurrentCard ? cardSystem.getCurrentCard() : null;
        if (!currentCard || !currentCard.investorId) {
            console.warn('No hay tarjeta actual o ID de inversionista para actualizar listas de datos');
            return;
        }
        
        // Actualizar lista de inversiones
        updateInvestmentsList(currentCard.investorId);
        
        // Actualizar lista de transacciones
        updateTransactionsList(currentCard.investorId);
        
        // Actualizar lista de ganancias
        updateProfitsList(currentCard.investorId);
    }
    
    // Actualizar lista de inversiones
    function updateInvestmentsList(investorId) {
        const investmentsList = document.getElementById('investments-list');
        if (!investmentsList) return;
        
        // Buscar al inversionista
        const investor = findInvestorById(investorId);
        if (!investor) {
            investmentsList.innerHTML = '<div class="empty-list">لا توجد استثمارات متاحة</div>';
            return;
        }
        
        let html = '';
        
        // Si el inversionista tiene inversiones específicas
        if (investor.investments && Array.isArray(investor.investments) && investor.investments.length > 0) {
            investor.investments.forEach(investment => {
                html += createInvestmentItemHTML(investment);
            });
        } 
        // Si solo tiene un monto total
        else if (investor.amount) {
            // Crear una inversión "virtual" con el monto total
            const singleInvestment = {
                amount: investor.amount,
                date: investor.joinDate || investor.createdAt,
                status: 'active'
            };
            
            html += createInvestmentItemHTML(singleInvestment);
        } 
        else {
            html = '<div class="empty-list">لا توجد استثمارات متاحة</div>';
        }
        
        investmentsList.innerHTML = html;
    }
    
    // Crear HTML para un elemento de inversión
    function createInvestmentItemHTML(investment) {
        // Tasa de retorno según la configuración del sistema
        const returnRate = configData.interestRate || 17.5;
        
        // Días activos de la inversión
        const daysActive = calculateInvestmentDays(investment.date);
        
        // Determinar la clase y texto según el estado
        const statusClass = investment.status === 'active' ? 'badge-success' : 'badge-warning';
        const statusText = investment.status === 'active' ? 'نشط' : 'غير نشط';
        
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
                        <div class="data-detail-value">${returnRate}%</div>
                    </div>
                    <div class="data-detail">
                        <div class="data-detail-label">عدد الأيام</div>
                        <div class="data-detail-value">${daysActive} يوم</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Actualizar lista de transacciones
    function updateTransactionsList(investorId) {
        const transactionsList = document.getElementById('transactions-list');
        if (!transactionsList) return;
        
        // Obtener las transacciones del inversionista
        const transactions = getInvestorTransactions(investorId);
        
        let html = '';
        
        if (transactions && transactions.length > 0) {
            // Ordenar por fecha, las más recientes primero
            const sortedTransactions = [...transactions].sort((a, b) => {
                return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
            });
            
            sortedTransactions.forEach(transaction => {
                html += createTransactionItemHTML(transaction);
            });
        } else {
            html = '<div class="empty-list">لا توجد عمليات متاحة</div>';
        }
        
        transactionsList.innerHTML = html;
        
        // Configurar los filtros
        setupTransactionFilters();
    }
    
    // Configurar filtros de transacciones
    function setupTransactionFilters() {
        const filterButtons = document.querySelectorAll('.transaction-filters .filter-btn');
        if (!filterButtons.length) return;
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Quitar clase activa de todos los botones
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Agregar clase activa al botón actual
                this.classList.add('active');
                
                // Obtener el tipo de filtro
                const filterType = this.getAttribute('data-filter');
                
                // Filtrar las transacciones
                filterTransactions(filterType);
            });
        });
    }
    
    // Filtrar transacciones por tipo
    function filterTransactions(filterType) {
        const transactionItems = document.querySelectorAll('#transactions-list .data-item');
        if (!transactionItems.length) return;
        
        transactionItems.forEach(item => {
            if (filterType === 'all') {
                item.style.display = '';
            } else {
                // Verificar si la transacción coincide con el filtro
                const badgeEl = item.querySelector('.data-item-badge');
                const transactionType = badgeEl ? badgeEl.textContent.trim() : '';
                
                // Mapear los tipos de filtro a textos en árabe
                const typeMap = {
                    'deposit': 'إيداع',
                    'withdraw': 'سحب',
                    'profit': 'ربح'
                };
                
                const filterText = typeMap[filterType] || filterType;
                
                if (transactionType === filterText) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            }
        });
    }
    
    // Crear HTML para un elemento de transacción
    function createTransactionItemHTML(transaction) {
        // Determinar la clase y texto según el tipo
        const typeClass = getTransactionTypeClass(transaction.type);
        const typeText = transaction.type || 'عملية';
        
        // Balance después de la transacción (si está disponible)
        const balanceAfter = transaction.balanceAfter || transaction.balance || 0;
        
        return `
            <div class="data-item">
                <div class="data-item-header">
                    <div class="data-item-title">${formatCurrency(transaction.amount)}</div>
                    <div class="data-item-badge ${typeClass}">${typeText}</div>
                </div>
                <div class="data-item-details">
                    <div class="data-detail">
                        <div class="data-detail-label">التاريخ</div>
                        <div class="data-detail-value">${formatDate(transaction.date || transaction.createdAt)}</div>
                    </div>
                    <div class="data-detail">
                        <div class="data-detail-label">الرصيد بعد العملية</div>
                        <div class="data-detail-value">${formatCurrency(balanceAfter)}</div>
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
        const typeClasses = {
            'إيداع': 'badge-success',
            'deposit': 'badge-success',
            'سحب': 'badge-danger',
            'withdraw': 'badge-danger',
            'ربح': 'badge-primary',
            'profit': 'badge-primary',
            'تحويل': 'badge-warning',
            'transfer': 'badge-warning'
        };
        
        return typeClasses[type] || 'badge-secondary';
    }
    
    // Actualizar lista de ganancias
    function updateProfitsList(investorId) {
        const profitsList = document.getElementById('profits-list');
        if (!profitsList) return;
        
        // Obtener las ganancias del inversionista
        const profits = getInvestorProfits(investorId);
        
        let html = '';
        
        if (profits && profits.length > 0) {
            // Ordenar por fecha, las más recientes primero
            const sortedProfits = [...profits].sort((a, b) => {
                return new Date(b.dueDate) - new Date(a.dueDate);
            });
            
            sortedProfits.forEach(profit => {
                html += createProfitItemHTML(profit);
            });
        } else {
            html = '<div class="empty-list">لا توجد أرباح متاحة</div>';
        }
        
        profitsList.innerHTML = html;
    }
    
    // Crear HTML para un elemento de ganancia
    function createProfitItemHTML(profit) {
        // Determinar la clase y texto según el estado
        const statusClass = profit.status === 'paid' ? 'badge-success' : 'badge-warning';
        const statusText = profit.status === 'paid' ? 'مدفوع' : 'مستحق';
        
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
    
    // Obtener transacciones de un inversionista
    function getInvestorTransactions(investorId) {
        if (!investorId) return [];
        
        // Buscar en la lista global
        let transactions = [];
        
        if (window.transactionsList && Array.isArray(window.transactionsList)) {
            transactions = window.transactionsList.filter(tx => tx.investorId === investorId);
        } else if (window.transactions && Array.isArray(window.transactions)) {
            transactions = window.transactions.filter(tx => tx.investorId === investorId);
        }
        
        // Si no hay transacciones y tenemos el sistema principal, intentar obtenerlas
        if (!transactions.length && mainSystem && mainSystem.getInvestorTransactions) {
            transactions = mainSystem.getInvestorTransactions(investorId) || [];
        }
        
        // Si aún no hay transacciones, generar datos de ejemplo
        if (!transactions.length) {
            transactions = generateDummyTransactions(investorId);
        }
        
        return transactions;
    }
    
    // Generar transacciones de ejemplo
    function generateDummyTransactions(investorId) {
        // Buscar al inversionista
        const investor = findInvestorById(investorId);
        if (!investor) return [];
        
        const transactions = [];
        const amount = investor.amount || 0;
        
        // Fecha de inicio (fecha de unión o hace 3 meses si no hay)
        const joinDate = new Date(investor.joinDate || investor.createdAt || new Date());
        joinDate.setMonth(joinDate.getMonth() - 3); // Default a 3 meses atrás
        
        const today = new Date();
        
        // Añadir depósito inicial
        transactions.push({
            id: `dummy-tr-${investorId}-1`,
            investorId: investorId,
            type: 'إيداع',
            amount: amount,
            balanceAfter: amount,
            date: joinDate.toISOString(),
            createdAt: joinDate.toISOString(),
            notes: 'الإيداع الأولي'
        });
        
        // Añadir ganancias mensuales
        let currentDate = new Date(joinDate);
        currentDate.setMonth(currentDate.getMonth() + 1);
        
        let currentBalance = amount;
        let counter = 2;
        
        // Añadir transacciones para cada mes hasta hoy
        while (currentDate < today) {
            // Calcular ganancia mensual basada en la tasa de interés
            const profitAmount = amount * (configData.interestRate / 100) / 12;
            currentBalance += profitAmount;
            
            transactions.push({
                id: `dummy-tr-${investorId}-${counter}`,
                investorId: investorId,
                type: 'ربح',
                amount: profitAmount,
                balanceAfter: currentBalance,
                date: currentDate.toISOString(),
                createdAt: currentDate.toISOString(),
                notes: 'ربح شهري'
            });
            
            // Avanzar al siguiente mes
            currentDate.setMonth(currentDate.getMonth() + 1);
            counter++;
        }
        
        return transactions;
    }
    
    // Obtener ganancias de un inversionista
    function getInvestorProfits(investorId) {
        if (!investorId) return [];
        
        // Buscar en la lista global
        let profits = [];
        
        if (window.profitsList && Array.isArray(window.profitsList)) {
            profits = window.profitsList.filter(profit => profit.investorId === investorId);
        } else if (window.profits && Array.isArray(window.profits)) {
            profits = window.profits.filter(profit => profit.investorId === investorId);
        }
        
        // Si no hay ganancias, intentar generarlas a partir de las transacciones
        if (!profits.length) {
            profits = generateProfitsFromTransactions(investorId);
        }
        
        return profits;
    }
    
    // Generar ganancias a partir de las transacciones
    function generateProfitsFromTransactions(investorId) {
        // Obtener transacciones de tipo ganancia
        const transactions = getInvestorTransactions(investorId);
        const profitTransactions = transactions.filter(tx => 
            tx.type === 'ربح' || tx.type === 'profit'
        );
        
        if (!profitTransactions.length) {
            // Si no hay transacciones de ganancia, generar ejemplo
            return generateDummyProfits(investorId);
        }
        
        // Convertir transacciones a ganancias
        return profitTransactions.map((tx, index) => {
            return {
                id: `profit-${investorId}-${index + 1}`,
                investorId: investorId,
                amount: tx.amount,
                dueDate: tx.date || tx.createdAt,
                paidDate: tx.date || tx.createdAt, // Asumimos que ya está pagada
                status: 'paid',
                cycle: 'شهرية', // Ciclo mensual
            };
        });
    }
    
    // Generar ganancias de ejemplo
    function generateDummyProfits(investorId) {
        // Buscar al inversionista
        const investor = findInvestorById(investorId);
        if (!investor) return [];
        
        const profits = [];
        const amount = investor.amount || 0;
        
        // Calcular ganancia mensual
        const monthlyProfit = amount * (configData.interestRate / 100) / 12;
        
        // Fecha de inicio (fecha de unión o hace 3 meses)
        const joinDate = new Date(investor.joinDate || investor.createdAt || new Date());
        joinDate.setMonth(joinDate.getMonth() - 3); // Default a 3 meses atrás
        
        const today = new Date();
        
        // Crear un registro por cada mes
        let currentDate = new Date(joinDate);
        currentDate.setMonth(currentDate.getMonth() + 1);
        
        let counter = 1;
        
        // Generar ganancias mensuales hasta hoy
        while (currentDate <= today) {
            // Estado (pagado si es antes de hoy)
            const isPaid = currentDate < today;
            
            // Fecha de pago (si está pagado)
            let paidDate = null;
            if (isPaid) {
                paidDate = new Date(currentDate);
                paidDate.setDate(paidDate.getDate() + Math.floor(Math.random() * 3) + 1);
            }
            
            profits.push({
                id: `dummy-profit-${investorId}-${counter}`,
                investorId: investorId,
                amount: monthlyProfit,
                dueDate: currentDate.toISOString(),
                paidDate: paidDate ? paidDate.toISOString() : null,
                status: isPaid ? 'paid' : 'pending',
                cycle: 'شهرية'
            });
            
            // Avanzar al siguiente mes
            currentDate.setMonth(currentDate.getMonth() + 1);
            counter++;
        }
        
        return profits;
    }
    
    // Calcular estadísticas de ganancia
    function calculateProfitStats(investorId) {
        const profits = getInvestorProfits(investorId);
        
        // Ganancias recibidas (pagadas)
        const receivedProfits = profits
            .filter(profit => profit.status === 'paid')
            .reduce((sum, profit) => sum + (profit.amount || 0), 0);
        
        // Calcular la ganancia del mes actual
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Encontrar la ganancia de este mes
        const currentMonthProfit = profits.find(profit => {
            const profitDate = new Date(profit.dueDate);
            return profitDate.getMonth() === currentMonth && 
                   profitDate.getFullYear() === currentYear;
        });
        
        // Si hay una ganancia para este mes
        let currentProfit = 0;
        if (currentMonthProfit) {
            if (currentMonthProfit.status === 'paid') {
                // Si ya está pagada, usar el monto completo
                currentProfit = currentMonthProfit.amount || 0;
            } else {
                // Si está pendiente, calcular proporcionalmente
                const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                const currentDay = today.getDate();
                
                // Porcentaje del mes transcurrido
                const monthPercentage = currentDay / daysInMonth;
                currentProfit = (currentMonthProfit.amount || 0) * monthPercentage;
            }
        } else {
            // Si no hay ganancia específica, calcularla para el inversionista
            const investor = findInvestorById(investorId);
            if (investor && investor.amount) {
                // Calcular ganancia mensual
                const monthlyAmount = investor.amount * (configData.interestRate / 100) / 12;
                
                // Ganancia proporcional al día del mes
                const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                const currentDay = today.getDate();
                const monthPercentage = currentDay / daysInMonth;
                
                currentProfit = monthlyAmount * monthPercentage;
            }
        }
        
        return {
            receivedProfits,
            currentMonthProfit: currentProfit
        };
    }
    
    // Calcular la ganancia mensual
    function calculateMonthlyProfit(amount) {
        // Tasa de interés anual
        const annualRate = configData.interestRate / 100 || 0.175;
        
        // Calcular ganancia mensual
        return amount * annualRate / 12;
    }
    
    // Calcular días de inversión
    function calculateInvestmentDays(startDate) {
        if (!startDate) return 0;
        
        // Convertir a objeto Date
        const start = new Date(startDate);
        const today = new Date();
        
        // Calcular diferencia en días
        const diffTime = today - start;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }
    
    // Calcular fecha de próxima ganancia
    function calculateNextProfitDate(startDate) {
        if (!startDate) return null;
        
        // Convertir a objeto Date
        const start = new Date(startDate);
        const today = new Date();
        
        // Día de pago (mismo día del mes que la fecha inicial)
        const paymentDay = start.getDate();
        
        // Crear fecha de próximo pago
        let nextDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);
        
        // Si el día actual ya pasó el día de pago, ir al próximo mes
        if (today.getDate() >= paymentDay) {
            nextDate.setMonth(nextDate.getMonth() + 1);
        }
        
        return nextDate;
    }
    
    // Aplicar estilo a la tarjeta
    function applyCardStyle(card) {
        const cardType = card.cardType || 'platinum';
        const cardFront = document.querySelector('.card-front');
        const cardBack = document.querySelector('.card-back');
        
        if (!cardFront || !cardBack) return;
        
        // Definición de estilos para los diferentes tipos de tarjeta
        const cardStyles = {
            platinum: {
                color: '#303030',
                textColor: '#ffffff',
                chipColor: '#FFD700'
            },
            gold: {
                color: '#D4AF37',
                textColor: '#000000',
                chipColor: '#ffffff'
            },
            premium: {
                color: '#1F3A5F',
                textColor: '#ffffff',
                chipColor: '#C0C0C0'
            },
            diamond: {
                color: '#16213E',
                textColor: '#ffffff',
                chipColor: '#B9F2FF'
            },
            islamic: {
                color: '#006B3C',
                textColor: '#ffffff',
                chipColor: '#F8C300'
            },
            custom: {
                color: '#3498db',
                textColor: '#ffffff',
                chipColor: '#C0C0C0'
            }
        };
        
        // Obtener el estilo para el tipo de tarjeta
        const style = cardStyles[cardType] || cardStyles.platinum;
        
        // Aplicar estilos
        cardFront.style.backgroundColor = style.color;
        cardFront.style.color = style.textColor;
        cardBack.style.backgroundColor = style.color;
        cardBack.style.color = style.textColor;
        
        // Actualizar color del chip
        const cardChip = document.querySelector('.card-chip');
        if (cardChip) {
            cardChip.style.background = `linear-gradient(135deg, ${style.chipColor}88 0%, ${style.chipColor} 50%, ${style.chipColor}88 100%)`;
        }
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
        
        // Si tenemos el sistema principal, intentar obtenerlo
        if (mainSystem && mainSystem.getInvestorById) {
            return mainSystem.getInvestorById(investorId) || null;
        }
        
        return null;
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
            console.error('Error al formatear fecha:', error);
            return '-';
        }
    }
    
    // Formatear fecha de expiración (MM/YY)
    function formatExpiryDate(dateString) {
        if (!dateString) return 'MM/YY';
        
        try {
            const date = new Date(dateString);
            
            if (isNaN(date.getTime())) {
                // Si no es una fecha válida, verificar si ya está en formato MM/YY
                if (/^\d{2}\/\d{2}$/.test(dateString)) {
                    return dateString;
                }
                return 'MM/YY';
            }
            
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear().toString().slice(2);
            
            return `${month}/${year}`;
        } catch (error) {
            console.error('Error al formatear fecha de expiración:', error);
            return 'MM/YY';
        }
    }
    
    // Formatear moneda
    function formatCurrency(amount) {
        // Asegurar que amount es un número
        amount = parseFloat(amount) || 0;
        
        try {
            return new Intl.NumberFormat('ar-IQ', {
                style: 'currency',
                currency: 'IQD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        } catch (error) {
            // Formato simple como fallback
            return `${amount.toLocaleString('ar-IQ')} دينار`;
        }
    }
    
    // Mostrar indicador de sincronización
    function showSyncIndicator(isVisible) {
        // Crear o actualizar el indicador
        let syncIndicator = document.getElementById('sync-indicator');
        
        if (!syncIndicator && isVisible) {
            syncIndicator = document.createElement('div');
            syncIndicator.id = 'sync-indicator';
            syncIndicator.innerHTML = `
                <div class="sync-spinner"></div>
                <span>جارٍ المزامنة...</span>
            `;
            
            // Estilos en línea
            syncIndicator.style.cssText = `
                position: fixed;
                top: 10px;
                left: 10px;
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 9999;
                display: flex;
                align-items: center;
                gap: 5px;
            `;
            
            // Agregar estilos para el spinner
            const style = document.createElement('style');
            style.textContent = `
                .sync-spinner {
                    width: 12px;
                    height: 12px;
                    border: 2px solid #fff;
                    border-top-color: transparent;
                    border-radius: 50%;
                    animation: sync-spin 1s linear infinite;
                }
                
                @keyframes sync-spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
            
            document.body.appendChild(syncIndicator);
        } else if (syncIndicator) {
            syncIndicator.style.display = isVisible ? 'flex' : 'none';
        }
    }
    
    // Mostrar indicador de carga
    function showLoadingIndicator(isVisible) {
        // Podemos reutilizar el indicador de sincronización o crear uno específico
        showSyncIndicator(isVisible);
    }
    
    // Verificar tarjeta del inversionista actual
    function checkCurrentInvestorCard() {
        // Verificar si hay un inversionista activo
        const currentUser = document.getElementById('user-name');
        if (!currentUser || !currentUser.textContent || currentUser.textContent === 'المستثمر') {
            console.log('No hay un inversionista activo para verificar la tarjeta');
            return;
        }
        
        // La tarjeta actual
        const currentCard = cardSystem.getCurrentCard ? cardSystem.getCurrentCard() : null;
        if (!currentCard) {
            console.log('No hay una tarjeta activa');
            return;
        }
        
        // Forzar actualización de la interfaz
        updateCardUserInterface();
    }
    
    // Exportar interfaz pública
    return {
        initialize,
        performFullSync,
        performIncrementalSync,
        updateCardUserInterface,
        checkCurrentInvestorCard,
        EVENTS
    };
})();

// Exportar el módulo globalmente
window.InvestorCardSync = InvestorCardSync;

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el sistema de sincronización
    InvestorCardSync.initialize()
        .then(success => {
            console.log('Sistema de sincronización inicializado:', success);
        })
        .catch(error => {
            console.error('Error al inicializar el sistema de sincronización:', error);
        });
});

// Configurar evento de sincronización periódica (cada 30 minutos)
setInterval(function() {
    if (document.visibilityState === 'visible') {
        InvestorCardSync.performFullSync()
            .then(() => console.log('Sincronización periódica completada'))
            .catch(console.error);
    }
}, 30 * 60 * 1000);