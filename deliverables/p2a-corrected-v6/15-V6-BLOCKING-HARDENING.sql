-- P2-A v6 mandatory hardening. Execute immediately after 03-PROPOSED-DDL.sql
-- in the same migration transaction. This is proposed SQL; it has NOT been applied.
-- Runtime transactions use READ COMMITTED. Parent FOR UPDATE locks serialize
-- membership changes with sealing; no weaker isolation contract is assumed.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE OR REPLACE FUNCTION aifrogi_security.current_principal() RETURNS text
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
  SELECT NULLIF(current_setting('app.security_actor',true),'')
$$;
CREATE OR REPLACE FUNCTION aifrogi_security.current_purpose() RETURNS text
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
  SELECT NULLIF(current_setting('app.system_purpose',true),'')
$$;
CREATE OR REPLACE FUNCTION aifrogi_security.current_session_hash() RETURNS text
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
  SELECT NULLIF(current_setting('app.guest_session_hash',true),'')
$$;

CREATE OR REPLACE FUNCTION aifrogi_security.require_context(
  p_property text, p_role name, p_purposes text[], p_principal text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path=pg_catalog,public AS $$
DECLARE expected_org text; ctx_org text; ctx_property text; ctx_actor text; ctx_purpose text;
BEGIN
  ctx_org := NULLIF(current_setting('app.organization_id',true),'');
  ctx_property := NULLIF(current_setting('app.property_id',true),'');
  ctx_actor := NULLIF(current_setting('app.security_actor',true),'');
  ctx_purpose := NULLIF(current_setting('app.system_purpose',true),'');
  SELECT "organizationId" INTO expected_org FROM public."Property" WHERE id=p_property;
  IF expected_org IS NULL OR ctx_org IS DISTINCT FROM expected_org OR ctx_property IS DISTINCT FROM p_property
     OR ctx_actor IS NULL OR ctx_purpose IS NULL OR NOT (ctx_purpose=ANY(p_purposes))
     OR session_user::name IS DISTINCT FROM p_role
     OR NOT EXISTS (SELECT 1 FROM public."KnowledgeRuntimePrincipalGrant" g WHERE g."propertyId"=p_property AND g."principalId"=ctx_actor AND g."databaseRole"=p_role::text AND g.purpose=ctx_purpose AND g."revokedAt" IS NULL AND (g."expiresAt" IS NULL OR g."expiresAt">clock_timestamp()))
     OR (p_principal IS NOT NULL AND ctx_actor IS DISTINCT FROM p_principal) THEN
    RAISE EXCEPTION 'AUTHORITY_CONTEXT_DENIED' USING ERRCODE='42501';
  END IF;
END $$;

REVOKE ALL ON FUNCTION aifrogi_security.current_principal(),aifrogi_security.current_purpose(),aifrogi_security.current_session_hash(),aifrogi_security.require_context(text,name,text[],text) FROM PUBLIC;

-- Part 3 creates all v6 tables, bigint columns, exact composite keys and FKs.

CREATE OR REPLACE FUNCTION aifrogi_security.guard_sealed_evidence() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE prop text; ent text; closed timestamptz;
BEGIN
  IF TG_OP='UPDATE' AND (OLD."propertyId",OLD."entryId") IS DISTINCT FROM (NEW."propertyId",NEW."entryId") THEN RAISE EXCEPTION 'EVIDENCE_REPARENTING_FORBIDDEN'; END IF;
  prop:=CASE WHEN TG_OP='INSERT' THEN NEW."propertyId" ELSE OLD."propertyId" END;
  ent:=CASE WHEN TG_OP='INSERT' THEN NEW."entryId" ELSE OLD."entryId" END;
  SELECT "sealedAt" INTO closed FROM public."KnowledgeEntry" WHERE "propertyId"=prop AND id=ent FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ENTRY_NOT_FOUND'; END IF;
  IF closed IS NOT NULL THEN RAISE EXCEPTION 'SEALED_EVIDENCE_IMMUTABLE'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.guard_publication_membership() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE prop text; pub text; closed timestamptz;
BEGIN
  IF TG_OP='UPDATE' AND (OLD."propertyId",OLD."publicationId") IS DISTINCT FROM (NEW."propertyId",NEW."publicationId") THEN RAISE EXCEPTION 'PUBLICATION_REPARENTING_FORBIDDEN'; END IF;
  prop:=CASE WHEN TG_OP='INSERT' THEN NEW."propertyId" ELSE OLD."propertyId" END;
  pub:=CASE WHEN TG_OP='INSERT' THEN NEW."publicationId" ELSE OLD."publicationId" END;
  SELECT "membershipClosedAt" INTO closed FROM public."KnowledgePublication" WHERE "propertyId"=prop AND id=pub FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PUBLICATION_NOT_FOUND'; END IF;
  IF closed IS NOT NULL THEN RAISE EXCEPTION 'PUBLICATION_MEMBERSHIP_CLOSED'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;

-- Consent is effective only for the exact source, PUBLIC-compatible scope,
-- current time, and the highest-precedence non-revoked authorization.
CREATE OR REPLACE FUNCTION aifrogi_security.consent_precedence(p_basis text) RETURNS int
LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$
 SELECT CASE p_basis WHEN 'SIGNED_LETTER' THEN 400 WHEN 'EMAIL' THEN 300 WHEN 'TRIAL_TERMS' THEN 200 ELSE 0 END
$$;
CREATE OR REPLACE FUNCTION aifrogi_security.validate_source_consent() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE c public."WebsiteSourceConsent"%ROWTYPE; s public."KnowledgeSource"%ROWTYPE;
BEGIN
 IF TG_TABLE_NAME='WebsiteSourceConsent' THEN
   IF NEW."sourceId" IS NULL THEN
     IF TG_OP='INSERT' OR OLD."sourceId" IS NOT NULL THEN RAISE EXCEPTION 'NEW_CONSENT_REQUIRES_EXACT_SOURCE'; END IF;
     RETURN NEW;
   END IF;
   SELECT * INTO STRICT s FROM public."KnowledgeSource" WHERE "propertyId"=NEW."propertyId" AND id=NEW."sourceId" FOR UPDATE;
   c:=NEW;
 ELSE
   SELECT * INTO STRICT s FROM public."KnowledgeSource" WHERE "propertyId"=NEW."propertyId" AND id=NEW."sourceId" FOR UPDATE;
   SELECT * INTO STRICT c FROM public."WebsiteSourceConsent" WHERE "propertyId"=NEW."propertyId" AND id=NEW."consentId" FOR SHARE;
 END IF;
 IF c."sourceId" IS DISTINCT FROM NEW."sourceId" OR c."sourceType"::text IS DISTINCT FROM s."sourceType"::text OR c."canonicalIdentityHash" IS DISTINCT FROM s."canonicalIdentityHash" THEN RAISE EXCEPTION 'CONSENT_SOURCE_IDENTITY_MISMATCH'; END IF;
 IF TG_TABLE_NAME='WebsiteSourceConsent' THEN
   IF NEW.status='REVOKED' THEN
     IF NEW."revokedAt" IS NULL OR NEW."revokedBy" IS NULL OR NEW."revocationReason" IS NULL THEN RAISE EXCEPTION 'CONSENT_REVOCATION_INCOMPLETE'; END IF;
     RETURN NEW;
   END IF;
 END IF;
 IF c."sourceId" IS DISTINCT FROM NEW."sourceId" OR c."sourceType"::text IS DISTINCT FROM s."sourceType"::text
    OR c."canonicalIdentityHash" IS DISTINCT FROM s."canonicalIdentityHash" OR c.status NOT IN ('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED')
    OR c."authorityScope" IS NULL OR NOT (c."authorityScope" @> '{"capture":true}'::jsonb)
    OR c."audienceCeiling" NOT IN ('PUBLIC','RESTRICTED') OR COALESCE(c."effectiveFrom",c."trialAuthorizedAt")>clock_timestamp()
    OR (c."effectiveUntil" IS NOT NULL AND c."effectiveUntil"<=clock_timestamp())
    OR c."revokedAt" IS NOT NULL OR aifrogi_security.consent_precedence(COALESCE(c."postTrialMethod"::text,'TRIAL_TERMS'))=0
    OR EXISTS (SELECT 1 FROM public."WebsiteSourceConsent" newer WHERE newer."propertyId"=c."propertyId" AND newer."sourceId"=c."sourceId" AND newer.status IN ('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED') AND newer."revokedAt" IS NULL AND COALESCE(newer."effectiveFrom",newer."trialAuthorizedAt")<=clock_timestamp() AND COALESCE(newer."effectiveUntil",newer."trialExpiresAt")>clock_timestamp() AND (aifrogi_security.consent_precedence(COALESCE(newer."postTrialMethod"::text,'TRIAL_TERMS'))>aifrogi_security.consent_precedence(COALESCE(c."postTrialMethod"::text,'TRIAL_TERMS')) OR (aifrogi_security.consent_precedence(COALESCE(newer."postTrialMethod"::text,'TRIAL_TERMS'))=aifrogi_security.consent_precedence(COALESCE(c."postTrialMethod"::text,'TRIAL_TERMS')) AND COALESCE(newer."effectiveFrom",newer."trialAuthorizedAt")>COALESCE(c."effectiveFrom",c."trialAuthorizedAt"))))
 THEN RAISE EXCEPTION 'SOURCE_CONSENT_NOT_CURRENT_OR_SCOPED'; END IF;
 RETURN NEW;
END $$;

-- Every privileged entry point below authenticates transaction context and
-- role membership. Actor/worker arguments are correlation values, not authority.
CREATE OR REPLACE FUNCTION aifrogi_security.seal_claim_revision(p_property text,p_entry text,p_actor text,p_policy text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE e public."KnowledgeEntry"%ROWTYPE; identity_qualifiers jsonb; required text[]; covered text[]; bindings jsonb; m jsonb; h text; generation bigint;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PUBLISH'],p_actor);
 SELECT * INTO STRICT e FROM public."KnowledgeEntry" WHERE "propertyId"=p_property AND id=p_entry FOR UPDATE;
 IF e."sealedAt" IS NOT NULL OR e."revisionState"<>'DRAFT' THEN RAISE EXCEPTION 'REVISION_NOT_DRAFT'; END IF;
 IF e."claimIdentityId" IS NULL OR e."revisionNumber" IS NULL OR e."normalizedValue" IS NULL OR e."valueHash" IS NULL OR e.audience IS NULL OR e."verificationStatus"<>'SUPPORTED' OR cardinality(e."requiredComponents")=0 THEN RAISE EXCEPTION 'REVISION_INCOMPLETE'; END IF;
 SELECT qualifiers INTO STRICT identity_qualifiers FROM public."KnowledgeClaimIdentity" WHERE ("propertyId",id)=(p_property,e."claimIdentityId") FOR SHARE;
 SELECT "eligibilityGeneration" INTO STRICT generation FROM public."PropertyIntelligencePolicy" WHERE "propertyId"=p_property FOR SHARE;
 SELECT COALESCE(array_agg(DISTINCT component ORDER BY component),ARRAY[]::text[]) INTO covered FROM public."KnowledgeRevisionEvidenceBinding" b JOIN public."KnowledgeClaimEvidence" ev ON (ev."propertyId",ev."entryId",ev.id)=(b."propertyId",b."entryId",b."evidenceId") JOIN public."CaptureVersion" cv ON (cv."propertyId",cv.id)=(ev."propertyId",ev."captureVersionId") JOIN public."KnowledgeObject" ko ON (ko."propertyId",ko.id)=(cv."propertyId",cv."objectId") AND ko.state='USABLE' JOIN public."SourceCapture" sc ON (sc."propertyId",sc.id)=(cv."propertyId",cv."captureId") AND sc.status='SUCCEEDED' JOIN public."KnowledgeSource" ks ON (ks."propertyId",ks.id)=(sc."propertyId",sc."sourceId") AND ks.state='AUTHORIZED' AND ks."revokedAt" IS NULL JOIN public."KnowledgeSourceRevision" sr ON (sr."propertyId",sr."sourceId",sr.id)=(sc."propertyId",sc."sourceId",sc."sourceRevisionId") JOIN public."WebsiteSourceConsent" c ON (c."propertyId",c."sourceId",c.id)=(sr."propertyId",sr."sourceId",sr."consentId") AND c.status IN ('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED') AND c."revokedAt" IS NULL AND COALESCE(c."effectiveFrom",c."trialAuthorizedAt")<=clock_timestamp() AND COALESCE(c."effectiveUntil",c."trialExpiresAt")>clock_timestamp() AND c."authorityScope" @> '{"capture":true}'::jsonb CROSS JOIN LATERAL unnest(ev."supportedComponents") component WHERE b."propertyId"=p_property AND b."entryId"=p_entry;
 SELECT COALESCE(jsonb_agg(jsonb_build_object('evidenceId',ev.id,'captureVersionId',ev."captureVersionId",'locator',ev.locator,'locatorHash',ev."locatorHash",'quotation',ev.quotation,'quotationHash',ev."quotationHash",'supportedComponents',ev."supportedComponents",'bindingHash',b."bindingHash") ORDER BY b."bindingHash"),'[]'::jsonb) INTO bindings FROM public."KnowledgeRevisionEvidenceBinding" b JOIN public."KnowledgeClaimEvidence" ev ON (ev."propertyId",ev."entryId",ev.id)=(b."propertyId",b."entryId",b."evidenceId") WHERE b."propertyId"=p_property AND b."entryId"=p_entry;
 required:=ARRAY(SELECT DISTINCT x FROM unnest(e."requiredComponents") x ORDER BY x);
 IF bindings='[]'::jsonb OR NOT(covered @> required) THEN RAISE EXCEPTION 'FULL_STATEMENT_EVIDENCE_INSUFFICIENT'; END IF;
 m:=jsonb_build_object('canonicalizer','PG14_JSONB_V1','propertyId',e."propertyId",'entryId',e.id,'claimIdentityId',e."claimIdentityId",'qualifiers',identity_qualifiers,'revisionNumber',e."revisionNumber",'normalizedValue',e."normalizedValue",'valueHash',e."valueHash",'answer',e.answer,'quoteText',e."quoteText",'audience',e.audience,'effectiveFrom',e."effectiveFrom",'effectiveUntil',e."effectiveUntil",'policyVersion',p_policy,'eligibilityGeneration',generation,'requiredComponents',required,'bindings',bindings);
 h:=aifrogi_security.hash_json(m);
 UPDATE public."KnowledgeEntry" SET "sealManifestHash"=h,"sealPolicyVersion"=p_policy,"sealedAt"=clock_timestamp(),"sealedBy"=p_actor,"revisionState"='SEALED',"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_entry;
 RETURN h;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.seal_publication(p_property text,p_publication text,p_actor text,p_generation bigint)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE p public."KnowledgePublication"%ROWTYPE; members jsonb; m jsonb; h text; current_g bigint;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PUBLISH'],p_actor);
 SELECT * INTO STRICT p FROM public."KnowledgePublication" WHERE "propertyId"=p_property AND id=p_publication FOR UPDATE;
 SELECT "eligibilityGeneration" INTO STRICT current_g FROM public."PropertyIntelligencePolicy" WHERE "propertyId"=p_property FOR SHARE;
 IF current_g<>p_generation OR p.state<>'CANDIDATE' OR p."membershipClosedAt" IS NOT NULL THEN RAISE EXCEPTION 'PUBLICATION_STALE_OR_NOT_CANDIDATE'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public."KnowledgePublicationClaim" WHERE "propertyId"=p_property AND "publicationId"=p_publication) THEN RAISE EXCEPTION 'EMPTY_PUBLICATION'; END IF;
 IF EXISTS (SELECT 1 FROM public."KnowledgePublicationClaim" pc WHERE pc."propertyId"=p_property AND pc."publicationId"=p_publication AND NOT aifrogi_security.eligible_claim(p_property,pc."entryId",p.audience,clock_timestamp(),current_g)) THEN RAISE EXCEPTION 'PUBLICATION_HAS_INELIGIBLE_CLAIM'; END IF;
 SELECT jsonb_agg(jsonb_build_object('claimIdentityId',pc."claimIdentityId",'entryId',pc."entryId",'sealManifestHash',pc."sealManifestHash") ORDER BY pc."claimIdentityId",pc."entryId") INTO members FROM public."KnowledgePublicationClaim" pc WHERE pc."propertyId"=p_property AND pc."publicationId"=p_publication;
 m:=jsonb_build_object('canonicalizer','PG14_JSONB_V1','propertyId',p."propertyId",'audience',p.audience,'policyVersion',p."policyVersion",'evidencePolicyVersion',p."evidencePolicyVersion",'approvalId',p."approvalId",'claims',members);
 h:=aifrogi_security.hash_json(m);
 IF NOT EXISTS (SELECT 1 FROM public."KnowledgeApprovalEvidence" a WHERE a."propertyId"=p_property AND a.id=p."approvalId" AND a.purpose='PUBLICATION_AUTHORIZATION' AND a.decision='APPROVED' AND a.audience=p.audience AND a."policyVersion"=p."policyVersion" AND a."scopeHash"=h) THEN RAISE EXCEPTION 'EXACT_PUBLICATION_AUTHORIZATION_MISSING'; END IF;
 UPDATE public."KnowledgePublication" SET "manifestHash"=h,state='SEALED',"sealedAt"=clock_timestamp(),"membershipClosedAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_publication; RETURN h;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.advance_serving_pointer(p_property text,p_audience public."KnowledgeAudience",p_publication text,p_expected_generation bigint,p_actor text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE p public."KnowledgePublication"%ROWTYPE; g bigint; eg bigint;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PUBLISH'],p_actor);
 SELECT * INTO STRICT p FROM public."KnowledgePublication" WHERE "propertyId"=p_property AND id=p_publication FOR SHARE;
 SELECT "eligibilityGeneration" INTO STRICT eg FROM public."PropertyIntelligencePolicy" WHERE "propertyId"=p_property FOR UPDATE;
 IF p.audience<>p_audience OR p.state<>'SEALED' OR p."membershipClosedAt" IS NULL OR p."revokedAt" IS NOT NULL THEN RAISE EXCEPTION 'PUBLICATION_NOT_SERVABLE'; END IF;
 IF EXISTS (SELECT 1 FROM public."KnowledgePublicationClaim" pc WHERE pc."propertyId"=p_property AND pc."publicationId"=p_publication AND NOT aifrogi_security.eligible_claim(p_property,pc."entryId",p_audience,clock_timestamp(),eg)) THEN RAISE EXCEPTION 'PUBLICATION_CURRENTLY_INELIGIBLE'; END IF;
 UPDATE public."KnowledgeServingPointer" SET "publicationId"=p_publication,"pointerGeneration"="pointerGeneration"+1,"eligibilityGeneration"=eg,"updatedBy"=p_actor,"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property AND audience=p_audience AND "pointerGeneration"=p_expected_generation RETURNING "pointerGeneration" INTO g;
 IF FOUND THEN RETURN g; END IF; IF p_expected_generation<>0 THEN RAISE EXCEPTION 'POINTER_GENERATION_CONFLICT'; END IF;
 INSERT INTO public."KnowledgeServingPointer"(id,"propertyId",audience,"publicationId","pointerGeneration","eligibilityGeneration","updatedBy","updatedAt") VALUES(gen_random_uuid()::text,p_property,p_audience,p_publication,1,eg,p_actor,clock_timestamp()) RETURNING "pointerGeneration" INTO g; RETURN g;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.revoke_source(p_property text,p_source text,p_actor text,p_reason text,p_operation_key text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE g bigint;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_REVOKE'],p_actor);
 PERFORM 1 FROM public."KnowledgeSource" WHERE "propertyId"=p_property AND id=p_source FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'SOURCE_NOT_FOUND'; END IF;
 UPDATE public."KnowledgeSource" SET state='REVOKED',"revokedAt"=COALESCE("revokedAt",clock_timestamp()),"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_source;
 UPDATE public."WebsiteSourceConsent" SET status='REVOKED',"revokedAt"=COALESCE("revokedAt",clock_timestamp()),"revokedBy"=p_actor,"revocationReason"=p_reason,"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property AND "sourceId"=p_source AND status<>'REVOKED';
 UPDATE public."PropertyIntelligencePolicy" SET "eligibilityGeneration"="eligibilityGeneration"+1,"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property RETURNING "eligibilityGeneration" INTO STRICT g;
 UPDATE public."KnowledgeServingPointer" SET "eligibilityGeneration"=g,"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property;
 INSERT INTO public."KnowledgeOutboxEvent"(id,"propertyId","operationKey","eventType","schemaVersion",payload,state,"availableAt",attempts,"createdAt") VALUES(gen_random_uuid()::text,p_property,p_operation_key,'KNOWLEDGE_SOURCE_REVOKED',1,jsonb_build_object('sourceId',p_source,'generation',g),'PENDING',clock_timestamp(),0,clock_timestamp()) ON CONFLICT ("propertyId","operationKey","eventType","schemaVersion") DO NOTHING; RETURN g;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.eligible_public_claims(p_property text,p_expected_generation bigint)
RETURNS TABLE(entry_id text,claim_identity_id text,normalized_value jsonb,quote_text text,seal_hash text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE current_g bigint;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_public',ARRAY['PUBLIC_ANSWER'],NULL);
 SELECT "eligibilityGeneration" INTO STRICT current_g FROM public."PropertyIntelligencePolicy" WHERE "propertyId"=p_property;
 IF current_g<>p_expected_generation THEN RAISE EXCEPTION 'ELIGIBILITY_GENERATION_STALE'; END IF;
 RETURN QUERY SELECT e.id,e."claimIdentityId",e."normalizedValue",e."quoteText",e."sealManifestHash" FROM public."KnowledgeServingPointer" sp JOIN public."KnowledgePublication" p ON (p."propertyId",p.audience,p.id)=(sp."propertyId",sp.audience,sp."publicationId") JOIN public."KnowledgePublicationClaim" pc ON pc."propertyId"=p."propertyId" AND pc."publicationId"=p.id JOIN public."KnowledgeEntry" e ON (e."propertyId",e."claimIdentityId",e.id,e."sealManifestHash")=(pc."propertyId",pc."claimIdentityId",pc."entryId",pc."sealManifestHash") WHERE sp."propertyId"=p_property AND sp.audience='PUBLIC' AND sp."eligibilityGeneration"=current_g AND p.state='SEALED' AND p."revokedAt" IS NULL AND aifrogi_security.eligible_claim(p_property,e.id,'PUBLIC',clock_timestamp(),current_g);
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.authorize_guest(p_property text,p_conversation text,p_session_hash text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],NULL);
 IF aifrogi_security.current_session_hash() IS DISTINCT FROM p_session_hash THEN RETURN false; END IF;
 RETURN EXISTS (SELECT 1 FROM public."KnowledgeGuestSession" s WHERE s."propertyId"=p_property AND s."conversationId"=p_conversation AND s."sessionHash"=p_session_hash AND s."revokedAt" IS NULL AND s."expiresAt">clock_timestamp());
END $$;

DROP FUNCTION IF EXISTS aifrogi_security.record_answer_pending(text,text,text,text,bigint,bigint,jsonb,jsonb);
CREATE OR REPLACE FUNCTION aifrogi_security.record_answer_pending(p_property text,p_conversation text,p_session_hash text,p_entry_ids text[])
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE sid text; aid text:=gen_random_uuid()::text; pub text; pg bigint; eg bigint; selected jsonb; matched int;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],NULL);
 IF NOT aifrogi_security.authorize_guest(p_property,p_conversation,p_session_hash) THEN RAISE EXCEPTION 'GUEST_SESSION_UNAUTHORIZED'; END IF;
 SELECT id INTO STRICT sid FROM public."KnowledgeGuestSession" WHERE "propertyId"=p_property AND "conversationId"=p_conversation AND "sessionHash"=p_session_hash FOR SHARE;
 SELECT sp."publicationId",sp."pointerGeneration",pip."eligibilityGeneration" INTO STRICT pub,pg,eg FROM public."KnowledgeServingPointer" sp JOIN public."PropertyIntelligencePolicy" pip ON pip."propertyId"=sp."propertyId" WHERE sp."propertyId"=p_property AND sp.audience='PUBLIC' FOR SHARE OF sp,pip;
 SELECT count(DISTINCT e.id),COALESCE(jsonb_agg(jsonb_build_object('entryId',e.id,'identityId',e."claimIdentityId",'seal',e."sealManifestHash",'answerText',e.answer,'quoteText',e."quoteText",'evidence',ev.evidence) ORDER BY e.id),'[]'::jsonb) INTO matched,selected FROM public."KnowledgePublicationClaim" pc JOIN public."KnowledgeEntry" e ON (e."propertyId",e."claimIdentityId",e.id,e."sealManifestHash")=(pc."propertyId",pc."claimIdentityId",pc."entryId",pc."sealManifestHash") JOIN LATERAL (SELECT jsonb_agg(jsonb_build_object('evidenceId',x.id,'bindingHash',b."bindingHash") ORDER BY x.id) evidence FROM public."KnowledgeRevisionEvidenceBinding" b JOIN public."KnowledgeClaimEvidence" x ON (x."propertyId",x."entryId",x.id)=(b."propertyId",b."entryId",b."evidenceId") WHERE b."propertyId"=e."propertyId" AND b."entryId"=e.id) ev ON true WHERE pc."propertyId"=p_property AND pc."publicationId"=pub AND e.id=ANY(p_entry_ids) AND aifrogi_security.eligible_claim(p_property,e.id,'PUBLIC',clock_timestamp(),eg);
 IF cardinality(p_entry_ids)=0 OR matched<>cardinality(p_entry_ids) OR EXISTS (SELECT 1 FROM unnest(p_entry_ids) x GROUP BY x HAVING count(*)>1) THEN RAISE EXCEPTION 'ANSWER_SELECTION_NOT_EXACTLY_ELIGIBLE'; END IF;
 INSERT INTO public."KnowledgeAnswerAudit"(id,"propertyId","conversationId","guestSessionId","publicationId","pointerGeneration","eligibilityGeneration","selectedManifest","selectedManifestHash","validationResult","deliveryState","createdAt") VALUES(aid,p_property,p_conversation,sid,pub,pg,eg,selected,aifrogi_security.hash_json(selected),jsonb_build_object('derivedBy','record_answer_pending/v6','eligible',true),'PENDING',clock_timestamp()); RETURN aid;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.record_answer_outcome(p_property text,p_answer text,p_delivery_key text,p_state public."AnswerDeliveryState",p_detail jsonb)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE oid text:=gen_random_uuid()::text; a public."KnowledgeAnswerAudit"%ROWTYPE; current_g bigint;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],NULL);
 SELECT * INTO STRICT a FROM public."KnowledgeAnswerAudit" WHERE "propertyId"=p_property AND id=p_answer FOR SHARE;
 IF NOT EXISTS (SELECT 1 FROM public."KnowledgeGuestSession" s WHERE s."propertyId"=p_property AND s.id=a."guestSessionId" AND s."conversationId"=a."conversationId" AND s."sessionHash"=aifrogi_security.current_session_hash()) THEN RAISE EXCEPTION 'DELIVERY_SESSION_UNAUTHORIZED'; END IF;
 IF p_state='DELIVERED' AND NOT EXISTS (SELECT 1 FROM public."KnowledgeGuestSession" s WHERE s."propertyId"=p_property AND s.id=a."guestSessionId" AND s."revokedAt" IS NULL AND s."expiresAt">clock_timestamp()) THEN RAISE EXCEPTION 'DELIVERY_SESSION_INACTIVE'; END IF;
 SELECT "eligibilityGeneration" INTO STRICT current_g FROM public."PropertyIntelligencePolicy" WHERE "propertyId"=p_property FOR SHARE;
 IF p_state='DELIVERED' AND (current_g<>a."eligibilityGeneration" OR EXISTS (SELECT 1 FROM jsonb_array_elements(a."selectedManifest") x WHERE NOT aifrogi_security.eligible_claim(p_property,x->>'entryId','PUBLIC',clock_timestamp(),current_g))) THEN RAISE EXCEPTION 'DELIVERY_REVALIDATION_FAILED'; END IF;
 IF p_state='DELIVERED' AND (
   p_detail#>>'{answerBinding,answerText}' IS DISTINCT FROM (SELECT string_agg(x.value->>'answerText',E'\n' ORDER BY x.ordinality) FROM jsonb_array_elements(a."selectedManifest") WITH ORDINALITY x(value,ordinality))
   OR p_detail#>>'{answerBinding,answerSha256}' IS DISTINCT FROM encode(digest(convert_to(p_detail#>>'{answerBinding,answerText}','UTF8'),'sha256'),'hex')
   OR p_detail#>'{answerBinding,manifestEntryIds}' IS DISTINCT FROM (SELECT jsonb_agg(x.value->>'entryId' ORDER BY x.ordinality) FROM jsonb_array_elements(a."selectedManifest") WITH ORDINALITY x(value,ordinality))
 ) THEN RAISE EXCEPTION 'DELIVERED_ANSWER_NOT_BOUND_TO_MANIFEST'; END IF;
 IF p_state='PENDING' THEN RAISE EXCEPTION 'OUTCOME_CANNOT_BE_PENDING'; END IF;
 INSERT INTO public."KnowledgeAnswerOutcome"(id,"propertyId","answerAuditId","deliveryKey",state,detail,"occurredAt") VALUES(oid,p_property,p_answer,p_delivery_key,p_state,p_detail,clock_timestamp()) ON CONFLICT ("propertyId","answerAuditId","deliveryKey") DO NOTHING; SELECT id INTO STRICT oid FROM public."KnowledgeAnswerOutcome" WHERE "propertyId"=p_property AND "answerAuditId"=p_answer AND "deliveryKey"=p_delivery_key; RETURN oid;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.answer_outcome_state(p_property text,p_answer text,p_delivery_key text)
