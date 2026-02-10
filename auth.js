/**
 * Authentication System - Login & Registration
 * Handles user account management with password hashing
 */

// User storage key
const USERS_STORAGE_KEY = 'queue_users';
const CURRENT_USER_STORAGE_KEY = 'current_user';
const USER_SESSION_KEY = 'user_session_token';
const THEME_STORAGE_KEY = 'queue_theme';
const LANG_STORAGE_KEY = 'queue_lang';
const ENC_KEY_STORAGE = 'queue_enc_key';
const ENC_KEY_USER = 'queue_enc_user';

// Translations
const TRANSLATIONS = {
    uk: {
        authTitle: '📋 Queue App',
        authSubtitle: 'Система управління очередю',
        tabLogin: '🔓 Вход',
        tabRegister: '✏️ Регистрация',
        loginTitle: 'Вход в аккаунт',
        registerTitle: 'Создать новый аккаунт',
        labelEmail: 'Email *',
        labelPassword: 'Пароль *',
        labelPasswordConfirm: 'Повторите пароль *',
        labelFullName: 'ФИО *',
        labelPhone: 'Телефон',
        placeholderEmail: 'your@email.com',
        placeholderPassword: 'Введите пароль',
        placeholderPasswordMin: 'Минимум 6 символов',
        placeholderPasswordConfirm: 'Повторите пароль',
        placeholderFullName: 'Ваше полное имя',
        placeholderPhone: '+61 (__) ___-__-__',
        passwordHint: 'Пароль должен содержать минимум 6 символов',
        loginButton: '🔓 Войти',
        registerButton: '✏️ Зарегистрироваться',
        demoTitle: '📌 Demo аккаунты',
        demoDesc: 'Для тестирования используйте:',
        errorEmailExists: 'Этот email уже зарегистрирован',
        errorPasswordMismatch: 'Пароли не совпадают',
        errorInvalidEmail: 'Некорректный email',
        errorWrongPassword: 'Неверный пароль',
        errorUserNotFound: 'Пользователь не найден',
        errorEmptyFields: 'Заполните все обязательные поля',
        errorEncryptionSetup: 'Не удалось подготовить шифрование. Попробуйте снова.',
        successRegistration: '✓ Счет успешно создан! Перейдите на вкладку Вход.',
        successLogin: '✓ Вход выполнен! Переходим к регистрации...',
        themeDark: '🌙 Темна тема',
        themeLight: '☀️ Світла тема'
    },
    ru: {
        authTitle: '📋 Queue App',
        authSubtitle: 'Система управления очередью',
        tabLogin: '🔓 Вход',
        tabRegister: '✏️ Регистрация',
        loginTitle: 'Вход в аккаунт',
        registerTitle: 'Создать новый аккаунт',
        labelEmail: 'Email *',
        labelPassword: 'Пароль *',
        labelPasswordConfirm: 'Повторите пароль *',
        labelFullName: 'ФИО *',
        labelPhone: 'Телефон',
        placeholderEmail: 'your@email.com',
        placeholderPassword: 'Введите пароль',
        placeholderPasswordMin: 'Минимум 6 символов',
        placeholderPasswordConfirm: 'Повторите пароль',
        placeholderFullName: 'Ваше полное имя',
        placeholderPhone: '+61 (__) ___-__-__',
        passwordHint: 'Пароль должен содержать минимум 6 символов',
        loginButton: '🔓 Войти',
        registerButton: '✏️ Зарегистрироваться',
        demoTitle: '📌 Demo аккаунты',
        demoDesc: 'Для тестирования используйте:',
        errorEmailExists: 'Этот email уже зарегистрирован',
        errorPasswordMismatch: 'Пароли не совпадают',
        errorInvalidEmail: 'Некорректный email',
        errorWrongPassword: 'Неверный пароль',
        errorUserNotFound: 'Пользователь не найден',
        errorEmptyFields: 'Заполните все обязательные поля',
        errorEncryptionSetup: 'Не удалось подготовить шифрование. Попробуйте снова.',
        successRegistration: '✓ Счет успешно создан! Перейдите на вкладку Вход.',
        successLogin: '✓ Вход выполнен! Переходим к регистрации...',
        themeDark: '🌙 Темная тема',
        themeLight: '☀️ Светлая тема'
    },
    en: {
        authTitle: '📋 Queue App',
        authSubtitle: 'Queue management system',
        tabLogin: '🔓 Login',
        tabRegister: '✏️ Register',
        loginTitle: 'Sign in to your account',
        registerTitle: 'Create a new account',
        labelEmail: 'Email *',
        labelPassword: 'Password *',
        labelPasswordConfirm: 'Confirm password *',
        labelFullName: 'Full name *',
        labelPhone: 'Phone',
        placeholderEmail: 'your@email.com',
        placeholderPassword: 'Enter password',
        placeholderPasswordMin: 'Minimum 6 characters',
        placeholderPasswordConfirm: 'Repeat password',
        placeholderFullName: 'Your full name',
        placeholderPhone: '+61 (__) ___-__-__',
        passwordHint: 'Password must contain at least 6 characters',
        loginButton: '🔓 Sign in',
        registerButton: '✏️ Register',
        demoTitle: '📌 Demo accounts',
        demoDesc: 'For testing use:',
        errorEmailExists: 'This email is already registered',
        errorPasswordMismatch: 'Passwords do not match',
        errorInvalidEmail: 'Invalid email',
        errorWrongPassword: 'Incorrect password',
        errorUserNotFound: 'User not found',
        errorEmptyFields: 'Please fill in all required fields',
        errorEncryptionSetup: 'Encryption setup failed. Please try again.',
        successRegistration: '✓ Account created successfully! Go to the Login tab.',
        successLogin: '✓ Login successful! Redirecting to registration...',
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
    setupTabs();
    setupLoginForm();
    setupRegisterForm();
    initializeDemoAccount();
    checkExistingSession();
});

