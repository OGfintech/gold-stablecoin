# STTAURX Security Portal

**Project:** STTAURX (Strategic Trade Transmission & Arbitrage Risk X-ecution Solutions)
**Last Updated:** February 2, 2026

---

## Overview

The Security Portal is an Iron Man-inspired animated landing page that provides secure access to the STTAURX platform. It features voice activation, keyboard shortcuts, animated security verification, and password protection.

**URL:** http://localhost:3000/start

---

## Features

### 1. Activation Methods

#### Keyboard Shortcut
- **Ctrl + Shift + A** - Instantly activates the security sequence

#### Voice Activation
- Click the **"Voice Activate"** button to enable microphone
- Say: **"Initialize Protocol OG"**
- The system will recognize the phrase and start the sequence
- Voice recognition automatically disables after activation

### 2. Security Animation Sequence

Once activated, the portal displays 10 security verification icons in sequence:

| # | Icon | Status Message |
|---|------|----------------|
| 1 | Shield | Rate Limiting Active |
| 2 | Lock | CORS Protected |
| 3 | Key | Encryption Enabled |
| 4 | Fingerprint | Firewall Active |
| 5 | Key | Auth Required |
| 6 | Document | Audit Logging |
| 7 | Chain | Blockchain Healthy |
| 8 | Lightning | DDoS Protected |
| 9 | Search | Threat Monitoring |
| 10 | Checkmark | System Secure |

Each icon appears inside a glowing octagon shape with sound effects (ascending beeps).

### 3. Password Protection

After the animation completes, users must enter the authorization code:

- **Password:** `AUTrade88`
- **Max Attempts:** 5 (system locks after 5 failed attempts)
- Password field features glowing cyan edges
- Eye icon toggle to show/hide password

### 4. Access Granted

Upon successful authentication:
- Displays "ACCESS GRANTED" confirmation
- Shows GO button to proceed to dashboard
- Stores authentication in sessionStorage
- Redirects to `/dashboard`

---

## Visual Design

### Color Theme (Iron Man / Cyan-Teal)

| Color | Hex Code | Usage |
|-------|----------|-------|
| Primary | `#00D4FF` | Cyan glow, borders, buttons |
| Secondary | `#00F5D4` | Teal accents, success states |
| Tertiary | `#7B61FF` | Purple highlights |
| Background | `#0A0E17` | Dark background |

### Animations

- **Floating Icon** - B&W logo gently floats up and down
- **Rotating Rings** - Dashed circles rotate around the logo
- **Octagon Pulse** - Security icons pulse with glowing edges
- **Grid Movement** - Background grid slowly shifts
- **Scan Lines** - Horizontal/vertical scan lines sweep across screen
- **Shimmer Effect** - GO button has a shimmer animation

---

## Technical Details

### File Location
```
explorer/src/app/start/
├── layout.tsx    # Minimal layout (no navigation)
└── page.tsx      # Security portal component
```

### Configuration

All settings are in the `CONFIG` object at the top of `page.tsx`:

```typescript
const CONFIG = {
  KEYBOARD_SHORTCUT: { ctrl: true, shift: true, key: 'A' },
  VOICE_PHRASE: 'initialize protocol og',
  ICON_INTERVAL: 500,  // milliseconds between icons
  COLORS: {
    primary: '#00D4FF',
    secondary: '#00F5D4',
    tertiary: '#7B61FF',
    background: '#0A0E17',
  }
}

const PASSWORD = 'AUTrade88'
```

### Dependencies

- **lucide-react** - Icons (Shield, Lock, KeyRound, etc.)
- **Web Speech API** - Voice recognition (browser built-in)
- **Web Audio API** - Sound effects (browser built-in)

### Session Storage

Authentication state is stored in `sessionStorage`:
```javascript
sessionStorage.setItem('sttaurx_authenticated', 'true')
```

This persists for the browser session and is checked by other pages.

---

## Audio

Sound effects only play on the `/start` page:

| Sound | Trigger | Description |
|-------|---------|-------------|
| Startup | Activation | 3 ascending beeps (400Hz → 600Hz → 800Hz) |
| Icon | Each icon appears | Random frequency beep (600-1000Hz) |

**Note:** Audio was removed from all other pages to prevent unwanted sounds during navigation.

---

## Security Considerations

1. **Voice Recognition** - Completely destroyed after activation to prevent re-triggers
2. **Password Attempts** - Limited to 5 attempts before lockout
3. **Session-based Auth** - Uses sessionStorage (clears when browser closes)
4. **No Navigation** - Full-screen overlay prevents bypassing

---

## Future Enhancements (Planned)

### Admin Controls
- Dashboard to update password without code changes
- Dashboard to update voice phrase
- API endpoint for security settings
- Audit log for failed login attempts

---

## Troubleshooting

### Voice Activation Not Working
1. Ensure microphone permissions are granted
2. Speak clearly: "Initialize Protocol OG"
3. Check browser console for errors
4. Try Chrome/Edge (best Speech API support)

### Audio Not Playing
1. Check browser volume/mute settings
2. Some browsers require user interaction first
3. Check console for CSP errors

### Animation Restarting
This was fixed by:
- Using a ref (`hasStartedRef`) to track sequence state
- Completely destroying voice recognition after activation
- Preventing all re-triggers once sequence begins

### System Locked
After 5 failed password attempts, refresh the page to reset.

---

## Related Documentation

- [STARTUP_LIST.md](./STARTUP_LIST.md) - Server startup procedures
- [SECURITY_CHECKLIST.md](../SECURITY_CHECKLIST.md) - Security audit checklist
- [SECURITY_SCAN_REPORT.md](./SECURITY_SCAN_REPORT.md) - Latest security scan results

---

*Document Version: 1.0*
