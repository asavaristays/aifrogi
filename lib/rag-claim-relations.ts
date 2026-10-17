/** Conservative guards for relations that a model must not strengthen.
 * These inspect the cited source text; they do not supply an answer. */
export function unsupportedClaimRelation(claim:string,passages:string[]):string|null {
 const source=passages.join('\n');
 if(/\bwill\b/i.test(claim)&&/\b(?:can|may|should)\b/i.test(source)&&! /\b(?:will|shall|must|always|never)\b/i.test(source))return 'The requested unconditional commitment';
 const tokens=(text:string)=>new Set((text.toLowerCase().match(/[a-z]{4,}/g)??[]).filter(word=>!['that','with','from','only','after','under','where','have','they','their','this','will','shall','must','should','would','could','business'].includes(word)).map(word=>word.replace(/(?:ing|ed|s)$/,'')));
 const claimTokens=tokens(claim);
 if(!/\b(?:can|may|should|could|subject to|where required)\b/i.test(claim)){
  const clauses=passages.flatMap(p=>p.split(/[\n.!?;]/));
  if(clauses.some(clause=>{const words=[...tokens(clause)];return /\bshould\b/i.test(clause)&&words.filter(word=>claimTokens.has(word)).length>=Math.max(3,Math.ceil(words.length*0.6));}))return 'The requested unconditional commitment';
 }
 const quantities=claim.match(/\b\d+(?:\.\d+)?\b/g)??[];
 if(!quantities.length)return null;
 // Values joined in prose still retain separate source labels. Restrict this
 // check to explicitly measured durations; arbitrary package counts are not
 // assumed to be durations or production yields.
 const measured=/\b(\d+(?:\s*(?:,|and|or|\/)\s*\d+)*)[ -]*(seconds?|minutes?|hours?|days?|weeks?|months?)\b/gi;
 for(const match of claim.matchAll(measured)) {
  const after=claim.slice(match.index!+match[0].length).match(/^[ -]*((?:[a-z]+[ -]+){0,3}[a-z]+)/i)?.[1]||'';
  const before=claim.slice(Math.max(0,match.index!-65),match.index).match(/([a-z]+(?:[ -]+[a-z]+){0,3})\s+(?:of|lasting|for)\s*$/i)?.[1]||'';
  const words=(text:string)=>text.toLowerCase().split(/[ -]+/).filter(w=>w.length>2&&!['the','and','for','with','that','which','from','about','around','including'].includes(w)).map(w=>w.replace(/s$/,''));
  const claimLabel=words(after||before);
  if(!claimLabel.length)continue;
  const values=match[1].match(/\d+/g)||[];
  const sourceLines=passages.flatMap(p=>p.split(/[\n.!?;]/));
  for(const value of values) {
   const unit=match[2].replace(/s$/,'');
   const pattern=new RegExp(`\\b${value}[ -]*${unit}s?\\b`,'i');
   const matching=sourceLines.filter(line=>pattern.test(line));
   const sourceLabels=matching.map(line=>{
    const found=line.match(pattern)!;
    const suffix=line.slice(found.index!+found[0].length).trim();
    if(!suffix||/^(?:after|before|per|each|every|from|to|for|of|with|in|on|at)\b/i.test(suffix))return [];
    return words(suffix.split(/\b(?:for|with|using|that|which|provides|offers|includes|telling|lasting)\b/i)[0]).slice(0,3);
   }).filter(label=>label.length);
   if(sourceLabels.length && !sourceLabels.some(label=>after ? label.every((word,index)=>claimLabel[index]===word) : label.every(word=>claimLabel.includes(word))))return 'The requested value and format relationship';
  }
 }
 const units=[...claim.matchAll(/\b(?:per|each|every|one|single)\s+([a-z]+)\b/gi)].map(m=>m[1].toLowerCase()).filter(word=>!['of','or','and','the','another','more'].includes(word));
 const clauses=passages.flatMap(p=>p.split(/[\n.!?;]/)).map(p=>p.toLowerCase());
 for(const unit of units){
  // The unit and numeric value must occur in the same source statement.
  // A capability paragraph plus an unrelated package count is insufficient.
  if(quantities.some(value=>!clauses.some(clause=>new RegExp(`\\b${unit.replace(/s$/,'')}s?\\b`).test(clause)&&new RegExp(`\\b${value.replace('.','\\.')}\\b`).test(clause))))return 'The requested per-unit quantity';
 }
 return null;
}

/** Exact supporting spans, unlike complete paragraphs, must retain their
 * capability/advice modality when paraphrased as a business assertion. */
export function strengthensSourceSpan(claim:string,spans:string[]):boolean {
 if(/\b(?:can|may|should|could|subject to|where required)\b/i.test(claim))return false;
 const tokens=(s:string)=>new Set((s.toLowerCase().match(/[a-z]{3,}/g)||[]).filter(w=>!['with','from','that','this','under','after','only','where','have','they','their','should','could'].includes(w)).map(w=>w.replace(/(?:ing|ed|s)$/,'')));
 const claimed=tokens(claim);
 return spans.some(span=>/\b(?:can|may|should|could)\b/i.test(span)&&[...tokens(span)].filter(w=>claimed.has(w)).length>=2);
}

/** A rejected optional claim is not automatically an unanswered user request. */
export function requestedClaimRelation(question:string,relation:string):boolean {
 const current=question.split(/(?:CURRENT visitor question:|Follow-up question:)\s*/i).at(-1)||question;
 if(relation==='The requested per-unit quantity')return /\b(?:how many|how much|per|each|every|one|single)\b/i.test(current);
 if(relation==='The requested unconditional commitment')return /\b(?:will|would|promise|guarantee|always|never|policy|share|sharing|disclose|disclosure|confidentiality)\b/i.test(current);
 return false;
}
