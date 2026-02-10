# Cloudflare Worker Deployment Checklist

## Pre-Deployment (5 minutes)

- [ ] Install Node.js 16+ (if not already installed)
  ```bash
  node --version
  ```

- [ ] Install Wrangler CLI globally
  ```bash
  npm install -g @cloudflare/wrangler
  wrangler --version
  ```

- [ ] Have credentials ready:
  - [ ] Cloudflare account email/password
  - [ ] GitHub username/repository name
  - [ ] Windows PowerShell or macOS/Linux terminal

---

## Deployment (10-15 minutes)

### Phase 1: Authentication

- [ ] Log in to Cloudflare
  ```bash
  wrangler login
  # Follow browser prompt, allow access
  ```

- [ ] Create GitHub Personal Access Token
  - [ ] Go to https://github.com/settings/tokens
  - [ ] Click "Generate new token (classic)"
  - [ ] Scopes: `repo`, `workflow`
  - [ ] Expiration: 90 days
  - [ ] Click "Generate token"
  - [ ] **COPY the token** (you won't see it again!)

- [ ] Generate APP_SECRET (run in terminal)
  
  **Windows PowerShell:**
  ```powershell
  [System.BitConverter]::ToString((New-Object Random).GetBytes(32)) -replace '-','' | % ToLower
  ```
  
  **macOS/Linux:**
  ```bash
  openssl rand -hex 32
  ```
  
  - [ ] **SAVE this output** - you'll need it twice

### Phase 2: Configuration

- [ ] Update `wrangler.toml`
  ```toml
  [vars]
  GITHUB_REPO = "your-github-username/your-repo-name"
  GITHUB_BRANCH = "main"
  ```

- [ ] Update `app.js` CONFIG (temporarily for testing)
  ```javascript
  const CONFIG = {
    // ... existing settings ...
    WORKER_URL: '',  // Will update after deployment
    WORKER_ROUTE: '/api/github',
    APP_SECRET: ''   // Will update after deployment
  };
  ```

### Phase 3: Add Secrets

- [ ] Add GitHub token to Worker
  ```bash
  wrangler secret put GITHUB_TOKEN
  # Paste the token from Step "Create GitHub Personal Access Token"
  # Press Enter
  ```

- [ ] Add APP_SECRET to Worker
  ```bash
  wrangler secret put APP_SECRET
  # Paste the APP_SECRET from "Generate APP_SECRET" step
  # Press Enter
  ```

- [ ] Verify secrets were stored
  ```bash
  wrangler secret list
  # Should show: GITHUB_TOKEN, APP_SECRET
  ```

### Phase 4: Deploy

- [ ] Deploy Worker to Cloudflare
  ```bash
  wrangler deploy
  ```
  
  - [ ] **SAVE the URL** from output (looks like: `https://event-worker-xxxx.your-account.workers.dev`)

- [ ] Test Worker health
  ```bash
  # Replace URL with your actual URL
  curl https://event-worker-xxxx.your-account.workers.dev/health
  # Should return: {"status":"ok"}
  ```

### Phase 5: Frontend Configuration

- [ ] Update `app.js` CONFIG with real values
  ```javascript
  const CONFIG = {
    GITHUB_OWNER: 'your-github-username',
    GITHUB_REPO: 'your-repo-name',
    // ... other settings ...
    WORKER_URL: 'https://event-worker-xxxx.your-account.workers.dev',  // From Step 4
    WORKER_ROUTE: '/api/github',
    APP_SECRET: 'your-app-secret-from-earlier'  // From Phase 2
  };
  ```

- [ ] Verify `app.js` has no empty strings in CONFIG.WORKER_URL and CONFIG.APP_SECRET

- [ ] Commit and push to GitHub
  ```bash
  git add .
  git commit -m "Deploy Cloudflare Worker integration"
  git push origin main
  ```

---

## Testing (5-10 minutes)

### Test 1: Browser Registration

- [ ] Open your app in browser
- [ ] **Log out** (clear session)
- [ ] **Log back in** (regenerate encryption key)
- [ ] **Fill registration form**
  - Name: "Test User"
  - Phone: "+1 (234) 567-89-00"
  - Event: Select any event
- [ ] **Submit form**
- [ ] Check DevTools (F12)
  - [ ] Network tab: Verify POST request to Worker URL succeeds (200 response)
  - [ ] Application > localStorage > registrations: Verify `{enc: true, ...}` format
- [ ] Success message appears on page

### Test 2: Admin Panel

- [ ] Open admin panel (`admin.html`)
- [ ] Log in as admin user
- [ ] Verify new registration appears in list
- [ ] Verify registration displays correctly (decrypted)
- [ ] Click "Verify phone" button → should show success

### Test 3: Worker Logs

- [ ] In terminal, run:
  ```bash
  wrangler tail
  ```
- [ ] Keep terminal open
- [ ] Submit another test registration from browser
- [ ] Verify log entry appears in terminal showing:
  - Request received
  - Signature verified
  - GitHub API call made

### Test 4: GitHub Repository

- [ ] Go to your GitHub repo
- [ ] Click **Settings** → **Webhooks**
- [ ] Look for recent deliveries from Cloudflare Worker
- [ ] Verify `repository_dispatch` events with payload containing registration data

---

## Troubleshooting

If any test fails, consult [WORKER-DEPLOYMENT.md](WORKER-DEPLOYMENT.md) **Troubleshooting** section.

**Common issues:**
1. "Invalid signature" → APP_SECRET mismatch
2. "Timestamp expired" → System clock out of sync
3. "GitHub API error: 422" → Wrong GitHub repo name or token scopes
4. Worker returns 404 → Deployment failed or wrong URL

---

## After Successful Testing

- [ ] Review logs: `wrangler tail`
- [ ] Check GitHub Actions runs your workflow (if configured)
- [ ] Monitor Worker analytics: `wrangler dashboard`
- [ ] Clean up test data from localStorage
- [ ] Go live! 🎉

---

## Support Resources

- **Wrangler Docs:** https://developers.cloudflare.com/workers/
- **GitHub API Docs:** https://docs.github.com/en/rest
- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **This Guide:** See [WORKER-DEPLOYMENT.md](WORKER-DEPLOYMENT.md) for detailed explanations

---

**Estimated Total Time:** 20-30 minutes
**Difficulty:** Intermediate (copy-paste + follow steps)
