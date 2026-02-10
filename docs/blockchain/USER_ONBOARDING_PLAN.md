# User Onboarding Module - Implementation Plan

**Project:** AU Gold Block Wallet
**Module:** User Onboarding
**Created:** January 30, 2026
**Status:** Phase 2 Complete

---

## Overview

The User Onboarding module guides new users through wallet setup, security education, and first-time experience with gold-backed digital assets. The goal is to make onboarding intuitive while ensuring users understand the importance of security and the unique value proposition of gold-backed tokens.

---

## Phase 1: Welcome & Introduction Flow

**Goal:** Introduce users to AU Gold Block and explain the value proposition

### Tasks
- [x] Create `OnboardingProvider` context to manage onboarding state
- [x] Create `WelcomeScreen` component with animated gold branding
- [x] Create `ValueProposition` slides explaining:
  - What are gold-backed tokens
  - How physical gold custody works (HSBC partnership)
  - Benefits: stability, transparency, blockchain security
- [x] Add progress indicator (step dots/bar)
- [x] Add "Skip" option for returning users
- [x] Store onboarding completion status in localStorage

### Components to Build
```
/wallet/src/components/onboarding/
  ├── OnboardingProvider.tsx
  ├── WelcomeScreen.tsx
  ├── ValueSlides.tsx
  ├── ProgressIndicator.tsx
  └── index.ts
```

### Acceptance Criteria
- User sees welcome screen on first visit
- Can swipe/click through 3-4 value proposition slides
- Progress is visually indicated
- Can skip to wallet creation

---

## Phase 2: Wallet Creation & Security

**Goal:** Secure wallet setup with emphasis on backup education

### Tasks
- [x] Create `WalletCreationChoice` screen (Create New vs Import Existing)
- [x] Create `KeypairGeneration` component with loading animation
- [x] Create `SecretKeyBackup` screen with:
  - Clear warning about secret key importance
  - Copy to clipboard functionality
  - Option to download as encrypted file
  - Checkbox confirmation: "I have saved my secret key"
- [x] Create `SecretKeyVerification` screen:
  - Ask user to enter specific words/characters from their key
  - Prevents users from skipping backup
- [x] Create `WalletCreationSuccess` celebration screen

### Security Features
- Secret key shown only once during creation
- Verification step ensures user actually saved it
- Clear warnings about what happens if key is lost
- No server-side storage of secret keys

### Components Built
```
/wallet/src/components/onboarding/
  ├── WalletCreationChoice.tsx    ✓ Create New vs Import Existing
  ├── KeypairGeneration.tsx       ✓ Animated keypair generation
  ├── SecretKeyBackup.tsx         ✓ Key display, copy, download
  ├── SecretKeyVerification.tsx   ✓ Verify backup with character positions
  ├── SecurityWarning.tsx         ✓ Reusable warning components
  └── WalletCreationSuccess.tsx   ✓ Celebration with confetti
```

### Acceptance Criteria
- [x] User cannot proceed without confirming backup
- [x] Verification step validates user saved key correctly
- [x] Clear, non-technical language for security warnings
- [x] Success celebration with confetti/animation

---

## Phase 3: Identity Verification (KYC) - Optional

**Goal:** Regulatory compliance for users who want higher limits

### Tasks
- [ ] Create `KYCIntro` screen explaining why verification helps
- [ ] Create `KYCTierSelection` showing verification levels:
  - **Tier 1 (Basic):** Email verification - $1,000/month limit
  - **Tier 2 (Standard):** Phone + ID - $10,000/month limit
  - **Tier 3 (Premium):** Full KYC - Unlimited
- [ ] Create `EmailVerification` flow
- [ ] Create `PhoneVerification` flow (SMS code)
- [ ] Create `DocumentUpload` component for ID verification
- [ ] Create `KYCPending` and `KYCApproved` status screens
- [ ] Add "Skip for now" option (Tier 1 default)

### Integration Points
- Email service (SendGrid/AWS SES)
- SMS service (Twilio)
- KYC provider (Jumio/Onfido) - future integration

### Components to Build
```
/wallet/src/components/onboarding/
  ├── KYCIntro.tsx
  ├── KYCTierSelection.tsx
  ├── EmailVerification.tsx
  ├── PhoneVerification.tsx
  ├── DocumentUpload.tsx
  ├── KYCStatus.tsx
  └── VerificationBadge.tsx
```

### Acceptance Criteria
- Users understand why KYC is beneficial (not just required)
- Can skip and use basic tier
- Clear explanation of limits per tier
- Status tracking for pending verifications

---

## Phase 4: First-Time User Experience (FTUE)

**Goal:** Guide users through key features on first use

### Tasks
- [ ] Create `FeatureTour` component with tooltip highlights
- [ ] Create tour stops for:
  - Balance display and gold price
  - Send tokens button
  - Receive tokens / QR code
  - Certificates section
  - Transaction history
- [ ] Create `FirstDepositPrompt` encouraging initial funding
- [ ] Create `QuickActionTutorial` for common tasks
- [ ] Add "Don't show again" option
- [ ] Track which tours user has completed

