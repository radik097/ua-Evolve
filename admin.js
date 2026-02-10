/**
 * Admin Panel - JavaScript Logic
 * Handles authentication, events management, and statistics
 */

// Admin state
const ADMIN_STATE = {
    isAuthenticated: false,
    passwordHash: null,
    events: [],
    registrations: [],
    autoRefreshId: null,
    autoRefreshIntervalMs: 15000,
};

// Default password hash (SHA256 of "admin123")
// Change this to your own password hash!
const DEFAULT_PASSWORD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
const THEME_STORAGE_KEY = 'queue_theme';
const LANG_STORAGE_KEY = 'queue_lang';
const EVENTS_STORAGE_KEY = 'admin_events';
const USERS_STORAGE_KEY = 'queue_users';
const CURRENT_USER_STORAGE_KEY = 'current_user';
const ENC_KEY_STORAGE = 'queue_enc_key';
const ENC_KEY_USER = 'queue_enc_user';

let encryptionKey = null;

function sanitizeText(value) {
    return DOMPurify.sanitize(String(value ?? ''), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

function setText(el, value) {
    if (!el) return;
    el.textContent = sanitizeText(value);
}

function setPlaceholder(el, value) {
    if (!el) return;
    el.setAttribute('placeholder', sanitizeText(value));
}

function clearElement(el) {
    if (!el) return;
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}

function createActionButton(label, className, title, onClick) {
    const btn = document.createElement('button');
    btn.className = className;
    if (title) {
        btn.title = sanitizeText(title);
    }
    setText(btn, label);
    btn.addEventListener('click', onClick);
    return btn;
}

const TRANSLATIONS = {
    uk: {
        adminPageTitle: 'Адмін-панель',
        adminHeaderTitle: '🔐 Адмін-панель',
        adminHeaderSubtitle: 'Керування реєстраціями та подіями',
        logoutButton: 'Вихід',
        loginTitle: 'Вхід в адмінку',
        loginPasswordLabel: 'Пароль *',
        loginPasswordPlaceholder: 'Введіть пароль',
        loginPasswordHelper: 'Використовується SHA256 хеш для безпеки',
        loginButton: 'Увійти',
        loginErrorWrong: 'Неправильний пароль',
        navRegistrations: '📋 Реєстрації',
        navEvents: '📅 Події',
        navStatistics: '📊 Статистика',
        navSettings: '⚙️ Налаштування',
        registrationsTitle: '📋 Реєстрації',
        searchPlaceholder: "Пошук за ім'ям або телефоном...",
        filterAll: 'Усі записи',
        exportCsv: '📥 Завантажити CSV',
        refreshBtn: '🔄 Оновити',
        lastRefreshPlaceholder: 'Останнє оновлення: —',
        lastRefreshLabel: 'Останнє оновлення: {time}',
        registrationsLoading: 'Завантаження...',
        registrationsEmpty: 'Немає реєстрацій',
        registrationsLoadError: '❌ Помилка завантаження реєстрацій',
        registeredAt: 'Зареєстровано:',
        registrationEvent: 'Подія:',
        eventsTitle: '📅 Події',
        addEventTitle: 'Додати нову подію',
        eventNameLabel: 'Назва *',
        eventTypeLabel: 'Тип *',
        eventTypeOnce: 'Одноразова',
        eventTypeWeekly: 'Щотижнева',
        eventTypeMonthly: 'Щомісячна',
        eventStartLabel: 'Початок (час) *',
        eventEndLabel: 'Кінець (час) *',
        eventDaysLabel: 'Дні тижня (для щотижневих)',
        dayMon: 'Пн',
        dayTue: 'Вт',
        dayWed: 'Ср',
        dayThu: 'Чт',
        dayFri: 'Пт',
        daySat: 'Сб',
        daySun: 'Нд',
        addEventButton: '+ Додати подію',
        existingEventsTitle: 'Наявні події',
        eventsLoading: 'Завантаження...',
        eventsLoadError: '❌ Помилка завантаження подій',
        eventsEmpty: 'Немає подій',
        eventCardId: 'ID:',
        eventCardType: 'Тип:',
        eventCardTime: 'Час:',
        eventCardDays: 'Дні:',
        eventEdit: '✎ Редагувати',
        eventDelete: '✕ Видалити',
        statisticsTitle: '📊 Статистика',
        statTotal: 'Всього реєстрацій',
        statAttended: 'Присутні',
        statMissed: 'Не прийшли',
        statAvgRating: 'Середній рейтинг',
        chartTitle: 'Графік реєстрацій за часом',
        chartPlaceholder: '📈 Візуалізацію буде додано',
        settingsTitle: '⚙️ Налаштування',
        settingsRepoTitle: 'GitHub репозиторій',
        settingsOwnerLabel: 'Власник репозиторію',
        settingsRepoLabel: 'Назва репозиторію',
        settingsPasswordTitle: 'Пароль адмінки',
        settingsPasswordHint: 'Пароль зберігається локально і порівнюється через SHA256 хеш',
        settingsNewPasswordLabel: 'Новий пароль',
        settingsNewPasswordPlaceholder: 'Залиште порожнім, щоб не змінювати',
        saveSettingsButton: '💾 Зберегти налаштування',
        dangerZoneTitle: 'Небезпечна зона',
        clearDataButton: '🗑️ Очистити всі дані',
        dangerZoneHint: 'Це видалить усі локальні дані. Дані на GitHub залишаться.',
        backToSite: '← Повернутися на сайт',
        confirmClearData: 'Ви впевнені? Це видалить усі локальні дані.',
        confirmLogout: 'Ви впевнені, що хочете вийти?',
        deleteRegistrationConfirm: 'Видалити цю реєстрацію?',
        deleteEventConfirm: 'Видалити цю подію?',
        exportNoData: 'Немає даних для експорту',
        csvName: "Ім'я",
        csvPhone: 'Телефон',
        csvTime: 'Час',
        csvEvent: 'Подія',
        dataCleared: 'Дані очищено',
        passwordChanged: 'Пароль змінено',
        enterNewPassword: 'Введіть новий пароль',
        deleteError: 'Помилка видалення: {message}',
        saveEventError: 'Помилка збереження події: {message}',
        statsLoadError: 'Помилка завантаження статистики',
        attendanceRecorded: 'Присутність записана для {name}!',
        attendanceTimes: 'Усього присутностей: {count}',
        alreadyMarkedToday: '{name} вже позначена як присутня сьогодні.',
        statAvgAttendance: 'Середня присутність',
        phoneVerifiedLabel: 'Телефон підтверджено',
        phoneUnverifiedLabel: 'Телефон не підтверджено',
        verifyPhoneButton: '✓ Підтвердити телефон',
        verifyPhoneConfirm: 'Підтвердити номер телефону для {name}?',
        phoneVerifiedSuccess: 'Телефон підтверджено для {name}.',
        phoneVerifyUserMissing: 'Користувача не знайдено для цієї реєстрації.',
        phoneVerifyMissingPhone: 'У користувача немає номера телефону.',
        phoneAlreadyVerified: 'Телефон уже підтверджено для {name}.',
        themeDark: '🌙 Темна тема',
        themeLight: '☀️ Світла тема'
    },
    ru: {
        adminPageTitle: 'Админ-панель',
        adminHeaderTitle: '🔐 Админ-панель',
        adminHeaderSubtitle: 'Управление регистрациями и событиями',
        logoutButton: 'Выход',
        loginTitle: 'Вход в админку',
        loginPasswordLabel: 'Пароль *',
        loginPasswordPlaceholder: 'Введите пароль',
        loginPasswordHelper: 'Используется SHA256 хеш для безопасности',
        loginButton: 'Войти',
        loginErrorWrong: 'Неправильный пароль',
        navRegistrations: '📋 Регистрации',
        navEvents: '📅 События',
        navStatistics: '📊 Статистика',
        navSettings: '⚙️ Настройки',
        registrationsTitle: '📋 Регистрации',
        searchPlaceholder: 'Поиск по имени или телефону...',
        filterAll: 'Все записи',
        exportCsv: '📥 Скачать CSV',
        refreshBtn: '🔄 Обновить',
        lastRefreshPlaceholder: 'Последнее обновление: —',
        lastRefreshLabel: 'Последнее обновление: {time}',
        registrationsLoading: 'Загрузка...',
        registrationsEmpty: 'Нет регистраций',
        registrationsLoadError: '❌ Ошибка загрузки регистраций',
        registeredAt: 'Зарегистрирован:',
        registrationEvent: 'Событие:',
        eventsTitle: '📅 События',
        addEventTitle: 'Добавить новое событие',
        eventNameLabel: 'Название *',
        eventTypeLabel: 'Тип *',
        eventTypeOnce: 'Одноразовое',
        eventTypeWeekly: 'Еженедельное',
        eventTypeMonthly: 'Ежемесячное',
        eventStartLabel: 'Начало (время) *',
        eventEndLabel: 'Конец (время) *',
        eventDaysLabel: 'Дни недели (для еженедельных)',
        dayMon: 'Пн',
        dayTue: 'Вт',
        dayWed: 'Ср',
        dayThu: 'Чт',
        dayFri: 'Пт',
        daySat: 'Сб',
        daySun: 'Вс',
        addEventButton: '+ Добавить событие',
        existingEventsTitle: 'Существующие события',
        eventsLoading: 'Загрузка...',
        eventsLoadError: '❌ Ошибка загрузки событий',
        eventsEmpty: 'Нет событий',
        eventCardId: 'ID:',
        eventCardType: 'Тип:',
        eventCardTime: 'Время:',
        eventCardDays: 'Дни:',
        eventEdit: '✎ Редактировать',
        eventDelete: '✕ Удалить',
        statisticsTitle: '📊 Статистика',
        statTotal: 'Всего регистраций',
        statAttended: 'При посещении',
        statMissed: 'Не пришли',
        statAvgRating: 'Средний рейтинг',
        chartTitle: 'График регистраций по времени',
        chartPlaceholder: '📈 Визуализация будет добавлена',
        settingsTitle: '⚙️ Настройки',
        settingsRepoTitle: 'GitHub репозиторий',
        settingsOwnerLabel: 'Владелец репозитория',
        settingsRepoLabel: 'Имя репозитория',
        settingsPasswordTitle: 'Пароль админки',
        settingsPasswordHint: 'Пароль хранится локально и сравнивается через SHA256 хеш',
        settingsNewPasswordLabel: 'Новый пароль',
        settingsNewPasswordPlaceholder: 'Оставьте пусто, чтобы не менять',
        saveSettingsButton: '💾 Сохранить настройки',
        dangerZoneTitle: 'Опасная зона',
        clearDataButton: '🗑️ Очистить все данные',
        dangerZoneHint: 'Это удалит все локальные данные. Данные на GitHub останутся.',
        backToSite: '← Вернуться на сайт',
        confirmClearData: 'Вы уверены? Это удалит все локальные данные.',
        confirmLogout: 'Вы уверены, что хотите выйти?',
        deleteRegistrationConfirm: 'Удалить эту регистрацию?',
        deleteEventConfirm: 'Удалить это событие?',
        exportNoData: 'Нет данных для экспорта',
        csvName: 'Имя',
        csvPhone: 'Телефон',
        csvTime: 'Время',
        csvEvent: 'Событие',
        dataCleared: 'Данные очищены',
        passwordChanged: 'Пароль изменен',
        enterNewPassword: 'Введите новый пароль',
        deleteError: 'Ошибка удаления: {message}',
        saveEventError: 'Ошибка сохранения события: {message}',
        statsLoadError: 'Ошибка загрузки статистики',
        attendanceRecorded: 'Присутствие записано для {name}!',
        attendanceTimes: 'Всего присутствий: {count}',
        alreadyMarkedToday: '{name} уже отмечена как присутствующая сегодня.',
        statAvgAttendance: 'Средняя присутствие',
        phoneVerifiedLabel: 'Телефон подтвержден',
        phoneUnverifiedLabel: 'Телефон не подтвержден',
        verifyPhoneButton: '✓ Подтвердить телефон',
        verifyPhoneConfirm: 'Подтвердить номер телефона для {name}?',
        phoneVerifiedSuccess: 'Телефон подтвержден для {name}.',
        phoneVerifyUserMissing: 'Пользователь для этой регистрации не найден.',
        phoneVerifyMissingPhone: 'У пользователя нет номера телефона.',
        phoneAlreadyVerified: 'Телефон уже подтвержден для {name}.',
        themeDark: '🌙 Темная тема',
        themeLight: '☀️ Светлая тема'
    },
    en: {
        adminPageTitle: 'Admin panel',
        adminHeaderTitle: '🔐 Admin panel',
        adminHeaderSubtitle: 'Manage registrations and events',
        logoutButton: 'Log out',
        loginTitle: 'Admin login',
        loginPasswordLabel: 'Password *',
        loginPasswordPlaceholder: 'Enter password',
        loginPasswordHelper: 'SHA256 hash is used for security',
        loginButton: 'Sign in',
        loginErrorWrong: 'Incorrect password',
        navRegistrations: '📋 Registrations',
        navEvents: '📅 Events',
        navStatistics: '📊 Statistics',
        navSettings: '⚙️ Settings',
        registrationsTitle: '📋 Registrations',
        searchPlaceholder: 'Search by name or phone...',
        filterAll: 'All records',
        exportCsv: '📥 Download CSV',
        refreshBtn: '🔄 Refresh',
        lastRefreshPlaceholder: 'Last updated: —',
        lastRefreshLabel: 'Last updated: {time}',
        registrationsLoading: 'Loading...',
        registrationsEmpty: 'No registrations',
        registrationsLoadError: '❌ Failed to load registrations',
        registeredAt: 'Registered at:',
        registrationEvent: 'Event:',
        eventsTitle: '📅 Events',
        addEventTitle: 'Add new event',
        eventNameLabel: 'Name *',
        eventTypeLabel: 'Type *',
        eventTypeOnce: 'One-time',
        eventTypeWeekly: 'Weekly',
        eventTypeMonthly: 'Monthly',
        eventStartLabel: 'Start time *',
        eventEndLabel: 'End time *',
        eventDaysLabel: 'Weekdays (for weekly)',
        dayMon: 'Mon',
        dayTue: 'Tue',
        dayWed: 'Wed',
        dayThu: 'Thu',
        dayFri: 'Fri',
        daySat: 'Sat',
        daySun: 'Sun',
        addEventButton: '+ Add event',
        existingEventsTitle: 'Existing events',
        eventsLoading: 'Loading...',
        eventsLoadError: '❌ Failed to load events',
        eventsEmpty: 'No events',
        eventCardId: 'ID:',
        eventCardType: 'Type:',
        eventCardTime: 'Time:',
        eventCardDays: 'Days:',
        eventEdit: '✎ Edit',
        eventDelete: '✕ Delete',
        statisticsTitle: '📊 Statistics',
        statTotal: 'Total registrations',
        statAttended: 'Attended',
        statMissed: 'Missed',
        statAvgRating: 'Average rating',
        chartTitle: 'Registrations over time',
        chartPlaceholder: '📈 Visualization will be added',
        settingsTitle: '⚙️ Settings',
        settingsRepoTitle: 'GitHub repository',
        settingsOwnerLabel: 'Repository owner',
        settingsRepoLabel: 'Repository name',
        settingsPasswordTitle: 'Admin password',
        settingsPasswordHint: 'Password is stored locally and compared via SHA256 hash',
        settingsNewPasswordLabel: 'New password',
        settingsNewPasswordPlaceholder: 'Leave blank to keep current',
        saveSettingsButton: '💾 Save settings',
        dangerZoneTitle: 'Danger zone',
        clearDataButton: '🗑️ Clear all data',
        dangerZoneHint: 'This removes all local data. GitHub data stays.',
        backToSite: '← Back to site',
        confirmClearData: 'Are you sure? This removes all local data.',
        confirmLogout: 'Are you sure you want to log out?',
        deleteRegistrationConfirm: 'Delete this registration?',
        deleteEventConfirm: 'Delete this event?',
        exportNoData: 'No data to export',
        csvName: 'Name',
        csvPhone: 'Phone',
        csvTime: 'Time',
        csvEvent: 'Event',
        dataCleared: 'Data cleared',
        passwordChanged: 'Password changed',
        enterNewPassword: 'Enter a new password',
        deleteError: 'Delete error: {message}',
        saveEventError: 'Event save error: {message}',
        statsLoadError: 'Failed to load statistics',
        attendanceRecorded: 'Attendance recorded for {name}!',
        attendanceTimes: 'Total attendances: {count}',
        alreadyMarkedToday: '{name} is already marked as attended today.',
        statAvgAttendance: 'Average attendance',
        phoneVerifiedLabel: 'Phone verified',
        phoneUnverifiedLabel: 'Phone not verified',
        verifyPhoneButton: '✓ Verify phone',
        verifyPhoneConfirm: 'Verify phone number for {name}?',
        phoneVerifiedSuccess: 'Phone verified for {name}.',
        phoneVerifyUserMissing: 'User not found for this registration.',
        phoneVerifyMissingPhone: 'User has no phone number.',
        phoneAlreadyVerified: 'Phone already verified for {name}.',
        themeDark: '🌙 Dark theme',
        themeLight: '☀️ Light theme'
    }
};

let currentLanguage = 'uk';

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    setupLanguageToggle();
    setupThemeToggle();
    checkAuthentication();
    setupLoginForm();
    setupNavigation();
    setupEventForm();
    setupButtons();
});