RETURNS public."AnswerDeliveryState" LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result public."AnswerDeliveryState";
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],NULL);
 IF NOT EXISTS (SELECT 1 FROM public."KnowledgeAnswerAudit" a JOIN public."KnowledgeGuestSession" s ON (s."propertyId",s.id,s."conversationId")=(a."propertyId",a."guestSessionId",a."conversationId") WHERE a."propertyId"=p_property AND a.id=p_answer AND s."sessionHash"=aifrogi_security.current_session_hash()) THEN RAISE EXCEPTION 'DELIVERY_SESSION_UNAUTHORIZED'; END IF;
 SELECT state INTO STRICT result FROM public."KnowledgeAnswerOutcome" WHERE "propertyId"=p_property AND "answerAuditId"=p_answer AND "deliveryKey"=p_delivery_key;
 RETURN result;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.answer_delivery_manifest(p_property text,p_answer text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE a public."KnowledgeAnswerAudit"%ROWTYPE;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],NULL);
 SELECT * INTO STRICT a FROM public."KnowledgeAnswerAudit" WHERE "propertyId"=p_property AND id=p_answer FOR SHARE;
 IF NOT EXISTS (SELECT 1 FROM public."KnowledgeGuestSession" s WHERE s."propertyId"=p_property AND s.id=a."guestSessionId" AND s."conversationId"=a."conversationId" AND s."sessionHash"=aifrogi_security.current_session_hash() AND s."revokedAt" IS NULL AND s."expiresAt">clock_timestamp()) THEN RAISE EXCEPTION 'DELIVERY_SESSION_UNAUTHORIZED'; END IF;
 PERFORM 1 FROM public."PropertyIntelligencePolicy" WHERE "propertyId"=p_property FOR SHARE;
 RETURN a."selectedManifest";
