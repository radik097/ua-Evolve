/**
 * Queue App - JavaScript Logic
 * Handles form submission and user registration
 */

// Authentication & Storage Keys
const USER_SESSION_KEY = 'user_session_token';
const CURRENT_USER_STORAGE_KEY = 'current_user';
const USERS_STORAGE_KEY = 'queue_users';
const THEME_STORAGE_KEY = 'queue_theme';
const LANG_STORAGE_KEY = 'queue_lang';
const EVENTS_STORAGE_KEY = 'admin_events';
const ENC_KEY_STORAGE = 'queue_enc_key';
const ENC_KEY_USER = 'queue_enc_user';

// Configuration
const CONFIG = {
    // GitHub repository configuration
    GITHUB_OWNER: 'radik097',
    GITHUB_REPO: 'ua-Evolve',
    GITHUB_BRANCH: 'main',
    // GITHUB_TOKEN: Now stored in Cloudflare Worker secrets only (never expose in frontend!)
    // GitHub API base URL
    API_BASE: 'https://api.github.com',
    
    // Data directory in the repo
    DATA_DIR: 'data/registrations',

    // Cloudflare Worker integration
    WORKER_URL: 'https://event-worker.ua-evolve.workers.dev',
    WORKER_ROUTE: '/api/github',
    APP_SECRET: 'b55b7a462e42c09307e996316207292b1a59cfbfcefa6899e96136e7cbcb0896'
};

// Current user (populated after authentication check)
let currentUser = null;
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

const TRANSLATIONS = {
    uk: {
        pageTitle: 'Реєстрація',
        headerTitle: '📝 Реєстрація',
        headerSubtitle: 'Заповніть форму',
        labelName: "Ім'я *",
        placeholderName: "Ваше ім'я",
        labelPhone: 'Телефон',
        placeholderPhone: '+61 (__) ___-__-__',
        labelEvent: 'Подія *',
        placeholderEvent: 'Подію не знайдено',
        submitButton: '✓ Зареєструватися',
        successTitle: '✓ Успішно!',
        successText: 'Ви зареєстровані. Номер черги:',
        successBack: 'Повернутися до форми',
        errorTitle: '✗ Помилка',
        statsTitle: '📊 Статистика реєстрацій',
        statsLoading: 'Завантаження...',
        statsTotal: '📊 Всього зареєстровано:',
        adminLink: '🔐 Адмін-панель',
        errorRequiredName: "Заповніть обов'язкове поле (Ім'я)",
        errorRequiredEvent: 'Подію не знайдено. Перевірте посилання.',
        eventLoadError: '❌ Не вдалося завантажити події',
        statsLoadError: '❌ Помилка завантаження статистики',
        errorWorkerSubmit: '❌ Помилка відправки. Спробуйте ще раз.',
        themeDark: '🌙 Темна тема',
        themeLight: '☀️ Світла тема',
        logoutButton: '🚪 Вихід',
        userGreeting: 'Привіт,'
    },
    ru: {
        pageTitle: 'Регистрация',
        headerTitle: '📝 Регистрация',
        headerSubtitle: 'Заполните форму',
        labelName: 'Имя *',
        placeholderName: 'Ваше имя',
        labelPhone: 'Телефон',
        placeholderPhone: '+61 (__) ___-__-__',
        labelEvent: 'Событие *',
        placeholderEvent: 'Событие не найдено',
        submitButton: '✓ Зарегистрироваться',
        successTitle: '✓ Успешно!',
        successText: 'Вы зарегистрированы. Номер очереди:',
        successBack: 'Вернуться к форме',
        errorTitle: '✗ Ошибка',
        statsTitle: '📊 Статистика регистраций',
        statsLoading: 'Загрузка...',
        statsTotal: '📊 Всего зарегистрировано:',
        adminLink: '🔐 Админ-панель',
        errorRequiredName: 'Заполните обязательное поле (Имя)',
        errorRequiredEvent: 'Событие не найдено. Проверьте ссылку.',
        eventLoadError: '❌ Не удалось загрузить события',
        statsLoadError: '❌ Ошибка загрузки статистики',
        errorWorkerSubmit: '❌ Ошибка отправки. Попробуйте еще раз.',
        themeDark: '🌙 Темная тема',
        themeLight: '☀️ Светлая тема',
        logoutButton: '🚪 Выход',
        userGreeting: 'Привет,'
    },
    en: {
        pageTitle: 'Registration',
        headerTitle: '📝 Registration',
        headerSubtitle: 'Fill out the form',
        labelName: 'Name *',
        placeholderName: 'Your name',
        labelPhone: 'Phone',
        placeholderPhone: '+61 (__) ___-__-__',
        labelEvent: 'Event *',
        placeholderEvent: 'Event not found',
        submitButton: '✓ Register',
        successTitle: '✓ Success!',
        successText: 'You are registered. Queue number:',
        successBack: 'Back to form',
        errorTitle: '✗ Error',
        statsTitle: '📊 Registration stats',
        statsLoading: 'Loading...',
        statsTotal: '📊 Total registered:',
        adminLink: '🔐 Admin panel',
        errorRequiredName: 'Please fill in the required field (Name)',
        errorRequiredEvent: 'Event not found. Check the link.',
        eventLoadError: '❌ Failed to load events',
        statsLoadError: '❌ Failed to load statistics',
        errorWorkerSubmit: '❌ Submission failed. Please try again.',
        themeDark: '🌙 Dark theme',
        themeLight: '☀️ Light theme',
        logoutButton: '🚪 Logout',
        userGreeting: 'Hello,'
    }
};