// ============================================================================
// THEME
// ============================================================================

function setupThemeToggle() {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    applyTheme(initialTheme);

    toggleBtn.addEventListener('click', () => {
        const nextTheme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
        applyTheme(nextTheme);
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    });
}

function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('theme-dark', isDark);

    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        setText(toggleBtn, isDark ? t('themeLight') : t('themeDark'));
        toggleBtn.setAttribute('aria-pressed', String(isDark));
    }
}

function setupLanguageToggle() {
    const select = document.getElementById('languageSelect');
    if (!select) return;

    const savedLanguage = localStorage.getItem(LANG_STORAGE_KEY);
    currentLanguage = savedLanguage || 'uk';
    select.value = currentLanguage;
    applyLanguage(currentLanguage);

    select.addEventListener('change', () => {
        currentLanguage = select.value;
        localStorage.setItem(LANG_STORAGE_KEY, currentLanguage);
        applyLanguage(currentLanguage);
        applyTheme(document.body.classList.contains('theme-dark') ? 'dark' : 'light');
        updateLastRefresh();
    });
}

function applyLanguage(language) {
    const translations = TRANSLATIONS[language] || TRANSLATIONS.uk;

    document.documentElement.lang = language;
    document.title = sanitizeText(translations.adminPageTitle);

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (translations[key]) {
            setText(el, translations[key]);
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[key]) {
            setPlaceholder(el, translations[key]);
        }
    });
}

