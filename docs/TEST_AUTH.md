# Authentication System Testing

## Test Plan for User Account & Registration Integration

### Prerequisites
- Open `auth.html` to start the authentication flow
- Demo account: `demo@example.com` / `demo123`

### Test Cases

#### 1. Direct Access to Registration Page (Without Login)
**Steps:**
1. Open `index.html` directly in browser (without logging in)
2. Observe behavior

**Expected Result:**
- Page should automatically redirect to `auth.html`
- User should see login/registration form

---

#### 2. User Registration (New Account)
**Steps:**
1. Open `auth.html`
2. Click on "Register" tab
3. Fill in form with:
   - Full Name: "Test User"
   - Email: "testuser@example.com"
   - Phone: "+61 (12) 345-67-89"
   - Password: "password123"
   - Confirm Password: "password123"
4. Click "Register" button

**Expected Result:**
- Success message: "Account successfully created! Go to Login tab."
- Form should be cleared
- No errors displayed

---

#### 3. User Login with New Account
**Steps:**
1. Switch to "Login" tab
2. Enter email: "testuser@example.com"
3. Enter password: "password123"
4. Click "Login" button

**Expected Result:**
- Success message: "Login successful! Redirecting to registration..."
- Page redirects to `index.html` after 2 seconds
- User email displays in header: "testuser@example.com"
- Logout button is visible

---

#### 4. Demo Account Login
**Steps:**
1. Open `auth.html` (or click Logout to go back)
2. Enter email: "demo@example.com"
3. Enter password: "demo123"
4. Click "Login" button

**Expected Result:**
- Success message and redirect to `index.html`
- Header shows: "demo@example.com" with logout button
- Demo account auto-created on first load

---

#### 5. Webinar Registration with User Account
**Steps:**
1. After successful login in `index.html`
2. Select a webinar from the event dropdown
3. Enter your name in the form
4. Click "Register" button

**Expected Result:**
- Success message with queue number
- Registration should include:
  - `userId`: Should be populated
  - `userEmail`: Should be "demo@example.com" or your registered email
  - All other fields as before

---

#### 6. Logout Functionality
**Steps:**
1. While logged in on `index.html`
2. Click the "Logout" button (🚪) in the header

**Expected Result:**
- Session cleared from localStorage
- Redirected to `auth.html`
- Can log in again with credentials

---

#### 7. Session Persistence
**Steps:**
1. Log in successfully
2. Refresh the page (`F5`)

**Expected Result:**
- User remains logged in
- Email still visible in header
- Can continue using registration form

---

#### 8. Session Expiry (After 7 Days)
**Steps:**
1. Manually modify `user_sessions` in localStorage to set past expiration date
2. Refresh page

**Expected Result:**
- Session should be invalidated
- Redirect to `auth.html`

---

#### 9. Multi-Language Support
**Steps:**
1. Log in successfully
2. Change language to Russian or English via dropdown
3. Verify all text updates

**Expected Result:**
- Logout button text changes
- Form labels update
- Messages in new language
- Language preference persists across page refresh

---

#### 10. Dark/Light Theme
**Steps:**
1. Logged into `index.html`
2. Toggle theme button
3. Refresh page

**Expected Result:**
- Theme toggles correctly
- Theme preference persists
- User info section styled appropriately in both themes

---

## Data Validation Checks

### Registration Form Validation
- ✓ Email must be valid format (checked)
- ✓ Password must be 6+ characters (checked)
- ✓ Passwords must match (checked)
- ✓ Required fields enforced (checked)
- ✓ Email duplicate prevention (checked)

### Login Form Validation
- ✓ Email format validation (checked)
- ✓ Password verification with hash (checked)
- ✓ User not found handling (checked)
- ✓ Wrong password handling (checked)

---

## localStorage Keys to Monitor

After login, these keys should exist:
- `user_session_token`: Session token
- `current_user`: Current logged-in user object (JSON)
- `queue_users`: All user accounts
- `user_sessions`: All active sessions with expiry

### Example `current_user` object:
```json
{
  "id": "user_1234567890",
  "fullName": "Test User",
  "email": "testuser@example.com",
  "phone": "+61 (12) 345-67-89",
  "passwordHash": "sha256hash...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "registrations": []
}
```

---

## Integration Points

### `auth.html` → `index.html`
- ✓ Redirect after successful login
- ✓ Redirect after successful registration
- ✓ Session token stored
- ✓ User data stored

### `index.html` → `auth.html`
- ✓ Redirect on page load if not authenticated
- ✓ Redirect on logout
- ✓ Session validation

### Registration Form Integration
- ✓ User ID linked to registration
- ✓ User email stored with registration
- ✓ Registrations filterable by user

---

## Browser Developer Tools Checks

1. **localStorage**
   ```
   user_session_token: "session_..."
   current_user: "{...user object...}"
   queue_users: "[...array of users...]"
   user_sessions: "{...sessions...}"
   ```

2. **Console**
   - Check for any errors
   - Verify API calls (if using GitHub)

3. **Network**
   - Verify no failed requests
   - Check redirect responses

---

## Success Criteria

✓ All 10 test cases pass
✓ No console errors
✓ Registrations include user information
✓ Session persists across page refreshes
✓ Multi-language works correctly
✓ Theme toggle works correctly
✓ Logout clears session properly