let currentLanguage = 'uk';
let eventsCache = [];
let selectedEvent = null;

// State

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication status first
    const authOk = await checkAuthOnLoad();
    if (!authOk) return;
    
    // Setup UI
    setupLanguageToggle();
    setupThemeToggle();
    setupLogoutButton();
    
    // Load data
    await loadEvents();
    await populateEventSelect();
    setupFormListeners();
    await loadQueueStats();
});

// ============================================================================
// AUTHENTICATION
// ============================================================================

async function checkAuthOnLoad() {
    const token = localStorage.getItem(USER_SESSION_KEY);
    if (!token) {
        // Not authenticated, redirect to auth page
        window.location.href = 'auth.html';
        return false;
    }
    
    // Get current user from localStorage
    currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_STORAGE_KEY));
    
    // Validate session is still valid (check in auth.js)
    if (!currentUser) {
        // Session expired or invalid
        localStorage.removeItem(USER_SESSION_KEY);
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
        window.location.href = 'auth.html';
        return false;
    }

    const keyReady = await loadEncryptionKey();
    if (!keyReady) {
        clearSessionAndRedirect();
        return false;
    }
    
    // Display user info in header
    const userEmail = currentUser.email;
    const userFullName = currentUser.fullName;
    
    // Show user info and hide it only if needed
    const userInfo = document.getElementById('userInfo');
    const userEmailSpan = document.getElementById('userEmail');
    
    if (userInfo && userEmailSpan) {
        setText(userEmailSpan, userEmail);
        userInfo.style.display = 'flex';
    }

    applyProfileToForm();
    return true;
}

function clearSessionAndRedirect() {
    localStorage.removeItem(USER_SESSION_KEY);
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    sessionStorage.removeItem(ENC_KEY_STORAGE);
    sessionStorage.removeItem(ENC_KEY_USER);
    window.location.href = 'auth.html';
}

function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        setText(logoutBtn, t('logoutButton'));
        logoutBtn.addEventListener('click', () => {
            // Clear session
            localStorage.removeItem(USER_SESSION_KEY);
            localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
            sessionStorage.removeItem(ENC_KEY_STORAGE);
            sessionStorage.removeItem(ENC_KEY_USER);
            
            // Redirect to auth page
            window.location.href = 'auth.html';
        });
    }
}

async function loadEncryptionKey() {
    if (!currentUser) return false;

    const keyB64 = sessionStorage.getItem(ENC_KEY_STORAGE);
    const keyUser = sessionStorage.getItem(ENC_KEY_USER);
    if (!keyB64 || keyUser !== currentUser.id) {
        return false;
    }

    const keyBytes = base64ToBytes(keyB64);
    encryptionKey = await window.crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );

    return true;
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
    if (!encryptionKey) {
        throw new Error('Missing encryption key');
    }

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(value));
    const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        encryptionKey,
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
    if (!encryptionKey) {
        throw new Error('Missing encryption key');
    }

    const iv = base64ToBytes(payload.iv);
    const data = base64ToBytes(payload.data);
    const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        encryptionKey,
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

// ============================================================================
// FORM SUBMISSION
// ============================================================================

