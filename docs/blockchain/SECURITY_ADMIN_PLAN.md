# Security Portal Admin Controls - Implementation Plan

**Project:** STTAURX Security Portal Administration
**Created:** February 2, 2026
**Status:** PLANNED

---

## Objective

Add admin controls to the dashboard that allow updating the Security Portal password and voice activation phrase without modifying code.

---

## Current State

Settings are hardcoded in `explorer/src/app/start/page.tsx`:
```typescript
const CONFIG = {
  VOICE_PHRASE: 'initialize protocol og',
  // ...
}
const PASSWORD = 'AUTrade88'
```

---

## Proposed Architecture

### 1. Backend (Mock Server)

#### New File: `mock-server/data/securitySettings.json`
```json
{
  "password": "AUTrade88",
  "voicePhrase": "initialize protocol og",
  "maxAttempts": 5,
  "lockoutDuration": 300,
  "updatedAt": "2026-02-02T00:00:00Z",
  "updatedBy": "admin"
}
```

#### New API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/security/settings` | Get current settings (password masked) | Public |
| PUT | `/api/v1/security/settings` | Update settings | Admin only |
| GET | `/api/v1/security/settings/full` | Get full settings including password | Admin only |

#### Example Responses

**GET /api/v1/security/settings**
```json
{
  "voicePhrase": "initialize protocol og",
  "maxAttempts": 5,
  "passwordSet": true
}
```

**GET /api/v1/security/settings/full** (Admin only)
```json
{
  "password": "AUTrade88",
  "voicePhrase": "initialize protocol og",
  "maxAttempts": 5,
  "lockoutDuration": 300,
  "updatedAt": "2026-02-02T00:00:00Z",
  "updatedBy": "admin"
}
```

**PUT /api/v1/security/settings**
```json
{
  "password": "NewPassword123",
  "voicePhrase": "new voice phrase",
  "maxAttempts": 5
}
```

---

### 2. Frontend (Explorer)

#### New Admin Page: `/admin/security`

**Location:** `explorer/src/app/admin/security/page.tsx`

**Features:**
- View current voice phrase
- Update voice phrase with preview
- Change password (with confirmation)
- Set max login attempts
- View last updated timestamp
- Audit log of changes

**UI Components:**
- Card with current settings display
- Form inputs with validation
- Save/Cancel buttons
- Success/Error notifications
- Password strength indicator

#### Updated Start Page

**Changes to:** `explorer/src/app/start/page.tsx`

1. Fetch settings from API on mount
2. Use fetched values instead of hardcoded CONFIG
3. Add loading state while fetching
4. Fallback to defaults if API unavailable

```typescript
useEffect(() => {
  fetch('/api/v1/security/settings/full')
    .then(res => res.json())
    .then(data => {
      setPassword(data.password)
      setVoicePhrase(data.voicePhrase)
      setMaxAttempts(data.maxAttempts)
    })
    .catch(() => {
      // Use defaults if API fails
    })
}, [])
```

---

### 3. Implementation Steps

#### Phase 1: Backend API (Est. 1 hour)

1. Create `securitySettings.json` data file
2. Add GET endpoint for public settings
3. Add GET endpoint for admin settings (full)
4. Add PUT endpoint for updating settings
5. Add validation and error handling
6. Test endpoints with curl/Postman

#### Phase 2: Admin UI (Est. 2 hours)

1. Create `/admin/security` page
2. Add form for editing settings
3. Implement password change with confirmation
4. Add success/error notifications
5. Style to match admin panel theme
6. Add to admin navigation

#### Phase 3: Start Page Integration (Est. 1 hour)

1. Add API fetch on component mount
2. Create loading state UI
3. Update password check logic
4. Update voice phrase matching
5. Test full flow

#### Phase 4: Testing & Polish (Est. 1 hour)

1. Test all scenarios
2. Add input validation
3. Add audit logging
4. Update documentation

---

### 4. Security Considerations

1. **Admin Authentication** - Require admin session for PUT endpoints
2. **Password Hashing** - Consider hashing stored password
3. **Rate Limiting** - Limit settings update frequency
4. **Audit Trail** - Log all changes with timestamp and user
5. **Validation** - Enforce password complexity rules

---

### 5. File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `mock-server/data/securitySettings.json` | CREATE | Settings storage |
| `mock-server/server.js` | MODIFY | Add API endpoints |
| `explorer/src/app/admin/security/page.tsx` | CREATE | Admin UI |
| `explorer/src/app/start/page.tsx` | MODIFY | Fetch from API |
| `explorer/src/components/Navigation.tsx` | MODIFY | Add admin link |

---

### 6. Testing Checklist

- [ ] API returns settings correctly
- [ ] Admin can update password
- [ ] Admin can update voice phrase
- [ ] Start page fetches settings on load
- [ ] Start page uses correct password
- [ ] Voice activation uses correct phrase
- [ ] Changes persist after server restart
- [ ] Error handling works correctly
- [ ] Validation prevents invalid input

---

## Timeline

| Phase | Task | Duration |
|-------|------|----------|
| 1 | Backend API | 1 hour |
| 2 | Admin UI | 2 hours |
| 3 | Start Page Integration | 1 hour |
| 4 | Testing & Polish | 1 hour |
| **Total** | | **5 hours** |

---

## Approval

- [ ] Plan reviewed by team lead
- [ ] Security review completed
- [ ] Ready for implementation

---

*Plan Version: 1.0*
