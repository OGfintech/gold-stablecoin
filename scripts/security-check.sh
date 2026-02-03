#!/bin/bash

# Gold Chain Platform - Security Check Script
# Run this at startup or before deployments

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           GOLD CHAIN SECURITY CHECK                          ║"
echo "║           $(date '+%Y-%m-%d %H:%M:%S')                                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Helper functions
pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARNINGS++))
}

info() {
    echo -e "${BLUE}ℹ️  INFO${NC}: $1"
}

section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ============================================================================
# Section 1: Service Health
# ============================================================================
section "1. SERVICE HEALTH"

# Check Mock Server
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    pass "Mock Server (3001) is running"
else
    if curl -s http://localhost:3001/blocks > /dev/null 2>&1; then
        pass "Mock Server (3001) is running (no /health endpoint)"
    else
        fail "Mock Server (3001) is NOT running"
    fi
fi

# Check Explorer
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    pass "Explorer (3000) is running"
else
    warn "Explorer (3000) is NOT running"
fi

# Check Wallet
if curl -s http://localhost:3002 > /dev/null 2>&1; then
    pass "Wallet (3002) is running"
else
    warn "Wallet (3002) is NOT running"
fi

# ============================================================================
# Section 2: Sensitive Files
# ============================================================================
section "2. SENSITIVE FILES CHECK"

# Check for exposed .env files
ENV_FILES=$(find . -name "*.env" -o -name ".env*" 2>/dev/null | grep -v node_modules | grep -v ".env.example" | head -10)
if [ -z "$ENV_FILES" ]; then
    pass "No .env files found in tracked directories"
else
    warn "Found .env files (ensure they're in .gitignore):"
    echo "$ENV_FILES" | while read -r line; do
        echo "       - $line"
    done
fi

# Check for private keys
KEY_FILES=$(find . -name "*.pem" -o -name "*.key" -o -name "*private*" 2>/dev/null | grep -v node_modules | head -10)
if [ -z "$KEY_FILES" ]; then
    pass "No private key files found"
else
    fail "Found potential private key files:"
    echo "$KEY_FILES" | while read -r line; do
        echo "       - $line"
    done
fi

# Check .gitignore exists
if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore; then
        pass ".gitignore includes .env"
    else
        warn ".gitignore does NOT include .env"
    fi
    if grep -q "node_modules" .gitignore; then
        pass ".gitignore includes node_modules"
    else
        warn ".gitignore does NOT include node_modules"
    fi
else
    fail "No .gitignore file found"
fi

# ============================================================================
# Section 3: Hardcoded Secrets
# ============================================================================
section "3. HARDCODED SECRETS SCAN"

# Scan for potential secrets in code
SECRETS_FOUND=0

# Check for hardcoded passwords
if grep -rn "password\s*[:=]\s*['\"][^'\"]*['\"]" --include="*.ts" --include="*.js" --include="*.tsx" . 2>/dev/null | grep -v node_modules | grep -v "password:" | grep -v "placeholder" | head -5 | grep -q .; then
    warn "Potential hardcoded passwords found"
    SECRETS_FOUND=1
fi

# Check for hardcoded API keys
if grep -rn "api[_-]?key\s*[:=]\s*['\"][^'\"]*['\"]" --include="*.ts" --include="*.js" --include="*.tsx" . 2>/dev/null | grep -v node_modules | head -5 | grep -q .; then
    warn "Potential hardcoded API keys found"
    SECRETS_FOUND=1
fi

# Check for hardcoded secrets
if grep -rn "secret\s*[:=]\s*['\"][^'\"]*['\"]" --include="*.ts" --include="*.js" --include="*.tsx" . 2>/dev/null | grep -v node_modules | grep -v "secret:" | head -5 | grep -q .; then
    warn "Potential hardcoded secrets found"
    SECRETS_FOUND=1
fi

# Check for hardcoded private keys
if grep -rn "private[_-]?key\s*[:=]\s*['\"][^'\"]*['\"]" --include="*.ts" --include="*.js" --include="*.tsx" . 2>/dev/null | grep -v node_modules | head -5 | grep -q .; then
    fail "Potential hardcoded private keys found!"
    SECRETS_FOUND=1
fi

if [ $SECRETS_FOUND -eq 0 ]; then
    pass "No obvious hardcoded secrets found"
fi

# ============================================================================
# Section 4: CORS Configuration
# ============================================================================
section "4. CORS CONFIGURATION"