function t(key, vars = {}) {
    const translations = TRANSLATIONS[currentLanguage] || TRANSLATIONS.uk;
    const template = translations[key] || TRANSLATIONS.uk[key] || key;
    return template.replace(/\{(\w+)\}/g, (_, token) => vars[token] ?? `{${token}}`);
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

function getEffectivePasswordHash() {
    const storedHash = localStorage.getItem('admin_password_hash');
    if (storedHash && /^[a-f0-9]{64}$/i.test(storedHash)) {
        return storedHash;
    }

    if (storedHash) {
        localStorage.removeItem('admin_password_hash');
    }

    return DEFAULT_PASSWORD_HASH;
}

function checkAuthentication() {
    const authToken = localStorage.getItem('admin_auth_token');
    const storedHash = localStorage.getItem('admin_password_hash');

    if (authToken === 'authenticated' && storedHash) {
        ADMIN_STATE.isAuthenticated = true;
        ADMIN_STATE.passwordHash = storedHash;
        showAdminPanel();
    }
}

function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const password = document.getElementById('adminPassword').value;
        const hash = sha256(password);
        const effectiveHash = getEffectivePasswordHash();
        
        // In real app, this would be securely verified on backend
        if (hash === effectiveHash) {
            ADMIN_STATE.isAuthenticated = true;
            ADMIN_STATE.passwordHash = hash;
            
            // Save auth token
            localStorage.setItem('admin_auth_token', 'authenticated');
            localStorage.setItem('admin_password_hash', effectiveHash);
            
            showAdminPanel();
        } else {
            showLoginError(t('loginErrorWrong'));
        }
    });
}

