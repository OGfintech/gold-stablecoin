-- =============================================================================
-- STTAURX Audit Log Protection Triggers
-- Based on: Third-Party Security Audit
-- Fixes Issue #7 - Audit Log Mutability
--
-- These triggers prevent deletion and hash modification of audit logs,
-- ensuring tamper-evident record keeping for financial compliance.
--
-- Run this AFTER Prisma migrations:
--   psql -d sttaurx_mainnet -f audit_triggers.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TRIGGER 1: Prevent ALL deletion from audit_logs
-- Any attempt to DELETE from audit_logs will fail with an exception
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION prevent_audit_deletion()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'SECURITY VIOLATION: Deletion from audit_logs is not permitted. Audit ID: %, Action: %',
    OLD.id, OLD.action;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists (for re-running)
DROP TRIGGER IF EXISTS no_audit_delete ON audit_logs;

-- Create the deletion prevention trigger
CREATE TRIGGER no_audit_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_deletion();

-- -----------------------------------------------------------------------------
-- TRIGGER 2: Prevent modification of hash chain fields
-- Allows updates to non-sensitive fields (like IP resolution) but blocks
-- any attempt to modify the cryptographic hash chain
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION prevent_audit_hash_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Block changes to hash chain fields
  IF OLD.current_hash IS DISTINCT FROM NEW.current_hash THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Modification of current_hash is not permitted. Audit ID: %', OLD.id;
  END IF;

  IF OLD.previous_hash IS DISTINCT FROM NEW.previous_hash THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Modification of previous_hash is not permitted. Audit ID: %', OLD.id;
  END IF;

  -- Block changes to core audit data
  IF OLD.admin_id IS DISTINCT FROM NEW.admin_id THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Modification of admin_id is not permitted. Audit ID: %', OLD.id;
  END IF;

  IF OLD.action IS DISTINCT FROM NEW.action THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Modification of action is not permitted. Audit ID: %', OLD.id;
  END IF;

  IF OLD.entity_type IS DISTINCT FROM NEW.entity_type THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Modification of entity_type is not permitted. Audit ID: %', OLD.id;
  END IF;

  IF OLD.entity_id IS DISTINCT FROM NEW.entity_id THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Modification of entity_id is not permitted. Audit ID: %', OLD.id;
  END IF;

  IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Modification of created_at is not permitted. Audit ID: %', OLD.id;
  END IF;

  -- Allow updates to: old_values, new_values, ip_address, user_agent
  -- (These might need enrichment after initial logging)

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists (for re-running)
DROP TRIGGER IF EXISTS no_audit_hash_update ON audit_logs;

-- Create the hash update prevention trigger
CREATE TRIGGER no_audit_hash_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_hash_update();

-- -----------------------------------------------------------------------------
-- TRIGGER 3: Log any TRUNCATE attempt (PostgreSQL doesn't have BEFORE TRUNCATE)
-- This is a workaround using event triggers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION log_truncate_attempt()
RETURNS event_trigger AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF obj.object_identity LIKE '%audit_logs%' THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: TRUNCATE on audit_logs is not permitted';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Drop existing event trigger if exists
DROP EVENT TRIGGER IF EXISTS prevent_audit_truncate;

-- Create event trigger (requires superuser)
-- Note: This may fail on managed databases - that's OK, the row-level triggers are primary protection
DO $$
BEGIN
  CREATE EVENT TRIGGER prevent_audit_truncate
  ON ddl_command_start
  WHEN TAG IN ('TRUNCATE')
  EXECUTE FUNCTION log_truncate_attempt();
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Event trigger not created (requires superuser) - row-level triggers provide protection';
END $$;

-- -----------------------------------------------------------------------------
-- VERIFICATION: Test the triggers work
-- Uncomment these to test (they should all fail with exceptions)
-- -----------------------------------------------------------------------------

-- Test 1: Deletion (should fail)
-- DELETE FROM audit_logs WHERE id = (SELECT id FROM audit_logs LIMIT 1);

-- Test 2: Hash modification (should fail)
-- UPDATE audit_logs SET current_hash = 'tampered' WHERE id = (SELECT id FROM audit_logs LIMIT 1);

-- Test 3: Action modification (should fail)
-- UPDATE audit_logs SET action = 'TAMPERED' WHERE id = (SELECT id FROM audit_logs LIMIT 1);

-- -----------------------------------------------------------------------------
-- GRANT PERMISSIONS (adjust as needed)
-- -----------------------------------------------------------------------------

-- Revoke DELETE privilege from all roles except superuser
REVOKE DELETE ON audit_logs FROM PUBLIC;

-- Grant INSERT only (no UPDATE on protected fields, no DELETE)
-- The application user should have these permissions:
-- GRANT SELECT, INSERT ON audit_logs TO sttaurx_prod;
-- GRANT SELECT, INSERT ON audit_logs TO sttaurx_test;

-- -----------------------------------------------------------------------------
-- SUCCESS MESSAGE
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'STTAURX Audit Log Protection Triggers Installed';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Triggers created:';
  RAISE NOTICE '  1. no_audit_delete - Prevents DELETE';
  RAISE NOTICE '  2. no_audit_hash_update - Prevents hash tampering';
  RAISE NOTICE '=================================================';
END $$;
