/** Recover an over-specific numeric denial using one short, exact approved
 * passage. The normal semantic support review must verify the replacement. */
export function sourceBoundNumericLimitation(claim:string,question:string,passages:string[]):string|null {
 if(passages.length!==1||! /\b(?:not|never|no|cannot|can't|doesn't|don't)\b/i.test(claim))return null;
 const source=passages[0].trim();
 if(! /\b(?:not|never|no|cannot|can't|doesn't|don't)\b/i.test(source)||source.split(/\s+/).length>60)return null;
 const numbers=(s:string)=>s.match(/\d[\d,.]*(?:\s*%)?/g)?.map(n=>n.replace(/[\s,]/g,''))??[];
 if(!numbers(claim).some(n=>!numbers(source).includes(n)))return null;
 const stop=new Set(['this','that','your','with','from','will','does','have','what','which','they','their','would','could','should','about','after','before','please','business']);
 const words=(s:string)=>new Set((s.toLowerCase().match(/[a-z]{4,}/g)??[]).filter(w=>!stop.has(w)).map(w=>w.replace(/s$/,'')));
 const sourceWords=words(source),claimWords=words(claim),queryWords=words(question);
 if([...claimWords].filter(w=>sourceWords.has(w)).length<3||[...queryWords].filter(w=>sourceWords.has(w)).length<2)return null;
 return source;
}