function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    setText(errorDiv, message);
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showAdminPanel() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'block';
    
    // Load initial data
    loadRegistrations();
    loadEvents();
    loadStatistics();
    startAutoRefresh();
}

// ============================================================================
// NAVIGATION
// ============================================================================

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.admin-section');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.getAttribute('data-section');
            
            // Update active states
            navButtons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');
            
            // Load fresh data for the section
            if (sectionId === 'registrations') {
                loadRegistrations();
                startAutoRefresh();
            } else {
                stopAutoRefresh();
                if (sectionId === 'events') {
                    loadEvents();
                } else if (sectionId === 'statistics') {
                    loadStatistics();
                }
            }
        });
    });
}

// ============================================================================
// REGISTRATIONS MANAGEMENT
// ============================================================================

function setupButtons() {
    const logoutBtn = document.getElementById('logoutBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');
    const searchInput = document.getElementById('searchInput');
    const eventFilterSelect = document.getElementById('eventFilterSelect');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');
    
    logoutBtn?.addEventListener('click', logout);
    refreshBtn?.addEventListener('click', () => loadRegistrations());
    exportBtn?.addEventListener('click', exportToCSV);
    searchInput?.addEventListener('input', filterRegistrations);
    eventFilterSelect?.addEventListener('change', filterRegistrations);
    saveSettingsBtn?.addEventListener('click', saveSettings);
    clearDataBtn?.addEventListener('click', () => {
        if (confirm(t('confirmClearData'))) {
            localStorage.clear();
            alert(t('dataCleared'));
        }
    });
}