// ============================================================================
// THEME MANAGEMENT
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
        toggleBtn.textContent = isDark ? t('themeLight') : t('themeDark');
        toggleBtn.setAttribute('aria-pressed', String(isDark));
    }
}

// ============================================================================
// LANGUAGE MANAGEMENT
// ============================================================================

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
    });
}

function applyLanguage(language) {
    const translations = TRANSLATIONS[language] || TRANSLATIONS.uk;
    document.documentElement.lang = language;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (translations[key]) {
            el.textContent = translations[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[key]) {
            el.setAttribute('placeholder', translations[key]);
        }
    });
}

function t(key) {
    const translations = TRANSLATIONS[currentLanguage] || TRANSLATIONS.uk;
    return translations[key] || TRANSLATIONS.uk[key] || key;
}

// ============================================================================
// TAB NAVIGATION
// ============================================================================

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabs = document.querySelectorAll('.auth-tab');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Deactivate all tabs
            tabButtons.forEach(b => b.classList.remove('active'));
            tabs.forEach(t => t.classList.remove('active'));
            
            // Activate clicked tab
            button.classList.add('active');
            document.getElementById(tabName + 'Tab').classList.add('active');
        });
    });
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

function getAllUsers() {
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
}

function saveUsers(users) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function findUserByEmail(email) {
    const users = getAllUsers();
    return users.find(u => u.email === email.toLowerCase());
}

function createUser(userData) {
    const users = getAllUsers();
    const cryptoSalt = createCryptoSalt();
    
    const newUser = {
        id: 'user_' + Date.now(),
        fullName: userData.fullName,
        email: userData.email.toLowerCase(),
        phone: userData.phone || '',
        phoneVerified: false,
        phoneVerifiedAt: null,
        cryptoSalt,
        passwordHash: sha256(userData.password),
        createdAt: new Date().toISOString(),
        registrations: []
    };
    
    users.push(newUser);
    saveUsers(users);
    return newUser;
}

function createSessionToken(userId) {
    const token = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const sessions = JSON.parse(localStorage.getItem('user_sessions') || '{}');
    sessions[token] = {
        userId: userId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    localStorage.setItem('user_sessions', JSON.stringify(sessions));
    return token;
}

function getCurrentUser() {
    const token = localStorage.getItem(USER_SESSION_KEY);
    if (!token) return null;
    
    const sessions = JSON.parse(localStorage.getItem('user_sessions') || '{}');
    const session = sessions[token];
    
    if (!session) return null;
    
    // Check if session expired
    if (new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem(USER_SESSION_KEY);
        return null;
    }
    
    const users = getAllUsers();
    return users.find(u => u.id === session.userId);
}

function logout() {
    localStorage.removeItem(USER_SESSION_KEY);
    location.reload();
}

function checkExistingSession() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        // Redirect to registration page
        window.location.href = 'index.html';
    }
}

