import type {AnswerEvidence} from './shared-answer-engine';
const generic=new Set(['project','case','study','client','customer','story','platform','system','intelligence','product','the','and','for','mobile','app','apps','application','applications','development']);
function terms(value:string){return [...new Set((value.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(t=>t.length>2&&!generic.has(t)))];}
/** Derived subject metadata never rewrites approved source bytes. Named cases
 * cannot establish the general offering; general offerings cannot establish
 * implementation facts about a named case. */
export function selectEvidenceForSubject(question:string,units:AnswerEvidence[]){
 const query=new Set(terms(question));
 const candidates=units.map(unit=>{
  const named=unit.title.match(/\b(?:Project|Case Study|Client Story|Customer Story)\s+([^|—\n]+)/)?.[1];
  const subject=named||(unit.entityKey&&unit.entityKey!=='business'?unit.entityKey:null);
  return {unit,subject,matches:subject?terms(subject).some(term=>query.has(term)):false};
 });
 const namedRequest=candidates.some(c=>c.subject&&c.matches);
 return candidates.filter(c=>namedRequest?c.matches:!c.subject).map(c=>c.unit);
}
