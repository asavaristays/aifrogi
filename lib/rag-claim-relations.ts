/** Conservative guards for relations that a model must not strengthen.
 * These inspect the cited source text; they do not supply an answer. */
export function unsupportedClaimRelation(claim:string,passages:string[]):string|null {
 const source=passages.join('\n');
 if(/\bwill\b/i.test(claim)&&/\b(?:can|may|should)\b/i.test(source)&&! /\b(?:will|shall|must|always|never)\b/i.test(source))return 'The requested unconditional commitment';
 const tokens=(text:string)=>new Set((text.toLowerCase().match(/[a-z]{4,}/g)??[]).filter(word=>!['that','with','from','only','after','under','where','have','they','their','this','will','shall','must','should','would','could','business'].includes(word)).map(word=>word.replace(/(?:ing|ed|s)$/,'')));
 const claimTokens=tokens(claim);
 if(!/\b(?:can|may|should|could|subject to|where required)\b/i.test(claim)){
  const clauses=passages.flatMap(p=>p.split(/[\n.!?;]/));
  if(clauses.some(clause=>/\bshould\b/i.test(clause)&&[...tokens(clause)].filter(word=>claimTokens.has(word)).length>=3))return 'The requested unconditional commitment';
 }
 const quantities=claim.match(/\b\d+(?:\.\d+)?\b/g)??[];
 if(!quantities.length)return null;
 const units=[...claim.matchAll(/\b(?:per|each|every|one|single)\s+([a-z]+)\b/gi)].map(m=>m[1].toLowerCase()).filter(word=>!['of','or','and','the','another','more'].includes(word));
 const clauses=passages.flatMap(p=>p.split(/[\n.!?;]/)).map(p=>p.toLowerCase());
 for(const unit of units){
  // The unit and numeric value must occur in the same source statement.
  // A capability paragraph plus an unrelated package count is insufficient.
  if(quantities.some(value=>!clauses.some(clause=>new RegExp(`\\b${unit.replace(/s$/,'')}s?\\b`).test(clause)&&new RegExp(`\\b${value.replace('.','\\.')}\\b`).test(clause))))return 'The requested per-unit quantity';
 }
 return null;
}

/** A rejected optional claim is not automatically an unanswered user request. */
export function requestedClaimRelation(question:string,relation:string):boolean {
 const current=question.split(/(?:CURRENT visitor question:|Follow-up question:)\s*/i).at(-1)||question;
 if(relation==='The requested per-unit quantity')return /\b(?:how many|how much|per|each|every|one|single)\b/i.test(current);
 if(relation==='The requested unconditional commitment')return /\b(?:will|would|promise|guarantee|always|never|policy|share|sharing|disclose|disclosure|confidentiality)\b/i.test(current);
 return false;
}
