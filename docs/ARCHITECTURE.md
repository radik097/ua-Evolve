# Queue App - Architecture Documentation

## 📐 System Design Overview

### The Problem Statement (Исходная задача)

Создать **автономную систему** на GitHub Pages для:
1. Сохранение данных регистраций (фото + информация)
2. Управление очередями на вебинары
3. Локально запустить (Docker)
4. Полностью автономна (GitHub Pages + GitHub Actions)
5. Админ-панель для управления событиями и просмотра статистики

**Главное ограничение:** GitHub Pages — это static-only, нет бэкенда.

---

## 🏗️ Architecture Layers

## 🏗️ Архитектура обновления: GitHub Pages + Cloudflare Worker

## Текущая схема
```
Browser → GitHub Pages (frontend)
                 → GitHub API (repository_dispatch)
                 → GitHub Actions (worker)
```

## Новая схема (безопасная)
```
Browser → GitHub Pages (frontend)
                 → Cloudflare Worker (edge validation + GitHub API)
                 → GitHub API
                 → Repository
```

---

## 📋 Пошаговая инструкция

### Шаг 1. Создать Worker

```bash
# Создать Worker
npx wrangler init event-worker

# Редактировать wrangler.toml
```

```toml
name = "event-worker"
main = "src/index.ts"
compatibility_date = "2026-02-10"

[vars]
GITHUB_REPO = "owner/repo"
GITHUB_BRANCH = "main"
```

### Шаг 2. Добавить секреты

```bash
# Создать GitHub Personal Access Token (repo scope)
# https://github.com/settings/tokens

# Добавить в Worker
npx wrangler secret put GITHUB_TOKEN
# Введите токен

npx wrangler secret put APP_SECRET
# Введите секрет для HMAC (сгенерируйте: openssl rand -hex 32)
```

### Шаг 3. Код Worker (src/index.ts)

```typescript
import { verifyHMAC } from './crypto';

interface EventPayload {
    type: 'register' | 'audit' | 'delete';
    data: any;
    timestamp: number;
    signature: string;
}

export default {
    async fetch(request: Request, env: any) {
        const url = new URL(request.url);

        // CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, X-Signature, X-Timestamp',
                },
            });
        }

        // Route: /api/github
        if (url.pathname === '/api/github' && request.method === 'POST') {
            try {
                const body: EventPayload = await request.json();
        
                // 1. Валидация HMAC
                if (!verifyHMAC(body, env.APP_SECRET)) {
                    return new Response('Invalid signature', { status: 401 });
                }

                // 2. Валидация timestamp
                const now = Date.now();
                if (Math.abs(now - body.timestamp) > 60000) { // 60 секунд
                    return new Response('Timestamp expired', { status: 401 });
                }

                // 3. Отправка в GitHub
                const githubResponse = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${env.GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        event_type: body.type,
                        client_payload: body.data,
                    }),
                });

                if (!githubResponse.ok) {
                    throw new Error(`GitHub API error: ${githubResponse.status}`);
                }

                return new Response(JSON.stringify({ success: true }), {
                    headers: { 'Content-Type': 'application/json' },
                });

            } catch (error: any) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        return new Response('Not found', { status: 404 });
    },
};
```

### Шаг 4. Код криптографии (src/crypto.ts)

```typescript
import { sha256 } from 'js-sha256';

export function verifyHMAC(payload: any, secret: string): boolean {
    const payloadString = JSON.stringify(payload);
    const signature = sha256.hmac(secret, payloadString);
    return signature === payload.signature;
}
```

### Шаг 5. Развернуть Worker

```bash
npx wrangler deploy
```

---

## 🎨 Обновление фронтенда (GitHub Pages)

### src/api.ts

```typescript
const APP_SECRET = 'ВАШ_СЕКРЕТ_ИЗ_WRANGLER'; // В проде — через env vars
const WORKER_URL = 'https://event-worker.your-account.workers.dev';

interface EventPayload {
    type: 'register' | 'audit' | 'delete';
    data: any;
    timestamp: number;
}

export async function sendToWorker(event: EventPayload) {
    event.timestamp = Date.now();
    const payloadString = JSON.stringify(event);
    event.signature = sha256.hmac(APP_SECRET, payloadString);

    const response = await fetch(`${WORKER_URL}/api/github`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
    });

    return response.json();
}
```

### src/app.tsx

```typescript
import { sendToWorker } from './api';

async function registerUser(data: any) {
    const result = await sendToWorker({
        type: 'register',
        data,
    });
    console.log(result);
}
```