function startAutoRefresh() {
    stopAutoRefresh();
    ADMIN_STATE.autoRefreshId = setInterval(() => {
        if (!ADMIN_STATE.isAuthenticated) return;
        const registrationsSection = document.getElementById('registrations');
        if (!registrationsSection || !registrationsSection.classList.contains('active')) {
            return;
        }
        loadRegistrations();
    }, ADMIN_STATE.autoRefreshIntervalMs);
}

function stopAutoRefresh() {
    if (ADMIN_STATE.autoRefreshId) {
        clearInterval(ADMIN_STATE.autoRefreshId);
        ADMIN_STATE.autoRefreshId = null;
    }
}

async function loadRegistrations() {
    try {
        const registrations = await fetchRegistrationsFromGitHub();
        ADMIN_STATE.registrations = registrations;
        displayRegistrations(registrations);
        updateEventFilter();
        updateLastRefresh();
    } catch (err) {
        console.error('Error loading registrations:', err);
        const list = document.getElementById('registrationsList');
        if (list) {
            clearElement(list);
            const p = document.createElement('p');
            setText(p, t('registrationsLoadError'));
            list.appendChild(p);
        }
    }
}

function updateLastRefresh() {
    const indicator = document.getElementById('lastRefresh');
    if (!indicator) return;

    const timeText = new Date().toLocaleTimeString(getLocale(), {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    setText(indicator, t('lastRefreshLabel', { time: timeText }));
}

async function loadEncryptionKey() {
    if (encryptionKey) return encryptionKey;

    const keyB64 = sessionStorage.getItem(ENC_KEY_STORAGE);
    const keyUser = sessionStorage.getItem(ENC_KEY_USER);
    if (!keyB64 || !keyUser) {
        return null;
    }

    const keyBytes = base64ToBytes(keyB64);
    encryptionKey = await window.crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
    return encryptionKey;
}

function bytesToBase64(bytes) {
    let binary = '';
    bytes.forEach((b) => {
        binary += String.fromCharCode(b);
    });
    return btoa(binary);
}

function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function encryptJson(value) {
    const key = await loadEncryptionKey();
    if (!key) {
        throw new Error('Missing encryption key');
    }

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(value));
    const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
    );

    return {
        enc: true,
        v: 1,
        iv: bytesToBase64(iv),
        data: bytesToBase64(new Uint8Array(ciphertext))
    };
}

