# Queue App - Setup & Deployment Guide

## 🚀 Быстрая настройка (5 минут)

### Необходимое ПО
- Git
- Docker (опционально)
- Node.js 18+ (для webhook-server)
- Аккаунт на GitHub

---

## 📋 Сценарий 1: Локальный запуск с Docker

### Шаг 1: Клонировать репозиторий
```bash
git clone https://github.com/YOUR_USERNAME/queue-app.git
cd queue-app
```

### Шаг 2: Запустить Docker Compose
```bash
docker-compose up -d
```

### Шаг 3: Открыть в браузере
```
http://localhost:8080
http://localhost:8080/admin.html (пароль: admin123)
```

### Проверка статуса
```bash
# Посмотреть логи
docker-compose logs -f

# Остановить сервисы
docker-compose down

# Пересобрать образ
docker-compose up -d --build
```

---

## 📋 Сценарий 2: Локальный запуск без Docker

### Требования
- Node.js 18+
- npm или yarn

### Шаг 1: Установить зависимости
```bash
npm install
```

### Шаг 2: Запустить webhook-server
```bash
# Окно 1: Запустить webhook server
npm run start

# Вывод должен быть:
# ╔════════════════════════════╗
# ║  Webhook Server Running    ║
# ║  http://localhost:3000     ║
# ╚════════════════════════════╝
```

### Шаг 3: Запустить веб-сервер
```bash
# Окно 2: В папке queue-app
npm run dev

# Вывод:
# HTTP server is running at http://localhost:8080/
```

### Шаг 4: Открыть в браузере
```
http://localhost:8080
```

---

## 📋 Сценарий 3: Развертывание на GitHub Pages

### Шаг 1: Создать репозиторий

**Опция A: Новый репозиторий**
```bash
# На github.com создать новый репо "queue-app"

# Локально
git init
git add .
git commit -m "Initial commit: Queue App"
git remote add origin https://github.com/YOUR_USERNAME/queue-app.git
git branch -M main
git push -u origin main
```

**Опция B: Fork существующего репо**
```bash
git clone https://github.com/YOUR_USERNAME/queue-app.git
cd queue-app
git push --all
```

### Шаг 2: Включить GitHub Pages

1. На github.com перейти в **Settings**
2. Слева найти **Pages**
3. Выбрать:
   - Branch: `main`
   - Folder: `/ (root)`
4. Нажать **Save**

### Шаг 3: Проверить Actions

1. Перейти на вкладку **Actions**
2. Убедиться что Actions **enabled**
3. Если есть workflow errors — исправить

### Шаг 4: Получить URL

GitHub Pages будет доступен на:
```
https://YOUR_USERNAME.github.io/queue-app
```

Проверьте примерно через 1-2 минуты.

---

## ⚙️ Конфигурация

### Изменить пароль админки

**Генерировать новый SHA256 хеш:**
```bash
# Способ 1: Online
# Посетить https://www.md5hashgenerator.com/
# Select: SHA256
# Enter: ваш_новый_пароль
# Copy hash

# Способ 2: Node.js
node -e "console.log(require('crypto').createHash('sha256').update('ваш_пароль').digest('hex'))"

# Способ 3: Python
python3 -c "import hashlib; print(hashlib.sha256(b'ваш_пароль').hexdigest())"

# Способ 4: Bash (Linux/Mac)
echo -n "ваш_пароль" | sha256sum
```

**Обновить в коде:**

Отредактируйте `admin.js` (строка ~15):
```javascript
// БЫЛО:
const DEFAULT_PASSWORD_HASH = '0192023a7bbd73250516f069df18b500';

// СТАЛО (ВАШ НОВЫЙ ХЕШ):
const DEFAULT_PASSWORD_HASH = 'abc123def456abc123def456abc123de';
```

### Изменить GitHub репозиторий

Отредактируйте `app.js` (строка ~10):
```javascript
const CONFIG = {
    GITHUB_OWNER: 'YOUR_USERNAME',           // ← Ваше имя
    GITHUB_REPO: 'queue-app-data',           // ← Имя репо
    GITHUB_BRANCH: 'main',
    API_BASE: 'https://api.github.com',
    DATA_DIR: 'data/registrations',
};
```

### Добавить свои события

Отредактируйте `events.json`:
```json
[
  {
    "id": "my_webinar_1",
    "name": "Мой первый вебинар",
    "type": "weekly",
    "days": [1, 3, 5],           // Пн, Ср, Пт (0=Пн, 6=Вс)
    "start": "19:00",
    "end": "21:00",
    "maxParticipants": 100
  }
]
```

---

## 🔐 Безопасность

### Обязательные шаги перед продакшеном

1. **Изменить пароль админки**
   ```bash
   # Генерировать новый хеш
   python3 -c "import hashlib; print(hashlib.sha256(b'МЕГА_СИЛЬНЫЙ_ПАРОЛЬ').hexdigest())"
   # Обновить в admin.js
   ```

2. **Не коммитить секреты**
   ```bash
   # .gitignore должен содержать:
   .env
   .env.local
   *.key
   *.pem
   ```

3. **Включить HTTPS**
   - GitHub Pages: автоматически
   - Docker on VPS: используйте nginx + Let's Encrypt
   
   ```bash
   # Пример с certbot
   sudo certbot certonly --standalone -d yourdomain.com
   ```

4. **Обновить branch protection rules**
   - GitHub Settings → Branches
   - Add rule for `main`
   - Require pull request reviews
   - Require status checks to pass