END $$;

ALTER FUNCTION aifrogi_security.record_handover(text,text,text,text,text) RENAME TO record_handover_unchecked;
ALTER FUNCTION aifrogi_security.append_handover_event(text,text,"HandoverState",int,text,text,text,text) RENAME TO append_handover_event_unchecked;
CREATE FUNCTION aifrogi_security.record_handover(p_property text,p_conversation text,p_session_hash text,p_request_hash text,p_actor text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],p_actor);
 IF NOT aifrogi_security.authorize_guest(p_property,p_conversation,p_session_hash) THEN RAISE EXCEPTION 'GUEST_SESSION_UNAUTHORIZED'; END IF;
 RETURN aifrogi_security.record_handover_unchecked(p_property,p_conversation,p_session_hash,p_request_hash,p_actor);
END $$;
CREATE FUNCTION aifrogi_security.append_handover_event(p_property text,p_request text,p_state public."HandoverState",p_attempt int,p_provider text,p_delivery text,p_error text,p_actor text)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],p_actor);
 RETURN aifrogi_security.append_handover_event_unchecked(p_property,p_request,p_state,p_attempt,p_provider,p_delivery,p_error,p_actor);
END $$;

-- Worker acquisition/finalization holds policy/source/consent rows, rejects
-- blocked/removed/stale work, and bounds every lease operation.
CREATE OR REPLACE FUNCTION aifrogi_security.assert_capture_authorized(p_property text,p_operation_key text,p_generation bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE cap public."SourceCapture"%ROWTYPE; src public."KnowledgeSource"%ROWTYPE; pol public."PropertyIntelligencePolicy"%ROWTYPE; mode public."KnowledgePolicyMode";
BEGIN
 SELECT * INTO STRICT pol FROM public."PropertyIntelligencePolicy" WHERE "propertyId"=p_property FOR SHARE;
 SELECT k.mode INTO STRICT mode FROM public."KnowledgePolicyVersion" k WHERE (k."propertyId",k.id)=(pol."propertyId",pol."currentPolicyVersionId");
 IF mode='BLOCKED' OR pol."eligibilityGeneration"<>p_generation THEN RAISE EXCEPTION 'PROPERTY_BLOCKED_OR_GENERATION_STALE'; END IF;
 SELECT * INTO STRICT cap FROM public."SourceCapture" WHERE "propertyId"=p_property AND "operationKey"=p_operation_key FOR SHARE;
 SELECT * INTO STRICT src FROM public."KnowledgeSource" WHERE "propertyId"=p_property AND id=cap."sourceId" FOR SHARE;
 IF cap."requestedGeneration"<>p_generation OR src.state<>'AUTHORIZED' OR src."revokedAt" IS NOT NULL OR NOT EXISTS (SELECT 1 FROM public."KnowledgeSourceRevision" r JOIN public."WebsiteSourceConsent" c ON (c."propertyId",c.id)=(r."propertyId",r."consentId") WHERE (r."propertyId",r."sourceId",r.id)=(cap."propertyId",cap."sourceId",cap."sourceRevisionId") AND c.status IN ('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED') AND c."revokedAt" IS NULL AND COALESCE(c."effectiveFrom",c."trialAuthorizedAt")<=clock_timestamp() AND COALESCE(c."effectiveUntil",c."trialExpiresAt")>clock_timestamp() AND c."authorityScope" @> '{"capture":true}'::jsonb) THEN RAISE EXCEPTION 'CAPTURE_SOURCE_NOT_AUTHORIZED'; END IF;
END $$;

-- Existing v4 job routines remain the only state-mutating bodies. Wrappers
-- below are their mandatory preconditions; deployment renames v4 bodies to
-- *_unchecked and exposes only these signatures in one transaction.
ALTER FUNCTION aifrogi_security.claim_job(text,text,int) RENAME TO claim_job_unchecked;
ALTER FUNCTION aifrogi_security.renew_job(text,text,text,bigint,int) RENAME TO renew_job_unchecked;
ALTER FUNCTION aifrogi_security.reclaim_job(text,text,text,int) RENAME TO reclaim_job_unchecked;
ALTER FUNCTION aifrogi_security.finalize_capture(text,text,text,bigint,int,text,text,text,text,jsonb,text) RENAME TO finalize_capture_unchecked;
CREATE FUNCTION aifrogi_security.claim_job(p_property text,p_worker text,p_lease_seconds int) RETURNS TABLE(job_id text,fence bigint,attempt_number int) LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ DECLARE r record; BEGIN PERFORM aifrogi_security.require_context(p_property,'aifrogi_worker',ARRAY['KNOWLEDGE_CAPTURE'],p_worker); IF p_lease_seconds NOT BETWEEN 1 AND 900 THEN RAISE EXCEPTION 'INVALID_LEASE'; END IF; FOR r IN SELECT * FROM aifrogi_security.claim_job_unchecked(p_property,p_worker,p_lease_seconds) LOOP PERFORM aifrogi_security.assert_capture_authorized(p_property,(SELECT "operationKey" FROM public."AutomationJob" WHERE id=r.job_id),(SELECT "inputGeneration" FROM public."AutomationJob" WHERE id=r.job_id)); job_id:=r.job_id; fence:=r.fence; attempt_number:=r.attempt_number; RETURN NEXT; END LOOP; END $$;
CREATE FUNCTION aifrogi_security.renew_job(p_property text,p_job text,p_worker text,p_fence bigint,p_lease_seconds int) RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ BEGIN PERFORM aifrogi_security.require_context(p_property,'aifrogi_worker',ARRAY['KNOWLEDGE_CAPTURE'],p_worker); IF p_lease_seconds NOT BETWEEN 1 AND 900 THEN RAISE EXCEPTION 'INVALID_LEASE'; END IF; PERFORM aifrogi_security.assert_capture_authorized(p_property,(SELECT "operationKey" FROM public."AutomationJob" WHERE "propertyId"=p_property AND id=p_job),(SELECT "inputGeneration" FROM public."AutomationJob" WHERE "propertyId"=p_property AND id=p_job)); RETURN aifrogi_security.renew_job_unchecked(p_property,p_job,p_worker,p_fence,p_lease_seconds); END $$;
CREATE FUNCTION aifrogi_security.reclaim_job(p_property text,p_job text,p_worker text,p_lease_seconds int) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ BEGIN PERFORM aifrogi_security.require_context(p_property,'aifrogi_worker',ARRAY['KNOWLEDGE_CAPTURE'],p_worker); IF p_lease_seconds NOT BETWEEN 1 AND 900 THEN RAISE EXCEPTION 'INVALID_LEASE'; END IF; PERFORM aifrogi_security.assert_capture_authorized(p_property,(SELECT "operationKey" FROM public."AutomationJob" WHERE "propertyId"=p_property AND id=p_job),(SELECT "inputGeneration" FROM public."AutomationJob" WHERE "propertyId"=p_property AND id=p_job)); RETURN aifrogi_security.reclaim_job_unchecked(p_property,p_job,p_worker,p_lease_seconds); END $$;
CREATE FUNCTION aifrogi_security.finalize_capture(p_property text,p_job text,p_worker text,p_fence bigint,p_generation bigint,p_object text,p_staging_hash text,p_capture text,p_capture_version text,p_manifest jsonb,p_event_type text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE j public."AutomationJob"%ROWTYPE; c public."SourceCapture"%ROWTYPE; o public."KnowledgeObject"%ROWTYPE;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_worker',ARRAY['KNOWLEDGE_CAPTURE'],p_worker);
 SELECT * INTO STRICT j FROM public."AutomationJob" WHERE "propertyId"=p_property AND id=p_job FOR UPDATE;
 IF j.status<>'RUNNING' OR j."lockedBy"<>p_worker OR j."fencingToken"<>p_fence OR j."leaseExpiresAt"<=clock_timestamp() OR j."inputGeneration"<>p_generation THEN RAISE EXCEPTION 'STALE_JOB_FENCE_OR_GENERATION'; END IF;
 PERFORM aifrogi_security.assert_capture_authorized(p_property,j."operationKey",p_generation);
 SELECT * INTO STRICT c FROM public."SourceCapture" WHERE "propertyId"=p_property AND id=p_capture AND "operationKey"=j."operationKey" FOR UPDATE;
 SELECT * INTO STRICT o FROM public."KnowledgeObject" WHERE "propertyId"=p_property AND id=p_object AND state='STAGED' AND "stagingTokenHash"=p_staging_hash FOR UPDATE;
 IF NOT EXISTS (SELECT 1 FROM public."KnowledgeObjectReference" r WHERE r."propertyId"=p_property AND r."objectId"=p_object AND r."sourceId"=c."sourceId" AND r."releasedAt" IS NULL) THEN RAISE EXCEPTION 'OBJECT_CAPTURE_SOURCE_LINK_MISSING'; END IF;
 UPDATE public."KnowledgeObject" SET state='USABLE',"finalizedByJobId"=p_job,"finalizedFence"=p_fence,"usableAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_object;
 INSERT INTO public."CaptureVersion"(id,"propertyId","captureId","objectId",checksum,manifest,"capturedAt","createdAt") VALUES(p_capture_version,p_property,p_capture,p_object,o.checksum,p_manifest,clock_timestamp(),clock_timestamp());
 UPDATE public."SourceCapture" SET status='SUCCEEDED',"completedAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_capture;
 INSERT INTO public."KnowledgeOutboxEvent"(id,"propertyId","operationKey","eventType","schemaVersion",payload,state,"availableAt",attempts,"createdAt") VALUES(gen_random_uuid()::text,p_property,j."operationKey",p_event_type,1,jsonb_build_object('captureVersionId',p_capture_version),'PENDING',clock_timestamp(),0,clock_timestamp());
 UPDATE public."AutomationJobAttempt" SET state='SUCCEEDED',"finishedAt"=clock_timestamp() WHERE "propertyId"=p_property AND "jobId"=p_job AND "fencingToken"=p_fence AND state='RUNNING';
 UPDATE public."AutomationJob" SET status='SUCCEEDED',result=jsonb_build_object('captureVersionId',p_capture_version),"completedAt"=clock_timestamp(),"leaseExpiresAt"=NULL,"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_job;
END $$;

-- All permissive policies on the affected property tables are removed, not
-- merely one expected name. The replacement and role transition are atomic.
DO $rls_base$ DECLARE t text; pol record; tables text[]:=ARRAY['KnowledgeClaimIdentity','KnowledgeSource','KnowledgeSourceRevision','SourceCapture','KnowledgeObject','KnowledgeObjectReference','CaptureVersion','KnowledgeExtractionRun','KnowledgeClaimEvidence','KnowledgeRevisionEvidenceBinding','KnowledgeClaimConflict','KnowledgeApprovalEvidence','KnowledgePublication','KnowledgePublicationClaim','KnowledgeServingPointer','KnowledgePolicyVersion','PropertyIntelligencePolicy','KnowledgePreviewSession','KnowledgePreviewClaim','KnowledgeGuestSession','KnowledgeRevisionEvent','KnowledgeAnswerAudit','KnowledgeAnswerOutcome','KnowledgeHandoverRequest','KnowledgeHandoverEvent','KnowledgeOutboxEvent','AutomationJobAttempt','KnowledgeCertificationRun','KnowledgeRetentionDecision','KnowledgeMigrationDecision','KnowledgeDocument','KnowledgeEntry','KnowledgePreview','KnowledgeAnswerFlag','KnowledgeGap','Conversation','ConversationParticipant','AutomationJob']; BEGIN FOREACH t IN ARRAY tables LOOP FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP EXECUTE format('DROP POLICY %I ON public.%I',pol.policyname,t); END LOOP; EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t); EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',t); EXECUTE format('CREATE POLICY aifrogi_property_isolation ON public.%I FOR ALL USING (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM public."Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id()))) WITH CHECK (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM public."Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())))',t); END LOOP; END $rls_base$;

