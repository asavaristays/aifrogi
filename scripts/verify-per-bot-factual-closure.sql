\set ON_ERROR_STOP on

INSERT INTO "Organization"(id,name,slug,"ownerName","ownerEmail","updatedAt")
VALUES('org-closure-test','Closure Test','closure-test','Owner','owner@example.test',clock_timestamp());
INSERT INTO "Property"(id,"organizationId",name,slug,"updatedAt")
VALUES('property-closure-a','org-closure-test','Bot A','closure-a',clock_timestamp()),
      ('property-closure-b','org-closure-test','Bot B','closure-b',clock_timestamp());

SET SESSION AUTHORIZATION leados_app;
SELECT set_config('app.platform_authority','true',false),set_config('app.security_actor','admin-closure',false);
SELECT aifrogi_security.set_bot_factual_closure('property-closure-a',true,0,'INC-100','Suspected source integrity issue','admin-closure');

DO $$ BEGIN
 IF aifrogi_security.is_bot_factual_open('property-closure-a') THEN RAISE EXCEPTION 'CLOSED_BOT_REPORTED_OPEN'; END IF;
 IF NOT aifrogi_security.is_bot_factual_open('property-closure-b') THEN RAISE EXCEPTION 'UNRELATED_BOT_CLOSED'; END IF;
 BEGIN
  PERFORM aifrogi_security.set_bot_factual_closure('property-closure-a',false,0,'INC-100','stale reopen','admin-closure');
  RAISE EXCEPTION 'STALE_CLOSURE_UPDATE_ACCEPTED';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'BOT_CLOSURE_VERSION_CONFLICT' THEN RAISE; END IF; END;
 BEGIN
  PERFORM aifrogi_security.set_bot_factual_closure('property-closure-a',false,1,'','missing incident','admin-closure');
  RAISE EXCEPTION 'UNJUSTIFIED_CLOSURE_UPDATE_ACCEPTED';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'CLOSURE_JUSTIFICATION_REQUIRED' THEN RAISE; END IF; END;
END $$;
SELECT aifrogi_security.set_bot_factual_closure('property-closure-a',false,1,'INC-100','Integrity confirmed and incident resolved','admin-closure');
RESET SESSION AUTHORIZATION;

DO $$ BEGIN
 IF (SELECT version FROM "BotFactualServingControl" WHERE "propertyId"='property-closure-a')<>2 THEN RAISE EXCEPTION 'CLOSURE_VERSION_WRONG'; END IF;
 IF (SELECT count(*) FROM "BotFactualServingControlEvent" WHERE "propertyId"='property-closure-a')<>2 THEN RAISE EXCEPTION 'CLOSURE_AUDIT_INCOMPLETE'; END IF;
 IF has_table_privilege('leados_app','"BotFactualServingControl"','UPDATE') THEN RAISE EXCEPTION 'DIRECT_CLOSURE_UPDATE_ALLOWED'; END IF;
 IF has_function_privilege('aifrogi_public','aifrogi_security.set_bot_factual_closure(text,boolean,bigint,text,text,text)','EXECUTE') THEN RAISE EXCEPTION 'PUBLIC_CAN_CHANGE_CLOSURE'; END IF;
END $$;

SET SESSION AUTHORIZATION aifrogi_public;
SELECT set_config('app.organization_id','org-closure-test',false),set_config('app.property_id','property-closure-a',false),set_config('app.security_actor','public:test',false);
DO $$ BEGIN
 IF NOT aifrogi_security.is_bot_factual_open('property-closure-a') THEN RAISE EXCEPTION 'REOPEN_DID_NOT_TAKE_EFFECT'; END IF;
END $$;
RESET SESSION AUTHORIZATION;

SELECT 'PER_BOT_FACTUAL_CLOSURE_PASS' AS result;
