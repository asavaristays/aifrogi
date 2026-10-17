import {getDb} from '../db';
import {withTenantPropertyDatabaseContext} from '../security/tenant-database-context';
import {answerFromSharedKnowledge} from '../shared-answer-runtime';
export async function ownerAnswerPreview(input:{organizationId:string;propertyId:string;actor:string},question:string){
 const rows=await withTenantPropertyDatabaseContext(input,()=>getDb()!.$queryRaw<Array<{principal:string}>>`SELECT aifrogi_security.provision_owner_answer_preview(${input.propertyId},${input.actor}) AS principal`);
 if(rows.length!==1||!rows[0].principal.startsWith(`owner-preview:${input.propertyId}:`))throw Error('OWNER_PREVIEW_PRINCIPAL_INVALID');
 return answerFromSharedKnowledge({organizationId:input.organizationId,propertyId:input.propertyId,principal:rows[0].principal,purpose:'PUBLIC_ANSWER'},question);
}
