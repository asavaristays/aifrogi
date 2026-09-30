-- psql-only disposable rehearsal. NOT authorized for production.
-- Required variables: migration_batch_id, filesystem_inventory, commit_backfill.
\set ON_ERROR_STOP on
-- Missing required variables fail during psql substitution. Callers must pass
-- migration_batch_id, filesystem_inventory and commit_backfill explicitly.

BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='120s';
SET LOCAL app.platform_authority='true';
SELECT set_config('app.migration_batch_id', :'migration_batch_id', true);
DO $$ BEGIN
 IF current_database() !~ '_p2b_rehearsal$' THEN RAISE EXCEPTION 'DISPOSABLE_DATABASE_SUFFIX_REQUIRED'; END IF;
 IF EXISTS (SELECT 1 FROM "KnowledgeServingPointer") THEN RAISE EXCEPTION 'SERVING_POINTER_PRESENT'; END IF;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.det_id(p_kind text,p_property text,p_legacy text) RETURNS text LANGUAGE sql IMMUTABLE STRICT AS $$ SELECT 'p2v6_'||substr(encode(digest(convert_to('P2A_V6_ID_V1'||E'\x1f'||p_kind||E'\x1f'||p_property||E'\x1f'||p_legacy,'UTF8'),'sha256'),'hex'),1,27) $$;
CREATE OR REPLACE FUNCTION pg_temp.row_hash(p_value jsonb) RETURNS text LANGUAGE sql IMMUTABLE STRICT AS $$ SELECT encode(digest(convert_to('PG14_JSONB_V1'||E'\x1f'||p_value::text,'UTF8'),'sha256'),'hex') $$;

CREATE TEMP TABLE p2a_filesystem_inventory(property_id text NOT NULL,legacy_id text NOT NULL,absolute_path text NOT NULL,byte_size bigint NOT NULL CHECK(byte_size>=0),content_sha256 text NOT NULL CHECK(content_sha256~'^[0-9a-f]{64}$'),source_id text,consent_id text,PRIMARY KEY(property_id,legacy_id)) ON COMMIT DROP;
COPY p2a_filesystem_inventory(property_id,legacy_id,absolute_path,byte_size,content_sha256,source_id,consent_id) FROM :'filesystem_inventory' WITH (FORMAT csv,HEADER true);

LOCK TABLE "KnowledgeEntry","KnowledgeDocument","Property" IN SHARE MODE;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM "Property" WHERE "organizationId" IS NULL) THEN RAISE EXCEPTION 'PROPERTY_WITHOUT_ORGANIZATION'; END IF;
 IF EXISTS (SELECT 1 FROM p2a_filesystem_inventory f LEFT JOIN "Property" p ON p.id=f.property_id WHERE p.id IS NULL) THEN RAISE EXCEPTION 'INVENTORY_UNKNOWN_PROPERTY'; END IF;
 IF EXISTS (SELECT 1 FROM p2a_filesystem_inventory GROUP BY content_sha256 HAVING count(DISTINCT byte_size)>1) THEN RAISE EXCEPTION 'HASH_SIZE_CONTRADICTION'; END IF;
END $$;

INSERT INTO "KnowledgeMigrationDecision"(id,"propertyId","legacyEntryId","batchId",decision,"reasonCode","proposedStableKey","sourceHash","createdAt")
SELECT pg_temp.det_id('entry',e."propertyId",e.id),e."propertyId",e.id,current_setting('app.migration_batch_id'),CASE WHEN e."claimKey" IS NULL OR btrim(e."claimKey")='' OR e.version<1 THEN 'QUARANTINE' ELSE 'MAP' END,CASE WHEN e."claimKey" IS NULL OR btrim(e."claimKey")='' THEN 'MISSING_CLAIM_KEY' WHEN e.version<1 THEN 'INVALID_VERSION' ELSE 'DETERMINISTIC_V1' END,CASE WHEN e."claimKey" IS NULL OR btrim(e."claimKey")='' THEN NULL ELSE encode(digest(convert_to('P2A_V6_STABLE_V1'||E'\x1f'||e."propertyId"||E'\x1f'||lower(btrim(e."claimKey")),'UTF8'),'sha256'),'hex') END,pg_temp.row_hash(to_jsonb(e)),clock_timestamp() FROM "KnowledgeEntry" e
ON CONFLICT ("batchId","legacyEntryId") DO UPDATE SET decision=EXCLUDED.decision,"reasonCode"=EXCLUDED."reasonCode","proposedStableKey"=EXCLUDED."proposedStableKey","sourceHash"=EXCLUDED."sourceHash";

-- Retained DB documents have an explicit durable quarantine decision until an
-- exact source/consent mapping exists. Nothing is guessed from a slug or URL.
INSERT INTO "KnowledgeMigrationArtifactDecision"(id,"propertyId","batchId","artifactType","legacyId","contentHash",decision,"reasonCode","createdAt")
SELECT pg_temp.det_id('document',d."propertyId",d.id),d."propertyId",current_setting('app.migration_batch_id'),'KNOWLEDGE_DOCUMENT',d.id,encode(digest(d.content,'sha256'),'hex'),'QUARANTINE','NO_EXACT_AUTHORIZED_SOURCE',clock_timestamp() FROM "KnowledgeDocument" d
ON CONFLICT ("batchId","artifactType","legacyId") DO UPDATE SET "contentHash"=EXCLUDED."contentHash",decision=EXCLUDED.decision,"reasonCode"=EXCLUDED."reasonCode";

-- Files remain QUARANTINE even with an exact source tuple. Inventory hashes are
-- declarations, not byte verification/import evidence, so this backfill never
-- labels a filesystem artifact MAP.
INSERT INTO "KnowledgeMigrationArtifactDecision"(id,"propertyId","batchId","artifactType","legacyId","sourcePathHash","contentHash",decision,"reasonCode","sourceId","createdAt")
SELECT pg_temp.det_id('file',f.property_id,f.legacy_id),f.property_id,current_setting('app.migration_batch_id'),'FILESYSTEM',f.legacy_id,encode(digest(convert_to(f.absolute_path,'UTF8'),'sha256'),'hex'),f.content_sha256,'QUARANTINE',CASE WHEN s.id IS NULL THEN 'SOURCE_NOT_EXACT' WHEN c.id IS NULL THEN 'CONSENT_NOT_EXACT' WHEN s.state<>'AUTHORIZED' THEN 'SOURCE_NOT_AUTHORIZED' WHEN c.status='REVOKED' OR c."revokedAt" IS NOT NULL THEN 'CONSENT_REVOKED' WHEN NOT(c."authorityScope" @> '{"capture":true}'::jsonb) THEN 'CAPTURE_OUT_OF_SCOPE' WHEN COALESCE(c."effectiveFrom",c."trialAuthorizedAt")>clock_timestamp() OR COALESCE(c."effectiveUntil",c."trialExpiresAt")<=clock_timestamp() THEN 'CONSENT_NOT_CURRENT' ELSE 'PENDING_BYTE_VERIFICATION_AND_IMPORT' END,s.id,clock_timestamp() FROM p2a_filesystem_inventory f LEFT JOIN "KnowledgeSource" s ON (s."propertyId",s.id)=(f.property_id,f.source_id) LEFT JOIN "WebsiteSourceConsent" c ON (c."propertyId",c."sourceId",c.id)=(f.property_id,s.id,f.consent_id) AND c."canonicalIdentityHash"=s."canonicalIdentityHash"
ON CONFLICT ("batchId","artifactType","legacyId") DO UPDATE SET "sourcePathHash"=EXCLUDED."sourcePathHash","contentHash"=EXCLUDED."contentHash",decision=EXCLUDED.decision,"reasonCode"=EXCLUDED."reasonCode","sourceId"=EXCLUDED."sourceId";

INSERT INTO "KnowledgeClaimIdentity"(id,"propertyId","stableKey","entityKey","fieldKey",qualifiers,"keyVersion","createdAt") SELECT pg_temp.det_id('identity',d."propertyId",d."proposedStableKey"),d."propertyId",d."proposedStableKey",'legacy:'||min(d."legacyEntryId"),'answer','{}'::jsonb,1,clock_timestamp() FROM "KnowledgeMigrationDecision" d WHERE d."batchId"=current_setting('app.migration_batch_id') AND d.decision='MAP' GROUP BY d."propertyId",d."proposedStableKey" ON CONFLICT ("propertyId","stableKey") DO NOTHING;
UPDATE "KnowledgeEntry" e SET "claimIdentityId"=pg_temp.det_id('identity',e."propertyId",d."proposedStableKey"),"revisionNumber"=e.version,"normalizedValue"=jsonb_build_object('type',e."valueType",'value',e.answer,'currency',e.currency),"valueHash"=pg_temp.row_hash(jsonb_build_object('type',e."valueType",'value',e.answer,'currency',e.currency)),audience='RESTRICTED',"verificationStatus"='UNSUPPORTED',"requiredComponents"=ARRAY['entity','value']::text[],"revisionState"='DRAFT' FROM "KnowledgeMigrationDecision" d WHERE d."batchId"=current_setting('app.migration_batch_id') AND d.decision='MAP' AND e.id=d."legacyEntryId" AND e."propertyId"=d."propertyId" AND e."sealedAt" IS NULL;

DO $$ DECLARE entries bigint; ed bigint; docs bigint; dd bigint; files bigint; fd bigint; mapped bigint; linked bigint; BEGIN
 SELECT count(*) INTO entries FROM "KnowledgeEntry"; SELECT count(*) INTO ed FROM "KnowledgeMigrationDecision" WHERE "batchId"=current_setting('app.migration_batch_id');
 SELECT count(*) INTO docs FROM "KnowledgeDocument"; SELECT count(*) INTO dd FROM "KnowledgeMigrationArtifactDecision" WHERE "batchId"=current_setting('app.migration_batch_id') AND "artifactType"='KNOWLEDGE_DOCUMENT';
 SELECT count(*) INTO files FROM p2a_filesystem_inventory; SELECT count(*) INTO fd FROM "KnowledgeMigrationArtifactDecision" WHERE "batchId"=current_setting('app.migration_batch_id') AND "artifactType"='FILESYSTEM';
 SELECT count(*) INTO mapped FROM "KnowledgeMigrationDecision" WHERE "batchId"=current_setting('app.migration_batch_id') AND decision='MAP'; SELECT count(*) INTO linked FROM "KnowledgeEntry" e JOIN "KnowledgeMigrationDecision" d ON (d."propertyId",d."legacyEntryId")=(e."propertyId",e.id) WHERE d."batchId"=current_setting('app.migration_batch_id') AND d.decision='MAP' AND e."claimIdentityId" IS NOT NULL;
 IF entries<>ed OR docs<>dd OR files<>fd OR mapped<>linked THEN RAISE EXCEPTION 'PARITY_ABORT entries=%/% docs=%/% files=%/% mapped=%/%',entries,ed,docs,dd,files,fd,mapped,linked; END IF;
 IF EXISTS(SELECT 1 FROM "KnowledgeServingPointer") OR EXISTS(SELECT 1 FROM "KnowledgeEntry" WHERE "sealedAt" IS NOT NULL) THEN RAISE EXCEPTION 'BACKFILL_CROSSED_PUBLICATION_BARRIER'; END IF;
 RAISE NOTICE 'PARITY_PASS entries=% documents=% files=% mapped=%',entries,docs,files,mapped;
END $$;

\if :commit_backfill
  COMMIT;
  \echo 'P2A_V6_BACKFILL_COMMITTED'
\else
  ROLLBACK;
  \echo 'P2A_V6_BACKFILL_REHEARSED_AND_ROLLED_BACK'
\endif