function createCryptoSalt() {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return bytesToBase64(bytes);
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

async function setupEncryptionKey(user, password) {
    let cryptoSalt = user.cryptoSalt;
    if (!cryptoSalt) {
        cryptoSalt = createCryptoSalt();
        user.cryptoSalt = cryptoSalt;
        const users = getAllUsers();
        const updatedUsers = users.map(u => (u.id === user.id ? { ...u, cryptoSalt } : u));
        saveUsers(updatedUsers);
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    }

    const key = await deriveKeyFromPassword(password, base64ToBytes(cryptoSalt));
    const rawKey = await window.crypto.subtle.exportKey('raw', key);
    const keyBytes = new Uint8Array(rawKey);

    sessionStorage.setItem(ENC_KEY_STORAGE, bytesToBase64(keyBytes));
    sessionStorage.setItem(ENC_KEY_USER, user.id);
}

async function deriveKeyFromPassword(password, saltBytes) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: saltBytes,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

// ============================================================================
// LOGIN FORM
// ============================================================================

function setupLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin().catch(() => {
            showLoginError(t('errorEncryptionSetup'));
        });
    });
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Validation
    if (!email || !password) {
        showLoginError(t('errorEmptyFields'));
        return;
    }

    // Find user
    const user = findUserByEmail(email);
    if (!user) {
        showLoginError(t('errorUserNotFound'));
        return;
    }

    // Verify password
    const passwordHash = sha256(password);
    if (passwordHash !== user.passwordHash) {
        showLoginError(t('errorWrongPassword'));
        return;
    }

    // Create session
    const token = createSessionToken(user.id);
    localStorage.setItem(USER_SESSION_KEY, token);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));

    try {
        await setupEncryptionKey(user, password);
    } catch (err) {
        showLoginError(t('errorEncryptionSetup'));
        return;
    }

    showLoginSuccess(t('successLogin'));
    
    // Redirect after 2 seconds
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}

function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    const errorText = document.getElementById('loginErrorText');
    errorText.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showLoginSuccess(message) {
    const successDiv = document.getElementById('loginSuccess');
    const successText = document.getElementById('loginSuccessText');
    successText.textContent = message;
    successDiv.style.display = 'block';
}

// ============================================================================
// REGISTRATION FORM
// ============================================================================

function setupRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleRegistration();
    });
}

function handleRegistration() {
    const fullName = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPassword2').value;

    // Validation
    if (!fullName || !email || !password || !passwordConfirm) {
        showRegisterError(t('errorEmptyFields'));
        return;
    }

    if (password.length < 6) {
        showRegisterError(t('passwordHint'));
        return;
    }

    if (password !== passwordConfirm) {
        showRegisterError(t('errorPasswordMismatch'));
        return;
    }

    if (!isValidEmail(email)) {
        showRegisterError(t('errorInvalidEmail'));
        return;
    }

    if (findUserByEmail(email)) {
        showRegisterError(t('errorEmailExists'));
        return;
    }

    // Create user
    try {
        const newUser = createUser({
            fullName,
            email,
            phone,
            password
        });

        showRegisterSuccess(t('successRegistration'));
        document.getElementById('registerForm').reset();
        
        // Switch to login tab
        setTimeout(() => {
            document.querySelector('[data-tab="login"]').click();
        }, 2000);
    } catch (error) {
        showRegisterError(error.message);
    }
}

function showRegisterError(message) {
    const errorDiv = document.getElementById('registerError');
    const errorText = document.getElementById('registerErrorText');
    errorText.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showRegisterSuccess(message) {
    const successDiv = document.getElementById('registerSuccess');
    const successText = document.getElementById('registerSuccessText');
    successText.textContent = message;
    successDiv.style.display = 'block';
}

// ============================================================================
// UTILITIES
// ============================================================================

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function initializeDemoAccount() {
    const demoEmail = 'demo@example.com';
    
    // Check if demo account exists
    if (findUserByEmail(demoEmail)) {
        return;
    }
    
    // Create demo account
    createUser({
        fullName: 'Demo User',
        email: demoEmail,
        phone: '+61 (0) 000-00-00',
        password: 'demo123'
    });
}
