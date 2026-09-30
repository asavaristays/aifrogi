\set ON_ERROR_STOP on
INSERT INTO "Organization"(id,name,slug,"ownerName","ownerEmail","updatedAt") VALUES('gov-org','Governance Test','gov-test','Owner','owner@test.invalid',clock_timestamp()) ON CONFLICT DO NOTHING;
INSERT INTO "Property"(id,"organizationId",name,slug,"updatedAt") VALUES('gov-property','gov-org','Governance Property','gov-property',clock_timestamp()) ON CONFLICT DO NOTHING;
SET SESSION AUTHORIZATION aifrogi_platform_admin;
SELECT set_config('app.system_purpose','PLATFORM_ADMIN',false),set_config('app.security_actor','admin-one',false);
SELECT aifrogi_security.record_governance_control('EXCEPTION','owner','reviewer',ARRAY['STYLE'],'reason','no authority change','["test"]',clock_timestamp()+interval '1 day',clock_timestamp()+interval '12 hours',repeat('a',64),'admin-one') AS governance_id \gset
SELECT aifrogi_security.request_material_approval('ACTIVATE_RELEASE','gov-property',repeat('b',64),'admin-one',clock_timestamp()+interval '1 day','admin-one') AS approval_id \gset
SELECT aifrogi_security.approve_material_action(:'approval_id','admin-two','admin-one');
SELECT aifrogi_security.consume_material_approval(:'approval_id','ACTIVATE_RELEASE','gov-property',repeat('b',64),'admin-one');
SELECT aifrogi_security.queue_repair_command('gov-property','RECRAWL','repair-1',1,'coverage','{"source":"website"}',repeat('c',64),'admin-one') AS repair_id \gset
SELECT aifrogi_security.queue_repair_command('gov-property','RECRAWL','repair-1',1,'coverage','{"source":"website"}',repeat('c',64),'admin-one') AS repair_duplicate_id \gset
SELECT aifrogi_security.issue_break_glass('INC-TEST-1','admin-one',ARRAY['CLOSE_FACTUAL_EDGE'],'incident',clock_timestamp()+interval '30 minutes','admin-one') AS grant_id \gset
SELECT aifrogi_security.review_break_glass(:'grant_id','admin-two','admin-one');
SELECT set_config('test.approval_id',:'approval_id',false);
DO $$ BEGIN
 IF current_setting('test.approval_id') IS NULL THEN RAISE EXCEPTION 'APPROVAL_ID_MISSING'; END IF;
 IF (SELECT count(*) FROM "GovernedRepairCommand" WHERE "idempotencyKey"='repair-1')<>1 THEN RAISE EXCEPTION 'REPAIR_NOT_IDEMPOTENT'; END IF;
 IF (SELECT state FROM "MaterialApproval" WHERE id=current_setting('test.approval_id'))<>'EXECUTED' THEN RAISE EXCEPTION 'APPROVAL_NOT_CONSUMED'; END IF;
 IF (SELECT count(*) FROM "BreakGlassGrant" WHERE "reviewedBy"='admin-two')<>1 THEN RAISE EXCEPTION 'BREAKGLASS_NOT_REVIEWED'; END IF;
END $$;
DO $$ BEGIN PERFORM aifrogi_security.record_governance_control('EXCEPTION','owner','reviewer',ARRAY['TENANT_ISOLATION'],'reason','impact','["test"]',clock_timestamp()+interval '1 day',clock_timestamp()+interval '12 hours',repeat('d',64),'admin-one'); RAISE EXCEPTION 'NON_WAIVABLE_ACCEPTED'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'GOVERNANCE_CONTROL_INVALID' THEN RAISE; END IF; END $$;
DO $$ BEGIN PERFORM aifrogi_security.approve_material_action(current_setting('test.approval_id'),'admin-one','admin-one'); RAISE EXCEPTION 'SELF_APPROVAL_ACCEPTED'; EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'TWO_PERSON_APPROVAL_DENIED' THEN RAISE; END IF; END $$;
RESET SESSION AUTHORIZATION;
SELECT 'GOVERNED_CONTROL_PLANE_PASS' AS result;