async function decryptJson(payload) {
    const key = await loadEncryptionKey();
    if (!key) {
        throw new Error('Missing encryption key');
    }

    const iv = base64ToBytes(payload.iv);
    const data = base64ToBytes(payload.data);
    const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
    );
    const decoded = new TextDecoder().decode(decrypted);
    return JSON.parse(decoded);
}

async function getEncryptedItem(storageKey, fallbackValue) {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return fallbackValue;

    try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.enc) {
            return await decryptJson(parsed);
        }

        const plain = parsed;
        await setEncryptedItem(storageKey, plain);
        return plain;
    } catch (err) {
        console.error('Encrypted storage error:', err);
        return fallbackValue;
    }
}

async function setEncryptedItem(storageKey, value) {
    const payload = await encryptJson(value);
    localStorage.setItem(storageKey, JSON.stringify(payload));
}

async function fetchRegistrationsFromGitHub() {
    return getEncryptedItem('registrations', []);
}

function displayRegistrations(registrations) {
    const list = document.getElementById('registrationsList');
    if (!list) return;

    clearElement(list);

    if (registrations.length === 0) {
        const empty = document.createElement('p');
        empty.style.padding = '20px';
        empty.style.textAlign = 'center';
        setText(empty, t('registrationsEmpty'));
        list.appendChild(empty);
        return;
    }

    registrations.forEach((reg) => {
        const item = document.createElement('div');
        item.className = 'registration-item';

        const photo = document.createElement('div');
        photo.className = 'registration-photo';
        setText(photo, '👤');

        const info = document.createElement('div');
        info.className = 'registration-info';

        const name = document.createElement('strong');
        setText(name, reg.name);
        info.appendChild(name);

        const phone = document.createElement('small');
        setText(phone, reg.phone || '-');
        info.appendChild(phone);

        if (reg.phone) {
            const status = reg.phoneVerified ? t('phoneVerifiedLabel') : t('phoneUnverifiedLabel');
            const statusLine = document.createElement('small');
            setText(statusLine, status);
            info.appendChild(statusLine);
        }

        if (reg.eventName) {
            const eventLine = document.createElement('small');
            setText(eventLine, `${t('registrationEvent')} ${reg.eventName}`);
            info.appendChild(eventLine);
        }

        const registeredAt = document.createElement('small');
        setText(registeredAt, `${t('registeredAt')} ${new Date(reg.timestamp).toLocaleString(getLocale())}`);
        info.appendChild(registeredAt);

        const attendance = document.createElement('small');
        attendance.style.color = '#07c';
        attendance.style.fontWeight = 'bold';
        setText(attendance, `Attendance: ${reg.attendanceCount || 0} times`);
        info.appendChild(attendance);

        const actions = document.createElement('div');
        actions.className = 'registration-actions';

        if (reg.userId && reg.phone && !reg.phoneVerified) {
            actions.appendChild(
                createActionButton(
                    t('verifyPhoneButton'),
                    'btn btn-primary',
                    'Verify phone',
                    () => verifyUserPhone(reg.userId)
                )
            );
        }

        actions.appendChild(
            createActionButton(
                '✓ Attended',
                'btn btn-primary',
                'Mark attendance for today',
                () => recordAttendance(reg.id)
            )
        );

        actions.appendChild(
            createActionButton(
                '✎',
                'btn btn-secondary',
                'Edit registration',
                () => editRegistration(reg.id)
            )
        );

        actions.appendChild(
            createActionButton(
                '✕',
                'btn btn-danger',
                'Delete registration',
                () => deleteRegistration(reg.id)
            )
        );

        item.appendChild(photo);
        item.appendChild(info);
        item.appendChild(actions);
        list.appendChild(item);
    });
}

function filterRegistrations() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const eventFilter = document.getElementById('eventFilterSelect').value;
    
    const filtered = ADMIN_STATE.registrations.filter(reg => {
        const phone = reg.phone ? reg.phone.toLowerCase() : '';
        const matchesSearch = reg.name.toLowerCase().includes(search) || phone.includes(search);
        return matchesSearch;
    });
    
    displayRegistrations(filtered);
}

function updateEventFilter() {
    const select = document.getElementById('eventFilterSelect');
    if (!select) return;
    clearElement(select);
    const option = document.createElement('option');
    option.value = '';
    setText(option, t('filterAll'));
    select.appendChild(option);
}

function editRegistration(id) {
    const reg = ADMIN_STATE.registrations.find(r => r.id === id);
    if (!reg) return;
    
    // TODO: Implement edit modal
    console.log('Edit registration:', reg);
}