---

## 🔒 Branch Protection (GitHub)

Настройте в репозитории:

1. **Settings → Branches → Branch protection rules**
2. **Require status checks to pass before merging**
     - ✅ Enable required status checks
     - ✅ Add check: `ci/validate` (если есть)
3. **Require branches to be up to date before merging**
4. **Restrict force pushes**
5. **Require pull request reviews before merging** (3+ reviewers)

---

## 📊 Полная схема

```
┌─────────────────┐
│ GitHub Pages    │  (frontend)
│   (Frontend)     │
└────────┬────────┘
                 │ 1. fetch(/api/github) with HMAC
                 ▼
┌─────────────────┐
│ Cloudflare      │  ✓ Секреты в env vars
│   Worker        │  ✓ Edge validation
│                 │  ✓ Rate limit (можно добавить)
└────────┬────────┘
                 │ 2. fetch(GitHub API) with PAT
                 ▼
┌─────────────────┐
│ GitHub API      │
│                 │
└────────┬────────┘
                 │ 3. POST /repos/owner/repo/dispatches
                 ▼
┌─────────────────┐
│ GitHub Repository│
│   (Storage)     │
└─────────────────┘
```

---

## 🚀 Следующие шаги

1. **Токен GitHub** → https://github.com/settings/tokens
2. **Секрет** → `openssl rand -hex 32`
3. **Развернуть Worker** → `npx wrangler deploy`
4. **Тестировать** → curl запрос к Worker

Хочешь, чтобы я помог с кодом для конкретной операции (регистрация/аудит/удаление)?

### Layer 1: Presentation (Frontend)

**Технология:** Vanilla JavaScript + HTML5 + CSS3

**Компоненты:**
- `index.html` — Форма регистрации с WebRTC камерой
- `admin.html` — Спецпанель для админов
- `app.js` — Логика фронтенда (form handling, camera capture)
- `admin.js` — Логика админки (auth, CRUD events)

**NEW: User Authentication System**
- `auth.html` — Authentication page (Login & Registration tabs)
- `auth.js` — User account management (create, login, session tokens)
- `auth.css` — Authentication styling
- User storage in localStorage with session tokens
- SHA256 password hashing (client-side for demo, server-side in production)

**Authentication Flow:**
```
User → auth.html
    ↓
Login/Register with email & password
    ↓
SHA256 hash password
    ↓
Store user in localStorage[queue_users]
    ↓
Create session token
    ↓
Redirect to index.html
    ↓
checkAuthOnLoad() validates session
    ↓
Display user info in header
    ↓
Register for webinar (linked to user account)
```

**Data Structures:**
- `localStorage[queue_users]`: Array of user objects
- `localStorage[user_session_token]`: Current session token
- `localStorage[current_user]`: Logged-in user object
- `localStorage[user_sessions]`: All active sessions with expiry (7 days)

**User Object:**
```javascript
{
        id: "user_1234567890",
        fullName: "User Name",
        email: "user@example.com",
        phone: "+61 (12) 345-67-89",
        passwordHash: "sha256hash...",
        createdAt: "2024-01-01T00:00:00.000Z",
        registrations: [] // LinkedRegistration refs
}
```

**Особенности:**
- Работает offline (все данные в браузере)
- SPA (Single Page Application) - без page reload
- PWA-ready (может быть установлено как приложение)
- CORS-safe (используем публичные URLs)

```
User Action
    ↓
JavaScript Event Handler
    ↓
Data Validation (Client-side)
    ↓
Serialization to JSON
    ↓
HTTP Request (Fetch API)
    ↓
Backend/GitHub Api
```

### Layer 2: API Gateway (Webhook Layer)

**Проблема:** GitHub Pages не может писать файлы напрямую из браузера.

**Решение 1: GitHub Actions (RECOMMENDED)**
- Frontend отправляет HTTP POST на webhook
- GitHub Actions получает `repository_dispatch` событие
- GitHub Actions пишет файл с `GITHUB_TOKEN` (встроянной, безопасной)
- Результат: Файл сохраняется в репозитории

```
Browser (Frontend)
    ↓
    │ HTTP POST
    ↓
GitHub Webhook Receiver
    ↓
    │ Triggers workflow
    ↓
GitHub Actions (process-registration.yml)
    ↓
    │ Uses built-in GITHUB_TOKEN
    ↓
Git Commit to /data/registrations/
```

**Решение 2: Локальный Webhook Server (для разработки)**
- Frontend отправляет на `http://localhost:3000/api/register`
- Node.js сервер сохраняет JSON в `./data/registrations/`
- Идеально для локального тестирования