### Tour Implementation
- Use spotlight/overlay to highlight UI elements
- Step-by-step with Next/Previous/Skip
- Contextual tips that appear on hover (optional setting)

### Components to Build
```
/wallet/src/components/onboarding/
  ├── FeatureTour.tsx
  ├── TourTooltip.tsx
  ├── TourOverlay.tsx
  ├── FirstDepositPrompt.tsx
  └── ContextualTip.tsx
```

### Acceptance Criteria
- Tour highlights each major feature
- User can skip or dismiss permanently
- Tooltips don't block critical UI
- Mobile-responsive tour experience

---

## Phase 5: Personalization & Preferences

**Goal:** Let users customize their experience

### Tasks
- [ ] Create `ProfileSetup` screen:
  - Display name (optional)
  - Avatar/profile picture
  - Preferred currency display (USD, EUR, etc.)
- [ ] Create `NotificationPreferences` screen:
  - Transaction alerts
  - Gold price alerts
  - Security alerts
  - Marketing/news (opt-in)
- [ ] Create `SecuritySettings` initial setup:
  - Biometric unlock (if available)
  - Auto-lock timeout
  - Transaction confirmation requirements
- [ ] Create `OnboardingComplete` celebration screen

### Components to Build
```
/wallet/src/components/onboarding/
  ├── ProfileSetup.tsx
  ├── NotificationPreferences.tsx
  ├── SecuritySettings.tsx
  ├── OnboardingComplete.tsx
  └── PreferenceCard.tsx
```

### Acceptance Criteria
- All settings have sensible defaults
- User can skip personalization
- Settings are easily changeable later
- Completion screen summarizes setup

---

## Phase 6: Re-engagement & Recovery

**Goal:** Handle returning users and recovery scenarios

### Tasks
- [ ] Create `WelcomeBack` screen for returning users
- [ ] Create `WalletRecovery` flow:
  - Enter secret key to restore
  - Validation and error handling
  - Success confirmation
- [ ] Create `SessionExpired` handling
- [ ] Create `WhatsNew` modal for app updates
- [ ] Add `OnboardingReset` option in settings (for testing)

### Components to Build
```
/wallet/src/components/onboarding/
  ├── WelcomeBack.tsx
  ├── WalletRecovery.tsx
  ├── SessionExpired.tsx
  ├── WhatsNew.tsx
  └── OnboardingReset.tsx
```

### Acceptance Criteria
- Smooth experience for returning users
- Clear recovery path if wallet is lost
- What's New shows only once per version
- Testing/reset capability for development

---

## Technical Architecture

### State Management
```typescript
interface OnboardingState {
  currentStep: OnboardingStep
  completedSteps: OnboardingStep[]
  walletCreated: boolean
  backupVerified: boolean
  kycTier: 'none' | 'basic' | 'standard' | 'premium'
  tourCompleted: boolean
  preferencesSet: boolean
  onboardingVersion: string
}
```

### Storage
- `localStorage`: Onboarding progress, preferences
- `sessionStorage`: Temporary secret key during creation
- `Backend API`: KYC status, user profile (future)

### Routes
```
/onboarding
  /welcome
  /create-wallet
  /backup
  /verify-backup
  /kyc (optional)
  /tour
  /preferences
  /complete
/recovery
```

---

## Design Guidelines

### Visual Style
- Gold gradient accents consistent with brand
- Dark theme (gray-900 background)
- Generous whitespace, not overwhelming
- Celebratory animations at milestones

### Copy/Messaging
- Friendly, non-technical language
- Emphasize user benefits, not features
- Security warnings clear but not scary
- Encouraging tone throughout

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Reduced motion option

---

## Implementation Timeline

| Phase | Estimated Duration | Dependencies |
|-------|-------------------|--------------|
| Phase 1: Welcome Flow | 2-3 days | None |
| Phase 2: Wallet Creation | 3-4 days | Phase 1 |
| Phase 3: KYC (Optional) | 5-7 days | Phase 2, Backend APIs |
| Phase 4: Feature Tour | 2-3 days | Phase 2 |
| Phase 5: Personalization | 2-3 days | Phase 2 |
| Phase 6: Re-engagement | 2-3 days | Phase 2 |

**Total Estimate:** 16-23 days (with KYC) or 11-16 days (without KYC)

---

## Success Metrics

- **Completion Rate:** % of users who finish onboarding
- **Backup Verification Rate:** % who pass secret key verification
- **Time to Complete:** Average minutes to finish onboarding
- **Drop-off Points:** Where users abandon the flow
- **Feature Adoption:** % who use key features within first week

---

## Follow-up Tasks

- [ ] Review and approve plan
- [ ] Prioritize phases (MVP vs future)
- [ ] Create UI mockups/wireframes
- [ ] Begin Phase 1 implementation
- [ ] Set up analytics tracking
- [ ] Plan user testing sessions

---

## Notes

- Phase 3 (KYC) can be deferred if regulatory compliance isn't immediate priority
- Consider A/B testing different onboarding flows
- Mobile app will need adapted onboarding (biometrics, push notifications)
- Localization/i18n should be considered from the start

---

*Document Version: 1.0*
*Last Updated: January 30, 2026*
