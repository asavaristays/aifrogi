-- Operator-run only, after rolling back the application and stopping owner
-- capture requests. This removes only the additive review bridge. Existing
-- captures, approved knowledge, publications and audit records are preserved.
BEGIN;
DROP FUNCTION aifrogi_security.owner_crawl_review_rows(text,text);
DROP FUNCTION aifrogi_security.worker_capture_source(text);
DROP FUNCTION aifrogi_security.begin_owner_website_capture(text,text,text);
COMMIT;