async function verifyUserPhone(userId) {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    const user = users.find(u => u.id === userId);

    if (!user) {
        alert(t('phoneVerifyUserMissing'));
        return;
    }

    const displayName = user.fullName || user.email;

    if (!user.phone) {
        alert(t('phoneVerifyMissingPhone'));
        return;
    }

    if (user.phoneVerified) {
        alert(t('phoneAlreadyVerified', { name: displayName }));
        return;
    }

    if (!confirm(t('verifyPhoneConfirm', { name: displayName }))) {
        return;
    }

    const verifiedAt = new Date().toISOString();
    user.phoneVerified = true;
    user.phoneVerifiedAt = verifiedAt;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_STORAGE_KEY) || 'null');
    if (currentUser && currentUser.id === user.id) {
        currentUser.phoneVerified = true;
        currentUser.phoneVerifiedAt = verifiedAt;
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));
    }

    ADMIN_STATE.registrations = ADMIN_STATE.registrations.map(reg => {
        if (reg.userId === user.id) {
            return { ...reg, phoneVerified: true };
        }
        return reg;
    });
    await setEncryptedItem('registrations', ADMIN_STATE.registrations);
    displayRegistrations(ADMIN_STATE.registrations);
    alert(t('phoneVerifiedSuccess', { name: displayName }));
}