-- Remaining strengthened tables are reconciled here before any runtime grant.
DO $rls_v6$ DECLARE t text; pol record; BEGIN
 FOREACH t IN ARRAY ARRAY['WebsiteSourceConsent','Participant','Message','KnowledgeRuntimePrincipalGrant'] LOOP
   FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP EXECUTE format('DROP POLICY %I ON public.%I',pol.policyname,t); END LOOP;
   EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
   EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',t);
   EXECUTE format('CREATE POLICY aifrogi_property_isolation ON public.%I FOR ALL USING (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM public."Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id()))) WITH CHECK (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM public."Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())))',t);
 END LOOP;
END $rls_v6$;

DO $role_shape$ DECLARE r record; BEGIN
 FOR r IN SELECT rolname,rolcanlogin,rolbypassrls,rolsuper FROM pg_roles WHERE rolname IN ('aifrogi_web','aifrogi_public','aifrogi_worker','aifrogi_publisher') LOOP
   IF NOT r.rolcanlogin OR r.rolbypassrls OR r.rolsuper THEN RAISE EXCEPTION 'RUNTIME_ROLE_SHAPE_INVALID: %',r.rolname; END IF;
   IF EXISTS (SELECT 1 FROM pg_auth_members m JOIN pg_roles child ON child.oid=m.member JOIN pg_roles parent ON parent.oid=m.roleid WHERE child.rolname=r.rolname OR parent.rolname=r.rolname) THEN RAISE EXCEPTION 'RUNTIME_ROLE_MEMBERSHIP_FORBIDDEN: %',r.rolname; END IF;
 END LOOP;
 IF (SELECT count(*) FROM pg_roles WHERE rolname IN ('aifrogi_web','aifrogi_public','aifrogi_worker','aifrogi_publisher'))<>4 THEN RAISE EXCEPTION 'RUNTIME_ROLES_MISSING'; END IF;
END $role_shape$;

ALTER TABLE "KnowledgeMigrationArtifactDecision" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeMigrationArtifactDecision" FORCE ROW LEVEL SECURITY;
CREATE POLICY aifrogi_property_isolation ON "KnowledgeMigrationArtifactDecision" FOR ALL USING (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id()))) WITH CHECK (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())));

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA aifrogi_security FROM PUBLIC,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher,leados_app;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
REVOKE ALL ON TABLE "KnowledgeServingPointer","KnowledgeAnswerAudit","KnowledgeAnswerOutcome","KnowledgeHandoverRequest","KnowledgeHandoverEvent","AutomationJobAttempt","CaptureVersion","KnowledgeOutboxEvent" FROM leados_app,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT USAGE ON SCHEMA aifrogi_security TO aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT USAGE ON SCHEMA public TO aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.current_property_id(),aifrogi_security.current_organization_id(),aifrogi_security.has_platform_authority() TO aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.current_organization_id(),aifrogi_security.has_platform_authority(),aifrogi_security.is_session_active(text),aifrogi_security.resolve_member_organization(text),aifrogi_security.resolve_property_organization(text),aifrogi_security.resolve_public_bot_organization(text),aifrogi_security.resolve_session_organization(text,text) TO leados_app;
GRANT EXECUTE ON FUNCTION aifrogi_security.authorize_guest(text,text,text),aifrogi_security.record_answer_pending(text,text,text,text[]),aifrogi_security.record_answer_outcome(text,text,text,"AnswerDeliveryState",jsonb),aifrogi_security.answer_outcome_state(text,text,text),aifrogi_security.answer_delivery_manifest(text,text),aifrogi_security.record_handover(text,text,text,text,text),aifrogi_security.append_handover_event(text,text,"HandoverState",int,text,text,text,text) TO aifrogi_web;
GRANT EXECUTE ON FUNCTION aifrogi_security.eligible_public_claims(text,bigint) TO aifrogi_public;
GRANT EXECUTE ON FUNCTION aifrogi_security.claim_job(text,text,int),aifrogi_security.renew_job(text,text,text,bigint,int),aifrogi_security.reclaim_job(text,text,text,int),aifrogi_security.finalize_capture(text,text,text,bigint,bigint,text,text,text,text,jsonb,text) TO aifrogi_worker;
GRANT EXECUTE ON FUNCTION aifrogi_security.seal_claim_revision(text,text,text,text),aifrogi_security.seal_publication(text,text,text,bigint),aifrogi_security.advance_serving_pointer(text,"KnowledgeAudience",text,bigint,text),aifrogi_security.revoke_source(text,text,text,text,text) TO aifrogi_publisher;

-- The web role has no direct INSERT/UPDATE privilege on guest sessions. This
-- routine creates or extends only the caller-bound session for an existing
-- conversation in the same property; it can never reparent an existing hash.
CREATE OR REPLACE FUNCTION aifrogi_security.ensure_guest_session(p_property text,p_conversation text,p_session_hash text,p_expires_at timestamptz,p_actor text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE sid text;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],p_actor);
 IF aifrogi_security.current_session_hash() IS DISTINCT FROM p_session_hash THEN RAISE EXCEPTION 'GUEST_SESSION_HASH_MISMATCH'; END IF;
 IF p_expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'GUEST_SESSION_ALREADY_EXPIRED'; END IF;
 IF p_expires_at>clock_timestamp()+interval '24 hours' THEN RAISE EXCEPTION 'GUEST_SESSION_EXPIRY_TOO_LONG'; END IF;
 PERFORM 1 FROM public."Conversation" WHERE "propertyId"=p_property AND id=p_conversation FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'CONVERSATION_NOT_FOUND'; END IF;
 SELECT id INTO sid FROM public."KnowledgeGuestSession" WHERE "propertyId"=p_property AND "sessionHash"=p_session_hash FOR UPDATE;
 IF FOUND THEN
   IF NOT EXISTS (SELECT 1 FROM public."KnowledgeGuestSession" WHERE "propertyId"=p_property AND id=sid AND "conversationId"=p_conversation AND "revokedAt" IS NULL) THEN RAISE EXCEPTION 'GUEST_SESSION_REPARENT_FORBIDDEN'; END IF;
   UPDATE public."KnowledgeGuestSession" SET "expiresAt"=GREATEST("expiresAt",p_expires_at) WHERE "propertyId"=p_property AND id=sid;
   RETURN sid;
 END IF;
 sid:=gen_random_uuid()::text;
 INSERT INTO public."KnowledgeGuestSession"(id,"propertyId","conversationId","sessionHash","expiresAt","createdAt") VALUES(sid,p_property,p_conversation,p_session_hash,p_expires_at,clock_timestamp());
 RETURN sid;
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.ensure_guest_session(text,text,text,timestamptz,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.ensure_guest_session(text,text,text,timestamptz,text) TO aifrogi_web;

-- Narrow bootstrap resolvers required before an ordinary tenant RLS context
-- exists. They disclose only an organization identifier and never return a
-- customer, source, claim, conversation, answer or message row.
CREATE OR REPLACE FUNCTION aifrogi_security.resolve_public_bot_organization(requested_slug text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT p."organizationId" FROM public."Property" p JOIN public."Organization" o ON o.id=p."organizationId" JOIN public."BotProfile" b ON b."organizationId"=o.id
 WHERE p.slug=requested_slug AND b.status='LIVE' AND 'WEBSITE'=ANY(b.channels) LIMIT 1
$$;
CREATE OR REPLACE FUNCTION aifrogi_security.resolve_property_organization(requested_slug text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT p."organizationId" FROM public."Property" p WHERE p.slug=requested_slug AND p."organizationId" IS NOT NULL LIMIT 1
$$;
CREATE OR REPLACE FUNCTION aifrogi_security.resolve_session_organization(requested_session_id text,requested_email text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT s."organizationId" FROM public."UserSession" s WHERE s."sessionId"=requested_session_id AND lower(s.email)=lower(requested_email) AND s."revokedAt" IS NULL AND s."expiresAt">clock_timestamp() LIMIT 1
$$;
CREATE OR REPLACE FUNCTION aifrogi_security.resolve_member_organization(requested_email text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT m."organizationId" FROM public."OrganizationMember" m WHERE lower(m.email)=lower(requested_email) AND m.status='ACTIVE' ORDER BY m."createdAt" LIMIT 1
$$;
CREATE OR REPLACE FUNCTION aifrogi_security.is_session_active(requested_session_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT EXISTS(SELECT 1 FROM public."UserSession" s WHERE s."sessionId"=requested_session_id AND s."revokedAt" IS NULL AND s."expiresAt">clock_timestamp())
$$;
REVOKE ALL ON FUNCTION aifrogi_security.resolve_public_bot_organization(text),aifrogi_security.resolve_property_organization(text),aifrogi_security.resolve_session_organization(text,text),aifrogi_security.resolve_member_organization(text),aifrogi_security.is_session_active(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.current_organization_id(),aifrogi_security.has_platform_authority(),aifrogi_security.resolve_public_bot_organization(text),aifrogi_security.resolve_property_organization(text),aifrogi_security.resolve_session_organization(text,text),aifrogi_security.resolve_member_organization(text),aifrogi_security.is_session_active(text) TO leados_app;
-- *_unchecked, require_context, and assert_capture_authorized remain executable
-- only by the migration owner; runtime roles receive no grant.
