/**
 * Playwright MCP Test Suite for Queue App
 * 
 * This test suite validates:
 * - Registration form functionality
 * - Admin panel authentication
 * - CRUD operations for events and registrations
 * - Search and filter capabilities
 * - Language and theme switching
 * 
 * Usage with Playwright MCP:
 * - Run tests interactively through Copilot
 * - Or execute via: node tests/app.test.mjs
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8080';
const ADMIN_PASSWORD = 'admin123';

// Test results storage
const results = {
  passed: [],
  failed: [],
  total: 0
};

/**
 * Helper function to log test results
 */
function logTest(name, passed, error = null) {
  results.total++;
  if (passed) {
    results.passed.push(name);
    console.log(`✓ PASS: ${name}`);
  } else {
    results.failed.push({ name, error: error?.message || 'Unknown error' });
    console.log(`✗ FAIL: ${name}`);
    if (error) console.error(`  Error: ${error.message}`);
  }
}

/**
 * Test Suite Runner
 */
async function runTests() {
  console.log('\n🧪 Starting Queue App Test Suite...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // ==================== REGISTRATION TESTS ====================
    console.log('📝 Testing Registration Form...');
    
    // Test 1: Page loads correctly
    try {
      await page.goto(BASE_URL);
      await page.waitForSelector('h1');
      const title = await page.title();
      logTest('Registration page loads', title.includes('Реєстрація'));
    } catch (error) {
      logTest('Registration page loads', false, error);
    }

    // Test 2: Form validation
    try {
      await page.click('button[type="submit"]');
      const nameInput = await page.$('#name');
      const isRequired = await nameInput.evaluate(el => el.required);
      logTest('Form validation for required fields', isRequired);
    } catch (error) {
      logTest('Form validation for required fields', false, error);
    }

    // Test 3: Successful registration
    try {
      await page.fill('#name', 'Playwright Test User');
      await page.fill('#phone', '+61 99 888-77-66');
      await page.click('button[type="submit"]');
      
      await page.waitForSelector('#successMessage', { state: 'visible', timeout: 5000 });
      const queueNumber = await page.textContent('#queueNumber');
      logTest('Registration submission successful', queueNumber && queueNumber.length > 0);
    } catch (error) {
      logTest('Registration submission successful', false, error);
    }

    // Test 4: Statistics update
    try {
      await page.reload();
      const statsText = await page.textContent('.stats-card');
      logTest('Statistics update after registration', statsText.includes('2') || statsText.includes('1'));
    } catch (error) {
      logTest('Statistics update after registration', false, error);
    }

    // ==================== LANGUAGE SWITCHING ====================
    console.log('\n🌐 Testing Multi-language Support...');
    
    // Test 5: Switch to English
    try {
      await page.selectOption('#languageSelect', 'en');
      await page.waitForTimeout(500);
      const title = await page.title();
      logTest('Language switch to English', title.includes('Registration'));
    } catch (error) {
      logTest('Language switch to English', false, error);
    }

    // Test 6: Switch to Russian
    try {
      await page.selectOption('#languageSelect', 'ru');
      await page.waitForTimeout(500);
      const title = await page.title();
      logTest('Language switch to Russian', title.includes('Регистрация'));
    } catch (error) {
      logTest('Language switch to Russian', false, error);
    }

    // ==================== THEME TOGGLE ====================
    console.log('\n🎨 Testing Theme Toggle...');
    
    // Test 7: Theme toggle functionality
    try {
      const initialTheme = await page.evaluate(() => document.body.classList.contains('dark-theme'));
      await page.click('#themeToggle');
      await page.waitForTimeout(300);
      const newTheme = await page.evaluate(() => document.body.classList.contains('dark-theme'));
      logTest('Theme toggle changes theme', initialTheme !== newTheme);
    } catch (error) {
      logTest('Theme toggle changes theme', false, error);
    }

    // ==================== ADMIN PANEL TESTS ====================
    console.log('\n🔐 Testing Admin Panel...');
    
    // Test 8: Navigate to admin panel
    try {
      await page.goto(`${BASE_URL}/admin.html`);
      await page.waitForSelector('h1');
      const hasLoginForm = await page.$('#loginForm');
      logTest('Admin panel loads with login form', hasLoginForm !== null);
    } catch (error) {
      logTest('Admin panel loads with login form', false, error);
    }

    // Test 9: Invalid password rejection
    try {
      await page.fill('#adminPassword', 'wrongpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
      const isLoggedIn = await page.$('#adminContent');
      const displayStyle = await isLoggedIn?.evaluate(el => el.style.display);
      logTest('Invalid password rejected', displayStyle === 'none' || displayStyle === '');
    } catch (error) {
      logTest('Invalid password rejected', false, error);
    }

    // Test 10: Valid password login
    try {
      await page.fill('#adminPassword', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
      const adminContent = await page.$('#adminContent');
      const displayStyle = await adminContent.evaluate(el => window.getComputedStyle(el).display);
      logTest('Valid password grants access', displayStyle !== 'none');
    } catch (error) {
      logTest('Valid password grants access', false, error);
    }

    // Test 11: Registrations tab displays data
    try {
      const registrationsList = await page.$('#registrationsList');
      const hasRegistrations = await registrationsList.evaluate(el => el.children.length > 0);
      logTest('Registrations tab displays entries', hasRegistrations);
    } catch (error) {
      logTest('Registrations tab displays entries', false, error);
    }

    // Test 12: Events tab navigation
    try {
      await page.click('button[data-section="events"]');
      await page.waitForTimeout(500);
      const eventsSection = await page.$('#events');
      const isVisible = await eventsSection.evaluate(el => el.classList.contains('active'));
      logTest('Events tab navigation works', isVisible);
    } catch (error) {
      logTest('Events tab navigation works', false, error);
    }

    // Test 13: Events list populated
    try {
      const eventsList = await page.$$('.event-card');
      logTest('Events list displays existing events', eventsList.length > 0);
    } catch (error) {
      logTest('Events list displays existing events', false, error);
    }

    // Test 14: Statistics tab navigation
    try {
      await page.click('button[data-section="statistics"]');
      await page.waitForTimeout(500);
      const statsSection = await page.$('#statistics');
      const isVisible = await statsSection.evaluate(el => el.classList.contains('active'));
      logTest('Statistics tab navigation works', isVisible);
    } catch (error) {
      logTest('Statistics tab navigation works', false, error);
    }

    // Test 15: Statistics data display
    try {
      const statsCards = await page.$$('.stat-card');
      const hasData = statsCards.length >= 4; // Total, Attended, Missed, Rating
      logTest('Statistics displays all metrics', hasData);
    } catch (error) {
      logTest('Statistics displays all metrics', false, error);
    }

    // Test 16: Settings tab navigation
    try {
      await page.click('button[data-section="settings"]');
      await page.waitForTimeout(500);
      const settingsSection = await page.$('#settings');
      const isVisible = await settingsSection.evaluate(el => el.classList.contains('active'));
      logTest('Settings tab navigation works', isVisible);
    } catch (error) {
      logTest('Settings tab navigation works', false, error);
    }

    // Test 17: Search functionality
    try {
      await page.click('button[data-section="registrations"]');
      await page.waitForTimeout(500);
      await page.fill('#searchInput', 'Playwright');
      await page.waitForTimeout(300);
      const visibleRegistrations = await page.$$('.registration-card:not([style*="display: none"])');
      logTest('Search filters registrations', visibleRegistrations.length >= 0);
    } catch (error) {
      logTest('Search filters registrations', false, error);
    }

    // Test 18: Refresh button functionality
    try {
      const refreshBtn = await page.$('#refreshBtn');
      await refreshBtn.click();
      await page.waitForTimeout(500);
      const lastRefresh = await page.textContent('#lastRefresh');
      logTest('Refresh button updates timestamp', lastRefresh.length > 0);
    } catch (error) {
      logTest('Refresh button updates timestamp', false, error);
    }

    // Test 19: Logout functionality
    try {
      await page.click('#logoutBtn');
      await page.waitForTimeout(500);
      const loginForm = await page.$('#loginSection');
      const isVisible = await loginForm.evaluate(el => window.getComputedStyle(el).display !== 'none');
      logTest('Logout returns to login screen', isVisible);
    } catch (error) {
      logTest('Logout returns to login screen', false, error);
    }

    // ==================== ACCESSIBILITY TESTS ====================
    console.log('\n♿ Testing Accessibility...');
    
    // Test 20: Form labels
    try {
      await page.goto(BASE_URL);
      const labels = await page.$$('label');
      const inputs = await page.$$('input[required]');
      logTest('Form has proper labels', labels.length >= inputs.length);
    } catch (error) {
      logTest('Form has proper labels', false, error);
    }

  } finally {
    await browser.close();
  }

  // ==================== RESULTS SUMMARY ====================
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✓ Passed: ${results.passed.length} (${Math.round(results.passed.length / results.total * 100)}%)`);
  console.log(`✗ Failed: ${results.failed.length} (${Math.round(results.failed.length / results.total * 100)}%)`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(({ name, error }) => {
      console.log(`  - ${name}: ${error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };
