-- =============================================================================
-- Migration: 00026_update_passwords_sunfraa.sql
-- Description: Set passwords of all active accounts to 'sunfraa@1234'
-- =============================================================================

UPDATE auth.users
SET encrypted_password = crypt('sunfraa@1234', gen_salt('bf')),
    updated_at = now();
