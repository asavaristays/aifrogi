export type HybridCandidate={id:string;propertyId:string;releaseId:string;lexicalScore:number;embedding?:number[]};
const cosine=(a:number[],b:number[])=>{if(a.length!==b.length||!a.length)return 0;let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}return aa&&bb?dot/(Math.sqrt(aa)*Math.sqrt(bb)):0;};
export function deterministicSemanticVector(text:string,dimensions=64){const vector=Array.from({length:dimensions},()=>0);for(const token of text.toLowerCase().match(/[a-z0-9]+/g)??[]){let hash=2166136261;for(const char of token)hash=Math.imul(hash^char.charCodeAt(0),16777619);vector[(hash>>>0)%dimensions]++;}return vector;}
export function hybridRetrieve(input:{propertyId:string;releaseId:string;queryEmbedding:number[];candidates:HybridCandidate[];limit:number}) {
  const scoped=input.candidates.filter(item=>item.propertyId===input.propertyId&&item.releaseId===input.releaseId);
  const lexical=[...scoped].sort((a,b)=>b.lexicalScore-a.lexicalScore),semantic=[...scoped].sort((a,b)=>cosine(b.embedding??[],input.queryEmbedding)-cosine(a.embedding??[],input.queryEmbedding));
  const scores=new Map<string,number>(); lexical.forEach((item,index)=>scores.set(item.id,(scores.get(item.id)??0)+1/(60+index+1))); semantic.forEach((item,index)=>scores.set(item.id,(scores.get(item.id)??0)+1/(60+index+1)));
  return scoped.map(item=>({...item,hybridScore:scores.get(item.id)??0})).sort((a,b)=>b.hybridScore-a.hybridScore||a.id.localeCompare(b.id)).slice(0,Math.max(0,input.limit));
}
