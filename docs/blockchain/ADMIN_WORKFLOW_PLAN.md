# Admin Dashboard Module - Implementation Plan

**Project:** AU Gold Block Explorer
**Module:** Admin Dashboard
**Created:** January 30, 2026
**Status:** Phase 1 In Progress

---

## Overview

The Admin Dashboard provides authorized administrators with tools to manage the gold-backed token system. This includes certificate registration, token minting, user management, and system monitoring. The admin interface must be secure, auditable, and easy to use.

---

## Current Implementation Status

### Completed Features
- [x] Basic admin page layout
- [x] Generate keypair functionality (API + client-side fallback)
- [x] Register certificate form (UI only)
- [x] Mint tokens form (UI only)
- [x] System information display
- [x] Fixed refresh bug (removed aggressive refetchInterval)

### Needs Implementation
- [ ] Certificate registration with blockchain submission
- [ ] Token minting with transaction signing
- [ ] Admin authentication/authorization
- [ ] Audit logging
- [ ] Role-based access control

---

## Phase 1: Core Admin Functions (Current)

**Goal:** Functional certificate and minting operations

### Tasks
- [x] Create admin page layout with sections
- [x] Implement keypair generation (with local fallback)
- [x] Certificate form UI
- [x] Mint tokens form UI
- [x] System information panel
- [ ] Wire up certificate registration to API
- [ ] Wire up token minting to API
- [ ] Add form validation
- [ ] Add loading states for operations
- [ ] Add success/error feedback

### Components
```
/explorer/src/app/admin/
  ├── page.tsx (main admin page)
  ├── components/
  │   ├── KeypairGenerator.tsx
  │   ├── CertificateForm.tsx
  │   ├── MintTokensForm.tsx
  │   └── SystemInfo.tsx
```

### API Endpoints Required
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/keypair` | POST | Generate new keypair |
| `/api/v1/certificates` | POST | Register certificate |
| `/api/v1/tokens/mint` | POST | Mint tokens |
| `/api/v1/certificates` | GET | List certificates |

### Acceptance Criteria
- Admin can generate keypairs
- Admin can register certificates (with backend)
- Admin can mint tokens (with backend)
- Operations show clear success/error states
- Forms have proper validation

---

## Phase 2: Admin Authentication & Authorization

**Goal:** Secure access to admin functions

### Tasks
- [ ] Create `AdminAuthProvider` context
- [ ] Implement admin login page
- [ ] Add wallet-based authentication (sign message)
- [ ] Create protected route wrapper
- [ ] Implement session management
- [ ] Add logout functionality
- [ ] Create admin role verification

### Components to Build
```
/explorer/src/app/admin/
  ├── login/
  │   └── page.tsx
  ├── components/
  │   ├── AdminAuthProvider.tsx
  │   ├── ProtectedRoute.tsx
  │   ├── AdminHeader.tsx
  │   └── AdminSidebar.tsx
```

### Authentication Flow
1. Admin navigates to /admin
2. If not authenticated → redirect to /admin/login
3. Admin connects wallet and signs challenge message
4. Backend verifies signature against admin whitelist
5. Session token issued, stored in httpOnly cookie
6. Admin gains access to protected routes

### Security Requirements
- Admin addresses stored in backend config (not hardcoded)
- Challenge-response authentication
- Session timeout (30 min inactivity)
- Rate limiting on login attempts
- All admin actions logged

### Acceptance Criteria
- Only whitelisted addresses can access admin
- Sessions expire appropriately
- Failed login attempts are logged
- Logout clears all session data

---

## Phase 3: Certificate Management Dashboard

**Goal:** Full CRUD operations for certificates

### Tasks
- [ ] Create certificate list view with filters
- [ ] Add certificate detail view
- [ ] Implement certificate status management
- [ ] Add certificate search functionality
- [ ] Create certificate audit trail view
- [ ] Add bulk operations (export, status change)
- [ ] Implement certificate document upload
- [ ] Add certificate verification tools

### Components to Build
```
/explorer/src/app/admin/
  ├── certificates/
  │   ├── page.tsx (list view)
  │   ├── [id]/
  │   │   └── page.tsx (detail view)
  │   └── components/
  │       ├── CertificateTable.tsx
  │       ├── CertificateFilters.tsx
  │       ├── CertificateDetail.tsx
  │       ├── CertificateAuditLog.tsx
  │       └── DocumentUpload.tsx
