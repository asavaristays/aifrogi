export type AnswerCoverage={status:'SUPPORTED'|'PARTIAL'|'MISSING_INFORMATION'|'SOURCE_CONFLICT'|'LIVE_REQUIRED'|'ENGINE_FAILURE'|'AUTHORITY_DENIED';missingParts:string[];failureCode:string|null};
/** Machine-readable diagnostics, not guessed content or a second answer pipeline. */
export function classifyAnswerCoverage(disposition:string,missingParts:string[],failureCode:string|null,outcomes:string[]):AnswerCoverage {
  if(failureCode && /SCOPE|AUTHORI|DENIED|CONTEXT|ROLE|PERMISSION|DIGEST|ORIGIN/.test(failureCode))return {status:'AUTHORITY_DENIED',missingParts:[],failureCode};
  if(failureCode==='NO_ACTIVE_SOURCE')return {status:'MISSING_INFORMATION',missingParts:['Published business information'],failureCode};
  if(disposition==='NO_EVIDENCE' && outcomes.includes('DEGRADED'))return {status:'ENGINE_FAILURE',missingParts:[],failureCode:'RETRIEVAL_PARTIALLY_UNAVAILABLE'};
  if(failureCode || disposition==='TECHNICAL_FAILURE' || outcomes.some(x=>x.startsWith('RECOVERED_FROM_')))return {status:'ENGINE_FAILURE',missingParts:[],failureCode:failureCode||outcomes.find(x=>x.startsWith('RECOVERED_FROM_'))?.slice('RECOVERED_FROM_'.length)||'ANSWER_ENGINE_FAILED'};
  if(outcomes.includes('CONFLICT'))return {status:'SOURCE_CONFLICT',missingParts:[...missingParts],failureCode:null};
  if(disposition==='LIVE_ACTION_REQUIRED')return {status:'LIVE_REQUIRED',missingParts:[...missingParts],failureCode:null};
  return {status:disposition==='ANSWER'?'SUPPORTED':disposition==='PARTIAL'?'PARTIAL':'MISSING_INFORMATION',missingParts:[...missingParts],failureCode:null};
}