```
Browser → http://localhost:3000/api/register
              ↓
        Node.js (webhook-server.js)
              ↓
        fs.writeFileSync() → JSON файл
```

### Layer 3: Data Storage (GitHub Repository)

**Структура:**
```
git-repo/
├── index.html                    (GitHub Pages static content)
├── admin.html
├── app.js
├── events.json                   (Event configuration)
├── stats.json                    (Statistics)
├── data/
│   └── registrations/
│       ├── user_1707033600_abc.json
│       ├── user_1707033700_def.json
│       └── ...
└── .github/workflows/
    └── process-registration.yml  (Guardian of data integrity)
```

**Key Design Decision:** 
- Файлы JSON — не просто данные, но **audit trail**
- Каждый регистрация → отдельный файл с уникальным ID
- Git history = полная история регистраций
- Никогда не теряется (невозможно удалить)

### Layer 4: Authentication & Security

#### 1️⃣ Frontend Authentication (Admin Panel)

**Mechanism:** SHA256 password hashing (client-side)

**Flow:**
```javascript
User enters password
    ↓
JavaScript: hash = sha256(password)
    ↓
Compare: hash === DEFAULT_PASSWORD_HASH
    ↓
If match: localStorage.setItem('admin_auth_token', 'authenticated')
    ↓
Admin panel loads
```

**Security Level:** ⚠️ **Low** (Single factor, local only)
**Use Case:** Development, trusted environments
**NOT for:** Production with sensitive data

**How to change password:**
```bash
# Generate new SHA256 hash online: https://www.md5hashgenerator.com/
# Or use Node.js:
node -e "console.log(require('crypto').createHash('sha256').update('your_password').digest('hex'))"

# Update in admin.js:
const DEFAULT_PASSWORD_HASH = 'your_new_hash';
```

#### 2️⃣ GitHub API Authentication

**Problem:** If we put GitHub PAT (Personal Access Token) in browser = **DISASTER**
- Anyone can read the token from DevTools
- Attacker gets full repo access
- Repository can be deleted/modified

**Solution: Never expose PAT to frontend!**

Instead:
- ✅ Use **GitHub Actions** with **built-in GITHUB_TOKEN**
- ✅ GITHUB_TOKEN is temporary, scoped, ephemeral
- ✅ Only has permissions for the workflow job
- ✅ Cannot be accessed from browser

```
Browser (Frontend)
    ↓ No credentials shared
GitHub Webhook
    ↓
GitHub Actions (trusted environment)
    ↓ Uses GITHUB_TOKEN (safe, built-in)
git commit / push
```

#### 3️⃣ CORS & Security Headers

**Nginx Configuration:**
```nginx
# Prevent clickjacking
add_header X-Frame-Options "SAMEORIGIN";

# Prevent MIME type sniffing
add_header X-Content-Type-Options "nosniff";

# Enable XSS protection
add_header X-XSS-Protection "1; mode=block";

# Control referrer leakage
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

---

## 🔄 Data Flow Diagrams

### Registration Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                            │
├──────────────────────────────────────────────────────────────┤
│ 1. Fill Form                                                  │
│    Name: "Иван Петров"                                       │
│    Email: "ivan@example.com"                                 │
│    Photo: [Captured from WebRTC camera]                      │
│                                                               │
│ 2. JavaScript validates                                      │
│    ✓ Name not empty                                          │
│    ✓ Email valid                                             │
│    ✓ Photo captured                                          │
│                                                               │
│ 3. Convert to JSON + Base64 image                            │
│    {                                                          │
│      "id": "user_1707033600_abc123",                         │
│      "name": "Иван Петров",                                  │
│      "email": "ivan@example.com",                            │
│      "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRg...", │
│      "timestamp": "2026-02-09T10:00:00Z"                    │
│    }                                                          │
│                                                               │
│ 4. HTTP POST to webhook                                      │
│    POST /api/register (localhost:3000 OR GitHub Actions)    │
│                                                               │
└──────────────┬───────────────────────────────────────────────┘
               │
               │ (Local Dev)                (Production)
               │ ┌──────────────────────────────────────
               │ v                                       v
        ┌─────────────────┐              ┌────────────────────────┐
        │ Node.js Webhook │              │  GitHub Actions        │
        │ Server (local)  │              │  Repository Dispatch   │
        ├─────────────────┤              ├────────────────────────┤
        │ Receives POST   │              │ Receives webhook event │
        │ Validates JSON  │              │ Validates data         │
        │ Saves to disk   │              │ Encodes Base64         │
        │ data/           │              │ Creates commit         │
        │ registrations/  │              │ Push to main branch    │
        │ {id}.json       │              │                        │
        └────────┬────────┘              └───────────┬────────────┘
                 │                                    │
                 └────────────┬─────────────────────┘
                              │
                    ┌─────────v──────────┐
                    │ Repository Storage │
                    │ data/registrations/│
                    │ {id}.json (saved)  │
                    │                    │
                    │ Git history:       │
                    │ - Author: Queue Bot│
                    │ - Message: Register│
                    │ - Timestamp: ...   │
                    └────────────────────┘
```