```

### Certificate States
| Status | Description | Actions Available |
|--------|-------------|-------------------|
| Pending | Awaiting verification | Verify, Reject |
| Active | Verified and mintable | Mint, Suspend |
| Suspended | Temporarily disabled | Reactivate |
| Redeemed | Physical gold claimed | View only |
| Revoked | Permanently disabled | View only |

### Acceptance Criteria
- List all certificates with pagination
- Filter by status, date, branch
- View complete certificate details
- See full mint history per certificate
- Download certificate data as CSV

---

## Phase 4: Token Minting Operations

**Goal:** Advanced minting with controls and limits

### Tasks
- [ ] Create minting dashboard with statistics
- [ ] Implement mint limits per certificate
- [ ] Add mint queue for batch operations
- [ ] Create mint history view
- [ ] Implement mint approval workflow (optional)
- [ ] Add mint reversal capability (burn)
- [ ] Create minting reports

### Components to Build
```
/explorer/src/app/admin/
  ├── minting/
  │   ├── page.tsx (minting dashboard)
  │   ├── history/
  │   │   └── page.tsx
  │   └── components/
  │       ├── MintingStats.tsx
  │       ├── MintQueue.tsx
  │       ├── MintHistory.tsx
  │       └── MintApproval.tsx
```

### Minting Rules
- Cannot mint more than certificate's remaining capacity
- Mint to valid addresses only
- Minimum mint amount: 0.001 tokens
- Maximum single mint: 1000 tokens
- Daily mint limit per admin: 10,000 tokens

### Acceptance Criteria
- See total minted vs total mintable
- View pending mint operations
- Track mint history with filters
- Enforce minting limits
- Export minting reports

---

## Phase 5: User Management

**Goal:** Manage admin users and permissions

### Tasks
- [ ] Create admin user list
- [ ] Implement role-based permissions
- [ ] Add admin invitation system
- [ ] Create permission management UI
- [ ] Implement admin activity log
- [ ] Add admin account deactivation

### Components to Build
```
/explorer/src/app/admin/
  ├── users/
  │   ├── page.tsx (user list)
  │   ├── [id]/
  │   │   └── page.tsx (user detail)
  │   └── components/
  │       ├── UserTable.tsx
  │       ├── RoleManager.tsx
  │       ├── InviteAdmin.tsx
  │       └── ActivityLog.tsx
```

### Admin Roles
| Role | Permissions |
|------|-------------|
| Super Admin | All operations + user management |
| Certificate Admin | Register/manage certificates |
| Mint Admin | Mint tokens only |
| Viewer | Read-only access |

### Acceptance Criteria
- List all admin users
- Assign/revoke roles
- View admin activity history
- Deactivate admin accounts
- Invite new admins via wallet address

---

## Phase 6: System Monitoring & Analytics

**Goal:** Real-time system health and analytics

### Tasks
- [ ] Create system health dashboard
- [ ] Implement real-time metrics display
- [ ] Add blockchain sync status
- [ ] Create alert system for issues
- [ ] Build analytics dashboard
- [ ] Add API health monitoring
- [ ] Create system logs viewer

### Components to Build
```
/explorer/src/app/admin/
  ├── monitoring/
  │   ├── page.tsx (health dashboard)
  │   ├── analytics/
  │   │   └── page.tsx
  │   ├── logs/
  │   │   └── page.tsx
  │   └── components/
  │       ├── HealthStatus.tsx
  │       ├── MetricsChart.tsx
  │       ├── AlertList.tsx
  │       └── LogViewer.tsx
