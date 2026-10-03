import {writeFileSync} from 'node:fs';
import {runSharedAnswer,evidenceDigest,type AnswerAdapters,type AnswerEvidence} from '../lib/shared-answer-engine';
const scope={organizationId:'fixture-org',propertyId:'fixture-tenant',generationId:'fixture-snapshot'};
const content='We build custom applications. Phone: +44 20 7946 0958';
const source:AnswerEvidence={...scope,id:'fixture-source',content,digest:evidenceDigest(content),title:'Applications',url:''};
function adapters():AnswerAdapters{return {state:async()=>({state:'READY',scope}),lexical:async()=>[source],semantic:async()=>[source],generate:async()=>({disposition:'ANSWER',sentences:[{text:'We build custom applications.',kind:'FACT',evidenceIds:[source.id]}],missingParts:[]}),verify:async()=>[{supported:true,evidenceIds:[source.id],reason:'Explicit'}],recheck:async()=>true};}
const cases:Array<{name:string,configure:(a:AnswerAdapters)=>void,expected:string}>=[
 {name:'Reranker unavailable',configure:a=>{a.rerank=async()=>{throw Error('RANKER_UNAVAILABLE')}},expected:'SUPPORTED'},
 {name:'Invalid reranker schema',configure:a=>{a.rerank=async()=>[]},expected:'SUPPORTED'},
 {name:'Embedding unavailable, lexical usable',configure:a=>{a.semantic=async()=>{throw Error('MODEL_HTTP_503')}},expected:'SUPPORTED'},
 {name:'Lexical unavailable, semantic usable',configure:a=>{a.lexical=async()=>{throw Error('SEARCH_UNAVAILABLE')}},expected:'SUPPORTED'},
 {name:'Both retrieval services unavailable',configure:a=>{a.lexical=a.semantic=async()=>{throw Error('SEARCH_UNAVAILABLE')}},expected:'ENGINE_FAILURE'},
 {name:'Generation unavailable, approved phone retained',configure:a=>{a.generate=async()=>{throw Error('MODEL_HTTP_503')}},expected:'ENGINE_FAILURE'},
 {name:'Verification unavailable, generated answer withheld',configure:a=>{a.verify=async()=>{throw Error('MODEL_HTTP_503')}},expected:'ENGINE_FAILURE'},
 {name:'Invalid verification schema',configure:a=>{a.verify=async()=>[]},expected:'ENGINE_FAILURE'},
 {name:'Other tenant passage returned',configure:a=>{a.lexical=async()=>[{...source,propertyId:'other-tenant'}]},expected:'AUTHORITY_DENIED'},
 {name:'Other organization passage returned',configure:a=>{a.semantic=async()=>[{...source,organizationId:'other-org'}]},expected:'AUTHORITY_DENIED'},
 {name:'Authority changed before delivery',configure:a=>{a.recheck=async()=>false},expected:'AUTHORITY_DENIED'},
 {name:'Missing requested fact with approved contact',configure:a=>{a.generate=async()=>({disposition:'NO_EVIDENCE',sentences:[],missingParts:['Delivery date']})},expected:'PARTIAL'},
 {name:'Equal-authority conflicting public field',configure:a=>{const other='Phone: +44 20 7946 0959';a.lexical=async()=>[{...source,fieldKey:'phone',entityKey:'business',authorityRank:1,valueHash:evidenceDigest(content)},{...source,id:'other-source',content:other,digest:evidenceDigest(other),fieldKey:'phone',entityKey:'business',authorityRank:1,valueHash:evidenceDigest(other)}];a.semantic=async()=>[]},expected:'SOURCE_CONFLICT'},
];
async function main(){
const results=[];
for(const c of cases){const a=adapters();c.configure(a);const r=await runSharedAnswer('Do you build custom applications?',a);const pass=r.coverage?.status===c.expected&& !r.answer.includes('other-tenant');results.push({name:c.name,expected:c.expected,pass,actualReply:r.answer,coverage:r.coverage,disposition:r.disposition,failureCode:r.failureCode,retrievedSourcePassages:r.retrievedEvidence,trace:r.trace,totalLatencyMs:r.totalMs});}
writeFileSync(process.argv[2]||'/tmp/aifrogi-answering234-faults.json',JSON.stringify({kind:'Isolated synthetic adapter failures; no production fault injection',results},null,2));
console.log(`${results.filter(r=>r.pass).length}/${results.length} passed`);if(results.some(r=>!r.pass))process.exitCode=1;

}
main().catch(error=>{console.error(error);process.exitCode=1;});
