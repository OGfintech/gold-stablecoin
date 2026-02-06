/**
 * STTAURX Input Validation Middleware
 * Schema-based validation for critical endpoints
 *
 * Security Hardening — Phase 4: Input Validation
 */

/**
 * Hex string validator
 */
function isValidHex(str, length = null) {
  if (typeof str !== 'string') return false;
  if (length && str.length !== length) return false;
  return /^[0-9a-fA-F]+$/.test(str);
}

/**
 * Token amount validator (must be positive BigInt-compatible string)
 */
function isValidAmount(amount) {
  if (typeof amount !== 'string' && typeof amount !== 'number') return false;
  try {
    const val = BigInt(amount);
    return val > BigInt(0);
  } catch {
    return false;
  }
}

/**
 * Validate transfer request
 */
function validateTransfer(req, res, next) {
  const { from, to, amount, public_key, nonce, signature } = req.body;
  const errors = [];

  if (!from || !isValidHex(from, 64)) {
    errors.push('Invalid "from" address: must be 64-char hex');
  }
  if (!to || !isValidHex(to, 64)) {
    errors.push('Invalid "to" address: must be 64-char hex');
  }
  if (!amount || !isValidAmount(amount)) {
    errors.push('Invalid "amount": must be a positive integer string');
  }
  if (from && to && from === to) {
    errors.push('Cannot transfer to same address');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: errors });
  }
  next();
}

/**
 * Validate mint request
 */
function validateMint(req, res, next) {
  const { admin_address, amount, certificate_id } = req.body;
  const errors = [];

  if (!admin_address || !isValidHex(admin_address, 64)) {
    errors.push('Invalid "admin_address": must be 64-char hex');
  }
  if (amount !== undefined && !isValidAmount(amount)) {
    errors.push('Invalid "amount": must be a positive integer string');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: errors });
  }
  next();
}

/**
 * Validate staking request
 */
function validateStake(req, res, next) {
  const { address, amount, lockPeriod } = req.body;
  const errors = [];

  if (!address || typeof address !== 'string' || address.length < 10) {
    errors.push('Invalid "address"');
  }
  if (!amount || !isValidAmount(amount)) {
    errors.push('Invalid "amount": must be a positive integer string');
  }
  if (lockPeriod !== undefined) {
    const validPeriods = [0, 90, 180];
    if (!validPeriods.includes(lockPeriod)) {
      errors.push('Invalid "lockPeriod": must be 0, 90, or 180');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: errors });
  }
  next();
}

/**
 * Validate unstake request
 */
function validateUnstake(req, res, next) {
  const { address, amount } = req.body;
  const errors = [];

  if (!address || typeof address !== 'string') {
    errors.push('Invalid "address"');
  }
  if (!amount || !isValidAmount(amount)) {
    errors.push('Invalid "amount": must be a positive integer string');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: errors });
  }
  next();
}

/**
 * Validate yield rate update
 */
function validateYieldRate(req, res, next) {
  const { rate } = req.body;
  const errors = [];

  if (rate === undefined || typeof rate !== 'number') {
    errors.push('"rate" is required and must be a number');
  } else if (rate < 0 || rate > 0.5) {
    errors.push('"rate" must be between 0 and 0.5 (0% - 50%)');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: errors });
  }
  next();
}

/**
 * Validate marketplace commodity creation/update
 * Whitelist allowed fields to prevent mass assignment
 */
function validateCommodity(req, res, next) {
  const allowed = ['name', 'category', 'description', 'quantity', 'unit', 'pricePerUnit', 'minOrderQuantity', 'origin', 'certifications'];
  const errors = [];

  // Strip non-allowed fields
  const sanitized = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      sanitized[key] = req.body[key];
    }
  }

  if (!sanitized.name || typeof sanitized.name !== 'string') {
    errors.push('"name" is required');
  }
  if (sanitized.quantity !== undefined && (typeof sanitized.quantity !== 'number' || sanitized.quantity < 0)) {
    errors.push('"quantity" must be a non-negative number');
  }
  if (sanitized.pricePerUnit !== undefined) {
    const price = parseFloat(sanitized.pricePerUnit);
    if (isNaN(price) || price < 0) {
      errors.push('"pricePerUnit" must be a non-negative number');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: errors });
  }

  // Replace body with sanitized version
  req.validatedBody = sanitized;
  next();
}

/**
 * Validate marketplace order creation
 */
function validateOrder(req, res, next) {
  const { commodityId, buyerId, buyerName, quantity } = req.body;
  const errors = [];

  if (!commodityId || typeof commodityId !== 'string') {
    errors.push('"commodityId" is required');
  }
  if (!buyerId || typeof buyerId !== 'string') {
    errors.push('"buyerId" is required');
  }
  if (!quantity || typeof quantity !== 'number' || quantity <= 0 || !Number.isFinite(quantity)) {
    errors.push('"quantity" must be a positive finite number');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: errors });
  }
  next();
}

module.exports = {
  validateTransfer,
  validateMint,
  validateStake,
  validateUnstake,
  validateYieldRate,
  validateCommodity,
  validateOrder,
  isValidHex,
  isValidAmount
};
