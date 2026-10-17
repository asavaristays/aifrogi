/** Safe internal diagnostics: never retain provider bodies, messages or credentials. */
export type AnswerFailure = {code:string;layer:'PROVIDER'|'TEST_TRANSPORT'|'AUTHORITY'|'PROOF'|'APPLICATION';stage:string;httpStatus?:number;timedOut?:boolean;requestId?:string};
export class ModelRequestFailure extends Error {
 readonly diagnostic:Omit<AnswerFailure,'stage'>;
 constructor(code:string,details:{layer?:'PROVIDER'|'TEST_TRANSPORT';httpStatus?:number;timedOut?:boolean;requestId?:string}={}) {
  super(code);this.name='ModelRequestFailure';
  this.diagnostic={code,layer:details.layer??'PROVIDER',...(Number.isInteger(details.httpStatus)?{httpStatus:details.httpStatus}:{}),...(details.timedOut?{timedOut:true}:{}),...(/^req_[a-zA-Z0-9_-]{1,100}$/.test(details.requestId??'')?{requestId:details.requestId}:{})};
 }
}
export function answerFailure(error:unknown,stage:string):AnswerFailure {
 if(error instanceof ModelRequestFailure)return {...error.diagnostic,stage};
 const code=error instanceof Error&&/^[A-Z][A-Z0-9_]{0,95}$/.test(error.message)?error.message:`${stage}_FAILED`;
 const layer=/SCOPE|DIGEST|ORIGIN|AUTHORI|DENIED|CONTEXT|ROLE|PERMISSION/.test(code)?'AUTHORITY':/MODEL|EMBEDDING/.test(code)?'PROVIDER':/DRAFT|SUPPORT|PROOF/.test(code)?'PROOF':'APPLICATION';
 return {code,layer,stage};
}
export function modelTransportFailure(error:unknown):ModelRequestFailure {
 if(error instanceof ModelRequestFailure)return error;
 const timedOut=error instanceof Error&&['AbortError','TimeoutError'].includes(error.name);
 return new ModelRequestFailure(timedOut?'MODEL_TIMEOUT':'MODEL_TRANSPORT_ERROR',{timedOut});
}
