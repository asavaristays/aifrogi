const vocabulary=['address','phone','telephone','email','training','filmmaking','software','applications','mobile','refund','support','contact','location','hours'];
function distance(a:string,b:string) {
 const d=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i===0?j:j===0?i:0));
 for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++) {
  d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]) d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
 }
 return d[a.length][b.length];
}
/** Correct a unique close vocabulary match; preserve URLs, emails and mixed-case brands. */
export function normalizeRagQuestion(value:string) {
 return value.normalize('NFKC').replace(/https?:\/\/[^\s]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|[A-Za-z]{4,}/gi,word=>{
  if(word.includes('://')||word.includes('@')||/[a-z][A-Z]/.test(word))return word;
  const lower=word.toLowerCase();if(vocabulary.includes(lower)) return word;
  const matches=vocabulary.filter(candidate=>Math.abs(candidate.length-lower.length)<=1&&distance(candidate,lower)<=1);
  return matches.length===1?matches[0]:word;
 });
}