async function recordAttendance(id) {
    const reg = ADMIN_STATE.registrations.find(r => r.id === id);
    if (!reg) return;

    // Initialize attendance data if not present
    if (!reg.attendances) {
        reg.attendances = [];
    }
    if (reg.attendanceCount === undefined) {
        reg.attendanceCount = 0;
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Check if already marked for today
    const alreadyMarked = reg.attendances.some(att => att.date === today);
    
    if (alreadyMarked) {
        alert(t('alreadyMarkedToday', { name: reg.name }));
        return;
    }

    // Record attendance
    reg.attendances.push({
        date: today,
        timestamp: new Date().toISOString(),
        eventId: reg.eventId,
        eventName: reg.eventName
    });
    
    reg.attendanceCount = (reg.attendanceCount || 0) + 1;

    // Update in storage
    try {
        await setEncryptedItem('registrations', ADMIN_STATE.registrations);
        loadRegistrations(); // Refresh display
        const message = t('attendanceRecorded', { name: reg.name }) + '\n' + 
                       t('attendanceTimes', { count: reg.attendanceCount });
        alert(message);
    } catch (err) {
        alert('Error recording attendance: ' + err.message);
    }
}

async function deleteRegistration(id) {
    if (!confirm(t('deleteRegistrationConfirm'))) return;
    
    try {
        // TODO: Implement deletion from GitHub
        ADMIN_STATE.registrations = ADMIN_STATE.registrations.filter(r => r.id !== id);
        await setEncryptedItem('registrations', ADMIN_STATE.registrations);
        displayRegistrations(ADMIN_STATE.registrations);
    } catch (err) {
        alert(t('deleteError', { message: err.message }));
    }
}

function exportToCSV() {
    if (ADMIN_STATE.registrations.length === 0) {
        alert(t('exportNoData'));
        return;
    }
    
    // English headers always
    const headers = ['ID', 'Name', 'Phone', 'Time', 'Event', 'Attendance Count'];
    const rows = ADMIN_STATE.registrations.map(reg => [
        reg.id,
        reg.name,
        reg.phone || '',
        new Date(reg.timestamp).toLocaleString('en-US'),
        reg.eventName || '',
        reg.attendanceCount || 0
    ]);
    
    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `registrations_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// ============================================================================
// EVENTS MANAGEMENT
// ============================================================================

function setupEventForm() {
    const form = document.getElementById('eventForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const eventData = {
            id: `webinar_${Date.now()}`,
            name: document.getElementById('eventName').value,
            type: document.getElementById('eventType').value,
            start: document.getElementById('eventStart').value,
            end: document.getElementById('eventEnd').value,
            days: Array.from(document.querySelectorAll('input[name="day"]:checked'))
                   .map(cb => parseInt(cb.value)),
            created: new Date().toISOString()
        };
        
        try {
            await saveEventToGitHub(eventData);
            ADMIN_STATE.events.push(eventData);
            form.reset();
            loadEvents();
        } catch (err) {
            alert(t('saveEventError', { message: err.message }));
        }
    });
}

async function loadEvents() {
    try {
        const events = await fetchEventsFromGitHub();
        ADMIN_STATE.events = events;
        displayEvents(events);
    } catch (err) {
        console.error('Error loading events:', err);
        const list = document.getElementById('eventsList');
        if (list) {
            clearElement(list);
            const p = document.createElement('p');
            setText(p, t('eventsLoadError'));
            list.appendChild(p);
        }
    }
}

async function fetchEventsFromGitHub() {
    const storedEvents = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (storedEvents) {
        try {
            const parsedEvents = JSON.parse(storedEvents);
            if (Array.isArray(parsedEvents) && parsedEvents.length > 0) {
                return parsedEvents;
            }
        } catch (err) {
            console.error('Error parsing local events:', err);
        }
    }

    const response = await fetch('/events.json');
    if (!response.ok) {
        throw new Error('Не удалось загрузить события');
    }
    return await response.json();
}

function displayEvents(events) {
    const list = document.getElementById('eventsList');
    if (!list) return;

    clearElement(list);

    if (events.length === 0) {
        const empty = document.createElement('p');
        setText(empty, t('eventsEmpty'));
        list.appendChild(empty);
        return;
    }

    events.forEach((event) => {
        const card = document.createElement('div');
        card.className = 'event-card';

        const title = document.createElement('h4');
        setText(title, event.name);
        card.appendChild(title);

        const idLine = document.createElement('p');
        const idLabel = document.createElement('strong');
        setText(idLabel, t('eventCardId'));
        idLine.appendChild(idLabel);
        idLine.appendChild(document.createTextNode(` ${sanitizeText(event.id)}`));
        card.appendChild(idLine);

        const typeLine = document.createElement('p');
        const typeLabel = document.createElement('strong');
        setText(typeLabel, t('eventCardType'));
        typeLine.appendChild(typeLabel);
        typeLine.appendChild(document.createTextNode(` ${sanitizeText(event.type)}`));
        card.appendChild(typeLine);

        const timeLine = document.createElement('p');
        const timeLabel = document.createElement('strong');
        setText(timeLabel, t('eventCardTime'));
        timeLine.appendChild(timeLabel);
        timeLine.appendChild(document.createTextNode(` ${sanitizeText(event.start)} - ${sanitizeText(event.end)}`));
        card.appendChild(timeLine);

        if (event.days) {
            const daysLine = document.createElement('p');
            const daysLabel = document.createElement('strong');
            setText(daysLabel, t('eventCardDays'));
            daysLine.appendChild(daysLabel);
            daysLine.appendChild(document.createTextNode(` ${sanitizeText(event.days.join(', '))}`));
            card.appendChild(daysLine);
        }

        const actions = document.createElement('div');
        actions.className = 'event-card-actions';
        actions.appendChild(
            createActionButton(t('eventEdit'), 'btn btn-secondary', 'Edit event', () => editEvent(event.id))
        );
        actions.appendChild(
            createActionButton(t('eventDelete'), 'btn btn-danger', 'Delete event', () => deleteEvent(event.id))
        );
        card.appendChild(actions);

        list.appendChild(card);
    });
}

async function saveEventToGitHub(eventData) {
    const storedEvents = localStorage.getItem(EVENTS_STORAGE_KEY);
    const events = storedEvents ? JSON.parse(storedEvents) : [];
    events.push(eventData);
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
}

function editEvent(id) {
    // TODO: Implement event edit
    console.log('Edit event:', id);
}

async function deleteEvent(id) {
    if (!confirm(t('deleteEventConfirm'))) return;
    
    try {
        const storedEvents = localStorage.getItem(EVENTS_STORAGE_KEY);
        const events = storedEvents ? JSON.parse(storedEvents) : [];
        const updatedEvents = events.filter(e => e.id !== id);
        localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(updatedEvents));
        ADMIN_STATE.events = ADMIN_STATE.events.filter(e => e.id !== id);
        displayEvents(ADMIN_STATE.events);
    } catch (err) {
        alert(t('deleteError', { message: err.message }));
    }
}

// ============================================================================
// STATISTICS
// ============================================================================

async function loadStatistics() {
    try {
        const stats = calculateStatistics();
        displayStatistics(stats);
    } catch (err) {
        console.error('Error loading statistics:', err);
        alert(t('statsLoadError'));
    }
}

function calculateStatistics() {
    const total = ADMIN_STATE.registrations.length;
    const attended = ADMIN_STATE.registrations.filter(r => (r.attendanceCount || 0) > 0).length;
    const missed = total - attended;
    
    // Calculate average attendance per person
    const totalAttendances = ADMIN_STATE.registrations.reduce((sum, r) => sum + (r.attendanceCount || 0), 0);
    const avgAttendance = total > 0 ? (totalAttendances / total).toFixed(1) : 0;
    
    return { total, attended, missed, avgRating: avgAttendance };
}

function displayStatistics(stats) {
    setText(document.getElementById('totalRegistrations'), stats.total);
    setText(document.getElementById('attendedCount'), stats.attended);
    setText(document.getElementById('missedCount'), stats.missed);
    setText(document.getElementById('averageRating'), stats.avgRating);
}

// ============================================================================
// SETTINGS
// ============================================================================

function saveSettings() {
    const newPassword = document.getElementById('newPassword').value;
    
    if (newPassword) {
        const newHash = sha256(newPassword);
        localStorage.setItem('admin_password_hash', newHash);
        ADMIN_STATE.passwordHash = newHash;
        alert('✓ ' + t('passwordChanged'));
    } else {
        alert(t('enterNewPassword'));
    }
}

// ============================================================================
// LOGOUT
// ============================================================================

function logout() {
    if (confirm(t('confirmLogout'))) {
        localStorage.removeItem('admin_auth_token');
        ADMIN_STATE.isAuthenticated = false;
        stopAutoRefresh();
        location.reload();
    }
}

function getLocale() {
    if (currentLanguage === 'ru') return 'ru-RU';
    if (currentLanguage === 'en') return 'en-US';
    return 'uk-UA';
}