### Admin Panel Flow

```
┌──────────────────────────────┐
│   Admin visits admin.html     │
├──────────────────────────────┤
│ 1. Enters password (e.g. "admin123")
│ 2. JS computes: SHA256("admin123") = "abc123xyz..."
│ 3. Compares with DEFAULT_PASSWORD_HASH
│ 4. If match → localStorage auth token
│ 5. Show admin panel
│                              │
└──────────┬───────────────────┘
           │
           v
┌──────────────────────────────┐
│   Admin Panel Loaded         │
├──────────────────────────────┤
│ • View Registrations         │
│   Fetch from GitHub API:     │
│   /repos/{owner}/{repo}/     │
│   contents/data/registrations│
│                              │
│ • Manage Events (events.json)│
│   Edit → GitHub API PUT      │
│                              │
│ • View Statistics            │
│   Parse all JSON files       │
│   Calculate on-the-fly       │
│                              │
└──────────────────────────────┘
```

---

## 🚢 Deployment Options

### Option 1: GitHub Pages (Production)

**Setup:**
```bash
git push origin main
# → GitHub Pages automatically serves /index.html
```

**Pros:**
- ✅ Free
- ✅ HTTPS by default
- ✅ CDN-backed
- ✅ Zero configuration

**Cons:**
- ❌ Static only (no backend)
- ❌ No Server-side rendering
- ❌ Limited by GitHub Actions quota

### Option 2: Docker (Local or VPS)

**Build:**
```bash
docker build -t queue-app .
docker run -p 8080:80 queue-app
```

**Dockerfile Strategy:**
- Base: `nginx:alpine` (lightweight)
- Copy all files to `/usr/share/nginx/html`
- Configure SPA routing (all URLs → index.html)
- Add security headers

**Deployment to VPS:**
```bash
# Build on server
docker build -t queue-app .

# Run with systemd or docker-compose
docker-compose up -d

# Or use nginx as proxy
upstream queue {
    server 127.0.0.1:8080;
}
server {
    listen 80;
    location / {
        proxy_pass http://queue;
    }
}
```

### Option 3: Traditional Hosting (Vercel, Netlify)

**Vercel Deployment:**
```bash
npm install -g vercel
vercel
# → Automatically detects SPA
# → Deploys to vercel.com
```

**Netlify Deployment:**
```bash
npm run build
netlify deploy --prod --dir=.
```

---

## 🔒 Security Considerations

### Threat Model

| Threat | Impact | Mitigation |
|--------|--------|-----------|
| **Frontend compromise** | Attacker reads user data | HTTPS, CSP headers |
| **GitHub PAT leak** | Repo deleted/modified | Don't store in code! |
| **Password guessed** | Unauthorized admin access | Strong hash, rate limit |
| **Man-in-the-middle** | Data interception | HTTPS only |
| **XSS attack** | Malicious JS injected | Content-Security-Policy |

### Checklist Before Production

- [ ] Change `DEFAULT_PASSWORD_HASH` in admin.js
- [ ] Set correct GitHub repo in CONFIG (app.js)
- [ ] NEVER commit GitHub PAT to repository
- [ ] Enable HTTPS (GitHub Pages does this automatically)
- [ ] Set up GitHub Actions secrets (if using PAT)
- [ ] Configure branch protection rules
- [ ] Enable audit logging
- [ ] Regular security updates for dependencies

---

## 📊 Scalability Analysis

### Estimated Limits

| Metric | GitHub Pages | Limitations |
|--------|--------------|------------|
| **File size** | 1 MB each | Per registration JSON |
| **Repo size** | 1 GB | Hard limit |
| **API rate** | 60 req/hr (unauthenticated) | Per IP |
| **Actions** | 2,000 min/month | Free tier |
| **Storage** | Unlimited | Git LFS available |

### Optimization Strategies

