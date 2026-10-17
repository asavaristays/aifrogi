-- Roll back application callers first. Preserve knowledge, approvals and grants.
DROP FUNCTION IF EXISTS aifrogi_security.provision_owner_answer_preview(text,text);
DROP FUNCTION IF EXISTS aifrogi_security.sync_website_bot_runtime(text,text);
