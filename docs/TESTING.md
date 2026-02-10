/**
 * TESTING GUIDE - Проверка работы функций Queue App
 * 
 * Откройте консоль браузера (F12) и выполняйте команды по порядку
 */

// ============================================================================
// 1. ФОРМА РЕГИСТРАЦИИ
// ============================================================================

console.log(`
╔═══════════════════════════════════════════════════════════╗
║         ТЕСТИРОВАНИЕ ГЛАВНОЙ СТРАНИЦЫ                     ║
╚═══════════════════════════════════════════════════════════╝

ТЕСТ 1: Проверка событий
Команда: DEBUG.getState()

Ожидание:
✓ events: массив с событиями из events.json
✓ registrations: пустой массив или предыдущие регистрации
✓ stats: объект со статистикой
`);

// Команда 1
window.TEST_EVENTS = function() {
    const state = DEBUG.getState();
    console.log('Events loaded:', state.events.length, state.events);
    console.log('✓ PASS' , state.events.length > 0 ? 'YES' : 'NO');
};

// ============================================================================
// ТЕСТ 2: Регистрация участника
// ============================================================================

console.log(`
ТЕСТ 2: Сохранение регистрации в localStorage
✓ Заполните форму вручную: Имя, Событие
✓ Нажмите кнопку "Зарегистрироваться"
✓ Команда: DEBUG.getState()
✓ Проверьте что registrations.length > 0
`);

window.TEST_REGISTRATION = function() {
    // Симулируем регистрацию программно
    const testData = {
        id: generateUniqueId(),
        name: 'Тестовый пользователь',
        phone: '+7 (999) 111-11-11',
        event: 'webinar_01',
        notes: 'Тестовое примечание',
        photo: null,
        timestamp: new Date().toISOString()
    };
    
    saveRegistration(testData);
    console.log('✓ TEST REGISTRATION SAVED:', testData.id);
    console.log('  Total registrations:', getStoredRegistrations().length);
};

// ============================================================================
// ТЕСТ 3: Статистика
// ============================================================================

console.log(`
ТЕСТ 3: Проверка статистики
Команда: TEST_STATISTICS()
Ожидание:
✓ Данные загружаются из localStorage
✓ Вычисляется общее количество
✓ Разбиение по событиям
`);

window.TEST_STATISTICS = async function() {
    const stats = await getStatistics();
    console.log('Statistics:', stats);
    console.log('✓ Total registrations:', stats.totalRegistrations);
    console.log('✓ By event:', stats.byEvent);
    console.log('✓ Last updated:', new Date(stats.lastUpdated).toLocaleString('ru-RU'));
};

// ============================================================================
// ТЕСТ 4: Камера (если доступна)
// ============================================================================

console.log(`
ТЕСТ 4: Проверка камеры
Команда: TEST_CAMERA()
Ожидание:
✓ Браузер запросит разрешение на доступ к камере
✓ Video элемент должен показать трансляцию
✓ После CTRL+ALT+DEL снимок должен сохраниться
`);

window.TEST_CAMERA = async function() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
        });
        console.log('✓ Camera accessed');
        console.log('  Video tracks:', stream.getVideoTracks().length);
        console.log('  Audio tracks:', stream.getAudioTracks().length);
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop());
    } catch (err) {
        console.error('✗ Camera error:', err.message);
    }
};

// ============================================================================
// ТЕСТ 5: АДМИН-ПАНЕЛЬ
// ============================================================================

console.log(`
╔═══════════════════════════════════════════════════════════╗
║              ТЕСТИРОВАНИЕ АДМИН-ПАНЕЛИ                    ║
╚═══════════════════════════════════════════════════════════╝

ТЕСТ 5: Вход в админку
1. Откройте http://localhost:8080/admin.html
2. Пароль: admin123
3. Команда: DEBUG_ADMIN.getState()

Ожидание:
✓ authenticated: true
✓ registrations и events загружены
`);

// ============================================================================
// ТЕСТ 6: ЭКСПОРТ ДАННЫХ
// ============================================================================

console.log(`
ТЕСТ 6: Экспорт данных
Команда: DEBUG.exportData()
Ожидание:
✓ Вывод всех регистраций
✓ Статистика
✓ События
`);

window.TEST_EXPORT = function() {
    const data = {
        registrations: getStoredRegistrations(),
        stats: JSON.parse(localStorage.getItem('queue_stats') || '{}'),
        events: document.DEBUG.getState?.events || []
    };
    
    console.log('=== EXPORT DATA ===');
    console.log(JSON.stringify(data, null, 2));
    return data;
};