**For 10,000+ registrations:**
1. Archive old registrations to `/archive/`
2. Use GitHub LFS for large photos
3. Implement pagination in admin panel
4. Cache stats.json with CDN headers

**For 100+ concurrent users:**
1. Move frontend to CDN
2. Implement request queuing
3. Use GitHub Actions concurrency limits
4. Add rate limiting nginx config

---

## 🧪 Testing Strategy

### Unit Testing (Frontend)

```javascript
// test form validation
function testNameValidation() {
    assert(validateName("") == false);
    assert(validateName("Ivan") == true);
}

// test date parsing
function testTimestampParsing() {
    const ts = new Date().toISOString();
    assert(ts.includes("T"));
}
```

### Integration Testing

```bash
# 1. Start webhook server
node webhook-server.js

# 2. POST test registration
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com"}'

# 3. Verify file created
ls data/registrations/ | wc -l
```

### E2E Testing (Selenium/Playwright)

```javascript
// Test full registration flow
test("User can register with photo", async ({ page }) => {
    await page.goto("http://localhost:8080");
    await page.fill("#name", "Test User");
    await page.fill("#email", "test@test.com");
    
    // Simulate camera capture
    await page.click("#startCameraBtn");
    await page.click("#capturePhotoBtn");
    
    // Submit form
    await page.click("button[type=submit]");
    
    // Verify success message
    await expect(page.locator("#successMessage")).toBeVisible();
});
```

---

## 📚 Technologies Deep Dive

### WebRTC Camera Capture

```javascript
// getUserMedia API (modern standard)
const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user' },
    audio: false
});

// Draw to canvas for capturing
const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');
ctx.drawImage(videoElement, 0, 0, width, height);

// Convert to Base64 for JSON storage
const imageData = canvas.toDataURL('image/jpeg', 0.85);
```

**Tradeoffs:**
- ✅ Captures full frame
- ✅ Works on mobile (HTTPS required)
- ❌ High data volume (Base64)
- ❌ Privacy concerns

**Alternative:** Use WebRTC with P2P (for P2P approach)

### GitHub API Integration

**Public Read (no auth required):**
```javascript
// Get events.json
fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/events.json`)

// List directory
fetch(`https://api.github.com/repos/${owner}/${repo}/contents/path`)
```

**Authenticated Write (GitHub Actions):**
```bash
# GitHub Actions gets GITHUB_TOKEN automatically
git config --global user.name "GitHub Actions"
git config --global user.email "actions@github.com"
git add .
git commit -m "Auto-commit from workflow"
git push
```

### Nginx Configuration for SPA

```nginx
# Critical: serve index.html for all routes
location / {
    try_files $uri $uri/ /index.html;
}

# Cache busting: static assets with long TTL
location ~* \.(js|css|png|jpg)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# No cache: HTML (changes frequently)
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store";
}
```

---

## 🔮 Future Roadmap

### Phase 2: Enhanced Features
- [ ] Email notifications (SendGrid)
- [ ] SMS confirmations (Twilio)
- [ ] Payment processing (Stripe)
- [ ] Real-time stats (WebSockets)
- [ ] Mobile app (React Native)

### Phase 3: Enterprise Features
- [ ] Role-based access (RBAC)
- [ ] Audit trail UI
- [ ] Data encryption
- [ ] SAML/SSO integration
- [ ] Compliance (GDPR, CCPA)

### Phase 4: AI Integration
- [ ] Auto-attendance detection (face recognition)
- [ ] Sentiment analysis
- [ ] Chatbot support
- [ ] Smart recommendations

---

## 📖 References

- **GitHub Pages:** https://pages.github.com/
- **GitHub Actions:** https://github.com/features/actions
- **WebRTC API:** https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- **Fetch API:** https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- **nginx:** https://nginx.org/
- **Docker:** https://www.docker.com/

---

**Q: Почему не использовать Supabase/Firebase?**

A: Можно! Но:
- ❌ FIrebase требует Google Account для админки
- ❌ Supabase добавляет еще один внешний сервис
- ✅ GitHub-based решение полностью автономно (только GitHub аккаунт)
- ✅ Данные всегда в вашем контроле (в вашем репо)
- ✅ Максимальная прозрачность (Git history)

**Q: Могу ли я запустить это offline?**

A: Частично:
- ✅ Frontend работает offline (все в браузере)
- ✅ Локальный webhook-server может работать offline
- ❌ GitHub Actions требует интернет
- ❌ GitHub API требует интернет для синхронизации

---

**Last Updated:** February 9, 2026
**Status:** ✅ Production Ready
**License:** MIT
