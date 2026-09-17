-- Adds the narrow member-to-tenant bootstrap required after RLS activation.
-- It exposes no tenant rows; the returned id is immediately used to establish
-- normal RLS context for the authenticated member.
BEGIN;

CREATE OR REPLACE FUNCTION aifrogi_security.resolve_member_organization(requested_email text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT m."organizationId"
  FROM public."OrganizationMember" m
  WHERE lower(m.email) = lower(requested_email)
    AND m.status = 'ACTIVE'
  ORDER BY m."createdAt" ASC
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION aifrogi_security.resolve_member_organization(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.resolve_member_organization(text) TO leados_app;

COMMIT;