function setupFormListeners() {
    const form = document.getElementById('registrationForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            // Collect form data
            const formData = new FormData(form);
            const data = {
                id: generateId(),
                name: formData.get('name'),
                phone: formData.get('phone') || '',
                eventId: selectedEvent ? selectedEvent.id : '',
                eventName: selectedEvent ? selectedEvent.name : '',
                timestamp: new Date().toISOString(),
                attendances: [],
                attendanceCount: 0,
                userAgent: navigator.userAgent,
                phoneVerified: currentUser ? !!currentUser.phoneVerified : false
            };

            // Link registration to current user
            if (currentUser) {
                data.userId = currentUser.id;
                data.userEmail = currentUser.email;
            }

            // Validate
            if (!data.name) {
                throw new Error(t('errorRequiredName'));
            }

            if (!selectedEvent) {
                throw new Error(t('errorRequiredEvent'));
            }

            // Save to local storage for demo
            const registrations = await getEncryptedItem('registrations', []);
            registrations.push(data);
            await setEncryptedItem('registrations', registrations);
            
            // Update stats
            await updateStats(registrations);

            await submitToWorker({
                type: 'register',
                data
            }, registrations);
            
            // Option 2: Direct GitHub API (UNSAFE - for demo only)
            // Uncomment only for local testing
            // await submitToGitHub(data);

            // Show success
            showSuccess(data.id);
            form.reset();
            applyProfileToForm();
            await loadQueueStats();

        } catch (err) {
            showError(err.message);
        }
    });
}

function applyProfileToForm() {
    if (!currentUser) return;

    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');

    if (nameInput) {
        const fullName = (currentUser.fullName || '').trim();
        if (fullName) {
            lockInputWithValue(nameInput, fullName);
        }
    }

    if (phoneInput) {
        const phone = (currentUser.phone || '').trim();
        if (phone) {
            lockInputWithValue(phoneInput, phone);
        }
    }
}

function lockInputWithValue(input, value) {
    input.value = value;
    input.readOnly = true;
    input.setAttribute('aria-readonly', 'true');
    input.classList.add('field-locked');
}

// ============================================================================
// EVENTS
// ============================================================================

async function loadEvents() {
    const storedEvents = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (storedEvents) {
        try {
            const parsedEvents = JSON.parse(storedEvents);
            if (Array.isArray(parsedEvents) && parsedEvents.length > 0) {
                eventsCache = parsedEvents;
                return;
            }
        } catch (err) {
            console.error('Error parsing local events:', err);
        }
    }

    try {
        const response = await fetch('/events.json');
        if (!response.ok) {
            throw new Error('Failed to fetch events');
        }
        eventsCache = await response.json();
    } catch (err) {
        console.error('Error loading events:', err);
        showError(t('eventLoadError'));
        eventsCache = [];
    }
}

async function populateEventSelect() {
    const eventSelect = document.getElementById('eventSelect');
    const eventIdInput = document.getElementById('eventId');
    if (!eventSelect || !eventIdInput) return;

    // Clear existing options except the placeholder
    clearElement(eventSelect);
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    setText(placeholderOption, '-- Select an event --');
    eventSelect.appendChild(placeholderOption);

    // Add all available events as options
    if (eventsCache && eventsCache.length > 0) {
        eventsCache.forEach(event => {
            const option = document.createElement('option');
            option.value = event.id;
            setText(option, event.name);
            eventSelect.appendChild(option);
        });
        setSubmitEnabled(true);
    } else {
        setSubmitEnabled(false);
    }

    // Handle URL parameter pre-selection
    const urlParams = new URLSearchParams(window.location.search);
    const eventParam = urlParams.get('event');

    if (eventParam) {
        if (/^\d+$/.test(eventParam)) {
            const index = Number(eventParam) - 1;
            if (eventsCache[index]) {
                eventSelect.value = eventsCache[index].id;
                selectedEvent = eventsCache[index];
            }
        } else {
            const found = eventsCache.find(e => e.id === eventParam);
            if (found) {
                eventSelect.value = found.id;
                selectedEvent = found;
            }
        }
    }

    // Listen for selection changes
    eventSelect.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        selectedEvent = eventsCache.find(event => event.id === selectedId) || null;
        eventIdInput.value = selectedEvent ? selectedEvent.id : '';
        setSubmitEnabled(!!selectedEvent);
    });
}

function setSubmitEnabled(enabled) {
    const submitBtn = document.querySelector('#registrationForm .btn-submit');
    if (submitBtn) {
        submitBtn.disabled = !enabled;
    }
}

// ============================================================================
// DATA SUBMISSION
// ============================================================================

/**
 * SAFE: Send data to backend webhook
 * The backend handles GitHub authentication securely
 */
async function submitToBackend(data) {
    const response = await fetch('https://your-backend.com/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
    }

    return await response.json();
}

