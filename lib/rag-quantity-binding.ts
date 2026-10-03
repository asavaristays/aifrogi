/** Conservative numeric-label check supplementing model entailment review. */
export function quantityAlternativesSupported(claim:string, sources:string[]):boolean {
 const normalized=(text:string)=>text.toLowerCase().replace(/[-–]/g,' ').replace(/\s+/g,' ');
 const labels=(text:string)=>text.split(/\b(?:and|or|for|with|that|which)\b/)[0].match(/[a-z]+/g)?.filter(w=>!['a','an','the','ai'].includes(w)).slice(0,3).map(w=>w.replace(/s$/,''))??[];
 const groups=normalized(claim).matchAll(/\b(\d+)\s*(?:or|\/)\s*(\d+)\s+(seconds?|minutes?|hours?|days?|nights?|weeks?|months?|years?)\s+([a-z ]+)/g);
 for(const group of groups){
  const label=labels(group[4]);if(!label.length)return false;
  const unit=group[3].replace(/s$/,'');
  for(const number of [group[1],group[2]]){
   const pattern=new RegExp(`\\b${number}\\s+${unit}s?\\s+([a-z ]+)`,'g');
   const supported=sources.some(source=>Array.from(normalized(source).matchAll(pattern)).some(match=>label.some(word=>labels(match[1]).includes(word))));
   if(!supported)return false;
  }
 }
 return true;
}