### Защита от распространенных атак

**XSS Protection:**
```javascript
// ✅ Безопасно (текст, а не HTML)
element.textContent = userInput;

// ❌ Опасно
element.innerHTML = userInput;
```

**CSRF Protection:**
- GitHub Actions помогает (требует подтверждения)
- Используйте SameSite cookies

**Rate Limiting:**
```nginx
# В nginx конфиге
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20;
```

---

## 🐛 Troubleshooting

### Problem: Камера не работает
```
Error: NotAllowedError: Permission denied
```

**Решение:**
- Убедитесь что используете **HTTPS** (или localhost)
- Проверьте permissions в браузере
- Для Firefox: о:permissions → Microphone & Camera
- Для Chrome: Settings → Privacy → Camera

### Problem: GitHub API 404
```
Error: Not found (404)
```

**Решение:**
- Проверьте GITHUB_OWNER и GITHUB_REPO в app.js
- Убедитесь что events.json существует в репо
- Проверьте права доступа

### Problem: Docker error "port already in use"
```
Error: bind: address already in use
```

**Решение:**
```bash
# Освободить порт 8080
lsof -ti:8080 | xargs kill -9

# Или используйте другой порт
docker run -p 9090:80 queue-app
```

### Problem: Git push fails after GitHub Actions
```
error: failed to push some refs to origin
```

**Решение:**
```bash
# Может быть конфликт с автоматическими коммитами
git pull --rebase origin main
git push origin main
```

### Problem: Admin panel не загружается
```
Blank page, no console errors
```

**Решение:**
- Проверьте что sha256 библиотека загружена
- Откройте DevTools (F12) → Console
- Проверьте Network tab на 404 ошибок

---

## 📊 Мониторинг и Логирование

### Просмотр логов Docker
```bash
# Все логи
docker-compose logs

# Логи в реальном времени
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs webhook-receiver

# Последние 100 строк
docker-compose logs --tail=100
```

### GitHub Actions логи
1. Перейти на github.com
2. Перейти в репо → Actions
3. Нажать на workflow run
4. Просмотреть логи каждого шага

### Browser DevTools
- **Console:** JavaScript ошибки
- **Network:** API запросы
- **Application:** localStorage, sessionStorage
- **Storage:** Cookies, IndexedDB

---

## ♻️ Обновление и Мейнтенанс

### Обновить код с GitHub
```bash
git pull origin main
docker-compose up -d --build
```

### Бэкап данных
```bash
# Локально
cp -r data/ data_backup_$(date +%Y%m%d)/

# С GitHub
git clone --depth=1 https://github.com/YOUR_USERNAME/queue-app.git queue-app-backup
```

### Очистить старые данные
```bash
# Архивировать регистрации старше 1 года
mkdir -p data/archive/2024
mv data/registrations/*_2024_*.json data/archive/2024/ 2>/dev/null || true

git add .
git commit -m "Archive 2024 registrations"
git push
```

---

## 🚀 Advanced Deployment

### Deployment на Heroku (deprecated, но возможно)
```bash
# Создать Procfile
echo "web: node webhook-server.js" > Procfile

heroku create my-queue-app
git push heroku main
```

### Deployment на DigitalOcean App Platform
```bash
# app.yaml
services:
- name: queue-app
  github:
    repo: YOUR_USERNAME/queue-app
    branch: main
  build_command: npm install
  http_port: 80
  source_dir: /
```

### Deployment на AWS S3 + CloudFront
```bash
# Собрать статику
npm run build

# Загрузить на S3
aws s3 sync . s3://my-bucket/

# Инвалидировать CloudFront cache
aws cloudfront create-invalidation --distribution-id E123 --paths "/*"
```

---

## 📱 Мобильная оптимизация

### Тестировать на телефоне

**Локально:**
```bash
# Узнать IP
ipconfig getifaddr en0

# Запустить сервер
npm run dev

# На телефоне открыть
http://YOUR_IP:8080
```

**Удаленно:**
```bash
# Использовать ngrok (tunnel)
npm install -g ngrok
ngrok http 8080

# Получить уникальный URL, поделиться
# https://abc123.ngrok.io
```

### Mobile-first CSS
- Viewport настройка: ✅ (уже в HTML)
- Responsive images: ✅
- Touch-friendly buttons: ✅ (48x48px minimum)
- Fast loading: ✅ (CSS <50kb)

---

## ✅ Чеклист перед запуском

- [ ] Изменили пароль админки
- [ ] Обновили GITHUB_OWNER и GITHUB_REPO
- [ ] Создали события в events.json
- [ ] Протестировали регистрацию локально
- [ ] Протестировали админ-панель
- [ ] Проверили GitHub Actions работает
- [ ] Включили HTTPS (если на custom домене)
- [ ] Добавили security headers
- [ ] Создали backup данных
- [ ] Написали инструкцию для использования

---

## 📚 Дополнительные ресурсы

- **GitHub Pages Documentation:** https://docs.github.com/en/pages
- **GitHub Actions Documentation:** https://docs.github.com/en/actions
- **Docker Documentation:** https://docs.docker.com/
- **Nginx Documentation:** https://nginx.org/en/docs/
- **WebRTC Guide:** https://webrtc.org/getting-started/overview

---

**Готово!** 🎉

Ваша очередная система полностью автономна и сама себя масштабирует.

Для вопросов — создавайте Issues в репо.