// ============================================================================
// ТЕСТ 7: ОЧИСТКА
// ============================================================================

console.log(`
ТЕСТ 7: Очистка данных
Команда: TEST_CLEAR()
⚠️ ВНИМАНИЕ: Это удалит все данные!
`);

window.TEST_CLEAR = function() {
    if (confirm('Удалить ВСЕ данные?')) {
        localStorage.removeItem('queue_registrations');
        localStorage.removeItem('queue_stats');
        console.log('✓ Data cleared');
        location.reload();
    }
};

// ============================================================================
// СЦЕНАРИЙ ПОЛНОГО ТЕСТИРОВАНИЯ
// ============================================================================

console.log(`
╔═══════════════════════════════════════════════════════════╗
║        ПОЛНЫЙ СЦЕНАРИЙ ТЕСТИРОВАНИЯ                       ║
╚═══════════════════════════════════════════════════════════╝

Выполните в консоли по порядку:

1. TEST_EVENTS()                    // Проверьте события
2. DEBUG.getState()                 // Начальное состояние
3. TEST_REGISTRATION()              // Добавьте тестовую регистрацию
4. TEST_REGISTRATION()              // Еще одну
5. TEST_STATISTICS()                // Проверьте статистику
6. TEST_EXPORT()                    // Экспортируйте данные
7. DEBUG.clearAll()                 // Очистите (опционально)

ПРОВЕРКИ:
✓ События загружаются из events.json
✓ Регистрации сохраняются в localStorage
✓ Статистика обновляется автоматически
✓ Админ-панель показывает все данные
✓ CSV экспорт работает (в админке)
✓ Ошибки обрабатываются корректно
`);

// ============================================================================
// БЫСТРЫЕ ПРОВЕРКИ
// ============================================================================

window.QUICK_CHECK = {
    /**
     * Проверить загруженные события
     */
    events: () => {
        const events = AppState.getEvents();
        console.log(`📅 Events: ${events.length} loaded`);
        events.forEach(e => console.log(`  - ${e.name} (${e.start}-${e.end})`));
        return events;
    },
    
    /**
     * Проверить регистрации
     */
    registrations: () => {
        const regs = getStoredRegistrations();
        console.log(`📋 Registrations: ${regs.length} total`);
        regs.forEach((r, i) => console.log(`  ${i+1}. ${r.name} (${r.event})`));
        return regs;
    },
    
    /**
     * Проверить статистику
     */
    stats: () => {
        const stats = JSON.parse(localStorage.getItem('queue_stats') || '{}');
        console.log(`📊 Stats:`, stats);
        return stats;
    },
    
    /**
     * Проверить хранилище
     */
    storage: () => {
        const registrations = localStorage.getItem('queue_registrations');
        const stats = localStorage.getItem('queue_stats');
        
        console.log('📦 Local Storage:');
        console.log(`  registrations: ${registrations ? registrations.length + ' bytes' : 'empty'}`);
        console.log(`  stats: ${stats ? stats.length + ' bytes' : 'empty'}`);
        
        // Размер хранилища
        let total = (registrations?.length || 0) + (stats?.length || 0);
        console.log(`  Total: ${(total / 1024).toFixed(2)} KB`);
    },
    
    /**
     * Проверить браузер
     */
    browser: () => {
        console.log('🌐 Browser info:');
        console.log(`  localStorage: ${typeof localStorage !== 'undefined' ? 'YES' : 'NO'}`);
        console.log(`  camera: ${navigator.mediaDevices ? 'YES' : 'NO'}`);
        console.log(`  user agent: ${navigator.userAgent.split('/').pop()}`);
    }
};

console.log(`
╔═══════════════════════════════════════════════════════════╗
║              БЫСТРЫЕ ПРОВЕРКИ (QUICK_CHECK)               ║
╚═══════════════════════════════════════════════════════════╝

QUICK_CHECK.events()           - Список событий
QUICK_CHECK.registrations()    - Список регистраций  
QUICK_CHECK.stats()            - Статистика
QUICK_CHECK.storage()          - Размер хранилища
QUICK_CHECK.browser()          - Информация браузера
`);

// Export for easy access
window.TESTING = {
    TEST_EVENTS,
    TEST_REGISTRATION,
    TEST_STATISTICS,
    TEST_CAMERA,
    TEST_EXPORT,
    TEST_CLEAR,
    QUICK_CHECK
};

console.log('✅ Testing suite loaded. Run TESTING.TEST_EVENTS() to start.');
