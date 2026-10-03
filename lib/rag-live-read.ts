import {getDb} from './db';
import {decryptSecretValue} from './field-encryption';
import {parseConnectorApiConfiguration,type ConnectorOperationMapping} from './connector-api-control';
import {currentQuestion} from './public-business-facts';
import {evidenceDigest,type AnswerEvidence,type AnswerScope} from './shared-answer-engine';

export const liveRagRequest=(question:string)=>/\b(?:in stock|stock levels?|current availability|available (?:now|today)|live price)\b/i.test(currentQuestion(question));
export type PublicCatalogRecord={name:string;sku:string;stock:number;price?:number;currency?:string};
export function validatePublicCatalog(payload:unknown,now=Date.now()):{checkedAt:string;products:PublicCatalogRecord[]} {
  const p=payload as {success?:boolean;data?:{checkedAt?:string;products?:PublicCatalogRecord[]}};
  const checked=p?.data?.checkedAt;
  if(!p?.success||!checked||!Number.isFinite(Date.parse(checked))||Date.parse(checked)>now+5000||now-Date.parse(checked)>30000||!Array.isArray(p.data?.products)||p.data.products.length>100) throw new Error('LIVE_RESULT_INVALID');
  const products=p.data.products.map(r=>{
    if(!r||typeof r.name!=='string'||!r.name.trim()||r.name.length>200||typeof r.sku!=='string'||r.sku.length>80||!Number.isInteger(r.stock)||r.stock<0||r.price!==undefined&&(!Number.isFinite(r.price)||r.price<0)||r.currency!==undefined&&!/^[A-Z]{3}$/.test(r.currency)) throw new Error('LIVE_RESULT_INVALID');
    return {name:r.name,sku:r.sku,stock:r.stock,...(r.price!==undefined?{price:r.price}:{}),...(r.currency?{currency:r.currency}:{})};
  });
  return {checkedAt:checked,products};
}
/** Read-only public catalog. Private orders and material actions never enter this adapter. */
export async function readPublicRagCatalog(scope:AnswerScope,question:string,transport:typeof fetch=fetch):Promise<AnswerEvidence[]|null> {
  if(!liveRagRequest(question)) return null;
  const db=getDb();if(!db) throw new Error('DATABASE_UNAVAILABLE');
  const property=await db.property.findFirst({where:{id:scope.propertyId,organizationId:scope.organizationId},select:{id:true}});
  if(!property) throw new Error('LIVE_SCOPE_MISMATCH');
  const config=await db.botConnectorConfiguration.findFirst({where:{organizationId:scope.organizationId,enabled:true,lifecycle:{in:['LIVE','MONITORED']},readOperations:{has:'PUBLIC_CATALOG'}},include:{credential:true}});
  if(!config || config.lastHealthStatus!=='HEALTHY') return [];
  if(config.authType!=='NONE' && (!config.credential||config.credential.revokedAt||config.credential.expiresAt && config.credential.expiresAt.getTime()<=Date.now())) return [];
  const parsed=parseConnectorApiConfiguration({apiBaseUrl:config.apiBaseUrl,authType:config.authType,operationMapping:config.operationMapping as ConnectorOperationMapping});
  if(!parsed.operationMapping.catalog) return [];
  const url=new URL(parsed.operationMapping.catalog,`${parsed.apiBaseUrl}/`);
  if(url.origin!==new URL(parsed.apiBaseUrl).origin) throw new Error('LIVE_ORIGIN_MISMATCH');
  url.searchParams.set('query',currentQuestion(question).slice(0,500));
  const headers:Record<string,string>={Accept:'application/json'};
  const secret=decryptSecretValue(config.credential?.secretEncrypted);
  if(parsed.authType!=='NONE'&&!secret) return [];
  if(parsed.authType==='BEARER') headers.Authorization=`Bearer ${secret}`;
  if(parsed.authType==='API_KEY') headers['X-API-Key']=secret!;
  const response=await transport(url,{method:'GET',headers,redirect:'error',cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!response.ok) throw new Error('LIVE_READ_UNAVAILABLE');
  const value=validatePublicCatalog(await response.json());
  const version=evidenceDigest([config.id,config.updatedAt.getTime(),config.credential?.keyVersion??0].join(':'));
  // Send only the explicitly public typed projection to the model, never the raw payload.
  const content=JSON.stringify(value);
  return [{...scope,id:`live:${config.id}:${evidenceDigest(content)}`,sourceKind:'LIVE',sourceId:config.id,sourceVersion:version,content,digest:evidenceDigest(content),url:'',title:'Current authorised public product catalog',effectiveUntil:new Date(Date.parse(value.checkedAt)+30000).toISOString(),liveOperation:'PUBLIC_CATALOG',checkedAt:value.checkedAt}];
}
