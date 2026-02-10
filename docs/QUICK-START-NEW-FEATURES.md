# 🎯 Quick Guide: New Features

## What's New?

### 1️⃣ Event Selection Dropdown
**For Users:**
- Select your event from a dropdown list instead of getting auto-assigned
- All available events shown clearly
- Can't submit without selecting an event

**For Admins:**
- Users choose their own event preferences
- Better event assignment accuracy

### 2️⃣ Attendance Tracking
**For Admins:**
- Click "✓ Attended" button next to each user
- Records attendance for that day (prevents double-counting)
- See attendance count for each user: "Attendance: 4 times"
- Automatically prevents marking same user twice on same day

**Example:**
```
Родион | +61... | Веб-мастеринг JavaScript
Registered: 2/9/2026, 8:32 AM
Attendance: 3 times          ← Total attendance count
[✓ Attended] [✎] [✕]       ← Click to record attendance
```

### 3️⃣ English CSV Export
**For Data Analysis:**
- CSV headers are now ALWAYS in English
- Works regardless of UI language (UK/RU/EN)
- Includes new "Attendance Count" column
- Easy to import into Excel/databases

**Example CSV:**
```
ID,Name,Phone,Time,Event,Attendance Count
user_123,"Родион","+61...","2/9/2026","JavaScript Webinar",3
```

---

## How to Use

### For Users (Registration)

1. **Open app:** http://localhost:8080
2. **Fill name:** "Your Name"
3. **Select event:** Choose from dropdown
   - "Веб-мастеринг JavaScript"
   - "Frontend Professionals"
   - "Open Discussion"
4. **Click Register** and get queue number

### For Admins (Attendance)

1. **Open admin panel:** http://localhost:8080/admin.html
2. **Login:** password "admin123"
3. **See registrations** with attendance count
4. **Mark attendance:** Click "✓ Attended" button
   - Increments counter
   - Prevents duplicate same-day entries
   - Shows confirmation

### For Admins (CSV Export)

1. **In Registrations tab:** Click "📥 Download CSV"
2. **Open in Excel** with English headers:
   - ID
   - Name
   - Phone
   - Time
   - Event
   - **Attendance Count** (NEW!)

---

## Data Storage

### Registration Example
```json
{
  "id": "user_1770615171472_eq9yup7t9",
  "name": "Родион",
  "phone": "+61...",
  "eventId": "webinar_01",
  "eventName": "Веб-мастеринг 2026: JavaScript для начинающих",
  "timestamp": "2026-02-09T08:32:51.000Z",
  "attendanceCount": 0,
  "attendances": [
    {
      "date": "2026-02-09",
      "timestamp": "2026-02-09T08:35:12.000Z",
      "eventId": "webinar_01",
      "eventName": "Веб-мастеринг 2026: JavaScript для начинающих"
    }
  ]
}
```

---

## Feature Matrix

| Feature | User | Admin | Status |
|---------|------|-------|--------|
| Select Event | Yes | — | ✓ New |
| View Queue Number | Yes | — | ✓ Existing |
| Record Attendance | — | Yes | ✓ New |
| View Attendance Count | — | Yes | ✓ New |
| Export CSV (English) | — | Yes | ✓ Enhanced |
| Multi-language UI | Yes | Yes | ✓ Existing |
| Theme Toggle | Yes | Yes | ✓ Existing |

---

## Translations

### "Attendance" key in 3 languages
- 🇺🇦 Ukrainian: "Присутність"
- 🇷🇺 Russian: "Посещение"  
- 🇺🇸 English: "Attendance"

All alert messages automatically translated!

---

## Statistics

### New Metrics
- **Total Registrations:** All registered users (existing)
- **Attended:** Users with attendance count > 0 (updated)
- **Missed:** Users with attendance count = 0 (updated)
- **Average Attendance:** Avg attendances per user (new)

---

## Keyboard Shortcut Tip

In admin panel, after marking attendance:
- System prevents duplicate entries automatically
- Check "Already marked today" alert if trying to re-mark same person

---

## Example Workflow

**Week 1 Session (Monday)**
```
1. Родион registers for "JavaScript Webinar"
2. Admin clicks "✓ Attended"
3. Attendance: 1 time ✓
```

**Week 2 Session (Wednesday)**
```
1. Родион attends same webinar again
2. Admin clicks "✓ Attended"
3. Alert: "Already marked today" (same day)
4. Next day, admin can mark again
5. Attendance: 2 times ✓
```

**Export**
```
CSV shows: "Родион" | "JavaScript Webinar" | 2 attendances
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Event dropdown empty | Refresh page, check events.json |
| Can't mark attendance | Check localStorage not full |
| "Already marked today" | That's working! Try next day |
| CSV headers in wrong language | Version 1.1+ fixed this - always English |
| Missing attendance column | Re-export after first attendance record |

---

## Technical Support

### Quick Checks
- ✓ Browser storage enabled: Works in localStorage
- ✓ Admin auth: Uses SHA256 "admin123"
- ✓ Data sync: Manual save to GitHub (optional)
- ✓ Multi-device: Each device has its own data

### Reset Data
- Go to Admin > Settings > "🗑️ Clear all data"
- ⚠️ This clears local data only (GitHub data remains)

---

## What Changed

### Files Modified
1. **admin.js** - CSV export, attendance display, recording
2. **app.js** - Event selection, registration data
3. **index.html** - Event field changed to dropdown

### Backward Compatibility
✓ Existing registrations still work  
✓ But they'll show "Attendance: 0" until marked  
✓ Can upgrade without losing data

---

## Version History

**v1.1.0** (Feb 9, 2026) - Current
- Event dropdown selector
- Attendance tracking system
- English CSV export headers
- Multi-language support

**v1.0.0** (Earlier)
- Basic registration
- Admin panel
- CSV export (locale-dependent)

---

**Need help?** Check the admin panel for current registrations and their attendance status!