async function submitToWorker(payload, registrations) {
    if (!isWorkerConfigured()) {
        return;
    }

    const requestPayload = {
        type: payload.type,
        data: payload.data,
        timestamp: Date.now()
    };

    const signature = await computeHmacSignature(requestPayload, CONFIG.APP_SECRET);
    const signedPayload = { ...requestPayload, signature };
    const workerUrl = `${CONFIG.WORKER_URL}${CONFIG.WORKER_ROUTE}`;

    try {
        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(signedPayload)
        });

        if (!response.ok) {
            throw new Error(`Worker error: ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        if (Array.isArray(registrations)) {
            registrations.pop();
            await setEncryptedItem('registrations', registrations);
            await updateStats(registrations);
        }
        throw new Error(t('errorWorkerSubmit'));
    }
}

function isWorkerConfigured() {
    return CONFIG.WORKER_URL && CONFIG.APP_SECRET;
}

async function computeHmacSignature(payload, secret) {
    const enc = new TextEncoder();
    const key = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const payloadBytes = enc.encode(JSON.stringify(payload));
    const signature = await window.crypto.subtle.sign('HMAC', key, payloadBytes);
    return bytesToHex(new Uint8Array(signature));
}

function bytesToHex(bytes) {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * UNSAFE: Direct GitHub API submission
 * ⚠️ ONLY for local testing! Never expose this in production!
 * Requires GitHub Personal Access Token in localStorage during development
 */
async function submitToGitHub(data) {
    const token = localStorage.getItem('github_token');
    
    if (!token) {
        throw new Error('GitHub token не найден. Используйте submitToBackend() в продакшене.');
    }

    const filename = `${CONFIG.DATA_DIR}/${data.id}.json`;
    const content = JSON.stringify(data, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(content)));

    // Get current file SHA (if exists)
    let sha = null;
    try {
        const checkResponse = await fetch(
            `${CONFIG.API_BASE}/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${filename}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (checkResponse.ok) {
            const fileData = await checkResponse.json();
            sha = fileData.sha;
        }
    } catch (e) {
        // File doesn't exist yet, continue
    }

    // Create or update file
    const response = await fetch(
        `${CONFIG.API_BASE}/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${filename}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Register: ${data.name}`,
                content: encodedContent,
                branch: CONFIG.GITHUB_BRANCH,
                ...(sha && { sha })
            })
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`GitHub API error: ${error.message}`);
    }

    return await response.json();
}

// ============================================================================
// QUEUE STATISTICS
// ============================================================================

/**
 * Load and display queue statistics
 */
async function loadQueueStats() {
    try {
        const stats = await fetchQueueData();
        displayQueueStats(stats);
    } catch (err) {
        console.error('Error loading stats:', err);
        const statsEl = document.getElementById('queueStats');
        if (statsEl) {
            setText(statsEl, t('statsLoadError'));
        }
    }
}

/**
 * Fetch registration data from local storage or stats.json
 */
async function fetchQueueData() {
    const localStats = await getEncryptedItem('stats', null);
    if (localStats) {
        return localStats;
    }

    try {
        const response = await fetch('/stats.json');
        if (!response.ok) {
            // stats.json doesn't exist yet, return default
            return { totalRegistrations: 0 };
        }
        return await response.json();
    } catch (err) {
        console.warn('Stats file not found, using default:', err);
        return { totalRegistrations: 0 };
    }
}

/**
 * Display queue statistics
 */
function displayQueueStats(stats) {
    const statsDiv = document.getElementById('queueStats');
    if (!statsDiv) return;
    const total = stats.total || stats.totalRegistrations || 0;

    clearElement(statsDiv);
    const wrapper = document.createElement('div');
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    setText(strong, t('statsTotal'));
    p.appendChild(strong);
    p.appendChild(document.createTextNode(` ${sanitizeText(String(total))}`));
    wrapper.appendChild(p);
    statsDiv.appendChild(wrapper);
}

async function updateStats(registrations) {
    const total = registrations.length;
    await setEncryptedItem('stats', {
        totalRegistrations: total,
        lastUpdated: new Date().toISOString()
    });
}

// ============================================================================
// UI HELPERS
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
        loadQueueStats();
    });
}

function applyLanguage(language) {
    const translations = TRANSLATIONS[language] || TRANSLATIONS.uk;

    document.documentElement.lang = language;
    document.title = sanitizeText(translations.pageTitle);

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

function t(key) {
    const translations = TRANSLATIONS[currentLanguage] || TRANSLATIONS.uk;
    return translations[key] || TRANSLATIONS.uk[key] || key;
}

function showSuccess(userId) {
    document.getElementById('registrationForm').style.display = 'none';
    document.getElementById('successMessage').style.display = 'block';
    setText(document.getElementById('queueNumber'), userId);
}

function showError(message) {
    document.getElementById('errorMessage').style.display = 'block';
    setText(document.getElementById('errorText'), message);
    
    setTimeout(() => {
        document.getElementById('errorMessage').style.display = 'none';
    }, 5000);
}

function generateId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
