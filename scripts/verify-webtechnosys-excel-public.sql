\set ON_ERROR_STOP on
SET SESSION AUTHORIZATION aifrogi_public;
SELECT set_config('app.organization_id','cmumdx1sx000801kx9bsxq6f4',false);
SELECT set_config('app.property_id','cmumdx1t0000b01kxql82a3f3',false);
SELECT set_config('app.security_actor','public-bot:webtechnosys-fresh-ai-bot-03e89f',false);
SELECT set_config('app.system_purpose','PUBLIC_ANSWER',false);
SELECT evidence_id,title,source_url
FROM aifrogi_security.shared_answer_spreadsheet_evidence(
  'cmumdx1t0000b01kxql82a3f3','Can you tell me about AI Filmmaking?',5
);
RESET SESSION AUTHORIZATION;