```

### Metrics to Track
- Transactions per second (TPS)
- Block production rate
- API response times
- Error rates
- Total supply over time
- Active certificates

### Acceptance Criteria
- Real-time health status display
- Historical metrics charts
- Alert notifications for issues
- Searchable system logs
- Export analytics data

---

## Phase 7: Audit & Compliance

**Goal:** Complete audit trail and compliance tools

### Tasks
- [ ] Implement comprehensive audit logging
- [ ] Create audit report generator
- [ ] Add compliance dashboard
- [ ] Implement data export for auditors
- [ ] Create certificate verification tools
- [ ] Add regulatory report templates

### Components to Build
```
/explorer/src/app/admin/
  ├── audit/
  │   ├── page.tsx (audit dashboard)
  │   ├── reports/
  │   │   └── page.tsx
  │   └── components/
  │       ├── AuditTrail.tsx
  │       ├── ReportGenerator.tsx
  │       ├── ComplianceChecklist.tsx
  │       └── ExportTools.tsx
```

### Audit Events to Log
- Admin login/logout
- Certificate operations
- Minting operations
- Permission changes
- System configuration changes
- Failed operation attempts

### Acceptance Criteria
- All admin actions are logged
- Generate audit reports by date range
- Export data in standard formats
- Verify certificate authenticity
- Track chain of custody

---

## Technical Architecture

### Admin State Management
```typescript
interface AdminState {
  isAuthenticated: boolean
  adminAddress: string | null
  role: AdminRole
  permissions: Permission[]
  sessionExpiry: number
}

type AdminRole = 'super_admin' | 'cert_admin' | 'mint_admin' | 'viewer'

interface Permission {
  resource: string
  actions: ('create' | 'read' | 'update' | 'delete')[]
}
```

### API Security Headers
```typescript
// Required headers for admin endpoints
{
  'Authorization': 'Bearer <session_token>',
  'X-Admin-Address': '<wallet_address>',
  'X-Request-Signature': '<signed_request_hash>'
}
```

### Admin Routes Structure
```
/admin
  /login              - Authentication
  /                   - Dashboard home
  /certificates       - Certificate management
  /certificates/[id]  - Certificate detail
  /minting            - Minting operations
  /minting/history    - Mint history
  /users              - User management
  /monitoring         - System health
  /monitoring/analytics - Analytics
  /monitoring/logs    - System logs
  /audit              - Audit dashboard
  /audit/reports      - Report generation
  /settings           - Admin settings
```

---

## Implementation Timeline

| Phase | Description | Est. Duration | Dependencies |
|-------|-------------|---------------|--------------|
| Phase 1 | Core Admin Functions | 3-4 days | Mock server |
| Phase 2 | Authentication | 4-5 days | Phase 1, Backend auth |
| Phase 3 | Certificate Management | 4-5 days | Phase 2 |
| Phase 4 | Token Minting | 3-4 days | Phase 2, Phase 3 |
| Phase 5 | User Management | 3-4 days | Phase 2 |
| Phase 6 | System Monitoring | 4-5 days | Phase 2, Backend metrics |
| Phase 7 | Audit & Compliance | 4-5 days | Phase 2-6 |

**Total Estimate:** 25-32 days

---

## Security Considerations

### Critical Security Requirements
1. **Authentication**: Wallet-based with signed challenges
2. **Authorization**: Role-based access control (RBAC)
3. **Audit Logging**: All actions logged with timestamps
4. **Rate Limiting**: Prevent brute force and DoS
5. **Input Validation**: Strict validation on all inputs
6. **HTTPS Only**: All admin traffic encrypted
7. **Session Management**: Secure, expiring sessions

### Security Checklist
- [ ] Implement CSP headers
- [ ] Add request signing
- [ ] Enable audit logging
- [ ] Set up rate limiting
- [ ] Configure session timeouts
- [ ] Add IP whitelisting (optional)
- [ ] Implement 2FA (optional)

---

## Follow-up Tasks

- [ ] Review and approve plan
- [ ] Set up backend admin endpoints
- [ ] Configure admin wallet whitelist
- [ ] Design admin UI mockups
- [ ] Begin Phase 1 completion
- [ ] Plan security review

---

## Notes

- Phase 2 (Authentication) is critical and should be prioritized
- Consider hardware wallet support for admin signing
- May need separate admin backend service for security isolation
- Mobile admin access should be restricted

---

*Document Version: 1.0*
*Last Updated: January 30, 2026*