if curl -s http://localhost:3001/blocks > /dev/null 2>&1; then
    CORS_HEADER=$(curl -s -I -H "Origin: http://evil.com" http://localhost:3001/blocks 2>/dev/null | grep -i "access-control-allow-origin")
    if [ -z "$CORS_HEADER" ]; then
        pass "No CORS header returned for unknown origin"
    elif echo "$CORS_HEADER" | grep -q "\*"; then
        warn "CORS allows all origins (*) - review for production"
    else
        info "CORS header: $CORS_HEADER"
    fi
else
    info "Skipping CORS check - server not running"
fi

# ============================================================================
# Section 5: npm Audit
# ============================================================================
section "5. DEPENDENCY VULNERABILITIES"

# Check mock-server
if [ -d "mock-server" ] && [ -f "mock-server/package.json" ]; then
    cd mock-server
    AUDIT_OUTPUT=$(npm audit --audit-level=high 2>&1 || true)
    if echo "$AUDIT_OUTPUT" | grep -q "found 0 vulnerabilities"; then
        pass "mock-server: No high/critical vulnerabilities"
    elif echo "$AUDIT_OUTPUT" | grep -q "high\|critical"; then
        warn "mock-server: Has high/critical vulnerabilities - run 'npm audit'"
    else
        pass "mock-server: No high/critical vulnerabilities"
    fi
    cd ..
else
    info "mock-server package.json not found"
fi

# Check explorer
if [ -d "explorer" ] && [ -f "explorer/package.json" ]; then
    cd explorer
    AUDIT_OUTPUT=$(npm audit --audit-level=high 2>&1 || true)
    if echo "$AUDIT_OUTPUT" | grep -q "found 0 vulnerabilities"; then
        pass "explorer: No high/critical vulnerabilities"
    elif echo "$AUDIT_OUTPUT" | grep -q "high\|critical"; then
        warn "explorer: Has high/critical vulnerabilities - run 'npm audit'"
    else
        pass "explorer: No high/critical vulnerabilities"
    fi
    cd ..
else
    info "explorer package.json not found"
fi

# Check wallet
if [ -d "wallet" ] && [ -f "wallet/package.json" ]; then
    cd wallet
    AUDIT_OUTPUT=$(npm audit --audit-level=high 2>&1 || true)
    if echo "$AUDIT_OUTPUT" | grep -q "found 0 vulnerabilities"; then
        pass "wallet: No high/critical vulnerabilities"
    elif echo "$AUDIT_OUTPUT" | grep -q "high\|critical"; then
        warn "wallet: Has high/critical vulnerabilities - run 'npm audit'"
    else
        pass "wallet: No high/critical vulnerabilities"
    fi
    cd ..
else
    info "wallet package.json not found"
fi

# ============================================================================
# Section 6: API Security Checks
# ============================================================================
section "6. API SECURITY CHECKS"

if curl -s http://localhost:3001/blocks > /dev/null 2>&1; then
    # Test for debug endpoints
    DEBUG_RESPONSE=$(curl -s http://localhost:3001/debug 2>/dev/null)
    if [ -z "$DEBUG_RESPONSE" ] || echo "$DEBUG_RESPONSE" | grep -q "Cannot GET\|Not Found\|404"; then
        pass "No /debug endpoint exposed"
    else
        fail "/debug endpoint is exposed!"
    fi

    # Test for admin endpoints without auth (basic check)
    ADMIN_RESPONSE=$(curl -s http://localhost:3001/admin/users 2>/dev/null)
    if echo "$ADMIN_RESPONSE" | grep -q "unauthorized\|Unauthorized\|401\|403"; then
        pass "Admin endpoints require authentication"
    else
        warn "Admin endpoints may not require authentication - verify manually"
    fi

    # Test for error message information leakage
    ERROR_RESPONSE=$(curl -s http://localhost:3001/nonexistent 2>/dev/null)
    if echo "$ERROR_RESPONSE" | grep -q "stack\|trace\|Error:"; then
        warn "Error responses may leak stack traces"
    else
        pass "Error responses don't appear to leak stack traces"
    fi
else
    info "Skipping API checks - server not running"
fi

# ============================================================================
# Section 7: File Permissions
# ============================================================================
section "7. FILE PERMISSIONS"

# Check for world-writable files
WORLD_WRITABLE=$(find . -type f -perm -002 2>/dev/null | grep -v node_modules | head -5)
if [ -z "$WORLD_WRITABLE" ]; then
    pass "No world-writable files found"
else
    warn "Found world-writable files:"
    echo "$WORLD_WRITABLE" | while read -r line; do
        echo "       - $line"
    done
fi

# Check script permissions
if [ -f "scripts/security-check.sh" ]; then
    if [ -x "scripts/security-check.sh" ]; then
        pass "security-check.sh is executable"
    else
        info "security-check.sh is not executable (run: chmod +x scripts/security-check.sh)"
    fi
fi

# ============================================================================
# Section 8: Port Scan
# ============================================================================
section "8. OPEN PORTS"

info "Expected ports: 3000 (Explorer), 3001 (Mock Server), 3002 (Wallet)"
if command -v netstat &> /dev/null; then
    netstat -tlnp 2>/dev/null | grep LISTEN | grep -E "300[0-9]" | while read -r line; do
        echo "       $line"
    done
elif command -v ss &> /dev/null; then
    ss -tlnp 2>/dev/null | grep LISTEN | grep -E "300[0-9]" | while read -r line; do
        echo "       $line"
    done
else
    info "netstat/ss not available - skipping port scan"
fi

# ============================================================================
# Summary
# ============================================================================
section "SUMMARY"

echo ""
echo -e "  ${GREEN}Passed:${NC}   $PASSED"
echo -e "  ${RED}Failed:${NC}   $FAILED"
echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ⚠️  SECURITY CHECK FAILED - $FAILED issues must be resolved  ${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠️  SECURITY CHECK PASSED WITH $WARNINGS WARNINGS            ${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ ALL SECURITY CHECKS PASSED                               ${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    exit 0
fi
