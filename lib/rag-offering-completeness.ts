import {currentQuestion} from './public-business-facts';
import type {AnswerDraft,AnswerEvidence} from './shared-answer-engine';
const stop=new Set(['about','what','which','tell','does','offer','offers','your','with','from','provide','provides','commercial','information','approved','can','you','me','we','do','in','is','of','to','the']);
/** Preserve a published offering's opening inventory when a general description
 * drops one of its deliverable nouns. This uses source text, not stored answers. */
export function preserveOfferingInventory(question:string,draft:AnswerDraft,evidence:AnswerEvidence[]){
 const q=currentQuestion(question);
 if(!/\b(?:about|offer|offers|provide|provides)\b/i.test(q))return;
 const query=(q.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(t=>t.length>=2&&!stop.has(t));
 const answer=draft.sentences.map(s=>s.text).join(' ').toLowerCase();
 for(const unit of evidence){
  const title=unit.title.toLowerCase();
  if(query.filter(t=>title.includes(t)).length<2)continue;
  const opening=unit.content.split(/[\n]/)[0].trim();
  const match=opening.match(/^(?:we\s+)?(create|offer|provide|deliver|build|develop)\s+([^.!?]{10,280})[.!?]?$/i);
  if(!match)continue;
  const inventory=match[2].split(/\s+(?:in|for|with|using)\s+/i)[0].split(/,|\s+and\s+/i).map(part=>part.trim().match(/[a-z]+$/i)?.[0]?.toLowerCase()).filter((t):t is string=>Boolean(t));
  if(inventory.length<2||inventory.every(t=>new RegExp(`\\b${t}\\b`,'i').test(answer)))continue;
  const sentence=`We ${match[1].toLowerCase()} ${match[2].replace(/[.]+$/,'')}.`;
  draft.sentences.unshift({text:sentence,kind:'FACT',evidenceIds:[unit.id]});
  return;
 }
}
