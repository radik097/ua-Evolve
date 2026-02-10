# Cloudflare Worker Deployment Guide

## Prerequisites

1. **Cloudflare Account** - Sign up at https://dash.cloudflare.com
2. **GitHub Personal Access Token** - Create at https://github.com/settings/tokens
3. **Node.js 16+** - For running wrangler CLI
4. **npm or yarn** - Package manager for dependencies

---

## Step-by-Step Deployment

### 1. Install Wrangler CLI

```bash
npm install -g @cloudflare/wrangler
# or
npm install --save-dev @cloudflare/wrangler

# Verify installation
wrangler --version
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate. Once done, wrangler will store your credentials.

### 3. Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Set scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
4. Set expiration: 90 days (recommended)
5. **Copy the token** (you won't see it again)

### 4. Create APP_SECRET (HMAC Secret)

Generate a random 32-byte hex secret:

```bash
# On macOS/Linux
openssl rand -hex 32

# On Windows PowerShell
$bytes = New-Object byte[] 32; (New-Object Random).NextBytes($bytes); ([BitConverter]::ToString($bytes) -replace '-','').ToLower()
```

**Save this value** - you'll need it for both Worker and frontend config.

### 5. Update `wrangler.toml`

Open the `wrangler.toml` file and update:

```toml
[vars]
GITHUB_REPO = "your-username/your-repo"  # e.g., "radik098/queue-app-data"
GITHUB_BRANCH = "main"
```

### 6. Add Worker Secrets

```bash
# Add GitHub token
wrangler secret put GITHUB_TOKEN
# Paste your GitHub PAT from Step 3

# Add HMAC secret
wrangler secret put APP_SECRET
# Paste your APP_SECRET from Step 4
```

**Verify secrets were created:**
```bash
wrangler secret list
```

### 7. Deploy Worker

```bash
wrangler deploy
```

**Output will show:**
```
✓ Published Worker
URL: https://event-worker-xxxx.your-account.workers.dev
```

**Copy the URL** - you'll need this for frontend config.

### 8. Test Worker Health Check

```bash
# Replace with your actual Worker URL
curl https://event-worker-xxxx.your-account.workers.dev/health

# Should return:
# {"status":"ok"}
```

### 9. Update Frontend Config

Edit `app.js` and update the CONFIG object:

```javascript
const CONFIG = {
    // ... existing config ...
    
    // Cloudflare Worker integration
    WORKER_URL: 'https://event-worker-xxxx.your-account.workers.dev',  // Your URL from Step 7
    WORKER_ROUTE: '/api/github',
    APP_SECRET: 'your-32-byte-hex-secret'  // From Step 4
};
```

### 10. Push Changes to GitHub

```bash
git add .
git commit -m "Configure Cloudflare Worker integration"
git push origin main
```

---

## Testing the Integration

### 1. Local Testing (Browser)

1. Open your app in the browser
2. **Log out** and **log back in** to regenerate encryption key
3. **Create a new registration**
4. **Check browser DevTools:**
   - Network tab: Look for POST to your Worker URL
   - Application > localStorage: Verify `registrations` is encrypted ({enc: true, ...})
5. **Check Worker logs:**
   ```bash
   wrangler tail
   ```

### 2. Admin Panel Verification

1. Log in as admin
2. Verify new registration appears in admin panel
3. Check if registration is decrypted properly
4. Try to verify user phone → should succeed

### 3. GitHub Repository Check

1. Go to your GitHub repo settings → Webhooks
2. Look for recent deliveries from Cloudflare Worker
3. Verify `repository_dispatch` events with type `register`

---

## Troubleshooting

### "Invalid signature" error

**Problem:** Frontend and Worker have different APP_SECRET values.

**Solution:**
```bash
# Verify Worker secret
wrangler secret list

# Update if needed
wrangler secret put APP_SECRET
# Paste the same value from app.js CONFIG
```

### "Timestamp expired" error

**Problem:** Browser clock is out of sync or request took >60 seconds.

**Solution:**
- Verify browser system clock is correct
- Check network latency
- Consider increasing timestamp window in Worker code (src/index.ts, line 34)

### "GitHub API error: 422"

**Problem:** GitHub PAT doesn't have correct scopes or repo is private.

**Solution:**
1. Verify PAT has `repo` and `workflow` scopes
2. Ensure `GITHUB_REPO` in wrangler.toml is correct
3. Test PAT manually:
   ```bash
   curl -H "Authorization: token YOUR_PAT" https://api.github.com/user
   ```

### "Not found" or 404

**Problem:** Worker URL is incorrect or deployment failed.

**Solution:**
```bash
# Check if Worker deployed
wrangler list

# Redeploy
wrangler deploy
```

---

## Next Steps

1. ✅ Deploy Worker (this guide)
2. ✅ Configure frontend (step 9)
3. ⏳ Test registration flow
4. ⏳ Set up GitHub Actions workflow for processing events
5. ⏳ Monitor and optimize with wrangler analytics

---

## Monitoring & Debugging

### View Live Logs

```bash
wrangler tail
```

This streams real-time logs from your Worker.

### View Historical Metrics

```bash
# In wrangler dashboard
wrangler dashboard
```

### Custom Logging in Worker

Add to `src/index.ts`:
```typescript
console.log('Incoming request:', url.pathname);
console.log('Payload:', body);
```

Logs appear in `wrangler tail` output.

---

## Security Best Practices

1. **Never commit secrets to Git**
   - Use `wrangler secret put` (stores in Cloudflare)
   - Keep APP_SECRET in environment variables

2. **Rotate secrets regularly**
   ```bash
   wrangler secret put APP_SECRET  # Update with new value
   ```

3. **Enable CORS carefully**
   - Currently allows `*` (all origins)
   - In production, restrict to your domain:
   ```typescript
   'Access-Control-Allow-Origin': 'https://your-domain.com'
   ```

4. **Monitor rate limits**
   - GitHub API: 5,000 requests/hour
   - Cloudflare Workers: Varies by plan
   - Add rate limiting if needed

---

## Support & References

- **Wrangler Docs:** https://developers.cloudflare.com/workers/
- **GitHub API:** https://docs.github.com/en/rest
- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **Worker Analytics:** https://developers.cloudflare.com/workers/platform/analytics-engine/

---

**Last Updated:** February 10, 2026
**Status:** Ready for Production
